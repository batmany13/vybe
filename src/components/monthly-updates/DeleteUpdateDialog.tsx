'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { deleteMonthlyUpdate } from '@/client-lib/api-client';
import { MonthlyUpdate } from '@/shared/models';
import { toast } from 'sonner';
import { AlertTriangle, Send } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface DeleteUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  update: MonthlyUpdate;
}

export function DeleteUpdateDialog({ open, onOpenChange, update }: DeleteUpdateDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  
  const isSent = !!update.lemlist_campaign_id;
  const requiresConfirmation = isSent;

  const handleDelete = async () => {
    // For sent updates, require confirmation text
    if (requiresConfirmation && confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMonthlyUpdate(update.id);
      toast.success('Monthly update deleted successfully');
      onOpenChange(false);
      // Reset confirmation text
      setConfirmText('');
    } catch (error) {
      console.error('Error deleting update:', error);
      toast.error('Failed to delete monthly update');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setConfirmText('');
    }
    onOpenChange(open);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isSent && <AlertTriangle className="h-5 w-5 text-destructive" />}
            Delete Monthly Update
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div>
              <span className="block font-medium text-foreground">
                {update.title}
              </span>
              <span className="block text-sm text-muted-foreground mt-1">
                {MONTHS[update.month - 1]} {update.year}
              </span>
            </div>

            {isSent && (
              <Alert variant="destructive">
                <Send className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> This update has already been sent to LPs via Lemlist. 
                  Deleting it will remove the record from your system but won't recall the emails already sent.
                </AlertDescription>
              </Alert>
            )}

            {update.metrics && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="font-medium mb-2">This update contains metrics:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Deals evaluated: {update.metrics.deals_evaluated}</li>
                  <li>• New investments: {update.metrics.new_investments}</li>
                  <li>• Portfolio companies: {update.metrics.portfolio_companies}</li>
                  {update.metrics.total_investment_amount > 0 && (
                    <li>• Total invested: ${(update.metrics.total_investment_amount / 1000000).toFixed(1)}M</li>
                  )}
                </ul>
              </div>
            )}

            {requiresConfirmation && (
              <div className="space-y-2">
                <label htmlFor="confirm-delete" className="text-sm font-medium">
                  Type <span className="font-mono bg-destructive/10 text-destructive px-1 py-0.5 rounded">DELETE</span> to confirm:
                </label>
                <input
                  id="confirm-delete"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  autoComplete="off"
                />
              </div>
            )}

            <p className="text-sm font-medium text-destructive">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || (requiresConfirmation && confirmText !== 'DELETE')}
            className="bg-destructive hover:bg-destructive/90 focus:ring-destructive"
          >
            {isDeleting ? 'Deleting...' : 'Delete Update'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}