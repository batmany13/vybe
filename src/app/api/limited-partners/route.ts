import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';
import { LimitedPartner } from '@/shared/models';

export async function GET() {
  try {
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
      ORDER BY created_at DESC
    `;
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching limited partners:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const result = await sql`
      INSERT INTO limited_partners (
        name, email, company, title, phone, linkedin_url, avatar_url,
        investment_amount, commitment_date, status, partner_type, expertise_areas, notes, added_to_google_group
      ) VALUES (
        ${data.name}, ${data.email}, ${data.company}, ${data.title}, 
        ${data.phone || null}, ${data.linkedin_url || null}, ${data.avatar_url || null},
        ${data.investment_amount}, ${data.commitment_date}, 
        ${data.status || 'active'}, ${data.partner_type || 'limited_partner'}, ${data.expertise_areas || []}, ${data.notes || null}, ${data.added_to_google_group ?? false}
      )
      RETURNING *
    `;
    
    // Auto-add to general channel
    const generalChannelResult = await sql`
      SELECT id FROM channels WHERE name = 'general'
    `;
    
    if (generalChannelResult && generalChannelResult[0]) {
      await sql`
        INSERT INTO channel_members (channel_id, user_email)
        VALUES (${generalChannelResult[0].id}, ${data.email})
        ON CONFLICT DO NOTHING
      `;
    }
    
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating limited partner:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}