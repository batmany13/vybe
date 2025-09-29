"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DealWithVotes, LimitedPartner } from "@/shared/models";
import { Mail, Users, Calendar, Info, ExternalLink, Send, User, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { sendGmailEmail } from "@/client-lib/integrations-client";
import { updateDeal } from "@/client-lib/api-client";

function formatDate(iso?: string) {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function LPDealEvaluationEmailSection({
  deals,
  lps,
}: {
  deals: DealWithVotes[];
  lps: LimitedPartner[];
}) {
  const underReviewDeals = useMemo(
    () => deals.filter((d) => d.stage === "partner_review" && d.status === "active"),
    [deals]
  );

  const activeLpEmails = useMemo(
    () => lps.filter((lp) => lp.status === "active" && !!lp.email).map((lp) => lp.email),
    [lps]
  );

  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);
  const selectedDeals = useMemo(() => {
    // Preserve the explicit order chosen by the user (selectedDealIds)
    const map = new Map(underReviewDeals.map((d) => [d.id, d] as const));
    return selectedDealIds.map((id) => map.get(id)).filter((d): d is DealWithVotes => !!d);
  }, [underReviewDeals, selectedDealIds]);

  const [subject, setSubject] = useState<string>("CTO LPs' review: upcoming deals");
  const [intro, setIntro] = useState<string>("");
  const [userEditedSubject, setUserEditedSubject] = useState<boolean>(false);
  const [isSending, setIsSending] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Fixed human sender
  const senderName = 'Quang Hoang';
  const senderEmail = 'quang@vybe.build';
  const fromHeader = `${senderName} <${senderEmail}>`;

  // Base URL for deal links
  const baseUrl = 'https://gandhi-capital-tracker.vybe.build';

  // Auto-generate subject with number of deals and earliest deadline unless user edited it
  useEffect(() => {
    if (userEditedSubject) return;

    const count = selectedDeals.length;
    if (count === 0) {
      setSubject("CTO LPs' review: upcoming deals");
      return;
    }

    // Find earliest survey deadline among selected deals
    const timestamps: number[] = selectedDeals
      .map((d) => d.survey_deadline)
      .filter((x): x is string => !!x)
      .map((iso) => new Date(iso).getTime())
      .filter((t) => !isNaN(t));

    let subjectText = `CTO LPs' review: ${count} ${count === 1 ? "deal" : "deals"}`;
    if (timestamps.length > 0) {
      const earliest = new Date(Math.min(...timestamps));
      const dateLabel = earliest.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      subjectText += ` (due ${dateLabel})`;
    }

    setSubject(subjectText);
  }, [selectedDeals, userEditedSubject]);

  const allSelected = selectedDealIds.length === underReviewDeals.length && underReviewDeals.length > 0;
  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedDealIds(underReviewDeals.map((d) => d.id));
    else setSelectedDealIds([]);
  };

  const toggleDeal = (id: string, checked: boolean) => {
    setSelectedDealIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const moveUp = (id: string) => {
    setSelectedDealIds((prev) => {
      const idx = prev.indexOf(id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (id: string) => {
    setSelectedDealIds((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  // Build Gmail-friendly HTML body with bullets and sub-bullets
  const htmlBody = useMemo(() => {
    const baseStyles = "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#111827; line-height:1.6";
    const linkStyle = "color:#2563eb; text-decoration: underline;";
    const wrap = (inner: string) => `<div style=\"${baseStyles}\">${inner}</div>`;

    if (selectedDeals.length === 0) {
      const innerParts: string[] = [];
      const greeting = intro.trim() ? `Hi all - ${intro.trim()}` : 'Hi all';
      innerParts.push(`<p>${greeting}</p>`);
      innerParts.push(`<p>would love your help reviewing the latest deals:</p>`);
      innerParts.push(`<p><a href=\"${baseUrl}\" target=\"_blank\" rel=\"noreferrer\" style=\"${linkStyle}\">Take the survey in Gandhi Capital Tracker</a></p>`);
      innerParts.push(`<p>New to Gandhi Capital Tracker? Accept the invite from quang@batch.ventures, then sign in.</p>`);
      innerParts.push(`<p>10 mins per deal. Thanks!</p>`);
      innerParts.push(`<p>— Quang Hoang | Cofounder & CEO @ <a href=\"https://www.vybe.build/\" target=\"_blank\" rel=\"noreferrer\" style=\"${linkStyle}\">Vybe</a> | Cofounder & GP @ CTO Fund</p>`);
      return wrap(innerParts.join(""));
    }

    const items = selectedDeals.map((deal) => {
      const foundersList = (deal.founders ?? [])
        .map((f) => {
          const name = (f?.name ?? '').trim();
          if (!name) return undefined;
          const url = (f?.linkedin_url ?? '').trim();
          return url ? `<a href=\"${url}\" target=\"_blank\" rel=\"noreferrer\" style=\"${linkStyle}\">${name}</a>` : name;
        })
        .filter((x): x is string => !!x)
        .join(", ");
      const deadline = formatDate(deal.survey_deadline);
      const deadlineLabel = deadline ? ` (Deadline: ${deadline} EOD)` : "";
      const what = (deal.company_description_short || deal.description || '').trim();
      const oneLiner = what ? (what.length > 140 ? what.slice(0, 140) + '…' : what) : '';
      const dealLink = `${baseUrl}/deals/${deal.id}`;
      const opinion = (deal.excitement_note ?? "").trim();

      const subItems: string[] = [];
      if (foundersList) subItems.push(`<li style=\"margin: 4px 0;\">Founders: ${foundersList}</li>`);
      if (opinion) subItems.push(`<li style=\"margin: 4px 0;\">Opinion: ${opinion}</li>`);
      subItems.push(`<li style=\"margin: 4px 0;\"><a href=\"${dealLink}\" target=\"_blank\" rel=\"noreferrer\" style=\"${linkStyle}\">Take the survey in Gandhi Capital Tracker</a>${deadlineLabel}</li>`);

      return `
        <li style=\"margin: 10px 0;\">\n          <div><strong>${deal.company_name}</strong>${oneLiner ? ` — ${oneLiner}` : ''}</div>\n          <ul style=\"margin: 6px 0 0 18px; padding: 0; list-style: circle;\">\n            ${subItems.join('')}\n          </ul>\n        </li>\n      `;
    }).join("");

    const greeting = intro.trim() ? `Hi all - ${intro.trim()}` : 'Hi all';
    const inner = `
      <p>${greeting}</p>
      <p>would love your help reviewing ${selectedDeals.length} deal${selectedDeals.length === 1 ? '' : 's'}:</p>
      <ul style=\"margin: 0 0 16px 20px; padding: 0; list-style: disc;\">
        ${items}
      </ul>
      <p>New to Gandhi Capital Tracker? Accept the invite from quang@batch.ventures, then sign in at <a href=\"${baseUrl}\" target=\"_blank\" rel=\"noreferrer\" style=\"${linkStyle}\">Gandhi Capital Tracker</a>.</p>
      <p>10 mins per deal. Thank you!</p>
      <p>— Quang Hoang | Cofounder & CEO @ <a href=\"https://www.vybe.build/\" target=\"_blank\" rel=\"noreferrer\" style=\"${linkStyle}\">Vybe</a> | Cofounder & GP @ CTO Fund</p>
    `;

    return wrap(inner);
  }, [selectedDeals, intro]);

  const handleSendViaGmail = async () => {
    setIsSending(true);
    try {
      await sendGmailEmail(fromHeader, "cto-fund-lps@googlegroups.com", subject, htmlBody);
      // After successful send, record partner_review_started_at for selected deals if not already set
      const nowIso = new Date().toISOString();
      const toUpdate = selectedDeals.filter(d => !d.partner_review_started_at);
      for (const d of toUpdate) {
        try {
          await updateDeal(d.id, { partner_review_started_at: nowIso });
        } catch (e) {
          console.error('Failed to record partner_review_started_at for deal', d.id, e);
        }
      }
      toast.success("LP evaluation email sent via Gmail as Quang Hoang");
    } catch (e) {
      toast.error("Failed to send via Gmail");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendTestViaGmail = async () => {
    setIsSendingTest(true);
    try {
      await sendGmailEmail(fromHeader, "quang@vybe.build", subject + " (test)", htmlBody);
      toast.success("Test email sent to quang@vybe.build");
    } catch (e) {
      toast.error("Failed to send test email");
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">LP Deal Evaluation Email</h2>
        <p className="text-muted-foreground">Select deals under review and draft a single email to all LPs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deals Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Select Under Review Deals</CardTitle>
            <CardDescription>Only deals in the "Under Review" stage (LP Survey) are listed.</CardDescription>
          </CardHeader>
          <CardContent>
            {underReviewDeals.length === 0 ? (
              <div className="text-sm text-muted-foreground">No deals currently under review.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox id="select-all" checked={allSelected} onCheckedChange={(v) => toggleSelectAll(!!v)} />
                  <label htmlFor="select-all" className="text-sm select-none">
                    Select all ({underReviewDeals.length})
                  </label>
                </div>
                <Separator />
                <ScrollArea className="max-h-80 pr-3">
                  <div className="space-y-3">
                    {underReviewDeals.map((deal) => {
                      const checked = selectedDealIds.includes(deal.id);
                      const founders = (deal.founders ?? []).map((f) => f.name).filter(Boolean).join(", ");
                      const dealLink = `${baseUrl}/deals/${deal.id}`;
                      return (
                        <div key={deal.id} className="flex items-start gap-3">
                          <Checkbox id={`deal-${deal.id}`} checked={checked} onCheckedChange={(v) => toggleDeal(deal.id, !!v)} />
                          <div className="flex-1">
                            <label htmlFor={`deal-${deal.id}`} className="font-medium cursor-pointer">
                              {deal.company_name}
                            </label>
                            <div className="text-sm text-muted-foreground mt-0.5">
                              {(deal.company_description_short ?? deal.description ?? "").slice(0, 140)}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {founders && <Badge variant="outline">Founders: {founders}</Badge>}
                              {deal.survey_deadline && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  Deadline: {formatDate(deal.survey_deadline)}
                                </Badge>
                              )}
                              <Link href={dealLink} target="_blank" className="text-xs inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                                <ExternalLink className="h-3.5 w-3.5" /> Open in Vybe
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {selectedDeals.length > 0 && (
                  <div className="space-y-2">
                    <Separator />
                    <div className="text-sm font-medium">Selected order</div>
                    <div className="space-y-2">
                      {selectedDeals.map((d, idx) => (
                        <div key={d.id} className="flex items-center justify-between rounded-md border p-2">
                          <div className="text-sm truncate pr-2">{idx + 1}. {d.company_name}</div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="outline" onClick={() => moveUp(d.id)} disabled={idx === 0}>
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => moveDown(d.id)} disabled={idx === selectedDeals.length - 1}>
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">This order will be used in the email preview and when sending.</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recipients */}
        <Card>
          <CardHeader>
            <CardTitle>Recipients</CardTitle>
            <CardDescription>Sent via Gmail to our LP Google Group.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>cto-fund-lps@googlegroups.com</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5" /> This sends one HTML email from Gmail with a friendly From name.
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5" /> From: {fromHeader}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Composer */}
      <Card>
        <CardHeader>
          <CardTitle>Compose Email</CardTitle>
          <CardDescription>Subject and intro. The email content is generated below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Subject</label>
            <Input
              className="mt-1"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setUserEditedSubject(true);
              }}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Intro</label>
            <Textarea
              className="mt-1 min-h-[80px]"
              placeholder="Optional intro (will appear under the greeting)"
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
            />
          </div>
          <Separator />
          <div>
            <label className="text-sm font-medium">Gmail HTML preview</label>
            <div className="mt-2 border rounded-md p-4 bg-white dark:bg-gray-950">
              <div dangerouslySetInnerHTML={{ __html: htmlBody }} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button size="sm" variant="outline" onClick={handleSendTestViaGmail} disabled={isSendingTest || !subject.trim()}>
              <Mail className="h-4 w-4 mr-1" /> {isSendingTest ? "Sending test..." : "Send test to quang@vybe.build"}
            </Button>
            <Button size="sm" onClick={handleSendViaGmail} disabled={isSending || !subject.trim()}>
              <Send className="h-4 w-4 mr-1" /> {isSending ? "Sending..." : "Send via Gmail"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer note */}
      <div className="text-xs text-muted-foreground">
        When sending via Gmail integration, the email is HTML-formatted and sent to cto-fund-lps@googlegroups.com from {fromHeader}.
      </div>
    </div>
  );
}
