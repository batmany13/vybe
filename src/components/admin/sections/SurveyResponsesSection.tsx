"use client"

import { useState, Fragment } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Trash2, 
  Search, 
  Filter, 
  AlertTriangle,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Star,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { DealWithVotes, Vote, LimitedPartner } from "@/shared/models";
import { deleteVote } from "@/client-lib/api-client";
import { mutate } from "swr";
import { toast } from "sonner";
import { cn } from "@/client-lib/utils";

interface SurveyResponsesSectionProps {
  deals: DealWithVotes[];
  lps: LimitedPartner[];
}

export function SurveyResponsesSection({ deals, lps }: SurveyResponsesSectionProps) {
  const [selectedDeal, setSelectedDeal] = useState<string>("all");
  const [selectedLP, setSelectedLP] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    vote: Vote;
    deal: DealWithVotes;
    lp: LimitedPartner;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingVoteId, setDeletingVoteId] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Get all votes from all deals
  const allVotes = deals.flatMap(deal => 
    (deal.votes || []).map(vote => ({
      vote,
      deal,
      lp: lps.find(lp => lp.id === vote.lp_id)
    }))
  ).filter(item => item.lp); // Only include votes with valid LPs

  // Filter votes
  const filteredVotes = allVotes.filter(item => {
    // Deal filter
    if (selectedDeal !== "all" && item.deal.id !== selectedDeal) return false;
    
    // LP filter
    if (selectedLP !== "all" && item.vote.lp_id !== selectedLP) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.deal.company_name.toLowerCase().includes(query) ||
        item.lp?.name.toLowerCase().includes(query) ||
        item.vote.comments?.toLowerCase().includes(query) ||
        item.vote.additional_notes?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Sort by date (newest first)
  const sortedVotes = [...filteredVotes].sort((a, b) => 
    new Date(b.vote.created_at).getTime() - new Date(a.vote.created_at).getTime()
  );

  // Pagination
  const totalPages = Math.ceil(sortedVotes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVotes = sortedVotes.slice(startIndex, startIndex + itemsPerPage);

  const getConvictionIcon = (level: number, strongNo?: boolean) => {
    if (strongNo) return <ThumbsDown className="h-4 w-4 text-red-700" />;
    if (level === 4) return <Star className="h-4 w-4 text-emerald-600 fill-current" />;
    if (level === 3) return <ThumbsUp className="h-4 w-4 text-blue-600" />;
    if (level === 2) return <Minus className="h-4 w-4 text-amber-600" />;
    return <ThumbsDown className="h-4 w-4 text-red-600" />;
  };

  const getConvictionLabel = (level: number, strongNo?: boolean) => {
    if (strongNo) return "L0 - Strong No";
    if (level === 4) return "L4 - Strong Yes+";
    if (level === 3) return "L3 - Strong Yes";
    if (level === 2) return "L2 - Following Pack";
    if (level === 1) return "L1 - No";
    return `L${level}`;
  };

  const getConvictionColor = (level: number, strongNo?: boolean) => {
    if (strongNo) return "text-red-700 bg-red-100 border-red-200";
    if (level === 4) return "text-emerald-700 bg-emerald-100 border-emerald-200";
    if (level === 3) return "text-blue-700 bg-blue-100 border-blue-200";
    if (level === 2) return "text-amber-700 bg-amber-100 border-amber-200";
    return "text-red-700 bg-red-100 border-red-200";
  };

  const handleDeleteVote = async () => {
    if (!deleteConfirmation) return;
    
    setIsDeleting(true);
    
    try {
      await deleteVote(deleteConfirmation.vote.id);
      
      // Refresh all related data
      await Promise.all([
        mutate('/deals?include_votes=true&include_founders=true'),
        mutate('/votes'),
        mutate(`/deals/${deleteConfirmation.deal.id}?include_votes=true&include_founders=true`)
      ]);
      
      toast.success("Survey response deleted successfully");
      setDeleteConfirmation(null);
      setDeletingVoteId(null);
    } catch (error) {
      toast.error("Failed to delete survey response");
    } finally {
      setIsDeleting(false);
      setDeletingVoteId(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasCustomerDevelopmentData = (vote: Vote) => {
    return vote.pain_point_level || vote.pilot_customer_response || vote.buying_interest_response;
  };

  // Calculate stats
  const stats = {
    totalResponses: allVotes.length,
    uniqueLPs: new Set(allVotes.map(v => v.vote.lp_id)).size,
    dealsWithResponses: new Set(allVotes.map(v => v.deal.id)).size,
    avgConviction: allVotes.length > 0 
      ? (allVotes.reduce((sum, v) => sum + (v.vote.strong_no ? 0 : v.vote.conviction_level), 0) / allVotes.length).toFixed(1)
      : "0"
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Survey Responses Management</CardTitle>
              <CardDescription>View and manage LP survey responses for all deals</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Responses</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalResponses}</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Active LPs</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.uniqueLPs}</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Deals Evaluated</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.dealsWithResponses}</p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Avg Conviction</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.avgConviction}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company, LP name, or comments..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select value={selectedDeal} onValueChange={(value) => {
              setSelectedDeal(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All deals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All deals</SelectItem>
                {deals
                  .filter(d => (d.votes?.length || 0) > 0)
                  .sort((a, b) => a.company_name.localeCompare(b.company_name))
                  .map(deal => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.company_name} ({deal.votes?.length || 0})
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
            <Select value={selectedLP} onValueChange={(value) => {
              setSelectedLP(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All LPs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All LPs</SelectItem>
                {lps
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(lp => (
                    <SelectItem key={lp.id} value={lp.id}>
                      {lp.name}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>LP</TableHead>
                  <TableHead>Conviction</TableHead>
                  <TableHead>Customer Dev</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedVotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchQuery || selectedDeal !== "all" || selectedLP !== "all" 
                        ? "No survey responses found matching your filters"
                        : "No survey responses yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedVotes.map(({ vote, deal, lp }) => (
                    <TableRow key={vote.id} className="h-12">
                      <TableCell className="py-2">
                        <span className="font-medium text-sm truncate max-w-[150px] inline-block" title={`${deal.company_name} - ${deal.industry}`}>
                          {deal.company_name}
                        </span>
                      </TableCell>
                      <TableCell className="py-2">
                        <span className="text-sm truncate max-w-[120px] inline-block" title={`${lp?.name}${lp?.company ? ` - ${lp.company}` : ''}`}>
                          {lp?.name}
                        </span>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge 
                          variant="outline"
                          className={cn("gap-1 text-xs", getConvictionColor(vote.conviction_level, vote.strong_no))}
                        >
                          {getConvictionIcon(vote.conviction_level, vote.strong_no)}
                          {getConvictionLabel(vote.conviction_level, vote.strong_no)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        {hasCustomerDevelopmentData(vote) ? (
                          <span className="text-xs text-muted-foreground truncate max-w-[100px] inline-block" 
                                title={`Pain: ${vote.pain_point_level?.replace(/_/g, ' ') || 'N/A'}, Pilot: ${vote.pilot_customer_response?.replace(/_/g, ' ') || 'N/A'}, Buy: ${vote.buying_interest_response?.replace(/_/g, ' ') || 'N/A'}`}>
                            {[
                              vote.pain_point_level && `P: ${vote.pain_point_level.replace(/_/g, ' ').slice(0, 10)}`,
                              vote.pilot_customer_response && `Pi: ${vote.pilot_customer_response.replace(/_/g, ' ').slice(0, 10)}`,
                              vote.buying_interest_response && `B: ${vote.buying_interest_response.replace(/_/g, ' ').slice(0, 10)}`
                            ].filter(Boolean).join(', ')}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        {vote.comments || vote.additional_notes ? (
                          <span className="text-xs truncate max-w-[200px] inline-block" 
                                title={`${vote.comments || ''}${vote.comments && vote.additional_notes ? ' | ' : ''}${vote.additional_notes || ''}`}>
                            {vote.comments || vote.additional_notes}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">No feedback</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(vote.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: '2-digit'
                          })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => window.open(`/deals/${deal.id}`, '_blank')}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (lp) {
                                setDeletingVoteId(vote.id);
                                setDeleteConfirmation({ vote, deal, lp });
                              }
                            }}
                            disabled={deletingVoteId === vote.id}
                          >
                            {deletingVoteId === vote.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedVotes.length)} of {sortedVotes.length} responses
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, index, array) => (
                      <Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8"
                        >
                          {page}
                        </Button>
                      </Fragment>
                    ))
                  }
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Survey Response</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this survey response? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {deleteConfirmation && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You are about to delete <strong>{deleteConfirmation.lp.name}</strong>'s response 
                  for <strong>{deleteConfirmation.deal.company_name}</strong>.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Conviction:</span>
                  <Badge 
                    variant="outline"
                    className={cn("gap-1", getConvictionColor(deleteConfirmation.vote.conviction_level, deleteConfirmation.vote.strong_no))}
                  >
                    {getConvictionIcon(deleteConfirmation.vote.conviction_level, deleteConfirmation.vote.strong_no)}
                    {getConvictionLabel(deleteConfirmation.vote.conviction_level, deleteConfirmation.vote.strong_no)}
                  </Badge>
                </div>
                {deleteConfirmation.vote.comments && (
                  <div>
                    <span className="text-sm font-medium">Comments:</span>
                    <p className="text-sm text-muted-foreground mt-1">{deleteConfirmation.vote.comments}</p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Submitted:</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(deleteConfirmation.vote.created_at)}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteConfirmation(null);
                setDeletingVoteId(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteVote}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Response'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}