"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateDeal } from '@/client-lib/api-client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { CompanyInfoStep } from '@/components/deals/edit-steps/CompanyInfoStep';
import { FoundersStep } from '@/components/deals/edit-steps/FoundersStep';
import { InvestmentDetailsStep } from '@/components/deals/edit-steps/InvestmentDetailsStep';
import { TractionStep } from '@/components/deals/edit-steps/TractionStep';
import { AdditionalInfoStep } from '@/components/deals/edit-steps/AdditionalInfoStep';
import { DealWithVotes } from '@/shared/models';

interface EditDealWizardDialogProps {
  deal: DealWithVotes;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  { id: 'company', label: 'Company Info', description: 'Basic company information' },
  { id: 'founders', label: 'Founders', description: 'Founding team details' },
  { id: 'investment', label: 'Investment', description: 'Deal size, valuation, and round details' },
  { id: 'traction', label: 'Traction', description: 'Revenue, growth, and progress' },
  { id: 'additional', label: 'Additional', description: 'Extra details and notes' },
];

export function EditDealWizardDialog({ deal, open, onOpenChange }: EditDealWizardDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // Initialize form data when deal changes
  useEffect(() => {
    if (deal) {
      setFormData({
        // Company Info
        company_name: deal.company_name || '',
        company_url: deal.company_url || '',
        company_description_short: deal.company_description_short || '',
        description: deal.description || '',
        industry: deal.industry || '',
        funding_round: deal.funding_round || '',
        stage: deal.stage || 'sourcing',
        pitch_deck_url: deal.pitch_deck_url || '',
        demo_url: deal.demo_url || '',
        website_url: deal.website_url || '',
        
        // Investment Details
        deal_size: deal.deal_size || 0,
        valuation: deal.valuation || 0,
        raising_amount: deal.raising_amount || 0,
        confirmed_amount: deal.confirmed_amount || 0,
        safe_or_equity: deal.safe_or_equity || '',
        lead_investor: deal.lead_investor || '',
        co_investors: deal.co_investors || [],
        
        // Locations & Traction
        founders_location: deal.founders_location || '',
        company_base_location: deal.company_base_location || '',
        working_duration: deal.working_duration || '',
        has_revenue: deal.has_revenue || false,
        revenue_amount: deal.revenue_amount || 0,
        traction_progress: deal.traction_progress || '',
        user_traction: deal.user_traction || '',
        
        // Additional Info
        founder_motivation: deal.founder_motivation || '',
        competition_differentiation: deal.competition_differentiation || '',
        why_good_fit_for_cto_fund: deal.why_good_fit_for_cto_fund || '',
        quang_excited_note: deal.quang_excited_note || '',
        survey_deadline: deal.survey_deadline || '',
        contract_link: deal.contract_link || '',
        
        // Founders
        founders: deal.founders || [],
      });
    }
  }, [deal]);

  // Reset to first step when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateDeal(deal.id, formData);
      toast.success('Deal updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update deal');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (updates: any) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Deal - {deal.company_name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
          {/* Progress */}
          <Card className="flex-shrink-0">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Step {currentStep + 1} of {steps.length}</span>
                  <span>{Math.round(progressPercentage)}% Complete</span>
                </div>
                <Progress value={progressPercentage} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  {steps[currentStep]?.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step Content */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="flex-shrink-0">
              <CardTitle>{steps[currentStep]?.label}</CardTitle>
              <CardDescription>{steps[currentStep]?.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {currentStep === 0 && (
                <CompanyInfoStep 
                  formData={formData} 
                  updateFormData={updateFormData} 
                />
              )}
              {currentStep === 1 && (
                <FoundersStep 
                  formData={formData} 
                  updateFormData={updateFormData} 
                />
              )}
              {currentStep === 2 && (
                <InvestmentDetailsStep 
                  formData={formData} 
                  updateFormData={updateFormData} 
                />
              )}
              {currentStep === 3 && (
                <TractionStep 
                  formData={formData} 
                  updateFormData={updateFormData} 
                />
              )}
              {currentStep === 4 && (
                <AdditionalInfoStep 
                  formData={formData} 
                  updateFormData={updateFormData} 
                />
              )}
            </CardContent>
          </Card>

          {/* Navigation and Save */}
          <div className="flex items-center justify-between flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={handlePrevious} 
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <Tabs value={steps[currentStep]?.id} className="flex-1 max-w-lg mx-8">
              <TabsList className="grid w-full grid-cols-5">
                {steps.map((step, index) => (
                  <TabsTrigger 
                    key={step.id} 
                    value={step.id}
                    onClick={() => setCurrentStep(index)}
                    className="text-xs px-2"
                  >
                    {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex gap-2">
              <Button 
                onClick={handleNext} 
                disabled={currentStep === steps.length - 1}
                variant="outline"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
              
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}