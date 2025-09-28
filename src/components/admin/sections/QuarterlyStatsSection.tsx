'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Settings,
  Check,
  X,
  AlertCircle,
  ChevronRight,
  Building2,
  Clock,
  Timer
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  useInvestmentGoals, 
  useQuarterlyStats, 
  createInvestmentGoals, 
  updateInvestmentGoals,
  type InvestmentGoal
} from '@/client-lib/api-client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return `${amount.toFixed(0)}`;
}

function getQuarterDates(year: number, quarter: number) {
  const startMonth = (quarter - 1) * 3;
  const endMonth = startMonth + 2;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, endMonth + 1, 0); // Last day of end month
  return { startDate, endDate };
}

function getCurrentQuarterProgress() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentQuarter = Math.floor(currentMonth / 3) + 1;
  
  const { startDate, endDate } = getQuarterDates(currentYear, currentQuarter);
  
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const remainingDays = Math.max(0, totalDays - elapsedDays);
  const progressPercent = (elapsedDays / totalDays) * 100;
  
  return {
    year: currentYear,
    quarter: currentQuarter,
    startDate,
    endDate,
    totalDays,
    elapsedDays,
    remainingDays,
    progressPercent: Math.min(100, Math.max(0, progressPercent))
  };
}

export function QuarterlyStatsSection() {
  const { data: goals, mutate: mutateGoals } = useInvestmentGoals();
  const { data: stats, mutate: mutateStats } = useQuarterlyStats();
  const [showGoalsDialog, setShowGoalsDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Calculate totals from goals array
  const totalGoalAmount = Array.isArray(goals) ? goals.reduce((sum, g) => sum + g.target_investment, 0) : 5000000;
  const totalGoalDeals = Array.isArray(goals) ? goals.reduce((sum, g) => sum + g.target_deals, 0) : 50;
  const avgCheckSize = totalGoalDeals > 0 ? totalGoalAmount / totalGoalDeals : 100000;
  const periodMonths = Array.isArray(goals) && goals.length > 0 ? goals.length * 3 : 24; // quarters * 3
  
  const [formData, setFormData] = useState({
    total_investment_amount: totalGoalAmount,
    investment_period_months: periodMonths,
    average_check_size: avgCheckSize
  });

  const handleSaveGoals = async () => {
    try {
      // Convert form data to quarterly goals
      const numQuarters = Math.ceil(formData.investment_period_months / 3);
      const quarterlyAmount = formData.total_investment_amount / numQuarters;
      const dealsPerQuarter = Math.ceil((formData.total_investment_amount / formData.average_check_size) / numQuarters);
      
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentQuarter = Math.ceil((now.getMonth() + 1) / 3) as 1 | 2 | 3 | 4;
      
      // Create goals for each quarter
      for (let i = 0; i < numQuarters; i++) {
        let year = currentYear;
        let quarter = (currentQuarter + i) as number;
        
        // Handle year rollover
        while (quarter > 4) {
          quarter -= 4;
          year += 1;
        }
        
        const goal: Partial<InvestmentGoal> = {
          year,
          quarter: quarter as 1 | 2 | 3 | 4,
          target_deals: dealsPerQuarter,
          target_investment: quarterlyAmount
        };
        
        await createInvestmentGoals(goal);
      }
      
      toast.success('Investment goals created successfully');
      setShowGoalsDialog(false);
      setIsEditing(false);
      mutateGoals();
      mutateStats();
    } catch (error) {
      toast.error('Failed to save investment goals');
    }
  };

  const quarterlyData = Array.isArray(stats) ? stats.map(q => {
    const goal = Array.isArray(goals) ? goals.find(g => g.year === q.year && g.quarter === q.quarter) : undefined;
    return {
      name: `${q.year} Q${q.quarter}`,
      actual: q.total_invested,
      goal: goal?.target_investment || 0,
      actualCount: q.deals_invested,
      goalCount: goal?.target_deals || 0,
      deals: q.portfolio_companies,
      isFuture: false
    };
  }) : [];

  const quarterProgress = getCurrentQuarterProgress();
  const currentQuarterData = Array.isArray(stats) ? stats.find(
    q => q.year === quarterProgress.year && q.quarter === quarterProgress.quarter
  ) : undefined;
  
  // Calculate overall progress
  const totalInvested = Array.isArray(stats) ? stats.reduce((sum, q) => sum + q.total_invested, 0) : 0;
  const totalDealsInvested = Array.isArray(stats) ? stats.reduce((sum, q) => sum + q.deals_invested, 0) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quarterly Investment Stats</h2>
          <p className="text-muted-foreground mt-1">Track investment performance against quarterly goals</p>
        </div>
        <Button 
          onClick={() => {
            setFormData({
              total_investment_amount: totalGoalAmount,
              investment_period_months: periodMonths,
              average_check_size: avgCheckSize
            });
            setIsEditing(Array.isArray(goals) && goals.length > 0);
            setShowGoalsDialog(true);
          }}
          variant="outline"
        >
          <Settings className="h-4 w-4 mr-2" />
          {Array.isArray(goals) && goals.length > 0 ? 'Edit Goals' : 'Set Goals'}
        </Button>
      </div>

      {/* Investment Goals Summary */}
      {Array.isArray(goals) && goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Investment Goals</CardTitle>
            <CardDescription>Target metrics for the investment period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Investment</p>
                <p className="text-2xl font-bold">{formatCurrency(totalGoalAmount)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Period</p>
                <p className="text-2xl font-bold">{periodMonths} months</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Average Check</p>
                <p className="text-2xl font-bold">{formatCurrency(avgCheckSize)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Target Deals</p>
                <p className="text-2xl font-bold">{totalGoalDeals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Investment Requirements */}
      {Array.isArray(stats) && Array.isArray(goals) && goals.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Next 2 Years Investment Plan
            </CardTitle>
            <CardDescription>Q3 2025 through Q2 2027 deployment targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total to Deploy</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalGoalAmount)}
                </p>
                <p className="text-xs text-muted-foreground">Over 8 quarters</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Deals Needed</p>
                <p className="text-2xl font-bold">
                  {totalGoalDeals}
                </p>
                <p className="text-xs text-muted-foreground">
                  ~{Math.ceil(totalGoalDeals / 8)} per quarter
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Remaining to Deploy</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalGoalAmount - totalInvested)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Remaining to invest
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Quarter Time Progress */}
      {currentQuarterData && (
        <Card className="border-amber-200 dark:border-amber-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Current Quarter Time Progress
            </CardTitle>
            <CardDescription>
              {quarterProgress.year} Q{quarterProgress.quarter} - {quarterProgress.remainingDays} days remaining
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Time Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  Time Elapsed
                </span>
                <span className="font-medium">
                  {quarterProgress.elapsedDays} / {quarterProgress.totalDays} days
                </span>
              </div>
              <Progress value={quarterProgress.progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                {quarterProgress.progressPercent.toFixed(1)}% of quarter completed
              </p>
            </div>

            {/* Deals Progress vs Time */}
            {currentQuarterData && Array.isArray(goals) && (() => {
              const currentGoal = goals.find(g => g.year === quarterProgress.year && g.quarter === quarterProgress.quarter);
              if (!currentGoal) return null;
              
              return (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span>Expected Deals by Now</span>
                  <span className="font-medium">
                    {Math.floor((currentGoal.target_deals * quarterProgress.progressPercent) / 100)} / {currentGoal.target_deals}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Actual Deals Completed</span>
                  <span className="font-medium flex items-center gap-2">
                    {currentQuarterData.deals_invested}
                    {currentQuarterData.deals_invested >= Math.floor((currentGoal.target_deals * quarterProgress.progressPercent) / 100) ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        On track
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Behind by {Math.floor((currentGoal.target_deals * quarterProgress.progressPercent) / 100) - currentQuarterData.deals_invested}
                      </span>
                    )}
                  </span>
                </div>
                
                {/* Visual comparison */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Deal Velocity</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">
                        {currentQuarterData.deals_invested > 0 
                          ? (quarterProgress.elapsedDays / currentQuarterData.deals_invested).toFixed(1)
                          : '∞'
                        }
                      </span>
                      <span className="text-xs text-muted-foreground">days/deal</span>
                    </div>
                    {currentQuarterData.deals_invested > 0 && quarterProgress.remainingDays > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Need {((currentGoal.target_deals - currentQuarterData.deals_invested) > 0 
                          ? (quarterProgress.remainingDays / (currentGoal.target_deals - currentQuarterData.deals_invested)).toFixed(1)
                          : '0'
                        )} days/deal to hit goal
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Amount Progress</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">
                        {formatCurrency(currentQuarterData.total_invested)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(currentGoal.target_investment - currentQuarterData.total_invested)} to go
                    </p>
                  </div>
                </div>
              </div>
              );
            })()}

            {/* Urgency indicator */}
            {quarterProgress.remainingDays <= 30 && Array.isArray(goals) && (() => {
              const currentGoal = goals.find(g => g.year === quarterProgress.year && g.quarter === quarterProgress.quarter);
              return currentGoal && currentQuarterData && currentQuarterData.deals_invested < currentGoal.target_deals ? (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    {quarterProgress.remainingDays} days left to close {currentGoal.target_deals - currentQuarterData.deals_invested} more deals
                  </span>
                </div>
              </div>
            ) : null;
            })()}
          </CardContent>
        </Card>
      )}

      {/* Overall Progress */}
      {Array.isArray(stats) && Array.isArray(goals) && goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Investment Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Amount Invested</span>
                  <span className="font-medium">
                    {formatCurrency(totalInvested)} / {formatCurrency(totalGoalAmount)}
                  </span>
                </div>
                <Progress value={(totalInvested / totalGoalAmount) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">
                  {((totalInvested / totalGoalAmount) * 100).toFixed(1)}% of goal
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Deals Completed</span>
                  <span className="font-medium">
                    {totalDealsInvested} / {totalGoalDeals}
                  </span>
                </div>
                <Progress value={(totalDealsInvested / totalGoalDeals) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">
                  {((totalDealsInvested / totalGoalDeals) * 100).toFixed(1)}% of goal
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Portfolio Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {currentQuarterData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">This Quarter</p>
                      <p className="text-xl font-semibold">
                        {currentQuarterData.deals_invested} deals
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(currentQuarterData.total_invested)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">All Time</p>
                      <p className="text-xl font-semibold">
                        {totalDealsInvested} deals
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(totalInvested)}
                      </p>
                    </div>
                  </div>
                  
                  {currentQuarterData.portfolio_companies > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Recent investments</p>
                      <div className="text-sm text-muted-foreground">
                        {currentQuarterData.portfolio_companies} portfolio companies
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quarterly Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Quarterly Investment Forecast (Q3 2025 - Q2 2027)</CardTitle>
          <CardDescription>Investment targets and actuals for the next 2 years</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="amount" className="space-y-4">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2">
              <TabsTrigger value="amount">Investment Amount</TabsTrigger>
              <TabsTrigger value="count">Number of Deals</TabsTrigger>
            </TabsList>
            
            <TabsContent value="amount" className="space-y-4">
              <ChartContainer
                config={{
                  actual: {
                    label: "Actual Investment",
                    color: "hsl(var(--chart-1))",
                  },
                  goal: {
                    label: "Goal",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[350px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={quarterlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => formatCurrency(value)}
                      className="text-muted-foreground"
                    />
                    <ChartTooltip 
                      content={
                        <ChartTooltipContent 
                          formatter={(value) => formatCurrency(value as number)}
                        />
                      } 
                    />
                    <Legend />
                    <Bar 
                      dataKey="actual" 
                      fill="hsl(var(--chart-1))" 
                      name="Actual"
                    />
                    <Bar 
                      dataKey="goal" 
                      fill="hsl(var(--chart-2))" 
                      opacity={0.7} 
                      name="Goal" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </TabsContent>
            
            <TabsContent value="count" className="space-y-4">
              <ChartContainer
                config={{
                  actualCount: {
                    label: "Actual Deals",
                    color: "hsl(var(--chart-3))",
                  },
                  goalCount: {
                    label: "Goal",
                    color: "hsl(var(--chart-4))",
                  },
                }}
                className="h-[350px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={quarterlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar 
                      dataKey="actualCount" 
                      fill="hsl(var(--chart-3))" 
                      name="Actual Deals"
                    />
                    <Bar 
                      dataKey="goalCount" 
                      fill="hsl(var(--chart-4))" 
                      opacity={0.7} 
                      name="Goal" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quarter by Quarter Breakdown */}
      {Array.isArray(stats) && (
        <Card>
          <CardHeader>
            <CardTitle>Quarter by Quarter Breakdown</CardTitle>
            <CardDescription>Detailed view of investments and targets for each quarter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.map((quarter) => {
                const goal = Array.isArray(goals) ? goals.find(g => g.year === quarter.year && g.quarter === quarter.quarter) : undefined;
                return (
                <div key={`${quarter.year}-Q${quarter.quarter}`} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {quarter.year} Q{quarter.quarter}
                      </span>

                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {goal && (
                        <span className="text-muted-foreground">
                          Target: {goal.target_deals} deals / {formatCurrency(goal.target_investment)}
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        Actual: {quarter.deals_invested} deal{quarter.deals_invested !== 1 ? 's' : ''}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(quarter.total_invested)}
                      </span>
                    </div>
                  </div>
                  
                  {quarter.portfolio_companies > 0 ? (
                    <div className="text-sm text-muted-foreground">
                      <Building2 className="h-3 w-3 inline mr-1" />
                      {quarter.portfolio_companies} portfolio companies
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No investments this quarter</p>
                  )}
                  
                  {goal && (
                    <div className="mt-3 pt-3 border-t flex items-center gap-4">
                      <div className="flex items-center gap-1 text-xs">
                        {quarter.deals_invested >= goal.target_deals ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <X className="h-3 w-3 text-red-600" />
                        )}
                        <span className={quarter.deals_invested >= goal.target_deals ? 'text-green-600' : 'text-red-600'}>
                          {((quarter.deals_invested / goal.target_deals) * 100).toFixed(0)}% of deal target
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {quarter.total_invested >= goal.target_investment ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <X className="h-3 w-3 text-red-600" />
                        )}
                        <span className={quarter.total_invested >= goal.target_investment ? 'text-green-600' : 'text-red-600'}>
                          {((quarter.total_invested / goal.target_investment) * 100).toFixed(0)}% of amount target
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals Dialog */}
      <Dialog open={showGoalsDialog} onOpenChange={setShowGoalsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Investment Goals' : 'Set Investment Goals'}</DialogTitle>
            <DialogDescription>
              Define your investment targets for the specified period
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="total">Total Investment Amount ($)</Label>
              <Input
                id="total"
                type="number"
                value={formData.total_investment_amount}
                onChange={(e) => setFormData({
                  ...formData,
                  total_investment_amount: parseFloat(e.target.value) || 0
                })}
                placeholder="e.g., 5000000"
              />
              <p className="text-xs text-muted-foreground">
                Total amount to invest (e.g., $5M = 5000000)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="period">Investment Period (months)</Label>
              <Input
                id="period"
                type="number"
                value={formData.investment_period_months}
                onChange={(e) => setFormData({
                  ...formData,
                  investment_period_months: parseInt(e.target.value) || 0
                })}
                placeholder="e.g., 24"
              />
              <p className="text-xs text-muted-foreground">
                Number of months to deploy capital (e.g., 24 months)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="check">Average Check Size ($)</Label>
              <Input
                id="check"
                type="number"
                value={formData.average_check_size}
                onChange={(e) => setFormData({
                  ...formData,
                  average_check_size: parseFloat(e.target.value) || 0
                })}
                placeholder="e.g., 100000"
              />
              <p className="text-xs text-muted-foreground">
                Average investment per deal (e.g., $100K = 100000)
              </p>
            </div>
            
            {/* Calculated Goals Preview */}
            <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
              <p className="text-sm font-medium">Calculated Targets:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Deals: </span>
                  <span className="font-medium">
                    {Math.floor(formData.total_investment_amount / formData.average_check_size) || 0}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Per Quarter: </span>
                  <span className="font-medium">
                    {Math.ceil(
                      Math.floor(formData.total_investment_amount / formData.average_check_size) / 
                      Math.ceil(formData.investment_period_months / 3)
                    ) || 0} deals
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Quarterly Amount: </span>
                  <span className="font-medium">
                    {formatCurrency(
                      formData.total_investment_amount / Math.ceil(formData.investment_period_months / 3)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowGoalsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGoals}>
              {isEditing ? 'Update Goals' : 'Set Goals'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}