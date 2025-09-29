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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Eye,
  Trash2,
  Plus,
  Users,
  Clock,
  Shield,
  AlertTriangle,
  FileText,
  Sparkles
} from "lucide-react";
import { toast } from 'sonner';
import { useSelectedLP } from '@/contexts/SelectedLPContext';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DealSummaryDialog } from './DealSummaryDialog';

interface ShareLink {
  id: string;
  share_key: string;
  created_by: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  view_count: number;
  last_viewed_at?: string;
}

interface ShareDealDialogProps {
  dealId: string;
  dealName: string;
  deal?: any; // Optional deal object for summary generation
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDealDialog({ dealId, dealName, deal, open, onOpenChange }: ShareDealDialogProps) {
  const [shares, setShares] = useState<ShareLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expiresInDays, setExpiresInDays] = useState('30');
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  
  const { selectedLP } = useSelectedLP();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const fetchShares = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/deals/${dealId}/share`);
      if (response.ok) {
        const sharesData = await response.json();
        setShares(sharesData);
      } else {
        toast.error('Failed to load share links');
      }
    } catch (error) {
      toast.error('Failed to load share links');
    } finally {
      setIsLoading(false);
    }
  };

  const createShareLink = async () => {
    if (!selectedLP) {
      toast.error('Please select a Limited Partner');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`/api/deals/${dealId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          createdBy: selectedLP.id,
          expiresInDays: parseInt(expiresInDays)
        }),
      });

      if (response.ok) {
        const newShare = await response.json();
        setShares(prev => [newShare, ...prev]);
        toast.success('Share link created successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create share link');
      }
    } catch (error) {
      toast.error('Failed to create share link');
    } finally {
      setIsCreating(false);
    }
  };

  const revokeShareLink = async (shareId: string) => {
    try {
      const response = await fetch(`/api/deals/${dealId}/share/${shareId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShares(prev => prev.filter(share => share.id !== shareId));
        toast.success('Share link revoked');
      } else {
        toast.error('Failed to revoke share link');
      }
    } catch (error) {
      toast.error('Failed to revoke share link');
    }
  };

  const copyToClipboard = async (shareKey: string) => {
    const url = `${window.location.origin}/public/deals/${shareKey}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(shareKey);
      toast.success('Link copied to clipboard');
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedKey(null);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  useEffect(() => {
    if (open) {
      fetchShares();
    }
  }, [open, dealId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Deal: {dealName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Deal Summary Feature */}
          {deal && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Deal Summary & Export
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Generate AI-powered executive summaries, export as PDF, or send via email to co-investors and stakeholders.
                  </AlertDescription>
                </Alert>
                
                <Button 
                  onClick={() => setShowSummaryDialog(true)}
                  className="w-full md:w-auto"
                  variant="default"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Deal Summary
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Create New Share Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5" />
                Create New Share Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Share links allow anyone with the URL to view this deal's information without logging in. 
                  Only share with trusted parties.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expires">Expires in</Label>
                  <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="7">1 week</SelectItem>
                      <SelectItem value="30">1 month</SelectItem>
                      <SelectItem value="90">3 months</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={createShareLink} 
                disabled={isCreating || !selectedLP}
                className="w-full md:w-auto"
              >
                {isCreating ? 'Creating...' : 'Create Share Link'}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Share Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ExternalLink className="h-5 w-5" />
                Active Share Links
                {shares.length > 0 && (
                  <Badge variant="secondary">{shares.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : shares.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No share links created yet</p>
                  <p className="text-xs mt-1">Create a link above to share this deal</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {shares.map((share) => {
                    const expired = isExpired(share.expires_at);
                    const daysUntilExpiry = getDaysUntilExpiry(share.expires_at);
                    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/public/deals/${share.share_key}`;
                    
                    return (
                      <div 
                        key={share.id} 
                        className={`p-4 border rounded-lg ${expired ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' : 'bg-muted/30'}`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                expired 
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  : daysUntilExpiry <= 7 
                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              }`}>
                                {expired 
                                  ? 'Expired' 
                                  : daysUntilExpiry <= 0 
                                    ? 'Expires today'
                                    : daysUntilExpiry === 1 
                                      ? 'Expires tomorrow'
                                      : `${daysUntilExpiry} days left`
                                }
                              </div>
                              
                              {share.view_count > 0 && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Eye className="h-3 w-3" />
                                  {share.view_count} {share.view_count === 1 ? 'view' : 'views'}
                                </div>
                              )}
                            </div>
                            
                            <div className="bg-background border rounded p-2 text-sm font-mono break-all">
                              {url}
                            </div>
                            
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Created {formatDate(share.created_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Expires {formatDate(share.expires_at)}
                              </span>
                              {share.last_viewed_at && (
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  Last viewed {formatDate(share.last_viewed_at)}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(share.share_key)}
                              disabled={expired}
                              className="flex items-center gap-1"
                            >
                              {copiedKey === share.share_key ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              {copiedKey === share.share_key ? 'Copied!' : 'Copy'}
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => revokeShareLink(share.id)}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                              Revoke
                            </Button>
                          </div>
                        </div>
                        
                        {expired && (
                          <Alert className="mt-3">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              This link has expired and cannot be accessed. Create a new link if you need to share this deal.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
      
      {/* Deal Summary Dialog */}
      {deal && (
        <DealSummaryDialog
          deal={deal}
          open={showSummaryDialog}
          onOpenChange={setShowSummaryDialog}
        />
      )}
    </Dialog>
  );
}