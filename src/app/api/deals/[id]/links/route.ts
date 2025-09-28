import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
    
    const links = await sql`
      SELECT id, title, url, lp_id, created_at, updated_at 
      FROM deal_links 
      WHERE deal_id = ${dealId}
      ORDER BY created_at ASC
    `;
    
    return NextResponse.json(links);
  } catch (error) {
    console.error('Error fetching deal links:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
    const { links, lp_id } = await request.json();
    
    if (!Array.isArray(links)) {
      return NextResponse.json({ error: 'Links must be an array' }, { status: 400 });
    }
    
    // Delete existing links for this LP and deal
    if (lp_id) {
      await sql`
        DELETE FROM deal_links 
        WHERE deal_id = ${dealId} AND lp_id = ${lp_id}
      `;
    }
    
    // Insert new links
    const validLinks = links.filter(link => link.title?.trim() && link.url?.trim());
    
    if (validLinks.length > 0) {
      const insertPromises = validLinks.map(link => 
        sql`
          INSERT INTO deal_links (deal_id, lp_id, title, url)
          VALUES (${dealId}, ${lp_id || null}, ${link.title.trim()}, ${link.url.trim()})
          RETURNING id, title, url, created_at
        `
      );
      
      const results = await Promise.all(insertPromises);
      return NextResponse.json(results.map(result => result[0]));
    }
    
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error saving deal links:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}