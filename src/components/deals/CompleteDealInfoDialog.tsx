"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Deal, DealWithVotes } from "@/shared/models";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateDeal } from "@/client-lib/api-client";

interface CompleteDealInfoDialogProps {
  deal: DealWithVotes | Deal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FieldType = 'text' | 'number' | 'url' | 'textarea' | 'select' | 'checkbox' | 'tags';
interface MissingFieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
}

function isEmpty(val: unknown) {
  if (val === null || val === undefined) return true;
  if (typeof val === "string") return val.trim() === "";
  if (Array.isArray(val)) return val.length === 0;
  return false;
}

export function CompleteDealInfoDialog({ deal, open, onOpenChange }: CompleteDealInfoDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("company");

  type PartialState = Record<string, any>;
  const [state, setState] = useState<PartialState>({});
  const founders = (deal as any).founders as any[] | undefined;

  const missingFields = useMemo<MissingFieldDef[]>(() => {
    const fields: MissingFieldDef[] = [];

    const addIfMissing = (
      key: string,
      label: string,
      type: FieldType,
      options?: string[]
    ) => {
      const value = (deal as any)[key as keyof Deal];
      if (isEmpty(value)) {
        fields.push({ key, label, type, options });
      }
    };

    // Company
    addIfMissing('company_url', 'Company URL', 'url');
    addIfMissing('company_description_short', 'Short Company Description (<= 50 chars)', 'text');

    // Founders section (locations)
    addIfMissing('founders_location', 'Founders Location', 'text');
    addIfMissing('company_base_location', 'Company Base Location (post-funding)', 'text');

    // Product
    addIfMissing('demo_url', 'Demo URL', 'url');

    // Traction
    addIfMissing('working_duration', 'Working Duration (Please specify part-time vs full-time)', 'textarea');
    if ((deal as Deal).has_revenue && isEmpty((deal as Deal).revenue_amount)) {
      fields.push({ key: 'revenue_amount', label: 'Revenue Amount ($)', type: 'number' });
    }
    addIfMissing('user_traction', 'User Traction', 'textarea');

    // Round
    addIfMissing('raising_amount', 'Raising Amount ($)', 'number');
    addIfMissing('safe_or_equity', 'SAFE or Equity', 'select', ['SAFE', 'Equity', 'Convertible Note']);
    addIfMissing('confirmed_amount', 'Confirmed Amount ($)', 'number');
    addIfMissing('lead_investor', 'Lead Investor', 'text');
    if (isEmpty((deal as Deal).co_investors)) {
      fields.push({ key: 'co_investors', label: 'Co-Investors (comma-separated)', type: 'text' });
    }

    // Other
    addIfMissing('industry', 'Industry', 'text');
    addIfMissing('funding_round', 'Funding Round', 'text');
    addIfMissing('stage', 'Stage', 'select', [
      'sourcing','sourcing_reached_out','sourcing_meeting_booked','sourcing_meeting_done_deciding','partner_review','offer','signed','signed_and_wired','closed_lost_passed','closed_lost_rejected'
    ]);
    addIfMissing('deal_size', 'Deal Size ($)', 'number');
    addIfMissing('valuation', 'Valuation ($)', 'number');
    addIfMissing('pitch_deck_url', 'Pitch Deck URL', 'url');
    addIfMissing('website_url', 'Website URL', 'url');
    addIfMissing('description', 'Description', 'textarea');

    // Founders block: minimal founder fields if no founders or all founders missing names
    const hasFounders = !!founders && founders.length > 0 && founders.some((f) => !isEmpty(f.name));
    if (!hasFounders) {
      fields.push({ key: 'founder_name', label: 'Founder Name', type: 'text' });
      fields.push({ key: 'founder_email', label: 'Founder Email', type: 'text' });
      fields.push({ key: 'founder_linkedin_url', label: 'Founder LinkedIn URL', type: 'url' });
      fields.push({ key: 'founder_bio', label: 'Founder Bio', type: 'textarea' });
    }

    return fields;
  }, [deal, founders]);

  // Group fields into sections similar to Edit/Add
  const sectionMap: Record<string, { label: string; description: string; keys: string[] }>
    = useMemo(() => ({
      company: {
        label: 'Company',
        description: 'Basic company information',
        keys: [
          'company_url', 'company_description_short', 'website_url',
          'industry', 'funding_round', 'stage', 'deal_size', 'valuation',
          'pitch_deck_url', 'description',
        ],
      },
      founders: {
        label: 'Founders',
        description: 'Founding team and locations',
        keys: [
          'founders_location', 'company_base_location',
          'founder_name', 'founder_email', 'founder_linkedin_url', 'founder_bio',
        ],
      },
      product: {
        label: 'Product',
        description: 'Product and demo',
        keys: ['demo_url'],
      },
      traction: {
        label: 'Traction',
        description: 'Progress and traction details',
        keys: ['working_duration', 'revenue_amount', 'user_traction'],
      },
      round: {
        label: 'Round',
        description: 'Fundraising details',
        keys: ['raising_amount', 'safe_or_equity', 'confirmed_amount', 'lead_investor', 'co_investors'],
      },
    }), []);

  const sections = useMemo(() => {
    const byKey = new Map(missingFields.map(f => [f.key, f] as const));
    const order = ['company', 'founders', 'product', 'traction', 'round'] as const;

    return order
      .map((id) => {
        const def = sectionMap[id];
        const fields = def.keys
          .map(k => byKey.get(k))
          .filter((f): f is MissingFieldDef => !!f);
        return { id, ...def, fields };
      })
      .filter(s => s.fields.length > 0);
  }, [missingFields, sectionMap]);

  useEffect(() => {
    if (open) {
      setState({});
      // Set the first available section as active
      setActiveTab(sections[0]?.id ?? 'company');
    }
  }, [open, sections]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {};

      for (const field of missingFields) {
        const v = state[field.key];
        if (v !== undefined && v !== null && (typeof v !== 'string' || v.trim() !== '')) {
          if (field.type === 'number') {
            const num = parseFloat(v as string);
            if (!Number.isNaN(num)) payload[field.key] = num;
          } else if (field.key === 'co_investors') {
            const arr = String(v)
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
            if (arr.length > 0) payload.co_investors = arr;
          } else if (field.type === 'select' || field.type === 'text' || field.type === 'url' || field.type === 'textarea') {
            payload[field.key] = v;
          }
        }
      }

      // Founders block aggregation
      if (state.founder_name || state.founder_email || state.founder_linkedin_url || state.founder_bio) {
        payload.founders = [
          {
            name: (state.founder_name as string) || '',
            email: (state.founder_email as string) || undefined,
            linkedin_url: (state.founder_linkedin_url as string) || undefined,
            bio: (state.founder_bio as string) || undefined,
          },
        ];
      }

      if (Object.keys(payload).length === 0) {
        toast.info('No changes to save');
        onOpenChange(false);
        setIsSubmitting(false);
        return;
      }

      await updateDeal(deal.id, payload);
      toast.success('Deal information completed');
      onOpenChange(false);
    } catch (err) {
      toast.error('Failed to update deal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Missing Info — {deal.company_name}</DialogTitle>
        </DialogHeader>

        {missingFields.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>All set</CardTitle>
              <CardDescription>This deal has no missing fields we track.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {sections.length > 1 ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full flex flex-wrap gap-2 overflow-x-auto">
                  {sections.map((s) => (
                    <TabsTrigger key={s.id} value={s.id} className="shrink-0 whitespace-nowrap">{s.label}</TabsTrigger>
                  ))}
                </TabsList>

                {sections.map((s) => (
                  <TabsContent key={s.id} value={s.id} className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>{s.label}</CardTitle>
                        <CardDescription>{s.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {s.fields.map((f) => (
                          <div key={f.key} className="space-y-2">
                            <Label htmlFor={f.key}>{f.label}</Label>
                            {f.type === 'text' && (
                              <Input id={f.key} value={state[f.key] ?? ''} onChange={(e) => setState({ ...state, [f.key]: e.target.value })} />
                            )}
                            {f.type === 'number' && (
                              <Input id={f.key} type="number" value={state[f.key] ?? ''} onChange={(e) => setState({ ...state, [f.key]: e.target.value })} />
                            )}
                            {f.type === 'url' && (
                              <Input id={f.key} type="url" value={state[f.key] ?? ''} onChange={(e) => setState({ ...state, [f.key]: e.target.value })} />
                            )}
                            {f.type === 'textarea' && (
                              <Textarea id={f.key} value={state[f.key] ?? ''} onChange={(e) => setState({ ...state, [f.key]: e.target.value })} rows={3} />
                            )}
                            {f.type === 'select' && (
                              <Select value={(state[f.key] as string) ?? ''} onValueChange={(val) => setState({ ...state, [f.key]: val })}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(f.options ?? []).map((opt) => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              // Single section fallback
              sections.map((s) => (
                <Card key={s.id}>
                  <CardHeader>
                    <CardTitle>{s.label}</CardTitle>
                    <CardDescription>{s.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {s.fields.map((f) => (
                      <div key={f.key} className="space-y-2">
                        <Label htmlFor={f.key}>{f.label}</Label>
                        {f.type === 'text' && (
                          <Input id={f.key} value={state[f.key] ?? ''} onChange={(e) => setState({ ...state, [f.key]: e.target.value })} />
                        )}
                        {f.type === 'number' && (
                          <Input id={f.key} type="number" value={state[f.key] ?? ''} onChange={(e) => setState({ ...state, [f.key]: e.target.value })} />
                        )}
                        {f.type === 'url' && (
                          <Input id={f.key} type="url" value={state[f.key] ?? ''} onChange={(e) => setState({ ...state, [f.key]: e.target.value })} />
                        )}
                        {f.type === 'textarea' && (
                          <Textarea id={f.key} value={state[f.key] ?? ''} onChange={(e) => setState({ ...state, [f.key]: e.target.value })} rows={3} />
                        )}
                        {f.type === 'select' && (
                          <Select value={(state[f.key] as string) ?? ''} onValueChange={(val) => setState({ ...state, [f.key]: val })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {(f.options ?? []).map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}