import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function GET() {
  try {
    const result = await sql`
      SELECT 
        dr.*,
        d.company_name,
        d.founder_name,
        d.deal_size,
        COUNT(v.id) as vote_count
      FROM decision_requests dr
      JOIN deals d ON dr.deal_id = d.id
      LEFT JOIN votes v ON dr.deal_id = v.deal_id
      GROUP BY dr.id, d.company_name, d.founder_name, d.deal_size
      ORDER BY dr.created_at DESC
    `;
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching decision requests:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const result = await sql`
      INSERT INTO decision_requests (
        deal_id, title, description, voting_deadline, status, required_votes, created_by
      ) VALUES (
        ${data.deal_id}, ${data.title}, ${data.description}, 
        ${data.voting_deadline}, ${data.status || 'pending'}, 
        ${data.required_votes || null}, ${data.created_by}
      )
      RETURNING *
    `;
    
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating decision request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}