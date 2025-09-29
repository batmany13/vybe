"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText,
  Mail,
  Download,
  Sparkles,
  Send,
  Copy,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { toast } from 'sonner';
import { generateText, sendGmailEmail } from '@/client-lib/integrations-client';
import { useSelectedLP } from '@/contexts/SelectedLPContext';

interface DealSummaryDialogProps {
  deal: any; // Deal with all necessary information
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DealSummaryDialog({ deal, open, onOpenChange }: DealSummaryDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [summary, setSummary] = useState('');
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  
  const { selectedLP } = useSelectedLP();

  const generateSummary = async () => {
    setIsGenerating(true);
    try {
      // Create a comprehensive prompt with all deal information
      const prompt = `
Create a professional, executive-level investment summary for ${deal.company_name}. This will be shared with potential co-investors and stakeholders.

Company Information:
- Name: ${deal.company_name}
- Industry: ${deal.industry || 'Not specified'}
- Stage: ${deal.funding_round || 'Not specified'}
- Location: ${deal.founders_location || deal.company_base_location || 'Not specified'}
- Deal Size: $${deal.deal_size?.toLocaleString() || 'Not specified'}
- Valuation: ${deal.valuation ? `$${deal.valuation.toLocaleString()}` : 'Not disclosed'}
- Lead Investor: ${deal.lead_investor || 'Not specified'}
- Investment Type: ${deal.safe_or_equity || 'Not specified'}

Company Description:
${deal.description || 'No description available'}

One-liner: ${deal.company_description_short || 'Not provided'}

Why Gandhi Capital is excited:
${deal.excitement_note || 'Not provided'}

Why this is a good fit for our fund:
${deal.why_good_fit || 'Not provided'}

Traction & Progress:
${deal.traction_progress || 'Not provided'}

Founding Team Location: ${deal.founders_location || 'Not specified'}
Company Base: ${deal.company_base_location || 'Not specified'}

Revenue Status: ${deal.has_revenue ? `Yes${deal.revenue_amount ? ` - $${deal.revenue_amount.toLocaleString()}` : ''}` : 'No'}

Fundraising Progress:
${deal.raising_amount ? `Raising: $${deal.raising_amount.toLocaleString()}` : 'Not specified'}
${deal.confirmed_amount ? `Confirmed: $${deal.confirmed_amount.toLocaleString()}` : ''}

Co-investors: ${deal.co_investors?.join(', ') || 'None disclosed'}

Please create a compelling, professional 2-3 paragraph investment summary that:

1. Opens with a strong, clear value proposition and market opportunity
2. Highlights key traction, team strengths, and competitive advantages
3. Explains why this investment fits our thesis and timeline
4. Mentions key financial metrics and fundraising status
5. Maintains a confident but balanced tone suitable for co-investors

Format as clean paragraphs without bullets or special formatting. Keep it concise but compelling - suitable for executive briefing or email sharing.
`;

      const result = await generateText(prompt, false, false);
      setSummary(result);
      
      // Auto-populate email subject
      if (!emailSubject) {
        setEmailSubject(`Investment Opportunity: ${deal.company_name} - ${deal.funding_round || 'Series'} Round`);
      }
      
      toast.success('Summary generated successfully!');
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Create HTML content for PDF
      const htmlContent = createPDFHTML();
      
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
      
      // Write the HTML
      iframeDocument.open();
      iframeDocument.write(htmlContent);
      iframeDocument.close();
      
      // Wait for content to render, then print
      setTimeout(() => {
        try {
          const originalTitle = document.title;
          document.title = `${deal.company_name.replace(/[^a-z0-9]/gi, '_')}_Investment_Summary_${new Date().toISOString().split('T')[0]}`;
          
          iframeWindow.focus();
          iframeWindow.print();
          
          document.title = originalTitle;
          
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        } catch (error) {
          document.body.removeChild(iframe);
          throw error;
        }
      }, 500);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const sendEmail = async () => {
    if (!emailRecipients.trim()) {
      toast.error('Please enter at least one email recipient');
      return;
    }
    
    if (!summary.trim()) {
      toast.error('Please generate a summary first');
      return;
    }

    if (!selectedLP?.email) {
      toast.error('Unable to determine sender email');
      return;
    }

    setIsSendingEmail(true);
    try {
      const recipients = emailRecipients.split(',').map(email => email.trim()).filter(email => email);
      
      const emailBody = `
${summary}

---

Deal Details:
• Company: ${deal.company_name}
• Industry: ${deal.industry || 'Not specified'}
• Stage: ${deal.funding_round || 'Not specified'}
• Deal Size: $${deal.deal_size?.toLocaleString() || 'Not specified'}
• Valuation: ${deal.valuation ? `$${deal.valuation.toLocaleString()}` : 'Not disclosed'}
• Lead Investor: ${deal.lead_investor || 'Not specified'}

${deal.company_url ? `Company Website: ${deal.company_url}` : ''}

---

Best regards,
${selectedLP.name}
Gandhi Capital

This summary was generated using our deal analysis platform.
      `.trim();

      // Send to each recipient
      for (const recipient of recipients) {
        await sendGmailEmail(
          selectedLP.email,
          recipient,
          emailSubject,
          emailBody
        );
      }
      
      toast.success(`Email sent successfully to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}!`);
      setEmailRecipients('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const copyToClipboard = async () => {
    if (!summary.trim()) {
      toast.error('Please generate a summary first');
      return;
    }

    try {
      await navigator.clipboard.writeText(summary);
      setCopiedText(true);
      toast.success('Summary copied to clipboard!');
      
      setTimeout(() => {
        setCopiedText(false);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const createPDFHTML = () => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${deal.company_name} - Investment Summary</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    
    @media print {
      body { 
        margin: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        color-adjust: exact;
      }
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a202c;
      font-size: 12pt;
      margin: 0;
      padding: 0;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
      text-align: center;
    }
    
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28pt;
      font-weight: bold;
    }
    
    .header .subtitle {
      font-size: 14pt;
      opacity: 0.9;
      margin: 0;
    }
    
    .summary-section {
      background: #f8f9fa;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 30px;
      border-left: 4px solid #667eea;
    }
    
    .summary-section h2 {
      margin-top: 0;
      margin-bottom: 20px;
      color: #667eea;
      font-size: 16pt;
    }
    
    .summary-text {
      font-size: 12pt;
      line-height: 1.7;
      color: #2d3748;
    }
    
    .deal-details {
      background: white;
      padding: 25px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      margin-bottom: 30px;
    }
    
    .deal-details h2 {
      margin-top: 0;
      margin-bottom: 20px;
      color: #2d3748;
      font-size: 16pt;
    }
    
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    
    .detail-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .detail-item:last-child {
      border-bottom: none;
    }
    
    .detail-label {
      font-weight: 600;
      color: #4a5568;
    }
    
    .detail-value {
      color: #2d3748;
      text-align: right;
      max-width: 60%;
    }
    
    .full-width {
      grid-column: 1 / -1;
    }
    
    .description-section {
      background: white;
      padding: 25px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      margin-bottom: 30px;
    }
    
    .description-section h3 {
      margin-top: 0;
      margin-bottom: 15px;
      color: #2d3748;
      font-size: 14pt;
    }
    
    .description-text {
      color: #4a5568;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      font-size: 10pt;
      color: #718096;
    }
    
    .gandhi-branding {
      margin-top: 20px;
      font-weight: 600;
      color: #667eea;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${deal.company_name}</h1>
    <p class="subtitle">Investment Summary • ${currentDate}</p>
  </div>

  <div class="summary-section">
    <h2>Executive Summary</h2>
    <div class="summary-text">
      ${summary || 'Summary not available'}
    </div>
  </div>

  <div class="deal-details">
    <h2>Deal Overview</h2>
    <div class="details-grid">
      <div class="detail-item">
        <span class="detail-label">Industry</span>
        <span class="detail-value">${deal.industry || 'Not specified'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Stage</span>
        <span class="detail-value">${deal.funding_round || 'Not specified'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Deal Size</span>
        <span class="detail-value">$${deal.deal_size?.toLocaleString() || 'Not specified'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Valuation</span>
        <span class="detail-value">${deal.valuation ? `$${deal.valuation.toLocaleString()}` : 'Not disclosed'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Lead Investor</span>
        <span class="detail-value">${deal.lead_investor || 'Not specified'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Investment Type</span>
        <span class="detail-value">${deal.safe_or_equity || 'Not specified'}</span>
      </div>
      ${deal.raising_amount ? `
      <div class="detail-item">
        <span class="detail-label">Raising Amount</span>
        <span class="detail-value">$${deal.raising_amount.toLocaleString()}</span>
      </div>
      ` : ''}
      ${deal.confirmed_amount ? `
      <div class="detail-item">
        <span class="detail-label">Confirmed Amount</span>
        <span class="detail-value">$${deal.confirmed_amount.toLocaleString()}</span>
      </div>
      ` : ''}
      <div class="detail-item full-width">
        <span class="detail-label">Location</span>
        <span class="detail-value">${deal.founders_location || deal.company_base_location || 'Not specified'}</span>
      </div>
      ${deal.company_url ? `
      <div class="detail-item full-width">
        <span class="detail-label">Website</span>
        <span class="detail-value">${deal.company_url}</span>
      </div>
      ` : ''}
    </div>
  </div>

  ${deal.description ? `
  <div class="description-section">
    <h3>Company Overview</h3>
    <div class="description-text">${deal.description}</div>
  </div>
  ` : ''}

  ${deal.excitement_note ? `
  <div class="description-section">
    <h3>Investment Thesis</h3>
    <div class="description-text">${deal.excitement_note}</div>
  </div>
  ` : ''}

  ${deal.traction_progress ? `
  <div class="description-section">
    <h3>Traction & Progress</h3>
    <div class="description-text">${deal.traction_progress}</div>
  </div>
  ` : ''}

  <div class="footer">
    <p>This investment summary was generated by Gandhi Capital's deal analysis platform.</p>
    <div class="gandhi-branding">GANDHI CAPITAL</div>
  </div>
</body>
</html>
    `;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Deal Summary: {deal.company_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Generate Summary Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI-Generated Summary
              </CardTitle>
              <CardDescription>
                Create a professional investment summary using GenAI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={generateSummary}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Summary...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Executive Summary
                  </>
                )}
              </Button>

              {summary && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Generated Summary
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                        className="flex items-center gap-1"
                      >
                        {copiedText ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-line">
                      {summary}
                    </div>
                  </div>
                  
                  <Textarea
                    placeholder="Edit the generated summary if needed..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={8}
                    className="min-h-[200px]"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions Section */}
          {summary && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* PDF Export */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Export as PDF
                  </CardTitle>
                  <CardDescription>
                    Generate a professional PDF report
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={generatePDF}
                    disabled={isGeneratingPDF}
                    className="w-full"
                    variant="outline"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Email Sharing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-green-600" />
                    Send via Email
                  </CardTitle>
                  <CardDescription>
                    Share summary with co-investors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-subject">Subject</Label>
                    <Input
                      id="email-subject"
                      placeholder="Email subject line"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email-recipients">Recipients</Label>
                    <Input
                      id="email-recipients"
                      placeholder="email1@example.com, email2@example.com"
                      value={emailRecipients}
                      onChange={(e) => setEmailRecipients(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate multiple emails with commas
                    </p>
                  </div>

                  <Button 
                    onClick={sendEmail}
                    disabled={isSendingEmail || !emailRecipients.trim()}
                    className="w-full"
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Email
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Deal Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Deal Overview</CardTitle>
              <CardDescription>
                Key information included in the summary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Industry:</span>
                    <span>{deal.industry || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Stage:</span>
                    <span>{deal.funding_round || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Deal Size:</span>
                    <span>${deal.deal_size?.toLocaleString() || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Valuation:</span>
                    <span>{deal.valuation ? `$${deal.valuation.toLocaleString()}` : 'Not disclosed'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Lead Investor:</span>
                    <span>{deal.lead_investor || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <span>{deal.safe_or_equity || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Revenue:</span>
                    <span>
                      {deal.has_revenue ? 
                        (deal.revenue_amount ? `$${deal.revenue_amount.toLocaleString()}` : 'Yes') : 
                        'No'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Location:</span>
                    <span>{deal.founders_location || deal.company_base_location || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {!summary && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Generate a summary first to unlock PDF export and email sharing features.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}