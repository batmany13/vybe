import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function GET() {
  try {
    const result = await sql`
      SELECT 
        c.*,
        CASE 
          WHEN c.deal_id IS NOT NULL THEN d.company_name
          ELSE null
        END as deal_company_name,
        CASE 
          WHEN c.lp_id IS NOT NULL THEN lp.name
          ELSE null
        END as lp_name
      FROM communications c
      LEFT JOIN deals d ON c.deal_id = d.id
      LEFT JOIN limited_partners lp ON c.lp_id = lp.id
      ORDER BY c.created_at DESC
    `;
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching communications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const result = await sql`
      INSERT INTO communications (
        type, subject, content, deal_id, lp_id, sent_by, recipients, 
        scheduled_at, sent_at, status
      ) VALUES (
        ${data.type}, ${data.subject}, ${data.content}, 
        ${data.deal_id || null}, ${data.lp_id || null}, ${data.sent_by},
        ${data.recipients || []}, ${data.scheduled_at || null}, 
        ${data.sent_at || null}, ${data.status || 'draft'}
      )
      RETURNING *
    `;
    
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating communication:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}