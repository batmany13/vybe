"use client";

import { useState } from 'react';
import { 
  Vote as VoteIcon, 
  ThumbsUp, 
  ThumbsDown, 
  Minus,
  MessageSquare,
  Clock,
  Users,
  TrendingUp,
  Eye,
  AlertTriangle,
  CheckCircle,
  ShoppingCart,
  HeartHandshake
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DealWithVotes, PilotCustomerResponse, BuyingInterestResponse, PainPointResponse } from '@/shared/models';
import { VotingDialog } from './VotingDialog';
import Link from 'next/link';

interface VotingDashboardProps {
  deals: DealWithVotes[];
}

export function VotingDashboard({ deals }: VotingDashboardProps) {
  const [selectedDeal, setSelectedDeal] = useState<DealWithVotes | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'sourcing': 'bg-gray-100 text-gray-800',
      'sourcing_reached_out': 'bg-blue-100 text-blue-800',
      'sourcing_meeting_booked': 'bg-indigo-100 text-indigo-800',
      'partner_review': 'bg-yellow-100 text-yellow-800',
      'offer': 'bg-purple-100 text-purple-800',
      'signed': 'bg-green-100 text-green-800',
      'signed_and_wired': 'bg-emerald-100 text-emerald-800',
      'closed_lost': 'bg-red-100 text-red-800',
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getVotingProgress = (deal: DealWithVotes) => {
    const totalVotes = deal.total_votes || 0;
    const positiveVotes = (deal.strong_yes_plus_votes || 0) + (deal.strong_yes_votes || 0);
    if (totalVotes === 0) return 0;
    return (positiveVotes / totalVotes) * 100;
  };

  const getVotingStatus = (deal: DealWithVotes) => {
    const totalVotes = deal.total_votes || 0;
    if (totalVotes === 0) return 'No survey responses yet';
    const positivePercentage = getVotingProgress(deal);
    const strongPlusVotes = deal.strong_yes_plus_votes || 0;
    if (strongPlusVotes > 0 && positivePercentage >= 75) return 'Strong conviction + additional investment interest';
    if (positivePercentage >= 75) return 'Strong conviction';
    if (positivePercentage >= 50) return 'Moderate conviction';
    if (positivePercentage >= 25) return 'Mixed conviction';
    return 'Low conviction';
  };

  // Customer Development Analysis Functions
  const getCustomerDevelopmentInsights = (deal: DealWithVotes) => {
    const votes = deal.votes || [];
    if (votes.length === 0) return null;

    // Pain Point Analysis
    const painPointResponses = votes
      .filter(v => v.pain_point_level)
      .map(v => v.pain_point_level!);
    
    const strongPainPoints = painPointResponses.filter(p => 
      ['major_pain', 'critical', 'real_problem'].includes(p)
    ).length;

    // Pilot Customer Interest
    const pilotResponses = votes
      .filter(v => v.pilot_customer_response)
      .map(v => v.pilot_customer_response!);
    
    const interestedPilots = pilotResponses.filter(p => 
      ['very_interested', 'hell_yes', 'interested_with_conditions'].includes(p)
    ).length;

    // Buying Interest
    const buyingResponses = votes
      .filter(v => v.buying_interest_response)
      .map(v => v.buying_interest_response!);
    
    const strongBuyingInterest = buyingResponses.filter(b => 
      ['very_likely', 'absolutely', 'probably'].includes(b)
    ).length;

    return {
      totalResponses: votes.length,
      strongPainPoints,
      interestedPilots,
      strongBuyingInterest,
      painPointPercentage: painPointResponses.length > 0 ? (strongPainPoints / painPointResponses.length) * 100 : 0,
      pilotInterestPercentage: pilotResponses.length > 0 ? (interestedPilots / pilotResponses.length) * 100 : 0,
      buyingInterestPercentage: buyingResponses.length > 0 ? (strongBuyingInterest / buyingResponses.length) * 100 : 0,
    };
  };

  const getResponseLabel = (response: string, type: 'pain' | 'pilot' | 'buying') => {
    if (type === 'pain') {
      const labels: Record<PainPointResponse, string> = {
        'not_at_all': 'Not at all',
        'rarely': 'Rarely',
        'sometimes': 'Sometimes',
        'annoying': 'It\'s annoying',
        'real_problem': 'Real problem',
        'major_pain': 'Major pain',
        'critical': 'Critical'
      };
      return labels[response as PainPointResponse];
    }
    
    if (type === 'pilot') {
      const labels: Record<PilotCustomerResponse, string> = {
        'not_interested': 'Not interested',
        'not_right_now': 'Not right now',
        'need_more_info': 'Need more info',
        'cautiously_interested': 'Cautiously interested',
        'interested_with_conditions': 'Interested with conditions',
        'very_interested': 'Very interested',
        'hell_yes': 'Hell yes!'
      };
      return labels[response as PilotCustomerResponse];
    }
    
    if (type === 'buying') {
      const labels: Record<BuyingInterestResponse, string> = {
        'definitely_not': 'Definitely not',
        'unlikely': 'Unlikely',
        'not_sure': 'Not sure',
        'maybe': 'Maybe',
        'probably': 'Probably',
        'very_likely': 'Very likely',
        'absolutely': 'Absolutely'
      };
      return labels[response as BuyingInterestResponse];
    }
    
    return response;
  };

  const dealsWithVoting = deals.filter(deal => 
    deal.stage === 'partner_review' || deal.stage === 'offer' || (deal.total_votes || 0) > 0
  );

  const totalDealsInVoting = dealsWithVoting.length;
  const dealsWithVotes = deals.filter(d => (d.total_votes || 0) > 0).length;
  const totalVotes = deals.reduce((sum, deal) => sum + (deal.total_votes || 0), 0);
  const dealsWithVotesForAvg = deals.filter(d => (d.total_votes || 0) > 0);
  const avgConvictionRate = dealsWithVotesForAvg.length > 0 
    ? dealsWithVotesForAvg.reduce((sum, deal) => {
        const totalVotes = deal.total_votes || 0;
        const positiveVotes = (deal.strong_yes_plus_votes || 0) + (deal.strong_yes_votes || 0);
        return sum + (totalVotes > 0 ? (positiveVotes / totalVotes) * 100 : 0);
      }, 0) / dealsWithVotesForAvg.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customer Development Dashboard</h2>
        <div className="text-sm text-muted-foreground">
          Track LP surveys and customer development insights
        </div>
      </div>

      {/* Voting Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals in Survey</CardTitle>
            <VoteIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDealsInVoting}</div>
            <p className="text-xs text-muted-foreground">
              Active survey processes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Survey Responses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVotes}</div>
            <p className="text-xs text-muted-foreground">
              Across all deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals with Responses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dealsWithVotes}</div>
            <p className="text-xs text-muted-foreground">
              Have received responses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Conviction</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isNaN(avgConvictionRate) ? '0%' : `${avgConvictionRate.toFixed(1)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Positive conviction rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Deals Requiring Votes */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Decisions & Customer Development</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {dealsWithVoting.map((deal) => {
              const insights = getCustomerDevelopmentInsights(deal);
              
              return (
                <div key={deal.id} className="border rounded-lg p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          <Link 
                            href={`/deals/${deal.id}`}
                            className="hover:underline text-primary"
                          >
                            {deal.company_name}
                          </Link>
                        </h3>
                        <Badge className={getStageColor(deal.stage)}>
                          {deal.stage.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {deal.founders && deal.founders.length > 0 
                          ? deal.founders.map(f => f.name).join(', ')
                          : 'N/A'
                        } • {deal.industry} • {formatCurrency(deal.deal_size)}
                      </p>
                      <p className="text-sm">{deal.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={`/deals/${deal.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </Link>
                      </Button>
                      <Button 
                        onClick={() => setSelectedDeal(deal)}
                        size="sm"
                      >
                        <VoteIcon className="h-4 w-4 mr-2" />
                        Survey
                      </Button>
                    </div>
                  </div>

                  <Tabs defaultValue="conviction" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="conviction">Conviction Analysis</TabsTrigger>
                      <TabsTrigger value="customer-dev">Customer Development</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="conviction" className="space-y-4">
                      {/* Voting Progress */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Survey Progress ({deal.total_votes || 0} responses)</span>
                          <span className="text-muted-foreground">
                            {getVotingStatus(deal)}
                          </span>
                        </div>
                        
                        <Progress value={getVotingProgress(deal)} className="h-2" />
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3 text-green-600" />
                              <span>{(deal.strong_yes_plus_votes || 0)} L4</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3 text-blue-600" />
                              <span>{(deal.strong_yes_votes || 0)} L3</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Minus className="h-3 w-3 text-yellow-600" />
                              <span>{(deal.following_pack_votes || 0)} L2</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ThumbsDown className="h-3 w-3 text-red-600" />
                              <span>{deal.no_votes || 0} L1</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ThumbsDown className="h-3 w-3 text-red-800" />
                              <span>{deal.strong_no_votes || 0} L0</span>
                            </div>
                          </div>
                          <span>{getVotingProgress(deal).toFixed(1)}% conviction{typeof deal.net_score === 'number' ? ` • Net score ${deal.net_score}` : ''}</span>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="customer-dev" className="space-y-4">
                      {insights ? (
                        <div className="grid gap-4 md:grid-cols-3">
                          {/* Pain Point Analysis */}
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                <div className="font-medium text-sm">Pain Point Validation</div>
                              </div>
                              <div className="text-2xl font-bold text-orange-600 mb-1">
                                {insights.painPointPercentage.toFixed(0)}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Have significant pain ({insights.strongPainPoints}/{insights.totalResponses} responses)
                              </div>
                            </CardContent>
                          </Card>

                          {/* Pilot Customer Interest */}
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <HeartHandshake className="h-4 w-4 text-blue-500" />
                                <div className="font-medium text-sm">Pilot Interest</div>
                              </div>
                              <div className="text-2xl font-bold text-blue-600 mb-1">
                                {insights.pilotInterestPercentage.toFixed(0)}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Interested in piloting ({insights.interestedPilots}/{insights.totalResponses} responses)
                              </div>
                            </CardContent>
                          </Card>

                          {/* Buying Interest */}
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <ShoppingCart className="h-4 w-4 text-green-500" />
                                <div className="font-medium text-sm">Buying Intent</div>
                              </div>
                              <div className="text-2xl font-bold text-green-600 mb-1">
                                {insights.buyingInterestPercentage.toFixed(0)}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Would purchase ({insights.strongBuyingInterest}/{insights.totalResponses} responses)
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No customer development insights yet</p>
                          <p className="text-sm">Responses will appear here once LPs complete the survey</p>
                        </div>
                      )}

                      {/* Detailed Responses */}
                      {deal.votes && deal.votes.length > 0 && (
                        <div className="space-y-3">
                          <div className="font-medium text-sm">Detailed Customer Development Responses</div>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {deal.votes
                              .filter(vote => vote.pain_point_level || vote.pilot_customer_response || vote.buying_interest_response)
                              .map((vote) => (
                                <div key={vote.id} className="text-sm bg-muted p-3 rounded border-l-4 border-primary">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium">
                                      {(vote as any).lp_name || 'Anonymous'}
                                    </span>
                                    <Badge 
                                      variant={vote.conviction_level >= 3 ? 'default' : vote.conviction_level === 2 ? 'secondary' : 'destructive'}
                                      className="text-xs"
                                    >
                                      Level {vote.strong_no ? 0 : vote.conviction_level}
                                    </Badge>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    {vote.pain_point_level && (
                                      <div>
                                        <span className="text-xs font-medium text-orange-600">Pain Point:</span>
                                        <span className="ml-2">{getResponseLabel(vote.pain_point_level, 'pain')}</span>
                                      </div>
                                    )}
                                    {vote.pilot_customer_response && (
                                      <div>
                                        <span className="text-xs font-medium text-blue-600">Pilot Interest:</span>
                                        <span className="ml-2">{getResponseLabel(vote.pilot_customer_response, 'pilot')}</span>
                                      </div>
                                    )}
                                    {vote.buying_interest_response && (
                                      <div>
                                        <span className="text-xs font-medium text-green-600">Buying Intent:</span>
                                        <span className="ml-2">{getResponseLabel(vote.buying_interest_response, 'buying')}</span>
                                      </div>
                                    )}
                                    {vote.solution_feedback && (
                                      <div>
                                        <span className="text-xs font-medium text-muted-foreground">Solution Feedback:</span>
                                        <p className="ml-2 text-muted-foreground italic">{vote.solution_feedback}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* Recent Feedback */}
                  {deal.votes && deal.votes.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <MessageSquare className="h-4 w-4" />
                        Recent General Feedback
                      </div>
                      <div className="space-y-2">
                        {deal.votes
                          .filter(vote => vote.comments || vote.additional_notes)
                          .slice(0, 2)
                          .map((vote) => (
                            <div key={vote.id} className="text-sm bg-muted p-2 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">
                                  {(vote as any).lp_name || 'Anonymous'}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={vote.conviction_level >= 3 ? 'default' : vote.conviction_level === 2 ? 'secondary' : 'destructive'}
                                    className="text-xs"
                                  >
                                    Level {vote.strong_no ? 0 : vote.conviction_level}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-muted-foreground">
                                {vote.comments || vote.additional_notes}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {dealsWithVoting.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <VoteIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No deals currently in survey phase</p>
                <p className="text-sm">Deals in LP survey or offer stages will appear here for conviction building</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedDeal && (
        <VotingDialog 
          deal={selectedDeal}
          open={!!selectedDeal} 
          onOpenChange={(open) => !open && setSelectedDeal(null)} 
        />
      )}
    </div>
  );
}