import { NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function GET() {
  try {
    // Get active investment goals
    const goalsResult = await sql`
      SELECT * FROM investment_goals 
      WHERE is_active = true 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const goals = goalsResult[0];
    
    // Get deals that are actually invested (signed_and_wired stage)
    const dealsResult = await sql`
      SELECT 
        id,
        company_name,
        deal_size,
        created_at,
        EXTRACT(YEAR FROM created_at) as year,
        EXTRACT(QUARTER FROM created_at) as quarter
      FROM deals 
      WHERE stage = 'signed_and_wired'
      ORDER BY created_at DESC
    `;

    // Calculate quarterly stats
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentQuarter = Math.floor((currentDate.getMonth() + 3) / 3);
    
    // Group deals by quarter
    const quarterlyDeals: Record<string, any[]> = {};
    dealsResult.forEach((deal: any) => {
      const key = `${deal.year}-Q${deal.quarter}`;
      if (!quarterlyDeals[key]) {
        quarterlyDeals[key] = [];
      }
      quarterlyDeals[key].push(deal);
    });

    // Calculate quarterly goals if goals exist
    let quarterlyGoals = null;
    if (goals) {
      const quartersInPeriod = Math.ceil(goals.investment_period_months / 3);
      const totalChecks = Math.floor(goals.total_investment_amount / goals.average_check_size);
      
      quarterlyGoals = {
        amountPerQuarter: goals.total_investment_amount / quartersInPeriod,
        checksPerQuarter: Math.ceil(totalChecks / quartersInPeriod),
        averageCheckSize: goals.average_check_size,
        totalAmount: goals.total_investment_amount,
        totalChecks: totalChecks,
        periodMonths: goals.investment_period_months,
        quartersInPeriod: quartersInPeriod
      };
    }

    // Build quarterly stats starting from Q3 2025 for the next 2 years (8 quarters)
    const quarterlyStats = [];
    const startYear = 2025;
    const startQuarter = 3;
    
    for (let i = 0; i < 8; i++) {
      let year = startYear;
      let quarter = startQuarter + i;
      
      // Adjust for quarters that go into next years
      while (quarter > 4) {
        year += 1;
        quarter -= 4;
      }
      
      const key = `${year}-Q${quarter}`;
      const deals = quarterlyDeals[key] || [];
      
      const actualAmount = deals.reduce((sum: number, deal: any) => 
        sum + (parseFloat(deal.deal_size) || 0), 0
      );
      
      // Determine if this is a future quarter
      const isFuture = year > currentYear || (year === currentYear && quarter > currentQuarter);
      
      quarterlyStats.push({
        year,
        quarter,
        key,
        isFuture,
        actual: {
          count: deals.length,
          amount: actualAmount,
          deals: deals.map((d: any) => ({
            id: d.id,
            company_name: d.company_name,
            amount: parseFloat(d.deal_size) || 0
          }))
        },
        goal: quarterlyGoals ? {
          count: quarterlyGoals.checksPerQuarter,
          amount: quarterlyGoals.amountPerQuarter
        } : null,
        performance: quarterlyGoals && !isFuture ? {
          countPercent: deals.length > 0 ? (deals.length / quarterlyGoals.checksPerQuarter) * 100 : 0,
          amountPercent: actualAmount > 0 ? (actualAmount / quarterlyGoals.amountPerQuarter) * 100 : 0
        } : null
      });
    }

    // Calculate overall stats
    const allInvestedDeals = dealsResult;
    const totalInvested = allInvestedDeals.reduce((sum: number, deal: any) => 
      sum + (parseFloat(deal.deal_size) || 0), 0
    );
    
    const overallStats = {
      totalDealsInvested: allInvestedDeals.length,
      totalAmountInvested: totalInvested,
      averageCheckSize: allInvestedDeals.length > 0 ? totalInvested / allInvestedDeals.length : 0,
      goals: goals ? {
        totalAmount: goals.total_investment_amount,
        periodMonths: goals.investment_period_months,
        targetAverageCheck: goals.average_check_size,
        targetTotalChecks: Math.floor(goals.total_investment_amount / goals.average_check_size)
      } : null,
      progress: goals ? {
        amountPercent: (totalInvested / goals.total_investment_amount) * 100,
        checksPercent: (allInvestedDeals.length / Math.floor(goals.total_investment_amount / goals.average_check_size)) * 100
      } : null
    };

    return NextResponse.json({
      goals,
      quarterlyStats,
      overallStats
    });
  } catch (error) {
    console.error('Error fetching quarterly stats:', error);
    return NextResponse.json({ error: 'Failed to fetch quarterly stats' }, { status: 500 });
  }
}