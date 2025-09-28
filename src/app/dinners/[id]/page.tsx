"use client";

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useDinner } from '@/client-lib/api-client';
import { useGoogleCalendarEvents } from '@/client-lib/integrations-client';
import { syncDinnerWithCalendar } from '@/client-lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Mail,
  User,
  Link2,
  Unlink
} from 'lucide-react';
import { useState } from 'react';
import { GoogleCalendarAttendee } from '@/shared/models';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

function AttendeeCard({ attendee }: { attendee: GoogleCalendarAttendee }) {
  const initials = attendee.displayName 
    ? attendee.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : attendee.email.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3 p-3 bg-background border rounded-lg hover:shadow-sm transition-shadow">
      <Avatar className="h-10 w-10">
        <AvatarFallback className="text-sm">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">
          {attendee.displayName || attendee.email}
        </div>
        {attendee.displayName && (
          <div className="text-sm text-muted-foreground truncate flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {attendee.email}
          </div>
        )}
      </div>
      {attendee.organizer && (
        <Badge variant="outline" className="ml-2">
          Organizer
        </Badge>
      )}
    </div>
  );
}

export default function DinnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const dinnerId = parseInt(resolvedParams.id, 10);
  const { data: dinner, error, isLoading } = useDinner(dinnerId);
  const { data: calendarEvents = [] } = useGoogleCalendarEvents();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (!dinner) return;

    const dinnerTime = new Date(dinner.starts_at).getTime();
    const timeWindow = 12 * 60 * 60 * 1000; // 12 hours window
    
    const matchingEvent = calendarEvents.find(event => {
      const eventSummary = event.summary?.toLowerCase() || '';
      const eventTime = new Date(event.start?.dateTime || event.start?.date || '').getTime();
      const timeDiff = Math.abs(eventTime - dinnerTime);
      
      return eventSummary.includes('gandhi capital') && timeDiff <= timeWindow;
    });

    if (!matchingEvent) {
      toast.error('No matching Google Calendar event found');
      return;
    }

    setSyncing(true);
    try {
      const attendeesData: GoogleCalendarAttendee[] = (matchingEvent.attendees || []).map(attendee => ({
        email: attendee.email,
        displayName: attendee.displayName,
        responseStatus: attendee.responseStatus as any,
        organizer: attendee.organizer,
        self: attendee.self,
      }));

      await syncDinnerWithCalendar(dinner.id);
      toast.success('Successfully synced with Google Calendar');
    } catch (error) {
      console.error('Error syncing:', error);
      toast.error('Failed to sync with Google Calendar');
    } finally {
      setSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !dinner) {
    return (
      <div className="flex-1 p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Event Not Found</h2>
            <p className="text-sm text-muted-foreground mb-4">The event you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/dinners')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const attendees = dinner.google_calendar_attendees_data || [];
  const acceptedAttendees = attendees.filter(a => a.responseStatus === 'accepted');
  const declinedAttendees = attendees.filter(a => a.responseStatus === 'declined');
  const pendingAttendees = attendees.filter(a => a.responseStatus === 'needsAction' || a.responseStatus === 'tentative');
  
  const isUpcoming = new Date(dinner.starts_at).getTime() >= new Date().getTime();
  const isGandhiCapitalEvent = dinner.title.toLowerCase().startsWith('gandhi capital');
  const isAlreadySynced = dinner.google_calendar_sync_status === 'synced';

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dinners')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{dinner.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Event Details and Attendees
            </p>
          </div>
        </div>
        {isGandhiCapitalEvent && (
          <div className="flex items-center gap-2">
            {isAlreadySynced ? (
              <Badge variant="default" className="gap-1">
                <Link2 className="h-3 w-3" />
                Synced
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <Unlink className="h-3 w-3" />
                Not Synced
              </Badge>
            )}
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant={isAlreadySynced ? "outline" : "default"}
            >
              {syncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isAlreadySynced ? 'Re-sync' : 'Sync'} with Calendar
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Event Info */}
      <Card>
        <CardHeader>
          <CardTitle>Event Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Date & Time</div>
                <div className="font-medium">{formatDateTime(dinner.starts_at)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Location</div>
                <div className="font-medium">{dinner.city || 'TBD'}</div>
                {dinner.location && (
                  <div className="text-sm text-muted-foreground">{dinner.location}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div>
                  {isUpcoming ? (
                    <Badge variant="default">Upcoming</Badge>
                  ) : (
                    <Badge variant="secondary">Past</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendees Section */}
      {isGandhiCapitalEvent ? (
        isAlreadySynced && attendees.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Accepted */}
            <Card className="border-green-200 dark:border-green-900">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Accepted
                  </span>
                  <Badge variant="default" className="bg-green-600">
                    {acceptedAttendees.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Attendees who have confirmed attendance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {acceptedAttendees.length > 0 ? (
                    acceptedAttendees.map((attendee, idx) => (
                      <AttendeeCard key={idx} attendee={attendee} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No confirmed attendees yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Declined */}
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    Declined
                  </span>
                  <Badge variant="destructive">
                    {declinedAttendees.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Attendees who cannot attend
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {declinedAttendees.length > 0 ? (
                    declinedAttendees.map((attendee, idx) => (
                      <AttendeeCard key={idx} attendee={attendee} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <XCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No declined responses</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pending */}
            <Card className="border-orange-200 dark:border-orange-900">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Pending
                  </span>
                  <Badge variant="secondary" className="bg-orange-600 text-white">
                    {pendingAttendees.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Awaiting response or marked as tentative
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {pendingAttendees.length > 0 ? (
                    pendingAttendees.map((attendee, idx) => (
                      <AttendeeCard key={idx} attendee={attendee} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No pending responses</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">No Attendee Data Available</h2>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                {isAlreadySynced 
                  ? "This event has been synced but no attendee data was found. Try re-syncing."
                  : "Sync this event with Google Calendar to see attendee information."}
              </p>
              <Button onClick={handleSync} disabled={syncing}>
                {syncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Sync with Calendar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Calendar Sync Not Available</h2>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Only events with titles starting with "Gandhi Capital" can be synced with Google Calendar.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {isGandhiCapitalEvent && isAlreadySynced && attendees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{attendees.length}</div>
                <div className="text-sm text-muted-foreground">Total Invited</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{acceptedAttendees.length}</div>
                <div className="text-sm text-muted-foreground">Accepted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{declinedAttendees.length}</div>
                <div className="text-sm text-muted-foreground">Declined</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{pendingAttendees.length}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
            {acceptedAttendees.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground text-center">
                  Response Rate: {Math.round(((acceptedAttendees.length + declinedAttendees.length) / attendees.length) * 100)}%
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}