'use client';

import { useDealsWithVotesAndFounders } from '@/client-lib/api-client';
import { UpcomingMeetingsSection } from '@/components/deals/UpcomingMeetingsSection';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminUpcomingMeetingsPage() {
  const { data: deals = [], isLoading: dealsLoading } = useDealsWithVotesAndFounders();

  if (dealsLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading meetings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Link>
        </Button>
      </div>
      <UpcomingMeetingsSection deals={deals} />
    </div>
  );
}