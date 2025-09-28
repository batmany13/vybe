'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/client-lib/auth-client';
import { useDeals, createMonthlyUpdate, useDinners } from '@/client-lib/api-client';
import { sendGmailEmail } from '@/client-lib/integrations-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CalendarIcon, Check, ChevronLeft, ChevronRight, Mail, Plus, RefreshCw } from 'lucide-react';

const MONTHS = [
  'January','February','March','April','May','June','July','August','September','October','November','December'
];

interface EventEnhancement {
  eventId: string;
  pictureLinks: string[];
  summary: string;
}

export default function AdminCreateInvestorUpdatePage() {
  const { data: session } = process.env.NODE_ENV === 'production' ? authClient.useSession() : { data: { user: { name: 'Bruce Wang', email: 'byyw13@gmail.com', image: undefined } } };
  const SENDER_NAME = 'Quang Hoang';
  const SENDER_EMAIL = 'quang@vybe.build';
  const { data: deals = [] } = useDeals();
  const { data: dinners = [] } = useDinners();

  // Step state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: period + intro
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [intro, setIntro] = useState<string>('');

  // Step 2: stats

  const [talkedTo, setTalkedTo] = useState<number>(0);
  const [sentToLPs, setSentToLPs] = useState<number>(0);
  const [investedCount, setInvestedCount] = useState<number>(0);
  const [investedDeals, setInvestedDeals] = useState<{ id: string; company_name: string; one_liner: string; deal_size?: number }[]>([]);

  // Step 3: events (dinners)
  const [pastEventEnhancements, setPastEventEnhancements] = useState<EventEnhancement[]>([]);
  const [futureEventEnhancements, setFutureEventEnhancements] = useState<EventEnhancement[]>([]);

  // Step 4: conclusion
  const [conclusion, setConclusion] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [sendingTest, setSendingTest] = useState<boolean>(false);

  const startDate = useMemo(() => new Date(year, month - 1, 1), [year, month]);
  const endDate = useMemo(() => new Date(year, month, 0, 23, 59, 59, 999), [year, month]);

  // Prefill stats from deals based on stage transition timestamps when available
  useEffect(() => {
    const inPeriod = (d: Date) => d >= startDate && d <= endDate;

        // Preferred logic: count stage transitions within the selected period
    // talked to: deals that entered 'sourcing_meeting_booked' during the period
    const talked = deals.filter(d => {
      if (d.sourcing_meeting_booked_at) {
        const t = new Date(d.sourcing_meeting_booked_at);
        return inPeriod(t);
      }
      // Fallback heuristic for legacy data: if currently at or past meeting stage and updated in period
      const meetingStages = new Set(['sourcing_meeting_booked','sourcing_meeting_done_deciding','partner_review','offer','signed','signed_and_wired']);
      return meetingStages.has(d.stage) && inPeriod(new Date(d.updated_at));
    }).length;

    // sent to LPs: deals that entered 'partner_review' during the period
    const sent = deals.filter(d => {
      if (d.partner_review_started_at) {
        const t = new Date(d.partner_review_started_at);
        return inPeriod(t);
      }
      // Fallback heuristic: if currently in partner_review and updated in period
      return d.stage === 'partner_review' && inPeriod(new Date(d.updated_at));
    }).length;

    const investedStages = new Set(['signed','signed_and_wired']);

    // invested: deals that have close_date in period and are in invested stages
    const invested = deals.filter(d => {
      if (!d.close_date) return false;
      const cd = new Date(d.close_date);
      return inPeriod(cd) && investedStages.has(d.stage);
    });

    setTalkedTo(talked);
    setSentToLPs(sent);
    setInvestedCount(invested.length);

    setInvestedDeals(invested.map(d => ({
      id: d.id,
      company_name: d.company_name,
      one_liner: d.company_description_short ?? d.description ?? '',
      deal_size: d.deal_size,
    })));
  }, [deals.length, month, year]);

  // Compute dinners for selected month and upcoming
  const { pastDinnersInMonth, futureDinners, recentPastDinners } = useMemo(() => {
    const list = dinners ?? [];
    const past: any[] = [];
    const future: any[] = [];
    const recentPast: any[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    for (const dn of list) {
      const whenStr = dn.starts_at;
      if (!whenStr) continue;
      const date = new Date(whenStr);
      if (date >= startDate && date <= endDate) {
        past.push(dn);
      }
      if (date > now) {
        future.push(dn);
      }
      if (date <= now && date >= thirtyDaysAgo) {
        recentPast.push(dn);
      }
    }
    // Sort for consistency
    past.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    future.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    recentPast.sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
    return { pastDinnersInMonth: past, futureDinners: future.slice(0, 5), recentPastDinners: recentPast.slice(0, 10) };
  }, [dinners?.length, month, year]);

  useEffect(() => {
    // Initialize enhancement entries when dinners change
    setPastEventEnhancements(prev => {
      const map = new Map(prev.map(p => [p.eventId, p] as const));
      const next: EventEnhancement[] = pastDinnersInMonth.map((ev: any) => map.get(String(ev.id)) ?? ({ eventId: String(ev.id), pictureLinks: [], summary: '' }));
      return next;
    });
    setFutureEventEnhancements(prev => {
      const map = new Map(prev.map(p => [p.eventId, p] as const));
      const next: EventEnhancement[] = futureDinners.map((ev: any) => map.get(String(ev.id)) ?? ({ eventId: String(ev.id), pictureLinks: [], summary: '' }));
      return next;
    });
  }, [pastDinnersInMonth.length, futureDinners.length]);

  const totalInvestedAmount = useMemo(() => investedDeals.reduce((s, d) => { const v = Number(d.deal_size); return s + (Number.isFinite(v) ? v : 0); }, 0), [investedDeals]);

  const monthName = MONTHS[month - 1];
  const subject = `Gandhi Capital - ${monthName} ${year} Update`;

  // Build email HTML preview
  const emailHtml = useMemo(() => {
    const fmt = new Intl.NumberFormat('en-US');
    const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    const investedList = investedDeals.length > 0 
      ? `<ul style="margin: 8px 0 0 20px; padding: 0 0 0 18px; list-style: disc;">${investedDeals.map(d => `<li style=\"margin: 4px 0;\"><strong>${d.company_name}</strong> — ${d.one_liner || ''}</li>`).join('')}</ul>`
      : '<p>No new investments this period.</p>';

    const pastEventsHtml = pastDinnersInMonth.length > 0 ? pastDinnersInMonth.map((ev: any) => {
      const enh = pastEventEnhancements.find(p => p.eventId === String(ev.id));
      const pics = enh && enh.pictureLinks.length > 0 ? `<div>${enh.pictureLinks.map((url, idx) => `<a href="${url}" target="_blank" rel="noreferrer" style="color:#2563eb; text-decoration: underline;">Photo ${idx + 1}</a>`).join(' • ')}</div>` : '';
      return `<div style="margin-bottom:12px"><div><strong>${ev.title ?? 'Event'}</strong>${ev.starts_at ? ` – ${new Date(ev.starts_at).toLocaleDateString()}` : ''}${ev.city ? ` • ${ev.city}` : ''}${ev.location ? ` • ${ev.location}` : ''}</div>${enh?.summary ? `<div>${enh.summary}</div>` : ''}${pics}</div>`;
    }).join('') : '<p>No events this month.</p>';

    const futureEventsHtml = futureDinners.length > 0 
      ? `<ul style="margin: 8px 0 0 20px; padding: 0 0 0 18px; list-style: disc;">${(() => {
          const nowForDiff = new Date();
          const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
          const monthsAbbr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'];
          const ordinal = (n: number) => { const s = ["th","st","nd","rd"], v = n % 100; return (s as any)[(v-20)%10] || (s as any)[v] || s[0]; };
          return futureDinners.map((ev: any) => {
            const when = ev.starts_at ? new Date(ev.starts_at) : null;
            let whenStr = '';
            if (when) {
              const dow = days[when.getDay()];
              const month = monthsAbbr[when.getMonth()];
              const day = when.getDate();
              const ord = ordinal(day);
              const hours = when.getHours();
              const h12 = hours % 12 === 0 ? 12 : hours % 12;
              const minutes = when.getMinutes();
              const ampm = hours >= 12 ? 'PM' : 'AM';
              const timeStr = minutes === 0 ? `${h12}${ampm}` : `${h12}:${String(minutes).padStart(2,'0')}${ampm}`;
              whenStr = `${dow}, ${month} ${day}${ord}, ${timeStr}`;
            }
            const meta = [whenStr, ev.city, ev.location].filter(Boolean).join(' • ');
            const daysFromNow = when ? Math.ceil((when.getTime() - nowForDiff.getTime()) / (1000 * 60 * 60 * 24)) : null;
            const daysText = daysFromNow !== null ? ` <span style=\"color:#6b7280; font-style: italic;\">in ${daysFromNow} day${daysFromNow === 1 ? '' : 's'}</span>` : '';
            return `<li style=\"margin: 4px 0;\"><strong>${ev.title ?? 'Event'}</strong>${meta ? ` — ${meta}` : ''}${daysText}</li>`;
          }).join('');
        })()}</ul>`
      : '<p>No upcoming events.</p>';

    const recentEventsHtml = recentPastDinners.length > 0
      ? `<ul style="margin: 8px 0 0 20px; padding: 0 0 0 18px; list-style: disc;">${recentPastDinners.map((ev: any) => {
          const whenStr = ev.starts_at ? new Date(ev.starts_at).toLocaleString() : '';
          const meta = [whenStr, ev.city, ev.location].filter(Boolean).join(' • ');
          return `<li style=\"margin: 4px 0;\"><strong>${ev.title ?? 'Event'}</strong>${meta ? ` — ${meta}` : ''}</li>`;
        }).join('')}</ul>`
      : '<p>No recent events in the last 30 days.</p>';

    return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#111827; line-height:1.6">
      <p>Hey all, ${(intro || `Here is our update for ${monthName} ${year}.`).replace(/^\s+/, '').replace(/\n/g, ' ')}</p>

      <h3 style="margin-top:20px; font-size:16px">Key activity in ${monthName}</h3>
      <ul style="margin: 4px 0 0 20px; padding: 0 0 0 18px; list-style: disc;">
        <li style="margin: 4px 0;">Startups we talked to: <strong>${fmt.format(talkedTo)}</strong></li>
        <li style="margin: 4px 0;">Startups sent to LPs: <strong>${fmt.format(sentToLPs)}</strong></li>
        <li style="margin: 4px 0;">New investments: <strong>${fmt.format(investedCount)}</strong> (${currency.format(totalInvestedAmount)} total)</li>
      </ul>

      ${investedDeals.length > 0 ? `<h3 style=\"margin-top:20px; font-size:16px\">New investments in ${monthName}</h3>${investedList}` : ''}

      <h3 style="margin-top:20px; font-size:16px">Recent events</h3>
      ${recentEventsHtml}

      <h3 style="margin-top:20px; font-size:16px">Upcoming events</h3>
      <div style="color:#6b7280; font-style: italic; margin: 4px 0 8px 0;">(if you want to join, just accept the calendar invite!)</div>
      ${futureEventsHtml}

      ${conclusion ? `<p style=\"margin-top:20px\">${conclusion}</p>` : ''}

      <p style=\"margin-top:28px\">Cheers!</p>
      <p style="margin-top:8px">&mdash; <a href="https://www.linkedin.com/in/quanghoang/" target="_blank" rel="noreferrer" style="color:#2563eb; text-decoration: underline;">Quang Hoang</a> | Cofounder & CEO @ <a href="https://www.vybe.build/" target="_blank" rel="noreferrer" style="color:#2563eb; text-decoration: underline;">Vybe</a> | Cofounder & GP @ Gandhi Capital</p>
    </div>`;
  }, [intro, talkedTo, sentToLPs, investedCount, investedDeals, pastDinnersInMonth.length, pastEventEnhancements, futureDinners.length, conclusion, month, year]);

  const canNext = () => {
    if (step === 1) return Boolean(month) && Boolean(year);
    if (step === 2) return true; // can always adjust later
    if (step === 3) return true;
    if (step === 4) return !sending;
    return true;
  };

  const handleSendTest = async () => {
    setSendingTest(true);
    try {
      const from = `${SENDER_NAME} <${SENDER_EMAIL}>`;
      const to = 'quang@vybe.build';
      await sendGmailEmail(from, to, subject + '', emailHtml);
      toast.success('Test email sent to quang@vybe.build');
    } catch (e) {
      console.error(e);
      toast.error('Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const from = `${SENDER_NAME} <${SENDER_EMAIL}>`;
      const to = 'gandhi-capital-lps@googlegroups.com';
      await sendGmailEmail(from, to, subject, emailHtml);

      // Save a monthly update record for history
      const metrics = {
        deals_evaluated: talkedTo,
        new_investments: investedCount,
        total_investment_amount: totalInvestedAmount,
      } as any;

      await createMonthlyUpdate({
        title: subject,
        content: stripHtml(emailHtml),
        month,
        year,
        metrics,
        created_by: session?.user?.email ?? 'unknown',
        period_start: startDate.toISOString(),
        period_end: endDate.toISOString(),
      } as any);

      toast.success('Update sent via Gmail');
    } catch (e) {
      console.error(e);
      toast.error('Failed to send update');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-muted-foreground hover:underline flex items-center"><ChevronLeft className="h-4 w-4 mr-1"/>Back to Admin</Link>
          <h1 className="text-2xl font-bold">Create Investor Update</h1>
          <Badge variant="outline">Step {step} of 4</Badge>
        </div>
        <div className="flex gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep((s) => (Math.max(1, (s - 1)) as any))}><ChevronLeft className="h-4 w-4 mr-1"/>Back</Button>
          )}
          {step < 4 && (
            <Button onClick={() => setStep((s) => (Math.min(4, (s + 1)) as any))} disabled={!canNext()}>
              Next<ChevronRight className="h-4 w-4 ml-1"/>
            </Button>
          )}
          {step === 4 && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSendTest} disabled={sending || sendingTest}>
                {sendingTest ? <RefreshCw className="h-4 w-4 mr-2 animate-spin"/> : <Mail className="h-4 w-4 mr-2"/>}
                Send Test
              </Button>
              <Button onClick={handleSend} disabled={!canNext() || sendingTest}>
                {sending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin"/> : <Mail className="h-4 w-4 mr-2"/>}
                Send
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: form steps */}
        <div className="space-y-4">
          {/* Step 1 */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 1 — Period & Intro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Month</Label>
                    <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
                      <SelectTrigger><SelectValue placeholder="Select month"/></SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Year</Label>
                    <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
                      <SelectTrigger><SelectValue placeholder="Select year"/></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i + 1).map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Intro</Label>
                  <Textarea value={intro} onChange={(e) => setIntro(e.target.value)} placeholder={`Quick intro for ${MONTHS[month-1]} ${year}...`} rows={5}/>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 2 — Activity & Investments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">

                  <div>
                    <Label>Startups we talked to (auto, editable)</Label>
                    <Input type="number" value={Number.isFinite(talkedTo) ? String(talkedTo) : ''} onChange={(e) => setTalkedTo(parseInt(e.target.value) || 0)} />
                  </div>
                  <div>
                    <Label>Startups sent to LPs (auto, editable)</Label>
                    <Input type="number" value={Number.isFinite(sentToLPs) ? String(sentToLPs) : ''} onChange={(e) => setSentToLPs(parseInt(e.target.value) || 0)} />
                  </div>
                  <div>
                    <Label>New investments (auto, editable)</Label>
                    <Input type="number" value={Number.isFinite(investedCount) ? String(investedCount) : ''} onChange={(e) => setInvestedCount(parseInt(e.target.value) || 0)} />
                  </div>
                </div>

                <Separator className="my-2"/>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Invested companies & one-liners</Label>
                    <Button variant="outline" size="sm" onClick={() => {
                      // Recompute from Gandhi Capital Tracker
                      toast.success('Refreshed from Gandhi Capital Tracker');
                      setStep(2); // remains
                    }}><RefreshCw className="h-4 w-4 mr-1"/>Refresh</Button>
                  </div>
                  {investedDeals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No investments detected in this period.</p>
                  ) : (
                    <div className="space-y-3">
                      {investedDeals.map((d, idx) => (
                        <div key={d.id} className="p-3 border rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{d.company_name}</div>
                            <Badge variant="outline">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(d.deal_size ?? 0)}</Badge>
                          </div>
                          <Textarea value={d.one_liner} onChange={(e) => setInvestedDeals(prev => prev.map((x, i) => i === idx ? { ...x, one_liner: e.target.value } : x))} placeholder="One-line description" rows={2}/>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 3 — Events (Dinners)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-2"><CalendarIcon className="h-4 w-4"/><span className="font-medium">Past dinners in {monthName}</span></div>
                  {pastDinnersInMonth.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No dinners found this month.</p>
                  ) : (
                    <div className="space-y-4">
                      {pastDinnersInMonth.map((ev: any, idx: number) => {
                        const enh = pastEventEnhancements[idx];
                        return (
                          <div key={ev.id} className="p-3 border rounded-md">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{ev.title ?? 'Event'}</div>
                              <div className="text-xs text-muted-foreground">{new Date(ev.starts_at).toLocaleString()}</div>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">{[ev.city, ev.location].filter(Boolean).join(' • ')}</div>
                            <div className="mt-2">
                              <Label>Quick summary</Label>
                              <Textarea rows={2} value={enh?.summary ?? ''} onChange={(e) => setPastEventEnhancements(prev => prev.map((p, i) => i===idx ? { ...p, summary: e.target.value } : p))} />
                            </div>
                            <div className="mt-2">
                              <Label>Picture links</Label>
                              <div className="space-y-2 mt-1">
                                {(enh?.pictureLinks ?? []).map((link, i) => (
                                  <Input key={i} value={link} onChange={(e) => setPastEventEnhancements(prev => prev.map((p, ii) => ii===idx ? { ...p, pictureLinks: p.pictureLinks.map((l, li) => li===i ? e.target.value : l) } : p))} placeholder="https://..." />
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => setPastEventEnhancements(prev => prev.map((p, i) => i===idx ? { ...p, pictureLinks: [...p.pictureLinks, ''] } : p))}><Plus className="h-4 w-4 mr-1"/>Add picture</Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-2"><CalendarIcon className="h-4 w-4"/><span className="font-medium">Upcoming dinners</span></div>
                  {futureDinners.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No upcoming dinners.</p>
                  ) : (
                    <ul className="space-y-3">
                      {futureDinners.map((ev: any) => (
                        <li key={ev.id} className="p-3 border rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{ev.title ?? 'Event'}</div>
                            <div className="text-xs text-muted-foreground">{new Date(ev.starts_at).toLocaleString()}</div>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{[ev.city, ev.location].filter(Boolean).join(' • ')}</div>
                          <div className="mt-1 text-xs text-muted-foreground">Ask recipients to accept the calendar invite</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 4 — Conclusion & Send</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Conclusion</Label>
                  <Textarea value={conclusion} onChange={(e) => setConclusion(e.target.value)} rows={5} placeholder="Wrap up and any calls to action..."/>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4"/> Email will be sent via Gmail to gandhi-capital-lps@googlegroups.com
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: live email preview */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Email preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg bg-white dark:bg-gray-950 shadow-sm">
                {/* Header */}
                <div className="px-6 py-3 border-b bg-gray-50 dark:bg-gray-900/50 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <div><span className="text-muted-foreground">From:</span> <span>{SENDER_NAME} — {SENDER_EMAIL}</span></div>
                    <div><span className="text-muted-foreground">To:</span> <span>gandhi-capital-lps@googlegroups.com</span></div>
                    <div className="w-full"><span className="text-muted-foreground">Subject:</span> <span>{subject}</span></div>
                  </div>
                </div>
                {/* Body */}
                <div className="px-6 py-6">
                  <div className="[&_a]:text-blue-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1" dangerouslySetInnerHTML={{ __html: emailHtml }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function stripHtml(html: string) {
  // remove tags for storing a text version
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/\s+\n/g, '\n').trim();
}
