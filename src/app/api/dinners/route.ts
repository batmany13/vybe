import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function GET(request: NextRequest) {
  try {
    const rows = await sql`
      SELECT 
        id, 
        title, 
        starts_at, 
        city, 
        location, 
        google_calendar_event_id,
        google_calendar_sync_status,
        google_calendar_last_synced_at,
        google_calendar_attendees_data,
        created_at, 
        updated_at 
      FROM dinners 
      ORDER BY starts_at ASC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching dinners:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const title = typeof data.title === 'string' ? data.title.trim() : '';
    const starts_at = typeof data.starts_at === 'string' ? data.starts_at : '';
    const city = data.city ? String(data.city).trim() : null;
    const location = data.location ? String(data.location).trim() : null;

    if (!title || !starts_at) {
      return NextResponse.json({ error: 'title and starts_at are required' }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO dinners (title, starts_at, city, location)
      VALUES (${title}, ${starts_at}, ${city}, ${location})
      RETURNING id, title, starts_at, city, location, created_at, updated_at
    `;

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating dinner:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
