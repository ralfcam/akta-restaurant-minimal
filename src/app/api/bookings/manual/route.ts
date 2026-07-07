import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { verifyAdmin } from '@/lib/auth';
import { calculateAvailability } from '@/lib/availability';
import { getBookingsByDate, saveBookingsForDate } from '@/lib/booking-kv';
import { Reservation } from '@/lib/types/booking';

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const body = await request.json();
    const { name, email, phone, date, time, guests, notes, source } = body;

    const lockKey = `lock:booking:${date}`;
    let lockAcquired = false;
    
    for (let attempt = 0; attempt < 5; attempt++) {
      lockAcquired = (await kv.set(lockKey, 'locked', { nx: true, ex: 5 })) === 'OK';
      if (lockAcquired) break;
      await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100));
    }

    if (!lockAcquired) {
      return NextResponse.json({ error: 'Le serveur est très sollicité.' }, { status: 409 });
    }

    try {
      const availability = await calculateAvailability(date, 'Dinner', guests);
      
      const bookings = await getBookingsByDate(date);
      
      const newBooking: Reservation = {
        id: crypto.randomUUID(),
        client_name: name || 'Client',
        client_email: email || '',
        client_phone: phone || '',
        booking_date: date,
        booking_time: time,
        guests: guests,
        notes: notes || '',
        status: 'confirmed',
        source: source || 'admin',
        assigned_table_label: availability.suggestedTable?.label || 'MANUAL',
        assigned_table_capacity: availability.suggestedTable?.capacity || guests,
        created_at: new Date().toISOString()
      };

      bookings.push(newBooking);
      await saveBookingsForDate(date, bookings);

      return NextResponse.json({ success: true, booking: newBooking });
    } finally {
      await kv.del(lockKey);
    }

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
