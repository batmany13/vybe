"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DealWithVotes } from "@/shared/models";
import { Sparkles } from "lucide-react";

export type OutreachRole = 'CEO' | 'CTO';
export type OutreachState = Record<string, { role: OutreachRole; email: string; icebreaker: string; founderIndex?: number; isGenerating?: boolean }>;

export function FounderOutreachSection({
  dealsWithVotes,
  outreachState,
  setOutreachState,
  onGenerate,
  onAddLead,
}: {
  dealsWithVotes: DealWithVotes[];
  outreachState: OutreachState;
  setOutreachState: (fn: (prev: OutreachState) => OutreachState) => void;
  onGenerate: (dealId: string) => void;
  onAddLead: (dealId: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Founder Outreach</CardTitle>
        <CardDescription>Pick one contact (founder • email). Add an icebreaker, then add the lead to your Lemlist campaign.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium">Company</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Contact</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Icebreaker</th>
                <th className="text-right px-4 py-3 text-sm font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {dealsWithVotes.length > 0 ? (
                dealsWithVotes.map((deal) => {
                  const state = outreachState[deal.id] ?? { role: 'CEO' as OutreachRole, email: '', icebreaker: '' };
                  const founders = deal.founders ?? [];
                  const founderEmails = founders.filter(f => !!f.email);
                  const summary = deal.company_description_short
                    ? deal.company_description_short
                    : (deal.description
                        ? (deal.description.length > 50 ? `${deal.description.slice(0, 50)}…` : deal.description)
                        : deal.industry);

                  return (
                    <tr key={deal.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-sm">{deal.company_name}</p>
                          <p className="text-xs text-muted-foreground">{summary}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {founderEmails.length > 0 ? (
                          <Select
                            value={typeof state.founderIndex === 'number' && state.email ? `${state.founderIndex}|${state.email}` : ""}
                            onValueChange={(val) => {
                              const [idxStr, email] = val.split('|');
                              const idx = Number(idxStr);
                              setOutreachState(prev => ({
                                ...prev,
                                [deal.id]: { ...state, founderIndex: Number.isNaN(idx) ? undefined : idx, email, role: state.role || 'CEO' }
                              }));
                            }}
                          >
                            <SelectTrigger className="w-[320px]">
                              <SelectValue placeholder="Select contact (founder • email)" />
                            </SelectTrigger>
                            <SelectContent>
                              {founderEmails.map((f, idx) => (
                                <SelectItem key={idx} value={`${idx}|${f.email}`}>
                                  {f.name} — {f.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="Enter email (defaults to CEO)"
                            value={state.email}
                            onChange={(e) => setOutreachState(prev => ({...prev, [deal.id]: { ...state, email: e.target.value, role: 'CEO' }}))}
                            className="w-[320px]"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <Textarea
                            rows={2}
                            placeholder="Personal icebreaker (optional)"
                            value={state.icebreaker}
                            onChange={(e) => setOutreachState(prev => ({...prev, [deal.id]: { ...state, icebreaker: e.target.value }}))}
                            className="w-[420px]"
                          />
                          <Button variant="outline" size="sm" onClick={() => onGenerate(deal.id)} disabled={!!state.isGenerating}>
                            <Sparkles className="h-3 w-3 mr-1" />
                            {state.isGenerating ? 'Generating...' : 'Generate'}
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" onClick={() => onAddLead(deal.id)} disabled={!state?.email}>
                          Add to Lemlist
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No deals available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}