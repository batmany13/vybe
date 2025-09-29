'use client';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
  import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/client-lib/utils';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { 
  ArrowLeft,
  ExternalLink,
  User,
  Building2,
  DollarSign,
  MapPin,
  Calendar,
  TrendingUp,
  Users,
  Link as LinkIcon,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Minus,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Vote as VoteIcon,
  Eye,
  EyeOff,
  AlertTriangle,
  Lightbulb,
  Shield,
  Globe,
  Rocket,
  Target,
  Package,
  Briefcase,
  Heart,
  Star,
  ChevronRight,
  Info,
  FileText,
  PlayCircle,
  Linkedin,
  CalendarCheck,
  Edit,

} from 'lucide-react';
import { useDeal, useLimitedPartners, updateDeal, useDealLinks } from '@/client-lib/api-client';

import { VotingDialog } from '@/components/voting/VotingDialog';
import { SurveyReportButton } from '@/components/deals/SurveyReportButton';
import { FounderMeetingIndicator } from '@/components/deals/FounderMeetingIndicator';
import { EditDealDialog } from '@/components/deals/EditDealDialog';

import { DealSummaryDialog } from '@/components/deals/DealSummaryDialog';
import { 
  CompanyDetailsSection, 
  FoundingTeamSection, 
  InvestmentDetailsCard,
  PitchDeckEmbed,
  DemoEmbed
} from '@/components/deals/DealComponents';
import { useSelectedLP } from '@/contexts/SelectedLPContext';
import Link from 'next/link';
import { DealWithVotes } from '@/shared/models';
import { toast } from 'sonner';
import { TextWithLinks } from '@/client-lib/link-parser';

export default function DealDetailsPage() {
  const [isEditingCloseDate, setIsEditingCloseDate] = useState(false);
  const [closeDateDraft, setCloseDateDraft] = useState<string>('');
  const params = useParams();
  const dealId = params?.id as string;

  const [isVotingDialogOpen, setIsVotingDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);

  const { data: deal, isLoading, error } = useDeal(dealId);
  const { data: lps = [] } = useLimitedPartners();
  const { data: dealLinks = [] } = useDealLinks(dealId);
  const responsesRef = useRef<HTMLDivElement | null>(null);
  
  // Import the selected LP context
  const { selectedLP } = useSelectedLP();

  // Check if user is general or venture partner (for edit permissions)
  const isPartner = selectedLP && (selectedLP.partner_type === 'general_partner' || selectedLP.partner_type === 'venture_partner');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStageColor = (stage: string) => {
    const colors = {
      'sourcing': 'bg-slate-500',
      'screening': 'bg-blue-500', 
      'due_diligence': 'bg-amber-500',
      'term_sheet': 'bg-violet-500',
      'closed_won': 'bg-emerald-500',
      'closed_lost': 'bg-red-500',
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-500';
  };

  const getStageIcon = (stage: string) => {
    const icons = {
      'sourcing': Target,
      'screening': Eye, 
      'due_diligence': Shield,
      'term_sheet': FileText,
      'closed_won': CheckCircle,
      'closed_lost': XCircle,
    };
    const Icon = icons[stage as keyof typeof icons] || Target;
    return <Icon className="h-4 w-4" />;
  };

  const getVotingProgress = (deal: DealWithVotes) => {
    const totalVotes = deal.total_votes || 0;
    const positiveVotes = (deal.strong_yes_plus_votes || 0) + (deal.strong_yes_votes || 0);
    if (totalVotes === 0) return 0;
    return (positiveVotes / totalVotes) * 100;
  };

  const getConvictionIcon = (level: number) => {
    if (level === 4) return <Star className="h-4 w-4 fill-current" />;
    if (level === 3) return <ThumbsUp className="h-4 w-4" />;
    if (level === 2) return <Minus className="h-4 w-4" />;
    return <ThumbsDown className="h-4 w-4" />;
  };

  const getConvictionColor = (level?: number, reviewStatus?: string) => {
    if (reviewStatus === 'to_review') return 'text-gray-600 bg-gray-50 border-gray-200';
    if (!level) return 'text-gray-600 bg-gray-50 border-gray-200';
    if (level === 4) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (level === 3) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (level === 2) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  // Helper function to get conviction level display text
  const getConvictionLevelText = (level?: number, strongNo?: boolean, reviewStatus?: string) => {
    if (reviewStatus === 'to_review') return 'To Review';
    if (strongNo) return '1 - Strong no';
    if (!level) return '';
    const labels = {
      4: '4 - Strong yes',
      3: '3 - Leaning yes', 
      2: '2 - Leaning no',
      1: '1 - Strong no'
    };
    return labels[level as keyof typeof labels] || `${level}`;
  };

  // Build embed info for demo URLs
  const getDemoEmbed = (url?: string): { kind: 'iframe' | 'video'; src: string; title: string } | null => {
    if (!url) return null;
    try {
      const u = new URL(url);
      const host = u.hostname.toLowerCase();
      // YouTube
      if (host.includes('youtube.com') || host.includes('youtu.be')) {
        let id = '';
        if (host.includes('youtu.be')) {
          id = u.pathname.replace('/', '').split('/')[0] || '';
        } else {
          id = u.searchParams.get('v') || '';
          if (!id) {
            const parts = u.pathname.split('/').filter(Boolean);
            const idx = parts.findIndex(p => p === 'embed' || p === 'shorts' || p === 'watch');
            if (idx >= 0 && parts[idx + 1]) id = parts[idx + 1] || '';
          }
        }
        if (id) {
          return { kind: 'iframe', src: `https://www.youtube.com/embed/${id}`, title: 'YouTube demo' };
        }
      }
      // Vimeo
      if (host.includes('vimeo.com')) {
        const id = u.pathname.split('/').filter(Boolean)[0] || '';
        if (id && /^(\d+)$/.test(id)) {
          return { kind: 'iframe', src: `https://player.vimeo.com/video/${id}`, title: 'Vimeo demo' };
        }
      }
      // Loom
      if (host.includes('loom.com')) {
        const parts = u.pathname.split('/').filter(Boolean);
        const shareIdx = parts.findIndex(p => p === 'share');
        const id = shareIdx >= 0 ? (parts[shareIdx + 1] || '') : '';
        if (id) {
          return { kind: 'iframe', src: `https://www.loom.com/embed/${id}`, title: 'Loom demo' };
        }
      }
      // Direct video file (mp4/webm/ogg)
      if (/\.(mp4|webm|ogg)$/i.test(u.pathname)) {
        return { kind: 'video', src: url, title: 'Product demo' };
      }
      // Fallback: use iframe if same-origin embeddable
      return { kind: 'iframe', src: url, title: 'Product demo' };
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Deal Not Found</h2>
          <p className="text-muted-foreground">The deal you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/deals">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Deals
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const founders = deal.founders || [];
  const votes = deal.votes || [];

  // Calculate survey metrics
  const surveyMetrics = {
    hasPainPoint: votes.filter(v => v.has_pain_point === true).length,
    pilotInterest: votes.filter(v => v.pilot_customer_interest === true).length,
    wouldBuy: votes.filter(v => v.would_buy === true).length,
    hasNotes: votes.filter(v => v.additional_notes && v.additional_notes.trim().length > 0).length,
  };

  const demoEmbed = getDemoEmbed(deal.demo_url);
  
  // Check if current LP has already voted
  const hasUserVoted = selectedLP && deal.votes?.some(v => v.lp_id === selectedLP.id);
  const userVote = selectedLP && deal.votes?.find(v => v.lp_id === selectedLP.id);
  
  // Check if the user has completed their review (not just submitted)
  const hasCompletedReview = userVote && !userVote.review_status;

  const displayCloseDateIso = deal.close_date ?? ((deal.stage === 'signed' || deal.stage === 'signed_and_wired') ? deal.updated_at : undefined);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
                <Link href="/deals">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Deals
                </Link>
              </Button>
              
              <div className="space-y-3 sm:space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">{deal.company_name}</h1>
                  <Badge className={`${getStageColor(deal.stage)} text-white border-0 self-start sm:self-auto`}>
                    {getStageIcon(deal.stage)}
                    <span className="ml-1">{deal.stage.replace('_', ' ')}</span>
                  </Badge>
                  {/* Show meeting indicator for sourcing stages */}
                  {['sourcing_meeting_booked', 'sourcing_meeting_done_deciding'].includes(deal.stage) && (
                    <FounderMeetingIndicator deal={deal} />
                  )}
                </div>
                
                {/* Mobile: Row layout for metadata */}
                <div className="flex flex-col gap-2 sm:hidden">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Industry</span>
                    <span className="text-sm font-medium">{deal.industry}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Round</span>
                    <span className="text-sm font-medium">{deal.funding_round}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Date</span>
                    <span className="text-sm font-medium">{formatDate(deal.created_at)}</span>
                  </div>
                  {deal.survey_deadline && (
                    (() => {
                      const due = new Date(deal.survey_deadline as string);
                      const today = new Date();
                      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
                      const msPerDay = 1000 * 60 * 60 * 24;
                      const daysLeft = Math.ceil((due.getTime() - startOfToday) / msPerDay);
                      const overdue = daysLeft < 0;
                      return (
                        <div className="flex items-center justify-between py-2 border-b">
                          <span className="text-sm text-muted-foreground">Survey</span>
                          <span className={cn("text-sm font-medium", overdue ? "text-red-600" : "text-foreground")}>
                            {overdue ? `Overdue by ${Math.abs(daysLeft)}d` : `Due in ${daysLeft}d`}
                          </span>
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* Desktop: Icon layout for metadata */}
                <div className="hidden sm:flex items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {deal.industry}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {deal.funding_round}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(deal.created_at)}
                  </span>
                  {deal.survey_deadline && (
                    (() => {
                      const due = new Date(deal.survey_deadline as string);
                      const today = new Date();
                      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
                      const msPerDay = 1000 * 60 * 60 * 24;
                      const daysLeft = Math.ceil((due.getTime() - startOfToday) / msPerDay);
                      const overdue = daysLeft < 0;
                      return (
                        <span className={cn("flex items-center gap-1", overdue ? "text-red-600" : "text-foreground") }>
                          <Clock className="h-4 w-4" />
                          Survey {overdue ? `overdue by ${Math.abs(daysLeft)}d` : `due in ${daysLeft}d`}
                        </span>
                      );
                    })()
                  )}
                </div>

                {deal.company_description_short && (
                  <p className="text-sm sm:text-lg text-muted-foreground max-w-3xl mt-3">
                    {deal.company_description_short}
                  </p>
                )}
              </div>
            </div>

            <div className="hidden sm:flex gap-2">
              {isPartner && (
                <>
                  <Button 
                    onClick={() => setIsEditDialogOpen(true)} 
                    className="shadow-lg"
                    variant="secondary"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Deal
                  </Button>
                  <Button 
                    onClick={() => setIsSummaryDialogOpen(true)} 
                    className="shadow-lg"
                    variant="secondary"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Summary
                  </Button>
                </>
              )}
              {hasCompletedReview ? (
                <Button 
                  onClick={() => setIsVotingDialogOpen(true)} 
                  className="shadow-lg"
                  variant="outline"
                >
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Review Completed
                </Button>
              ) : (
                <Button onClick={() => setIsVotingDialogOpen(true)} className="shadow-lg">
                  <VoteIcon className="h-4 w-4 mr-2" />
                  {hasUserVoted ? 'Review Submitted' : 'Review Company'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Your Survey Response */}
        {hasUserVoted && userVote && (
          <Alert className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="ml-2">
              <AlertDescription>
                <strong className="font-semibold text-lg text-green-900 dark:text-green-100">Review Submitted</strong>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        userVote.review_status === 'to_review' && "border-gray-500 text-gray-700 bg-gray-50",
                        userVote.conviction_level === 4 && !userVote.review_status && "border-emerald-500 text-emerald-700 bg-emerald-50",
                        userVote.conviction_level === 3 && !userVote.review_status && "border-blue-500 text-blue-700 bg-blue-50",
                        userVote.conviction_level === 2 && !userVote.review_status && "border-amber-500 text-amber-700 bg-amber-50",
                        userVote.conviction_level === 1 && !userVote.review_status && "border-red-500 text-red-700 bg-red-50",
                        userVote.strong_no && !userVote.review_status && "border-red-700 text-red-900 bg-red-100"
                      )}
                    >
                      {getConvictionLevelText(userVote.conviction_level, userVote.strong_no, userVote.review_status)}
                    </Badge>
                    <span className="text-sm text-green-700 dark:text-green-200">
                      Submitted on {formatDate(userVote.created_at)}
                    </span>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-green-700 dark:text-green-300 p-0 h-auto"
                    onClick={() => setIsVotingDialogOpen(true)}
                  >
                    View or edit your response →
                  </Button>
                </div>
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Mobile Actions */}
        <div className="sm:hidden mb-4 space-y-2">
          {isPartner && (
            <>
              <Button 
                onClick={() => setIsEditDialogOpen(true)} 
                className="w-full shadow-lg" 
                size="lg"
                variant="secondary"
              >
                <Edit className="h-5 w-5 mr-2" />
                Edit Deal
              </Button>
              <Button 
                onClick={() => setIsSummaryDialogOpen(true)} 
                className="w-full shadow-lg" 
                size="lg"
                variant="secondary"
              >
                <FileText className="h-5 w-5 mr-2" />
                Create Summary
              </Button>
            </>
          )}
          {hasCompletedReview ? (
            <Button 
              onClick={() => setIsVotingDialogOpen(true)} 
              className="w-full shadow-lg" 
              size="lg"
              variant="outline"
            >
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Review Completed
            </Button>
          ) : (
            <Button onClick={() => setIsVotingDialogOpen(true)} className="w-full shadow-lg" size="lg">
              <VoteIcon className="h-5 w-5 mr-2" />
              {hasUserVoted ? 'Review Submitted' : 'Review Company'}
            </Button>
          )}
        </div>
        {/* Invested Deal Notice */}
        {(deal.stage === 'signed' || deal.stage === 'signed_and_wired') && (
          <Alert className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CalendarCheck className="h-5 w-5 text-green-600" />
            <div className="ml-2">
              <AlertDescription className="text-green-900 dark:text-green-100">
                <strong className="font-semibold text-lg">Investment Completed</strong>
                <p className="mt-1 text-green-700 dark:text-green-200">
                  This deal was closed on <strong>{displayCloseDateIso ? formatDate(displayCloseDateIso) : '—'}</strong>. 
                  All information below reflects the state of the company as of the closing date.
                </p>
                {deal.stage === 'signed' && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-300">
                    Status: Documents signed, awaiting wire transfer
                  </p>
                )}
                {deal.stage === 'signed_and_wired' && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-300">
                    Status: Investment fully completed with funds transferred
                  </p>
                )}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Details using shared component */}
            <CompanyDetailsSection deal={deal} dealLinks={dealLinks} />

            {/* Founding Team using shared component */}
            <FoundingTeamSection 
              founders={founders}
              foundersLocation={deal.founders_location}
              companyBaseLocation={deal.company_base_location}
              founderNotes={(deal.votes || [])
                .map(vote => {
                  const lp = lps.find(l => l.id === vote.lp_id);
                  const voteWithFounderNotes = vote as any;
                  if (!voteWithFounderNotes.founder_specific_notes || !lp) return null;
                  
                  try {
                    const founderSpecificNotes = JSON.parse(voteWithFounderNotes.founder_specific_notes);
                    return Object.entries(founderSpecificNotes)
                      .filter(([_, note]) => note && (note as string).trim())
                      .map(([founderId, note]) => ({ 
                        lpName: lp.name, 
                        note: (note as string).trim(), 
                        founderId 
                      }));
                  } catch (e) {
                    return null;
                  }
                })
                .filter(Boolean)
                .flat()}
            />

            {/* Pitch Deck Embed using shared component */}
            {deal.pitch_deck_url && (
              <PitchDeckEmbed pitchDeckUrl={deal.pitch_deck_url} />
            )}

            {/* Product Demo Embed using shared component */}
            {demoEmbed && (
              <DemoEmbed demoEmbed={demoEmbed} />
            )}


          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Investment Details */}
            <Card className="overflow-hidden border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Investment Details
                </CardTitle>
                {(deal.stage === 'signed' || deal.stage === 'signed_and_wired') && (
                  <CardDescription className="mt-2 flex items-center gap-2">
                    <CalendarCheck className="h-3 w-3 text-green-600" />
                    <span className="text-green-700 dark:text-green-400 font-medium">
                      Closed on {displayCloseDateIso ? formatDate(displayCloseDateIso) : '—'}
                    </span>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Amount we're considering investing</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(deal.deal_size)}</p>
                </div>
                
                {deal.valuation && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Valuation</p>
                    <p className="text-xl font-semibold">{formatCurrency(deal.valuation)}</p>
                  </div>
                )}

                {(deal.stage === 'signed' || deal.stage === 'signed_and_wired') && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Close Date</p>
                    {!isEditingCloseDate ? (
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{displayCloseDateIso ? formatDate(displayCloseDateIso) : '—'}</p>
                        <Button size="sm" variant="outline" onClick={() => {
                          const defaultIso = displayCloseDateIso ?? new Date().toISOString();
                          const d = new Date(defaultIso);
                          const yyyy = d.getFullYear();
                          const mm = String(d.getMonth() + 1).padStart(2, '0');
                          const dd = String(d.getDate()).padStart(2, '0');
                          setCloseDateDraft(`${yyyy}-${mm}-${dd}`);
                          setIsEditingCloseDate(true);
                        }}>Edit</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          className="border rounded-md p-2 text-sm bg-background"
                          value={closeDateDraft}
                          onChange={(e) => setCloseDateDraft(e.target.value)}
                        />
                        <Button size="sm" onClick={async () => {
                          try {
                            if (!closeDateDraft) {
                              await updateDeal(dealId, { close_date: null as any });
                            } else {
                              const iso = new Date(`${closeDateDraft}T00:00:00Z`).toISOString();
                              await updateDeal(dealId, { close_date: iso });
                            }
                            toast.success('Close date updated');
                            setIsEditingCloseDate(false);
                          } catch (e) {
                            toast.error('Failed to update close date');
                          }
                        }}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditingCloseDate(false)}>Cancel</Button>
                      </div>
                    )}
                  </div>
                )}
                
                <Separator />
                
                {/* Funding Progress Section */}
                {deal.raising_amount && (
                  <div className="space-y-4">
                    {(() => {
                      const raisingAmount = deal.raising_amount || 0;
                      const confirmedAmount = deal.confirmed_amount || 0;
                      const percentage = raisingAmount > 0 ? (confirmedAmount / raisingAmount) * 100 : 0;
                      const isOversubscribed = confirmedAmount > raisingAmount;
                      const oversubscribedPercentage = isOversubscribed ? ((confirmedAmount - raisingAmount) / raisingAmount) * 100 : 0;
                      const remainingPercentage = !isOversubscribed ? Math.max(0, 100 - percentage) : 0;
                      
                      return (
                        <>
                          {/* Funding Stats */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                Funding Progress
                                {isOversubscribed ? (
                                  <span className="ml-2 text-xs text-emerald-600">
                                    (+{oversubscribedPercentage.toFixed(0)}% oversubscribed)
                                  </span>
                                ) : (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    ({remainingPercentage.toFixed(0)}% remaining)
                                  </span>
                                )}
                              </span>
                              <span className={cn(
                                "text-sm font-bold",
                                isOversubscribed ? "text-emerald-600" : percentage >= 75 ? "text-blue-600" : percentage >= 50 ? "text-amber-600" : "text-muted-foreground"
                              )}>
                                {percentage.toFixed(0)}%
                              </span>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="relative">
                              <div className="h-8 bg-muted rounded-lg overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full transition-all duration-500 relative",
                                    isOversubscribed 
                                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600" 
                                      : percentage >= 75 
                                        ? "bg-gradient-to-r from-blue-500 to-blue-600"
                                        : percentage >= 50
                                          ? "bg-gradient-to-r from-amber-500 to-amber-600"
                                          : "bg-gradient-to-r from-gray-400 to-gray-500"
                                  )}
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                >
                                  {percentage >= 10 && (
                                    <div className="absolute inset-0 flex items-center justify-end pr-2">
                                      <span className="text-xs font-medium text-white">
                                        {percentage.toFixed(0)}%
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Oversubscribed Extension */}
                              {isOversubscribed && (
                                <div 
                                  className="absolute top-0 left-full h-8 bg-gradient-to-r from-emerald-400 to-emerald-500 animate-pulse rounded-r-lg"
                                  style={{ 
                                    width: `${Math.min(oversubscribedPercentage, 100)}%`
                                  }}
                                />
                              )}
                            </div>
                            
                            {/* Amount Details */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Target</p>
                                <p className="text-sm font-semibold">{formatCurrency(raisingAmount)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Confirmed {isOversubscribed && "🔥"}
                                </p>
                                <p className={cn(
                                  "text-sm font-semibold",
                                  isOversubscribed && "text-emerald-600"
                                )}>
                                  {formatCurrency(confirmedAmount)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                    
                    {/* Investment Type */}
                    {deal.safe_or_equity && (
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Investment Type</span>
                        <Badge variant="outline" className="font-medium">
                          {deal.safe_or_equity}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                
                {(deal.lead_investor || (deal.co_investors && deal.co_investors.length > 0)) && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      {deal.lead_investor && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Lead Investor</p>
                          <p className="text-sm font-medium">{deal.lead_investor}</p>
                        </div>
                      )}
                      {deal.co_investors && deal.co_investors.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Co-Investors</p>
                          <div className="flex flex-wrap gap-1">
                            {deal.co_investors.map((investor, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {investor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Partner Notes */}
            {votes.length > 0 && (
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Partner Notes
                    <Badge variant="secondary" className="ml-2">
                      {votes.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {votes.map((vote) => {
                      const lp = lps.find(l => l.id === vote.lp_id);
                      return (
                        <div key={vote.id} className="p-3 rounded-lg border hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 border">
                                <AvatarImage src={lp?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {lp?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{lp?.name || 'Unknown LP'}</p>
                                <p className="text-xs text-muted-foreground">{lp?.company}</p>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`${getConvictionColor(vote.conviction_level, vote.review_status)} border text-xs`}
                            >
                              {getConvictionLevelText(vote.conviction_level, vote.strong_no, vote.review_status)}
                            </Badge>
                          </div>
                          
                          {/* Comments Section */}
                          <div className="mt-2">
                            {vote.comments || vote.additional_notes ? (
                              <div className="space-y-1">
                                {vote.comments && (
                                  <div className="text-sm leading-relaxed">
                                    <span className="italic text-foreground">
                                      "<TextWithLinks>{vote.comments}</TextWithLinks>"
                                    </span>
                                  </div>
                                )}
                                {vote.additional_notes && (
                                  <div className="text-sm leading-relaxed">
                                    <span className="font-medium text-muted-foreground text-xs">Additional: </span>
                                    <span className="italic text-foreground">
                                      "<TextWithLinks>{vote.additional_notes}</TextWithLinks>"
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground italic">
                                No comments
                              </div>
                            )}
                          </div>
                          
                          <div className="text-xs text-muted-foreground mt-2">
                            {formatDate(vote.created_at)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>



      {/* Dialogs */}
      <VotingDialog 
        deal={deal}
        open={isVotingDialogOpen} 
        onOpenChange={setIsVotingDialogOpen} 
      />
      
      {isPartner && deal && (
        <>
          <EditDealDialog 
            deal={deal}
            open={isEditDialogOpen} 
            onOpenChange={setIsEditDialogOpen} 
          />

          <DealSummaryDialog 
            deal={deal}
            open={isSummaryDialogOpen} 
            onOpenChange={setIsSummaryDialogOpen} 
          />
        </>
      )}
    </div>
  );
}
