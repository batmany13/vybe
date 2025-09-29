"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Users, CheckCircle2, XCircle, AlertCircle, Link2, Unlink, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useGoogleCalendarEvents } from '@/client-lib/integrations-client';
import { syncDinnerWithCalendar } from '@/client-lib/api-client';
import { Dinner, GoogleCalendarAttendee } from '@/shared/models';
import Link from 'next/link';

interface EventCalendarSyncProps {
  dinner: Dinner;
}

export function EventCalendarSync({ dinner }: EventCalendarSyncProps) {
  const { data: calendarEvents = [] } = useGoogleCalendarEvents();
  const [loading, setLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const isGandhiCapitalEvent = dinner.title.toLowerCase().startsWith('gandhi capital');
  const isAlreadySynced = dinner.google_calendar_sync_status === 'synced';
  
  // Try to find matching calendar event
  const findMatchingCalendarEvent = () => {
    if (!isGandhiCapitalEvent) return null;
    
    // Look for events with similar name and time
    const dinnerTime = new Date(dinner.starts_at).getTime();
    const timeWindow = 12 * 60 * 60 * 1000; // 12 hours window
    
    return calendarEvents.find(event => {
      const eventSummary = event.summary?.toLowerCase() || '';
      const eventTime = new Date(event.start?.dateTime || event.start?.date || '').getTime();
      const timeDiff = Math.abs(eventTime - dinnerTime);
      
      return eventSummary.includes('gandhi capital') && timeDiff <= timeWindow;
    });
  };

  const handleSync = async () => {
    const matchingEvent = findMatchingCalendarEvent();
    
    if (!matchingEvent) {
      toast.error('No matching Google Calendar event found');
      return;
    }

    setLoading(true);
    try {
      // Extract attendees data
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
      setLoading(false);
    }
  };

  // Normalize attendees data in case it's not an array (e.g., stored as JSON string)
  const normalizeAttendees = (raw: unknown): GoogleCalendarAttendee[] => {
    if (Array.isArray(raw)) {
      return raw as GoogleCalendarAttendee[];
    }
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as GoogleCalendarAttendee[]) : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const attendees = normalizeAttendees((dinner as any).google_calendar_attendees_data);
  const acceptedCount = attendees.filter(a => a.responseStatus === 'accepted').length;
  const declinedCount = attendees.filter(a => a.responseStatus === 'declined').length;
  const pendingCount = attendees.filter(a => a.responseStatus === 'needsAction' || a.responseStatus === 'tentative').length;
  const totalCount = attendees.length;

  if (!isGandhiCapitalEvent) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {isAlreadySynced ? (
          <>
            <Badge variant="default" className="gap-1">
              <Link2 className="h-3 w-3" />
              Synced
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Re-syncing...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-1" />
                  Re-sync
                </>
              )}
            </Button>
            {totalCount > 0 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDetailsOpen(true)}
                >
                  <Users className="h-4 w-4 mr-1" />
                  View Attendees ({totalCount})
                </Button>
                <Link href={`/dinners/${dinner.id}`}>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                </Link>
              </>
            )}
          </>
        ) : (
          <>
            <Badge variant="secondary" className="gap-1">
              <Unlink className="h-3 w-3" />
              Not Synced
            </Badge>
            <Button
              size="sm"
              variant="default"
              onClick={handleSync}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-1" />
                  Sync with Calendar
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {isAlreadySynced && totalCount > 0 && (
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {acceptedCount} accepted
          </span>
          {declinedCount > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              <XCircle className="h-3.5 w-3.5" />
              {declinedCount} declined
            </span>
          )}
          {pendingCount > 0 && (
            <span className="flex items-center gap-1 text-orange-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {pendingCount} pending
            </span>
          )}
        </div>
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Attendees - {dinner.title}</DialogTitle>
            <DialogDescription>
              RSVP status from Google Calendar
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Accepted</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{acceptedCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Declined</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{declinedCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              {attendees.length > 0 ? (
                <>
                  {attendees
                    .sort((a, b) => {
                      const statusOrder = { accepted: 0, tentative: 1, needsAction: 2, declined: 3 };
                      return (statusOrder[a.responseStatus] || 99) - (statusOrder[b.responseStatus] || 99);
                    })
                    .map((attendee, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            {attendee.displayName ? attendee.displayName.charAt(0).toUpperCase() : attendee.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">
                              {attendee.displayName || attendee.email}
                            </div>
                            {attendee.displayName && (
                              <div className="text-sm text-muted-foreground">{attendee.email}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {attendee.organizer && (
                            <Badge variant="outline">Organizer</Badge>
                          )}
                          {attendee.responseStatus === 'accepted' && (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Accepted
                            </Badge>
                          )}
                          {attendee.responseStatus === 'declined' && (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Declined
                            </Badge>
                          )}
                          {attendee.responseStatus === 'tentative' && (
                            <Badge variant="secondary" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Maybe
                            </Badge>
                          )}
                          {attendee.responseStatus === 'needsAction' && (
                            <Badge variant="outline" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              No Response
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No attendee data available. Try re-syncing with Google Calendar.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}