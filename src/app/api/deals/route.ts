import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';
import { DealWithVotes } from '@/shared/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeVotes = searchParams.get('include_votes') === 'true';
    const includeFounders = searchParams.get('include_founders') === 'true';
    
    if (includeVotes && includeFounders) {
      // Get deals with vote counts and founders
      const result = await sql`
        SELECT 
          d.*,
          COALESCE(v.votes, '[]'::json) as votes,
          COALESCE(v.total_votes, 0) as total_votes,
          COALESCE(v.strong_yes_plus_votes, 0) as strong_yes_plus_votes,
          COALESCE(v.strong_yes_votes, 0) as strong_yes_votes,
          COALESCE(v.following_pack_votes, 0) as following_pack_votes,
          COALESCE(v.no_votes, 0) as no_votes,
          COALESCE(v.strong_no_votes, 0) as strong_no_votes,
          COALESCE(v.to_review_votes, 0) as to_review_votes,
          COALESCE(v.net_score, 0) as net_score,
          COALESCE(f.founders, '[]'::json) as founders
        FROM deals d
        LEFT JOIN (
          SELECT 
            deal_id,
            json_agg(
              json_build_object(
                'id', id,
                'deal_id', deal_id,
                'lp_id', lp_id,
                'conviction_level', conviction_level,
                'review_status', review_status,
                'strong_no', strong_no,
                'comments', comments,
                'has_pain_point', has_pain_point,
                'solution_feedback', solution_feedback,
                'pilot_customer_interest', pilot_customer_interest,
                'pilot_customer_feedback', pilot_customer_feedback,
                'would_buy', would_buy,
                'buying_interest_feedback', buying_interest_feedback,
                'price_feedback', price_feedback,
                'additional_notes', additional_notes,
                'founder_specific_notes', founder_specific_notes,
                'created_at', created_at,
                'updated_at', updated_at
              )
            ) as votes,
            COUNT(*) as total_votes,
            COUNT(*) FILTER (WHERE conviction_level = 4) as strong_yes_plus_votes,
            COUNT(*) FILTER (WHERE conviction_level = 3) as strong_yes_votes,
            COUNT(*) FILTER (WHERE conviction_level = 2) as following_pack_votes,
            COUNT(*) FILTER (WHERE conviction_level = 1) as no_votes,
            COUNT(*) FILTER (WHERE strong_no = true) as strong_no_votes,
            COUNT(*) FILTER (WHERE review_status = 'to_review') as to_review_votes,
            (COUNT(*) FILTER (WHERE conviction_level = 3) + COUNT(*) FILTER (WHERE conviction_level = 4) - COUNT(*) FILTER (WHERE strong_no = true)) as net_score
          FROM votes
          GROUP BY deal_id
        ) v ON d.id = v.deal_id
        LEFT JOIN (
          SELECT 
            deal_id,
            json_agg(
              json_build_object(
                'id', id,
                'deal_id', deal_id,
                'name', name,
                'bio', bio,
                'linkedin_url', linkedin_url,
                'avatar_url', avatar_url,
                'email', email,
                'avatar_url', avatar_url,
                'created_at', created_at,
                'updated_at', updated_at
              )
            ) as founders
          FROM founders
          GROUP BY deal_id
        ) f ON d.id = f.deal_id
        WHERE d.status = 'active'
        ORDER BY d.created_at DESC
      `;
      
      return NextResponse.json(result);
    } else if (includeVotes) {
      // Get deals with vote counts only
      const result = await sql`
        SELECT 
          d.*,
          COALESCE(v.votes, '[]'::json) as votes,
          COALESCE(v.total_votes, 0) as total_votes,
          COALESCE(v.strong_yes_plus_votes, 0) as strong_yes_plus_votes,
          COALESCE(v.strong_yes_votes, 0) as strong_yes_votes,
          COALESCE(v.following_pack_votes, 0) as following_pack_votes,
          COALESCE(v.no_votes, 0) as no_votes
        FROM deals d
        LEFT JOIN (
          SELECT 
            deal_id,
            json_agg(
              json_build_object(
                'id', id,
                'deal_id', deal_id,
                'lp_id', lp_id,
                'conviction_level', conviction_level,
                'comments', comments,
                'has_pain_point', has_pain_point,
                'solution_feedback', solution_feedback,
                'pilot_customer_interest', pilot_customer_interest,
                'pilot_customer_feedback', pilot_customer_feedback,
                'would_buy', would_buy,
                'buying_interest_feedback', buying_interest_feedback,
                'price_feedback', price_feedback,
                'additional_notes', additional_notes,
                'founder_specific_notes', founder_specific_notes,
                'created_at', created_at,
                'updated_at', updated_at
              )
            ) as votes,
            COUNT(*) as total_votes,
            COUNT(*) FILTER (WHERE conviction_level = 4) as strong_yes_plus_votes,
            COUNT(*) FILTER (WHERE conviction_level = 3) as strong_yes_votes,
            COUNT(*) FILTER (WHERE conviction_level = 2) as following_pack_votes,
            COUNT(*) FILTER (WHERE conviction_level = 1) as no_votes
          FROM votes
          GROUP BY deal_id
        ) v ON d.id = v.deal_id
        WHERE d.status = 'active'
        ORDER BY d.created_at DESC
      `;
      
      return NextResponse.json(result);
    } else if (includeFounders) {
      // Get deals with founders only
      const result = await sql`
        SELECT 
          d.*,
          COALESCE(f.founders, '[]'::json) as founders
        FROM deals d
        LEFT JOIN (
          SELECT 
            deal_id,
            json_agg(
              json_build_object(
                'id', id,
                'deal_id', deal_id,
                'name', name,
                'bio', bio,
                'linkedin_url', linkedin_url,
                'email', email,
                'created_at', created_at,
                'updated_at', updated_at
              )
            ) as founders
          FROM founders
          GROUP BY deal_id
        ) f ON d.id = f.deal_id
        WHERE d.status = 'active'
        ORDER BY d.created_at DESC
      `;
      return NextResponse.json(result);
    } else {
      // Get deals without votes or founders
      const result = await sql`
        SELECT * FROM deals 
        WHERE status = 'active'
        ORDER BY created_at DESC
      `;
      
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Derive default close_date if stage is closed and not provided
    let closeDate: string | null = null;
    if (data.close_date) {
      const d = new Date(data.close_date);
      closeDate = isNaN(d.getTime()) ? null : d.toISOString();
    } else if (data.stage === 'signed_and_wired') {
      closeDate = new Date().toISOString();
    }

    // Stage transition timestamps on create
    const nowIso = new Date().toISOString();
    let sourcingMeetingBookedAt: string | null = null;
    let lpSurveyStartedAt: string | null = null;
    if (data.sourcing_meeting_booked_at) {
      const d = new Date(data.sourcing_meeting_booked_at);
      sourcingMeetingBookedAt = isNaN(d.getTime()) ? null : d.toISOString();
    } else if (data.stage === 'sourcing_meeting_booked') {
      sourcingMeetingBookedAt = nowIso;
    }
    if (data.partner_review_started_at) {
      const d2 = new Date(data.partner_review_started_at);
      lpSurveyStartedAt = isNaN(d2.getTime()) ? null : d2.toISOString();
    } else if (data.stage === 'partner_review') {
      lpSurveyStartedAt = nowIso;
    }
    
    // Create deal with all the new fields
    const dealResult = await sql`
      INSERT INTO deals (
        company_name, company_url, company_description_short, industry, stage,
        deal_size, valuation, description, quang_excited_note, why_good_fit_for_cto_fund, pitch_deck_url, website_url,
        funding_round, status, survey_deadline, created_by, founders_location, company_base_location,
        demo_url, working_duration, has_revenue, revenue_amount,
        traction_progress, user_traction, founder_motivation, competition_differentiation,
        raising_amount, safe_or_equity, confirmed_amount,
        lead_investor, co_investors,
        close_date,
        sourcing_meeting_booked_at,
        partner_review_started_at
      ) VALUES (
        ${data.company_name}, ${data.company_url || null}, ${data.company_description_short || null},
        ${data.industry}, ${data.stage || 'sourcing'}, ${data.deal_size},
        ${data.valuation || null}, ${data.description}, ${data.quang_excited_note || null}, ${data.why_good_fit_for_cto_fund || null}, ${data.pitch_deck_url || null},
        ${data.website_url || null}, ${data.funding_round}, ${data.status || 'active'},
        ${data.survey_deadline ? new Date(data.survey_deadline).toISOString().split('T')[0] : null}, ${data.created_by}, ${data.founders_location || null}, ${data.company_base_location || null},
        ${data.demo_url || null}, ${data.working_duration || null},
        ${data.has_revenue || false}, ${data.revenue_amount || null},
        ${data.traction_progress || null}, ${data.user_traction || null},
        ${data.founder_motivation || null}, ${data.competition_differentiation || null},
        ${data.raising_amount || null}, ${data.safe_or_equity || null}, ${data.confirmed_amount || 0},
        ${data.lead_investor || null}, ${data.co_investors || null},
        ${closeDate},
        ${sourcingMeetingBookedAt},
        ${lpSurveyStartedAt}
      )
      RETURNING *
    `;
    
    const deal = dealResult[0];
    
    // Create founders if provided
    if (data.founders && data.founders.length > 0) {
      for (const founder of data.founders) {
        if (founder.name && founder.name.trim()) {
          await sql`
            INSERT INTO founders (deal_id, name, bio, linkedin_url, email, avatar_url)
            VALUES (${deal.id}, ${founder.name}, ${founder.bio || null}, ${founder.linkedin_url || null}, ${founder.email || null}, ${founder.avatar_url || null})
          `;
        }
      }
    }
    
    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
