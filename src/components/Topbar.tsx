'use client';

import { useState, useEffect } from 'react';
import { authClient } from "@/client-lib/auth-client";
import { useDealsWithVotesAndFounders } from "@/client-lib/api-client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LPSwitcher } from "@/components/LPSwitcher";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLink, TrendingUp, User, Building2, Users, FileText, Utensils, UserCircle, Cpu, Zap, Layers, CircuitBoard, MessageSquare } from "lucide-react";



export function Topbar() {

  const pathname = usePathname();
  const router = useRouter();

  
  // Get session data
  const { data: session } = authClient.useSession();
  
  // In development, use mock data
  const mockSession = process.env.NODE_ENV !== 'production' ? {
    user: {
      name: 'Bruce Wang',
      email: 'byyw13@gmail.com',
      image: undefined,
    }
  } : null;
  
  const currentSession = session || mockSession;
  const [userInitials, setUserInitials] = useState('');

  useEffect(() => {
    const u = currentSession?.user;
    if (u) {
      const base = (u.name || u.email || '').trim();
      const init = base ? base.charAt(0).toUpperCase() : '';
      setUserInitials(init);
    } else {
      setUserInitials('');
    }
  }, [currentSession?.user?.name, currentSession?.user?.email]);
  
  const { data: activeOrganization } = process.env.NODE_ENV === 'production' ? authClient.useActiveOrganization() : { 
    data: {
      name: 'My Organization',
    }
  };
  

  
  // Get deals to count portfolio companies and voting deals
  const { data: deals = [] } = useDealsWithVotesAndFounders();
  const portfolioCount = deals.filter(deal => 
    deal.stage === 'signed' || deal.stage === 'signed_and_wired'
  ).length;
  const votingCount = deals.filter(deal => deal.stage === 'partner_review').length;
  


  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = 'https://vybe.build/login';
        },
      },
    });
  };



  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-950 shadow-sm border-b border-gray-200 dark:border-gray-800 z-[10] h-12">
      <div className="mx-auto h-full px-8">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:opacity-75 transition flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg blur-sm opacity-70 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-1.5 shadow-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Gandhi Capital
                </span>
                <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
                  Fund 1
                </span>
              </div>
            </Link>
            
            <nav className="flex items-center gap-4">
              <Link 
                href="/deals" 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/deals' 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Deals
                {votingCount > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full font-medium ${
                    pathname === '/deals'
                      ? 'bg-orange-600 dark:bg-orange-400 text-white dark:text-gray-900'
                      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                  }`}>
                    {votingCount} review
                  </span>
                )}
              </Link>
              <Link 
                href="/portfolio" 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/portfolio' 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Portfolio
                {portfolioCount > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full font-medium ${
                    pathname === '/portfolio'
                      ? 'bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {portfolioCount}
                  </span>
                )}
              </Link>

              <Link 
                href="/monthly-updates" 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/monthly-updates' 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                Updates
              </Link>
              <Link 
                href="/dinners" 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/dinners' 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <Utensils className="w-4 h-4" />
                Events
              </Link>
              <Link 
                href="/lp-communication" 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/lp-communication' 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Chat
              </Link>
              <Link 
                href="/admin" 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/admin' 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <UserCircle className="w-4 h-4" />
                Admin
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <LPSwitcher />
            <ThemeToggle />
            {currentSession && (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={currentSession.user.image ?? undefined} />
                    <AvatarFallback className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {currentSession.user.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {currentSession.user.email}
                    </p>

                  </div>
                  <DropdownMenuSeparator />

                  
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Organization
                    </p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {activeOrganization?.name ?? 'No organization selected'}
                    </p>
                  </div>
                  <DropdownMenuItem
                    className="text-gray-600 dark:text-gray-400 cursor-pointer"
                    onClick={() => window.open('https://vybe.build/organizations', '_blank')}
                  >
                    Manage organizations <ExternalLink className="w-4 h-4" />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-gray-600 dark:text-gray-400 cursor-pointer"
                    onClick={() => window.open('https://vybe.build/apps', '_blank')}
                  >
                    Manage apps <ExternalLink className="w-4 h-4" />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={true}
                    className="cursor-pointer"
                    onClick={handleSignOut}
                  >
                    <span className="text-destructive font-semibold">Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          

        </div>
      </div>
    </header>
  );
}