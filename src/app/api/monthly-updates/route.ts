import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';
import { MonthlyUpdate } from '@/shared/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    let query = `
      SELECT id, title, content, month, year, metrics, created_by, lemlist_campaign_id, 
             period_start, period_end, created_at, updated_at 
      FROM monthly_updates
    `;
    
    const conditions: string[] = [];

    if (year) {
      conditions.push(`year = ${parseInt(year)}`);
    }
    
    if (month) {
      conditions.push(`month = ${parseInt(month)}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY year DESC, month DESC, created_at DESC';

    const result = await sql(query);
    const rows: any[] = Array.isArray(result) ? result : ((result as any)?.rows || []);
    
    const updates: MonthlyUpdate[] = rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      month: row.month,
      year: row.year,
      metrics: row.metrics,
      created_by: row.created_by,
      lemlist_campaign_id: row.lemlist_campaign_id,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    }));

    return NextResponse.json(updates);
  } catch (error) {
    console.error('Error fetching monthly updates:', error);
    return NextResponse.json({ error: 'Failed to fetch monthly updates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const updateData = await request.json();
    
    const result = await sql`
      INSERT INTO monthly_updates (
        title, 
        content, 
        month, 
        year, 
        created_by,
        period_start,
        period_end,
        metrics
      )
      VALUES (
        ${updateData.title},
        ${updateData.content},
        ${updateData.month},
        ${updateData.year},
        'system',
        ${updateData.period_start},
        ${updateData.period_end},
        ${JSON.stringify(updateData.metrics)}
      )
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Failed to create monthly update:', error);
    return NextResponse.json({ error: 'Failed to create monthly update' }, { status: 500 });
  }
}