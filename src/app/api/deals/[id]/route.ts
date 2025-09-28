import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeVotes = searchParams.get('include_votes') === 'true';
    const includeFounders = searchParams.get('include_founders') === 'true';

    if (includeVotes && includeFounders) {
      // Get deal with both votes and founders
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
          WHERE deal_id = ${id}
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
                'created_at', created_at,
                'updated_at', updated_at
              )
            ) as founders
          FROM founders
          WHERE deal_id = ${id}
          GROUP BY deal_id
        ) f ON d.id = f.deal_id
        WHERE d.id = ${id}
      `;
      
      if (result.length === 0) {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
      }
      
      return NextResponse.json(result[0]);
    } else if (includeVotes) {
      // Get deal with votes only
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
          COALESCE(v.net_score, 0) as net_score
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
            (COUNT(*) FILTER (WHERE conviction_level = 3) + COUNT(*) FILTER (WHERE conviction_level = 4) - COUNT(*) FILTER (WHERE strong_no = true)) as net_score
          FROM votes
          WHERE deal_id = ${id}
          GROUP BY deal_id
        ) v ON d.id = v.deal_id
        WHERE d.id = ${id}
      `;
      
      if (result.length === 0) {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
      }
      
      return NextResponse.json(result[0]);
    } else if (includeFounders) {
      // Get deal with founders only
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
                'avatar_url', avatar_url,
                'created_at', created_at,
                'updated_at', updated_at
              )
            ) as founders
          FROM founders
          WHERE deal_id = ${id}
          GROUP BY deal_id
        ) f ON d.id = f.deal_id
        WHERE d.id = ${id}
      `;
      
      if (result.length === 0) {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
      }
      
      return NextResponse.json(result[0]);
    } else {
      // Get deal without votes or founders
      const result = await sql`
        SELECT * FROM deals WHERE id = ${id}
      `;
      
      if (result.length === 0) {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
      }
      
      return NextResponse.json(result[0]);
    }
  } catch (error) {
    console.error('Error fetching deal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    // Fetch current deal to preserve existing values
    const currentRows = await sql`SELECT * FROM deals WHERE id = ${id}`;
    if (currentRows.length === 0) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }
    const current: any = currentRows[0];

    // Helper function to safely extract and validate field values
    const getString = (field: string, required = false): string | null => {
      if (!(field in data)) {
        return current[field] || (required ? '' : null);
      }
      const value = data[field];
      if (value === null || value === undefined) {
        return required ? (current[field] || '') : null;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '' && required) {
          return current[field] || '';
        }
        return trimmed === '' ? null : trimmed;
      }
      return String(value);
    };

    const getNumber = (field: string): number | null => {
      if (!(field in data)) {
        return current[field] || null;
      }
      const value = data[field];
      if (value === null || value === undefined) {
        return null;
      }
      const num = typeof value === 'number' ? value : parseFloat(String(value));
      return Number.isNaN(num) ? null : num;
    };

    const getBoolean = (field: string): boolean => {
      if (!(field in data)) {
        return Boolean(current[field]);
      }
      return Boolean(data[field]);
    };

    const getArray = (field: string): any[] | null => {
      if (!(field in data)) {
        return current[field] || null;
      }
      const value = data[field];
      if (!Array.isArray(value)) {
        return current[field] || null;
      }
      return value;
    };

    const getDate = (field: string): string | null => {
      if (!(field in data)) {
        return current[field] || null;
      }
      const value = data[field];
      if (value === null || value === undefined) {
        return null;
      }
      if (typeof value === 'string') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return current[field] || null;
        }
        // For the survey_deadline field which is a DATE type, return just the date part
        if (field === 'survey_deadline') {
          return date.toISOString().split('T')[0];
        }
        return date.toISOString();
      }
      return current[field] || null;
    };

    // Extract all the fields that exist in the database schema
    const updatedFields = {
      company_name: getString('company_name', true) || current.company_name,
      company_url: getString('company_url'),
      company_description_short: getString('company_description_short'),
      industry: getString('industry', true) || current.industry,
      stage: getString('stage') || current.stage,
      deal_size: getNumber('deal_size') || current.deal_size,
      valuation: getNumber('valuation'),
      description: getString('description'), // This should be nullable
      pitch_deck_url: getString('pitch_deck_url'),
      website_url: getString('website_url'),
      funding_round: getString('funding_round', true) || current.funding_round,
      status: getString('status') || current.status,
      founders_location: getString('founders_location'),
      company_base_location: getString('company_base_location'),
      demo_url: getString('demo_url'),
      working_duration: getString('working_duration'),
      has_revenue: getBoolean('has_revenue'),
      revenue_amount: getNumber('revenue_amount'),
      user_traction: getString('user_traction'),
      raising_amount: getNumber('raising_amount'),
      safe_or_equity: getString('safe_or_equity'),
      confirmed_amount: getNumber('confirmed_amount'),
      lead_investor: getString('lead_investor'),
      co_investors: getArray('co_investors'),
      traction_progress: getString('traction_progress'),
      founder_motivation: getString('founder_motivation'),
      competition_differentiation: getString('competition_differentiation'),
      survey_deadline: getDate('survey_deadline'),
      quang_excited_note: getString('quang_excited_note'),
      why_good_fit_for_cto_fund: getString('why_good_fit_for_cto_fund'),
      contract_link: getString('contract_link'),
      close_date: getDate('close_date'),
      sourcing_meeting_booked_at: getDate('sourcing_meeting_booked_at'),
      partner_review_started_at: getDate('partner_review_started_at'),
    };

    // Handle stage transitions
    const prevStage = current.stage;
    const nextStage = updatedFields.stage;

    // Auto-set timestamps for stage transitions if not already set
    if (prevStage !== nextStage) {
      if (nextStage === 'sourcing_meeting_booked' && !updatedFields.sourcing_meeting_booked_at) {
        updatedFields.sourcing_meeting_booked_at = new Date().toISOString();
      }
      if (nextStage === 'partner_review' && !updatedFields.partner_review_started_at) {
        updatedFields.partner_review_started_at = new Date().toISOString();
      }
      if (nextStage === 'signed_and_wired' && !updatedFields.close_date) {
        updatedFields.close_date = new Date().toISOString();
      }
    }

    // Perform the update with explicit field mapping
    const dealResult = await sql`
      UPDATE deals SET 
        company_name = ${updatedFields.company_name},
        company_url = ${updatedFields.company_url},
        company_description_short = ${updatedFields.company_description_short},
        industry = ${updatedFields.industry},
        stage = ${updatedFields.stage},
        deal_size = ${updatedFields.deal_size},
        valuation = ${updatedFields.valuation},
        description = ${updatedFields.description},
        pitch_deck_url = ${updatedFields.pitch_deck_url},
        website_url = ${updatedFields.website_url},
        funding_round = ${updatedFields.funding_round},
        status = ${updatedFields.status},
        founders_location = ${updatedFields.founders_location},
        company_base_location = ${updatedFields.company_base_location},
        demo_url = ${updatedFields.demo_url},
        working_duration = ${updatedFields.working_duration},
        has_revenue = ${updatedFields.has_revenue},
        revenue_amount = ${updatedFields.revenue_amount},
        user_traction = ${updatedFields.user_traction},
        raising_amount = ${updatedFields.raising_amount},
        safe_or_equity = ${updatedFields.safe_or_equity},
        confirmed_amount = ${updatedFields.confirmed_amount},
        lead_investor = ${updatedFields.lead_investor},
        co_investors = ${updatedFields.co_investors},
        traction_progress = ${updatedFields.traction_progress},
        founder_motivation = ${updatedFields.founder_motivation},
        competition_differentiation = ${updatedFields.competition_differentiation},
        survey_deadline = ${updatedFields.survey_deadline},
        quang_excited_note = ${updatedFields.quang_excited_note},
        why_good_fit_for_cto_fund = ${updatedFields.why_good_fit_for_cto_fund},
        contract_link = ${updatedFields.contract_link},
        close_date = ${updatedFields.close_date},
        sourcing_meeting_booked_at = ${updatedFields.sourcing_meeting_booked_at},
        partner_review_started_at = ${updatedFields.partner_review_started_at},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (dealResult.length === 0) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Update founders if provided
    if (Array.isArray(data.founders)) {
      const validFounders = data.founders.filter((f: any) => 
        f && typeof f.name === 'string' && f.name.trim().length > 0
      );
      
      if (validFounders.length > 0) {
        // Delete existing founders and insert new ones
        await sql`DELETE FROM founders WHERE deal_id = ${id}`;
        
        for (const founder of validFounders) {
          await sql`
            INSERT INTO founders (deal_id, name, bio, linkedin_url, email, avatar_url)
            VALUES (
              ${id}, 
              ${founder.name || ''}, 
              ${founder.bio || null}, 
              ${founder.linkedin_url || null}, 
              ${founder.email || null}, 
              ${founder.avatar_url || null}
            )
          `;
        }
      }
    }
    
    return NextResponse.json(dealResult[0]);
  } catch (error) {
    console.error('Error updating deal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const result = await sql`
      DELETE FROM deals WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}