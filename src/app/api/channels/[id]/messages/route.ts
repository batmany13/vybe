import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before');

    let messages;

    if (before) {
      messages = await sql`
        SELECT * FROM messages
        WHERE channel_id = ${id} AND created_at < ${before}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } else {
      messages = await sql`
        SELECT * FROM messages
        WHERE channel_id = ${id}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    }

    // Return messages in chronological order
    return NextResponse.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user_email, user_name, content } = body;

    if (!user_email || !user_name || !content) {
      return NextResponse.json({ error: 'user_email, user_name, and content are required' }, { status: 400 });
    }

    const [message] = await sql`
      INSERT INTO messages (channel_id, user_email, user_name, content)
      VALUES (${id}, ${user_email}, ${user_name}, ${content})
      RETURNING *
    `;

    // Update last_read_at for the sender
    await sql`
      UPDATE channel_members
      SET last_read_at = CURRENT_TIMESTAMP
      WHERE channel_id = ${id} AND user_email = ${user_email}
    `;

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: channelId } = await params;
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const userEmail = searchParams.get('userEmail');

    if (!messageId || !userEmail) {
      return NextResponse.json({ error: 'messageId and userEmail are required' }, { status: 400 });
    }

    // Verify the message belongs to the user before deleting
    const [message] = await sql`
      SELECT * FROM messages 
      WHERE id = ${messageId} 
      AND channel_id = ${channelId} 
      AND user_email = ${userEmail}
    `;

    if (!message) {
      return NextResponse.json({ error: 'Message not found or you do not have permission to delete it' }, { status: 404 });
    }

    // Delete the message
    await sql`
      DELETE FROM messages 
      WHERE id = ${messageId} 
      AND channel_id = ${channelId} 
      AND user_email = ${userEmail}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}