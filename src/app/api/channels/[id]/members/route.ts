import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

interface ChannelMemberWithDetails {
  id: string;
  channel_id: string;
  user_email: string;
  joined_at: string;
  last_read_at: string;
  name?: string;
  company?: string;
  avatar_url?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const members = await sql`
      SELECT cm.*, lp.name, lp.company, lp.avatar_url
      FROM channel_members cm
      LEFT JOIN limited_partners lp ON lp.email = cm.user_email
      WHERE cm.channel_id = ${id}
      ORDER BY cm.joined_at ASC
    `;

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching channel members:', error);
    return NextResponse.json({ error: 'Failed to fetch channel members' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user_email } = body;

    if (!user_email) {
      return NextResponse.json({ error: 'user_email is required' }, { status: 400 });
    }

    const [member] = await sql`
      INSERT INTO channel_members (channel_id, user_email)
      VALUES (${id}, ${user_email})
      ON CONFLICT (channel_id, user_email) DO NOTHING
      RETURNING *
    `;

    return NextResponse.json(member || { message: 'User already a member' });
  } catch (error) {
    console.error('Error adding channel member:', error);
    return NextResponse.json({ error: 'Failed to add channel member' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const user_email = searchParams.get('user_email');

    if (!user_email) {
      return NextResponse.json({ error: 'user_email is required' }, { status: 400 });
    }

    await sql`
      DELETE FROM channel_members
      WHERE channel_id = ${id} AND user_email = ${user_email}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing channel member:', error);
    return NextResponse.json({ error: 'Failed to remove channel member' }, { status: 500 });
  }
}