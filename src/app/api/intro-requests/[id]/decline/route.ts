import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: voteId } = await params;

    // Check if an introduction request record exists
    const existing = await sql`
      SELECT * FROM introduction_requests WHERE vote_id = ${voteId}
    `;

    if (existing.length === 0) {
      // Create a new introduction request record with declined status
      await sql`
        INSERT INTO introduction_requests (vote_id, status, declined_at)
        VALUES (${voteId}, 'declined', NOW())
      `;
    } else {
      // Update existing record
      await sql`
        UPDATE introduction_requests 
        SET status = 'declined', declined_at = NOW()
        WHERE vote_id = ${voteId}
      `;
    }

    return NextResponse.json({ success: true, message: 'Request declined' });
  } catch (error) {
    console.error('Error declining introduction request:', error);
    return NextResponse.json({ error: 'Failed to decline request' }, { status: 500 });
  }
}