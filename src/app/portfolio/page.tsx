'use client';

import { useState } from 'react';
import { useDealsWithVotesAndFounders } from '@/client-lib/api-client';
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  ExternalLink,
  MoreHorizontal,
  Edit,
  Eye,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  Globe,
  Mail,
  Linkedin,
  Award,
  Briefcase,
  MapPin,
  Hash,
  ArrowUpRight,
  Rocket,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DealWithVotes } from '@/shared/models';
import { EditDealDialog } from '@/components/deals/EditDealDialog';
import { deleteDeal } from '@/client-lib/api-client';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/client-lib/utils';

export default function PortfolioPage() {
  const { data: deals = [], isLoading } = useDealsWithVotesAndFounders();
  const [editingDeal, setEditingDeal] = useState<DealWithVotes | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter deals where stage is 'signed' or 'signed_and_wired' (invested companies)
  const portfolioDeals = deals.filter(deal => 
    deal.stage === 'signed' || deal.stage === 'signed_and_wired'
  );

  const formatCurrency = (amount: number | undefined | null) => {
    if (!amount || isNaN(amount)) {
      return '$0';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this portfolio company?')) {
      try {
        await deleteDeal(id);
        toast.success('Portfolio company deleted successfully');
      } catch (error) {
        toast.error('Failed to delete portfolio company');
      }
    }
  };

  const totalInvestment = portfolioDeals.reduce((sum, deal) => {
    const dealSize = typeof deal.deal_size === 'string' ? parseFloat(deal.deal_size) : deal.deal_size;
    return sum + (dealSize || 0);
  }, 0);

  // Get unique industries and their counts
  const industryDistribution = portfolioDeals.reduce((acc, deal) => {
    acc[deal.industry] = (acc[deal.industry] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate average time since investment
  const avgDaysSinceInvestment = portfolioDeals.length > 0
    ? portfolioDeals.reduce((sum, deal) => {
        const days = Math.floor((Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0) / portfolioDeals.length
    : 0;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading portfolio companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            Portfolio Companies
          </h1>
          <div className="flex gap-2">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid View
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List View
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Track and manage your successful investments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Size</CardTitle>
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {portfolioDeals.length}
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Active investments
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/20">
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
              {formatCurrency(totalInvestment)}
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
              Capital deployed
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Investment</CardTitle>
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              {portfolioDeals.length > 0 
                ? formatCurrency(totalInvestment / portfolioDeals.length)
                : '$0'
              }
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
              Per company
            </p>
          </CardContent>
        </Card>


      </div>

      {/* Portfolio Grid/List */}
      {portfolioDeals.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Portfolio Companies Yet</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Your invested companies will appear here once deals are marked as "invested"
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {portfolioDeals.map((deal) => (
            <Card 
              key={deal.id} 
              className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden"
            >
              {/* Card Header with Gradient */}
              <div className={cn(
                "h-2 bg-gradient-to-r",
                deal.industry.toLowerCase().includes('ai') ? "from-violet-500 to-purple-500" :
                deal.industry.toLowerCase().includes('fintech') ? "from-green-500 to-emerald-500" :
                deal.industry.toLowerCase().includes('health') ? "from-red-500 to-pink-500" :
                deal.industry.toLowerCase().includes('saas') ? "from-blue-500 to-cyan-500" :
                "from-primary to-primary/60"
              )} />
              
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link href={`/deals/${deal.id}`}>
                      <CardTitle className="text-xl hover:text-primary transition-colors cursor-pointer flex items-center gap-2">
                        {deal.company_name}
                        <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardTitle>
                    </Link>
                    <CardDescription className="mt-1">
                      {deal.company_description_short || deal.industry}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/deals/${deal.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingDeal(deal)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="text-xs">
                    {deal.industry}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {deal.funding_round}
                  </Badge>
                  {deal.stage === 'signed' ? (
                    <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Signed
                    </Badge>
                  ) : deal.stage === 'signed_and_wired' ? (
                    <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Invested
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Investment Amount */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-primary/10">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Investment</p>
                      <p className="text-lg font-bold">{formatCurrency(typeof deal.deal_size === 'string' ? parseFloat(deal.deal_size) : (deal.deal_size || 0))}</p>
                    </div>
                  </div>
                  {deal.valuation && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Valuation</p>
                      <p className="text-sm font-semibold">{formatCurrency(typeof deal.valuation === 'string' ? parseFloat(deal.valuation) : deal.valuation)}</p>
                    </div>
                  )}
                </div>

                {/* Founders */}
                {deal.founders && deal.founders.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Founders</p>
                    <div className="flex -space-x-2">
                      {deal.founders.slice(0, 3).map((founder, index) => (
                        <Avatar key={founder.id} className="h-8 w-8 border-2 border-background">
                          <AvatarImage src={founder.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10">
                            {founder.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {deal.founders.length > 3 && (
                        <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                          <span className="text-xs font-medium">+{deal.founders.length - 3}</span>
                        </div>
                      )}
                      <div className="pl-4 flex items-center">
                        <p className="text-sm text-muted-foreground">
                          {deal.founders.map(f => f.name).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Links */}
                <div className="flex gap-2 pt-2">
                  {deal.company_url && (
                    <a 
                      href={deal.company_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <Globe className="h-3 w-3 mr-1" />
                        Website
                      </Button>
                    </a>
                  )}
                  {deal.pitch_deck_url && (
                    <a 
                      href={deal.pitch_deck_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <FileText className="h-3 w-3 mr-1" />
                        Deck
                      </Button>
                    </a>
                  )}
                </div>

                {/* Investment Date */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Invested {new Date(deal.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                  {deal.co_investors && deal.co_investors.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        +{deal.co_investors.length} co-investors
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Company</th>
                  <th className="text-left p-4 font-medium">Founders</th>
                  <th className="text-left p-4 font-medium">Industry</th>
                  <th className="text-left p-4 font-medium">Investment</th>
                  <th className="text-left p-4 font-medium">Round</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {portfolioDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/deals/${deal.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {deal.company_name}
                        </Link>
                        {deal.company_url && (
                          <a 
                            href={deal.company_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      {deal.founders && deal.founders.length > 0 
                        ? deal.founders.map(f => f.name).join(', ')
                        : '-'
                      }
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">{deal.industry}</Badge>
                    </td>
                    <td className="p-4 font-semibold">
                      {formatCurrency(typeof deal.deal_size === 'string' ? parseFloat(deal.deal_size) : (deal.deal_size || 0))}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{deal.funding_round}</Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(deal.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/deals/${deal.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingDeal(deal)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {editingDeal && (
        <EditDealDialog 
          deal={editingDeal}
          open={!!editingDeal} 
          onOpenChange={(open) => !open && setEditingDeal(null)} 
        />
      )}
    </div>
  );
}