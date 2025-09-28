'use client';

import { useState, useEffect } from 'react';
import { AdminNav, type AdminNavItem } from '@/components/admin/AdminNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  LayoutDashboard, 
  Building2, 
  Users2, 
  FileText, 
  MessageSquare, 
  Mail,
  Calendar,
  Video,
  TrendingUp,
  DollarSign,
  CalendarDays,
  Globe,
  Search,
  Download,
  ExternalLink,
  BarChart3,
  Users,
  MailCheck,
  Briefcase,
  Lock,
  FileSignature,
  CheckCircle2,
  Clock,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { useDealsWithVotesAndFounders, useLimitedPartners, useMonthlyUpdates, useVotes } from '@/client-lib/api-client';
import { formatDistanceToNow, format } from 'date-fns';

type Section = 'overview' | 'portfolio' | 'deals' | 'lps' | 'updates' | 'surveys' | 'events' | 'founder-outreach' | 'lp-deal-email' | 'meetings' | 'quarterly-stats' | 'admin-settings';

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

export default function PortfolioCompaniesPage() {
  const [activeSection] = useState<Section>('portfolio');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'signed-and-wired' | 'signed-only' | 'has-revenue' | 'no-revenue'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'deal-size' | 'status'>('date');

  // Fetch data
  const { data: deals = [] } = useDealsWithVotesAndFounders();
  const { data: lps = [] } = useLimitedPartners();
  const { data: updates = [] } = useMonthlyUpdates();
  const { data: votes = [] } = useVotes();

  // Filter for portfolio companies (signed and signed_and_wired stages)
  const portfolioCompanies = deals.filter(d => d.stage === 'signed' || d.stage === 'signed_and_wired');

  // Check if already authenticated via cookie or bypass in development
  useEffect(() => {
    // Auto-authenticate in development mode
    if (process.env.NODE_ENV === 'development') {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }
    
    // In production, check for auth cookie
    if (hasAuthCookie()) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

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

  if (isLoading) {
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
              Please enter the admin password to continue
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
      badge: portfolioCompanies.length,
      isHighlight: true
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
      id: 'surveys',
      label: 'LP Surveys',
      icon: MessageSquare,
      description: 'Survey responses',
      badge: votes.length
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
      id: 'lp-deal-email',
      label: 'LP Deal Evaluation',
      icon: MailCheck,
      description: 'Compose BCC email to LPs',
      badge: deals.filter(d => d.stage === 'partner_review').length,
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

  // Apply filters and sorting
  let filteredCompanies = [...portfolioCompanies];

  // Filter by search query
  if (searchQuery) {
    filteredCompanies = filteredCompanies.filter(company => 
      company.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.founders?.some(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }

  // Filter by status or revenue
  switch (filterBy) {
    case 'signed-and-wired':
      filteredCompanies = filteredCompanies.filter(c => c.stage === 'signed_and_wired');
      break;
    case 'signed-only':
      filteredCompanies = filteredCompanies.filter(c => c.stage === 'signed');
      break;
    case 'has-revenue':
      filteredCompanies = filteredCompanies.filter(c => c.has_revenue === true);
      break;
    case 'no-revenue':
      filteredCompanies = filteredCompanies.filter(c => c.has_revenue === false);
      break;
  }

  // Sort
  filteredCompanies.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.company_name.localeCompare(b.company_name);
      case 'date':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'deal-size':
        return (b.deal_size || 0) - (a.deal_size || 0);
      case 'status':
        // signed_and_wired comes before signed
        if (a.stage === b.stage) return 0;
        return a.stage === 'signed_and_wired' ? -1 : 1;
      default:
        return 0;
    }
  });

  // Calculate statistics
  const signedAndWiredCompanies = portfolioCompanies.filter(c => c.stage === 'signed_and_wired');
  const signedOnlyCompanies = portfolioCompanies.filter(c => c.stage === 'signed');
  const totalInvested = signedAndWiredCompanies.reduce((sum, c) => sum + (c.deal_size || 0), 0);
  const totalCommitted = portfolioCompanies.reduce((sum, c) => sum + (c.deal_size || 0), 0);
  const averageDealSize = portfolioCompanies.length > 0 ? totalCommitted / portfolioCompanies.length : 0;
  const companiesWithRevenue = portfolioCompanies.filter(c => c.has_revenue === true).length;

  const handleExport = () => {
    // Create CSV content
    const headers = ['Company Name', 'Status', 'Industry', 'Deal Size', 'Valuation', 'Funding Round', 'Has Revenue', 'Revenue Amount', 'Investment Date', 'Website', 'Contract', 'Founders', 'Location', 'Description'];
    const rows = portfolioCompanies.map(c => [
      c.company_name,
      c.stage === 'signed_and_wired' ? 'Signed & Wired' : 'Signed',
      c.industry || '',
      c.deal_size || '',
      c.valuation || '',
      c.funding_round || '',
      c.has_revenue ? 'Yes' : 'No',
      c.revenue_amount || '',
      new Date(c.created_at).toLocaleDateString(),
      c.website_url || c.company_url || '',
      c.contract_link || '',
      c.founders?.map(f => f.name).join('; ') || '',
      c.company_base_location || '',
      c.description?.replace(/\n/g, ' ') || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-companies-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Portfolio data exported successfully');
  };

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      <AdminNav 
        items={navItems} 
        active={activeSection} 
        onChange={(id) => {
          if (id === 'overview') {
            window.location.href = '/admin';
          } else if (id === 'meetings') {
            window.location.href = '/admin#meetings';
          } else if (id === 'admin-settings') {
            window.location.href = '/admin#admin-settings';
          } else if (id !== 'portfolio') {
            window.location.href = `/admin#${id}`;
          }
        }} 
      />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Portfolio Companies</h1>
                <p className="text-muted-foreground mt-1">Manage and track your portfolio investments</p>
              </div>
              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{portfolioCompanies.length}</div>
                  <p className="text-xs text-muted-foreground">In portfolio</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Signed & Wired</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{signedAndWiredCompanies.length}</div>
                  <p className="text-xs text-muted-foreground">${(totalInvested / 1000000).toFixed(2)}M invested</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Signed (Pending)</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{signedOnlyCompanies.length}</div>
                  <p className="text-xs text-muted-foreground">${((totalCommitted - totalInvested) / 1000000).toFixed(2)}M pending</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Deal</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${(averageDealSize / 1000).toFixed(0)}K</div>
                  <p className="text-xs text-muted-foreground">Per investment</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">With Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{companiesWithRevenue}</div>
                  <p className="text-xs text-muted-foreground">
                    {portfolioCompanies.length > 0 
                      ? `${Math.round((companiesWithRevenue / portfolioCompanies.length) * 100)}% of portfolio`
                      : 'No companies'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies, founders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  <SelectItem value="signed-and-wired">Signed & Wired</SelectItem>
                  <SelectItem value="signed-only">Signed Only</SelectItem>
                  <SelectItem value="has-revenue">Has Revenue</SelectItem>
                  <SelectItem value="no-revenue">No Revenue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Investment Date</SelectItem>
                  <SelectItem value="name">Company Name</SelectItem>
                  <SelectItem value="deal-size">Deal Size</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Portfolio Companies List */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deal Size</TableHead>
                    <TableHead>Valuation</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Founders</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Links</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{company.company_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {company.company_description_short || company.industry || 'Technology'}
                          </div>
                          {company.funding_round && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {company.funding_round}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.stage === 'signed_and_wired' ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Wired
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            <Clock className="h-3 w-3 mr-1" />
                            Signed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {company.deal_size 
                            ? `$${(company.deal_size / 1000).toFixed(0)}K`
                            : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.valuation 
                          ? `$${(company.valuation / 1000000).toFixed(1)}M`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {company.has_revenue ? (
                          <div>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                              Revenue
                            </Badge>
                            {company.revenue_amount && (
                              <div className="text-sm mt-1">
                                ${(company.revenue_amount / 1000).toFixed(0)}K
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {company.founders && company.founders.length > 0 
                            ? company.founders.map(f => f.name).join(', ')
                            : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {company.company_base_location || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(company.created_at), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(company.created_at), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {company.website_url && (
                            <a
                              href={company.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary"
                              title="Website"
                            >
                              <Globe className="h-4 w-4" />
                            </a>
                          )}
                          {company.pitch_deck_url && (
                            <a
                              href={company.pitch_deck_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary"
                              title="Pitch Deck"
                            >
                              <FileText className="h-4 w-4" />
                            </a>
                          )}
                          {company.contract_link && (
                            <a
                              href={company.contract_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary"
                              title="SAFE Contract"
                            >
                              <FileSignature className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Empty State */}
              {filteredCompanies.length === 0 && (
                <div className="p-12 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No portfolio companies found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || filterBy !== 'all' 
                      ? 'Try adjusting your filters or search query'
                      : 'No companies have been marked as portfolio investments yet'}
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}