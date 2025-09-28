import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function POST(request: NextRequest) {
  try {
    const { dinnerId, googleCalendarEventId, attendeesData } = await request.json();

    if (!dinnerId || !googleCalendarEventId) {
      return NextResponse.json(
        { error: 'dinnerId and googleCalendarEventId are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    
    const result = await sql`
      UPDATE dinners 
      SET 
        google_calendar_event_id = ${googleCalendarEventId},
        google_calendar_sync_status = 'synced',
        google_calendar_last_synced_at = ${now},
        google_calendar_attendees_data = ${JSON.stringify(attendeesData)}
      WHERE id = ${dinnerId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Dinner not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error syncing dinner with calendar:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dinnerId = searchParams.get('dinnerId');

    if (!dinnerId) {
      return NextResponse.json({ error: 'dinnerId is required' }, { status: 400 });
    }

    const result = await sql`
      SELECT 
        id,
        title,
        google_calendar_event_id,
        google_calendar_sync_status,
        google_calendar_last_synced_at,
        google_calendar_attendees_data
      FROM dinners 
      WHERE id = ${dinnerId}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Dinner not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching dinner sync status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}