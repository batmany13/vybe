"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts'
import { useDeals, useVotes, useLimitedPartners } from '@/client-lib/api-client'
import { Vote, Deal, LimitedPartner } from '@/shared/models'
// Simple date formatting function
const formatDate = (dateString: string, format: 'short' | 'long' = 'short') => {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = format === 'short' 
    ? { month: 'short', day: 'numeric', year: 'numeric' }
    : { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }
  return date.toLocaleDateString('en-US', options)
}
import { MessageSquare, TrendingUp, Users, ThumbsUp, ThumbsDown, AlertCircle, CheckCircle } from 'lucide-react'

const convictionLevelLabels = {
  1: 'No',
  2: 'Following Pack',
  3: 'Strong Yes',
  4: 'Strong Yes + Additional'
}

const convictionLevelColors = {
  1: '#ef4444', // red
  2: '#f59e0b', // amber
  3: '#10b981', // emerald
  4: '#3b82f6'  // blue
}

const painPointLabels = {
  'not_at_all': 'Not at all',
  'rarely': 'Rarely',
  'sometimes': 'Sometimes',
  'annoying': "It's annoying",
  'real_problem': "It's a real problem",
  'major_pain': "It's a major pain",
  'critical': "It's critical"
}

const pilotCustomerLabels = {
  'not_interested': 'Not interested',
  'not_right_now': 'Not right now',
  'need_more_info': 'Need more info',
  'cautiously_interested': 'Cautiously interested',
  'interested_with_conditions': 'Interested with conditions',
  'very_interested': 'Very interested',
  'hell_yes': 'Hell yes!'
}

const buyingInterestLabels = {
  'definitely_not': 'Definitely not',
  'unlikely': 'Unlikely',
  'not_sure': 'Not sure',
  'maybe': 'Maybe',
  'probably': 'Probably',
  'very_likely': 'Very likely',
  'absolutely': 'Absolutely'
}

export default function SurveyResponsesPage() {
  const { data: deals = [] } = useDeals()
  const { data: allVotes = [] } = useVotes()
  const { data: lps = [] } = useLimitedPartners()
  
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const [selectedResponse, setSelectedResponse] = useState<Vote | null>(null)
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false)

  const dealVotes = useMemo(() => {
    if (!selectedDealId) return []
    return allVotes.filter(vote => vote.deal_id === selectedDealId)
  }, [allVotes, selectedDealId])

  const selectedDeal = useMemo(() => {
    return deals.find(deal => deal.id === selectedDealId)
  }, [deals, selectedDealId])

  const dashboard = useMemo(() => {
    const totalResponses = dealVotes.length
    const convictionBreakdown = dealVotes.reduce((acc, vote) => {
      const level = vote.conviction_level || 1
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const averageConviction = totalResponses > 0
      ? dealVotes.reduce((sum, vote) => sum + (vote.conviction_level || 1), 0) / totalResponses
      : 0

    const hasPainPointCount = dealVotes.filter(v => v.has_pain_point).length
    const pilotInterestCount = dealVotes.filter(v => v.pilot_customer_interest).length
    const wouldBuyCount = dealVotes.filter(v => v.would_buy).length

    return {
      totalResponses,
      convictionBreakdown,
      averageConviction,
      hasPainPointCount,
      pilotInterestCount,
      wouldBuyCount,
      painPointPercentage: totalResponses > 0 ? (hasPainPointCount / totalResponses) * 100 : 0,
      pilotInterestPercentage: totalResponses > 0 ? (pilotInterestCount / totalResponses) * 100 : 0,
      wouldBuyPercentage: totalResponses > 0 ? (wouldBuyCount / totalResponses) * 100 : 0
    }
  }, [dealVotes])

  const convictionChartData = Object.entries(dashboard.convictionBreakdown).map(([level, count]) => ({
    name: convictionLevelLabels[Number(level) as 1 | 2 | 3 | 4],
    value: count,
    fill: convictionLevelColors[Number(level) as 1 | 2 | 3 | 4]
  }))

  const customerFeedbackData = [
    { name: 'Has Pain Point', value: dashboard.hasPainPointCount, percentage: dashboard.painPointPercentage },
    { name: 'Pilot Interest', value: dashboard.pilotInterestCount, percentage: dashboard.pilotInterestPercentage },
    { name: 'Would Buy', value: dashboard.wouldBuyCount, percentage: dashboard.wouldBuyPercentage }
  ]

  const chartConfig = {
    value: {
      label: "Responses",
    },
  } satisfies ChartConfig

  const handleResponseClick = (vote: Vote) => {
    setSelectedResponse(vote)
    setIsResponseDialogOpen(true)
  }

  const getLPInfo = (lpId: string): LimitedPartner | undefined => {
    return lps.find(lp => lp.id === lpId)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Deal Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Survey Responses Explorer</CardTitle>
          <CardDescription>Select a deal to view all survey responses and insights</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedDealId || ""} onValueChange={setSelectedDealId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a deal to view responses" />
            </SelectTrigger>
            <SelectContent>
              {deals.map(deal => (
                <SelectItem key={deal.id} value={deal.id}>
                  {deal.company_name} - {deal.funding_round}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedDealId && selectedDeal && (
        <>
          {/* Dashboard Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.totalResponses}</div>
                <p className="text-xs text-muted-foreground">
                  Survey responses collected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Conviction</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.averageConviction.toFixed(1)}/4</div>
                <p className="text-xs text-muted-foreground">
                  {dashboard.averageConviction >= 3 ? 'Strong positive signal' : 
                   dashboard.averageConviction >= 2 ? 'Mixed sentiment' : 'Weak signal'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pain Point Match</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.painPointPercentage.toFixed(0)}%</div>
                <p className="text-xs text-muted-foreground">
                  {dashboard.hasPainPointCount} of {dashboard.totalResponses} experience this pain
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Buying Interest</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.wouldBuyPercentage.toFixed(0)}%</div>
                <p className="text-xs text-muted-foreground">
                  {dashboard.wouldBuyCount} of {dashboard.totalResponses} would purchase this solution
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conviction Level Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={convictionChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {convictionChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Development Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={customerFeedbackData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Response List */}
          <Card>
            <CardHeader>
              <CardTitle>All Responses</CardTitle>
              <CardDescription>Click on any response to view detailed answers</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {dealVotes.map(vote => {
                    const lp = getLPInfo(vote.lp_id)
                    return (
                      <Card 
                        key={vote.id} 
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleResponseClick(vote)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                              <Avatar>
                                <AvatarImage src={lp?.avatar_url} />
                                <AvatarFallback>
                                  {lp?.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{lp?.name || 'Unknown LP'}</p>
                                <p className="text-sm text-muted-foreground">{lp?.company}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge 
                                    variant={vote.conviction_level && vote.conviction_level >= 3 ? "default" : "secondary"}
                                    style={{
                                      backgroundColor: vote.conviction_level ? convictionLevelColors[vote.conviction_level as 1 | 2 | 3 | 4] : undefined
                                    }}
                                  >
                                    {vote.conviction_level ? convictionLevelLabels[vote.conviction_level as 1 | 2 | 3 | 4] : 'No rating'}
                                  </Badge>
                                  {vote.has_pain_point && (
                                    <Badge variant="outline">Has Pain Point</Badge>
                                  )}
                                  {vote.pilot_customer_interest && (
                                    <Badge variant="outline">Pilot Interest</Badge>
                                  )}
                                  {vote.would_buy && (
                                    <Badge variant="outline">Would Buy</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {vote.created_at && formatDate(vote.created_at)}
                            </div>
                          </div>
                          {vote.comments && (
                            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                              {vote.comments}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}

      {/* Response Detail Dialog */}
      <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detailed Survey Response</DialogTitle>
            <DialogDescription>
              Complete survey answers from {selectedResponse && getLPInfo(selectedResponse.lp_id)?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedResponse && (
            <div className="space-y-6">
              {/* LP Info */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={getLPInfo(selectedResponse.lp_id)?.avatar_url} />
                  <AvatarFallback>
                    {getLPInfo(selectedResponse.lp_id)?.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{getLPInfo(selectedResponse.lp_id)?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {getLPInfo(selectedResponse.lp_id)?.company} • {getLPInfo(selectedResponse.lp_id)?.title}
                  </p>
                </div>
              </div>

              <Tabs defaultValue="conviction" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="conviction">Investment Decision</TabsTrigger>
                  <TabsTrigger value="customer">Customer Development</TabsTrigger>
                  <TabsTrigger value="feedback">Detailed Feedback</TabsTrigger>
                </TabsList>

                <TabsContent value="conviction" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Conviction Level</h4>
                    <Badge 
                      className="text-lg px-4 py-2"
                      style={{
                        backgroundColor: selectedResponse.conviction_level ? 
                          convictionLevelColors[selectedResponse.conviction_level as 1 | 2 | 3 | 4] : undefined
                      }}
                    >
                      {selectedResponse.conviction_level ? 
                        convictionLevelLabels[selectedResponse.conviction_level as 1 | 2 | 3 | 4] : 'No rating'}
                    </Badge>
                  </div>
                  
                  {selectedResponse.comments && (
                    <div>
                      <h4 className="font-semibold mb-2">Investment Comments</h4>
                      <p className="text-sm bg-muted p-4 rounded-lg">{selectedResponse.comments}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="customer" className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Pain Point Assessment</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {selectedResponse.has_pain_point ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span>{selectedResponse.has_pain_point ? 'Experiences this pain point' : 'Does not experience this pain point'}</span>
                      </div>
                      {selectedResponse.pain_point_level && (
                        <Badge variant="outline">
                          {painPointLabels[selectedResponse.pain_point_level as keyof typeof painPointLabels]}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Pilot Customer Interest</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {selectedResponse.pilot_customer_interest ? (
                          <ThumbsUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <ThumbsDown className="h-5 w-5 text-red-500" />
                        )}
                        <span>{selectedResponse.pilot_customer_interest ? 'Interested in being a pilot customer' : 'Not interested in pilot'}</span>
                      </div>
                      {selectedResponse.pilot_customer_response && (
                        <Badge variant="outline">
                          {pilotCustomerLabels[selectedResponse.pilot_customer_response as keyof typeof pilotCustomerLabels]}
                        </Badge>
                      )}
                      {selectedResponse.pilot_customer_feedback && (
                        <p className="text-sm bg-muted p-3 rounded-lg mt-2">
                          {selectedResponse.pilot_customer_feedback}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Buying Interest</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {selectedResponse.would_buy ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span>{selectedResponse.would_buy ? 'Would purchase this solution' : 'Would not purchase'}</span>
                      </div>
                      {selectedResponse.buying_interest_response && (
                        <Badge variant="outline">
                          {buyingInterestLabels[selectedResponse.buying_interest_response as keyof typeof buyingInterestLabels]}
                        </Badge>
                      )}
                      {selectedResponse.buying_interest_feedback && (
                        <p className="text-sm bg-muted p-3 rounded-lg mt-2">
                          {selectedResponse.buying_interest_feedback}
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="feedback" className="space-y-4">
                  {selectedResponse.solution_feedback && (
                    <div>
                      <h4 className="font-semibold mb-2">Solution Feedback</h4>
                      <p className="text-sm bg-muted p-4 rounded-lg">{selectedResponse.solution_feedback}</p>
                    </div>
                  )}

                  {selectedResponse.price_feedback && (
                    <div>
                      <h4 className="font-semibold mb-2">Pricing Feedback</h4>
                      <p className="text-sm bg-muted p-4 rounded-lg">{selectedResponse.price_feedback}</p>
                    </div>
                  )}

                  {selectedResponse.additional_notes && (
                    <div>
                      <h4 className="font-semibold mb-2">Additional Notes</h4>
                      <p className="text-sm bg-muted p-4 rounded-lg">{selectedResponse.additional_notes}</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="text-sm text-muted-foreground">
                Submitted on {selectedResponse.created_at && formatDate(selectedResponse.created_at, 'long')}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}