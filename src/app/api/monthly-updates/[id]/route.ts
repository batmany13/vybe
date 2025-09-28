import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const result = await sql`
      SELECT * FROM monthly_updates 
      WHERE id = ${id}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Monthly update not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Failed to fetch monthly update:', error);
    return NextResponse.json({ error: 'Failed to fetch monthly update' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updateData = await request.json();
    
    // First get the existing record
    const existing = await sql`
      SELECT * FROM monthly_updates 
      WHERE id = ${id}
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Monthly update not found' }, { status: 404 });
    }

    // Merge the update data with existing data
    const title = updateData.title !== undefined ? updateData.title : existing[0].title;
    const content = updateData.content !== undefined ? updateData.content : existing[0].content;
    const month = updateData.month !== undefined ? updateData.month : existing[0].month;
    const year = updateData.year !== undefined ? updateData.year : existing[0].year;
    const metrics = updateData.metrics !== undefined ? updateData.metrics : existing[0].metrics;
    const lemlist_campaign_id = updateData.lemlist_campaign_id !== undefined ? updateData.lemlist_campaign_id : existing[0].lemlist_campaign_id;
    
    // Update the record
    const result = await sql`
      UPDATE monthly_updates 
      SET 
        title = ${title},
        content = ${content},
        month = ${month},
        year = ${year},
        metrics = ${metrics ? JSON.stringify(metrics) : null}::jsonb,
        lemlist_campaign_id = ${lemlist_campaign_id},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Failed to update monthly update:', error);
    return NextResponse.json({ 
      error: 'Failed to update monthly update',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updateData = await request.json();
    
    const result = await sql`
      UPDATE monthly_updates 
      SET 
        lemlist_campaign_id = ${updateData.lemlist_campaign_id},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Monthly update not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Failed to update monthly update:', error);
    return NextResponse.json({ error: 'Failed to update monthly update' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const result = await sql`
      DELETE FROM monthly_updates 
      WHERE id = ${id}
      RETURNING id, title
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Monthly update not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Monthly update deleted successfully',
      deleted: result[0]
    });
  } catch (error) {
    console.error('Failed to delete monthly update:', error);
    return NextResponse.json({ error: 'Failed to delete monthly update' }, { status: 500 });
  }
}