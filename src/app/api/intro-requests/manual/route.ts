import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { lp_id, deal_id, message } = data;

    if (!lp_id || !deal_id) {
      return NextResponse.json({ error: 'LP and Deal are required' }, { status: 400 });
    }

    // First check if there's already a vote for this LP-Deal combination
    const existingVote = await sql`
      SELECT id FROM votes WHERE lp_id = ${lp_id} AND deal_id = ${deal_id}
    `;

    let voteId;
    
    if (existingVote.length > 0) {
      // Use existing vote
      voteId = existingVote[0].id;
    } else {
      // Create a placeholder vote for tracking this manual introduction
      const newVote = await sql`
        INSERT INTO votes (
          id, deal_id, lp_id, conviction_level, 
          comments, created_at, updated_at
        ) VALUES (
          ${randomUUID()}, ${deal_id}, ${lp_id}, 3, 
          'Manual introduction request created', NOW(), NOW()
        )
        RETURNING id
      `;
      voteId = newVote[0].id;
    }

    // Create the introduction request
    await sql`
      INSERT INTO introduction_requests (vote_id, status, intro_message, created_at)
      VALUES (${voteId}, 'pending', ${message || null}, NOW())
      ON CONFLICT (vote_id) 
      DO UPDATE SET 
        status = 'pending',
        intro_message = ${message || null},
        updated_at = NOW()
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Manual introduction request created successfully',
      vote_id: voteId 
    });
  } catch (error) {
    console.error('Error creating manual introduction request:', error);
    return NextResponse.json({ error: 'Failed to create introduction request' }, { status: 500 });
  }
}