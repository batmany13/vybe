'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSelectedLP } from '@/contexts/SelectedLPContext';
import { useLimitedPartners } from '@/client-lib/api-client';
import { Users, Check } from 'lucide-react';

export function LPSwitcher() {
  const { selectedLP, setSelectedLP, isAutoMatched } = useSelectedLP();
  const { data: limitedPartners = [] } = useLimitedPartners();
  
  // Only show in development mode
  if (process.env.NODE_ENV === 'production') return null;
  
  const activeLPs = limitedPartners.filter(lp => lp.status === 'active');
  
  if (activeLPs.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          {selectedLP ? selectedLP.name : 'No LP Selected'}
          {isAutoMatched && <span className="text-xs text-primary">●</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs">
          {isAutoMatched ? 'Auto-matched LP' : 'Switch LP (Dev Mode)'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {activeLPs.map((lp) => (
          <DropdownMenuItem
            key={lp.id}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setSelectedLP(lp)}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={lp.avatar_url} alt={lp.name} />
              <AvatarFallback className="text-xs">
                {lp.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-sm font-medium">{lp.name}</div>
              <div className="text-xs text-muted-foreground">
                {lp.title} at {lp.company}
              </div>
            </div>
            {selectedLP?.id === lp.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive cursor-pointer"
          onClick={() => setSelectedLP(null)}
        >
          Clear Selection
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}