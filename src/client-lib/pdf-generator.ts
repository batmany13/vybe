"use client"

import { Vote } from "@/shared/models";
import { generateText } from "@/client-lib/integrations-client";

// Generate PDF using browser print API
export async function generateSurveyReportPDF(
  dealName: string,
  votes: Vote[],
  dealData: any
): Promise<void> {
  // Generate AI summary
  const aiSummary = await generateAISummary(dealName, votes, dealData);
  
  // Generate the HTML content
  const htmlContent = await generateReportHTML(dealName, votes, dealData, aiSummary);
  
  // Create an iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  document.body.appendChild(iframe);
  
  const iframeWindow = iframe.contentWindow;
  const iframeDocument = iframe.contentDocument || iframeWindow?.document;
  
  if (!iframeDocument || !iframeWindow) {
    document.body.removeChild(iframe);
    throw new Error('Failed to create document');
  }
  
  // Write the HTML with print-specific styles
  iframeDocument.open();
  iframeDocument.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${dealName} - Investment Survey Report</title>
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        
        @media print {
          body { 
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
          .page-break { page-break-after: always; }
          .no-break { page-break-inside: avoid; }
        }
        
        @media screen {
          body {
            margin: 20px;
            max-width: 210mm;
            margin: 0 auto;
          }
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1a202c;
          font-size: 11pt;
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px;
          border-radius: 8px;
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        
        .header h1 {
          margin: 0 0 8px 0;
          font-size: 24pt;
        }
        
        .header .subtitle {
          font-size: 12pt;
          opacity: 0.95;
        }
        
        .ai-summary {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
          border: 2px solid #667eea;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        
        .ai-summary h2 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #667eea;
          font-size: 14pt;
        }
        
        .ai-summary p {
          margin: 10px 0;
          line-height: 1.6;
        }
        
        .ai-summary ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        
        .ai-summary li {
          margin: 6px 0;
          line-height: 1.5;
        }
        
        .deal-info {
          background: #f8f9fa;
          padding: 18px;
          border-radius: 8px;
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        
        .deal-info h2 {
          margin-top: 0;
          margin-bottom: 12px;
          font-size: 14pt;
          color: #2d3748;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .info-row:last-child {
          border-bottom: none;
        }
        
        .info-label {
          font-weight: 600;
          color: #4a5568;
          font-size: 10pt;
        }
        
        .info-value {
          color: #2d3748;
          font-size: 10pt;
          text-align: right;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        
        .metric-card {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          text-align: center;
        }
        
        .metric-card h3 {
          margin: 0 0 8px 0;
          color: #718096;
          font-size: 9pt;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        
        .metric-value {
          font-size: 24pt;
          font-weight: bold;
          color: #2d3748;
          line-height: 1;
        }
        
        .metric-label {
          color: #718096;
          font-size: 9pt;
          margin-top: 4px;
        }
        
        .chart-container {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        
        .chart-container h2 {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 14pt;
          color: #2d3748;
        }
        
        .bar-wrapper {
          margin: 12px 0;
        }
        
        .bar-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 10pt;
        }
        
        .bar-container {
          background: #f1f5f9;
          height: 24px;
          border-radius: 4px;
          position: relative;
          overflow: hidden;
        }
        
        .bar {
          height: 100%;
          border-radius: 4px;
          position: relative;
          transition: none;
        }
        
        .bar-label {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          color: white;
          font-weight: bold;
          font-size: 9pt;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        
        .vote-details {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin-bottom: 25px;
        }
        
        .vote-details h2 {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 14pt;
          color: #2d3748;
        }
        
        .vote-item {
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
          page-break-inside: avoid;
        }
        
        .vote-item:last-child {
          border-bottom: none;
        }
        
        .vote-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        
        .voter-info {
          flex: 1;
        }
        
        .voter-name {
          font-weight: bold;
          color: #2d3748;
          font-size: 11pt;
        }
        
        .voter-title {
          color: #718096;
          font-size: 9pt;
          margin-top: 2px;
        }
        
        .conviction-badge {
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 9pt;
          font-weight: bold;
          white-space: nowrap;
        }
        
        .conviction-1 { background: #fed7d7; color: #c53030; }
        .conviction-2 { background: #feebc8; color: #c05621; }
        .conviction-3 { background: #c6f6d5; color: #276749; }
        .conviction-4 { background: #bee3f8; color: #2c5282; }
        .strong-no { background: #fc8181; color: white; }
        
        .comment-box {
          background: #f8f9fa;
          padding: 10px 12px;
          border-radius: 6px;
          margin-top: 8px;
          font-size: 10pt;
          color: #4a5568;
          border-left: 3px solid #cbd5e0;
        }
        
        .comment-box strong {
          color: #2d3748;
          font-weight: 600;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 9pt;
          color: #718096;
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `);
  iframeDocument.close();
  
  // Wait for content to render
  setTimeout(() => {
    try {
      // Set up for PDF download
      const originalTitle = document.title;
      document.title = `${dealName.replace(/[^a-z0-9]/gi, '_')}_Survey_Report_${new Date().toISOString().split('T')[0]}`;
      
      // Focus the iframe and trigger print
      iframeWindow.focus();
      iframeWindow.print();
      
      // Restore original title
      document.title = originalTitle;
      
      // Clean up iframe after a delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    } catch (error) {
      document.body.removeChild(iframe);
      throw error;
    }
  }, 500);
}

async function generateAISummary(dealName: string, votes: Vote[], dealData: any): Promise<string> {
  try {
    const totalVotes = votes.length;
    const strongYesPlusVotes = votes.filter(v => v.conviction_level === 4).length;
    const strongYesVotes = votes.filter(v => v.conviction_level === 3).length;
    const noVotes = votes.filter(v => v.conviction_level === 1).length;
    const strongNoVotes = votes.filter(v => v.strong_no).length;
    
    const painPointYes = votes.filter(v => v.has_pain_point).length;
    const pilotInterest = votes.filter(v => v.pilot_customer_interest).length;
    const wouldBuy = votes.filter(v => v.would_buy).length;
    
    // Collect CTO testimonials and feedback
    const ctoTestimonials = votes
      .filter(v => (v.comments || v.solution_feedback || v.additional_notes) && v.conviction_level >= 3)
      .slice(0, 3)
      .map(v => {
        const feedback = [v.comments, v.solution_feedback].filter(Boolean)[0] || v.additional_notes || '';
        // Clean up and truncate feedback
        const cleanFeedback = feedback.replace(/"/g, '').trim().substring(0, 100);
        return `${(v as any).lp_company || 'CTO'}: ${cleanFeedback}${feedback.length > 100 ? '...' : ''}`;
      });
    
    const concerns = votes
      .filter(v => (v.comments || v.solution_feedback) && (v.conviction_level <= 2 || v.strong_no))
      .slice(0, 2)
      .map(v => {
        const feedback = v.solution_feedback || v.comments || '';
        return feedback.replace(/"/g, '').trim().substring(0, 80);
      });
    
    const prompt = `
Write a brief, natural summary of CTO feedback for ${dealName}. Keep it conversational and concise.

Survey Data:
- ${totalVotes} CTOs responded
- ${strongYesPlusVotes + strongYesVotes} strongly positive
- ${noVotes + strongNoVotes} not interested
- ${painPointYes} face this problem
- ${pilotInterest} would pilot

Key CTO feedback:
${ctoTestimonials.join('\n')}

${concerns.length > 0 ? `Concerns raised:\n${concerns.join('\n')}` : ''}

Write a short summary (150 words max) that:
- Opens with overall CTO sentiment in 1 sentence
- Lists 3-4 key points as bullet points (very brief, natural language)
- Mentions market validation if strong
- NO recommendations or investment advice
- Sound human and conversational, not AI-generated

Format with <p> and bullet points using <ul><li>. Keep bullets short and punchy.`;

    const result = await generateText(prompt, false, false);
    return result;
  } catch (error) {
    console.error('Error generating AI summary:', error);
    // Fallback to basic summary if AI fails
    const totalVotes = votes.length;
    const strongPositive = votes.filter(v => v.conviction_level >= 3).length;
    const painPoints = votes.filter(v => v.has_pain_point).length;
    const pilots = votes.filter(v => v.pilot_customer_interest).length;
    
    return `
      <p>${totalVotes} CTOs evaluated ${dealName}, with ${strongPositive} showing strong interest.</p>
      <ul>
        <li>Market validation: ${painPoints} CTOs face this exact problem</li>
        <li>Customer interest: ${pilots} willing to run pilots</li>
        <li>Investment sentiment: ${strongPositive > totalVotes/2 ? 'Majority positive' : 'Mixed'} from technical leaders</li>
        ${dealData?.industry ? `<li>Sector: ${dealData.industry} at ${dealData.funding_round || 'early'} stage</li>` : ''}
      </ul>
    `;
  }
}

async function generateReportHTML(dealName: string, votes: Vote[], dealData: any, aiSummary: string): Promise<string> {
  // Calculate metrics
  const totalVotes = votes.length;
  const strongYesPlusVotes = votes.filter(v => v.conviction_level === 4).length;
  const strongYesVotes = votes.filter(v => v.conviction_level === 3).length;
  const followingVotes = votes.filter(v => v.conviction_level === 2).length;
  const noVotes = votes.filter(v => v.conviction_level === 1).length;
  const strongNoVotes = votes.filter(v => v.strong_no).length;
  
  const netScore = (strongYesVotes + strongYesPlusVotes) - strongNoVotes;
  const averageConviction = totalVotes > 0 
    ? (votes.reduce((sum, v) => sum + v.conviction_level, 0) / totalVotes).toFixed(2)
    : '0';
  
  // Calculate customer development metrics
  const painPointYes = votes.filter(v => v.has_pain_point).length;
  const pilotInterest = votes.filter(v => v.pilot_customer_interest).length;
  const wouldBuy = votes.filter(v => v.would_buy).length;

  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
    <div class="header">
      <h1>${dealName}</h1>
      <div class="subtitle">Investment Survey Report - ${currentDate}</div>
    </div>

    <div class="ai-summary">
      <h2>📊 CTO Feedback Summary</h2>
      ${aiSummary}
    </div>

    ${dealData ? `
    <div class="deal-info">
      <h2>Deal Information</h2>
      <div class="info-row">
        <span class="info-label">Company</span>
        <span class="info-value">${dealData.company_name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Industry</span>
        <span class="info-value">${dealData.industry || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Stage</span>
        <span class="info-value">${dealData.funding_round || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Deal Size</span>
        <span class="info-value">$${(dealData.deal_size || 0).toLocaleString()}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Valuation</span>
        <span class="info-value">${dealData.valuation ? `$${dealData.valuation.toLocaleString()}` : 'N/A'}</span>
      </div>
      ${dealData.lead_investor ? `
      <div class="info-row">
        <span class="info-label">Lead Investor</span>
        <span class="info-value">${dealData.lead_investor}</span>
      </div>` : ''}
      ${dealData.safe_or_equity ? `
      <div class="info-row">
        <span class="info-label">Investment Type</span>
        <span class="info-value">${dealData.safe_or_equity}</span>
      </div>` : ''}
    </div>
    ` : ''}

    <div class="metrics-grid">
      <div class="metric-card">
        <h3>Total Responses</h3>
        <div class="metric-value">${totalVotes}</div>
        <div class="metric-label">Partners</div>
      </div>
      
      <div class="metric-card">
        <h3>Net Score</h3>
        <div class="metric-value" style="color: ${netScore >= 0 ? '#38a169' : '#e53e3e'};">
          ${netScore >= 0 ? '+' : ''}${netScore}
        </div>
        <div class="metric-label">(Strong Yes - Strong No)</div>
      </div>
      
      <div class="metric-card">
        <h3>Average Conviction</h3>
        <div class="metric-value">${averageConviction}</div>
        <div class="metric-label">Out of 4.0</div>
      </div>
      
      <div class="metric-card">
        <h3>Strong Interest</h3>
        <div class="metric-value">${strongYesVotes + strongYesPlusVotes}</div>
        <div class="metric-label">LPs (Level 3+)</div>
      </div>
    </div>

    <div class="chart-container">
      <h2>Voting Distribution</h2>
      ${strongYesPlusVotes > 0 ? `
      <div class="bar-wrapper">
        <div class="bar-header">
          <span>Strong Yes + Additional (4)</span>
          <span>${strongYesPlusVotes} votes</span>
        </div>
        <div class="bar-container">
          <div class="bar" style="width: ${(strongYesPlusVotes/totalVotes)*100}%; background: #38a169;">
            <span class="bar-label">${Math.round((strongYesPlusVotes/totalVotes)*100)}%</span>
          </div>
        </div>
      </div>` : ''}
      
      ${strongYesVotes > 0 ? `
      <div class="bar-wrapper">
        <div class="bar-header">
          <span>Strong Yes (3)</span>
          <span>${strongYesVotes} votes</span>
        </div>
        <div class="bar-container">
          <div class="bar" style="width: ${(strongYesVotes/totalVotes)*100}%; background: #48bb78;">
            <span class="bar-label">${Math.round((strongYesVotes/totalVotes)*100)}%</span>
          </div>
        </div>
      </div>` : ''}
      
      ${followingVotes > 0 ? `
      <div class="bar-wrapper">
        <div class="bar-header">
          <span>Following Pack (2)</span>
          <span>${followingVotes} votes</span>
        </div>
        <div class="bar-container">
          <div class="bar" style="width: ${(followingVotes/totalVotes)*100}%; background: #ed8936;">
            <span class="bar-label">${Math.round((followingVotes/totalVotes)*100)}%</span>
          </div>
        </div>
      </div>` : ''}
      
      ${noVotes > 0 ? `
      <div class="bar-wrapper">
        <div class="bar-header">
          <span>No (1)</span>
          <span>${noVotes} votes</span>
        </div>
        <div class="bar-container">
          <div class="bar" style="width: ${(noVotes/totalVotes)*100}%; background: #e53e3e;">
            <span class="bar-label">${Math.round((noVotes/totalVotes)*100)}%</span>
          </div>
        </div>
      </div>` : ''}
      
      ${strongNoVotes > 0 ? `
      <div class="bar-wrapper">
        <div class="bar-header">
          <span>Strong No (Veto)</span>
          <span>${strongNoVotes} votes</span>
        </div>
        <div class="bar-container">
          <div class="bar" style="width: ${(strongNoVotes/totalVotes)*100}%; background: #c53030;">
            <span class="bar-label">${Math.round((strongNoVotes/totalVotes)*100)}%</span>
          </div>
        </div>
      </div>` : ''}
    </div>

    ${(painPointYes > 0 || pilotInterest > 0 || wouldBuy > 0) ? `
    <div class="chart-container">
      <h2>Customer Development Insights</h2>
      
      ${painPointYes > 0 ? `
      <div class="bar-wrapper">
        <div class="bar-header">
          <span>Experience the Pain Point</span>
          <span>${painPointYes} LPs</span>
        </div>
        <div class="bar-container">
          <div class="bar" style="width: ${(painPointYes/totalVotes)*100}%; background: #805ad5;">
            <span class="bar-label">${Math.round((painPointYes/totalVotes)*100)}%</span>
          </div>
        </div>
      </div>` : ''}
      
      ${pilotInterest > 0 ? `
      <div class="bar-wrapper">
        <div class="bar-header">
          <span>Would Be Pilot Customer</span>
          <span>${pilotInterest} LPs</span>
        </div>
        <div class="bar-container">
          <div class="bar" style="width: ${(pilotInterest/totalVotes)*100}%; background: #3182ce;">
            <span class="bar-label">${Math.round((pilotInterest/totalVotes)*100)}%</span>
          </div>
        </div>
      </div>` : ''}
      
      ${wouldBuy > 0 ? `
      <div class="bar-wrapper">
        <div class="bar-header">
          <span>Would Buy the Product</span>
          <span>${wouldBuy} LPs</span>
        </div>
        <div class="bar-container">
          <div class="bar" style="width: ${(wouldBuy/totalVotes)*100}%; background: #38a169;">
            <span class="bar-label">${Math.round((wouldBuy/totalVotes)*100)}%</span>
          </div>
        </div>
      </div>` : ''}
    </div>
    ` : ''}

    <div class="vote-details">
      <h2>Individual LP Feedback</h2>
      ${votes.map((vote: any) => `
        <div class="vote-item">
          <div class="vote-header">
            <div class="voter-info">
              <div class="voter-name">${vote.lp_name || 'Anonymous'}</div>
              <div class="voter-title">${vote.lp_company ? `${vote.lp_company}` : ''}${vote.lp_title ? ` • ${vote.lp_title}` : ''}</div>
            </div>
            <span class="conviction-badge ${vote.strong_no ? 'strong-no' : `conviction-${vote.conviction_level}`}">
              ${vote.strong_no ? 'Strong No' : 
                vote.conviction_level === 4 ? 'Strong Yes +' :
                vote.conviction_level === 3 ? 'Strong Yes' :
                vote.conviction_level === 2 ? 'Following' : 'No'}
            </span>
          </div>
          ${vote.comments ? `
            <div class="comment-box">
              <strong>General Feedback:</strong><br/>
              "${vote.comments}"
            </div>` : ''}
          ${vote.solution_feedback ? `
            <div class="comment-box">
              <strong>Solution Assessment:</strong><br/>
              "${vote.solution_feedback}"
            </div>` : ''}
          ${vote.price_feedback ? `
            <div class="comment-box">
              <strong>Pricing Feedback:</strong><br/>
              "${vote.price_feedback}"
            </div>` : ''}
          ${vote.additional_notes ? `
            <div class="comment-box">
              <strong>Additional Notes:</strong><br/>
              "${vote.additional_notes}"
            </div>` : ''}
        </div>
      `).join('')}
    </div>

    <div class="footer">
      <p>Generated by Gandhi Capital Survey System • ${currentDate}</p>
    </div>
  `;
}