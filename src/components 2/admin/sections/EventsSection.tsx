"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Plus, Pencil, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Dinner } from '@/shared/models';
import { useDinners, createDinner, updateDinner, deleteDinner } from '@/client-lib/api-client';
import { EventCalendarSync } from '@/components/admin/EventCalendarSync';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

export function EventsSection() {
  const { data: events = [] } = useDinners();
  const now = new Date();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Dinner | null>(null);
  const [form, setForm] = useState<{ title: string; starts_at: string; city: string; location: string }>({
    title: '',
    starts_at: '',
    city: 'San Francisco',
    location: '',
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: 'Gandhi Capital ', starts_at: '', city: 'San Francisco', location: '' });
    setOpen(true);
  };

  const openEdit = (e: Dinner) => {
    setEditing(e);
    // Convert ISO to input datetime-local value (local time)
    const dt = new Date(e.starts_at);
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    setForm({ title: e.title, starts_at: local, city: e.city ?? '', location: e.location ?? '' });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!form.title.trim() || !form.starts_at) {
        toast.error('Title and date/time are required');
        return;
      }
      // Convert datetime-local (no timezone) to ISO in local timezone
      const iso = new Date(form.starts_at).toISOString();
      if (editing) {
        await updateDinner(editing.id, { title: form.title.trim(), starts_at: iso, city: form.city || null as any, location: form.location || null as any });
        toast.success('Event updated');
      } else {
        await createDinner({ title: form.title.trim(), starts_at: iso, city: form.city || undefined, location: form.location || undefined, id: 0, created_at: '', updated_at: '' } as any);
        toast.success('Event created');
      }
      setOpen(false);
    } catch (e) {
      toast.error('Failed to save event');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this event?')) return;
    try {
      await deleteDinner(id);
      toast.success('Event deleted');
    } catch (e) {
      toast.error('Failed to delete event');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Events</CardTitle>
            <CardDescription>Manage events (create, edit, delete)</CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> New Event
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Calendar Sync</TableHead>
                  <TableHead className="w-40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length > 0 ? (
                  events.map((e) => {
                    const isUpcoming = new Date(e.starts_at).getTime() >= now.getTime();
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.title}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" /> {formatDateTime(e.starts_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" /> {e.city ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isUpcoming ? <Badge>Upcoming</Badge> : <Badge variant="secondary">Past</Badge>}
                        </TableCell>
                        <TableCell>
                          <EventCalendarSync dinner={e} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {e.title.toLowerCase().startsWith('gandhi capital') && (
                              <Link href={`/dinners/${e.id}`}>
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                            <Button size="sm" variant="outline" onClick={() => openEdit(e)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(e.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No events yet. Create your first event.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Event' : 'New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g., Gandhi Capital Happy Hour" />
              <p className="text-xs text-muted-foreground">Events starting with "Gandhi Capital" can be synced with Google Calendar</p>
            </div>
            <div className="space-y-1">
              <Label>Date & Time</Label>
              <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="San Francisco" />
            </div>
            <div className="space-y-1">
              <Label>Location (optional)</Label>
              <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Venue or address" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? 'Save Changes' : 'Create Event'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
