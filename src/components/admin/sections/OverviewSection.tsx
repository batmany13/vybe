"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Target, 
  MessageSquareText, 
  Plus, 
  Building2, 
  TrendingUp,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/client-lib/utils";
import { useQuarterlyStats, useInvestmentGoals } from "@/client-lib/api-client";

export type QuickStat = {
  label: string;
  value: number | string;
  icon: any;
  color: string;
  bgColor: string;
  subLabel?: string;
};

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

function getCurrentQuarter() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentQuarter = Math.floor(currentMonth / 3) + 1;
  return { year: currentYear, quarter: currentQuarter };
}

export function OverviewSection({
  quickStats,
  onCreateUpdate,
  onCreateDeal,
}: {
  quickStats: QuickStat[];
  onCreateUpdate: () => void;
  onCreateDeal: () => void;
}) {
  const { data: stats } = useQuarterlyStats();
  const { data: goals } = useInvestmentGoals();
  
  const currentQuarter = getCurrentQuarter();
  const currentQuarterData = Array.isArray(stats) ? stats.find(
    q => q.year === currentQuarter.year && q.quarter === currentQuarter.quarter
  ) : undefined;

  // Calculate overall progress
  const totalInvested = Array.isArray(stats) ? stats.reduce((sum, s) => sum + s.total_invested, 0) : 0;
  const totalDeals = Array.isArray(stats) ? stats.reduce((sum, s) => sum + s.deals_invested, 0) : 0;
  const totalGoalAmount = Array.isArray(goals) ? goals.reduce((sum, g) => sum + g.target_investment, 0) : 0;
  const totalGoalDeals = Array.isArray(goals) ? goals.reduce((sum, g) => sum + g.target_deals, 0) : 0;
  const avgCheckSize = totalGoalDeals > 0 ? totalGoalAmount / totalGoalDeals : 100000;
  
  const amountProgress = totalGoalAmount > 0 ? (totalInvested / totalGoalAmount) * 100 : 0;
  const dealsProgress = totalGoalDeals > 0 ? (totalDeals / totalGoalDeals) * 100 : 0;

  // Quarter progress
  const currentGoal = Array.isArray(goals) ? goals.find(
    g => g.year === currentQuarter.year && g.quarter === currentQuarter.quarter
  ) : undefined;
  const quarterGoalAmount = currentGoal?.target_investment || 0;
  const quarterGoalDeals = currentGoal?.target_deals || 0;
  const quarterActualAmount = currentQuarterData?.total_invested || 0;
  const quarterActualDeals = currentQuarterData?.deals_invested || 0;
  
  const quarterAmountProgress = quarterGoalAmount > 0 ? (quarterActualAmount / quarterGoalAmount) * 100 : 0;
  const quarterDealsProgress = quarterGoalDeals > 0 ? (quarterActualDeals / quarterGoalDeals) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics Summary - Moved to top */}
      {Array.isArray(stats) && stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Investment Summary</CardTitle>
            <CardDescription>Key performance indicators at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <p className="text-xl font-bold">{formatCurrency(totalInvested)}</p>
                <p className="text-xs text-muted-foreground">
                  {amountProgress.toFixed(0)}% of goal
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Deals</p>
                <p className="text-xl font-bold">{totalDeals}</p>
                <p className="text-xs text-muted-foreground">
                  {dealsProgress.toFixed(0)}% of target
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">This Quarter</p>
                <p className="text-xl font-bold">{quarterActualDeals} deals</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(quarterActualAmount)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Check Size</p>
                <p className="text-xl font-bold">
                  {totalDeals > 0 ? formatCurrency(totalInvested / totalDeals) : '-'}
                </p>
                <p className="text-xs text-muted-foreground">
                  vs {formatCurrency(avgCheckSize)} target
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={onCreateUpdate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Monthly Update
            </Button>
            <Button variant="outline" onClick={onCreateDeal}>
              <Building2 className="h-4 w-4 mr-2" />
              Add New Deal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Investment KPIs */}
      {Array.isArray(goals) && goals.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Overall Investment Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Overall Investment Progress
              </CardTitle>
              <CardDescription>Total fund deployment status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Amount Invested</span>
                  <span className="font-medium">
                    {formatCurrency(totalInvested)} / {formatCurrency(totalGoalAmount)}
                  </span>
                </div>
                <Progress value={amountProgress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{amountProgress.toFixed(1)}% deployed</span>
                  <span>{formatCurrency(totalGoalAmount - totalInvested)} remaining</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Deals Completed</span>
                  <span className="font-medium">
                    {totalDeals} / {totalGoalDeals}
                  </span>
                </div>
                <Progress value={dealsProgress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{dealsProgress.toFixed(1)}% completed</span>
                  <span>{totalGoalDeals - totalDeals} deals to go</span>
                </div>
              </div>

              <div className="pt-2 border-t grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Average Check</p>
                  <p className="font-medium">
                    {totalDeals > 0 ? formatCurrency(totalInvested / totalDeals) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Target Average</p>
                  <p className="font-medium">{formatCurrency(avgCheckSize)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Quarter Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Current Quarter Progress
              </CardTitle>
              <CardDescription>
                {currentQuarter.year} Q{currentQuarter.quarter} performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Quarter Amount</span>
                  <span className="font-medium">
                    {formatCurrency(quarterActualAmount)} / {formatCurrency(quarterGoalAmount)}
                  </span>
                </div>
                <Progress value={quarterAmountProgress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{quarterAmountProgress.toFixed(1)}% of target</span>
                  {quarterAmountProgress >= 100 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Goal achieved
                    </span>
                  ) : (
                    <span>{formatCurrency(quarterGoalAmount - quarterActualAmount)} to go</span>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Quarter Deals</span>
                  <span className="font-medium">
                    {quarterActualDeals} / {quarterGoalDeals}
                  </span>
                </div>
                <Progress value={quarterDealsProgress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{quarterDealsProgress.toFixed(1)}% completed</span>
                  {quarterDealsProgress >= 100 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Target met
                    </span>
                  ) : (
                    <span>{quarterGoalDeals - quarterActualDeals} deals needed</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t">
                {quarterAmountProgress < 50 && quarterDealsProgress < 50 ? (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Quarter needs attention</span>
                  </div>
                ) : quarterAmountProgress >= 100 && quarterDealsProgress >= 100 ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Excellent quarter performance!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>On track for the quarter</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    {stat.subLabel && (
                      <p className="text-xs text-muted-foreground mt-1">{stat.subLabel}</p>
                    )}
                  </div>
                  <div className={cn("p-3 rounded-full", stat.bgColor)}>
                    <Icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  );
}