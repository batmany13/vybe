'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useLimitedPartners } from '@/client-lib/api-client';
import { useLemlistCampaigns, addLeadToLemlistCampaign } from '@/client-lib/integrations-client';
import { MonthlyUpdate, LemlistAddLeadToCampaignInput } from '@/shared/models';
import { 
  Users, 
  Mail, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Target,
  ArrowRight,
  Copy,
  FileText,
  Edit3
} from 'lucide-react';
import { toast } from 'sonner';

interface LaunchCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  update: MonthlyUpdate | null;
}

interface LaunchResult {
  lp_id: string;
  name: string;
  email: string;
  success: boolean;
  lemlist_id?: string;
  error?: string;
}

export function LaunchCampaignDialog({ open, onOpenChange, update }: LaunchCampaignDialogProps) {
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchResults, setLaunchResults] = useState<LaunchResult[]>([]);
  const [step, setStep] = useState<'preview' | 'email-preview' | 'launching' | 'results'>('preview');
  const [currentLPIndex, setCurrentLPIndex] = useState(0);
  const [emailContent, setEmailContent] = useState('');
  const [emailContentInitialized, setEmailContentInitialized] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const { data: limitedPartners } = useLimitedPartners();
  const { data: lemlistCampaigns } = useLemlistCampaigns();

  const activeLPs = limitedPartners?.filter(lp => lp.status === 'active' && lp.email) || [];
  const campaign = lemlistCampaigns?.find(c => c.id === update?.lemlist_campaign_id);

  // Generate default email content based on the monthly update
  const generateEmailContent = useCallback(() => {
    if (!update) return '';
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[update.month - 1] || 'this month';
    
    // Use metrics from update if available, otherwise use placeholders
    const metrics = update.metrics;
    const dealsEvaluated = metrics?.deals_evaluated || '[Deals Evaluated]';
    const dealsInvested = metrics?.new_investments || '[Deals Invested]';
    const activeDealCount = metrics?.portfolio_companies || '[X]';
    
    return `Hey all,

Below is an update for the month of ${monthName}.

## Key Metrics for ${monthName}
• Deals evaluated: ${dealsEvaluated}
• New investments: ${dealsInvested}
• Active portfolio companies: ${activeDealCount}

## Monthly Update
${update.content}

## New Investments This Month 🚀
• **TechFlow AI** - Series A $2M - AI-powered customer service automation platform helping enterprises reduce support costs by 40%
• **DataSecure** - Seed $500K - Real-time data pipeline management tool for modern engineering teams

## Current Portfolio Companies
• **MobilityNext** - Electric vehicle fleet management platform for logistics companies
• **VirtualMeet** - Immersive virtual meeting platform with spatial audio and collaboration tools

If you have any questions, please don't hesitate to reach out.

Cheers,
Quang Hoang || Cofounder & CEO @ Vybe || GP @ CTO Fund

---
This email was sent as part of our regular investor communication.`;
  }, [update]);

  // Initialize email content when dialog opens
  useEffect(() => {
    if (update && open && !emailContentInitialized) {
      setEmailContent(generateEmailContent());
      setEmailContentInitialized(true);
    }
  }, [update, open, emailContentInitialized, generateEmailContent]);

  // Convert plain text email content to formatted HTML
  const convertToHTML = (content: string) => {
    return content
      // Handle headers
      .replace(/## (.*?)(?=\n|$)/g, '<h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 20px 0 10px 0;">$1</h2>')
      
      // Handle bullet points
      .replace(/^• (.*?)(?=\n|$)/gm, '<div style="margin: 5px 0; padding-left: 20px; position: relative;"><span style="position: absolute; left: 0; color: #3b82f6;">•</span>$1</div>')
      

      
      // Handle placeholders
      .replace(/\[(.*?)\]/g, '<span style="background-color: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 12px;">[Customize: $1]</span>')
      
      // Handle signature
      .replace(/(Cheers,\nQuang Hoang \|\| Cofounder & CEO @ Vybe \|\| GP @ CTO Fund)/g, '<div style="margin-top: 30px; color: #1f2937;"><p style="margin: 0; font-weight: 500;">Cheers,</p><p style="margin: 5px 0 0 0; color: #6b7280;">Quang Hoang || Cofounder & CEO @ Vybe || GP @ CTO Fund</p></div>')
      
      // Handle footer
      .replace(/---\n(.*?)$/g, '<hr style="margin: 30px 0 20px 0; border: none; border-top: 1px solid #e5e7eb;"><p style="margin: 0; color: #6b7280; font-size: 12px; font-style: italic;">$1</p>')
      
      // Handle double line breaks (paragraphs)
      .replace(/\n\n/g, '</p><p style="margin: 15px 0; color: #1f2937; line-height: 1.6;">')
      
      // Handle single line breaks
      .replace(/\n/g, '<br>')
      
      // Wrap everything in a paragraph if it doesn't start with a tag
      .replace(/^(?!<)/, '<p style="margin: 15px 0; color: #1f2937; line-height: 1.6;">')
      
      // Close the last paragraph if needed
      .replace(/(?!.*<\/p>)$/, '</p>');
  };

  const getFormattedHTML = () => {
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 8px;">
        ${convertToHTML(emailContent)}
      </div>`;
    return htmlContent;
  };

  const handleCopyEmailContent = async () => {
    try {
      const htmlContent = getFormattedHTML();

      // Try to write both plain text and HTML to clipboard
      if (navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': new Blob([emailContent], { type: 'text/plain' }),
            'text/html': new Blob([htmlContent], { type: 'text/html' })
          })
        ]);
      } else {
        // Fallback for older browsers
        await navigator.clipboard.writeText(emailContent);
      }
      
      toast.success('Formatted email HTML copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy email content:', error);
      
      // Fallback method using execCommand (deprecated but still works)
      try {
        const htmlContent = getFormattedHTML();
        const textArea = document.createElement('textarea');
        textArea.value = htmlContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success('Email content copied to clipboard!');
      } catch (fallbackError) {
        toast.error('Failed to copy email content');
      }
    }
  };

  const handleProceedToEmailPreview = () => {
    if (!emailContent && !emailContentInitialized) {
      setEmailContent(generateEmailContent());
      setEmailContentInitialized(true);
    }
    setStep('email-preview');
  };

  const handleResetTemplate = () => {
    // Force reset by clearing all state
    setEmailContentInitialized(false);
    setEmailContent('');
    
    // Use setTimeout to ensure state is cleared before generating new content
    setTimeout(() => {
      const newContent = generateEmailContent();
      console.log('Generating new content:', newContent); // Debug log
      setEmailContent(newContent);
      setEmailContentInitialized(true);
      setIsEditingEmail(false); // Switch to preview mode to see changes
      toast.success('Template reset with latest content!');
    }, 100);
  };

  const handleLaunchCampaign = async () => {
    if (!update?.lemlist_campaign_id) {
      toast.error('No Lemlist campaign associated with this update');
      return;
    }

    setStep('launching');
    setIsLaunching(true);
    setCurrentLPIndex(0);
    setLaunchResults([]);
    
    const results: LaunchResult[] = [];

    try {
      for (let i = 0; i < activeLPs.length; i++) {
        const lp = activeLPs[i];
        setCurrentLPIndex(i + 1);

        try {
          // Split name into first and last name
          const nameParts = lp.name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          const input: LemlistAddLeadToCampaignInput = {
            campaignId: update.lemlist_campaign_id,
            firstName: firstName,
            lastName: lastName,
            email: lp.email,
            companyName: lp.company,
            jobTitle: lp.title,
            phone: lp.phone || undefined,
            linkedinUrl: lp.linkedin_url || undefined,
            icebreaker: `LP interested in ${update.title}`,
          };

          const lemlistResponse = await addLeadToLemlistCampaign(input);
          
          results.push({
            lp_id: lp.id,
            name: lp.name,
            email: lp.email,
            success: true,
            lemlist_id: lemlistResponse.id,
          });

          console.log(`Successfully added ${lp.name} (${lp.email}) to campaign`);
        } catch (error) {
          console.error(`Failed to add ${lp.name} (${lp.email}) to campaign:`, error);
          results.push({
            lp_id: lp.id,
            name: lp.name,
            email: lp.email,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          });
        }

        // Small delay between requests to avoid rate limiting
        if (i < activeLPs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setLaunchResults(results);
      setStep('results');

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(
          `Successfully added ${successCount} LPs to your Lemlist campaign! Go to Lemlist to review and start your campaign.`
        );
        if (failureCount > 0) {
          toast.warning(`${failureCount} LPs could not be added to the campaign.`);
        }
      } else {
        toast.error('No LPs were successfully added to the campaign');
      }
    } catch (error) {
      console.error('Error launching campaign:', error);
      toast.error('Failed to launch campaign');
      setStep('preview');
    } finally {
      setIsLaunching(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after a short delay to allow dialog to close smoothly
    setTimeout(() => {
      setStep('preview');
      setLaunchResults([]);
      setCurrentLPIndex(0);
      setIsLaunching(false);
      setEmailContent('');
      setEmailContentInitialized(false);
      setIsEditingEmail(false);
    }, 200);
  };

  if (!update) return null;

  const successCount = launchResults.filter(r => r.success).length;
  const failureCount = launchResults.filter(r => !r.success).length;
  const progressPercentage = activeLPs.length > 0 ? (currentLPIndex / activeLPs.length) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Launch Lemlist Campaign
          </DialogTitle>
          <DialogDescription>
            {step === 'preview' && 'Review your campaign settings and preview email content before adding LPs to Lemlist'}
            {step === 'email-preview' && 'Copy the email template to paste in Lemlist, then add Partners to your campaign'}
            {step === 'launching' && 'Adding all active Partners to the selected Lemlist campaign'}
            {step === 'results' && 'Campaign launch completed - review the results'}
          </DialogDescription>
        </DialogHeader>

        {step === 'preview' && (
          <div className="space-y-6">
            {/* Campaign Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5" />
                  Campaign Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Monthly Update
                    </label>
                    <p className="text-sm font-medium">{update.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Lemlist Campaign
                    </label>
                    <p className="text-sm font-medium">
                      {campaign?.name || update.lemlist_campaign_id}
                    </p>
                    {campaign?.status && (
                      <Badge variant="outline" className="mt-1">
                        {campaign.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LPs Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Partners to Add
                  <Badge variant="secondary">{activeLPs.length} LPs</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeLPs.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {activeLPs.slice(0, 6).map((lp) => (
                        <div key={lp.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{lp.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {lp.company}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{lp.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {activeLPs.length > 6 && (
                      <div className="text-center py-2 text-sm text-gray-600 dark:text-gray-400">
                        And {activeLPs.length - 6} more Partners...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No Active LPs Found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      No active Partners with email addresses were found to add to the campaign.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleProceedToEmailPreview}
                disabled={activeLPs.length === 0 || !update.lemlist_campaign_id}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Preview Email Content
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'email-preview' && (
          <div className="space-y-6">
            {/* Email Content Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="h-5 w-5" />
                  Email Content Preview
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Review and edit the email content that will be used as a template for your Lemlist campaign.
                  You can copy this content and paste it directly into Lemlist.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Email Template</label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetTemplate}
                        className="flex items-center gap-1"
                      >
                        <ArrowRight className="h-3 w-3 rotate-90" />
                        Reset Template
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingEmail(!isEditingEmail)}
                        className="flex items-center gap-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        {isEditingEmail ? 'Preview' : 'Edit'}
                      </Button>
                    </div>
                  </div>
                  
                  {isEditingEmail ? (
                    <Textarea
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      rows={15}
                      placeholder="Enter your email content here..."
                      className="font-mono text-sm"
                    />
                  ) : (
                    <div className="border rounded-lg p-4 bg-white min-h-[400px] max-h-[500px] overflow-y-auto">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: convertToHTML(emailContent) 
                        }} 
                        className="prose max-w-none"
                      />
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    <strong>Tip:</strong> {isEditingEmail ? 'Use markdown-style headers (##) and bullet points (•). ' : 'This is how your email will look in Lemlist. '}
                    Yellow highlighted areas are placeholders you can customize.
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Copy Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Edit3 className="h-5 w-5" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Copy Email Content</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Click the copy button below to copy this email template to your clipboard
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Create or Update Lemlist Campaign</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Go to Lemlist and paste the content into your campaign's email sequence
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Add Partners</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Continue with the launch process to automatically add all {activeLPs.length} active LPs to your Lemlist campaign
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setStep('preview')}
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back to Campaign Overview
              </Button>
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline"
                  onClick={handleCopyEmailContent}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Formatted HTML
                </Button>
                <Button 
                  onClick={handleLaunchCampaign}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Add LPs to Lemlist ({activeLPs.length} LPs)
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'launching' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h3 className="text-xl font-medium">Adding LPs to Lemlist...</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
              Adding Partners to "{campaign?.name || update.lemlist_campaign_id}" campaign
            </p>
            
            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{currentLPIndex} of {activeLPs.length}</span>
              </div>
              <Progress value={progressPercentage} className="w-full" />
            </div>
            
            {currentLPIndex > 0 && currentLPIndex <= activeLPs.length && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Adding: {activeLPs[currentLPIndex - 1]?.name}
              </p>
            )}
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center max-w-md">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Next:</strong> Go to Lemlist to review your leads and start the campaign
              </p>
            </div>
            
            <p className="text-xs text-gray-500">This may take a few moments...</p>
          </div>
        )}

        {step === 'results' && (
          <div className="space-y-6">
            {/* Results Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {successCount > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  LPs Added to Lemlist Campaign
                </CardTitle>
                {successCount > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
                    <p className="text-green-700 dark:text-green-300 text-sm">
                      <strong>Next Step:</strong> Go to your Lemlist campaign "{campaign?.name || update.lemlist_campaign_id}" to review the leads and start your outreach sequence.
                    </p>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {activeLPs.length}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Total LPs</div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {successCount}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">Successfully Added</div>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {failureCount}
                    </div>
                    <div className="text-sm text-red-600 dark:text-red-400">Failed</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  LP Addition Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {launchResults.map((result) => (
                      <TableRow key={result.lp_id}>
                        <TableCell className="font-medium">{result.name}</TableCell>
                        <TableCell>{result.email}</TableCell>
                        <TableCell>
                          {result.success ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Added
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {result.success && result.lemlist_id ? (
                            <span className="text-green-600 dark:text-green-400">
                              ID: {result.lemlist_id}
                            </span>
                          ) : result.error ? (
                            <span className="text-red-600 dark:text-red-400">
                              {result.error}
                            </span>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end">
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}