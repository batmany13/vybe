import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function GET() {
  try {
    // Get all channels with member count and last message
    const channels = await sql`
      SELECT 
        c.*,
        COUNT(DISTINCT cm.id) as member_count,
        (
          SELECT json_build_object(
            'id', m.id,
            'content', m.content,
            'user_name', m.user_name,
            'created_at', m.created_at
          )
          FROM messages m
          WHERE m.channel_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message
      FROM channels c
      LEFT JOIN channel_members cm ON cm.channel_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at ASC
    `;
    
    return NextResponse.json(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, is_private = false, created_by } = body;

    if (!name || !created_by) {
      return NextResponse.json({ error: 'Name and created_by are required' }, { status: 400 });
    }

    // Create channel
    const [channel] = await sql`
      INSERT INTO channels (name, description, is_private, created_by)
      VALUES (${name}, ${description}, ${is_private}, ${created_by})
      RETURNING *
    `;

    // Auto-join creator to the channel
    await sql`
      INSERT INTO channel_members (channel_id, user_email)
      VALUES (${channel.id}, ${created_by})
    `;

    return NextResponse.json(channel);
  } catch (error) {
    console.error('Error creating channel:', error);
    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
  }
}