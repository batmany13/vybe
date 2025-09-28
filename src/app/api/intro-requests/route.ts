import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function GET(request: NextRequest) {
  try {
    // Fetch votes where LPs expressed interest in meeting the startup
    // This includes pilot customer interest or strong buying interest
    const result = await sql`
      SELECT 
        v.id as vote_id,
        v.deal_id,
        v.lp_id,
        v.conviction_level,
        v.comments,
        v.pilot_customer_interest,
        v.pilot_customer_response,
        v.pilot_customer_feedback,
        v.would_buy,
        v.buying_interest_response,
        v.buying_interest_feedback,
        v.price_feedback,
        v.additional_notes,
        v.pain_point_level,
        v.solution_feedback,
        v.created_at,
        lp.name as lp_name,
        lp.email as lp_email,
        lp.company as lp_company,
        lp.title as lp_title,
        lp.avatar_url as lp_avatar_url,
        d.company_name,
        d.description as company_description,
        d.company_url,
        d.pitch_deck_url,
        ir.status as intro_status,
        ir.sent_at as intro_sent_at,
        COALESCE(f.founders, '[]'::json) as founders
      FROM votes v
      JOIN limited_partners lp ON v.lp_id = lp.id
      JOIN deals d ON v.deal_id = d.id
      LEFT JOIN introduction_requests ir ON ir.vote_id = v.id
      LEFT JOIN (
        SELECT 
          deal_id,
          json_agg(
            json_build_object(
              'id', id,
              'name', name,
              'email', email,
              'linkedin_url', linkedin_url,
              'bio', bio
            )
          ) as founders
        FROM founders
        GROUP BY deal_id
      ) f ON d.id = f.deal_id
      WHERE 
        -- Include both auto-detected and manually created requests
        (
          -- Auto-detected from survey responses
          (
            (v.pilot_customer_interest = true AND v.pilot_customer_response IN ('hell_yes', 'very_interested', 'interested_with_conditions'))
            OR 
            (v.would_buy = true AND v.buying_interest_response IN ('absolutely', 'very_likely', 'probably'))
            OR
            v.conviction_level >= 3  -- Strong yes or Strong yes + additional investment
          )
          -- OR manually created (has an introduction_request record)
          OR ir.id IS NOT NULL
        )
      ORDER BY 
        CASE 
          WHEN ir.status IS NULL OR ir.status = 'pending' THEN 0
          WHEN ir.status = 'sent' THEN 1
          ELSE 2
        END,
        v.created_at DESC
    `;
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching introduction requests:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}