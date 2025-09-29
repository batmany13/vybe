import { sql } from '@/server-lib/neon';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/public/deals/[shareKey] - Get deal data for public sharing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareKey: string }> }
) {
  try {
    const { shareKey } = await params;

    // First, verify the share link is valid and not expired
    const shareResult = await sql`
      SELECT 
        deal_id,
        expires_at,
        is_active
      FROM deal_shares 
      WHERE share_key = ${shareKey}
    `;

    if (shareResult.length === 0) {
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      );
    }

    const share = shareResult[0];

    // Check if share is active
    if (!share.is_active) {
      return NextResponse.json(
        { error: 'Share link has been revoked' },
        { status: 403 }
      );
    }

    // Check if share is expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Share link has expired' },
        { status: 403 }
      );
    }

    // Get the deal data
    const dealResult = await sql`
      SELECT 
        d.id,
        d.company_name,
        d.industry,
        d.stage,
        d.deal_size,
        d.valuation,
        d.description,
        d.company_description_short,
        d.company_url,
        d.pitch_deck_url,
        d.demo_url,
        d.funding_round,
        d.founders_location,
        d.company_base_location,
        d.working_duration,
        d.user_traction,
        d.traction_progress,
        d.founder_motivation,
        d.competition_differentiation,
        d.why_good_fit,
        d.excitement_note,
        d.raising_amount,
        d.confirmed_amount,
        d.safe_or_equity,
        d.lead_investor,
        d.co_investors,
        d.has_revenue,
        d.revenue_amount,
        d.created_at,
        d.updated_at
      FROM deals d
      WHERE d.id = ${share.deal_id}
    `;

    if (dealResult.length === 0) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // Get founders data
    const foundersResult = await sql`
      SELECT 
        id,
        name,
        bio,
        linkedin_url,
        avatar_url
      FROM founders 
      WHERE deal_id = ${share.deal_id}
      ORDER BY created_at ASC
    `;

    // Update view count and last viewed
    await sql`
      UPDATE deal_shares 
      SET 
        view_count = view_count + 1,
        last_viewed_at = NOW()
      WHERE share_key = ${shareKey}
    `;

    const deal = {
      ...dealResult[0],
      founders: foundersResult
    };

    return NextResponse.json(deal);
  } catch (error) {
    console.error('Error fetching public deal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deal' },
      { status: 500 }
    );
  }
}