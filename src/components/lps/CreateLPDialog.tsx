"use client";

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { createLimitedPartner } from '@/client-lib/api-client';
import { LimitedPartner } from '@/shared/models';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CreateLPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COMMON_EXPERTISE_AREAS = [
  'AI/ML',
  'Enterprise Software',
  'FinTech',
  'HealthTech',
  'DevOps',
  'Cloud Infrastructure',
  'Security',
  'Data Engineering',
  'Mobile Development',
  'Consumer Apps',
  'Gaming',
  'Analytics',
  'Machine Learning',
  'CleanTech',
  'IoT',
  'Blockchain',
  'EdTech',
  'E-commerce',
  'API/Platform',
  'Robotics',
  'Marketing',
  'Sales/GTM'
];

export function CreateLPDialog({ open, onOpenChange }: CreateLPDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    title: '',
    phone: '',
    linkedin_url: '',
    avatar_url: '',
    status: 'active' as LimitedPartner['status'],
    partner_type: 'limited_partner' as LimitedPartner['partner_type'],
    notes: ''
  });
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>([]);
  const [newExpertise, setNewExpertise] = useState('');

  const handleAddExpertise = (area: string) => {
    if (area && !expertiseAreas.includes(area)) {
      setExpertiseAreas([...expertiseAreas, area]);
      setNewExpertise('');
    }
  };

  const handleRemoveExpertise = (area: string) => {
    setExpertiseAreas(expertiseAreas.filter(e => e !== area));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const lpData = {
        ...formData,
        investment_amount: 0, // Default value since field was removed
        commitment_date: new Date().toISOString(), // Default to today
        company: formData.company || 'N/A', // Default value since field is now optional
        title: formData.title || 'N/A', // Default value since field is now optional
        phone: formData.phone || undefined,
        linkedin_url: formData.linkedin_url || undefined,
        avatar_url: formData.avatar_url || undefined,
        notes: formData.notes || undefined,
        expertise_areas: expertiseAreas,
      };

      await createLimitedPartner(lpData);
      toast.success('Limited Partner created successfully');
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        company: '',
        title: '',
        phone: '',
        linkedin_url: '',
        avatar_url: '',
        status: 'active',
        partner_type: 'limited_partner',
        notes: ''
      });
      setExpertiseAreas([]);
    } catch (error) {
      toast.error('Failed to create Limited Partner');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Limited Partner</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partner_type">Partner Type *</Label>
              <Select
                value={formData.partner_type}
                onValueChange={(value) => setFormData({ ...formData, partner_type: value as LimitedPartner['partner_type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general_partner">General Partner</SelectItem>
                  <SelectItem value="venture_partner">Venture Partner</SelectItem>
                  <SelectItem value="limited_partner">Limited Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as LimitedPartner['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar_url">Profile Picture URL</Label>
            <Input
              id="avatar_url"
              type="url"
              value={formData.avatar_url}
              onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              placeholder="https://example.com/your-picture.jpg"
            />
          </div>



          <div className="space-y-2">
            <Label>Expertise Areas</Label>
            <div className="flex gap-2">
              <Select value={newExpertise} onValueChange={setNewExpertise}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select expertise area" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_EXPERTISE_AREAS.filter(area => !expertiseAreas.includes(area)).map((area) => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                onClick={() => handleAddExpertise(newExpertise)}
                disabled={!newExpertise || expertiseAreas.includes(newExpertise)}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {expertiseAreas.map((area) => (
                <Badge key={area} variant="secondary" className="flex items-center gap-1">
                  {area}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleRemoveExpertise(area)}
                  />
                </Badge>
              ))}
            </div>
          </div>



          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create LP
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}