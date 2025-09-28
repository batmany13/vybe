'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText,
  Clock,
  Users,
  CalendarIcon,
  Eye,
  Send,
  Trash2,
  Mail,
  Building2,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { useMonthlyUpdates, useDeals } from '@/client-lib/api-client';

export default function MonthlyUpdatesPage() {
  const { data: savedUpdates = [], isLoading } = useMonthlyUpdates();
  const { data: deals = [] } = useDeals();
  const [deleting, setDeleting] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatMonth = (month: number, year: number) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[month - 1]} ${year}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const deleteUpdate = async (updateId: string, updateTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${updateTitle}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(updateId);
    try {
      const response = await fetch(`/api/monthly-updates/${updateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Monthly update deleted successfully!');
        // The SWR cache will be invalidated by the API client
      } else {
        toast.error('Failed to delete update');
      }
    } catch (error) {
      console.error('Error deleting update:', error);
      toast.error('Failed to delete update');
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold">Monthly Updates</h1>
          <p className="text-muted-foreground">View all investor communications and updates</p>
        </div>

        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {savedUpdates.length} Updates
        </Badge>
      </div>

      {/* Updates List */}
      {savedUpdates.length > 0 ? (
        <div className="grid gap-4">
          {savedUpdates.map((update) => (
            <Card key={update.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{update.title}</CardTitle>
                      <Badge variant="outline">
                        {formatMonth(update.month, update.year)}
                      </Badge>
                      {update.lemlist_campaign_id && (
                        <Badge variant="secondary">
                          <Mail className="h-3 w-3 mr-1" />
                          Sent via Lemlist
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Created {formatDate(update.created_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {update.created_by}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{update.title}</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                          <div className="bg-white border rounded-lg p-8 shadow-sm">
                            <div className="mb-6">
                              <p className="text-gray-600 mb-4">Hey all,</p>
                              <p className="text-gray-600 mb-6">
                                Below is an update for {formatMonth(update.month, update.year)}.
                              </p>
                            </div>

                            {update.metrics && (
                              <div className="mb-8">
                                <h2 className="text-lg font-bold text-gray-800 mb-4">
                                  Key Metrics for {formatMonth(update.month, update.year)}
                                </h2>
                                <div className="space-y-1 text-gray-700">
                                  {update.metrics.deals_evaluated !== undefined && (
                                    <div>• Deals evaluated: <span className="font-semibold">{update.metrics.deals_evaluated}</span></div>
                                  )}
                                  {update.metrics.new_investments !== undefined && (
                                    <div>• New investments: <span className="font-semibold">{update.metrics.new_investments}</span></div>
                                  )}
                                  {update.metrics.portfolio_companies !== undefined && (
                                    <div>• Active portfolio companies: <span className="font-semibold">{update.metrics.portfolio_companies}</span></div>
                                  )}
                                  {update.metrics.total_investment_amount !== undefined && (
                                    <div>• Total investment amount: <span className="font-semibold">{formatCurrency(update.metrics.total_investment_amount)}</span></div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Investments closed this month (based on close_date) */}
                            {(() => {
                              const start = new Date(update.year, update.month - 1, 1);
                              const end = new Date(update.year, update.month, 0);
                              const monthInvestments = (deals || []).filter((d) => {
                                if (!d.close_date) return false;
                                const cd = new Date(d.close_date);
                                return cd >= start && cd <= end && (d.stage === 'signed' || d.stage === 'signed_and_wired');
                              });

                              if (monthInvestments.length === 0) return null;

                              const total = monthInvestments.reduce((sum, d) => sum + (d.deal_size || 0), 0);

                              return (
                                <div className="mb-8">
                                  <h2 className="text-lg font-bold text-gray-800 mb-2">
                                    New investments in {formatMonth(update.month, update.year)}
                                  </h2>
                                  <div className="space-y-1 text-gray-700">
                                    {monthInvestments.map((d) => (
                                      <div key={d.id}>
                                        • {d.company_name}
                                        {d.funding_round ? ` (${d.funding_round})` : ''}
                                        {` — ${(d.company_description_short ?? d.description ?? '')}` }
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-2 text-gray-700">
                                    <span className="font-semibold">Total invested:</span> {formatCurrency(total)}
                                  </div>
                                </div>
                              );
                            })()}

                            <div className="mb-8">
                              <h2 className="text-lg font-bold text-gray-800 mb-4">Monthly Update</h2>
                              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {update.content}
                              </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-200">
                              <p className="text-gray-600 mb-2">
                                If you have any questions, please don't hesitate to reach out.
                              </p>
                              <div className="mt-6">
                                <p className="text-gray-700 font-medium">Cheers!</p>
                                <p className="text-gray-600 text-sm mt-1">&mdash; Quang Hoang | Cofounder & CEO @ <a href="https://www.vybe.build" target="_blank" rel="noreferrer" className="underline text-blue-600">Vybe</a> | Cofounder & GP @ Gandhi Capital</p>
                                  

                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="ghost"
                      size="sm" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deleteUpdate(update.id, update.title)}
                      disabled={deleting === update.id}
                    >
                      {deleting === update.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Metrics Preview */}
                {update.metrics && (
                  <div className="flex flex-wrap gap-4 mb-4">
                    {update.metrics.deals_evaluated !== undefined && (
                      <div className="flex items-center gap-2 text-sm">
                        <Eye className="h-4 w-4 text-blue-600" />
                        <span className="text-muted-foreground">Deals evaluated:</span>
                        <span className="font-semibold">{update.metrics.deals_evaluated}</span>
                      </div>
                    )}
                    {update.metrics.new_investments !== undefined && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-muted-foreground">New investments:</span>
                        <span className="font-semibold">{update.metrics.new_investments}</span>
                      </div>
                    )}
                    {update.metrics.portfolio_companies !== undefined && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-purple-600" />
                        <span className="text-muted-foreground">Portfolio companies:</span>
                        <span className="font-semibold">{update.metrics.portfolio_companies}</span>
                      </div>
                    )}
                    {update.metrics.total_investment_amount !== undefined && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-orange-600" />
                        <span className="text-muted-foreground">Total invested:</span>
                        <span className="font-semibold">{formatCurrency(update.metrics.total_investment_amount)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Content Preview */}
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {update.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Monthly Updates</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              No monthly updates have been created yet.
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Go to the Admin page to create your first monthly update.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}