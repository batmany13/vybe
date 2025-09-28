"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createDeal, useLimitedPartners } from '@/client-lib/api-client';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';

interface CreateDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}

export function CreateDealDialog({ open, onOpenChange, onCreated }: CreateDealDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [partnerSourcedId, setPartnerSourcedId] = useState('none');
  
  const { data: limitedPartners = [] } = useLimitedPartners();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.info('Please enter a company name');
      return;
    }

    setIsLoading(true);
    try {
      const newDeal = await createDeal({
        company_name: companyName.trim(),
        industry: 'Unknown',
        stage: 'sourcing',
        deal_size: 0,
        description: '',
        funding_round: 'Unknown',
        status: 'active',
        confirmed_amount: 0,
        created_by: 'fund_manager_1',
        // Store the partner sourced ID - will be handled by backend
        partner_sourced_by: partnerSourcedId && partnerSourcedId !== 'none' ? partnerSourcedId : undefined,
      } as any);

      toast.success('Deal created');
      setCompanyName('');
      setPartnerSourcedId('none');
      onOpenChange(false);

      if (newDeal?.id) {
        onCreated?.(newDeal.id);
      }
    } catch (error) {
      toast.error('Failed to create deal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Deal</DialogTitle>
          <DialogDescription>Just enter the company name. You can fill the rest later.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g., Acme, Inc."
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="partner_sourced">Partner Sourced</Label>
            <Select value={partnerSourcedId} onValueChange={setPartnerSourcedId}>
              <SelectTrigger>
                <SelectValue placeholder="Select who sourced this deal (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {limitedPartners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{partner.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({partner.partner_type === 'general_partner' && 'GP'} 
                        {partner.partner_type === 'venture_partner' && 'VP'}
                        {partner.partner_type === 'limited_partner' && 'LP'})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !companyName.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create & Edit
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
