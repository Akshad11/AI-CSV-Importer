'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayoutStore, useImportStore } from '../../store';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UploadCloud,
  FileSpreadsheet,
  Settings,
  X,
  Database,
  Play,
  CheckCircle,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/import', label: 'New Import', icon: UploadCloud },
  { href: '/preview', label: 'Preview Data', icon: FileSpreadsheet },
  { href: '/processing', label: 'Import Processing', icon: Play, showIfBusy: true },
  { href: '/results', label: 'Import Results', icon: CheckCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, closeSidebar } = useLayoutStore();
  const { status: importStatus } = useImportStore();

  const isProcessing = importStatus === 'running';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-r border-border text-foreground">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-border shrink-0">
        <Link href="/" onClick={closeSidebar} className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/30 shrink-0">
            <Database className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-foreground to-primary/80 bg-clip-text text-transparent">
              LeadFlow AI
            </span>
            <span className="block text-[10px] text-muted-foreground font-medium -mt-1 font-mono uppercase tracking-widest">
              CSV Importer
            </span>
          </div>
        </Link>
        {/* Mobile close button */}
        <button
          onClick={closeSidebar}
          className="lg:hidden p-1.5 rounded-lg hover:bg-accent hover:text-accent-foreground text-muted-foreground"
          aria-label="Close Sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          // Hide processing page link if not active/running or if no file is uploaded
          if (item.showIfBusy && !isProcessing) return null;

          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeSidebar}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all relative group',
                isActive
                  ? 'text-accent-foreground bg-accent'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive
                    ? 'text-accent-foreground'
                    : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              {item.label}

              {item.href === '/processing' && isProcessing && (
                <span className="ml-auto flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-border shrink-0 text-center text-xs text-muted-foreground font-mono">
        v1.0.0 (Express + Next)
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 select-none z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebar}
              className="lg:hidden fixed inset-0 bg-black z-40"
            />
            {/* Drawer Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-64 z-50 shadow-2xl h-full"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
export default Sidebar;
