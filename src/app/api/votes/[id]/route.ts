import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const result = await sql`
      UPDATE votes 
      SET 
        conviction_level = COALESCE(${data.conviction_level}, conviction_level),
        strong_no = COALESCE(${data.strong_no}, strong_no),
        comments = COALESCE(${data.comments}, comments),
        has_pain_point = COALESCE(${data.has_pain_point}, has_pain_point),
        solution_feedback = COALESCE(${data.solution_feedback}, solution_feedback),
        pilot_customer_interest = COALESCE(${data.pilot_customer_interest}, pilot_customer_interest),
        pilot_customer_feedback = COALESCE(${data.pilot_customer_feedback}, pilot_customer_feedback),
        would_buy = COALESCE(${data.would_buy}, would_buy),
        buying_interest_feedback = COALESCE(${data.buying_interest_feedback}, buying_interest_feedback),
        price_feedback = COALESCE(${data.price_feedback}, price_feedback),
        additional_notes = COALESCE(${data.additional_notes}, additional_notes),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Vote not found' }, { status: 404 });
    }
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating vote:', error);
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
      DELETE FROM votes 
      WHERE id = ${id}
      RETURNING id, deal_id
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Vote not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Vote deleted successfully', deal_id: result[0].deal_id });
  } catch (error) {
    console.error('Error deleting vote:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}