"use client";

import { useEffect, useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ExternalLink,
  Building,
  User,
  DollarSign,
  MessageSquare,
  Heart,
  Target,
  CheckCircle,
  ArrowRight,
  Lock,
  ChevronDown,
  ChevronUp,
  Info,
  Link as LinkIcon,
  Plus,
  Trash2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createVote, useDealsWithVotesAndFounders, useLimitedPartners, useDealLinks, useDeal } from '@/client-lib/api-client';
import { useSelectedLP } from '@/contexts/SelectedLPContext';
import { DealWithVotes, Vote, LimitedPartner } from '@/shared/models';
import { toast } from 'sonner';
import { Loader2, Edit3, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { updateDeal } from '@/client-lib/api-client';



interface VotingDialogProps {
  deal: DealWithVotes;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VotingDialog({ deal, open, onOpenChange }: VotingDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRecap, setSubmittedRecap] = useState<{
    conviction?: Vote['conviction_level'];
    reviewStatus?: Vote['review_status'];
  } | null>(null);
  const router = useRouter();
  const [dealInfoOpen, setDealInfoOpen] = useState(false);
  
  // Get the selected LP from context and all LPs
  const { selectedLP, setSelectedLP, isLoading: lpLoading, isAutoMatched } = useSelectedLP();
  const { data: allDeals = [], mutate: mutateDeals } = useDealsWithVotesAndFounders();
  const { data: allLPs = [] } = useLimitedPartners();
  const { data: dealLinks = [] } = useDealLinks(deal.id);
  const { data: currentDeal, mutate: mutateDeal } = useDeal(deal.id);
  
  // Local state for LP selection if none selected globally
  const [localSelectedLP, setLocalSelectedLP] = useState<string>('');

  // Conviction Level (1-4) or Review Status
  const [convictionLevel, setConvictionLevel] = useState<Vote['conviction_level']>();
  const [reviewStatus, setReviewStatus] = useState<Vote['review_status']>('to_review');
  

  

  
  // Additional feedback
  const [comments, setComments] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [founderSpecificNotes, setFounderSpecificNotes] = useState<Record<string, string>>({});

  // Deal URLs for additional info
  const [dealUrls, setDealUrls] = useState<{ title: string; url: string }[]>([]);

  // Editing state for partners
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedDeal, setEditedDeal] = useState<Partial<DealWithVotes>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Get the effective selected LP (from context or local selection)
  const effectiveSelectedLP = selectedLP || (localSelectedLP ? allLPs.find(lp => lp.id === localSelectedLP) : null);

  // Check if user is a partner (can edit deal information)
  const isPartner = effectiveSelectedLP && (effectiveSelectedLP.partner_type === 'general_partner' || effectiveSelectedLP.partner_type === 'venture_partner');

  // Deal URL management functions
  const addDealUrl = () => {
    setDealUrls(prev => [...prev, { title: '', url: '' }]);
  };

  const updateDealUrl = (index: number, field: 'title' | 'url', value: string) => {
    setDealUrls(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeDealUrl = (index: number) => {
    setDealUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Founder notes management functions
  const updateFounderNote = (founderId: string, note: string) => {
    setFounderSpecificNotes(prev => ({
      ...prev,
      [founderId]: note
    }));
  };

  // Helper function to get conviction level display text
  const getConvictionLevelText = (level?: Vote['conviction_level'], reviewStatus?: Vote['review_status']) => {
    if (reviewStatus === 'to_review') return 'To Review';
    if (!level) return '';
    
    const labels = {
      4: '4 - Strong yes',
      3: '3 - Leaning yes', 
      2: '2 - Leaning no',
      1: '1 - Strong no'
    };
    return labels[level];
  };

  useEffect(() => {
    if (open) {
      setIsSubmitted(false);
      setSubmittedRecap(null);
      
      // Recalculate next deal when dialog opens
      setNextDeal(getNextDeal());
      
      // If user has already voted, populate the form with their previous responses
      if (effectiveSelectedLP) {
        const existingVote = (deal.votes || []).find(v => v.lp_id === effectiveSelectedLP.id);
        if (existingVote) {
          if (existingVote.review_status) {
            setReviewStatus(existingVote.review_status);
            setConvictionLevel(undefined);
          } else {
            setConvictionLevel(existingVote.conviction_level);
            setReviewStatus(undefined);
          }
          setComments(existingVote.comments || '');
          setAdditionalNotes(existingVote.additional_notes || '');
          
          // Load founder-specific notes if they exist
          try {
            const founderNotesData = existingVote.founder_specific_notes ? JSON.parse(existingVote.founder_specific_notes) : {};
            setFounderSpecificNotes(founderNotesData);
          } catch (e) {
            setFounderSpecificNotes({});
          }
          
          // Load existing deal links for this LP  
          const lpLinks = dealLinks.filter(link => link.lp_id === effectiveSelectedLP.id);
          setDealUrls(lpLinks.map(link => ({ title: link.title, url: link.url })));
        } else {
          // Reset to defaults for new votes
          setConvictionLevel(undefined);
          setReviewStatus('to_review');
          setComments('');
          setAdditionalNotes('');
          setFounderSpecificNotes({});
          
          // Still load deal links even if no existing vote
          const lpLinks = dealLinks.filter(link => link.lp_id === effectiveSelectedLP.id);
          setDealUrls(lpLinks.map(link => ({ title: link.title, url: link.url })));
        }
      } else {
        // If no selected LP, clear deal URLs and reset to default
        setDealUrls([]);
        setConvictionLevel(undefined);
        setReviewStatus('to_review');
      }
    }
  }, [open, effectiveSelectedLP, deal.votes, allDeals, dealLinks]);
  
  // Update next deal when LP selection changes
  useEffect(() => {
    setNextDeal(getNextDeal());
  }, [effectiveSelectedLP, allDeals]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStageColor = (stage: string) => {
    const colors = {
      'sourcing': 'bg-gray-100 text-gray-800',
      'screening': 'bg-blue-100 text-blue-800', 
      'due_diligence': 'bg-yellow-100 text-yellow-800',
      'term_sheet': 'bg-purple-100 text-purple-800',
      'closed_won': 'bg-green-100 text-green-800',
      'closed_lost': 'bg-red-100 text-red-800',
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };





  // Calculate next deal - need to exclude the current deal and any deals the LP has already voted on
  const getNextDeal = () => {
    if (!effectiveSelectedLP) return null;
    
    // Filter for LP survey deals that haven't been voted on by this LP
    const eligible = allDeals
      .filter(d => {
        // Must be in Partner Review stage
        if (d.stage !== 'partner_review') return false;
        // Must not be the current deal
        if (d.id === deal.id) return false;
        // Check if LP has already voted on this deal
        const hasVoted = (d.votes || []).some(v => v.lp_id === effectiveSelectedLP.id);
        return !hasVoted;
      })
      .sort((a, b) => {
        // Sort by survey deadline first (urgent ones first)
        if (a.survey_deadline && b.survey_deadline) {
          const dateA = new Date(a.survey_deadline).getTime();
          const dateB = new Date(b.survey_deadline).getTime();
          if (dateA !== dateB) return dateA - dateB;
        }
        // Then by creation date (oldest first)
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    
    return eligible[0] ?? null;
  };

  const [nextDeal, setNextDeal] = useState(() => getNextDeal());

  // Functions for inline editing
  const startEditing = (field: string, currentValue: any) => {
    setEditingField(field);
    setEditedDeal({ ...editedDeal, [field]: currentValue });
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditedDeal({});
  };

  const saveEdit = async (field: string) => {
    // Allow saving empty strings to clear fields, but don't save if the field wasn't modified
    if (!(field in editedDeal)) return;
    
    setIsSavingEdit(true);
    try {
      // Convert empty strings to null for database storage
      const valueToSave = editedDeal[field] === '' ? null : editedDeal[field];
      
      await updateDeal(deal.id, { [field]: valueToSave });
      
      // Force refresh both the individual deal and deals list
      await Promise.all([
        mutateDeals(),
        mutateDeal()
      ]);
      
      setEditingField(null);
      setEditedDeal({});
      toast.success('Deal information updated');
    } catch (error) {
      console.error('Error updating deal:', error);
      toast.error('Failed to update deal information');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const renderEditableField = (field: string, currentValue: string | null | undefined, label: string, multiline = false) => {
    if (editingField === field) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => saveEdit(field)}
                disabled={isSavingEdit}
                className="h-6 w-6 p-0"
              >
                {isSavingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={cancelEditing}
                disabled={isSavingEdit}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {multiline ? (
            <Textarea
              value={editedDeal[field] || ''}
              onChange={(e) => setEditedDeal({ ...editedDeal, [field]: e.target.value })}
              className="text-sm"
              rows={3}
              autoFocus
            />
          ) : (
            <Input
              value={editedDeal[field] || ''}
              onChange={(e) => setEditedDeal({ ...editedDeal, [field]: e.target.value })}
              className="text-sm"
              autoFocus
            />
          )}
        </div>
      );
    }

    return (
      <div className="group relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
            <p className={`text-sm ${multiline ? 'leading-relaxed' : ''} ${!currentValue ? 'text-muted-foreground italic' : ''}`}>
              {currentValue || 'No information provided'}
            </p>
          </div>
          {isPartner && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => startEditing(field, currentValue ?? '')}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const handleGoToNextDeal = () => {
    if (nextDeal) {
      onOpenChange(false);
      router.push(`/deals/${nextDeal.id}`);
    } else {
      onOpenChange(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveSelectedLP) {
      toast.error('Please select a Limited Partner to respond as');
      return;
    }

    setIsLoading(true);

    try {
      const voteData: Partial<Vote> & { deal_links?: { title: string; url: string }[] } = {
        deal_id: deal.id,
        lp_id: effectiveSelectedLP.id,
        conviction_level: reviewStatus ? undefined : convictionLevel,
        review_status: reviewStatus,
        comments: comments.trim() || undefined,
        additional_notes: additionalNotes.trim() || undefined,
        founder_specific_notes: Object.keys(founderSpecificNotes).length > 0 ? JSON.stringify(founderSpecificNotes) : undefined,
        deal_links: dealUrls.filter(url => url.title.trim() && url.url.trim()),
      };
      
      await createVote(voteData);
      
      // Refresh deals data to get updated votes
      await mutateDeals();
      
      setIsSubmitted(true);
      setSubmittedRecap({
        conviction: convictionLevel,
        reviewStatus: reviewStatus,
      });
      const isToReview = reviewStatus === 'to_review';
      const actionText = hasAlreadyVoted ? 'updated' : 'submitted';
      const responseType = isToReview ? 'Response' : 'Survey response';
      toast.success(`${responseType} ${actionText} successfully`);
      
      // After refreshing data, recalculate next deal
      // Use setTimeout to ensure state updates have propagated
      setTimeout(() => {
        setNextDeal(getNextDeal());
      }, 100);
      
      // Reset form for the next time the dialog opens
      setConvictionLevel(undefined);
      setReviewStatus('to_review');
      setComments('');
      setAdditionalNotes('');
      setFounderSpecificNotes({});
      setDealUrls([]);
    } catch (error) {
      toast.error('Failed to submit survey response');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if current user's LP has already voted
  const existingVotes = deal.votes || [];
  const hasAlreadyVoted = !!(effectiveSelectedLP && existingVotes.some(v => v.lp_id === effectiveSelectedLP.id));

  // Use the most up-to-date deal data (from SWR cache or props)
  const activeDeal = currentDeal || deal;

  // Render deal information cards
  const renderDealInfo = () => (
    <>
      {/* Company Overview */}
      <Card className="h-fit">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{activeDeal.company_name}</h3>
                {(activeDeal.website_url || activeDeal.company_url) && (
                  <a 
                    href={activeDeal.website_url || activeDeal.company_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge className={getStageColor(activeDeal.stage)}>
                  {activeDeal.stage.replace('_', ' ')}
                </Badge>
                <Badge variant="outline">
                  {activeDeal.funding_round}
                </Badge>
              </div>
            </div>
            
            {activeDeal.company_description_short && (
              <div>
                <p className="text-sm text-muted-foreground italic">
                  "{activeDeal.company_description_short}"
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                {renderEditableField('industry', activeDeal.industry || '', 'Industry')}
              </div>

              {(activeDeal.founders_location || activeDeal.company_base_location) && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Location
                  </div>
                  <div className="space-y-2">
                    {activeDeal.founders_location && (
                      <div>
                        {renderEditableField('founders_location', activeDeal.founders_location, 'Founders Location')}
                      </div>
                    )}
                    {activeDeal.company_base_location && (
                      <div>
                        {renderEditableField('company_base_location', activeDeal.company_base_location, 'Company Location')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeDeal.demo_url && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Demo
                  </div>
                  <a 
                    href={activeDeal.demo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    View Demo <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {activeDeal.pitch_deck_url && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Pitch Deck
                  </div>
                  <a 
                    href={activeDeal.pitch_deck_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    View Deck <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
            
            <div className="pt-2 border-t">
              {renderEditableField('description', activeDeal.description, 'Description', true)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quang's Excitement */}
      {deal.quang_excited_note && (
        <Card className="h-fit border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-primary">
              <Heart className="h-4 w-4" />
              Quang's excitement
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm leading-relaxed">{deal.quang_excited_note}</p>
          </CardContent>
        </Card>
      )}

      {/* Gandhi Capital Fit */}
      {activeDeal.why_good_fit_for_cto_fund && (
        <Card className="h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Fit with Gandhi Capital
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {renderEditableField('why_good_fit_for_cto_fund', activeDeal.why_good_fit_for_cto_fund || '', 'Fit with Gandhi Capital', true)}
          </CardContent>
        </Card>
      )}

      {/* Founders */}
      <Card className="h-fit">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              Founders
            </div>
            
            {activeDeal.founders && activeDeal.founders.length > 0 ? (
              <div className="space-y-4">
                {activeDeal.founders.map(founder => {
                  // Get partner notes for this founder
                  const founderNotes = (deal.votes || [])
                    .map(vote => {
                      const lp = allLPs.find(l => l.id === vote.lp_id);
                      if (!vote.founder_specific_notes || !lp) return null;
                      
                      try {
                        const founderSpecificNotes = JSON.parse(vote.founder_specific_notes);
                        const note = founderSpecificNotes[founder.id];
                        return note && note.trim() ? { lpName: lp.name, note: note.trim() } : null;
                      } catch (e) {
                        return null;
                      }
                    })
                    .filter(Boolean);

                  return (
                    <div key={founder.id} className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={founder.avatar_url} alt={founder.name} />
                        <AvatarFallback className="text-xs">
                          {founder.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{founder.name}</div>
                          {founder.linkedin_url && (
                            <a 
                              href={founder.linkedin_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        {founder.bio && (
                          <p className="text-xs text-muted-foreground leading-relaxed">{founder.bio}</p>
                        )}
                        
                        {/* Partner Notes for this Founder */}
                        {founderNotes.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <div className="text-xs font-medium text-muted-foreground">Partner Notes:</div>
                            {founderNotes.map((note, index) => (
                              <div key={index} className="p-2 bg-muted/50 rounded text-xs">
                                <div className="font-medium text-muted-foreground">{note.lpName}:</div>
                                <div className="italic">"{note.note}"</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No founder information available</p>
            )}

            {activeDeal.working_duration && (
              <div className="pt-2 border-t">
                {renderEditableField('working_duration', activeDeal.working_duration, 'Working Duration', true)}
              </div>
            )}

            {activeDeal.founder_motivation && (
              <div className="pt-2 border-t">
                {renderEditableField('founder_motivation', activeDeal.founder_motivation, 'Why This Idea?', true)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financial Details */}
      <Card className="h-fit">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Financial Details
            </div>
            
            <div className="space-y-2">
              <div>
                {editingField === 'deal_size' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium text-muted-foreground">Deal Size</Label>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => saveEdit('deal_size')}
                          disabled={isSavingEdit}
                          className="h-6 w-6 p-0"
                        >
                          {isSavingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditing}
                          disabled={isSavingEdit}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Input
                      type="number"
                      value={editedDeal.deal_size || ''}
                      onChange={(e) => setEditedDeal({ ...editedDeal, deal_size: parseFloat(e.target.value) || 0 })}
                      className="text-sm"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="group relative">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-xs font-medium text-muted-foreground">Deal Size</div>
                        <p className="text-sm font-semibold">{formatCurrency(activeDeal.deal_size)}</p>
                      </div>
                      {isPartner && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing('deal_size', activeDeal.deal_size)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {activeDeal.valuation && (
                <div>
                  {editingField === 'valuation' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-medium text-muted-foreground">Valuation</Label>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => saveEdit('valuation')}
                            disabled={isSavingEdit}
                            className="h-6 w-6 p-0"
                          >
                            {isSavingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditing}
                            disabled={isSavingEdit}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Input
                        type="number"
                        value={editedDeal.valuation || ''}
                        onChange={(e) => setEditedDeal({ ...editedDeal, valuation: parseFloat(e.target.value) || 0 })}
                        className="text-sm"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="group relative">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-xs font-medium text-muted-foreground">Valuation</div>
                          <p className="text-sm font-semibold">{formatCurrency(activeDeal.valuation)}</p>
                        </div>
                        {isPartner && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing('valuation', activeDeal.valuation)}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeDeal.raising_amount && (
                <div>
                  {renderEditableField('raising_amount', formatCurrency(activeDeal.raising_amount), 'Raising Amount')}
                </div>
              )}

              {activeDeal.confirmed_amount > 0 && (
                <div>
                  {renderEditableField('confirmed_amount', formatCurrency(activeDeal.confirmed_amount), 'Confirmed Amount')}
                </div>
              )}

              {activeDeal.safe_or_equity && (
                <div>
                  {renderEditableField('safe_or_equity', activeDeal.safe_or_equity, 'Structure')}
                </div>
              )}

              {activeDeal.lead_investor && (
                <div>
                  {renderEditableField('lead_investor', activeDeal.lead_investor, 'Lead Investor')}
                </div>
              )}

              {activeDeal.co_investors && activeDeal.co_investors.length > 0 && (
                <div>
                  {renderEditableField('co_investors', activeDeal.co_investors.join(', '), 'Co-investors')}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traction & Market */}
      <Card className="h-fit">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">
              Traction & Market
            </div>
            
            <div className="space-y-2">
              {activeDeal.has_revenue && activeDeal.revenue_amount && (
                <div>
                  {editingField === 'revenue_amount' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-medium text-muted-foreground">Revenue</Label>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => saveEdit('revenue_amount')}
                            disabled={isSavingEdit}
                            className="h-6 w-6 p-0"
                          >
                            {isSavingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditing}
                            disabled={isSavingEdit}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Input
                        type="number"
                        value={editedDeal.revenue_amount || ''}
                        onChange={(e) => setEditedDeal({ ...editedDeal, revenue_amount: parseFloat(e.target.value) || 0 })}
                        className="text-sm"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="group relative">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-xs font-medium text-muted-foreground">Revenue</div>
                          <p className="text-sm font-medium text-green-600">{formatCurrency(activeDeal.revenue_amount)}</p>
                        </div>
                        {isPartner && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing('revenue_amount', activeDeal.revenue_amount)}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeDeal.traction_progress && (
                <div>
                  {renderEditableField('traction_progress', activeDeal.traction_progress, 'Progress', true)}
                </div>
              )}

              {activeDeal.user_traction && (
                <div>
                  {renderEditableField('user_traction', activeDeal.user_traction, 'User Traction', true)}
                </div>
              )}

              {activeDeal.competition_differentiation && (
                <div>
                  {renderEditableField('competition_differentiation', activeDeal.competition_differentiation, 'Competition & Edge', true)}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-7xl h-[100dvh] sm:h-auto sm:max-h-[90vh] p-0 flex flex-col overflow-hidden rounded-none sm:rounded-lg">
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 flex-shrink-0">
          <DialogHeader>
            <DialogTitle>Partner View</DialogTitle>
            <p className="text-muted-foreground text-sm">
              {reviewStatus === 'to_review' 
                ? 'Mark this deal for review or provide your investment perspective'
                : 'Help us understand your perspective on this investment opportunity'
              }
            </p>
          </DialogHeader>


        </div>
        
        {isSubmitted ? (
          <div className="flex items-center justify-center flex-1 px-4 sm:px-6 pb-4 sm:pb-6">
            <Card className="max-w-2xl w-full">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    submittedRecap?.reviewStatus === 'to_review' 
                      ? 'bg-gray-100 text-gray-700' 
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    <CheckCircle className="h-7 w-7" />
                  </div>
                </div>
                <CardTitle>
                  {submittedRecap?.reviewStatus === 'to_review' ? 'Response Submitted' : 'Review Submitted'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground text-center">
                  {submittedRecap?.reviewStatus === 'to_review' 
                    ? `You've marked ${deal.company_name} for further review.`
                    : `Here is a quick recap of your response for ${deal.company_name}.`
                  }
                </div>
                
                {/* Show remaining deals count */}
                {(() => {
                  const remainingDeals = allDeals.filter(d => 
                    d.stage === 'partner_review' && 
                    d.id !== deal.id &&
                    !(d.votes || []).some(v => v.lp_id === effectiveSelectedLP?.id)
                  );
                  return remainingDeals.length > 0 ? (
                    <div className="text-center">
                      <Badge variant="secondary">
                        {remainingDeals.length} more {remainingDeals.length === 1 ? 'deal' : 'deals'} to evaluate
                      </Badge>
                    </div>
                  ) : null;
                })()}
                {submittedRecap && (
                  <div className="grid gap-3 sm:grid-cols-1">
                    <div className="p-3 rounded border bg-muted/30 text-center">
                      <div className="text-xs text-muted-foreground">
                        {submittedRecap.reviewStatus ? 'Review Status' : 'Conviction Level'}
                      </div>
                      <div className="text-lg font-semibold">
                        {getConvictionLevelText(submittedRecap.conviction, submittedRecap.reviewStatus)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                  <Button onClick={handleGoToNextDeal} disabled={!nextDeal}>
                    {nextDeal ? (
                      <>
                        Next: {nextDeal.company_name}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        All caught up!
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Mobile: Collapsible Deal Info */}
            <div className="sm:hidden px-4 mb-2">
              <Collapsible open={dealInfoOpen} onOpenChange={setDealInfoOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>Deal Info: {deal.company_name}</span>
                    {dealInfoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-4 max-h-[50vh] overflow-y-auto">
                  {renderDealInfo()}
                </CollapsibleContent>
              </Collapsible>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col sm:flex-row gap-4 sm:gap-6 px-4 sm:px-6">
              {/* Desktop: Left Column - Deal Information */}
              <div className="hidden sm:block w-1/3 space-y-4 overflow-y-auto pr-2">
                {renderDealInfo()}
              </div>

              {/* Right Column - Survey Questions */}
              <div className="flex-1 sm:w-2/3 overflow-y-auto pb-20 sm:pb-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* LP Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Responding As</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {lpLoading ? (
                        <div className="flex items-center gap-3">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span className="text-sm text-muted-foreground">Loading your profile...</span>
                        </div>
                      ) : !effectiveSelectedLP ? (
                        <div className="space-y-2">
                          <Label htmlFor="lp-select">Select Limited Partner</Label>
                          <Alert className="mb-3">
                            <Info className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              We couldn't automatically match your account to a Limited Partner. Please select which LP you're responding as.
                            </AlertDescription>
                          </Alert>
                          <Select 
                            value={localSelectedLP} 
                            onValueChange={(value) => {
                              setLocalSelectedLP(value);
                              const selectedLPObject = allLPs.find(lp => lp.id === value);
                              if (selectedLPObject) {
                                setSelectedLP(selectedLPObject);
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Choose which LP you're responding as..." />
                            </SelectTrigger>
                            <SelectContent>
                              {allLPs.filter(lp => lp.status === 'active').map((lp) => (
                                <SelectItem key={lp.id} value={lp.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{lp.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {lp.title} at {lp.company}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={effectiveSelectedLP.avatar_url} alt={effectiveSelectedLP.name} />
                              <AvatarFallback>
                                {effectiveSelectedLP.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="font-medium text-sm sm:text-base">{effectiveSelectedLP.name}</div>
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                {effectiveSelectedLP.title} at {effectiveSelectedLP.company}
                              </div>
                              {isAutoMatched && (
                                <div className="text-xs text-primary mt-1">
                                  ✓ Auto-matched to your account
                                </div>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedLP(null);
                                setLocalSelectedLP('');
                              }}
                            >
                              Change
                            </Button>
                          </div>
                          {hasAlreadyVoted && (
                            <Alert className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800">
                              <CheckCircle className="h-4 w-4" />
                              <AlertDescription>
                                <strong>Survey already completed!</strong> You have already submitted a response for this deal. 
                                Submitting again will update your previous response.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Conviction Level */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">
                        Your Opinion
                        <span className="ml-2 text-xs text-red-500">*Required</span>
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        How do you feel about this investment opportunity?
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <RadioGroup 
                        value={reviewStatus === 'to_review' ? 'to_review' : (convictionLevel?.toString() || '')} 
                        onValueChange={(value) => {
                          if (value === 'to_review') {
                            setReviewStatus('to_review');
                            setConvictionLevel(undefined);
                          } else {
                            setConvictionLevel(parseInt(value) as Vote['conviction_level']);
                            setReviewStatus(undefined);
                          }
                        }}
                        className="space-y-3"
                      >
                        <div className="flex items-start space-x-3 p-2 sm:p-3 border rounded-lg bg-gray-50">
                          <RadioGroupItem value="to_review" id="to_review" className="mt-1" />
                          <Label htmlFor="to_review" className="cursor-pointer flex-1 text-xs sm:text-sm">
                            <div className="font-medium text-gray-700">To Review</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Need more time or information to provide a numeric opinion
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center gap-2 my-2">
                          <div className="flex-1 h-px bg-border"></div>
                          <span className="text-xs text-muted-foreground px-2">Or provide numeric opinion</span>
                          <div className="flex-1 h-px bg-border"></div>
                        </div>
                        <div className="flex items-start space-x-3 p-2 sm:p-3 border rounded-lg">
                          <RadioGroupItem value="4" id="level4" className="mt-1" />
                          <Label htmlFor="level4" className="cursor-pointer flex-1 text-xs sm:text-sm">
                            <div className="font-medium text-green-700">4 - Strong yes</div>
                          </Label>
                        </div>
                        <div className="flex items-start space-x-3 p-2 sm:p-3 border rounded-lg">
                          <RadioGroupItem value="3" id="level3" className="mt-1" />
                          <Label htmlFor="level3" className="cursor-pointer flex-1 text-xs sm:text-sm">
                            <div className="font-medium text-blue-700">3 - Leaning yes</div>
                          </Label>
                        </div>
                        <div className="flex items-start space-x-3 p-2 sm:p-3 border rounded-lg">
                          <RadioGroupItem value="2" id="level2" className="mt-1" />
                          <Label htmlFor="level2" className="cursor-pointer flex-1 text-xs sm:text-sm">
                            <div className="font-medium text-orange-700">2 - Leaning no</div>
                          </Label>
                        </div>
                        <div className="flex items-start space-x-3 p-2 sm:p-3 border rounded-lg">
                          <RadioGroupItem value="1" id="level1" className="mt-1" />
                          <Label htmlFor="level1" className="cursor-pointer flex-1 text-xs sm:text-sm">
                            <div className="font-medium text-red-700">1 - Strong no</div>
                          </Label>
                        </div>
                      </RadioGroup>

                      <div className="space-y-2">
                        <Label htmlFor="comments" className="text-sm">Opinion Comments</Label>
                        <Textarea
                          id="comments"
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="Share your overall thoughts about this investment opportunity..."
                          rows={3}
                          className="text-sm"
                        />
                      </div>
                    </CardContent>
                  </Card>



                  {/* Additional Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                        Additional Notes
                        <span className="ml-2 text-xs text-muted-foreground">(Optional)</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="additionalNotes" className="text-sm">Additional Notes</Label>
                        <Textarea
                          id="additionalNotes"
                          value={additionalNotes}
                          onChange={(e) => setAdditionalNotes(e.target.value)}
                          placeholder="Any other thoughts, concerns, or insights you'd like to share..."
                          rows={3}
                          className="text-sm"
                        />
                      </div>

                      {/* Individual Founder Notes */}
                      {deal.founders && deal.founders.length > 0 && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Notes on Individual Founders</Label>
                          {deal.founders.map(founder => (
                            <div key={founder.id} className="space-y-2 p-3 border rounded-lg bg-muted/30">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 border">
                                  <AvatarImage src={founder.avatar_url} alt={founder.name} />
                                  <AvatarFallback className="text-xs">
                                    {founder.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-sm font-medium">{founder.name}</div>
                                  <div className="text-xs text-muted-foreground">Notes for this founder</div>
                                </div>
                              </div>
                              <Textarea
                                value={founderSpecificNotes[founder.id] || ''}
                                onChange={(e) => updateFounderNote(founder.id, e.target.value)}
                                placeholder={`Your thoughts about ${founder.name}...`}
                                rows={2}
                                className="text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Additional Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        Additional Info
                        <span className="ml-2 text-xs text-muted-foreground">(Optional)</span>
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Add relevant links related to this deal
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {dealUrls.map((urlItem, index) => (
                          <div key={index} className="flex gap-2">
                            <div className="flex-1 space-y-2">
                              <Input
                                placeholder="Link title (e.g., 'Company LinkedIn', 'News Article')"
                                value={urlItem.title}
                                onChange={(e) => updateDealUrl(index, 'title', e.target.value)}
                                className="text-sm"
                              />
                              <Input
                                type="url"
                                placeholder="https://..."
                                value={urlItem.url}
                                onChange={(e) => updateDealUrl(index, 'url', e.target.value)}
                                className="text-sm"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeDealUrl(index)}
                              className="self-start mt-[2px]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addDealUrl}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Link
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Submit Buttons - Fixed at bottom on mobile */}
                  <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 sm:relative sm:p-0 sm:border-0 sm:bg-transparent">
                    <div className="flex justify-end space-x-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isLoading || !effectiveSelectedLP || (!convictionLevel && !reviewStatus)}
                        className="min-w-[100px] sm:min-w-[140px]"
                      >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {hasAlreadyVoted 
                          ? 'Update Response' 
                          : (reviewStatus === 'to_review' ? 'Mark for Review' : 'Submit Response')
                        }
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}