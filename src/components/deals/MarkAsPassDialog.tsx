"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { updateDeal } from '@/client-lib/api-client';
import { DealWithVotes } from '@/shared/models';
import { toast } from 'sonner';
import { Loader2, X, UserX, Ban } from 'lucide-react';

interface MarkAsPassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: DealWithVotes;
}

type PassReason = 
  | 'market_size'
  | 'competition'
  | 'team_concerns'
  | 'business_model'
  | 'traction'
  | 'timing'
  | 'valuation'
  | 'fit_mismatch'
  | 'execution_risk'
  | 'other';

type DeclineReason =
  | 'no_response'
  | 'declined_offer'
  | 'accepted_competitor'
  | 'decided_not_raise'
  | 'terms_mismatch'
  | 'other';

const passReasons: Record<PassReason, { label: string; description: string }> = {
  market_size: {
    label: "Market Size Too Small",
    description: "The total addressable market isn't large enough for our investment thesis"
  },
  competition: {
    label: "Competitive Landscape",
    description: "Too competitive or established players have significant advantages"
  },
  team_concerns: {
    label: "Team Concerns", 
    description: "Questions about the founding team's ability to execute or relevant experience"
  },
  business_model: {
    label: "Business Model Issues",
    description: "Unclear path to profitability or sustainable unit economics"
  },
  traction: {
    label: "Insufficient Traction",
    description: "Not enough customer validation, growth, or market traction for this stage"
  },
  timing: {
    label: "Market Timing",
    description: "Too early or too late to market, or external timing factors"
  },
  valuation: {
    label: "Valuation Concerns",
    description: "Valuation doesn't align with stage, metrics, or comparable companies"
  },
  fit_mismatch: {
    label: "Fund Fit Mismatch",
    description: "Doesn't align with our investment focus, stage, or portfolio strategy"
  },
  execution_risk: {
    label: "High Execution Risk",
    description: "Significant technical, operational, or regulatory execution challenges"
  },
  other: {
    label: "Other Reason",
    description: "Please specify in the comments section"
  }
};

const declineReasons: Record<DeclineReason, { label: string; description: string }> = {
  no_response: {
    label: "No Response",
    description: "Founders didn't respond to our outreach or follow-ups"
  },
  declined_offer: {
    label: "Declined Our Offer",
    description: "Founders explicitly declined our investment offer"
  },
  accepted_competitor: {
    label: "Went with Another Investor",
    description: "Founders chose to work with a different investor or fund"
  },
  decided_not_raise: {
    label: "Decided Not to Raise",
    description: "Founders decided not to raise funding at this time"
  },
  terms_mismatch: {
    label: "Terms Mismatch",
    description: "Couldn't agree on valuation, terms, or investment structure"
  },
  other: {
    label: "Other Reason",
    description: "Please specify in the comments section"
  }
};

export function MarkAsPassDialog({ open, onOpenChange, deal }: MarkAsPassDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [closureType, setClosureType] = useState<'we_passed' | 'they_declined' | ''>('');
  const [selectedPassReason, setSelectedPassReason] = useState<PassReason | ''>('');
  const [selectedDeclineReason, setSelectedDeclineReason] = useState<DeclineReason | ''>('');
  const [comments, setComments] = useState('');

  const handleSubmit = async () => {
    if (!closureType) {
      toast.error('Please select whether we passed or they declined');
      return;
    }

    if (closureType === 'we_passed' && !selectedPassReason) {
      toast.error('Please select a reason for passing on this deal');
      return;
    }

    if (closureType === 'they_declined' && !selectedDeclineReason) {
      toast.error('Please select a reason for their decline');
      return;
    }

    setIsLoading(true);
    try {
      let passNote = '';
      let newStage: 'closed_lost_passed' | 'closed_lost_rejected';

      if (closureType === 'we_passed') {
        // We passed - use the structured pass reasons
        const reasonLabel = passReasons[selectedPassReason].label;
        const reasonDescription = passReasons[selectedPassReason].description;
        
        passNote = `**Pass Reason:** ${reasonLabel}\n\n**Details:** ${reasonDescription}`;
        newStage = 'closed_lost_passed';
      } else {
        // They declined - use the decline reasons
        const reasonLabel = declineReasons[selectedDeclineReason].label;
        const reasonDescription = declineReasons[selectedDeclineReason].description;
        
        passNote = `**Decline Reason:** ${reasonLabel}\n\n**Details:** ${reasonDescription}`;
        newStage = 'closed_lost_rejected';
      }
      
      if (comments.trim()) {
        passNote += `\n\n**Additional Comments:** ${comments.trim()}`;
      }

      passNote += `\n\n*Marked as closed lost on ${new Date().toLocaleDateString()}*`;

      // Update the deal stage and add note to description
      const updatedDescription = deal.description 
        ? `${deal.description}\n\n---\n\n${passNote}`
        : passNote;

      await updateDeal(deal.id, { 
        stage: newStage,
        description: updatedDescription
      });

      toast.success(`Deal marked as ${closureType === 'we_passed' ? 'pass' : 'declined'} successfully`);
      onOpenChange(false);
      
      // Reset form
      setClosureType('');
      setSelectedPassReason('');
      setSelectedDeclineReason('');
      setComments('');
    } catch (error) {
      console.error('Error marking deal as closed lost:', error);
      toast.error('Failed to update deal status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    onOpenChange(false);
    // Reset form when closing
    setClosureType('');
    setSelectedPassReason('');
    setSelectedDeclineReason('');
    setComments('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Mark Deal as Closed Lost</DialogTitle>
              <DialogDescription className="mt-1">
                Document why <strong>{deal.company_name}</strong> won't be moving forward
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Company Info Summary */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Deal Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Company:</span>
                <p className="font-medium">{deal.company_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Stage:</span>
                <p className="font-medium capitalize">{deal.stage.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Industry:</span>
                <p className="font-medium">{deal.industry}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Deal Size:</span>
                <p className="font-medium">${(deal.deal_size / 1000000).toFixed(1)}M</p>
              </div>
            </div>
            {deal.company_description_short && (
              <div className="mt-3">
                <span className="text-muted-foreground text-sm">Description:</span>
                <p className="text-sm mt-1">{deal.company_description_short}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Step 1: Closure Type Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">
                What happened with this deal? <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Select whether we passed on the deal or they declined/didn't respond
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setClosureType('we_passed')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  closureType === 'we_passed' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted hover:border-muted-foreground/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Ban className="h-5 w-5 mt-0.5 text-red-600" />
                  <div>
                    <div className="font-medium">We Passed</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      We decided not to invest in this deal
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setClosureType('they_declined')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  closureType === 'they_declined' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted hover:border-muted-foreground/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <UserX className="h-5 w-5 mt-0.5 text-orange-600" />
                  <div>
                    <div className="font-medium">They Declined or No Response</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      The startup declined our offer or didn't engage
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Step 2: Reason Selection (conditional based on closure type) */}
          {closureType && (
            <>
              <Separator />
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">
                    {closureType === 'we_passed' ? 'Primary reason for passing' : 'What was the outcome?'} <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {closureType === 'we_passed' 
                      ? 'Select the main reason why this deal doesn\'t fit our investment criteria'
                      : 'Select what happened with the startup'
                    }
                  </p>
                </div>

                <RadioGroup
                  value={closureType === 'we_passed' ? selectedPassReason : selectedDeclineReason}
                  onValueChange={(value) => {
                    if (closureType === 'we_passed') {
                      setSelectedPassReason(value as PassReason);
                    } else {
                      setSelectedDeclineReason(value as DeclineReason);
                    }
                  }}
                  className="space-y-3"
                >
                  {closureType === 'we_passed' ? (
                    (Object.entries(passReasons) as [PassReason, typeof passReasons[PassReason]][]).map(([key, reason]) => (
                      <div key={key} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                        <RadioGroupItem value={key} id={key} className="mt-0.5" />
                        <div className="flex-1">
                          <Label 
                            htmlFor={key} 
                            className="font-medium cursor-pointer"
                          >
                            {reason.label}
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {reason.description}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    (Object.entries(declineReasons) as [DeclineReason, typeof declineReasons[DeclineReason]][]).map(([key, reason]) => (
                      <div key={key} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                        <RadioGroupItem value={key} id={key} className="mt-0.5" />
                        <div className="flex-1">
                          <Label 
                            htmlFor={key} 
                            className="font-medium cursor-pointer"
                          >
                            {reason.label}
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {reason.description}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </RadioGroup>
              </div>
            </>
          )}

          {/* Additional Comments (shown after selecting closure type) */}
          {closureType && (
            <>
              <Separator />
              <div className="space-y-3">
                <div>
                  <Label htmlFor="comments" className="text-base font-medium">
                    Additional Comments
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Provide any additional context or specific details about this decision
                  </p>
                </div>
                <Textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={
                    (closureType === 'we_passed' && selectedPassReason === 'other') || 
                    (closureType === 'they_declined' && selectedDeclineReason === 'other')
                      ? "Please describe the specific reason..." 
                      : "Any additional details or context..."
                  }
                  rows={4}
                  className="resize-none"
                />
              </div>
            </>
          )}

          {/* Warning (shown after selecting closure type) */}
          {closureType && (
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                ⚠️ This action will update the deal stage to "Closed Lost" and cannot be undone.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                The {closureType === 'we_passed' ? 'pass' : 'decline'} reason and comments will be added to the deal notes for future reference.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading || 
              !closureType || 
              (closureType === 'we_passed' && !selectedPassReason) ||
              (closureType === 'they_declined' && !selectedDeclineReason)
            }
            variant="destructive"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mark as Closed Lost
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}