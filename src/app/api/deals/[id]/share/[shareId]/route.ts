import { sql } from '@/server-lib/neon';
import { NextRequest, NextResponse } from 'next/server';

// DELETE /api/deals/[id]/share/[shareId] - Revoke a share link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; shareId: string }> }
) {
  try {
    const { id, shareId } = await params;

    await sql`
      UPDATE deal_shares 
      SET is_active = false
      WHERE id = ${shareId} AND deal_id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking deal share:', error);
    return NextResponse.json(
      { error: 'Failed to revoke deal share' },
      { status: 500 }
    );
  }
}