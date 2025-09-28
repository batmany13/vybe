'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/client-lib/auth-client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  createMonthlyUpdate, 
  updateMonthlyUpdate,
  useLimitedPartners,
  useDeals
} from '@/client-lib/api-client';
import { 
  useLemlistCampaigns, 
  addLeadToLemlistCampaign 
} from '@/client-lib/integrations-client';
import { MonthlyUpdate, MonthlyUpdateMetrics, LemlistAddLeadToCampaignInput } from '@/shared/models';
import { toast } from 'sonner';
import { 
  FileText, 
  BarChart3, 
  Users, 
  Send, 
  Check, 
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Briefcase,
  Target,
  Copy,
  Edit3,
  RefreshCw,
  Mail
} from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface ComprehensiveUpdateWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingUpdate?: MonthlyUpdate;
}

type WizardStep = 'create' | 'intro' | 'metrics' | 'whats-next' | 'recipients' | 'email-review' | 'send' | 'complete';

export function ComprehensiveUpdateWizard({ 
  open, 
  onOpenChange, 
  existingUpdate 
}: ComprehensiveUpdateWizardProps) {
  // Core state
  const [currentStep, setCurrentStep] = useState<WizardStep>('create');
  const [createdUpdate, setCreatedUpdate] = useState<MonthlyUpdate | null>(existingUpdate || null);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Create Update
  const [title, setTitle] = useState('');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [content, setContent] = useState('');

  // Step 2: Intro/Email Content
  const [emailIntro, setEmailIntro] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  // Step 3: Metrics
  const [metrics, setMetrics] = useState<MonthlyUpdateMetrics>({
    deals_evaluated: 0,
    new_investments: 0,
    portfolio_companies: 0,
    total_investment_amount: 0
  });
  const [autoCalculatedMetrics, setAutoCalculatedMetrics] = useState<MonthlyUpdateMetrics | null>(null);

  // Step 4: What's Next
  const [portfolioUpdates, setPortfolioUpdates] = useState('');
  const [marketInsights, setMarketInsights] = useState('');
  const [upcomingPipeline, setUpcomingPipeline] = useState('');
  const [lpCallToAction, setLpCallToAction] = useState('');

  // Step 4: Recipients
  const [selectedLPIds, setSelectedLPIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true);

  // Step 5: Send
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [sendResults, setSendResults] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);

  // Data hooks
  const { data: session } = process.env.NODE_ENV === 'production' ? authClient.useSession() : 
    { data: {
        user: {
          name: 'Bruce Wang',
          email: 'byyw13@gmail.com',
          image: undefined,
        }
    }};
  const { data: limitedPartners = [] } = useLimitedPartners();
  const { data: deals = [] } = useDeals();
  const { data: lemlistCampaigns = [] } = useLemlistCampaigns();

  const activeLPs = limitedPartners.filter(lp => lp.status === 'active' && lp.email);
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i + 1);

  // Initialize from existing update
  useEffect(() => {
    if (!open) return;
    if (existingUpdate && !createdUpdate) {
      setTitle(existingUpdate.title);
      setMonth(existingUpdate.month);
      setYear(existingUpdate.year);
      setContent(existingUpdate.content);
      if (existingUpdate.metrics) {
        setMetrics(existingUpdate.metrics);
      }
      setCreatedUpdate(existingUpdate);
      setCurrentStep('intro'); // Skip create step if editing
    }
  }, [open]); // Only depend on open to avoid re-running

  // Auto-calculate metrics based on deals
  useEffect(() => {
    if (!open) return;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Deals evaluated this month based on creation date
    const monthDealsEvaluated = deals.filter(deal => {
      const dealDate = new Date(deal.created_at);
      return dealDate >= startDate && dealDate <= endDate;
    });

    // Investments closed this month based on close_date
    const monthInvestments = deals.filter(d => {
      if (!d.close_date) return false;
      const cd = new Date(d.close_date);
      return cd >= startDate && cd <= endDate && (d.stage === 'signed' || d.stage === 'signed_and_wired');
    });

    const calculated: MonthlyUpdateMetrics = {
      deals_evaluated: monthDealsEvaluated.length,
      new_investments: monthInvestments.length,
      portfolio_companies: deals.filter(d => d.stage === 'signed' || d.stage === 'signed_and_wired').length,
      total_investment_amount: monthInvestments.reduce((sum, d) => sum + (d.deal_size || 0), 0)
    };

    setAutoCalculatedMetrics(calculated);
  }, [deals.length, month, year, open]);

  // Generate email content
  const generateEmailContent = () => {
    const monthName = MONTHS[month - 1];
    const intro = emailIntro || `I hope this message finds you well. Here's our ${monthName} ${year} update.`;

    // Compute investments closed in the selected month using close_date
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const monthInvestments = (deals || []).filter(d => {
      if (!d.close_date) return false;
      const cd = new Date(d.close_date);
      return cd >= startDate && cd <= endDate && (d.stage === 'signed' || d.stage === 'signed_and_wired');
    });
    const investmentsSection = monthInvestments.length > 0
      ? `\n## New investments in ${monthName}\n${monthInvestments.map(d => {
      const oneLiner = d.company_description_short || d.description || '';
      return `• ${d.company_name} — ${oneLiner}`;
    }).join('\n')}\n`
      : '';
    
    return `Dear {{firstName}},

${intro}

## Key Metrics for ${monthName}
• Deals evaluated: ${metrics.deals_evaluated}
• New investments: ${metrics.new_investments}
• Active portfolio companies: ${metrics.portfolio_companies}
• Total invested this month: ${(metrics.total_investment_amount / 1000000).toFixed(1)}M
${investmentsSection}
## Monthly Highlights
${content}

## What's Next
We continue to see strong deal flow and are excited about several opportunities in our pipeline. Our focus remains on identifying exceptional founders building transformative companies.

If you have any questions or would like to discuss any of our portfolio companies in more detail, please don't hesitate to reach out.

Best regards,
{{signature}}

---
This email was sent as part of our regular monthly LP communication.`;
  };

  // Step navigation
  const canProceed = () => {
    switch (currentStep) {
      case 'create':
        return title.trim() && content.trim();
      case 'intro':
        return emailContent.trim() || !isEditingEmail;
      case 'metrics':
        return true; // Metrics are optional
      case 'whats-next':
        return true; // All fields are optional
      case 'recipients':
        return selectedLPIds.length > 0 || selectAll;
      case 'email-review':
        return true; // Can always proceed from email review
      case 'send':
        return selectedCampaignId;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!canProceed()) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsLoading(true);

    try {
      if (currentStep === 'create' && !createdUpdate) {
        // Create the monthly update
        const newUpdate = await createMonthlyUpdate({
          title,
          content,
          month,
          year,
          created_by: session?.user?.email || 'unknown'
        });
        setCreatedUpdate(newUpdate);
        setCurrentStep('intro');
      } else if (currentStep === 'intro') {
        if (!emailContent) {
          setEmailContent(generateEmailContent());
        }
        setCurrentStep('metrics');
      } else if (currentStep === 'metrics') {
        // Save metrics to the update
        if (createdUpdate) {
          await updateMonthlyUpdate(createdUpdate.id, { metrics });
        }
        setCurrentStep('whats-next');
      } else if (currentStep === 'whats-next') {
        setCurrentStep('recipients');
      } else if (currentStep === 'recipients') {
        if (selectAll) {
          setSelectedLPIds(activeLPs.map(lp => lp.id));
        }
        // Generate final email if not already done
        if (!emailContent || emailContent.length < 100) {
          setEmailContent(generateFinalEmail());
        }
        setCurrentStep('email-review');
      } else if (currentStep === 'email-review') {
        setCurrentStep('send');
      } else if (currentStep === 'send') {
        await handleSendCampaign();
      }
    } catch (error) {
      console.error('Error in step:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    const steps: WizardStep[] = ['create', 'intro', 'metrics', 'whats-next', 'recipients', 'email-review', 'send', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSendCampaign = async () => {
    if (!selectedCampaignId || !createdUpdate) {
      toast.error('Please select a Lemlist campaign');
      return;
    }

    // Validate campaign exists
    const campaign = lemlistCampaigns.find(c => c.id === selectedCampaignId);
    if (!campaign) {
      toast.error('Selected campaign not found. Please refresh and try again.');
      return;
    }

    setIsSending(true);
    setSendProgress(0);
    setSendResults([]);

    const lpsToAdd = selectAll ? activeLPs : activeLPs.filter(lp => selectedLPIds.includes(lp.id));
    const results = [];
    
    console.log(`Starting to add ${lpsToAdd.length} LPs to campaign: ${campaign.name} (${selectedCampaignId})`);

    try {
      // First, update the monthly update with the campaign ID
      await updateMonthlyUpdate(createdUpdate.id, { 
        lemlist_campaign_id: selectedCampaignId 
      });

      // Then add each LP to the campaign
      for (let i = 0; i < lpsToAdd.length; i++) {
        const lp = lpsToAdd[i];
        setSendProgress(((i + 1) / lpsToAdd.length) * 100);

        try {
          // Validate required fields
          if (!lp.email || !lp.email.trim()) {
            throw new Error('LP email is required');
          }

          const nameParts = lp.name.split(' ');
          const firstName = nameParts[0] || 'Unknown';
          const lastName = nameParts.slice(1).join(' ') || '';

          // Build input object with required fields only
          const input: any = {
            campaignId: selectedCampaignId,
            email: lp.email.trim(),
          };

          // Add optional fields only if they have actual values
          if (firstName && firstName.trim()) {
            input.firstName = firstName.trim();
          }
          
          if (lastName && lastName.trim()) {
            input.lastName = lastName.trim();
          }
          
          if (lp.company && lp.company.trim()) {
            input.companyName = lp.company.trim();
          }
          
          if (lp.title && lp.title.trim()) {
            input.jobTitle = lp.title.trim();
          }
          
          if (lp.phone && lp.phone.trim()) {
            input.phone = lp.phone.trim();
          }
          
          if (lp.linkedin_url && lp.linkedin_url.trim()) {
            input.linkedinUrl = lp.linkedin_url.trim();
          }
          
          if (emailIntro && emailIntro.trim()) {
            input.icebreaker = emailIntro.trim();
          }

          console.log(`Adding LP to Lemlist:`, { 
            name: lp.name, 
            email: lp.email,
            campaignId: selectedCampaignId,
            input 
          });

          const response = await addLeadToLemlistCampaign(input as LemlistAddLeadToCampaignInput);
          
          results.push({
            lp,
            success: true,
            lemlistId: response.id
          });
        } catch (error: any) {
          console.error(`Failed to add ${lp.name}:`, error);
          
          // Extract more specific error message
          let errorMessage = 'Unknown error';
          if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error?.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error?.message) {
            errorMessage = error.message;
          }
          
          results.push({
            lp,
            success: false,
            error: errorMessage
          });
        }

        // Small delay to avoid rate limiting
        if (i < lpsToAdd.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      setSendResults(results);
      setCurrentStep('complete');

      const successCount = results.filter(r => r.success).length;
      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} LPs to Lemlist campaign!`);
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error('Failed to send campaign');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset all state after dialog animation completes
    setTimeout(() => {
      setCurrentStep('create');
      setCreatedUpdate(null);
      setTitle('');
      setContent('');
      setEmailIntro('');
      setEmailContent('');
      setIsEditingEmail(false);
      setMetrics({
        deals_evaluated: 0,
        new_investments: 0,
        portfolio_companies: 0,
        total_investment_amount: 0
      });
      setPortfolioUpdates('');
      setMarketInsights('');
      setUpcomingPipeline('');
      setLpCallToAction('');
      setSelectedLPIds([]);
      setSelectAll(true);
      setSelectedCampaignId('');
      setSendResults([]);
      setAutoCalculatedMetrics(null);
    }, 300);
  };

  const getStepNumber = () => {
    const steps: WizardStep[] = ['create', 'intro', 'metrics', 'whats-next', 'recipients', 'email-review', 'send'];
    return steps.indexOf(currentStep) + 1;
  };

  // Generate final email with all personalization
  const generateFinalEmail = () => {
    const monthName = MONTHS[month - 1];
    const intro = emailIntro || `I hope this message finds you well. Here's our ${monthName} ${year} update.`;
    
    // Get portfolio highlights from content
    const portfolioHighlights = content || 'Our portfolio companies continue to show strong growth and traction.';
    
    // Compute investments closed in the selected month using close_date
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const monthInvestments = (deals || []).filter(d => {
      if (!d.close_date) return false;
      const cd = new Date(d.close_date);
      return cd >= startDate && cd <= endDate && (d.stage === 'signed' || d.stage === 'signed_and_wired');
    });
    const investmentsText = monthInvestments.length > 0
      ? `\n## 🧾 New investments in ${monthName}\n${monthInvestments.map(d => {
      const oneLiner = d.company_description_short || d.description || '';
      return `• ${d.company_name} — ${oneLiner}`;
    }).join('\n')}\n`
      : '';
    
    return `Dear {{firstName}},

${intro}

## 📊 Key Metrics for ${monthName} ${year}
• **Deals evaluated:** ${metrics.deals_evaluated}
• **New investments:** ${metrics.new_investments}
• **Active portfolio companies:** ${metrics.portfolio_companies}
• **Total invested this month:** ${(metrics.total_investment_amount / 1000000).toFixed(1)}M
${investmentsText}
## 🚀 Monthly Highlights
${portfolioHighlights}

## 💡 What We're Seeing
The market continues to present exciting opportunities, particularly in AI infrastructure and enterprise automation. We're seeing strong founder quality and more reasonable valuations compared to last year.

## 🎯 Portfolio Updates
Our portfolio companies raised over $50M in follow-on funding this month, with two companies reaching significant revenue milestones. We're particularly excited about the traction we're seeing in our recent investments.

## 👀 Looking Ahead
We have several promising deals in our pipeline for next month, including opportunities in:
• Enterprise AI/ML platforms
• Developer tools and infrastructure
• Vertical SaaS solutions

If you know any exceptional founders building in these spaces, we'd love to connect with them.

## 🤝 How You Can Help
• **Introductions:** Connect us with talented founders in your network
• **Expertise:** Share your insights on deals in your domain
• **Feedback:** Let us know what you'd like to see in these updates

Thank you for your continued support and partnership. If you have any questions or would like to discuss any of our portfolio companies in more detail, please don't hesitate to reach out.

Best regards,
{{signature}}

P.S. Save the date - our next LP meeting will be on {{meeting_date}}. More details to follow.

*This email was sent as part of our regular monthly LP communication. To update your preferences, please reply to this email.*`;
  };

  // Convert email to HTML preview
  const convertToHTMLPreview = (content: string) => {
    return content
      // Handle headers with emoji
      .replace(/## (.*?)(?=\n|$)/g, '<h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin: 24px 0 12px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">$1</h2>')
      
      // Handle bullet points with bold markers
      .replace(/^• \*\*(.*?)\*\*: (.*?)(?=\n|$)/gm, '<div style="margin: 8px 0; padding-left: 24px; position: relative;"><span style="position: absolute; left: 0; color: #3b82f6;">•</span><strong style="color: #1f2937;">$1:</strong> <span style="color: #4b5563;">$2</span></div>')
      .replace(/^• (.*?)(?=\n|$)/gm, '<div style="margin: 8px 0; padding-left: 24px; position: relative;"><span style="position: absolute; left: 0; color: #3b82f6;">•</span>$1</div>')
      
      // Handle bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #1f2937; font-weight: 600;">$1</strong>')
      
      // Handle template variables
      .replace(/\{\{(.*?)\}\}/g, '<span style="background-color: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 14px; font-weight: 500;">{{$1}}</span>')
      
      // Handle P.S.
      .replace(/(P\.S\. .*?)(?=\n|$)/g, '<p style="margin: 20px 0; color: #6b7280; font-style: italic;">$1</p>')
      
      // Handle signature
      .replace(/(Best regards,)/g, '<div style="margin-top: 32px; color: #1f2937;"><p style="margin: 0; font-weight: 500;">$1</p></div>')
      
      // Handle footer text in italics
      .replace(/\*(.*?)\*/g, '<em style="color: #6b7280;">$1</em>')
      
      // Handle paragraphs
      .replace(/\n\n/g, '</p><p style="margin: 16px 0; color: #374151; line-height: 1.7;">')
      .replace(/\n/g, '<br>')
      
      // Wrap in paragraph if needed
      .replace(/^(?!<)/, '<p style="margin: 16px 0; color: #374151; line-height: 1.7;">')
      .replace(/(?!.*<\/p>)$/, '</p>');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Monthly Update Wizard</DialogTitle>
          <DialogDescription>
            Complete workflow to create and send your monthly LP update
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        {currentStep !== 'complete' && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step {getStepNumber()} of 7</span>
              <span className="capitalize">{currentStep.replace('-', ' ')}</span>
            </div>
            <Progress value={(getStepNumber() / 7) * 100} />
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Step 1: Create Update */}
          {currentStep === 'create' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Step 1: Create Monthly Update
                  </CardTitle>
                  <CardDescription>
                    Create the core content for your monthly update
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Update Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={`${MONTHS[month - 1]} ${year} Fund Update`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="month">Month</Label>
                      <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((m, i) => (
                            <SelectItem key={i} value={(i + 1).toString()}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="year">Year</Label>
                      <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((y) => (
                            <SelectItem key={y} value={y.toString()}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="content">Update Content *</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Share your monthly highlights, portfolio updates, and strategic insights..."
                      rows={10}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be the main body of your update
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Email Intro */}
          {currentStep === 'intro' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="h-5 w-5" />
                    Step 2: Customize Email Introduction
                  </CardTitle>
                  <CardDescription>
                    Add a personal introduction to your email
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="intro">Email Introduction (Optional)</Label>
                    <Textarea
                      id="intro"
                      value={emailIntro}
                      onChange={(e) => setEmailIntro(e.target.value)}
                      placeholder="Dear LPs, I hope this message finds you well..."
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave blank to use the default introduction
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Email Preview</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEmailContent(generateEmailContent())}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Generate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingEmail(!isEditingEmail)}
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          {isEditingEmail ? 'Preview' : 'Edit'}
                        </Button>
                      </div>
                    </div>
                    
                    {isEditingEmail ? (
                      <Textarea
                        value={emailContent}
                        onChange={(e) => setEmailContent(e.target.value)}
                        rows={12}
                        className="font-mono text-sm"
                      />
                    ) : (
                      <div className="border rounded-lg p-4 bg-muted/50 max-h-[400px] overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm">
                          {emailContent || generateEmailContent()}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Review Metrics */}
          {currentStep === 'metrics' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Step 3: Review & Adjust Metrics
                  </CardTitle>
                  <CardDescription>
                    Confirm or adjust the metrics for this month
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {autoCalculatedMetrics && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        We've auto-calculated metrics based on your deal data for {MONTHS[month - 1]} {year}.
                        You can adjust these values if needed.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deals_evaluated">
                        <Target className="h-4 w-4 inline mr-1" />
                        Deals Evaluated
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="deals_evaluated"
                          type="number"
                          value={metrics.deals_evaluated}
                          onChange={(e) => setMetrics({
                            ...metrics,
                            deals_evaluated: parseInt(e.target.value) || 0
                          })}
                        />
                        {autoCalculatedMetrics && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMetrics({
                              ...metrics,
                              deals_evaluated: autoCalculatedMetrics.deals_evaluated
                            })}
                          >
                            Use {autoCalculatedMetrics.deals_evaluated}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="new_investments">
                        <TrendingUp className="h-4 w-4 inline mr-1" />
                        New Investments
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="new_investments"
                          type="number"
                          value={metrics.new_investments}
                          onChange={(e) => setMetrics({
                            ...metrics,
                            new_investments: parseInt(e.target.value) || 0
                          })}
                        />
                        {autoCalculatedMetrics && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMetrics({
                              ...metrics,
                              new_investments: autoCalculatedMetrics.new_investments
                            })}
                          >
                            Use {autoCalculatedMetrics.new_investments}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="portfolio_companies">
                        <Briefcase className="h-4 w-4 inline mr-1" />
                        Portfolio Companies
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="portfolio_companies"
                          type="number"
                          value={metrics.portfolio_companies}
                          onChange={(e) => setMetrics({
                            ...metrics,
                            portfolio_companies: parseInt(e.target.value) || 0
                          })}
                        />
                        {autoCalculatedMetrics && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMetrics({
                              ...metrics,
                              portfolio_companies: autoCalculatedMetrics.portfolio_companies
                            })}
                          >
                            Use {autoCalculatedMetrics.portfolio_companies}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="total_investment">
                        <DollarSign className="h-4 w-4 inline mr-1" />
                        Total Investment ($)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="total_investment"
                          type="number"
                          value={metrics.total_investment_amount}
                          onChange={(e) => setMetrics({
                            ...metrics,
                            total_investment_amount: parseInt(e.target.value) || 0
                          })}
                        />
                        {autoCalculatedMetrics && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMetrics({
                              ...metrics,
                              total_investment_amount: autoCalculatedMetrics.total_investment_amount
                            })}
                          >
                            Use ${(autoCalculatedMetrics.total_investment_amount / 1000000).toFixed(1)}M
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-3">Metrics Summary</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Deals Evaluated:</span>
                          <span className="font-medium">{metrics.deals_evaluated}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">New Investments:</span>
                          <span className="font-medium">{metrics.new_investments}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Portfolio Companies:</span>
                          <span className="font-medium">{metrics.portfolio_companies}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Investment:</span>
                          <span className="font-medium">
                            ${(metrics.total_investment_amount / 1000000).toFixed(1)}M
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: What's Next */}
          {currentStep === 'whats-next' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Step 4: Personalize "What's Next"
                  </CardTitle>
                  <CardDescription>
                    Customize the forward-looking sections of your update
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Market Insights */}
                  <div>
                    <Label htmlFor="market-insights">
                      💡 Market Insights & Trends
                    </Label>
                    <Textarea
                      id="market-insights"
                      value={marketInsights}
                      onChange={(e) => setMarketInsights(e.target.value)}
                      placeholder="What trends are you seeing in the market? What opportunities are emerging? What's your thesis on the current environment?"
                      rows={4}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Share your perspective on market conditions and opportunities
                    </p>
                  </div>

                  {/* Portfolio Updates */}
                  <div>
                    <Label htmlFor="portfolio-updates">
                      🎯 Portfolio Company Updates
                    </Label>
                    <Textarea
                      id="portfolio-updates"
                      value={portfolioUpdates}
                      onChange={(e) => setPortfolioUpdates(e.target.value)}
                      placeholder="Key milestones, funding rounds, revenue achievements, product launches, team expansions..."
                      rows={4}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Highlight recent achievements and progress from portfolio companies
                    </p>
                  </div>

                  {/* Upcoming Pipeline */}
                  <div>
                    <Label htmlFor="upcoming-pipeline">
                      👀 Looking Ahead - Pipeline & Opportunities
                    </Label>
                    <Textarea
                      id="upcoming-pipeline"
                      value={upcomingPipeline}
                      onChange={(e) => setUpcomingPipeline(e.target.value)}
                      placeholder="What sectors are you excited about? What types of companies are you looking to invest in? Any specific areas where you're seeking deals?"
                      rows={4}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Describe your investment focus and upcoming opportunities
                    </p>
                  </div>

                  {/* LP Call to Action */}
                  <div>
                    <Label htmlFor="lp-call-to-action">
                      🤝 How LPs Can Help
                    </Label>
                    <Textarea
                      id="lp-call-to-action"
                      value={lpCallToAction}
                      onChange={(e) => setLpCallToAction(e.target.value)}
                      placeholder="• Introduce exceptional founders in [specific sectors]
• Share expertise in [specific domains]
• Connect with portfolio companies needing [specific help]"
                      rows={4}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Specific ways LPs can support the fund and portfolio
                    </p>
                  </div>

                  {/* Template Suggestions */}
                  <Card className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-sm">Quick Templates</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          setMarketInsights("We're seeing increased activity in AI infrastructure, with valuations becoming more reasonable. Founders are focusing on sustainable growth over growth-at-all-costs, which aligns well with our investment thesis.");
                          toast.success('Market insights template applied');
                        }}
                      >
                        <TrendingUp className="h-3 w-3 mr-2" />
                        Use Market Insights Template
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          setPortfolioUpdates("Several portfolio companies hit major milestones this month:\n• Company A closed their Series B at a $100M valuation\n• Company B launched their enterprise product with 3 Fortune 500 pilots\n• Company C grew revenue 3x year-over-year");
                          toast.success('Portfolio updates template applied');
                        }}
                      >
                        <Briefcase className="h-3 w-3 mr-2" />
                        Use Portfolio Template
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          setUpcomingPipeline("We're actively evaluating opportunities in:\n• Developer tools and infrastructure\n• Vertical SaaS for regulated industries\n• AI-powered enterprise automation\n• Climate tech with immediate revenue potential");
                          toast.success('Pipeline template applied');
                        }}
                      >
                        <Target className="h-3 w-3 mr-2" />
                        Use Pipeline Template
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          setLpCallToAction("• **Introductions:** If you know exceptional founders building in enterprise SaaS or AI infrastructure, we'd love to connect\n• **Expertise:** We're evaluating deals in healthcare and fintech - your domain expertise would be invaluable\n• **Portfolio Support:** Several companies are hiring senior engineers and looking for customer introductions");
                          toast.success('Call to action template applied');
                        }}
                      >
                        <Users className="h-3 w-3 mr-2" />
                        Use Call-to-Action Template
                      </Button>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 5: Select Recipients */}
          {currentStep === 'recipients' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Step 5: Review Recipients
                  </CardTitle>
                  <CardDescription>
                    Select which Partners will receive this update
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="select-all"
                        checked={selectAll}
                        onChange={(e) => {
                          setSelectAll(e.target.checked);
                          if (e.target.checked) {
                            setSelectedLPIds(activeLPs.map(lp => lp.id));
                          } else {
                            setSelectedLPIds([]);
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor="select-all">
                        Select all active LPs ({activeLPs.length})
                      </Label>
                    </div>
                    <Badge variant="secondary">
                      {selectAll ? activeLPs.length : selectedLPIds.length} selected
                    </Badge>
                  </div>

                  <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                    <div className="p-4 space-y-2">
                      {activeLPs.map((lp) => (
                        <div key={lp.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded">
                          <input
                            type="checkbox"
                            checked={selectAll || selectedLPIds.includes(lp.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLPIds([...selectedLPIds, lp.id]);
                              } else {
                                setSelectedLPIds(selectedLPIds.filter(id => id !== lp.id));
                                setSelectAll(false);
                              }
                            }}
                            className="rounded"
                            disabled={selectAll}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{lp.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {lp.company} • {lp.email}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            ${(lp.investment_amount / 1000000).toFixed(1)}M
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Alert>
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                      Selected LPs will be added to your Lemlist campaign. 
                      Make sure your email content is finalized before proceeding.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 5: Email Review */}
          {currentStep === 'email-review' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Step 6: Review Final Email
                  </CardTitle>
                  <CardDescription>
                    Review how your email will look when sent to LPs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                      <Badge variant="secondary">
                        {selectAll ? activeLPs.length : selectedLPIds.length} Recipients
                      </Badge>
                      <Badge variant="outline">
                        {MONTHS[month - 1]} {year}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmailContent(generateFinalEmail());
                          toast.success('Email template refreshed');
                        }}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Refresh Template
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingEmail(!isEditingEmail)}
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        {isEditingEmail ? 'Preview' : 'Edit'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(emailContent);
                            toast.success('Email content copied to clipboard');
                          } catch (error) {
                            toast.error('Failed to copy email content');
                          }
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>

                  {/* Email Preview/Edit */}
                  {isEditingEmail ? (
                    <div>
                      <Label>Edit Email Content</Label>
                      <Textarea
                        value={emailContent}
                        onChange={(e) => setEmailContent(e.target.value)}
                        rows={20}
                        className="font-mono text-sm"
                        placeholder="Email content..."
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Use markdown formatting. Variables like {"{{firstName}}"} will be personalized for each recipient.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Label>Email Preview</Label>
                      <div className="border rounded-lg bg-white dark:bg-gray-950 shadow-sm">
                        {/* Email Header */}
                        <div className="border-b px-6 py-4 bg-gray-50 dark:bg-gray-900">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                            <span className="text-xs text-muted-foreground">Email Preview</span>
                          </div>
                        </div>
                        
                        {/* Email Metadata */}
                        <div className="px-6 py-3 border-b bg-gray-50/50 dark:bg-gray-900/50">
                          <div className="space-y-1 text-sm">
                            <div className="flex gap-2">
                              <span className="font-medium text-muted-foreground">From:</span>
                              <span>Your Fund Name &lt;updates@yourfund.com&gt;</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="font-medium text-muted-foreground">To:</span>
                              <span className="text-blue-600">{"{{firstName}} {{lastName}} <{{email}}>"}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="font-medium text-muted-foreground">Subject:</span>
                              <span>{title}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Email Body */}
                        <div className="px-6 py-6 max-h-[500px] overflow-y-auto">
                          <div 
                            dangerouslySetInnerHTML={{ 
                              __html: convertToHTMLPreview(emailContent) 
                            }}
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              fontSize: '15px',
                              lineHeight: '1.7',
                              color: '#1f2937'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Key Information */}
                  <Card className="bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Email Personalization
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>
                            <strong>{"{{firstName}}"}</strong> will be replaced with each LP's first name
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>
                            <strong>{"{{signature}}"}</strong> will be replaced with your email signature
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>
                            <strong>{"{{meeting_date}}"}</strong> can be customized in Lemlist
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>
                            Metrics are automatically included from your inputs
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 6: Send Campaign */}
          {currentStep === 'send' && !isSending && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Step 7: Select Lemlist Campaign
                  </CardTitle>
                  <CardDescription>
                    Choose the Lemlist campaign to add your LPs to
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="campaign">Lemlist Campaign *</Label>
                    <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        {lemlistCampaigns.map((campaign) => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            {campaign.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      LPs will be added as leads to this campaign
                    </p>
                  </div>

                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-3">Ready to Send</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Monthly update created: "{title}"</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Email content prepared</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Metrics added: {metrics.deals_evaluated} deals, {metrics.new_investments} investments</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>{selectAll ? activeLPs.length : selectedLPIds.length} recipients selected</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Alert>
                    <Send className="h-4 w-4" />
                    <AlertDescription>
                      Clicking "Send Update" will:
                      <ol className="list-decimal ml-4 mt-2">
                        <li>Save your monthly update with metrics</li>
                        <li>Add all selected LPs to your Lemlist campaign</li>
                        <li>You'll need to go to Lemlist to start the actual email sequence</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sending Progress */}
          {isSending && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h3 className="text-xl font-medium">Sending Update to Lemlist...</h3>
              <Progress value={sendProgress} className="w-full max-w-sm" />
              <p className="text-sm text-muted-foreground">
                Adding Limited Partners to campaign...
              </p>
            </div>
          )}

          {/* Complete */}
          {currentStep === 'complete' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <Check className="h-5 w-5" />
                    Monthly Update Sent Successfully!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 className="font-medium mb-2">What happens next:</h4>
                    <ol className="list-decimal ml-4 space-y-1 text-sm">
                      <li>Your monthly update has been saved with all metrics</li>
                      <li>{sendResults.filter(r => r.success).length} LPs have been added to your Lemlist campaign</li>
                      <li>Go to Lemlist to review and start your email sequence</li>
                      <li>Track engagement and responses in Lemlist</li>
                    </ol>
                  </div>

                  {sendResults.some(r => !r.success) && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {sendResults.filter(r => !r.success).length} LPs could not be added to the campaign.
                        Please check Lemlist or try adding them manually.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => window.open('https://app.lemlist.com', '_blank')}
                    >
                      Open Lemlist
                    </Button>
                    <Button onClick={handleClose}>
                      Done
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {currentStep !== 'complete' && !isSending && (
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 'create' || isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {currentStep === 'send' ? 'Send Update' : 'Next'}
                {currentStep !== 'send' && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}