import { NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function GET() {
  try {
    // Get fund metrics
    const [
      lpMetrics,
      dealMetrics,
      responseMetrics,
      expertiseMetrics
    ] = await Promise.all([
      // LP metrics
      sql`
        SELECT 
          COUNT(*) as total_lps,
          SUM(investment_amount) as total_committed
        FROM limited_partners 
        WHERE status = 'active'
      `,
      
      // Deal metrics
      sql`
        SELECT 
          COUNT(*) as active_deals,
          COUNT(*) FILTER (WHERE stage IN ('due_diligence', 'term_sheet')) as deals_in_voting
        FROM deals 
        WHERE status = 'active'
      `,
      
      // Response rate metrics
      sql`
        SELECT 
          COUNT(DISTINCT dr.id) as total_requests,
          (COUNT(DISTINCT v.lp_id)::float / NULLIF(COUNT(DISTINCT lp.id), 0) * 100) as average_response_rate
        FROM decision_requests dr
        CROSS JOIN limited_partners lp
        LEFT JOIN votes v ON v.deal_id = dr.deal_id AND v.lp_id = lp.id
        WHERE dr.status IN ('voting', 'completed')
        AND lp.status = 'active'
      `,
      
      // Top expertise areas
      sql`
        SELECT 
          UNNEST(expertise_areas) as area,
          COUNT(*) as count
        FROM limited_partners 
        WHERE status = 'active'
        AND expertise_areas IS NOT NULL
        AND array_length(expertise_areas, 1) > 0
        GROUP BY area
        ORDER BY count DESC
        LIMIT 10
      `
    ]);
    
    const fundMetrics = {
      total_lps: parseInt(lpMetrics[0]?.total_lps || '0'),
      total_committed: parseFloat(lpMetrics[0]?.total_committed || '0'),
      active_deals: parseInt(dealMetrics[0]?.active_deals || '0'),
      deals_in_voting: parseInt(dealMetrics[0]?.deals_in_voting || '0'),
      average_response_rate: parseFloat(responseMetrics[0]?.average_response_rate || '0'),
      top_expertise_areas: expertiseMetrics.map(row => ({
        area: row.area,
        count: parseInt(row.count)
      }))
    };
    
    return NextResponse.json(fundMetrics);
  } catch (error) {
    console.error('Error fetching fund metrics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}