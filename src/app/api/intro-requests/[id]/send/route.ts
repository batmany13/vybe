import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/server-lib/neon';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: voteId } = await params;
    const data = await request.json();
    const { message, lp_email, founder_emails } = data;

    // First, check if an introduction request record exists
    const existing = await sql`
      SELECT * FROM introduction_requests WHERE vote_id = ${voteId}
    `;

    if (existing.length === 0) {
      // Create a new introduction request record
      await sql`
        INSERT INTO introduction_requests (vote_id, status, sent_at, intro_message)
        VALUES (${voteId}, 'sent', NOW(), ${message})
      `;
    } else {
      // Update existing record
      await sql`
        UPDATE introduction_requests 
        SET status = 'sent', sent_at = NOW(), intro_message = ${message}
        WHERE vote_id = ${voteId}
      `;
    }

    // In a real implementation, you would send the email here
    // For now, we'll just log it
    console.log('Sending introduction email:', {
      to: [lp_email, ...founder_emails],
      message
    });

    // TODO: Integrate with email service (Gmail, SendGrid, etc.)
    // Example with Gmail integration:
    // await sendGmailEmail({
    //   to: [lp_email, ...founder_emails].join(', '),
    //   subject: `Introduction: ${lp_name} <> ${company_name}`,
    //   body: message
    // });

    return NextResponse.json({ success: true, message: 'Introduction sent successfully' });
  } catch (error) {
    console.error('Error sending introduction:', error);
    return NextResponse.json({ error: 'Failed to send introduction' }, { status: 500 });
  }
}