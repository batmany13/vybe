'use client';

import { useDealsWithVotesAndFounders } from '@/client-lib/api-client';
import { UpcomingMeetingsSection } from '@/components/deals/UpcomingMeetingsSection';

export default function AdminMeetingsPage() {
  const { data: deals = [], isLoading } = useDealsWithVotesAndFounders();

  if (isLoading) {
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
      <UpcomingMeetingsSection deals={deals} />
    </div>
  );
}