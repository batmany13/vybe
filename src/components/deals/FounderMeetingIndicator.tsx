"use client";

import { useMemo } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useGoogleCalendarEvents } from '@/client-lib/integrations-client';
import { DealWithVotes, GoogleCalendarEvent } from '@/shared/models';

interface FounderMeetingIndicatorProps {
  deal: DealWithVotes;
}

export function FounderMeetingIndicator({ deal }: FounderMeetingIndicatorProps) {
  const { data: calendarEvents = [] } = useGoogleCalendarEvents();

  const nextMeeting = useMemo(() => {
    // Only show for deals in "Sourcing / Meeting booked" stage
    if (deal.stage !== 'sourcing_meeting_booked' || !deal.founders || deal.founders.length === 0) {
      return null;
    }

    const now = new Date();
    const meetings: { event: GoogleCalendarEvent; date: Date; daysUntil: number }[] = [];

    const founderNames = deal.founders.map(f => f.name.toLowerCase());
    const founderEmails = deal.founders
      .filter(f => f.email)
      .map(f => f.email?.toLowerCase() || '');
    const companyName = deal.company_name.toLowerCase();

    calendarEvents.forEach(event => {
      if (event.status === 'cancelled') return;
      
      const eventDate = event.start?.dateTime || event.start?.date;
      if (!eventDate) return;
      
      const eventTime = new Date(eventDate);
      if (eventTime < now) return;

      const eventTitle = (event.summary || '').toLowerCase();
      const eventDescription = (event.description || '').toLowerCase();
      const attendeeEmails = (event.attendees || []).map(a => a.email.toLowerCase());
      
      // Check if any founder is mentioned or attending
      const hasFounderMatch = deal.founders?.some(founder => {
        const founderNameLower = founder.name.toLowerCase();
        const founderEmailLower = founder.email?.toLowerCase() || '';
        
        return (
          (founderEmailLower && attendeeEmails.includes(founderEmailLower)) ||
          eventTitle.includes(founderNameLower) ||
          eventDescription.includes(founderNameLower)
        );
      }) ?? false;
      
      // Also check for company name
      const mentionsCompany = 
        eventTitle.includes(companyName) || 
        eventDescription.includes(companyName);

      if (hasFounderMatch || mentionsCompany) {
        const daysUntil = Math.ceil((eventTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        meetings.push({ event, date: eventTime, daysUntil });
      }
    });

    // Sort by date and return the next upcoming meeting
    meetings.sort((a, b) => a.date.getTime() - b.date.getTime());
    return meetings[0] || null;
  }, [deal, calendarEvents]);

  if (!nextMeeting) return null;

  const formatMeetingDate = (date: Date, daysUntil: number) => {
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit'
    };
    
    if (daysUntil === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', timeOptions)}`;
    } else if (daysUntil === 1) {
      return `Tomorrow at ${date.toLocaleTimeString('en-US', timeOptions)}`;
    } else if (daysUntil <= 7) {
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString('en-US', timeOptions)}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getBadgeVariant = (daysUntil: number) => {
    if (daysUntil === 0) return 'destructive';
    if (daysUntil <= 2) return 'default';
    if (daysUntil <= 7) return 'secondary';
    return 'outline';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={getBadgeVariant(nextMeeting.daysUntil)} 
            className="flex items-center gap-1 cursor-help"
          >
            <Calendar className="h-3 w-3" />
            {nextMeeting.daysUntil === 0 
              ? 'Meeting today' 
              : nextMeeting.daysUntil === 1 
              ? 'Meeting tomorrow'
              : `Meeting in ${nextMeeting.daysUntil} days`}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">{nextMeeting.event.summary}</p>
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-3 w-3" />
              {formatMeetingDate(nextMeeting.date, nextMeeting.daysUntil)}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}