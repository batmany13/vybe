import { NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function GET() {
  try {
    const result = await sql`
      SELECT 
        lp.id as lp_id,
        lp.name,
        lp.email,
        lp.company,
        COUNT(v.id) as total_votes,
        COALESCE(
          (COUNT(v.id)::float / NULLIF(
            (SELECT COUNT(*) FROM decision_requests WHERE status IN ('voting', 'completed')), 
            0
          ) * 100), 
          0
        ) as response_rate,
        COALESCE(AVG(v.conviction_level), 0) as average_conviction,
        COALESCE(MAX(v.updated_at), lp.created_at) as last_activity
      FROM limited_partners lp
      LEFT JOIN votes v ON lp.id = v.lp_id
      WHERE lp.status = 'active'
      GROUP BY lp.id, lp.name, lp.email, lp.company, lp.created_at
      ORDER BY response_rate DESC, total_votes DESC
    `;
    
    const engagement = result.map(row => ({
      lp_id: row.lp_id,
      name: row.name,
      email: row.email,
      company: row.company,
      total_votes: parseInt(row.total_votes),
      response_rate: parseFloat(row.response_rate),
      average_confidence: parseFloat(row.average_conviction),
      last_activity: row.last_activity
    }));
    
    return NextResponse.json(engagement);
  } catch (error) {
    console.error('Error fetching LP engagement metrics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}