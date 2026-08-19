import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { verifyAdmin } from '@/lib/auth';
import { sendBookingConfirmationEmail, sendAdminNotificationEmail } from '@/lib/resend';
import { z } from 'zod';
import { calculateAvailability } from '@/lib/availability';
import { getBookingsByDate, saveBookingsForDate } from '@/lib/booking-kv';
import { Reservation } from '@/lib/types/booking';

const MAX_GUESTS_PER_BOOKING = 20;

const bookingSchema = z.object({
  name: z.string().min(2, "Nom invalide (min 2 caractères)").max(100),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().regex(/^[+0-9\s()-.]{5,20}$/, "Format de téléphone invalide"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Format d'heure invalide (HH:MM)"),
  guests: z.number().int().min(1, "Minimum 1 personne").max(MAX_GUESTS_PER_BOOKING, `Maximum ${MAX_GUESTS_PER_BOOKING} personnes`),
  notes: z.string().max(500, "Notes trop longues").optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = bookingSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues.map(e => e.message).join(', ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { name, email, phone, date, time, guests, notes } = result.data;

    // Rate Limiting
    try {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
      const rateLimitKey = `ratelimit:booking:${ip}`;
      const currentRequests = await kv.incr(rateLimitKey);
      if (currentRequests === 1) {
        await kv.expire(rateLimitKey, 60);
      }
      if (currentRequests > 5) {
        return NextResponse.json({ error: "Trop de tentatives de réservation. Veuillez patienter une minute." }, { status: 429 });
      }
    } catch (e) {
      console.warn("KV rate limit warning:", e);
    }

    // Date logic check
    const parts = date.split('-');
    const bookingDateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDateObj.getTime() < today.getTime()) {
      return NextResponse.json({ error: "La date de réservation ne peut pas être dans le passé." }, { status: 400 });
    }

    // Availability Check
    const availability = await calculateAvailability(date, 'Dinner', guests);
    if (!availability.isBookable) {
       return NextResponse.json({ error: availability.reason || "Pas de disponibilité." }, { status: 400 });
    }
    const requestedSlot = availability.slots?.find(s => s.time === time);
    if (!requestedSlot || !requestedSlot.available) {
      return NextResponse.json({ error: requestedSlot?.reason || "Créneau horaire non disponible." }, { status: 400 });
    }

    // Concurrency Lock
    const lockKey = `lock:booking:${date}`; 
    let lockAcquired = false;
    
    try {
      for (let attempt = 0; attempt < 5; attempt++) {
        lockAcquired = (await kv.set(lockKey, 'locked', { nx: true, ex: 5 })) === 'OK';
        if (lockAcquired) break;
        await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100));
      }
    } catch (e) {
      console.warn("KV lock warning:", e);
      lockAcquired = true;
    }

    if (!lockAcquired) {
      return NextResponse.json({ error: 'Le serveur est très sollicité. Veuillez réessayer.' }, { status: 409 });
    }

    try {
      // Re-check after lock
      const reCheck = await calculateAvailability(date, 'Dinner', guests);
      const reCheckSlot = reCheck.slots?.find(s => s.time === time);
      if (!reCheck.isBookable || !reCheck.suggestedTable || !reCheckSlot || !reCheckSlot.available) {
        return NextResponse.json({ error: "Désolé, ce créneau horaire ou la table ont été réservés entre-temps." }, { status: 400 });
      }

      const bookings = await getBookingsByDate(date);

      const status = reCheck.statusType === 'manual_approval' ? 'pending' : 'confirmed';

      const newBooking: Reservation = {
        id: crypto.randomUUID(),
        client_name: name,
        client_email: email,
        client_phone: phone,
        booking_date: date,
        booking_time: time,
        guests: guests,
        notes: notes || '',
        status: status,
        source: 'online',
        assigned_table_label: reCheck.suggestedTable.label,
        assigned_table_capacity: reCheck.suggestedTable.capacity,
        created_at: new Date().toISOString()
      };

      bookings.push(newBooking);
      await saveBookingsForDate(date, bookings);

      if (status === 'confirmed') {
        await Promise.allSettled([
           sendBookingConfirmationEmail(newBooking as any),
           sendAdminNotificationEmail(newBooking as any)
        ]);
      } else {
        await Promise.allSettled([
           sendAdminNotificationEmail(newBooking as any)
        ]);
      }

      return NextResponse.json({ success: true, booking: newBooking, statusType: reCheck.statusType });

    } finally {
      await kv.del(lockKey);
    }

  } catch (error: any) {
    console.error('Booking creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    let filteredBookings: Reservation[] = [];

    if (date) {
      filteredBookings = await getBookingsByDate(date);
    } else {
      const dates: string[] = (await kv.smembers('booking_dates')) || [];
      for (const d of dates) {
        const dayBookings = await getBookingsByDate(d);
        filteredBookings.push(...dayBookings);
      }
    }

    filteredBookings.sort((a, b) => {
      const dateCompare = a.booking_date.localeCompare(b.booking_date);
      if (dateCompare !== 0) return dateCompare;
      return a.booking_time.localeCompare(b.booking_time);
    });

    return NextResponse.json({ success: true, bookings: filteredBookings });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, date, action } = body;

    if (!id || !date || !action || !['approve', 'reject', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    const lockKey = `lock:booking:${date}`;
    let lockAcquired = false;

    for (let attempt = 0; attempt < 5; attempt++) {
      lockAcquired = (await kv.set(lockKey, 'locked', { nx: true, ex: 5 })) === 'OK';
      if (lockAcquired) break;
      await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100));
    }

    if (!lockAcquired) {
      return NextResponse.json({ error: 'Le serveur est très sollicité. Veuillez réessayer.' }, { status: 409 });
    }

    try {
      const bookings = await getBookingsByDate(date);

      const bookingIndex = bookings.findIndex(b => b.id === id);
      if (bookingIndex === -1) {
        return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
      }

      const booking = bookings[bookingIndex];

      if (action === 'approve') {
        const availability = await calculateAvailability(date, 'Dinner', booking.guests);
        if (!availability.isBookable || !availability.suggestedTable) {
           return NextResponse.json({ error: 'Capacité insuffisante pour approuver.' }, { status: 400 });
        }
        booking.status = 'confirmed';
        booking.assigned_table_label = availability.suggestedTable.label;
        booking.assigned_table_capacity = availability.suggestedTable.capacity;

        await sendBookingConfirmationEmail(booking as any);
      } else if (action === 'cancel') {
        booking.status = 'cancelled_by_restaurant';
      } else {
        booking.status = 'rejected';
      }

      bookings[bookingIndex] = booking;
      await saveBookingsForDate(date, bookings);

      return NextResponse.json({ success: true, booking });

      return NextResponse.json({ success: true, booking });
    } finally {
      await kv.del(lockKey);
    }

  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
