import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
      WHERE id = ${id}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching dinner:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const rows = await sql`
      UPDATE dinners 
      SET 
        title = ${data.title === undefined ? sql`title` : data.title},
        starts_at = ${data.starts_at === undefined ? sql`starts_at` : data.starts_at},
        city = ${data.city === undefined ? sql`city` : data.city},
        location = ${data.location === undefined ? sql`location` : data.location},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating dinner:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const rows = await sql`
      DELETE FROM dinners 
      WHERE id = ${id}
      RETURNING id
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dinner:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}