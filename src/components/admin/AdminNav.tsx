"use client"

import { Badge } from "@/components/ui/badge";
import { cn } from "@/client-lib/utils";
import { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export type AdminNavItem<T extends string> = {
  id: T;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: number;
  isHighlight?: boolean;
  isNew?: boolean;
};

export function AdminNav<T extends string>({
  items,
  active,
  onChange,
}: {
  items: AdminNavItem<T>[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/10">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your fund</p>
      </div>
      
      {/* Navigation Items */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon as unknown as (props: { className?: string; children?: ReactNode }) => JSX.Element;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-primary-foreground" : ""
                )} />
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.label}</span>
                    {item.isNew && (
                      <Badge variant={isActive ? "secondary" : "default"} className="h-5 px-1.5 text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                  {isActive && (
                    <p className="text-xs mt-0.5 opacity-90">
                      {item.description}
                    </p>
                  )}
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge 
                    variant={isActive ? "secondary" : "outline"} 
                    className={cn(
                      "h-6 min-w-[1.5rem] px-1.5",
                      isActive ? "bg-primary-foreground/20 text-primary-foreground border-0" : ""
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
      
      {/* Footer */}
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground">
          <p>Gandhi Capital Admin</p>
          <p className="mt-1">© 2024</p>
        </div>
      </div>
    </div>
  );
}

// Default export for pages that just need a placeholder
export default function AdminNavPlaceholder() {
  return null;
}
