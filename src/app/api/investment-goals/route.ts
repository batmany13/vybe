import { NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM investment_goals 
      WHERE is_active = true 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    return NextResponse.json(result[0] || null);
  } catch (error) {
    console.error('Error fetching investment goals:', error);
    return NextResponse.json({ error: 'Failed to fetch investment goals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      total_investment_amount, 
      investment_period_months, 
      average_check_size 
    } = body;

    if (!total_investment_amount || !investment_period_months || !average_check_size) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Deactivate all existing goals
    await sql`UPDATE investment_goals SET is_active = false WHERE is_active = true`;

    // Create new active goal
    const result = await sql`
      INSERT INTO investment_goals (
        total_investment_amount,
        investment_period_months,
        average_check_size,
        is_active
      ) VALUES (
        ${total_investment_amount},
        ${investment_period_months},
        ${average_check_size},
        true
      )
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating investment goals:', error);
    return NextResponse.json({ error: 'Failed to create investment goals' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id,
      total_investment_amount, 
      investment_period_months, 
      average_check_size 
    } = body;

    if (!id || !total_investment_amount || !investment_period_months || !average_check_size) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE investment_goals
      SET 
        total_investment_amount = ${total_investment_amount},
        investment_period_months = ${investment_period_months},
        average_check_size = ${average_check_size},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating investment goals:', error);
    return NextResponse.json({ error: 'Failed to update investment goals' }, { status: 500 });
  }
}