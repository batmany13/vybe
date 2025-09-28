'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createMonthlyUpdate } from '@/client-lib/api-client';
import { useLemlistCampaigns } from '@/client-lib/integrations-client';
import { MonthlyUpdateMetrics } from '@/shared/models';
import { toast } from 'sonner';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface CreateUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMetrics?: MonthlyUpdateMetrics;
}

export function CreateUpdateDialog({ open, onOpenChange, currentMetrics }: CreateUpdateDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [lemlistCampaignId, setLemlistCampaignId] = useState<string>('none');
  const [isLoading, setIsLoading] = useState(false);

  const { data: lemlistCampaigns, isLoading: campaignsLoading } = useLemlistCampaigns();
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i + 1);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter content');
      return;
    }

    setIsLoading(true);
    try {
      await createMonthlyUpdate({
        title: title.trim(),
        content: content.trim(),
        month,
        year,
        metrics: includeMetrics ? currentMetrics : undefined,
        lemlist_campaign_id: lemlistCampaignId === 'none' ? undefined : lemlistCampaignId || undefined,
        created_by: 'John Doe', // TODO: Replace with actual user
      });

      toast.success('Monthly update created successfully');
      onOpenChange(false);
      
      // Reset form
      setTitle('');
      setContent('');
      setMonth(new Date().getMonth() + 1);
      setYear(new Date().getFullYear());
      setIncludeMetrics(true);
      setLemlistCampaignId('none');
    } catch (error) {
      console.error('Error creating update:', error);
      toast.error('Failed to create update');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Monthly Update</DialogTitle>
          <DialogDescription>
            Create a new monthly update to share with your stakeholders.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., December 2024 Fund Update"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="month">Month</Label>
              <Select value={month.toString()} onValueChange={(value) => setMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((monthName, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {monthName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year">Year</Label>
              <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your monthly highlights, key metrics, portfolio updates, and strategic insights..."
              rows={12}
              className="resize-none"
            />
          </div>

          <div>
            <Label htmlFor="lemlist-campaign">Lemlist Campaign (Optional)</Label>
            <Select value={lemlistCampaignId} onValueChange={setLemlistCampaignId}>
              <SelectTrigger>
                <SelectValue placeholder={campaignsLoading ? "Loading campaigns..." : "Select a campaign"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No campaign</SelectItem>
                {lemlistCampaigns?.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Associate this update with a Lemlist campaign to launch it to all LPs
            </p>
          </div>

          {currentMetrics && (
            <div className="flex items-center space-x-2">
              <Switch
                id="include-metrics"
                checked={includeMetrics}
                onCheckedChange={setIncludeMetrics}
              />
              <Label htmlFor="include-metrics" className="text-sm">
                Include current metrics snapshot
              </Label>
            </div>
          )}

          {includeMetrics && currentMetrics && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-3">Current Metrics Preview</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {currentMetrics.deals_evaluated !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Deals Evaluated:</span>
                    <span className="font-medium">{currentMetrics.deals_evaluated}</span>
                  </div>
                )}
                {currentMetrics.new_investments !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">New Investments:</span>
                    <span className="font-medium">{currentMetrics.new_investments}</span>
                  </div>
                )}
                {currentMetrics.portfolio_companies !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Portfolio Companies:</span>
                    <span className="font-medium">{currentMetrics.portfolio_companies}</span>
                  </div>
                )}
                {currentMetrics.total_investment_amount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Investment:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                      }).format(currentMetrics.total_investment_amount)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Update'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}