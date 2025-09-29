'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle,
  Lock,
  XCircle,
  Briefcase,
  Package,
  Calendar,
  Target,
  Eye,
  Shield,
  CheckCircle,
  ExternalLink,
  FileText
} from 'lucide-react';
import { 
  CompanyDetailsSection, 
  FoundingTeamSection, 
  InvestmentDetailsCard,
  PitchDeckEmbed,
  DemoEmbed
} from '@/components/deals/DealComponents';

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
  why_good_fit?: string;
  excitement_note?: string;
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
        console.error('Error fetching public deal:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load deal. Please check your internet connection and try again.');
        }
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
      {/* Hero Header - Match private page exactly */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Shared Deal Information</span>
              </div>
              
              <div className="space-y-3 sm:space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">{deal.company_name}</h1>
                  <Badge className={`${getStageColor(deal.stage)} text-white border-0 self-start sm:self-auto`}>
                    {getStageIcon(deal.stage)}
                    <span className="ml-1">{deal.stage.replace('_', ' ')}</span>
                  </Badge>
                </div>
                
                {/* Desktop: Icon layout for metadata */}
                <div className="hidden sm:flex items-center gap-4 text-muted-foreground">
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

                {/* Mobile: Row layout for metadata */}
                <div className="flex flex-col gap-2 sm:hidden">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Industry</span>
                    <span className="text-sm font-medium">{deal.industry}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Round</span>
                    <span className="text-sm font-medium">{deal.funding_round}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Date</span>
                    <span className="text-sm font-medium">{formatDate(deal.created_at)}</span>
                  </div>
                </div>

                {deal.company_description_short && (
                  <p className="text-sm sm:text-lg text-muted-foreground max-w-3xl mt-3">
                    {deal.company_description_short}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Details using shared component */}
            <CompanyDetailsSection deal={deal} isPublic />

            {/* Founding Team using shared component */}
            <FoundingTeamSection 
              founders={deal.founders}
              foundersLocation={deal.founders_location}
              companyBaseLocation={deal.company_base_location}
              isPublic
            />

            {/* Pitch Deck Embed using shared component - exactly like private page */}
            {deal.pitch_deck_url && (
              <PitchDeckEmbed pitchDeckUrl={deal.pitch_deck_url} />
            )}

            {/* Product Demo Embed using shared component */}
            {demoEmbed && (
              <DemoEmbed demoEmbed={demoEmbed} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Investment Details using shared component */}
            <InvestmentDetailsCard 
              deal={deal}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              isPublic
            />

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