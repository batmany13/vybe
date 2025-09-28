"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { DealWithVotes, Founder, LimitedPartner, PainPointResponse, BuyingInterestResponse, PilotCustomerResponse } from "@/shared/models";
import { generateText, sendGmailEmail } from "@/client-lib/integrations-client";
import { toast } from "sonner";
import { Mail, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export type DecisionMode = "invest" | "pass";

type SurveyQuote = {
  id: string;
  type: "pain" | "buy" | "pilot" | "comment" | "note" | "price";
  text: string; // exact user-provided text + signature like "— CTO @ Checkr"
};

export function DecisionFlowDialog({
  open,
  onOpenChange,
  deal,
  mode,
  lps = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: DealWithVotes;
  mode: DecisionMode;
  lps?: LimitedPartner[];
}) {
  const [reasons, setReasons] = useState<string>("");
  const [appreciation, setAppreciation] = useState<string>("");
  const [emailBody, setEmailBody] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const defaultRecipients = useMemo(() => {
    const founders: Founder[] = (deal.founders ?? []).filter(Boolean);
    const emails = founders.map((f) => f.email).filter((e): e is string => !!e && e.trim().length > 0);
    return emails.join(", ");
  }, [deal.founders]);
  const [recipients, setRecipients] = useState<string>("");

  const [includeHelps, setIncludeHelps] = useState<Record<string, boolean>>({
    access: true,
    earlyCustomers: true,
    handsOn: true,
    community: true,
  });

  const selectedHelps = useMemo(() => {
    const list: string[] = [];
    if (includeHelps.access) list.push("access to 50 elite tech leaders for feedback and intros");
    if (includeHelps.earlyCustomers) list.push("early customer introductions across our LP companies");
    if (includeHelps.handsOn) list.push("hands-on help from operators who've built and shipped at scale");
    if (includeHelps.community) list.push("community-driven insight from our LP network (YC + top eng leaders)");
    return list;
  }, [includeHelps]);

  const formatShort = (amount: number | undefined) => {
    if (!amount || amount <= 0) return "";
    if (amount >= 1_000_000) {
      const m = amount / 1_000_000;
      return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
    }
    if (amount >= 1_000) {
      const k = amount / 1_000;
      return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
    }
    return `${amount}`;
  };

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    } catch {
      return `$${amount}`;
    }
  };

  const recipientFirstName = useMemo(() => {
    const name = deal.founders && deal.founders[0]?.name ? deal.founders[0].name : undefined;
    if (!name) return 'team';
    const parts = name.split(' ').filter(Boolean);
    return (parts[0] || 'team');
  }, [deal.founders]);

  // Build survey quotes only from actual free-text responses, signed with title @ company (no names)
  const surveyQuotes: SurveyQuote[] = useMemo(() => {
    const out: SurveyQuote[] = [];

    for (const v of deal.votes || []) {
      const lp = lps.find((x) => x.id === v.lp_id);
      const whoTitle = lp?.title ? lp.title : undefined;
      const whoCompany = lp?.company ? ` @ ${lp.company}` : "";
      const who = (whoTitle ? `${whoTitle}${whoCompany}` : undefined) ?? "LP";
      const sign = ` — ${who}`;

      const add = (suffix: string, type: SurveyQuote["type"], text?: string | null) => {
        if (text && text.trim().length > 0) {
          out.push({ id: `${v.id}-${suffix}`, type, text: `${text.trim()}${sign}` });
        }
      };

      add("solution", "pain", v.solution_feedback);
      add("pilot", "pilot", v.pilot_customer_feedback);
      add("buy", "buy", v.buying_interest_feedback);
      add("price", "price", v.price_feedback);
      add("comment", "comment", v.comments);
      add("note", "note", v.additional_notes);
    }

    return out;
  }, [deal.votes, lps]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelectedIds(new Set(surveyQuotes.map((q) => q.id)));
  const clearAll = () => setSelectedIds(new Set());

  useEffect(() => {
    if (open) {
      setReasons("");
      setAppreciation("");
      setEmailBody("");
      setRecipients(defaultRecipients);
      setSelectedIds(new Set(surveyQuotes.map((q) => q.id)));
    }
  }, [open, defaultRecipients, surveyQuotes]);

  function formatTitleCompany(lp: LimitedPartner | undefined) {
    if (!lp) return undefined;
    const t = (lp.title || '').trim();
    const c = (lp.company || '').trim();
    if (!t && !c) return undefined;
    if (t && c) return `${t} @ ${c}`;
    return t || c || undefined;
  }

  function formatListWithEllipsis(items: string[], max: number) {
    const list = items.slice(0, Math.max(0, max));
    return `${list.join(', ')}${items.length > max ? ' ...' : ''}`;
  }

  function isStrongPilotResponse(resp: PilotCustomerResponse | undefined) {
    if (!resp) return false;
    const strong: PilotCustomerResponse[] = [
      'cautiously_interested',
      'interested_with_conditions',
      'very_interested',
      'hell_yes',
    ];
    return strong.includes(resp);
  }

  function isStrongBuyResponse(resp: BuyingInterestResponse | undefined) {
    if (!resp) return false;
    const strong: BuyingInterestResponse[] = [
      'probably',
      'very_likely',
      'absolutely',
    ];
    return strong.includes(resp);
  }

  function isRealProblem(level: PainPointResponse | undefined) {
    if (!level) return false;
    const serious: PainPointResponse[] = [
      'real_problem',
      'major_pain',
      'critical',
    ];
    return serious.includes(level);
  }

  async function handleGenerate() {
    if (mode === "pass") {
      if (!appreciation.trim()) {
        toast.info("Please add what you appreciated about them.");
        return;
      }
      if (!reasons.trim()) {
        toast.info("Please add a few bullet points first.");
        return;
      }
    }
    if (mode === "invest" && selectedIds.size === 0) {
      toast.info("Select at least one survey quote to include.");
      return;
    }

    setGenerating(true);
    try {
      const baseTone = "concise, friendly, slightly more formal, human. 5-8 sentences max. no slang.";

      if (mode === "pass") {
        // Deterministic pass email (no AI). Always starts with appreciation and uses first/second-level reasons.
        const firstName = recipientFirstName;
        const reasonLines = reasons
          .split('\n')
          .map((l) => l.trim().replace(/^[\-•\u2022\s]+/, ''))
          .filter((l) => l.length > 0);
        const header = reasonLines.length === 2 ? 'Two reasons:' : 'A few reasons:';
        const bullets = reasonLines.map((l) => `- ${l}`).join('\n');

        const closing = `This is really not easy, and I'm very much on the fence, but I'd rather pass if I'm not 100% convinced. I've been wrong many times in the past so I wish you guys to prove me wrong once more!\n\nwould love to stay in touch regardless, and best of luck closing the rest of the round!\n\nCheers! Quang`;

        const lines: string[] = [];
        lines.push(`Hi ${firstName}, — ${appreciation.trim()}`);
        lines.push('');
        lines.push(`That said, after thinking it through, I'm going to pass on investing right now.`);
        lines.push('');
        lines.push(header);
        lines.push('');
        lines.push(bullets);
        lines.push('');
        lines.push(closing);

        const body = lines.join('\n');
        setEmailBody(body);
      } else {
        // INVEST: Fixed intro and closing; add programmatic bullets up-front; AI only reorders selected quotes.
        const investShort = formatShort(deal.deal_size) || formatCurrency(deal.deal_size);
        const valuationShort = formatShort(deal.valuation ?? 0);
        const valPart = deal.valuation
          ? (deal.safe_or_equity && deal.safe_or_equity.toLowerCase().includes("safe")
            ? ` @ your ${valuationShort} SAFE note`
            : ` @ a ${valuationShort} valuation`)
          : "";

        const rawSelectedQuotes = surveyQuotes
          .filter((q) => selectedIds.has(q.id))
          .map((q) => `- ${q.text}`)
          .join("\n");

        const orderingPrompt = `You are helping compose an investor email. Reorder the QUOTES below from most compelling to least.
- Prioritize: (1) clear pain confirmations, (2) strong intent to buy, (3) pilot intent, (4) other strong feedback.
- Keep quotes verbatim, including their signatures (e.g., \"— CTO @ Checkr\"). Do not add, remove, or change words.
- Return ONLY the bullet list, nothing else.

QUOTES:\n${rawSelectedQuotes}`;

        const orderedQuotes = await generateText(orderingPrompt, false, false);
        const quotesList = (orderedQuotes || "").trim();

        // Build the requested non-AI summary bullets from structured vote data
        const lpById = new Map<string, LimitedPartner>();
        for (const lp of lps) lpById.set(lp.id, lp);

        const interestedLabelsSet = new Set<string>();
        const painLabelsSet = new Set<string>();

        for (const v of deal.votes || []) {
          const lp = lpById.get(v.lp_id);
          const label = formatTitleCompany(lp);
          if (label) {
            const interested = !!v.pilot_customer_interest || !!v.would_buy || isStrongPilotResponse(v.pilot_customer_response) || isStrongBuyResponse(v.buying_interest_response);
            if (interested) interestedLabelsSet.add(label);
            const realPain = isRealProblem(v.pain_point_level) || !!v.has_pain_point;
            if (realPain) painLabelsSet.add(label);
          }
        }

        const interestedLabels = Array.from(interestedLabelsSet);
        const painLabels = Array.from(painLabelsSet);
        const painCount = painLabels.length;

        const interestedLine = interestedLabels.length > 0
          ? `- Those folks said they were interested to evaluate for their companies: ${formatListWithEllipsis(interestedLabels, 6)}`
          : undefined;

        const painExamples = painLabels.length > 0 ? ` (e.g., ${formatListWithEllipsis(painLabels, 5)})` : '';
        const painLine = painCount > 0
          ? `- ${painCount} people mentioned it was a real problem${painExamples}`
          : undefined;

        // Nest the reordered quotes under a parent bullet
        const nestedQuotes = quotesList
          ? quotesList
              .split('\n')
              .map((line) => line.replace(/^\-\s*/, '  - '))
              .join('\n')
          : '';
        const quotesHeader = `- Some relevant quotes:`;

        const insightsBullets = [interestedLine, painLine, quotesHeader, nestedQuotes]
          .filter((x): x is string => !!x && x.trim().length > 0)
          .join('\n');

        const beginning = `${recipientFirstName}, very nice chatting with you yesterday. I had a chance to survey the 50 CTOs about what you're working on, we would like to invest ${investShort}${valPart}.\n\nThe results have been extremely positive. Some insights:`;

        const howWeHelp = `\n\nIf you're interested in taking money from us, as a reminder\n\n` +
          `once we invest, you instantly get access to our LPs as early design partners, pilot customers, or hands-on advisors.\n\n` +
          `We do quarterly dinners where you'll be able to meet them in person.\n\n` +
          `Let me know, excited to partner together on this!  Here's my signature block for the SAFE:\n\n` +
          `GANDHI CAPITAL FUND I, LP\n\n` +
          `By Gandhi Capital Fund I GP, LLC, its general partner\n\n` +
          `By: _________________________________\n\n` +
          `Name: Quang Hoang\n\n` +
          `Title: Managing Member\n\n` +
          `16192 Coastal Highway Lewes, DE 19958\n\n` +
          `Cheers! 🚀`;

        const full = [beginning, insightsBullets, howWeHelp].filter(Boolean).join("\n\n");
        setEmailBody(full);
      }
    } catch (e) {
      toast.error("Failed to generate email");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend() {
    if (!recipients.trim()) {
      toast.info("Add at least one recipient");
      return;
    }
    if (!emailBody.trim()) {
      toast.info("Generate or write an email first");
      return;
    }
    setSending(true);
    try {
      const subject = mode === "pass" ? `${deal.company_name} — quick follow-up` : `${deal.company_name} — we'd love to invest`;
      const fromHeader = `Quang Hoang <quang@vybe.build>`;
      await sendGmailEmail(fromHeader, recipients, subject, emailBody);
      toast.success("Email sent via Gmail");
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  }

  const showQuotes = mode === 'invest' || (mode === 'pass' && deal.stage === 'partner_review');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1500px] w-[98vw] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "pass" ? "Share pass reasons" : "Share invest reasons"}</DialogTitle>
          <DialogDescription>
            {mode === "pass" ? "Add a few bullets on why we're passing. We'll draft a short, empathetic email that begins with what you appreciated." : "Pick the survey quotes to include. We'll reorder them, then compose your email using a fixed intro and closing."}
          </DialogDescription>
        </DialogHeader>

        <div className={`grid gap-6 ${showQuotes ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Left: Survey quotes selection (hidden for pass stage in sourcing_meeting_done_deciding) */}
          {showQuotes && (
          <div className="flex flex-col min-h-[540px] border rounded-md">
            <div className="p-3 border-b flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Survey quotes to include</div>
                <div className="text-xs text-muted-foreground">Pick which LP quotes to feed into the email</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={selectAll}>Select all</Button>
                <Button size="sm" variant="outline" onClick={clearAll}>Clear</Button>
              </div>
            </div>
            <ScrollArea className="flex-1 p-3">
              {surveyQuotes.length === 0 ? (
                <div className="text-sm text-muted-foreground">No survey quotes available.</div>
              ) : (
                <div className="space-y-2">
                  {surveyQuotes.map((q) => (
                    <label key={q.id} className="flex items-start gap-2 p-2 rounded border hover:bg-muted/40 cursor-pointer">
                      <Checkbox checked={selectedIds.has(q.id)} onCheckedChange={() => toggleSelected(q.id)} />
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          <Badge variant="secondary" className="mr-2 text-[10px]">
                            {q.type}
                          </Badge>
                          Quote
                        </div>
                        <div className="text-sm whitespace-pre-wrap">{q.text}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          )}

          {/* Right: Composer and draft */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Recipients</label>
              <Input
                placeholder="comma-separated emails"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Prefilled with founders' emails when available.</p>
            </div>

            {mode === 'pass' && (
              <div>
                <label className="text-sm font-medium block mb-1">What impressed you</label>
                <Input
                  placeholder="e.g., your clarity, grit turning down acquisition offers, and strong technical depth"
                  value={appreciation}
                  onChange={(e) => setAppreciation(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">We'll open with this appreciation so the email starts warm and human.</p>
              </div>
            )}

            {mode === "invest" && (
              <div className="rounded-md border p-3">
                <div className="text-xs font-medium mb-2">Intro and closing are fixed. We'll auto-insert your check size and any valuation text.</div>
                <div className="text-xs text-muted-foreground">
                  You can still add your own bullets below; they won't change the fixed intro/closing but can inform future improvements.
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium block mb-1">Your bullets</label>
              <Textarea
                placeholder={mode === "pass" ? "• timing is not ideal\n• market is a bit crowded\n• not sure buyer urgency is there yet" : "• amazing founder-market fit\n• early traction with the right buyer\n• clear wedge using AI"}
                value={reasons}
                onChange={(e) => setReasons(e.target.value)}
                className="min-h-[140px]"
              />
            </div>

            {mode === "invest" && (
              <div className="space-y-2">
                <label className="text-sm font-medium block">How Gandhi Capital can help</label>
                <div className="grid grid-cols-1 gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={includeHelps.access} onCheckedChange={(v) => setIncludeHelps((s) => ({ ...s, access: !!v }))} />
                    access to 50 elite tech leaders for feedback and intros
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={includeHelps.earlyCustomers} onCheckedChange={(v) => setIncludeHelps((s) => ({ ...s, earlyCustomers: !!v }))} />
                    early customer introductions across our LP companies
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={includeHelps.handsOn} onCheckedChange={(v) => setIncludeHelps((s) => ({ ...s, handsOn: !!v }))} />
                    hands-on help from operators who've built and shipped at scale
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={includeHelps.community} onCheckedChange={(v) => setIncludeHelps((s) => ({ ...s, community: !!v }))} />
                    community-driven insight from our LP network (YC + top eng leaders)
                  </label>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generating}>
                <Sparkles className="h-4 w-4 mr-1" /> {generating ? "Generating..." : mode === 'invest' ? 'Assemble email (order quotes)' : 'Generate email'}
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Email draft</label>
              <Textarea
                placeholder="Email will appear here..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="min-h-[420px]"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">We'll send from Gmail as Quang Hoang</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(emailBody || ""); toast.success("Email copied"); }}>
                  Copy
                </Button>
                <Button size="sm" onClick={handleSend} disabled={sending || !emailBody.trim()}>
                  <Mail className="h-4 w-4 mr-1" /> {sending ? "Sending..." : "Send via Gmail"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
