"use client";

import { useState, useEffect } from 'react';
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
import { X, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { updateLimitedPartner, deleteLimitedPartner } from '@/client-lib/api-client';
import { LimitedPartner } from '@/shared/models';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EditLPDialogProps {
  lp: LimitedPartner;
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

export function EditLPDialog({ lp, open, onOpenChange }: EditLPDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    title: '',
    linkedin_url: '',
    partner_type: 'limited_partner' as LimitedPartner['partner_type'],
    notes: '',
  });
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>([]);
  const [newExpertise, setNewExpertise] = useState('');

  useEffect(() => {
    if (lp) {
      setFormData({
        name: lp.name,
        email: lp.email,
        company: lp.company,
        title: lp.title,
        linkedin_url: lp.linkedin_url || '',
        partner_type: lp.partner_type || 'limited_partner',
        notes: (lp.notes && typeof lp.notes === 'string' && !lp.notes.includes('parameterizedQuery')) ? lp.notes : '',
      });
      setExpertiseAreas(lp.expertise_areas || []);
    }
  }, [lp]);

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
        // Keep the original values for fields we removed from the form
        ...lp,
        // Override with the form values for fields we're editing
        name: formData.name,
        email: formData.email,
        company: formData.company || 'N/A', // Default value since field is now optional
        title: formData.title || 'N/A', // Default value since field is now optional
        partner_type: formData.partner_type,
        linkedin_url: formData.linkedin_url || undefined,
        notes: formData.notes || undefined,
        expertise_areas: expertiseAreas,
        // Preserve the original Google Group setting since we removed it from the form
        added_to_google_group: lp.added_to_google_group,
      };

      console.log('Updating partner with data:', lpData);
      await updateLimitedPartner(lp.id, lpData as any);
      toast.success(`Partner updated successfully - now ${formData.partner_type === 'general_partner' ? 'GP' : formData.partner_type === 'venture_partner' ? 'VP' : 'LP'}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update partner:', error);
      toast.error('Failed to update partner');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteLimitedPartner(lp.id);
      toast.success('Limited Partner deleted successfully');
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete Limited Partner');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Partner</DialogTitle>
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

          <div className="flex justify-between items-center">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isLoading || isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading || isDeleting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isDeleting}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{lp.name}</strong> from the system. 
            This action cannot be undone and will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Remove all associated votes and survey responses</li>
              <li>Remove the LP from all reports and analytics</li>
              <li>Disconnect any linked user accounts</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}