'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ExternalLink,
  Building2,
  DollarSign,
  MapPin,
  Calendar,
  TrendingUp,
  Users,
  Globe,
  Rocket,
  Target,
  Package,
  Briefcase,
  Heart,
  ChevronRight,
  Info,
  FileText,
  PlayCircle,
  Linkedin,
  Lightbulb,
  Eye,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TextWithLinks } from '@/client-lib/link-parser';

interface PublicDeal {
  id: string;
  company_name: string;
  industry: string;
  stage: string;
  deal_size: number;
  valuation?: number;
  description: string;
  company_description_short?: string;
  company_url?: string;
  pitch_deck_url?: string;
  demo_url?: string;
  funding_round: string;
  founders_location?: string;
  company_base_location?: string;
  working_duration?: string;
  user_traction?: string;
  traction_progress?: string;
  founder_motivation?: string;
  competition_differentiation?: string;
  why_good_fit_for_cto_fund?: string;
  quang_excited_note?: string;
  raising_amount?: number;
  confirmed_amount: number;
  safe_or_equity?: string;
  lead_investor?: string;
  co_investors?: string[];
  has_revenue: boolean;
  revenue_amount?: number;
  created_at: string;
  updated_at: string;
  founders: Array<{
    id: string;
    name: string;
    bio?: string;
    linkedin_url?: string;
    avatar_url?: string;
  }>;
}

export default function PublicDealPage() {
  const params = useParams();
  const shareKey = params?.shareKey as string;
  const [deal, setDeal] = useState<PublicDeal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const response = await fetch(`/api/public/deals/${shareKey}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch deal');
        }
        
        const dealData = await response.json();
        setDeal(dealData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deal');
      } finally {
        setIsLoading(false);
      }
    };

    if (shareKey) {
      fetchDeal();
    }
  }, [shareKey]);

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
      'sourcing_reached_out': 'bg-cyan-500',
      'sourcing_meeting_booked': 'bg-indigo-500',
      'sourcing_meeting_done_deciding': 'bg-violet-500',
      'partner_review': 'bg-amber-500',
      'offer': 'bg-purple-500',
      'signed': 'bg-emerald-500',
      'signed_and_wired': 'bg-green-500',
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-500';
  };

  const getStageIcon = (stage: string) => {
    const icons = {
      'sourcing': Target,
      'sourcing_reached_out': ExternalLink,
      'sourcing_meeting_booked': Calendar,
      'sourcing_meeting_done_deciding': Eye,
      'partner_review': Shield,
      'offer': FileText,
      'signed': CheckCircle,
      'signed_and_wired': CheckCircle,
    };
    const Icon = icons[stage as keyof typeof icons] || Target;
    return <Icon className="h-4 w-4" />;
  };

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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="flex flex-1 items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="flex flex-1 items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            {error.includes('expired') ? (
              <>
                <AlertTriangle className="h-16 w-16 mx-auto text-amber-500" />
                <h2 className="text-2xl font-bold">Link Expired</h2>
                <p className="text-muted-foreground max-w-md">
                  This share link has expired. Please contact the person who shared it for a new link.
                </p>
              </>
            ) : error.includes('revoked') ? (
              <>
                <Lock className="h-16 w-16 mx-auto text-red-500" />
                <h2 className="text-2xl font-bold">Access Revoked</h2>
                <p className="text-muted-foreground max-w-md">
                  This share link has been revoked and is no longer accessible.
                </p>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 mx-auto text-red-500" />
                <h2 className="text-2xl font-bold">Deal Not Found</h2>
                <p className="text-muted-foreground max-w-md">
                  {error}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!deal) {
    return null;
  }

  const demoEmbed = getDemoEmbed(deal.demo_url);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="space-y-3 sm:space-y-2">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Shared Deal Information</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">{deal.company_name}</h1>
              <Badge className={`${getStageColor(deal.stage)} text-white border-0 self-start sm:self-auto`}>
                {getStageIcon(deal.stage)}
                <span className="ml-1">{deal.stage.replace('_', ' ')}</span>
              </Badge>
            </div>
            
            {/* Metadata */}
            <div className="flex items-center gap-4 text-muted-foreground flex-wrap">
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
            </div>

            {deal.company_description_short && (
              <p className="text-sm sm:text-lg text-muted-foreground max-w-3xl mt-3">
                {deal.company_description_short}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Company Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {deal.description && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Overview</h4>
                    <p className="text-sm leading-relaxed">
                      <TextWithLinks>{deal.description}</TextWithLinks>
                    </p>
                  </div>
                )}

                {deal.quang_excited_note && (
                  <div className="space-y-2 p-3 rounded-lg bg-primary/5 border">
                    <h4 className="text-sm font-medium text-primary flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Why we're excited
                    </h4>
                    <p className="text-sm leading-relaxed">
                      <TextWithLinks>{deal.quang_excited_note}</TextWithLinks>
                    </p>
                  </div>
                )}

                {deal.why_good_fit_for_cto_fund && (
                  <div className="space-y-2 p-3 rounded-lg bg-muted/50 border">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      Investment Fit
                    </h4>
                    <p className="text-sm leading-relaxed">
                      <TextWithLinks>{deal.why_good_fit_for_cto_fund}</TextWithLinks>
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {deal.company_url && (
                    <a 
                      href={deal.company_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <Globe className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Website</p>
                        <p className="text-xs text-muted-foreground truncate">{deal.company_url}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  
                  {deal.pitch_deck_url && (
                    <a 
                      href={deal.pitch_deck_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Pitch Deck</p>
                        <p className="text-xs text-muted-foreground">View presentation</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                </div>

                {/* Traction Progress */}
                {(deal.working_duration || deal.traction_progress || deal.user_traction) && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Rocket className="h-4 w-4" />
                        Traction & Progress
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {deal.working_duration && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Working on this</p>
                            <p className="text-sm font-medium">
                              <TextWithLinks>{deal.working_duration}</TextWithLinks>
                            </p>
                          </div>
                        )}
                        {deal.user_traction && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">User traction</p>
                            <p className="text-sm font-medium">
                              <TextWithLinks>{deal.user_traction}</TextWithLinks>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Motivation & Competition */}
                {(deal.founder_motivation || deal.competition_differentiation) && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Vision & Market
                      </h4>
                      {deal.founder_motivation && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Why this idea?</p>
                          <p className="text-sm leading-relaxed">
                            <TextWithLinks>{deal.founder_motivation}</TextWithLinks>
                          </p>
                        </div>
                      )}
                      {deal.competition_differentiation && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Competitive advantage</p>
                          <p className="text-sm leading-relaxed">
                            <TextWithLinks>{deal.competition_differentiation}</TextWithLinks>
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Founding Team */}
            {deal.founders && deal.founders.length > 0 && (
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Founding Team
                  </CardTitle>
                  {(deal.founders_location || deal.company_base_location) && (
                    <CardDescription className="flex items-center gap-4 mt-2">
                      {deal.founders_location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Currently in {deal.founders_location}
                        </span>
                      )}
                      {deal.company_base_location && deal.company_base_location !== deal.founders_location && (
                        <span className="flex items-center gap-1">
                          <ChevronRight className="h-3 w-3" />
                          Moving to {deal.company_base_location}
                        </span>
                      )}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {deal.founders.map((founder) => (
                      <div key={founder.id} className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <Avatar className="h-14 w-14 border-2 border-primary/20">
                          <AvatarImage src={founder.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {founder.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-lg">{founder.name}</h4>
                            {founder.linkedin_url && (
                              <a 
                                href={founder.linkedin_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                                title="View LinkedIn"
                              >
                                <Linkedin className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                          {founder.bio && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              <TextWithLinks>{founder.bio}</TextWithLinks>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pitch Deck Embed */}
            {deal.pitch_deck_url && (
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Pitch Deck
                  </CardTitle>
                  <CardDescription>
                    View the presentation directly here or{' '}
                    <a href={deal.pitch_deck_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      open in new tab
                    </a>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="w-full h-[600px] overflow-hidden rounded-md border bg-gray-100 dark:bg-gray-900">
                    <iframe
                      src={deal.pitch_deck_url}
                      title="Pitch Deck"
                      className="w-full h-full"
                      frameBorder="0"
                      allowFullScreen
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Product Demo Embed */}
            {demoEmbed && (
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-primary" />
                    Product Demo
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {demoEmbed.kind === 'iframe' ? (
                    <div className="aspect-video w-full overflow-hidden rounded-md border bg-black">
                      <iframe
                        src={demoEmbed.src}
                        title={demoEmbed.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    <video
                      src={demoEmbed.src}
                      controls
                      className="w-full rounded-md border bg-black"
                    />
                  )}
                </CardContent>
              </Card>
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
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Investment size</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(deal.deal_size)}</p>
                </div>
                
                {deal.valuation && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Valuation</p>
                    <p className="text-xl font-semibold">{formatCurrency(deal.valuation)}</p>
                  </div>
                )}

                <Separator />
                
                {/* Funding Progress */}
                {deal.raising_amount && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Raising</p>
                      <p className="text-lg font-semibold">{formatCurrency(deal.raising_amount)}</p>
                    </div>
                    
                    {deal.confirmed_amount > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Confirmed</p>
                        <p className="text-lg font-semibold text-green-600">{formatCurrency(deal.confirmed_amount)}</p>
                      </div>
                    )}
                  </div>
                )}

                {deal.safe_or_equity && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Structure</span>
                    <Badge variant="outline" className="font-medium">
                      {deal.safe_or_equity}
                    </Badge>
                  </div>
                )}
                
                {deal.has_revenue && deal.revenue_amount && (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">Revenue</span>
                    <span className="text-sm font-semibold text-green-600">{formatCurrency(deal.revenue_amount)}</span>
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

            {/* Powered by */}
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="text-sm font-medium text-muted-foreground">
                    Powered by <span className="font-bold text-primary">Gandhi Capital</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This deal information was shared securely through our platform.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}