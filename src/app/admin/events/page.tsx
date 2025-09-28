"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar,
  MapPin,
  Copy,
  Check,
  Users,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import { useDinners, type DinnerEvent, type GoogleCalendarAttendee } from "@/client-lib/api-client";
import { format } from "date-fns";

// Use GoogleCalendarAttendee from api-client
type Attendee = GoogleCalendarAttendee;

export default function EventInformationPage() {
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const { data: events = [] } = useDinners();

  // Group attendees by response status
  const groupAttendeesByStatus = (event: DinnerEvent) => {
    const attendees = event.google_calendar_attendees_data || [];
    
    const accepted = attendees.filter(a => a.responseStatus === "accepted");
    const declined = attendees.filter(a => a.responseStatus === "declined");
    const pending = attendees.filter(a => a.responseStatus === "needsAction" || a.responseStatus === "tentative");
    
    return { accepted, declined, pending };
  };

  // Copy emails to clipboard
  const copyEmails = async (attendees: Attendee[], section: string) => {
    const emails = attendees.map(a => a.email).join(", ");
    
    if (!emails) {
      toast.error("No emails to copy");
      return;
    }
    
    try {
      await navigator.clipboard.writeText(emails);
      setCopiedSection(section);
      toast.success(`Copied ${attendees.length} email${attendees.length !== 1 ? 's' : ''} to clipboard`);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      toast.error("Failed to copy emails");
    }
  };

  const selectedEventData = events.find(e => e.id.toString() === selectedEvent);
  const attendeeGroups = selectedEventData ? groupAttendeesByStatus(selectedEventData) : null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "declined":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <HelpCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const AttendeeList = ({ 
    title, 
    attendees, 
    status,
    color 
  }: { 
    title: string; 
    attendees: Attendee[]; 
    status: string;
    color: string;
  }) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant="secondary" className={color}>
              {attendees.length}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyEmails(attendees, status)}
            disabled={attendees.length === 0}
            className="gap-2"
          >
            {copiedSection === status ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy All Emails
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {attendees.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attendees in this category</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {attendees.map((attendee, idx) => (
              <div
                key={`${attendee.email}-${idx}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {attendee.displayName?.charAt(0) || attendee.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {attendee.displayName || attendee.email.split('@')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">{attendee.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyEmails([attendee], `single-${idx}`)}
                  className="h-8 w-8 p-0"
                >
                  {copiedSection === `single-${idx}` ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Event Information</h1>
        <p className="text-muted-foreground">
          Manage event attendees and copy email lists for communication
        </p>
      </div>

      {/* Event Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Event</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Choose an event to view attendees" />
            </SelectTrigger>
            <SelectContent>
              {events.length === 0 ? (
                <SelectItem value="no-events" disabled>
                  No events available
                </SelectItem>
              ) : (
                events.map((event) => (
                  <SelectItem key={event.id} value={event.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{event.title}</span>
                      <span className="text-sm text-muted-foreground">
                        ({format(new Date(event.starts_at), "MMM dd, yyyy")})
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {selectedEventData && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="grid gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Date:</span>
                  <span>{format(new Date(selectedEventData.starts_at), "MMMM dd, yyyy 'at' h:mm a")}</span>
                </div>
                {selectedEventData.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Location:</span>
                    <span>{selectedEventData.location}</span>
                  </div>
                )}
                {selectedEventData.city && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">City:</span>
                    <span>{selectedEventData.city}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendee Lists */}
      {selectedEventData && attendeeGroups && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Invited</p>
                  <p className="text-2xl font-bold">
                    {attendeeGroups.accepted.length + attendeeGroups.declined.length + attendeeGroups.pending.length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Accepted</p>
                  <p className="text-2xl font-bold">{attendeeGroups.accepted.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Declined</p>
                  <p className="text-2xl font-bold">{attendeeGroups.declined.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <HelpCircle className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{attendeeGroups.pending.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Copy All Section */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                <p className="text-sm text-muted-foreground mr-4">Quick Copy:</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyEmails(attendeeGroups.accepted, "all-accepted")}
                  disabled={attendeeGroups.accepted.length === 0}
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  All Accepted ({attendeeGroups.accepted.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyEmails(attendeeGroups.declined, "all-declined")}
                  disabled={attendeeGroups.declined.length === 0}
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  All Declined ({attendeeGroups.declined.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyEmails(attendeeGroups.pending, "all-pending")}
                  disabled={attendeeGroups.pending.length === 0}
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  All Pending ({attendeeGroups.pending.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allAttendees = [
                      ...attendeeGroups.accepted,
                      ...attendeeGroups.declined,
                      ...attendeeGroups.pending
                    ];
                    copyEmails(allAttendees, "all-attendees");
                  }}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  All Attendees ({attendeeGroups.accepted.length + attendeeGroups.declined.length + attendeeGroups.pending.length})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Attendee Lists in Tabs */}
          <Tabs defaultValue="accepted" className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="accepted" className="gap-2">
                {getStatusIcon("accepted")}
                Accepted
                <Badge variant="secondary" className="ml-1">
                  {attendeeGroups.accepted.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="declined" className="gap-2">
                {getStatusIcon("declined")}
                Declined
                <Badge variant="secondary" className="ml-1">
                  {attendeeGroups.declined.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2">
                {getStatusIcon("pending")}
                Pending
                <Badge variant="secondary" className="ml-1">
                  {attendeeGroups.pending.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="accepted">
              <AttendeeList
                title="Accepted Attendees"
                attendees={attendeeGroups.accepted}
                status="accepted"
                color="text-green-600"
              />
            </TabsContent>

            <TabsContent value="declined">
              <AttendeeList
                title="Declined Attendees"
                attendees={attendeeGroups.declined}
                status="declined"
                color="text-red-600"
              />
            </TabsContent>

            <TabsContent value="pending">
              <AttendeeList
                title="Pending Attendees"
                attendees={attendeeGroups.pending}
                status="pending"
                color="text-yellow-600"
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Empty State */}
      {!selectedEvent && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Event Selected</h3>
            <p className="text-sm text-muted-foreground">
              Please select an event from the dropdown above to view and manage attendees
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}