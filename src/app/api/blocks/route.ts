import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import { getBlockedCapacities, saveBlockedCapacities } from '@/lib/booking-kv';

export async function GET(request: Request) {
  try {
    if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    if (!date) return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    
    const blocks = await getBlockedCapacities(date);
    return NextResponse.json({ success: true, blocks });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { date, blocks } = body;
    await saveBlockedCapacities(date, blocks);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
