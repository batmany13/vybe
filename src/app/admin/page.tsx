'use client';

import { useState, useEffect } from 'react';
import { AdminNav, type AdminNavItem } from '@/components/admin/AdminNav';
import { OverviewSection } from '@/components/admin/sections/OverviewSection';
import { DealsSection } from '@/components/admin/sections/DealsSection';
import { LPsSection } from '@/components/admin/sections/LPsSection';

import { UpdatesSection } from '@/components/admin/sections/UpdatesSection';
import { EventsSection } from '@/components/admin/sections/EventsSection';
import { FounderOutreachSection } from '@/components/admin/sections/FounderOutreachSection';
import { QuarterlyStatsSection } from '@/components/admin/sections/QuarterlyStatsSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Lock, 
  LayoutDashboard, 
  Building2, 
  Users2, 
  FileText, 
  Mail,
  Users,
  Target,
  Calendar,
  Video,
  TrendingUp,
  Briefcase,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { generateText, addLeadToLemlistCampaign, useLemlistCampaigns } from '@/client-lib/integrations-client';
import { useLimitedPartners, useDealsWithVotesAndFounders, useMonthlyUpdates, useVotes, deleteDeal, deleteMonthlyUpdate, useDinners, updateDeal } from '@/client-lib/api-client';
import { useSelectedLP } from '@/contexts/SelectedLPContext';

import { CreateLPDialog } from '@/components/lps/CreateLPDialog';
import { EditLPDialog } from '@/components/lps/EditLPDialog';
import { CreateDealDialog } from '@/components/deals/CreateDealDialog';
import { EditDealDialog } from '@/components/deals/EditDealDialog';
import { MarkAsPassDialog } from '@/components/deals/MarkAsPassDialog';


import { EditUpdateDialog } from '@/components/monthly-updates/EditUpdateDialog';
import { LaunchCampaignDialog } from '@/components/monthly-updates/LaunchCampaignDialog';
import { DeleteUpdateDialog } from '@/components/monthly-updates/DeleteUpdateDialog';
import type { QuickStat } from '@/components/admin/sections/OverviewSection';
import type { AxiosError } from 'axios';

type Section = 'overview' | 'portfolio' | 'deals' | 'lps' | 'updates' | 'events' | 'founder-outreach' | 'meetings' | 'quarterly-stats' | 'admin-settings';

// Use environment variable or fallback to default (backwards compatibility)
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'gandhicapital2024';
const ADMIN_AUTH_COOKIE = 'vybe_admin_auth';
const ONE_DAY_SECONDS = 24 * 60 * 60;

function hasAuthCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((c) => c.trim().startsWith(`${ADMIN_AUTH_COOKIE}=1`));
}

function setAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${ADMIN_AUTH_COOKIE}=1; path=/; max-age=${ONE_DAY_SECONDS}; samesite=lax`;
}

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [showCreateLP, setShowCreateLP] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [showEditDeal, setShowEditDeal] = useState(false);

  const [showMarkAsPass, setShowMarkAsPass] = useState(false);
  const [selectedLPForEdit, setSelectedLPForEdit] = useState<any>(null);
  const [showEditLP, setShowEditLP] = useState(false);

  const [selectedUpdate, setSelectedUpdate] = useState<any>(null);


  const [showEditUpdate, setShowEditUpdate] = useState(false);
  const [showLaunchUpdate, setShowLaunchUpdate] = useState(false);
  const [showDeleteUpdate, setShowDeleteUpdate] = useState(false);
  const [outreachState, setOutreachState] = useState<any>({});

  // Admin settings state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Get selected LP context for role-based access
  const { selectedLP, isLoading: lpLoading } = useSelectedLP();

  // Fetch data for stats
  const { data: lps = [] } = useLimitedPartners();
  const { data: deals = [] } = useDealsWithVotesAndFounders();
  const { data: updates = [] } = useMonthlyUpdates();
  const { data: votes = [] } = useVotes();
  const { data: dinners = [] } = useDinners();

  // Check if already authenticated via cookie, partner access, or bypass in development
  useEffect(() => {
    // Auto-authenticate in development mode
    if (process.env.NODE_ENV === 'development') {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // Wait for LP context to load
    if (lpLoading) {
      return;
    }
    
    // Auto-authenticate for general partners and venture partners
    if (selectedLP && (selectedLP.partner_type === 'general_partner' || selectedLP.partner_type === 'venture_partner')) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }
    
    // For other users, check for auth cookie
    if (hasAuthCookie()) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [lpLoading, selectedLP]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAuthCookie();
      toast.success('Successfully authenticated');
    } else {
      toast.error('Incorrect password');
    }
    setPassword('');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    // In a real implementation, this would be sent to the server
    // For now, we'll show instructions to update the environment variable
    toast.success('Password change initiated - please update NEXT_PUBLIC_ADMIN_PASSWORD environment variable and restart the application');
    
    // Reset form
    setNewPassword('');
    setConfirmPassword('');
    setShowChangePassword(false);
  };

  const handleEditDeal = (id: string) => {
    setSelectedDealId(id);
    setShowEditDeal(true);
  };



  const handleMarkAsPass = (id: string) => {
    setSelectedDealId(id);
    setShowMarkAsPass(true);
  };

  const handleDeleteDeal = async (id: string) => {
    if (confirm('Are you sure you want to delete this deal? This action cannot be undone.')) {
      try {
        await deleteDeal(id);
        toast.success('Deal deleted successfully');
      } catch (error) {
        toast.error('Failed to delete deal');
      }
    }
  };

  const handleEditLP = (lp: any) => {
    setSelectedLPForEdit(lp);
    setShowEditLP(true);
  };



  const handleEditUpdate = (update: any) => {
    setSelectedUpdate(update);
    setShowEditUpdate(true);
  };

  const handleLaunchUpdate = (update: any) => {
    setSelectedUpdate(update);
    setShowLaunchUpdate(true);
  };

  const handleDeleteUpdate = (update: any) => {
    setSelectedUpdate(update);
    setShowDeleteUpdate(true);
  };

  const handleDeleteAllDrafts = async () => {
    const drafts = updates.filter(u => !u.lemlist_campaign_id);
    if (confirm(`Are you sure you want to delete ${drafts.length} draft updates? This action cannot be undone.`)) {
      try {
        await Promise.all(drafts.map(d => deleteMonthlyUpdate(d.id)));
        toast.success(`${drafts.length} draft updates deleted successfully`);
      } catch (error) {
        toast.error('Failed to delete draft updates');
      }
    }
  };

  const handleGenerateIcebreaker = async (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;

    setOutreachState((prev: any) => ({
      ...prev,
      [dealId]: { ...prev[dealId], isGenerating: true }
    }));

    try {
      const contextParts: string[] = [];
      if (deal.company_description_short) contextParts.push(`One-liner: ${deal.company_description_short}`);
      if (deal.description) contextParts.push(`Description: ${deal.description}`);
      if (!deal.description && deal.industry) contextParts.push(`Industry: ${deal.industry}`);
      if (deal.why_good_fit) contextParts.push(`Why fit for Gandhi Capital: ${deal.why_good_fit}`);
      if (deal.traction_progress) contextParts.push(`Traction: ${deal.traction_progress}`);
      if (typeof deal.has_revenue === 'boolean') contextParts.push(`Has revenue: ${deal.has_revenue ? 'yes' : 'no'}`);

      const prompt = `You are drafting a cold outreach icebreaker.
Company: ${deal.company_name}
Stage: ${deal.stage}
${contextParts.length ? `Context:\n- ${contextParts.join('\n- ')}` : ''}

Task: Write a single, friendly sentence (under 25 words) that clearly mentions how Gandhi Capital can help them specifically based on the context (e.g., engineering leadership, technical hiring, AI/infra expertise, dev GTM, product strategy, intros to senior CTOs). Do not include greetings, quotes, or subject lines.`;

      const icebreaker = await generateText(prompt);
      
      setOutreachState((prev: any) => ({
        ...prev,
        [dealId]: { ...prev[dealId], icebreaker, isGenerating: false }
      }));
    } catch (error) {
      toast.error('Failed to generate icebreaker');
      setOutreachState((prev: any) => ({
        ...prev,
        [dealId]: { ...prev[dealId], isGenerating: false }
      }));
    }
  };

  const { data: lemlistCampaigns = [] } = useLemlistCampaigns();

  const handleAddToLemlist = async (dealId: string) => {
    const state = outreachState[dealId];
    const deal = deals.find(d => d.id === dealId);
    
    if (!state?.email || !deal) {
      toast.error('Please select a contact first');
      return;
    }

    // Use the explicitly provided Lemlist campaign ID
    const CAMPAIGN_ID = 'cam_7n68mt3G7RrZMw7nv';
    const found = lemlistCampaigns.find(c => c.id === CAMPAIGN_ID);
    const campaign = found ?? ({ id: CAMPAIGN_ID, name: 'Selected campaign' } as any);
    if (found && found.status === 'ended') {
      toast.warning(`Selected campaign "${found.name}" is ended. Trying to add anyway may fail.`);
    }

    const founderName = deal.founders?.[state.founderIndex]?.name || state.role || 'Founder';
    const [firstName, ...lastNameParts] = founderName.split(' ');
    const lastName = lastNameParts.join(' ');
    
    try {
      await addLeadToLemlistCampaign({
        campaignId: campaign.id,
        email: state.email,
        firstName: firstName || '',
        lastName: lastName || '',
        companyName: deal.company_name,
        icebreaker: state.icebreaker || ''
      });

      // Mark deal as Sourcing Reached Out
      await updateDeal(deal.id, { stage: 'sourcing_reached_out' });
      
      toast.success(`Lead added to campaign "${campaign.name}" successfully`);
    } catch (error) {
      const err = error as AxiosError<any>;
      const status = err?.response?.status;
      const message: string = (err?.response?.data && (err.response.data.error || err.response.data.message)) || err?.message || 'Unknown error';
      // Treat duplicate lead errors as success
      if (status === 409 || /exist/i.test(message)) {
        toast.info(`Lead already exists in campaign "${campaign.name}"`);
        // Consider outreach complete in this case
        await updateDeal(deal.id, { stage: 'sourcing_reached_out' });
        return;
      }
      if (status === 424) {
        toast.error('Failed to add lead: campaign dependency failed (campaign may be paused/ended or missing a sender/setup in Lemlist).');
        return;
      }
      toast.error(`Failed to add lead to Lemlist${message ? `: ${message}` : ''}`);
    }
  };

  if (isLoading || lpLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              {selectedLP && selectedLP.partner_type === 'limited_partner' 
                ? 'Limited Partners require a password to access admin features'
                : 'Please enter the admin password to continue'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full">
                Authenticate
              </Button>
              <p className="text-xs text-muted-foreground text-center">Will remember access for today on this device</p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Define navigation items
  const navItems: AdminNavItem<Section>[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'Dashboard overview'
    },
    {
      id: 'portfolio',
      label: 'Portfolio Companies',
      icon: Briefcase,
      description: 'View portfolio',
      badge: deals.filter(d => d.stage === 'signed' || d.stage === 'signed_and_wired').length
    },
    {
      id: 'deals',
      label: 'Deals Pipeline',
      icon: Building2,
      description: 'Manage all deals',
      badge: deals.filter(d => d.status === 'active').length
    },
    {
      id: 'lps',
      label: 'Fund Partners',
      icon: Users2,
      description: 'Manage fund partners',
      badge: lps.filter(lp => lp.status === 'active').length
    },
    {
      id: 'updates',
      label: 'Monthly Updates',
      icon: FileText,
      description: 'Investor updates',
      badge: updates.filter(u => !u.lemlist_campaign_id).length
    },

    {
      id: 'events',
      label: 'Events',
      icon: Calendar,
      description: 'Manage events (dinners)'
    },
    {
      id: 'founder-outreach',
      label: 'Founder Outreach',
      icon: Mail,
      description: 'Email campaigns',
      isNew: true
    },

    {
      id: 'meetings',
      label: 'Founder Meetings',
      icon: Video,
      description: 'Upcoming meetings',
      badge: deals.filter(d => d.stage === 'sourcing_meeting_booked').length
    },
    {
      id: 'quarterly-stats',
      label: 'Quarterly Stats',
      icon: TrendingUp,
      description: 'Investment performance',
      isNew: true
    },
    {
      id: 'admin-settings',
      label: 'Admin Settings',
      icon: Settings,
      description: 'Security & configuration'
    }
  ];

  // Calculate quick stats
  const quickStats: QuickStat[] = [
    {
      label: 'Active Fund Partners',
      value: lps.filter(lp => lp.status === 'active').length,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      subLabel: `${lps.length} total`
    },
    {
      label: 'Active Deals',
      value: deals.filter(d => d.status === 'active').length,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      subLabel: `${deals.length} total`
    },
    {
      label: 'Monthly Updates',
      value: updates.length,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      subLabel: 'Published'
    }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <OverviewSection 
            quickStats={quickStats}
            onCreateUpdate={() => { window.location.href = '/admin/monthly-updates/create'; }}
            onCreateDeal={() => setShowCreateDeal(true)}
          />
        );
      case 'portfolio':
        // Redirect to portfolio companies page
        window.location.href = '/admin/portfolio-companies';
        return null;
      case 'deals':
        return (
          <DealsSection 
            deals={deals}
            lps={lps}
            onCreateDeal={() => setShowCreateDeal(true)}
            onEditDeal={handleEditDeal}
            onDeleteDeal={handleDeleteDeal}
            onMarkAsPass={handleMarkAsPass}
          />
        );
      case 'lps':
        return (
          <LPsSection 
            lps={lps}
            votes={votes}
            dinners={dinners}
            onCreateLP={() => setShowCreateLP(true)}
            onEditLP={handleEditLP}
          />
        );
      case 'updates':
        return (
          <UpdatesSection 
            updates={updates}


            onEditUpdate={handleEditUpdate}
            onLaunchUpdate={handleLaunchUpdate}
            onDeleteUpdate={handleDeleteUpdate}
            onDeleteAllDrafts={handleDeleteAllDrafts}
          />
        );

      case 'events':
        return (
          <EventsSection />
        );
      case 'founder-outreach':
        return (
          <FounderOutreachSection 
            dealsWithVotes={deals.filter(d => d.stage === 'sourcing')}
            outreachState={outreachState}
            setOutreachState={setOutreachState}
            onGenerate={handleGenerateIcebreaker}
            onAddLead={handleAddToLemlist}
          />
        );

      case 'meetings':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Founder Meetings</h1>
                <p className="text-muted-foreground mt-1">View upcoming meetings with founders</p>
              </div>
            </div>
            <iframe 
              src="/admin/meetings" 
              className="w-full h-[calc(100vh-12rem)] border rounded-lg"
              title="Founder Meetings"
            />
          </div>
        );
      case 'quarterly-stats':
        return <QuarterlyStatsSection />;
      case 'admin-settings':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Admin Settings</h1>
                <p className="text-muted-foreground mt-1">Security and configuration settings</p>
              </div>
            </div>
            
            <div className="grid gap-6 max-w-2xl">
              {/* Access Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Access Level</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>User Role:</span>
                    <span className="font-medium">
                      {selectedLP?.partner_type === 'general_partner' && 'General Partner (GP)'}
                      {selectedLP?.partner_type === 'venture_partner' && 'Venture Partner (VP)'}
                      {selectedLP?.partner_type === 'limited_partner' && 'Limited Partner (LP)'}
                      {!selectedLP && 'Guest User'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Admin Access:</span>
                    <span className="font-medium">
                      {selectedLP?.partner_type === 'general_partner' || selectedLP?.partner_type === 'venture_partner' 
                        ? 'Automatic (no password required)' 
                        : 'Password protected'
                      }
                    </span>
                  </div>
                  {selectedLP && (
                    <div className="flex justify-between">
                      <span>Associated LP:</span>
                      <span className="font-medium">{selectedLP.name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Password Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Password Management
                  </CardTitle>
                  <CardDescription>
                    Manage admin panel password security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showChangePassword ? (
                    <Button onClick={() => setShowChangePassword(true)}>
                      Change Admin Password
                    </Button>
                  ) : (
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">New Password</label>
                        <Input
                          type="password"
                          placeholder="Enter new password (min 8 characters)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={8}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Confirm New Password</label>
                        <Input
                          type="password"
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={8}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">Update Password</Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setShowChangePassword(false);
                            setNewPassword('');
                            setConfirmPassword('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Note: You'll need to update the NEXT_PUBLIC_ADMIN_PASSWORD environment variable and restart the application.
                      </p>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Current Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Environment:</span>
                    <span className="font-medium">{process.env.NODE_ENV}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auth Method:</span>
                    <span className="font-medium">Role-based + Cookie (24h)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Password Source:</span>
                    <span className="font-medium">
                      {process.env.NEXT_PUBLIC_ADMIN_PASSWORD ? 'Environment Variable' : 'Default'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>Access Control Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>General Partners (GP)</strong> and <strong>Venture Partners (VP)</strong>:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                    <li>Automatic admin access without password</li>
                    <li>Full access to all admin features</li>
                    <li>Identified via email match with LP records</li>
                  </ul>
                  <p className="mt-3"><strong>Limited Partners (LP)</strong> and <strong>Other Users</strong>:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                    <li>Require admin password for access</li>
                    <li>Password authentication is remembered for 24 hours</li>
                  </ul>
                  <p className="text-muted-foreground mt-3">
                    To update the admin password, modify the <code className="bg-muted px-1 rounded">NEXT_PUBLIC_ADMIN_PASSWORD</code> environment variable and restart the application.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      default:
        return (
          <OverviewSection 
            quickStats={quickStats}
            onCreateUpdate={() => { window.location.href = '/admin/monthly-updates/create'; }}
            onCreateDeal={() => setShowCreateDeal(true)}
          />
        );
    }
  };

  return (
    <>
      <div className="flex h-[calc(100vh-3rem)]">
        <AdminNav items={navItems} active={activeSection} onChange={(id) => setActiveSection(id as Section)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              {renderSection()}
            </div>
          </div>
        </main>
      </div>

      {/* Create/Edit Dialogs */}

      {showCreateDeal && (
        <CreateDealDialog
          open={showCreateDeal}
          onOpenChange={setShowCreateDeal}
          onCreated={(id) => {
            setSelectedDealId(id);
            setShowEditDeal(true);
          }}
        />
      )}
      {showCreateLP && (
        <CreateLPDialog
          open={showCreateLP}
          onOpenChange={setShowCreateLP}
        />
      )}

      {showEditDeal && selectedDealId && (() => {
        const selectedDeal = deals.find(d => d.id === selectedDealId);
        return selectedDeal ? (
          <EditDealDialog
            deal={selectedDeal}
            open={showEditDeal}
            onOpenChange={(open) => {
              setShowEditDeal(open);
              if (!open) setSelectedDealId(null);
            }}
          />
        ) : null;
      })()}

      {showMarkAsPass && selectedDealId && (() => {
        const selectedDeal = deals.find(d => d.id === selectedDealId);
        return selectedDeal ? (
          <MarkAsPassDialog
            deal={selectedDeal}
            open={showMarkAsPass}
            onOpenChange={(open) => {
              setShowMarkAsPass(open);
              if (!open) setSelectedDealId(null);
            }}
          />
        ) : null;
      })()}
      {showEditLP && selectedLPForEdit && (
        <EditLPDialog
          lp={selectedLPForEdit}
          open={showEditLP}
          onOpenChange={(open) => {
            setShowEditLP(open);
            if (!open) setSelectedLPForEdit(null);
          }}
        />
      )}
      {showEditUpdate && selectedUpdate && (
        <EditUpdateDialog
          update={selectedUpdate}
          open={showEditUpdate}
          onOpenChange={(open) => {
            setShowEditUpdate(open);
            if (!open) setSelectedUpdate(null);
          }}
        />
      )}
      {showLaunchUpdate && selectedUpdate && (
        <LaunchCampaignDialog
          update={selectedUpdate}
          open={showLaunchUpdate}
          onOpenChange={(open) => {
            setShowLaunchUpdate(open);
            if (!open) setSelectedUpdate(null);
          }}
        />
      )}
      {showDeleteUpdate && selectedUpdate && (
        <DeleteUpdateDialog
          update={selectedUpdate}
          open={showDeleteUpdate}
          onOpenChange={(open) => {
            setShowDeleteUpdate(open);
            if (!open) setSelectedUpdate(null);
          }}
        />
      )}
    </>
  );
}