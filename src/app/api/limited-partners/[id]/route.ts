import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const result = await sql`
      SELECT 
        id,
        name,
        email,
        company,
        title,
        phone,
        linkedin_url,
        avatar_url,
        investment_amount,
        commitment_date,
        status,
        partner_type,
        expertise_areas,
        notes,
        added_to_google_group,
        created_at,
        updated_at
      FROM limited_partners 
      WHERE id = ${id}
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Limited Partner not found' }, { status: 404 });
    }
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching limited partner:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const result = await sql`
      UPDATE limited_partners 
      SET 
        name = ${data.name === undefined ? sql`name` : data.name},
        email = ${data.email === undefined ? sql`email` : data.email},
        company = ${data.company === undefined ? sql`company` : data.company},
        title = ${data.title === undefined ? sql`title` : data.title},
        phone = ${data.phone === undefined ? sql`phone` : data.phone},
        linkedin_url = ${data.linkedin_url === undefined ? sql`linkedin_url` : data.linkedin_url},
        avatar_url = ${data.avatar_url === undefined ? sql`avatar_url` : data.avatar_url},
        investment_amount = ${data.investment_amount === undefined ? sql`investment_amount` : data.investment_amount},
        commitment_date = ${data.commitment_date === undefined ? sql`commitment_date` : data.commitment_date},
        status = ${data.status === undefined ? sql`status` : data.status},
        partner_type = ${data.partner_type === undefined ? sql`partner_type` : data.partner_type},
        expertise_areas = ${data.expertise_areas === undefined ? sql`expertise_areas` : data.expertise_areas},
        notes = ${data.notes === undefined ? sql`notes` : data.notes},
        added_to_google_group = ${data.added_to_google_group === undefined ? sql`added_to_google_group` : data.added_to_google_group}
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Limited Partner not found' }, { status: 404 });
    }
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating limited partner:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const result = await sql`
      UPDATE limited_partners 
      SET 
        name = ${data.name === undefined ? sql`name` : data.name},
        email = ${data.email === undefined ? sql`email` : data.email},
        company = ${data.company === undefined ? sql`company` : data.company},
        title = ${data.title === undefined ? sql`title` : data.title},
        phone = ${data.phone === undefined ? sql`phone` : data.phone},
        linkedin_url = ${data.linkedin_url === undefined ? sql`linkedin_url` : data.linkedin_url},
        avatar_url = ${data.avatar_url === undefined ? sql`avatar_url` : data.avatar_url},
        investment_amount = ${data.investment_amount === undefined ? sql`investment_amount` : data.investment_amount},
        commitment_date = ${data.commitment_date === undefined ? sql`commitment_date` : data.commitment_date},
        status = ${data.status === undefined ? sql`status` : data.status},
        partner_type = ${data.partner_type === undefined ? sql`partner_type` : data.partner_type},
        expertise_areas = ${data.expertise_areas === undefined ? sql`expertise_areas` : data.expertise_areas},
        notes = ${data.notes === undefined ? sql`notes` : data.notes},
        added_to_google_group = ${data.added_to_google_group === undefined ? sql`added_to_google_group` : data.added_to_google_group}
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Limited Partner not found' }, { status: 404 });
    }
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating limited partner:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Remove dependent records first to avoid integrity issues
    await sql`DELETE FROM votes WHERE lp_id = ${id}`;

    // If you later add user_lp_links, uncomment the line below to also clean them up
    // await sql`DELETE FROM user_lp_links WHERE lp_id = ${id}`;

    const result = await sql`
      DELETE FROM limited_partners 
      WHERE id = ${id}
      RETURNING id
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Limited Partner not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Limited Partner deleted successfully' });
  } catch (error) {
    console.error('Error deleting limited partner:', error);
    return NextResponse.json({ error: 'Failed to delete Limited Partner' }, { status: 500 });
  }
}