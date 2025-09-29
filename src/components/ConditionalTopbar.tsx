'use client';

import { usePathname } from 'next/navigation';
import { Topbar } from './Topbar';
import { useEffect } from 'react';

export function ConditionalTopbar() {
  const pathname = usePathname();
  const isPublicRoute = pathname?.startsWith('/public');

  useEffect(() => {
    // Add appropriate styling to main element based on whether topbar is shown
    const mainElement = document.querySelector('.conditional-main') as HTMLElement;
    if (mainElement) {
      if (isPublicRoute) {
        mainElement.className = 'conditional-main pt-0';
      } else {
        mainElement.className = 'conditional-main pt-12';
      }
    }
  }, [isPublicRoute]);

  // Don't render Topbar for public routes (like shared deal links)
  if (isPublicRoute) {
    return null;
  }

  return <Topbar />;
}