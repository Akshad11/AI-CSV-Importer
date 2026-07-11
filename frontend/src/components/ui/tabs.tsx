'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

// ─── Context ────────────────────────────────────────────────────────────────

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('Tabs sub-components must be used inside <Tabs>');
  return ctx;
}

// ─── Tabs (root) ─────────────────────────────────────────────────────────────

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

// ─── TabsList ────────────────────────────────────────────────────────────────

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 rounded-xl bg-secondary p-1 border border-border shadow-sm',
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── TabsTrigger ─────────────────────────────────────────────────────────────

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function TabsTrigger({ value, children, className, disabled }: TabsTriggerProps) {
  const { value: activeValue, onValueChange } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      id={`tab-trigger-${value}`}
      disabled={disabled}
      onClick={() => onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'bg-card text-foreground shadow-sm border border-border'
          : 'text-muted-foreground hover:text-foreground hover:bg-card/50',
        className
      )}
    >
      {children}
    </button>
  );
}

// ─── TabsContent ─────────────────────────────────────────────────────────────

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: activeValue } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-trigger-${value}`}
      hidden={!isActive}
      className={cn('focus-visible:outline-none', isActive && 'animate-in fade-in-0 slide-in-from-bottom-1 duration-200', className)}
    >
      {isActive ? children : null}
    </div>
  );
}
