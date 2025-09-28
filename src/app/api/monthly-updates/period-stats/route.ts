import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }

    // Convert to Date objects and format for SQL
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate deals evaluated (all deals created in the period)
    const dealsEvaluatedResult = await sql`
      SELECT COUNT(*) as count
      FROM deals 
      WHERE created_at >= ${start.toISOString()} 
        AND created_at <= ${end.toISOString()}
    `;
    const dealsEvaluated = parseInt(dealsEvaluatedResult[0]?.count || '0');

    // Calculate new investments (deals that closed in the period)
    const newInvestmentsResult = await sql`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(deal_size), 0) as total_amount
      FROM deals 
      WHERE stage IN ('signed', 'signed_and_wired')
        AND close_date IS NOT NULL
        AND close_date >= ${start.toISOString()} 
        AND close_date <= ${end.toISOString()}
    `;
    const newInvestments = parseInt(newInvestmentsResult[0]?.count || '0');
    const totalInvestmentAmount = parseFloat(newInvestmentsResult[0]?.total_amount || '0');

    // Get details of newly closed investments in the period
    const newDealsClosed = await sql`
      SELECT 
        company_name, 
        description, 
        deal_size, 
        funding_round,
        close_date
      FROM deals 
      WHERE stage IN ('signed', 'signed_and_wired')
        AND close_date IS NOT NULL
        AND close_date >= ${start.toISOString()} 
        AND close_date <= ${end.toISOString()}
      ORDER BY close_date ASC
    `;

    const stats = {
      dealsEvaluated,
      newInvestments,
      totalInvestmentAmount,
      newDealsClosed: newDealsClosed.map((deal) => ({
        company_name: deal.company_name,
        description: deal.description,
        deal_size: typeof deal.deal_size === 'number' ? deal.deal_size : parseFloat(deal.deal_size || '0'),
        funding_round: deal.funding_round,
        close_date: (deal.close_date as Date | string)?.toString(),
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to calculate period stats:', error);
    return NextResponse.json({ error: 'Failed to calculate period stats' }, { status: 500 });
  }
}