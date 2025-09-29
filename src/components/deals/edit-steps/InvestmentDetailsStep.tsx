"use client";

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

interface InvestmentDetailsStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

const instrumentTypes = [
  'SAFE',
  'Convertible Note',
  'Equity',
  'Revenue Share',
  'Warrant'
];

export function InvestmentDetailsStep({ formData, updateFormData }: InvestmentDetailsStepProps) {
  const [newInvestor, setNewInvestor] = useState('');
  
  const handleInputChange = (field: string, value: string | number) => {
    updateFormData({ [field]: value });
  };

  const addCoInvestor = () => {
    if (newInvestor.trim()) {
      const currentInvestors = formData.co_investors || [];
      updateFormData({ co_investors: [...currentInvestors, newInvestor.trim()] });
      setNewInvestor('');
    }
  };

  const removeCoInvestor = (index: number) => {
    const currentInvestors = formData.co_investors || [];
    const updatedInvestors = currentInvestors.filter((_: string, i: number) => i !== index);
    updateFormData({ co_investors: updatedInvestors });
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    return numericValue ? parseInt(numericValue, 10) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Deal Size and Valuation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="deal_size">Deal Size (USD) *</Label>
          <Input
            id="deal_size"
            type="number"
            placeholder="25000"
            value={formData.deal_size || ''}
            onChange={(e) => handleInputChange('deal_size', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="valuation">Pre-Money Valuation (USD)</Label>
          <Input
            id="valuation"
            type="number"
            placeholder="5000000"
            value={formData.valuation || ''}
            onChange={(e) => handleInputChange('valuation', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>
      </div>

      {/* Raising Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="raising_amount">Total Raising (USD)</Label>
          <Input
            id="raising_amount"
            type="number"
            placeholder="1000000"
            value={formData.raising_amount || ''}
            onChange={(e) => handleInputChange('raising_amount', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmed_amount">Confirmed Amount (USD)</Label>
          <Input
            id="confirmed_amount"
            type="number"
            placeholder="500000"
            value={formData.confirmed_amount || ''}
            onChange={(e) => handleInputChange('confirmed_amount', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="safe_or_equity">Instrument Type</Label>
          <Select 
            value={formData.safe_or_equity || ''} 
            onValueChange={(value) => handleInputChange('safe_or_equity', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select instrument" />
            </SelectTrigger>
            <SelectContent>
              {instrumentTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lead Investor */}
      <div className="space-y-2">
        <Label htmlFor="lead_investor">Lead Investor</Label>
        <Input
          id="lead_investor"
          placeholder="Name of lead investor or investment firm"
          value={formData.lead_investor || ''}
          onChange={(e) => handleInputChange('lead_investor', e.target.value)}
        />
      </div>

      {/* Co-Investors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Co-Investors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add co-investor name"
              value={newInvestor}
              onChange={(e) => setNewInvestor(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCoInvestor()}
            />
            <Button 
              onClick={addCoInvestor} 
              variant="outline"
              disabled={!newInvestor.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {formData.co_investors && formData.co_investors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.co_investors.map((investor: string, index: number) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {investor}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeCoInvestor(index)}
                  />
                </Badge>
              ))}
            </div>
          )}

          {(!formData.co_investors || formData.co_investors.length === 0) && (
            <p className="text-sm text-muted-foreground">
              No co-investors added yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Additional Investment Info */}
      <div className="space-y-2">
        <Label htmlFor="survey_deadline">Survey Deadline</Label>
        <Input
          id="survey_deadline"
          type="date"
          value={formData.survey_deadline || ''}
          onChange={(e) => handleInputChange('survey_deadline', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contract_link">Contract/Legal Documents Link</Label>
        <Input
          id="contract_link"
          type="url"
          placeholder="https://docsend.com/view/..."
          value={formData.contract_link || ''}
          onChange={(e) => handleInputChange('contract_link', e.target.value)}
        />
      </div>
    </div>
  );
}