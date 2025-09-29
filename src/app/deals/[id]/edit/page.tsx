"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useDeal, updateDeal } from '@/client-lib/api-client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { CompanyInfoStep } from '@/components/deals/edit-steps/CompanyInfoStep';
import { FoundersStep } from '@/components/deals/edit-steps/FoundersStep';
import { InvestmentDetailsStep } from '@/components/deals/edit-steps/InvestmentDetailsStep';
import { TractionStep } from '@/components/deals/edit-steps/TractionStep';
import { AdditionalInfoStep } from '@/components/deals/edit-steps/AdditionalInfoStep';

interface EditDealPageProps {
  params: Promise<{ id: string }>;
}

const steps = [
  { id: 'company', label: 'Company Info', description: 'Basic company information' },
  { id: 'founders', label: 'Founders', description: 'Founding team details' },
  { id: 'investment', label: 'Investment', description: 'Deal size, valuation, and round details' },
  { id: 'traction', label: 'Traction', description: 'Revenue, growth, and progress' },
  { id: 'additional', label: 'Additional', description: 'Extra details and notes' },
];

export default function EditDealPage({ params }: EditDealPageProps) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const { data: deal, error, mutate } = useDeal(resolvedParams?.id || '');
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // Initialize form data when deal loads
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
        why_good_fit: deal.why_good_fit || '',
        excitement_note: deal.excitement_note || '',
        survey_deadline: deal.survey_deadline || '',
        contract_link: deal.contract_link || '',
        
        // Founders
        founders: deal.founders || [],
      });
    }
  }, [deal]);

  if (error) {
    return (
      <div className="flex-1 space-y-6 p-6 max-w-6xl mx-auto">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-lg font-medium mb-1">Deal Not Found</p>
              <p className="text-sm text-muted-foreground mb-4">
                The deal you're trying to edit doesn't exist or you don't have permission to access it.
              </p>
              <Button onClick={() => router.push('/admin')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!deal || !resolvedParams) {
    return (
      <div className="flex-1 space-y-6 p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

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
      await mutate(); // Refresh the deal data
      toast.success('Deal updated successfully');
      router.push('/admin');
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
    <div className="flex-1 space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/admin')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Deal</h1>
            <p className="text-muted-foreground">{deal.company_name}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Progress */}
      <Card>
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
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep]?.label}</CardTitle>
          <CardDescription>{steps[currentStep]?.description}</CardDescription>
        </CardHeader>
        <CardContent>
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

      {/* Navigation */}
      <div className="flex items-center justify-between">
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

        <Button 
          onClick={handleNext} 
          disabled={currentStep === steps.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}