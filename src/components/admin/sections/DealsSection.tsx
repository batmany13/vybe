"use client"

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronUp, ChevronDown, Edit, Plus, Trash2, XCircle, FileDown, Calendar, Clock, FileText } from "lucide-react";
import { cn } from "@/client-lib/utils";
import { DealWithVotes, LimitedPartner, GoogleCalendarEvent } from "@/shared/models";
import { Fragment, useState, useMemo } from "react";
import { updateDeal } from "@/client-lib/api-client";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DecisionFlowDialog, DecisionMode } from "@/components/deals/DecisionFlowDialog";
import { SurveyReportButton } from "@/components/deals/SurveyReportButton";
import { useGoogleCalendarEvents } from "@/client-lib/integrations-client";

export function DealsSection({
  deals,
  lps,
  onCreateDeal,
  onEditDeal,
  onDeleteDeal,
  onMarkAsPass,
}: {
  deals: DealWithVotes[];
  lps?: LimitedPartner[];
  onCreateDeal: () => void;
  onEditDeal: (id: string) => void;
  onDeleteDeal: (id: string) => void;
  onMarkAsPass?: (id: string) => void;
}) {
  const [decisionDeal, setDecisionDeal] = useState<DealWithVotes | null>(null);
  const [decisionMode, setDecisionMode] = useState<DecisionMode>("pass");
  const { data: calendarEvents = [] } = useGoogleCalendarEvents();

  // Get next meeting for a deal
  const getNextMeeting = (deal: DealWithVotes): { event: GoogleCalendarEvent; date: Date; daysUntil: number } | null => {
    if (deal.stage !== 'sourcing_meeting_booked' || !deal.founders || deal.founders.length === 0) {
      return null;
    }

    const now = new Date();
    const meetings: { event: GoogleCalendarEvent; date: Date; daysUntil: number }[] = [];

    const founderNames = deal.founders.map(f => f.name.toLowerCase());
    const founderEmails = deal.founders
      .filter(f => f.email)
      .map(f => f.email?.toLowerCase() || '');
    const companyName = deal.company_name.toLowerCase();

    calendarEvents.forEach(event => {
      if (event.status === 'cancelled') return;
      
      const eventDate = event.start?.dateTime || event.start?.date;
      if (!eventDate) return;
      
      const eventTime = new Date(eventDate);
      if (eventTime < now) return;

      const eventTitle = (event.summary || '').toLowerCase();
      const eventDescription = (event.description || '').toLowerCase();
      const attendeeEmails = (event.attendees || []).map(a => a.email.toLowerCase());
      
      // Check if any founder is mentioned or attending
      const hasFounderMatch = deal.founders?.some(founder => {
        const founderNameLower = founder.name.toLowerCase();
        const founderEmailLower = founder.email?.toLowerCase() || '';
        
        return (
          (founderEmailLower && attendeeEmails.includes(founderEmailLower)) ||
          eventTitle.includes(founderNameLower) ||
          eventDescription.includes(founderNameLower)
        );
      }) ?? false;
      
      // Also check for company name
      const mentionsCompany = 
        eventTitle.includes(companyName) || 
        eventDescription.includes(companyName);

      if (hasFounderMatch || mentionsCompany) {
        const daysUntil = Math.ceil((eventTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        meetings.push({ event, date: eventTime, daysUntil });
      }
    });

    // Sort by date and return the next upcoming meeting
    meetings.sort((a, b) => a.date.getTime() - b.date.getTime());
    return meetings[0] || null;
  };

  const formatMeetingDate = (date: Date, daysUntil: number) => {
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit'
    };
    
    if (daysUntil === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', timeOptions)}`;
    } else if (daysUntil === 1) {
      return `Tomorrow at ${date.toLocaleTimeString('en-US', timeOptions)}`;
    } else {
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString('en-US', timeOptions)}`;
    }
  };

  const stageOrder: Array<{ key: string; label: string; color: string }> = [
    { key: 'sourcing_combined', label: 'Sourcing', color: 'blue' },
    { key: 'partner_review', label: 'Partner Review', color: 'purple' },
    { key: 'signed_and_wired', label: 'Invested', color: 'green' },
  ];

  // Helper function to get the display label for individual sourcing stages
  const getSourcingStageLabel = (stage: string): string => {
    const stageLabels: Record<string, string> = {
      'sourcing': 'Initial',
      'sourcing_reached_out': 'Reached Out',
      'sourcing_meeting_booked': 'Meeting Booked',
      'sourcing_meeting_done_deciding': 'Meeting Done - Deciding',
    };
    return stageLabels[stage] || stage;
  };

  const getNextStage = (currentStage: string): string | null => {
    // Handle sourcing sub-stages
    if (currentStage === 'sourcing') return 'sourcing_reached_out';
    if (currentStage === 'sourcing_reached_out') return 'sourcing_meeting_booked';
    if (currentStage === 'sourcing_meeting_booked') return 'sourcing_meeting_done_deciding';
    if (currentStage === 'sourcing_meeting_done_deciding') return 'partner_review';
    
    // Handle other stages
    if (currentStage === 'partner_review') return 'signed_and_wired';
    
    return null;
  };

  const getPreviousStage = (currentStage: string): string | null => {
    // Handle sourcing sub-stages
    if (currentStage === 'sourcing_reached_out') return 'sourcing';
    if (currentStage === 'sourcing_meeting_booked') return 'sourcing_reached_out';
    if (currentStage === 'sourcing_meeting_done_deciding') return 'sourcing_meeting_booked';
    
    // Handle other stages
    if (currentStage === 'partner_review') return 'sourcing_meeting_done_deciding';
    if (currentStage === 'signed_and_wired') return 'partner_review';
    
    return null;
  };

  const handleMoveStage = async (dealId: string, newStage: string) => {
    try {
      await updateDeal(dealId, { stage: newStage as "sourcing" | "sourcing_reached_out" | "sourcing_meeting_booked" | "sourcing_meeting_done_deciding" | "partner_review" | "signed_and_wired" });
      toast.success('Deal stage updated');
    } catch (error) {
      toast.error('Failed to update deal stage');
    }
  };

  const grouped = stageOrder.map(({ key, label, color }) => {
    if (key === 'sourcing_combined') {
      // Combine all sourcing stages
      const sourcingStages = ['sourcing', 'sourcing_reached_out', 'sourcing_meeting_booked', 'sourcing_meeting_done_deciding'];
      return {
        key,
        label,
        color,
        deals: deals.filter(d => sourcingStages.includes(d.stage)).sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      };
    }
    return {
      key,
      label,
      color,
      deals: deals.filter(d => d.stage === key).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    };
  });

  const sourcingCount = deals.filter(d => d.stage === 'sourcing' || d.stage === 'sourcing_reached_out' || d.stage === 'sourcing_meeting_booked' || d.stage === 'sourcing_meeting_done_deciding').length;
  const partnerReviewCount = deals.filter(d => d.stage === 'partner_review').length;
  const signedCount = deals.filter(d => d.stage === 'signed' || d.stage === 'signed_and_wired').length;

  // Format amounts as $100k below 1M, otherwise $1.2M
  const formatAmountShort = (amount: number | undefined) => {
    if (!amount || amount <= 0) return '$0';
    if (amount >= 1_000_000) {
      const m = amount / 1_000_000;
      const s = m % 1 === 0 ? m.toFixed(0) : m.toFixed(1);
      return `$${s}M`;
    }
    if (amount >= 1_000) {
      const k = amount / 1_000;
      const s = Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1);
      return `$${s}k`;
    }
    return `$${amount}`;
  };

  const formatCapLabel = (deal: DealWithVotes) => {
    const kind = (deal.safe_or_equity || '').toLowerCase();
    return kind.includes('safe') ? 'Cap' : 'Valuation';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Deal Pipeline Management</CardTitle>
              <CardDescription>View and manage all deals in your pipeline</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={onCreateDeal}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Deal
              </Button>
              <Link href="/admin/meetings">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Upcoming Meetings
                </Button>
              </Link>
              <Link href="/deals">
                <Button variant="outline">
                  View Full Pipeline
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Deal Stats */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">Sourcing</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                  {sourcingCount}
                </p>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">Active leads</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wide">Partner Review</p>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                  {partnerReviewCount}
                </p>
                <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">Under evaluation</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">Invested</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">
                  {signedCount}
                </p>
                <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">Completed deals</p>
              </div>
            </div>

            {/* Deals Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium">Company</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Founders</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Investment</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Lead Partner</th>
                    <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {deals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No deals found. Click "Add New Deal" to create your first deal.
                      </td>
                    </tr>
                  ) : (
                    grouped.map((group, groupIndex) => (
                      <Fragment key={group.key}>
                        {/* Add spacing between stages */}
                        {groupIndex > 0 && (
                          <tr>
                            <td colSpan={6} className="h-6 bg-background"></td>
                          </tr>
                        )}
                        <tr className={cn(
                          "hover:bg-muted/40 border-t-2",
                          group.color === 'blue' && "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800",
                          group.color === 'purple' && "bg-purple-50/50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800",
                          group.color === 'green' && "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800",
                          group.color === 'red' && "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800",
                          group.color === 'orange' && "bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800",
                        )}>
                          <td colSpan={6} className="px-4 py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-1 h-8 rounded-full",
                                  group.color === 'blue' && "bg-blue-500",
                                  group.color === 'purple' && "bg-purple-500",
                                  group.color === 'green' && "bg-green-500",
                                  group.color === 'red' && "bg-red-500",
                                  group.color === 'orange' && "bg-orange-500",
                                )} />
                                <div>
                                  <span className="text-lg font-semibold">
                                    {group.label}
                                  </span>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {group.deals.length} {group.deals.length === 1 ? 'deal' : 'deals'} in this stage
                                  </p>
                                </div>
                              </div>
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  "font-semibold",
                                  group.color === 'blue' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                  group.color === 'purple' && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                                  group.color === 'green' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                  group.color === 'red' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                                  group.color === 'orange' && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                                )}
                              >
                                {group.deals.length}
                              </Badge>
                            </div>
                          </td>
                        </tr>
                        {group.deals.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm bg-muted/10">
                              No deals in this stage
                            </td>
                          </tr>
                        ) : (
                          group.deals.slice(0, 10).map((deal, dealIndex) => {
                            const prevStage = getPreviousStage(deal.stage);
                            const nextStage = getNextStage(deal.stage);
                            const nextMeeting = getNextMeeting(deal);
                            
                            return (
                              <tr key={deal.id} className={cn(
                                "hover:bg-muted/30 transition-colors",
                                dealIndex === 0 && "border-t border-muted"
                              )}>
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="font-medium text-sm">{deal.company_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {deal.company_description_short
                                        ? deal.company_description_short
                                        : (deal.description
                                          ? (deal.description.length > 50
                                            ? `${deal.description.slice(0, 50)}…`
                                            : deal.description)
                                          : deal.industry)}
                                    </p>
                                    {/* Show meeting date for "Sourcing / Meeting booked" stage */}
                                    {nextMeeting && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                        <span className={cn(
                                          "text-xs font-medium",
                                          nextMeeting.daysUntil === 0 && "text-red-600",
                                          nextMeeting.daysUntil === 1 && "text-orange-600",
                                          nextMeeting.daysUntil > 1 && nextMeeting.daysUntil <= 7 && "text-blue-600",
                                          nextMeeting.daysUntil > 7 && "text-muted-foreground"
                                        )}>
                                          {formatMeetingDate(nextMeeting.date, nextMeeting.daysUntil)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-sm">
                                    {deal.founders && deal.founders.length > 0 
                                      ? deal.founders.map(f => f.name).join(', ')
                                      : '—'
                                    }
                                  </p>
                                </td>

                                <td className="px-4 py-3">
                                  <div className="space-y-1">
                                    <Badge 
                                      variant={deal.status === 'active' ? 'outline' : 'secondary'}
                                      className={cn(
                                        "text-xs",
                                        deal.status === 'active' && 'border-green-200 text-green-700 dark:border-green-800 dark:text-green-400'
                                      )}
                                    >
                                      {deal.status}
                                    </Badge>
                                    {/* Show sourcing stage label when in sourcing group */}
                                    {group.key === 'sourcing_combined' && (
                                      <div className="text-xs text-muted-foreground">
                                        {getSourcingStageLabel(deal.stage)}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="font-medium text-sm">
                                      {formatAmountShort(deal.deal_size)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {deal.funding_round}
                                      {deal.valuation ? (
                                        <>
                                          {' '}
                                          • {formatCapLabel(deal)}: {formatAmountShort(deal.valuation)}
                                        </>
                                      ) : null}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-sm">{deal.lead_investor || '—'}</p>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Link href={`/deals/${deal.id}`}>
                                      <Button variant="ghost" size="sm" title="View details">
                                        View
                                        <ChevronRight className="h-3 w-3 ml-1" />
                                      </Button>
                                    </Link>
                                    <Button variant="ghost" size="sm" title="Edit deal" onClick={() => onEditDeal(deal.id)}>
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    {onMarkAsPass && deal.stage !== 'closed_lost_passed' && deal.stage !== 'closed_lost_rejected' && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        title="Mark as pass"
                                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                        onClick={() => onMarkAsPass(deal.id)}
                                      >
                                        <XCircle className="h-3 w-3" />
                                      </Button>
                                    )}



                                    {/* Pass email composer for Sourcing / Meeting done - deciding */}
                                    {deal.stage === 'sourcing_meeting_done_deciding' && (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        title="Draft pass email"
                                        onClick={() => { setDecisionDeal(deal); setDecisionMode('pass'); }}
                                      >
                                        Pass
                                      </Button>
                                    )}



                                    {/* Contract link button for signed deals */}
                                    {(deal.stage === 'signed' || deal.stage === 'signed_and_wired') && deal.contract_link && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        title="View SAFE contract"
                                        onClick={() => window.open(deal.contract_link, '_blank')}
                                      >
                                        <FileText className="h-3 w-3" />
                                      </Button>
                                    )}

                                    {/* Survey Report button for any deal with potential votes */}
                                    {(deal.votes?.length > 0 || deal.stage === 'partner_review' || deal.stage === 'signed' || deal.stage === 'signed_and_wired') && (
                                      <SurveyReportButton 
                                        dealId={deal.id} 
                                        dealName={deal.company_name}
                                        dealData={deal}
                                        variant="ghost"
                                        size="icon"
                                      />
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
              {deals.length > 10 && (
                <div className="px-4 py-3 bg-muted/30 text-center">
                  <Link href="/deals">
                    <Button variant="ghost" size="sm">
                      View all {deals.length} deals
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {decisionDeal && (
        <DecisionFlowDialog
          open={!!decisionDeal}
          onOpenChange={(o) => { if (!o) setDecisionDeal(null); }}
          deal={decisionDeal}
          mode={decisionMode}
          lps={lps ?? []}
        />
      )}
    </>
  );
}