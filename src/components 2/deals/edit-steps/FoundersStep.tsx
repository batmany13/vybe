"use client";

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

interface Founder {
  id?: string;
  name: string;
  bio?: string;
  linkedin_url?: string;
  email?: string;
  avatar_url?: string;
}

interface FoundersStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

export function FoundersStep({ formData, updateFormData }: FoundersStepProps) {
  const founders = formData.founders || [];

  const addFounder = () => {
    const newFounder: Founder = {
      name: '',
      bio: '',
      linkedin_url: '',
      email: '',
      avatar_url: ''
    };
    updateFormData({ founders: [...founders, newFounder] });
  };

  const removeFounder = (index: number) => {
    const updatedFounders = founders.filter((_: any, i: number) => i !== index);
    updateFormData({ founders: updatedFounders });
  };

  const updateFounder = (index: number, field: string, value: string) => {
    const updatedFounders = founders.map((founder: Founder, i: number) => 
      i === index ? { ...founder, [field]: value } : founder
    );
    updateFormData({ founders: updatedFounders });
  };

  const handleLocationChange = (field: string, value: string) => {
    updateFormData({ [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Location Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="founders_location">Founders Location</Label>
          <Input
            id="founders_location"
            placeholder="e.g., San Francisco, CA"
            value={formData.founders_location || ''}
            onChange={(e) => handleLocationChange('founders_location', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_base_location">Company Base Location</Label>
          <Input
            id="company_base_location"
            placeholder="e.g., Delaware, USA"
            value={formData.company_base_location || ''}
            onChange={(e) => handleLocationChange('company_base_location', e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="working_duration">Working Together Duration</Label>
          <Input
            id="working_duration"
            placeholder="e.g., 2 years, 6 months, since college"
            value={formData.working_duration || ''}
            onChange={(e) => handleLocationChange('working_duration', e.target.value)}
          />
        </div>
      </div>

      {/* Founders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Founding Team</h3>
          <Button onClick={addFounder} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Founder
          </Button>
        </div>

        {founders.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <p>No founders added yet.</p>
                <p className="text-sm mt-1">Click "Add Founder" to get started.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {founders.map((founder: Founder, index: number) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Founder {index + 1}
                </CardTitle>
                {founders.length > 1 && (
                  <Button
                    onClick={() => removeFounder(index)}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`founder-${index}-name`}>Name *</Label>
                  <Input
                    id={`founder-${index}-name`}
                    placeholder="Full name"
                    value={founder.name}
                    onChange={(e) => updateFounder(index, 'name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`founder-${index}-email`}>Email</Label>
                  <Input
                    id={`founder-${index}-email`}
                    type="email"
                    placeholder="email@example.com"
                    value={founder.email || ''}
                    onChange={(e) => updateFounder(index, 'email', e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`founder-${index}-linkedin`}>LinkedIn URL</Label>
                  <Input
                    id={`founder-${index}-linkedin`}
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={founder.linkedin_url || ''}
                    onChange={(e) => updateFounder(index, 'linkedin_url', e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`founder-${index}-avatar`}>Avatar URL</Label>
                  <Input
                    id={`founder-${index}-avatar`}
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={founder.avatar_url || ''}
                    onChange={(e) => updateFounder(index, 'avatar_url', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`founder-${index}-bio`}>Bio</Label>
                <Textarea
                  id={`founder-${index}-bio`}
                  placeholder="Background, experience, and role at the company"
                  value={founder.bio || ''}
                  onChange={(e) => updateFounder(index, 'bio', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}