"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquareText, TrendingUp, Activity, DollarSign, ChevronRight, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { Deal, LimitedPartner, Vote, PainPointResponse, BuyingInterestResponse, PilotCustomerResponse } from "@/shared/models";
import { useState, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SurveysSection({
  deals,
  votes,
  lps,
  selectedDealId,
  onSelectDealId,
}: {
  deals: Deal[];
  votes: Vote[];
  lps: LimitedPartner[];
  selectedDealId: string | null | string; // allow empty string for close
  onSelectDealId: (id: string) => void;
}) {
  const convictionLevelLabels: Record<number, string> = {
    1: 'No',
    2: 'Following Pack',
    3: 'Strong Yes',
    4: 'Strong Yes + Additional'
  };
  const convictionLevelColors: Record<number, string> = {
    1: '#ef4444',
    2: '#f59e0b',
    3: '#10b981',
    4: '#3b82f6'
  };

  const PAIN_POINT_LABELS: Record<PainPointResponse, string> = {
    not_at_all: 'Not at all',
    rarely: 'Rarely',
    sometimes: 'Sometimes',
    annoying: "It's annoying",
    real_problem: "It's a real problem",
    major_pain: "It's a major pain",
    critical: "It's critical",
  } as const;

  const BUYING_INTEREST_LABELS: Record<BuyingInterestResponse, string> = {
    definitely_not: 'Definitely not',
    unlikely: 'Unlikely',
    not_sure: 'Not sure',
    maybe: 'Maybe',
    probably: 'Probably',
    very_likely: 'Very likely',
    absolutely: 'Absolutely',
  } as const;

  const PILOT_LABELS: Record<PilotCustomerResponse, string> = {
    not_interested: 'Not interested',
    not_right_now: 'Not right now',
    need_more_info: 'Need more info',
    cautiously_interested: 'Cautiously interested',
    interested_with_conditions: 'Interested with conditions',
    very_interested: 'Very interested',
    hell_yes: 'Hell yes!',
  } as const;

  // Color scales for badges
  const PAIN_POINT_COLORS: Record<PainPointResponse, string> = {
    not_at_all: '#6b7280', // gray-500
    rarely: '#84cc16', // lime-500
    sometimes: '#22c55e', // green-500
    annoying: '#f59e0b', // amber-500
    real_problem: '#f97316', // orange-500
    major_pain: '#ef4444', // red-500
    critical: '#b91c1c', // red-700
  } as const;

  const BUYING_COLORS: Record<BuyingInterestResponse, string> = {
    definitely_not: '#dc2626', // red-600
    unlikely: '#ef4444', // red-500
    not_sure: '#f97316', // orange-500
    maybe: '#f59e0b', // amber-500
    probably: '#84cc16', // lime-500
    very_likely: '#22c55e', // green-500
    absolutely: '#15803d', // green-700
  } as const;

  const PILOT_COLORS: Record<PilotCustomerResponse, string> = {
    not_interested: '#dc2626',
    not_right_now: '#ef4444',
    need_more_info: '#f97316',
    cautiously_interested: '#f59e0b',
    interested_with_conditions: '#84cc16',
    very_interested: '#22c55e',
    hell_yes: '#15803d',
  } as const;

  const SURVEY_OR_LATER: Deal['stage'][] = [
    'partner_review',
    'offer',
    'signed',
    'signed_and_wired',
    'closed_lost_passed',
    'closed_lost_rejected',
  ];

  const STAGE_ORDER: Deal['stage'][] = [
    'partner_review',
    'offer',
    'signed',
    'signed_and_wired',
    'closed_lost_passed',
    'closed_lost_rejected',
  ];

  const STAGE_LABELS: Record<Deal['stage'], string> = {
    sourcing: 'Sourcing',
    sourcing_reached_out: 'Sourcing / Reached out',
    sourcing_meeting_booked: 'Sourcing / Meeting booked',
    sourcing_meeting_done_deciding: 'Sourcing / Meeting done - deciding',
    partner_review: 'Partner Review',
    offer: 'Offer',
    signed: 'Signed',
    signed_and_wired: 'Closed Won',
    closed_lost_passed: 'Closed Lost — We Passed',
    closed_lost_rejected: 'Closed Lost — They Declined',
  };

  // Filter to deals in LP Survey or later
  const eligibleDeals = deals
    .filter((d) => SURVEY_OR_LATER.includes(d.stage))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Build per-deal stats
  const dealStats = eligibleDeals.map((deal) => {
    const dealVotes = votes.filter((v) => v.deal_id === deal.id);
    const totalResponses = dealVotes.length;
    const averageConviction = totalResponses > 0
      ? dealVotes.reduce((sum, v) => sum + (v.conviction_level || 1), 0) / totalResponses
      : 0;
    const wouldBuyCount = dealVotes.filter((v) => v.would_buy).length;
    const hasPainPointCount = dealVotes.filter((v) => v.has_pain_point).length;
    return {
      deal,
      totalResponses,
      averageConviction,
      wouldBuyPct: totalResponses > 0 ? (wouldBuyCount / totalResponses) * 100 : 0,
      painPointPct: totalResponses > 0 ? (hasPainPointCount / totalResponses) * 100 : 0,
    };
  });

  // Group by stage
  const groupedByStage = STAGE_ORDER.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    items: dealStats.filter((ds) => ds.deal.stage === stage),
  })).filter((g) => g.items.length > 0);

  const selectedDeal = deals.find(d => d.id === selectedDealId);
  const surveyDealVotes = selectedDeal ? votes.filter(v => v.deal_id === selectedDeal.id) : [];

  const totalResponses = surveyDealVotes.length;
  const averageConviction = totalResponses > 0
    ? surveyDealVotes.reduce((sum, vote) => sum + (vote.conviction_level || 1), 0) / totalResponses
    : 0;
  const hasPainPointCount = surveyDealVotes.filter(v => v.has_pain_point).length;
  const wouldBuyCount = surveyDealVotes.filter(v => v.would_buy).length;

  const [openVoteId, setOpenVoteId] = useState<string | null>(null);
  const toggleOpen = (id: string) => setOpenVoteId(prev => prev === id ? null : id);

  const formatDateTime = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
    }).format(d);
  };

  const copyToClipboard = async (label: string, text?: string | null) => {
    const value = (text ?? '').toString();
    if (!value) {
      toast.info(`${label}: nothing to copy`);
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>LP Surveys</CardTitle>
          <CardDescription>
            Deals currently in LP Survey or later stages. Click a deal to open responses in a side panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {groupedByStage.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No deals in LP Survey or later stages.</div>
          ) : (
            <div className="space-y-8">
              {groupedByStage.map((group) => (
                <div key={group.stage}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">{group.label}</h3>
                    <Badge variant="outline">{group.items.length}</Badge>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-4 py-3 text-sm font-medium">Deal</th>
                          <th className="text-left px-4 py-3 text-sm font-medium"># Answers</th>
                          <th className="text-left px-4 py-3 text-sm font-medium">Avg Conviction</th>
                          <th className="text-left px-4 py-3 text-sm font-medium">Pain Match</th>
                          <th className="text-left px-4 py-3 text-sm font-medium">Would Buy</th>
                          <th className="text-right px-4 py-3 text-sm font-medium">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {group.items.map(({ deal, totalResponses, averageConviction, wouldBuyPct, painPointPct }) => (
                          <tr
                            key={deal.id}
                            className={`hover:bg-muted/30 transition-colors cursor-pointer`}
                            onClick={() => onSelectDealId(deal.id)}
                          >
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-sm">{deal.company_name}</p>
                                <p className="text-xs text-muted-foreground">{deal.funding_round} • {deal.industry}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-medium">{totalResponses}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm">{averageConviction.toFixed(1)}/4</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm">{painPointPct.toFixed(0)}%</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm">{wouldBuyPct.toFixed(0)}%</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="inline-flex items-center text-sm text-primary">
                                View responses
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selectedDeal} onOpenChange={(o) => { if (!o) onSelectDealId(''); }}>
        <SheetContent side="right" className="w-full sm:max-w-[75vw] overflow-y-auto">
          {selectedDeal && (
            <div className="flex flex-col h-full">
              <SheetHeader>
                <SheetTitle>Survey Responses</SheetTitle>
                <SheetDescription>All responses for {selectedDeal.company_name}</SheetDescription>
              </SheetHeader>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                    <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalResponses}</div>
                    <p className="text-xs text-muted-foreground">Survey responses collected</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Conviction</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{averageConviction.toFixed(1)}/4</div>
                    <p className="text-xs text-muted-foreground">
                      {averageConviction >= 3 ? 'Strong positive signal' : averageConviction >= 2 ? 'Mixed sentiment' : 'Weak signal'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pain Point Match</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalResponses > 0 ? ((hasPainPointCount / totalResponses) * 100).toFixed(0) : 0}%</div>
                    <p className="text-xs text-muted-foreground">{hasPainPointCount} of {totalResponses} experience this pain</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Buying Interest</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalResponses > 0 ? ((wouldBuyCount / totalResponses) * 100).toFixed(0) : 0}%</div>
                    <p className="text-xs text-muted-foreground">{wouldBuyCount} of {totalResponses} would purchase</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6 flex-1 overflow-hidden">
                <CardHeader>
                  <CardTitle>Responses</CardTitle>
                  <CardDescription>Detailed answers</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[60vh]">
                    <TooltipProvider>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium">LP</th>
                            <th className="text-left px-4 py-3 text-sm font-medium">Conviction</th>
                            <th className="text-left px-4 py-3 text-sm font-medium">Pain Point</th>
                            <th className="text-left px-4 py-3 text-sm font-medium">Pilot Interest</th>
                            <th className="text-left px-4 py-3 text-sm font-medium">Would Buy</th>
                            <th className="text-left px-4 py-3 text-sm font-medium">Comments</th>
                            <th className="text-left px-4 py-3 text-sm font-medium">Additional Notes</th>
                            <th className="text-right px-4 py-3 text-sm font-medium">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {surveyDealVotes.length > 0 ? (
                            surveyDealVotes.map((vote) => {
                              const lp = lps.find(l => l.id === vote.lp_id);
                              const isOpen = openVoteId === vote.id;
                              const painKey = vote.pain_point_level as PainPointResponse | undefined;
                              const painLabel = (painKey && PAIN_POINT_LABELS[painKey]) || vote.pain_point_level || '—';
                              const buyingKey = vote.buying_interest_response as BuyingInterestResponse | undefined;
                              const buyingLabel = (buyingKey && BUYING_INTEREST_LABELS[buyingKey]) || vote.buying_interest_response || '—';
                              const pilotKey = vote.pilot_customer_response as PilotCustomerResponse | undefined;
                              const pilotLabel = (pilotKey && PILOT_LABELS[pilotKey]) || vote.pilot_customer_response || '—';
                              const painColor = painKey ? PAIN_POINT_COLORS[painKey] : undefined;
                              const pilotColor = pilotKey ? PILOT_COLORS[pilotKey] : undefined;
                              const buyingColor = buyingKey ? BUYING_COLORS[buyingKey] : undefined;

                              return (
                                <Fragment key={vote.id}>
                                  <tr className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                          <AvatarImage src={lp?.avatar_url} />
                                          <AvatarFallback className="text-[10px]">{getInitials(lp?.name)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium text-sm">{lp?.name || 'Unknown'}</p>
                                          <p className="text-xs text-muted-foreground">{lp?.company}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <Badge 
                                        variant={vote.conviction_level && vote.conviction_level >= 3 ? "default" : "secondary"}
                                        style={{ backgroundColor: vote.strong_no ? '#991b1b' : (vote.conviction_level ? convictionLevelColors[vote.conviction_level] : undefined), color: 'white' }}
                                      >
                                        {vote.strong_no ? '0 - Strong No' : (vote.conviction_level ? convictionLevelLabels[vote.conviction_level] : 'No rating')}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          {painKey ? (
                                            <Badge style={{ backgroundColor: painColor, color: '#fff' }} className="cursor-help">
                                              {painLabel}
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-gray-500 cursor-help">—</Badge>
                                          )}
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs whitespace-pre-wrap">
                                          {vote.solution_feedback || 'No comment'}
                                        </TooltipContent>
                                      </Tooltip>
                                    </td>
                                    <td className="px-4 py-3">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          {pilotKey ? (
                                            <Badge style={{ backgroundColor: pilotColor, color: '#fff' }} className="cursor-help">
                                              {pilotLabel}
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-gray-500 cursor-help">—</Badge>
                                          )}
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs whitespace-pre-wrap">
                                          {vote.pilot_customer_feedback || 'No comment'}
                                        </TooltipContent>
                                      </Tooltip>
                                    </td>
                                    <td className="px-4 py-3">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          {buyingKey ? (
                                            <Badge style={{ backgroundColor: buyingColor, color: '#fff' }} className="cursor-help">
                                              {buyingLabel}
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-gray-500 cursor-help">—</Badge>
                                          )}
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs whitespace-pre-wrap">
                                          <div className="space-y-2">
                                            <div>
                                              <p className="text-xs text-muted-foreground">Tell us more about your buying interest</p>
                                              <p className="text-sm">{vote.buying_interest_feedback || '—'}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-muted-foreground">What price would you pay?</p>
                                              <p className="text-sm">{vote.price_feedback || '—'}</p>
                                            </div>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </td>
                                    <td className="px-4 py-3">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs cursor-help">{vote.comments || '—'}</p>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-md whitespace-pre-wrap">
                                          {vote.comments || 'No comments'}
                                        </TooltipContent>
                                      </Tooltip>
                                    </td>
                                    <td className="px-4 py-3">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs cursor-help">{vote.additional_notes || '—'}</p>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-md whitespace-pre-wrap">
                                          {vote.additional_notes || 'No additional notes'}
                                        </TooltipContent>
                                      </Tooltip>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <Button variant="ghost" size="sm" onClick={() => toggleOpen(vote.id)} className="inline-flex items-center gap-1">
                                        {isOpen ? 'Hide' : 'View'}
                                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                      </Button>
                                    </td>
                                  </tr>
                                  {isOpen && (
                                    <tr>
                                      <td colSpan={8} className="px-4 py-4 bg-muted/30">
                                        <div className="space-y-4">
                                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                                            <div className="p-3 rounded-md bg-background border">
                                              <p className="text-xs text-muted-foreground">Pain Point Level</p>
                                              <p className="text-sm font-medium mt-1">{painLabel}</p>
                                            </div>
                                            <div className="p-3 rounded-md bg-background border">
                                              <p className="text-xs text-muted-foreground">Pilot Response</p>
                                              <p className="text-sm font-medium mt-1">{pilotLabel}</p>
                                            </div>
                                            <div className="p-3 rounded-md bg-background border">
                                              <p className="text-xs text-muted-foreground">Buying Response</p>
                                              <p className="text-sm font-medium mt-1">{buyingLabel}</p>
                                            </div>
                                            <div className="p-3 rounded-md bg-background border">
                                              <p className="text-xs text-muted-foreground">Timestamps</p>
                                              <p className="text-xs mt-1">Submitted: {formatDateTime(vote.created_at)}</p>
                                              <p className="text-xs">Updated: {formatDateTime(vote.updated_at)}</p>
                                            </div>
                                          </div>

                                          <Separator />

                                          <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-semibold">Comments</h4>
                                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard('Comments', vote.comments)}>
                                                  <Copy className="h-4 w-4" />
                                                </Button>
                                              </div>
                                              <div className="rounded-md border bg-background p-3 text-sm whitespace-pre-wrap">
                                                {vote.comments || '—'}
                                              </div>
                                            </div>
                                            <div className="space-y-2">
                                              <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-semibold">Solution Feedback</h4>
                                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard('Solution Feedback', vote.solution_feedback)}>
                                                  <Copy className="h-4 w-4" />
                                                </Button>
                                              </div>
                                              <div className="rounded-md border bg-background p-3 text-sm whitespace-pre-wrap">
                                                {vote.solution_feedback || '—'}
                                              </div>
                                            </div>
                                            <div className="space-y-2">
                                              <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-semibold">Pilot Feedback</h4>
                                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard('Pilot Feedback', vote.pilot_customer_feedback)}>
                                                  <Copy className="h-4 w-4" />
                                                </Button>
                                              </div>
                                              <div className="rounded-md border bg-background p-3 text-sm whitespace-pre-wrap">
                                                {vote.pilot_customer_feedback || '—'}
                                              </div>
                                            </div>
                                            <div className="space-y-2">
                                              <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-semibold">Buying Feedback</h4>
                                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard('Buying Feedback', vote.buying_interest_feedback)}>
                                                  <Copy className="h-4 w-4" />
                                                </Button>
                                              </div>
                                              <div className="rounded-md border bg-background p-3 text-sm whitespace-pre-wrap">
                                                {vote.buying_interest_feedback || '—'}
                                              </div>
                                            </div>
                                            <div className="space-y-2">
                                              <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-semibold">Price Feedback</h4>
                                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard('Price Feedback', vote.price_feedback)}>
                                                  <Copy className="h-4 w-4" />
                                                </Button>
                                              </div>
                                              <div className="rounded-md border bg-background p-3 text-sm whitespace-pre-wrap">
                                                {vote.price_feedback || '—'}
                                              </div>
                                            </div>
                                            <div className="space-y-2">
                                              <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-semibold">Additional Notes</h4>
                                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard('Additional Notes', vote.additional_notes)}>
                                                  <Copy className="h-4 w-4" />
                                                </Button>
                                              </div>
                                              <div className="rounded-md border bg-background p-3 text-sm whitespace-pre-wrap">
                                                {vote.additional_notes || '—'}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No survey responses for this deal yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                        </div>
                      </TooltipProvider>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
