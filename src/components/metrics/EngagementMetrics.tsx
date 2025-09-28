"use client";

import { 
  TrendingUp, 
  PieChart, 
  Users, 
  Activity,
  Award,
  Target,
  MessageSquare,
  ThumbsUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { FundMetrics, LPEngagement } from '@/shared/models';

interface EngagementMetricsProps {
  fundMetrics?: FundMetrics;
  lpEngagement: LPEngagement[];
}

export function EngagementMetrics({ fundMetrics, lpEngagement }: EngagementMetricsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getEngagementLevel = (responseRate: number) => {
    if (responseRate >= 80) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (responseRate >= 60) return { label: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (responseRate >= 40) return { label: 'Fair', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Low', color: 'bg-red-100 text-red-800' };
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 4) return { label: 'High', color: 'bg-green-100 text-green-800' };
    if (confidence >= 3) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Low', color: 'bg-red-100 text-red-800' };
  };

  const sortedEngagement = [...lpEngagement].sort((a, b) => b.response_rate - a.response_rate);
  const topPerformers = sortedEngagement.slice(0, 5);
  const avgResponseRate = lpEngagement.length > 0 
    ? lpEngagement.reduce((sum, lp) => sum + lp.response_rate, 0) / lpEngagement.length 
    : 0;
  const avgConfidence = lpEngagement.length > 0
    ? lpEngagement.reduce((sum, lp) => sum + lp.average_confidence, 0) / lpEngagement.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics & Engagement</h2>
        <div className="text-sm text-muted-foreground">
          LP engagement and fund performance metrics
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fund Size</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(fundMetrics?.total_committed || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total commitments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(avgResponseRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              LP voting participation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Confidence</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgConfidence.toFixed(1)}/5
            </div>
            <p className="text-xs text-muted-foreground">
              Decision confidence level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fundMetrics?.active_deals || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              In pipeline
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Expertise Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Top Expertise Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fundMetrics?.top_expertise_areas?.slice(0, 8).map((area, index) => (
                <div key={area.area} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-sm font-medium">{area.area}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(area.count / (fundMetrics?.total_lps || 1)) * 100} 
                      className="w-16 h-2" 
                    />
                    <span className="text-sm text-muted-foreground w-8">
                      {area.count}
                    </span>
                  </div>
                </div>
              ))}
              {!fundMetrics?.top_expertise_areas?.length && (
                <div className="text-center py-4 text-muted-foreground">
                  <PieChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No expertise data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((lp, index) => (
                <div key={lp.lp_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{lp.name}</div>
                      <div className="text-xs text-muted-foreground">{lp.company}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatPercentage(lp.response_rate)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {lp.total_votes} votes
                    </div>
                  </div>
                </div>
              ))}
              {topPerformers.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No engagement data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed LP Engagement Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            LP Engagement Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Limited Partner</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Total Votes</TableHead>
                <TableHead>Response Rate</TableHead>
                <TableHead>Avg. Confidence</TableHead>
                <TableHead>Engagement Level</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEngagement.map((lp) => {
                const engagement = getEngagementLevel(lp.response_rate);
                const confidence = getConfidenceLevel(lp.average_confidence);
                
                return (
                  <TableRow key={lp.lp_id}>
                    <TableCell className="font-medium">{lp.name}</TableCell>
                    <TableCell>{lp.company}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {lp.total_votes}
                      </div>
                    </TableCell>
                    <TableCell>{formatPercentage(lp.response_rate)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{lp.average_confidence.toFixed(1)}/5</span>
                        <Badge className={confidence.color}>
                          {confidence.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={engagement.color}>
                        {engagement.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(lp.last_activity).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {sortedEngagement.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No engagement data available</p>
              <p className="text-sm">LP engagement metrics will appear here after voting activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}