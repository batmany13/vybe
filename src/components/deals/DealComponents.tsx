"use client";
// Updated to fix import issues

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ExternalLink,
  Building2,
  DollarSign,
  MapPin,
  TrendingUp,
  Users,
  Globe,
  Rocket,
  Target,
  Heart,
  ChevronRight,
  Info,
  FileText,
  PlayCircle,
  Linkedin,
  Lightbulb,
  CalendarCheck
} from 'lucide-react';
import { TextWithLinks } from '@/client-lib/link-parser';
import { DealWithVotes } from '@/shared/models';

interface Founder {
  id: string;
  name: string;
  bio?: string;
  linkedin_url?: string;
  email?: string;
  avatar_url?: string;
}

interface CompanyDetailsSectionProps {
  deal: {
    description?: string;
    excitement_note?: string;
    why_good_fit?: string;
    company_url?: string;
    pitch_deck_url?: string;
    working_duration?: string;
    user_traction?: string;
    traction_progress?: string;
    founder_motivation?: string;
    competition_differentiation?: string;
  };
  dealLinks?: Array<{ id: string; title: string; url: string; }>;
  isPublic?: boolean;
}

export function CompanyDetailsSection({ deal, dealLinks, isPublic }: CompanyDetailsSectionProps) {
  return (
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

        {deal.excitement_note && (
          <div className="space-y-2 p-3 rounded-lg bg-primary/5 border">
            <h4 className="text-sm font-medium text-primary flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Why we're excited
            </h4>
            <p className="text-sm leading-relaxed">
              <TextWithLinks>{deal.excitement_note}</TextWithLinks>
            </p>
          </div>
        )}

        {deal.why_good_fit && (
          <div className="space-y-2 p-3 rounded-lg bg-muted/50 border">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              {isPublic ? 'Investment Fit' : 'Why this is a fit for Gandhi Capital'}
            </h4>
            <p className="text-sm leading-relaxed">
              <TextWithLinks>{deal.why_good_fit}</TextWithLinks>
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

          {/* Additional Links from Partners */}
          {!isPublic && dealLinks && dealLinks.length > 0 && dealLinks.map((link) => (
            <a 
              key={link.id}
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">{link.title}</p>
                <p className="text-xs text-muted-foreground">Shared by partner</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          ))}
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
  );
}

interface FoundingTeamSectionProps {
  founders: Founder[];
  foundersLocation?: string;
  companyBaseLocation?: string;
  founderNotes?: Array<{ lpName: string; note: string; founderId: string; }>;
  isPublic?: boolean;
}

export function FoundingTeamSection({ 
  founders, 
  foundersLocation, 
  companyBaseLocation, 
  founderNotes,
  isPublic 
}: FoundingTeamSectionProps) {
  if (!founders || founders.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Founding Team
        </CardTitle>
        {(foundersLocation || companyBaseLocation) && (
          <CardDescription className="flex items-center gap-4 mt-2">
            {foundersLocation && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Currently in {foundersLocation}
              </span>
            )}
            {companyBaseLocation && companyBaseLocation !== foundersLocation && (
              <span className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                Moving to {companyBaseLocation}
              </span>
            )}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {founders.map((founder) => {
            // Get partner notes for this founder (only for authenticated view)
            const founderSpecificNotes = !isPublic && founderNotes ? 
              founderNotes.filter(note => note.founderId === founder.id) : [];

            return (
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
                    <div className="flex items-center gap-2">
                      {!isPublic && founder.email && (
                        <a 
                          href={`mailto:${founder.email}`}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="Send email"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
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
                  </div>
                  {founder.bio && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <TextWithLinks>{founder.bio}</TextWithLinks>
                    </p>
                  )}
                  
                  {/* Partner Notes for this Founder (only for authenticated view) */}
                  {!isPublic && founderSpecificNotes && founderSpecificNotes.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Partner Notes:</div>
                      {founderSpecificNotes.map((note, index) => (
                        <div key={index} className="p-2 bg-primary/5 rounded text-xs border">
                          <div className="font-medium text-primary">{note.lpName}:</div>
                          <div className="italic text-muted-foreground">
                            "<TextWithLinks>{note.note}</TextWithLinks>"
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface PitchDeckEmbedProps {
  pitchDeckUrl: string;
}

export function PitchDeckEmbed({ pitchDeckUrl }: PitchDeckEmbedProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Pitch Deck
        </CardTitle>
        <CardDescription>
          View the presentation directly here or{' '}
          <a 
            href={pitchDeckUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary hover:underline"
          >
            open in new tab
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {(() => {
          // Check if it's a Google Slides/Docs URL that can be embedded
          const isGoogleDocs = pitchDeckUrl.includes('docs.google.com') || pitchDeckUrl.includes('drive.google.com');
          const isDropbox = pitchDeckUrl.includes('dropbox.com');
          const isDocsend = pitchDeckUrl.includes('docsend.com');
          
          // For Google Docs/Slides, try to construct embed URL
          let embedUrl = pitchDeckUrl;
          if (isGoogleDocs) {
            // Convert sharing URL to embed URL for Google Slides
            if (pitchDeckUrl.includes('/presentation/d/')) {
              const docId = pitchDeckUrl.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/)?.[1];
              if (docId) {
                embedUrl = `https://docs.google.com/presentation/d/${docId}/embed?start=false&loop=false&delayms=3000`;
              }
            } else if (pitchDeckUrl.includes('/file/d/')) {
              const fileId = pitchDeckUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)?.[1];
              if (fileId) {
                embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
              }
            }
          } else if (isDropbox && pitchDeckUrl.includes('dl=0')) {
            // Convert Dropbox sharing link to embed
            embedUrl = pitchDeckUrl.replace('dl=0', 'raw=1');
          }
          
          // Check if it's a PDF or image that can be displayed
          const isPDF = pitchDeckUrl.toLowerCase().endsWith('.pdf');
          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(pitchDeckUrl);
          
          if (isPDF) {
            return (
              <div className="w-full h-[600px] overflow-hidden rounded-md border bg-gray-100 dark:bg-gray-900">
                <iframe
                  src={`${pitchDeckUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  title="Pitch Deck PDF"
                  className="w-full h-full"
                  style={{ border: 'none' }}
                />
              </div>
            );
          } else if (isImage) {
            return (
              <div className="w-full overflow-hidden rounded-md border">
                <img 
                  src={pitchDeckUrl} 
                  alt="Pitch Deck" 
                  className="w-full h-auto"
                />
              </div>
            );
          } else if (isDocsend) {
            return (
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p><strong>DocSend Presentation</strong></p>
                      <p>This presentation is hosted on DocSend and requires email verification to view. It cannot be embedded directly.</p>
                      <a 
                        href={pitchDeckUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open DocSend Presentation
                      </a>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            );
          } else if (isGoogleDocs) {
            return (
              <div className="w-full h-[600px] overflow-hidden rounded-md border bg-gray-100 dark:bg-gray-900">
                <iframe
                  src={embedUrl}
                  title="Pitch Deck"
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                />
              </div>
            );
          } else {
            // Fallback: try to embed any URL in an iframe
            return (
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    The pitch deck may not display correctly in embedded view. For the best experience, please open it in a new tab.
                  </AlertDescription>
                </Alert>
                <div className="w-full h-[600px] overflow-hidden rounded-md border bg-gray-100 dark:bg-gray-900">
                  <iframe
                    src={embedUrl}
                    title="Pitch Deck"
                    className="w-full h-full"
                    frameBorder="0"
                    sandbox="allow-scripts allow-same-origin allow-popups"
                  />
                </div>
              </div>
            );
          }
        })()}
      </CardContent>
    </Card>
  );
}

interface DemoEmbedProps {
  demoEmbed: {
    kind: 'iframe' | 'video';
    src: string;
    title: string;
  };
}

export function DemoEmbed({ demoEmbed }: DemoEmbedProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-primary" />
          Product Demo
        </CardTitle>
        <CardDescription>Watch the demo directly here</CardDescription>
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
  );
}

interface InvestmentDetailsSectionProps {
  deal: {
    deal_size: number;
    valuation?: number;
    close_date?: string;
    stage: string;
    updated_at: string;
    raising_amount?: number;
    confirmed_amount?: number;
    safe_or_equity?: string;
    has_revenue?: boolean;
    revenue_amount?: number;
    lead_investor?: string;
    co_investors?: string[];
  };
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  isPublic?: boolean;
  isEditing?: boolean;
  onEditCloseDate?: () => void;
}

export function InvestmentDetailsCard({ 
  deal, 
  formatCurrency, 
  formatDate, 
  isPublic,
  isEditing,
  onEditCloseDate 
}: InvestmentDetailsSectionProps) {
  const displayCloseDateIso = deal.close_date ?? 
    ((deal.stage === 'signed' || deal.stage === 'signed_and_wired') ? deal.updated_at : undefined);

  return (
    <Card className="overflow-hidden border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Investment Details
        </CardTitle>
        {!isPublic && (deal.stage === 'signed' || deal.stage === 'signed_and_wired') && (
          <CardDescription className="mt-2 flex items-center gap-2">
            <CalendarCheck className="h-3 w-3 text-green-600" />
            <span className="text-green-700 dark:text-green-400 font-medium">
              Closed on {displayCloseDateIso ? formatDate(displayCloseDateIso) : '—'}
            </span>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            {isPublic ? 'Investment size' : 'Amount we\'re considering investing'}
          </p>
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
          <div className="space-y-4">
            {(() => {
              const raisingAmount = deal.raising_amount || 0;
              const confirmedAmount = deal.confirmed_amount || 0;
              const percentage = raisingAmount > 0 ? (confirmedAmount / raisingAmount) * 100 : 0;
              const isOversubscribed = confirmedAmount > raisingAmount;
              const oversubscribedPercentage = isOversubscribed ? ((confirmedAmount - raisingAmount) / raisingAmount) * 100 : 0;
              const remainingPercentage = !isOversubscribed ? Math.max(0, 100 - percentage) : 0;
              
              return (
                <>
                  {!isPublic && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Funding Progress
                          {isOversubscribed ? (
                            <span className="ml-2 text-xs text-emerald-600">
                              (+{oversubscribedPercentage.toFixed(0)}% oversubscribed)
                            </span>
                          ) : (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({remainingPercentage.toFixed(0)}% remaining)
                            </span>
                          )}
                        </span>
                        <span className={`text-sm font-bold ${
                          isOversubscribed ? "text-emerald-600" : 
                          percentage >= 75 ? "text-blue-600" : 
                          percentage >= 50 ? "text-amber-600" : "text-muted-foreground"
                        }`}>
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="relative">
                        <div className="h-8 bg-muted rounded-lg overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 relative ${
                              isOversubscribed 
                                ? "bg-gradient-to-r from-emerald-500 to-emerald-600" 
                                : percentage >= 75 
                                  ? "bg-gradient-to-r from-blue-500 to-blue-600"
                                  : percentage >= 50
                                    ? "bg-gradient-to-r from-amber-500 to-amber-600"
                                    : "bg-gradient-to-r from-gray-400 to-gray-500"
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          >
                            {percentage >= 10 && (
                              <div className="absolute inset-0 flex items-center justify-end pr-2">
                                <span className="text-xs font-medium text-white">
                                  {percentage.toFixed(0)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Oversubscribed Extension */}
                        {isOversubscribed && (
                          <div 
                            className="absolute top-0 left-full h-8 bg-gradient-to-r from-emerald-400 to-emerald-500 animate-pulse rounded-r-lg"
                            style={{ 
                              width: `${Math.min(oversubscribedPercentage, 100)}%`
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Amount Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {isPublic ? 'Raising' : 'Target'}
                      </p>
                      <p className="text-sm font-semibold">{formatCurrency(raisingAmount)}</p>
                    </div>
                    {confirmedAmount > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Confirmed {isOversubscribed && "🔥"}
                        </p>
                        <p className={`text-sm font-semibold ${
                          isOversubscribed ? "text-emerald-600" : ""
                        }`}>
                          {formatCurrency(confirmedAmount)}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {deal.safe_or_equity && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">
              {isPublic ? 'Structure' : 'Investment Type'}
            </span>
            <Badge variant="outline" className="font-medium">
              {deal.safe_or_equity}
            </Badge>
          </div>
        )}
        
        {deal.has_revenue && deal.revenue_amount && (
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <span className="text-sm text-muted-foreground">Revenue</span>
            <span className="text-sm font-semibold text-green-600">
              {formatCurrency(deal.revenue_amount)}
            </span>
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
  );
}