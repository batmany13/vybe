import { sql } from '@/server-lib/neon';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// Generate secure share key
function generateShareKey(): string {
  return randomBytes(32).toString('hex');
}

// GET /api/deals/[id]/share - Get existing share links for a deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const shares = await sql`
      SELECT 
        id,
        share_key,
        created_by,
        created_at,
        expires_at,
        is_active,
        view_count,
        last_viewed_at
      FROM deal_shares 
      WHERE deal_id = ${id} AND is_active = true
      ORDER BY created_at DESC
    `;

    return NextResponse.json(shares);
  } catch (error) {
    console.error('Error fetching deal shares:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deal shares' },
      { status: 500 }
    );
  }
}

// POST /api/deals/[id]/share - Create a new share link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { 
      createdBy, 
      expiresInDays = 30 // Default to 30 days
    } = body;

    if (!createdBy) {
      return NextResponse.json(
        { error: 'createdBy is required' },
        { status: 400 }
      );
    }

    // Generate unique share key
    const shareKey = generateShareKey();
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const result = await sql`
      INSERT INTO deal_shares (
        deal_id,
        share_key,
        created_by,
        expires_at
      ) VALUES (
        ${id},
        ${shareKey},
        ${createdBy},
        ${expiresAt.toISOString()}
      )
      RETURNING 
        id,
        share_key,
        created_by,
        created_at,
        expires_at,
        is_active,
        view_count,
        last_viewed_at
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating deal share:', error);
    return NextResponse.json(
      { error: 'Failed to create deal share' },
      { status: 500 }
    );
  }
}