'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, User, Building2, Briefcase, Mail, Phone, Linkedin, Calendar, DollarSign } from 'lucide-react';
import { updateLimitedPartner } from '@/client-lib/api-client';
import { useSelectedLP } from '@/contexts/SelectedLPContext';
import { LimitedPartner } from '@/shared/models';

export default function ProfilePage() {
  const router = useRouter();
  const { selectedLP, setSelectedLP } = useSelectedLP();
  
  const [formData, setFormData] = useState<Partial<LimitedPartner>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedLP) {
      setFormData({
        name: selectedLP.name,
        email: selectedLP.email,
        company: selectedLP.company,
        title: selectedLP.title,
        phone: selectedLP.phone,
        linkedin_url: selectedLP.linkedin_url,
        notes: selectedLP.notes,
        expertise_areas: selectedLP.expertise_areas || [],
      });
    }
  }, [selectedLP]);

  const handleSave = async () => {
    if (!selectedLP) return;

    setIsSaving(true);
    try {
      const updated = await updateLimitedPartner(selectedLP.id, formData);
      setSelectedLP(updated); // Update the context with the new data
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (selectedLP) {
      setFormData({
        name: selectedLP.name,
        email: selectedLP.email,
        company: selectedLP.company,
        title: selectedLP.title,
        phone: selectedLP.phone,
        linkedin_url: selectedLP.linkedin_url,
        notes: selectedLP.notes,
        expertise_areas: selectedLP.expertise_areas || [],
      });
    }
    setIsEditing(false);
  };

  if (!selectedLP) {
    return (
      <div className="flex-1 space-y-6 p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-1">No Limited Partner Selected</p>
              <p className="text-sm text-muted-foreground mb-4">
                Please select a Limited Partner from the dropdown above to view and edit their profile.
              </p>
              <Button onClick={() => router.push('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">LP Profile</h1>
            <p className="text-muted-foreground">View and manage Limited Partner information</p>
          </div>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={selectedLP.avatar_url} alt={selectedLP.name} />
              <AvatarFallback className="text-xl">
                {selectedLP.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{selectedLP.name}</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {selectedLP.title}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {selectedLP.company}
                  </span>
                </div>
              </CardDescription>
            </div>
            <Badge variant={selectedLP.status === 'active' ? 'default' : 'secondary'}>
              {selectedLP.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="linkedin"
                    value={formData.linkedin_url || ''}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    disabled={!isEditing}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company || ''}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          {/* Investment Information (Read-only) */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Investment Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Investment Amount</Label>
                <div className="flex items-center gap-2 mt-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-medium">
                    ${selectedLP.investment_amount.toLocaleString()}
                  </span>
                </div>
              </div>
              <div>
                <Label>Commitment Date</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-medium">
                    {new Date(selectedLP.commitment_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Expertise Areas */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Expertise Areas</h3>
            {selectedLP.expertise_areas && selectedLP.expertise_areas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedLP.expertise_areas.map((area, index) => (
                  <Badge key={index} variant="secondary">
                    {area}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No expertise areas specified</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={!isEditing}
              placeholder="Optional notes..."
              rows={4}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}