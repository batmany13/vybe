"use client";

import { useMemo } from 'react';
import { Video, Calendar, ExternalLink, MapPin, Users, Building2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useGoogleCalendarEvents } from '@/client-lib/integrations-client';
import { DealWithVotes, GoogleCalendarEvent } from '@/shared/models';
import Link from 'next/link';

interface UpcomingMeetingsSectionProps {
  deals: DealWithVotes[];
}

interface MeetingInfo {
  event: GoogleCalendarEvent;
  deal: DealWithVotes;
  matchedFounders: string[];
  meetingDate: Date;
  daysUntil: number;
}

export function UpcomingMeetingsSection({ deals }: UpcomingMeetingsSectionProps) {
  const { data: calendarEvents = [] } = useGoogleCalendarEvents();

  const upcomingMeetings = useMemo(() => {
    const meetings: MeetingInfo[] = [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Only check deals in "Sourcing / Meeting booked" stage
    const sourcingDeals = deals.filter(d => 
      d.stage === 'sourcing_meeting_booked' &&
      d.founders && d.founders.length > 0
    );

    sourcingDeals.forEach(deal => {
      const founderNames = (deal.founders || []).map(f => f.name.toLowerCase());
      const founderEmails = (deal.founders || [])
        .filter(f => f.email)
        .map(f => f.email?.toLowerCase() || '');
      const companyName = deal.company_name.toLowerCase();

      calendarEvents.forEach(event => {
        if (event.status === 'cancelled') return;
        
        const eventDate = event.start?.dateTime || event.start?.date;
        if (!eventDate) return;
        
        const eventTime = new Date(eventDate);
        if (eventTime < now || eventTime > thirtyDaysFromNow) return;

        const eventTitle = (event.summary || '').toLowerCase();
        const eventDescription = (event.description || '').toLowerCase();
        const attendeeEmails = (event.attendees || []).map(a => a.email.toLowerCase());
        
        const matchedFounders: string[] = [];
        
        // Check which founders match
        (deal.founders || []).forEach(founder => {
          const founderNameLower = founder.name.toLowerCase();
          const founderEmailLower = founder.email?.toLowerCase() || '';
          
          if (
            (founderEmailLower && attendeeEmails.includes(founderEmailLower)) ||
            eventTitle.includes(founderNameLower) ||
            eventDescription.includes(founderNameLower)
          ) {
            matchedFounders.push(founder.name);
          }
        });
        
        // Also check for company name
        const mentionsCompany = 
          eventTitle.includes(companyName) || 
          eventDescription.includes(companyName);

        if (matchedFounders.length > 0 || mentionsCompany) {
          const daysUntil = Math.ceil((eventTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          meetings.push({
            event,
            deal,
            matchedFounders,
            meetingDate: eventTime,
            daysUntil
          });
        }
      });
    });

    // Sort by date
    meetings.sort((a, b) => a.meetingDate.getTime() - b.meetingDate.getTime());
    
    // Return only the next 5 meetings
    return meetings.slice(0, 5);
  }, [deals, calendarEvents]);

  if (upcomingMeetings.length === 0) return null;

  const formatMeetingTime = (date: Date, daysUntil: number) => {
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit'
    };
    
    if (daysUntil === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', timeOptions)}`;
    } else if (daysUntil === 1) {
      return `Tomorrow at ${date.toLocaleTimeString('en-US', timeOptions)}`;
    } else if (daysUntil < 7) {
      return `${date.toLocaleDateString('en-US', { weekday: 'long' })} at ${date.toLocaleTimeString('en-US', timeOptions)}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  const isVideoCall = (event: any) => 
    (event.conferenceData?.entryPoints?.length || 0) > 0 ||
    (event.hangoutLink || '').length > 0 ||
    (event.location || '').toLowerCase().includes('zoom') ||
    (event.location || '').toLowerCase().includes('meet') ||
    (event.location || '').toLowerCase().includes('teams');

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Founder Meetings
        </CardTitle>
        <CardDescription>
          Scheduled meetings with founders from deals in "Sourcing / Meeting booked" stage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingMeetings.map((meeting, idx) => (
            <div key={idx} className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              {/* Date indicator */}
              <div className="flex-shrink-0 text-center min-w-[60px]">
                <div className="text-2xl font-bold">
                  {meeting.meetingDate.getDate()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {meeting.meetingDate.toLocaleDateString('en-US', { month: 'short' })}
                </div>
                {meeting.daysUntil <= 7 && (
                  <Badge variant={meeting.daysUntil === 0 ? 'destructive' : meeting.daysUntil <= 2 ? 'default' : 'secondary'} className="text-xs mt-1">
                    {meeting.daysUntil === 0 ? 'Today' : `In ${meeting.daysUntil} day${meeting.daysUntil > 1 ? 's' : ''}`}
                  </Badge>
                )}
              </div>

              {/* Meeting details */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h4 className="font-semibold line-clamp-1">
                      {meeting.event.summary}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatMeetingTime(meeting.meetingDate, meeting.daysUntil)}</span>
                      </div>
                      {isVideoCall(meeting.event) ? (
                        <Badge variant="outline" className="text-xs">
                          <Video className="h-3 w-3 mr-1" />
                          Video Call
                        </Badge>
                      ) : meeting.event.location && (
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {meeting.event.location}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Deal and founder info */}
                <div className="flex items-center justify-between">
                  <Link href={`/deals/${meeting.deal.id}`} className="group/link flex items-center gap-2 hover:text-primary transition-colors">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{meeting.deal.company_name}</span>
                      <span className="text-sm text-muted-foreground">• {meeting.deal.funding_round}</span>
                    </div>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                  </Link>
                  
                  {meeting.matchedFounders.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {meeting.matchedFounders.join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Attendees */}
                {meeting.event.attendees && meeting.event.attendees.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {meeting.event.attendees.slice(0, 4).map((attendee: any, idx: number) => (
                        <Avatar key={idx} className="h-6 w-6 border-2 border-background">
                          <AvatarFallback className="text-xs">
                            {(attendee.displayName || attendee.email).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    {meeting.event.attendees.length > 4 && (
                      <span className="text-xs text-muted-foreground">
                        +{meeting.event.attendees.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                {meeting.event.htmlLink && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(meeting.event.htmlLink, '_blank')}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      View in Calendar
                    </Button>
                    {isVideoCall(meeting.event) && meeting.event.conferenceData?.entryPoints?.[0]?.uri && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(meeting.event.conferenceData.entryPoints[0].uri, '_blank')}
                      >
                        <Video className="h-3 w-3 mr-1" />
                        Join Meeting
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}