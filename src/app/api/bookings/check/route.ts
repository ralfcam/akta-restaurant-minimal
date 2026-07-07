import { NextResponse } from 'next/server';
import { calculateAvailability } from '@/lib/availability';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const guests = searchParams.get('guests');

    if (!date || !guests) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const partySize = parseInt(guests, 10);
    const availability = await calculateAvailability(date, 'Dinner', partySize);

    return NextResponse.json({ 
      success: true, 
      availability
    });

  } catch (error) {
    console.error('Capacity check error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
