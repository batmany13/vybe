import { NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function GET() {
  try {
    const portfolioCompanies = await sql`
      SELECT 
        company_name, 
        description, 
        deal_size, 
        funding_round,
        created_at
      FROM deals 
      WHERE stage IN ('signed', 'signed_and_wired') 
      ORDER BY company_name ASC
    `;

    return NextResponse.json(portfolioCompanies);
  } catch (error) {
    console.error('Failed to fetch portfolio companies:', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio companies' }, { status: 500 });
  }
}