"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdditionalInfoStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

export function AdditionalInfoStep({ formData, updateFormData }: AdditionalInfoStepProps) {
  const handleInputChange = (field: string, value: string) => {
    updateFormData({ [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Founder Motivation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Founder & Team Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="founder_motivation">Founder Motivation & Story</Label>
            <Textarea
              id="founder_motivation"
              placeholder="What drives the founders? What's their personal connection to this problem? What makes them uniquely qualified to solve this?"
              value={formData.founder_motivation || ''}
              onChange={(e) => handleInputChange('founder_motivation', e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Competition & Differentiation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Market & Competition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="competition_differentiation">Competition & Differentiation</Label>
            <Textarea
              id="competition_differentiation"
              placeholder="Who are the main competitors? How does this company differentiate? What's their competitive advantage or moat?"
              value={formData.competition_differentiation || ''}
              onChange={(e) => handleInputChange('competition_differentiation', e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* CTO Fund Fit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CTO Fund Alignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="why_good_fit_for_cto_fund">Why Good Fit for CTO Fund?</Label>
            <Textarea
              id="why_good_fit_for_cto_fund"
              placeholder="How does this deal align with CTO Fund's thesis? What specific value can CTO Fund LPs provide? Why is this a good fit for our portfolio?"
              value={formData.why_good_fit_for_cto_fund || ''}
              onChange={(e) => handleInputChange('why_good_fit_for_cto_fund', e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quang_excited_note">Partner Notes & Excitement</Label>
            <Textarea
              id="quang_excited_note"
              placeholder="What excites the investment team about this opportunity? Any specific partner notes or insights?"
              value={formData.quang_excited_note || ''}
              onChange={(e) => handleInputChange('quang_excited_note', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Helpful Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">For Founder Motivation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Consider including:</p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Personal experience with the problem</li>
              <li>Previous relevant experience</li>
              <li>Vision for the future</li>
              <li>What success looks like to them</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">For Competition Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Consider including:</p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Direct and indirect competitors</li>
              <li>Unique value proposition</li>
              <li>Barriers to entry</li>
              <li>Competitive advantages</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">For CTO Fund Fit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Consider including:</p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Technical complexity and innovation</li>
              <li>Opportunities for LP value-add</li>
              <li>Alignment with fund thesis</li>
              <li>Potential for LP customer connections</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Investment Thesis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Consider including:</p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Market size and opportunity</li>
              <li>Technology advantages</li>
              <li>Team strength and execution</li>
              <li>Scalability potential</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}