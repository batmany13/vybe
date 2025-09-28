'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LimitedPartner } from '@/shared/models';
import { authClient } from '@/client-lib/auth-client';
import { useLimitedPartners } from '@/client-lib/api-client';

interface SelectedLPContextType {
  selectedLP: LimitedPartner | null;
  setSelectedLP: (lp: LimitedPartner | null) => void;
  isLoading: boolean;
  isAutoMatched: boolean;
}

const SelectedLPContext = createContext<SelectedLPContextType | undefined>(undefined);

export function SelectedLPProvider({ children }: { children: ReactNode }) {
  const [selectedLP, setSelectedLPState] = useState<LimitedPartner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoMatched, setIsAutoMatched] = useState(false);
  
  // Get current user session and LPs data
  const { data: session } = process.env.NODE_ENV === 'production' ? authClient.useSession() :
    { data: {
        user: {
          name: 'Bruce Wang',
          email: 'byyw13@gmail.com',
          image: undefined,
        }
    }};
  const { data: limitedPartners = [] } = useLimitedPartners();

  // Auto-associate user with LP based on email and load from localStorage
  useEffect(() => {
    if (limitedPartners.length === 0 || !session?.user?.email) {
      setIsLoading(false);
      return;
    }

    // Try to find an LP that matches the user's email
    const matchingLP = limitedPartners.find(lp => 
      lp.email.toLowerCase() === session.user.email.toLowerCase() && lp.status === 'active'
    );

    if (matchingLP) {
      // Auto-associate with matching LP
      setSelectedLPState(matchingLP);
      setIsAutoMatched(true);
      localStorage.setItem('selectedLP', JSON.stringify(matchingLP));
    } else {
      setIsAutoMatched(false);
      // If no matching LP, check localStorage for manual selection
      const stored = localStorage.getItem('selectedLP');
      if (stored) {
        try {
          const storedLP = JSON.parse(stored);
          // Verify the stored LP still exists and is active
          const stillExists = limitedPartners.find(lp => 
            lp.id === storedLP.id && lp.status === 'active'
          );
          if (stillExists) {
            setSelectedLPState(stillExists);
          } else {
            // Clean up invalid stored selection
            localStorage.removeItem('selectedLP');
            setSelectedLPState(null);
          }
        } catch (error) {
          console.error('Error loading selected LP:', error);
          localStorage.removeItem('selectedLP');
        }
      }
    }
    
    setIsLoading(false);
  }, [limitedPartners, session?.user?.email]);

  // Save to localStorage whenever selection changes
  const setSelectedLP = (lp: LimitedPartner | null) => {
    setSelectedLPState(lp);
    setIsAutoMatched(false); // Manual selection overrides auto-match
    if (lp) {
      localStorage.setItem('selectedLP', JSON.stringify(lp));
    } else {
      localStorage.removeItem('selectedLP');
    }
  };

  return (
    <SelectedLPContext.Provider value={{ selectedLP, setSelectedLP, isLoading, isAutoMatched }}>
      {children}
    </SelectedLPContext.Provider>
  );
}

export function useSelectedLP() {
  const context = useContext(SelectedLPContext);
  if (context === undefined) {
    throw new Error('useSelectedLP must be used within a SelectedLPProvider');
  }
  return context;
}