import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('deal_id');
    
    let result;
    if (dealId) {
      result = await sql`
        SELECT 
          v.*,
          lp.name as lp_name,
          lp.email as lp_email,
          lp.company as lp_company,
          lp.title as lp_title,
          d.company_name as deal_company_name
        FROM votes v
        JOIN limited_partners lp ON v.lp_id = lp.id
        JOIN deals d ON v.deal_id = d.id
        WHERE v.deal_id = ${dealId}
        ORDER BY v.created_at DESC
      `;
    } else {
      result = await sql`
        SELECT 
          v.*,
          lp.name as lp_name,
          lp.email as lp_email,
          lp.company as lp_company,
          lp.title as lp_title,
          d.company_name as deal_company_name
        FROM votes v
        JOIN limited_partners lp ON v.lp_id = lp.id
        JOIN deals d ON v.deal_id = d.id
        ORDER BY v.created_at DESC
      `;
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching votes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const result = await sql`
      INSERT INTO votes (
        deal_id, lp_id, conviction_level, review_status, strong_no, comments, has_pain_point,
        pain_point_level, solution_feedback, pilot_customer_interest, 
        pilot_customer_response, pilot_customer_feedback, would_buy, 
        buying_interest_response, buying_interest_feedback, price_feedback, 
        additional_notes, founder_specific_notes
      ) VALUES (
        ${data.deal_id}, ${data.lp_id}, ${data.conviction_level || null}, ${data.review_status || null}, ${data.strong_no ?? false}, ${data.comments || null}, 
        ${data.has_pain_point || null}, ${data.pain_point_level || null},
        ${data.solution_feedback || null}, ${data.pilot_customer_interest || null}, 
        ${data.pilot_customer_response || null}, ${data.pilot_customer_feedback || null},
        ${data.would_buy || null}, ${data.buying_interest_response || null},
        ${data.buying_interest_feedback || null}, ${data.price_feedback || null}, 
        ${data.additional_notes || null}, ${data.founder_specific_notes || null}
      )
      ON CONFLICT (deal_id, lp_id) 
      DO UPDATE SET 
        conviction_level = EXCLUDED.conviction_level,
        review_status = EXCLUDED.review_status,
        strong_no = EXCLUDED.strong_no,
        comments = EXCLUDED.comments,
        has_pain_point = EXCLUDED.has_pain_point,
        pain_point_level = EXCLUDED.pain_point_level,
        solution_feedback = EXCLUDED.solution_feedback,
        pilot_customer_interest = EXCLUDED.pilot_customer_interest,
        pilot_customer_response = EXCLUDED.pilot_customer_response,
        pilot_customer_feedback = EXCLUDED.pilot_customer_feedback,
        would_buy = EXCLUDED.would_buy,
        buying_interest_response = EXCLUDED.buying_interest_response,
        buying_interest_feedback = EXCLUDED.buying_interest_feedback,
        price_feedback = EXCLUDED.price_feedback,
        additional_notes = EXCLUDED.additional_notes,
        founder_specific_notes = EXCLUDED.founder_specific_notes,
        updated_at = NOW()
      RETURNING *
    `;
    
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating vote:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}