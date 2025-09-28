"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CompanyInfoStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

const industries = [
  'AI/ML',
  'Data Infrastructure',
  'DevTools',
  'FinTech',
  'HealthTech',
  'EdTech',
  'Enterprise Software',
  'Consumer Apps',
  'E-commerce',
  'Security',
  'Other'
];

const fundingRounds = [
  'Pre-Seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C+',
  'Friends & Family',
  'Angel',
  'Bridge Round'
];

const stages = [
  { value: 'sourcing', label: 'Sourcing' },
  { value: 'sourcing_reached_out', label: 'Sourcing - Reached Out' },
  { value: 'sourcing_meeting_booked', label: 'Sourcing - Meeting Booked' },
  { value: 'sourcing_meeting_done_deciding', label: 'Sourcing - Meeting Done, Deciding' },
  { value: 'partner_review', label: 'Partner Review' },
  { value: 'offer', label: 'Offer' },
  { value: 'signed', label: 'Signed' },
  { value: 'signed_and_wired', label: 'Signed & Wired' },
  { value: 'closed_lost_passed', label: 'Closed Lost - Passed' },
  { value: 'closed_lost_rejected', label: 'Closed Lost - Rejected' },
];

export function CompanyInfoStep({ formData, updateFormData }: CompanyInfoStepProps) {
  const handleInputChange = (field: string, value: string) => {
    updateFormData({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Name */}
        <div className="space-y-2">
          <Label htmlFor="company_name">Company Name *</Label>
          <Input
            id="company_name"
            placeholder="Enter company name"
            value={formData.company_name}
            onChange={(e) => handleInputChange('company_name', e.target.value)}
            required
          />
        </div>

        {/* Company URL */}
        <div className="space-y-2">
          <Label htmlFor="company_url">Company URL</Label>
          <Input
            id="company_url"
            type="url"
            placeholder="https://example.com"
            value={formData.company_url}
            onChange={(e) => handleInputChange('company_url', e.target.value)}
          />
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <Label htmlFor="industry">Industry *</Label>
          <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Funding Round */}
        <div className="space-y-2">
          <Label htmlFor="funding_round">Funding Round *</Label>
          <Select value={formData.funding_round} onValueChange={(value) => handleInputChange('funding_round', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select funding round" />
            </SelectTrigger>
            <SelectContent>
              {fundingRounds.map((round) => (
                <SelectItem key={round} value={round}>
                  {round}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stage */}
        <div className="space-y-2">
          <Label htmlFor="stage">Stage</Label>
          <Select value={formData.stage} onValueChange={(value) => handleInputChange('stage', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              {stages.map((stage) => (
                <SelectItem key={stage.value} value={stage.value}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Website URL */}
        <div className="space-y-2">
          <Label htmlFor="website_url">Website URL</Label>
          <Input
            id="website_url"
            type="url"
            placeholder="https://company.com"
            value={formData.website_url}
            onChange={(e) => handleInputChange('website_url', e.target.value)}
          />
        </div>

        {/* Pitch Deck URL */}
        <div className="space-y-2">
          <Label htmlFor="pitch_deck_url">Pitch Deck URL</Label>
          <Input
            id="pitch_deck_url"
            type="url"
            placeholder="https://docsend.com/view/..."
            value={formData.pitch_deck_url}
            onChange={(e) => handleInputChange('pitch_deck_url', e.target.value)}
          />
        </div>

        {/* Demo URL */}
        <div className="space-y-2">
          <Label htmlFor="demo_url">Demo URL</Label>
          <Input
            id="demo_url"
            type="url"
            placeholder="https://demo.company.com"
            value={formData.demo_url}
            onChange={(e) => handleInputChange('demo_url', e.target.value)}
          />
        </div>
      </div>

      {/* Company Description Short */}
      <div className="space-y-2">
        <Label htmlFor="company_description_short">Short Description</Label>
        <Input
          id="company_description_short"
          placeholder="Brief one-line description of the company"
          value={formData.company_description_short}
          onChange={(e) => handleInputChange('company_description_short', e.target.value)}
        />
      </div>

      {/* Full Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Full Description</Label>
        <Textarea
          id="description"
          placeholder="Detailed description of the company, what they do, and their mission"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
        />
      </div>
    </div>
  );
}