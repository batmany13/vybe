"use client";

import { Fragment, useState, useMemo } from 'react';
import { 
  ExternalLink,
  Eye,
  Filter,
  ChevronDown,
  ChevronRight,
  Building2,
  User,
  DollarSign,
  Calendar,
  TrendingUp,
  MessageSquare,
  Search,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DealWithVotes } from '@/shared/models';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useSelectedLP } from '@/contexts/SelectedLPContext';

import Link from 'next/link';
import { cn } from '@/client-lib/utils';

interface DealsOverviewProps {
  deals: DealWithVotes[];
}

type SectionKey = 'sourcing' | 'review' | 'offer' | 'invested';

interface StageInfo {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

const stageDetails: Record<string, StageInfo> = {
  sourcing: {
    key: 'sourcing',
    label: 'Sourcing Pipeline',
    icon: Search,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    description: 'Companies in our deal sourcing pipeline across 4 states: sourcing, reached out, meeting booked, and meeting done - deciding.'
  },
  review: {
    key: 'review',
    label: 'Under Review',
    icon: Eye,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    description: 'Deals currently being reviewed by partners.'
  },
  offer: {
    key: 'offer',
    label: 'Offer Made',
    icon: MessageSquare,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    description: 'Deals where we have extended an offer or term sheet.'
  },
  invested: {
    key: 'invested',
    label: 'Invested',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    description: "Our portfolio — deals we've invested in."
  }
};

interface DealSection {
  key: SectionKey;
  title: string;
  stages: StageInfo[];
  totalDeals: number;
  isExpanded: boolean;
}

export function DealsOverview({ deals }: DealsOverviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['sourcing', 'review']));
  const { selectedLP } = useSelectedLP();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact'
    }).format(amount);
  };

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  // Get unique industries from all deals
  const industries = useMemo(() => {
    const uniqueIndustries = [...new Set(deals.map(d => d.industry).filter(Boolean))];
    return uniqueIndustries.sort();
  }, [deals]);

  // Filter deals based on selected filters and search
  const filteredDeals = useMemo(() => {
    // Exclude only closed-lost deals from the main view
    const hiddenStages = ['closed_lost_passed', 'closed_lost_rejected'];
    let filtered = deals.filter(d => !hiddenStages.includes(d.stage));

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        d.company_name.toLowerCase().includes(query) ||
        d.description?.toLowerCase().includes(query) ||
        (d.founders ?? []).some(f => f.name.toLowerCase().includes(query))
      );
    }

    // Apply industry filter
    if (industryFilter !== 'all') {
      filtered = filtered.filter(d => d.industry === industryFilter);
    }

    // Apply review status filter
    if (reviewStatusFilter !== 'all') {
      if (reviewStatusFilter === 'with_responses') {
        filtered = filtered.filter(d => (d.total_votes || 0) > 0);
      } else if (reviewStatusFilter === 'no_responses') {
        filtered = filtered.filter(d => (d.total_votes || 0) === 0);
      } else if (reviewStatusFilter === 'high_conviction') {
        filtered = filtered.filter(d => {
          const totalVotes = d.total_votes || 0;
          const positiveVotes = (d.strong_yes_plus_votes || 0) + (d.strong_yes_votes || 0);
          return totalVotes > 0 && (positiveVotes / totalVotes) >= 0.7;
        });
      } else if (reviewStatusFilter === 'low_conviction') {
        filtered = filtered.filter(d => {
          const totalVotes = d.total_votes || 0;
          const positiveVotes = (d.strong_yes_plus_votes || 0) + (d.strong_yes_votes || 0);
          return totalVotes > 0 && (positiveVotes / totalVotes) < 0.3;
        });
      }
    }

    return filtered;
  }, [deals, searchQuery, industryFilter, reviewStatusFilter]);

  const getDealsByStage = (stage: string) => {
    return filteredDeals
      .filter(d => d.stage === stage)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const getDealsByStages = (stages: string[]) => {
    return filteredDeals
      .filter(d => stages.includes(d.stage))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  // Organize deals into sections (Sourcing, Review, Offer, Invested)
  const sections = useMemo((): DealSection[] => {
    const result: DealSection[] = [];

    // Sourcing section (includes all 4 sourcing stages)
    const sourcingStages = ['sourcing', 'sourcing_reached_out', 'sourcing_meeting_booked', 'sourcing_meeting_done_deciding'];
    const sourcingDeals = filteredDeals.filter(d => sourcingStages.includes(d.stage));
    if (sourcingDeals.length > 0 || !searchQuery) {
      result.push({
        key: 'sourcing',
        title: 'Sourcing Pipeline',
        stages: [stageDetails.sourcing],
        totalDeals: sourcingDeals.length,
        isExpanded: expandedSections.has('sourcing')
      });
    }

    const reviewDeals = filteredDeals.filter(d => d.stage === 'partner_review');
    if (reviewDeals.length > 0 || !searchQuery) {
      result.push({
        key: 'review',
        title: 'Under Review',
        stages: [stageDetails.review],
        totalDeals: reviewDeals.length,
        isExpanded: expandedSections.has('review')
      });
    }

    const offerDeals = filteredDeals.filter(d => d.stage === 'offer');
    if (offerDeals.length > 0 || !searchQuery) {
      result.push({
        key: 'offer',
        title: 'Offer Made',
        stages: [stageDetails.offer],
        totalDeals: offerDeals.length,
        isExpanded: expandedSections.has('offer')
      });
    }

    const investedDeals = filteredDeals.filter(d => ['signed', 'signed_and_wired'].includes(d.stage));
    if (investedDeals.length > 0 || !searchQuery) {
      result.push({
        key: 'invested',
        title: 'Invested',
        stages: [stageDetails.invested],
        totalDeals: investedDeals.length,
        isExpanded: expandedSections.has('invested')
      });
    }

    return result;
  }, [filteredDeals, searchQuery, expandedSections]);

  const clearFilters = () => {
    setIndustryFilter('all');
    setReviewStatusFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = industryFilter !== 'all' || reviewStatusFilter !== 'all' || searchQuery;

  const renderDealCard = (deal: DealWithVotes) => {
    const daysSinceCreated = Math.floor((Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24));
    
    // Check if current LP has voted on this deal
    const hasUserVoted = selectedLP && deal.votes?.some(v => v.lp_id === selectedLP.id);
    
    // Get sourcing stage label for display
    const getSourcingStageLabel = (stage: string) => {
      switch (stage) {
        case 'sourcing': return 'Sourcing';
        case 'sourcing_reached_out': return 'Reached Out';
        case 'sourcing_meeting_booked': return 'Meeting Booked';
        case 'sourcing_meeting_done_deciding': return 'Meeting Done';
        default: return null;
      }
    };

    const sourcingStageLabel = getSourcingStageLabel(deal.stage);
    
    return (
      <Link key={deal.id} href={`/deals/${deal.id}`} className="block">
        <Card className="group hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer relative">

          
          <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                {deal.company_name}
                {deal.company_description_short && (
                  <span className="font-normal text-muted-foreground"> - {deal.company_description_short.length > 100 
                    ? `${deal.company_description_short.substring(0, 100)}...` 
                    : deal.company_description_short}</span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {deal.industry} • {deal.funding_round}
                {sourcingStageLabel && (
                  <span className="ml-2">
                    • <span className="text-blue-600 font-medium">{sourcingStageLabel}</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Deal Info */}
          <div className="space-y-2">
            {/* Founders */}
            {deal.founders && deal.founders.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {deal.founders.slice(0, 3).map((founder, idx) => (
                    <Avatar key={idx} className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={founder.avatar_url} alt={founder.name} />
                      <AvatarFallback className="text-xs">
                        {founder.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {deal.founders.length === 1 
                    ? deal.founders[0].name
                    : deal.founders.length > 3
                    ? `${deal.founders.slice(0, 2).map(f => f.name.split(' ')[0]).join(', ')} +${deal.founders.length - 2}`
                    : deal.founders.map(f => f.name.split(' ')[0]).join(', ')
                  }
                </span>
              </div>
            )}

            {/* Metrics */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{formatCurrency(deal.deal_size)}</span>
              </div>
              {deal.valuation ? (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>
                    {(deal.safe_or_equity || '').toLowerCase().includes('safe') ? 'Cap' : 'Valuation'}: {formatCurrency(deal.valuation)}
                  </span>
                </div>
              ) : null}
              {deal.website_url && (
                <button
                  className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                  onClick={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    window.open(deal.website_url, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Website</span>
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {daysSinceCreated}d ago
              </Badge>
              {deal.survey_deadline && !hasUserVoted && !['signed', 'signed_and_wired'].includes(deal.stage) && (
                (() => {
                  const today = new Date();
                  const due = new Date(deal.survey_deadline as string);
                  const msPerDay = 1000 * 60 * 60 * 24;
                  const daysLeft = Math.ceil((due.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / msPerDay);
                  const overdue = daysLeft < 0;
                  const label = overdue ? `${Math.abs(daysLeft)}d overdue` : `Due in ${daysLeft}d`;
                  return (
                    <Badge variant={overdue ? 'destructive' : 'secondary'} className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {label}
                    </Badge>
                  );
                })()
              )}

            </div>
            {deal.lead_investor && (
              <span className="text-xs text-muted-foreground">
                Lead: {deal.lead_investor}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies, founders, or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All industries</SelectItem>
              {industries.map(industry => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={reviewStatusFilter} onValueChange={setReviewStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All review status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All review status</SelectItem>
              <SelectItem value="with_responses">With responses</SelectItem>
              <SelectItem value="no_responses">No responses</SelectItem>
              <SelectItem value="high_conviction">High conviction</SelectItem>
              <SelectItem value="low_conviction">Low conviction</SelectItem>
            </SelectContent>
          </Select>
          {(industryFilter !== 'all' || reviewStatusFilter !== 'all' || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              Clear all
              <XCircle className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>

        {/* Results count */}
        {(industryFilter !== 'all' || reviewStatusFilter !== 'all' || searchQuery) && (
          <p className="text-sm text-muted-foreground">
            Showing {filteredDeals.length} of {deals.filter(d => !['closed_lost_passed', 'closed_lost_rejected'].includes(d.stage)).length} deals
          </p>
        )}
      </div>

      {/* Pipeline Sections */}
      <div className="space-y-8">
        {sections.map((section) => {
          const SectionIcon = section.stages[0]?.icon || Building2;
          
          return (
            <div key={section.key} className="space-y-4">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full group"
              >
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      section.key === 'sourcing' && "bg-blue-100 dark:bg-blue-900/30",
                      section.key === 'review' && "bg-orange-100 dark:bg-orange-900/30",
                      section.key === 'offer' && "bg-purple-100 dark:bg-purple-900/30",
                      section.key === 'invested' && "bg-green-100 dark:bg-green-900/30",
                    )}>
                      <SectionIcon className={cn(
                        "h-5 w-5",
                        section.key === 'sourcing' && "text-blue-600",
                        section.key === 'review' && "text-orange-600",
                        section.key === 'offer' && "text-purple-600",
                        section.key === 'invested' && "text-green-600",
                      )} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">{section.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {section.totalDeals} {section.totalDeals === 1 ? 'deal' : 'deals'} in this phase
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {section.totalDeals > 0 && (
                      <Progress 
                        value={(section.totalDeals / filteredDeals.length) * 100} 
                        className="w-24 h-2"
                      />
                    )}
                    {section.isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    )}
                  </div>
                </div>
              </button>

              {/* Section Content */}
              {section.isExpanded && (
                <div className="space-y-6 animate-in slide-in-from-top-2">
                  {section.key === 'sourcing' ? (
                    // Sourcing (combined all stages)
                    (() => {
                      const stage = section.stages[0];
                      const sourcingStages = ['sourcing', 'sourcing_reached_out', 'sourcing_meeting_booked', 'sourcing_meeting_done_deciding'];
                      const allSourcingDeals = getDealsByStages(sourcingStages);
                      
                      // Calculate counts for each sourcing stage
                      const stageCounts = {
                        sourcing: getDealsByStage('sourcing').length,
                        sourcing_reached_out: getDealsByStage('sourcing_reached_out').length,
                        sourcing_meeting_booked: getDealsByStage('sourcing_meeting_booked').length,
                        sourcing_meeting_done_deciding: getDealsByStage('sourcing_meeting_done_deciding').length
                      };
                      
                      return (
                        <div className="space-y-3">
                          <div className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border",
                            stage.bgColor,
                            stage.borderColor
                          )}>
                            <stage.icon className={cn("h-4 w-4", stage.color)} />
                            <div className="flex-1">
                              <h4 className="font-medium">{stage.label}</h4>
                              <p className="text-xs text-muted-foreground">{stage.description}</p>
                              <div className="flex gap-2 mt-2">
                                {stageCounts.sourcing > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    Sourcing: {stageCounts.sourcing}
                                  </Badge>
                                )}
                                {stageCounts.sourcing_reached_out > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    Reached Out: {stageCounts.sourcing_reached_out}
                                  </Badge>
                                )}
                                {stageCounts.sourcing_meeting_booked > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    Meeting Booked: {stageCounts.sourcing_meeting_booked}
                                  </Badge>
                                )}
                                {stageCounts.sourcing_meeting_done_deciding > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    Meeting Done: {stageCounts.sourcing_meeting_done_deciding}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Badge variant="secondary" className="ml-auto">
                              {allSourcingDeals.length}
                            </Badge>
                          </div>
                          {allSourcingDeals.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                              {allSourcingDeals.map((deal) => renderDealCard(deal))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <p className="text-sm">No deals in sourcing pipeline</p>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : section.key === 'review' ? (
                    // Review (single stage)
                    (() => {
                      const stage = section.stages[0];
                      const stageDeals = getDealsByStage('partner_review');
                      return (
                        <div className="space-y-3">
                          <div className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border",
                            stage.bgColor,
                            stage.borderColor
                          )}>
                            <stage.icon className={cn("h-4 w-4", stage.color)} />
                            <div className="flex-1">
                              <h4 className="font-medium">{stage.label}</h4>
                              <p className="text-xs text-muted-foreground">{stage.description}</p>
                            </div>
                            <Badge variant="secondary" className="ml-auto">
                              {stageDeals.length}
                            </Badge>
                          </div>
                          {stageDeals.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                              {stageDeals.map((deal) => renderDealCard(deal))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <p className="text-sm">No deals currently under review</p>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : section.key === 'offer' ? (
                    // Offer (single stage)
                    (() => {
                      const stage = section.stages[0];
                      const stageDeals = getDealsByStage('offer');
                      return (
                        <div className="space-y-3">
                          <div className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border",
                            stage.bgColor,
                            stage.borderColor
                          )}>
                            <stage.icon className={cn("h-4 w-4", stage.color)} />
                            <div className="flex-1">
                              <h4 className="font-medium">{stage.label}</h4>
                              <p className="text-xs text-muted-foreground">{stage.description}</p>
                            </div>
                            <Badge variant="secondary" className="ml-auto">
                              {stageDeals.length}
                            </Badge>
                          </div>
                          {stageDeals.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                              {stageDeals.map((deal) => renderDealCard(deal))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <p className="text-sm">No deals where we have made an offer</p>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    // Invested (signed_and_wired only)
                    (() => {
                      const stage = section.stages[0];
                      const stageDeals = getDealsByStages(['signed', 'signed_and_wired']);
                      return (
                        <div className="space-y-3">
                          <div className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border",
                            stage.bgColor,
                            stage.borderColor
                          )}>
                            <stage.icon className={cn("h-4 w-4", stage.color)} />
                            <div className="flex-1">
                              <h4 className="font-medium">{stage.label}</h4>
                              <p className="text-xs text-muted-foreground">{stage.description}</p>
                            </div>
                            <Badge variant="secondary" className="ml-auto">
                              {stageDeals.length}
                            </Badge>
                          </div>
                          {stageDeals.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                              {stageDeals.map((deal) => renderDealCard(deal))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <p className="text-sm">No invested deals yet</p>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {sections.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-3">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="font-semibold text-lg">No deals found</h3>
            <p className="text-muted-foreground">
              {(industryFilter !== 'all' || reviewStatusFilter !== 'all' || searchQuery)
                ? "Try adjusting your filters to see more results."
                : "Start tracking your first deal by creating one."}
            </p>
          </div>
        </Card>
      )}

      {/* Passed Deals with LP Feedback Section */}
      {(() => {
        // Get passed deals that have at least one LP survey response
        const passedDealsWithFeedback = deals
          .filter(d => 
            (d.stage === 'closed_lost_passed' || d.stage === 'closed_lost_rejected') && 
            d.votes && 
            d.votes.length > 0
          )
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        if (passedDealsWithFeedback.length === 0) return null;

        const isExpanded = expandedSections.has('passed_with_feedback');

        return (
          <div className="space-y-4 mt-8">
            <Separator className="my-8" />
            
            {/* Section Header */}
            <button
              onClick={() => toggleSection('passed_with_feedback')}
              className="w-full group"
            >
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900/30">
                    <XCircle className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">Passed Deals with LP Feedback</h3>
                    <p className="text-sm text-muted-foreground">
                      {passedDealsWithFeedback.length} {passedDealsWithFeedback.length === 1 ? 'deal' : 'deals'} we passed on that received LP responses
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {passedDealsWithFeedback.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {passedDealsWithFeedback.reduce((sum, d) => sum + (d.votes?.length || 0), 0)} total responses
                    </Badge>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                </div>
              </div>
            </button>

            {/* Section Content */}
            {isExpanded && (
              <div className="space-y-3 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800">
                  <AlertCircle className="h-4 w-4 text-gray-600" />
                  <div className="flex-1">
                    <h4 className="font-medium">Review Past Decisions</h4>
                    <p className="text-xs text-muted-foreground">These deals were passed but received LP feedback. Review to understand investment patterns.</p>
                  </div>
                </div>
                
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {passedDealsWithFeedback.map((deal) => (
                    <Link key={deal.id} href={`/deals/${deal.id}`} className="block">
                      <Card className="group hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer opacity-75 hover:opacity-100">
                        <div className="p-4 space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                                {deal.company_name}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {deal.industry} • {deal.funding_round}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Passed
                            </Badge>
                          </div>

                          {/* LP Feedback Summary */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{deal.votes?.length || 0} LP responses</span>
                            </div>
                            
                            {/* Conviction breakdown */}
                            <div className="flex gap-1">
                              {deal.strong_yes_plus_votes > 0 && (
                                <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200">
                                  L4: {deal.strong_yes_plus_votes}
                                </Badge>
                              )}
                              {deal.strong_yes_votes > 0 && (
                                <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200">
                                  L3: {deal.strong_yes_votes}
                                </Badge>
                              )}
                              {(() => {
                                // Calculate L2 (weak yes/following pack) votes
                                const l2Votes = (deal.total_votes || 0) - 
                                  ((deal.strong_yes_plus_votes || 0) + 
                                   (deal.strong_yes_votes || 0) + 
                                   (deal.no_votes || 0));
                                return l2Votes > 0 ? (
                                  <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200">
                                    L2: {l2Votes}
                                  </Badge>
                                ) : null;
                              })()}
                              {deal.no_votes > 0 && (
                                <Badge variant="outline" className="text-xs bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200">
                                  L1: {deal.no_votes}
                                </Badge>
                              )}
                            </div>

                            {/* Average conviction if available */}
                            {deal.votes && deal.votes.length > 0 && (() => {
                              const avgConviction = deal.votes.reduce((sum, vote) => 
                                sum + (vote.strong_no ? 0 : vote.conviction_level), 0
                              ) / deal.votes.length;
                              return (
                                <div className="text-xs text-muted-foreground">
                                  Avg conviction: {avgConviction.toFixed(1)}/4
                                </div>
                              );
                            })()}
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-2 border-t">
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {Math.floor((Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24))}d ago
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs h-7"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Navigate to deal page
                                window.location.href = `/deals/${deal.id}`;
                              }}
                            >
                              View feedback
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

    </div>
  );
}
