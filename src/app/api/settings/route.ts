import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import { getRestaurantSettings, saveRestaurantSettings } from '@/lib/booking-kv';

export async function GET(request: Request) {
  try {
    if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const settings = await getRestaurantSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    await saveRestaurantSettings(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
