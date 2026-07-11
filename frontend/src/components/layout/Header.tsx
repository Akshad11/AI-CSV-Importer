'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLayoutStore, useThemeStore, useSettingsStore } from '../../store';
import { Menu, Sun, Moon, Laptop, Globe, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import axios from 'axios';
import { APP_CONFIG } from '../../config';

const routeNameMap: Record<string, string> = {
  '/': 'Overview',
  '/import': 'New Import',
  '/preview': 'Preview Data',
  '/processing': 'Import Processing',
  '/results': 'Import Results',
  '/settings': 'Settings',
};

export function Header() {
  const pathname = usePathname();
  const { toggleSidebar } = useLayoutStore();
  const { theme, setTheme } = useThemeStore();
  const { setAvailableProviders } = useSettingsStore();
  const [connectionStatus, setConnectionStatus] = useState<'ready' | 'offline' | 'checking'>('checking');
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  // Connection check polling
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get(`${APP_CONFIG.apiBaseUrl}/status`, { timeout: 3000 });
        if (response.data?.success && response.data?.data?.status === 'ready') {
          setConnectionStatus('ready');
          if (response.data?.data?.providers) {
            setAvailableProviders(response.data.data.providers);
          }
        } else {
          setConnectionStatus('offline');
          setAvailableProviders({ openai: false, gemini: false, ollama: false, mock: true });
        }
      } catch (err) {
        setConnectionStatus('offline');
        setAvailableProviders({ openai: false, gemini: false, ollama: false, mock: true });
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [setAvailableProviders]);

  const getBreadcrumbs = () => {
    const currentName = routeNameMap[pathname] || 'Dashboard';
    return (
      <div className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-muted-foreground font-sans select-none">
        <span>Console</span>
        <span>/</span>
        <span className="text-foreground font-semibold">{currentName}</span>
      </div>
    );
  };

  return (
    <header className="h-16 sticky top-0 bg-background/70 backdrop-blur-md border-b border-border flex items-center justify-between px-4 md:px-6 z-20 select-none">
      {/* Left side: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-xl hover:bg-accent hover:text-accent-foreground text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        {getBreadcrumbs()}
      </div>

      {/* Right side: Connection Status & Theme Switcher */}
      <div className="flex items-center gap-4">
        {/* Connection Status Indicator */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary border border-border">
          <span
            className={cn(
              'h-2 w-2 rounded-full shrink-0',
              connectionStatus === 'ready' && 'bg-emerald-500 animate-pulse',
              connectionStatus === 'offline' && 'bg-rose-500',
              connectionStatus === 'checking' && 'bg-amber-400 animate-pulse'
            )}
          />
          <span className="text-[10px] md:text-xs font-mono font-medium text-muted-foreground">
            {connectionStatus === 'ready' && 'AI Sync Active'}
            {connectionStatus === 'offline' && 'AI Sync Offline'}
            {connectionStatus === 'checking' && 'Syncing...'}
          </span>
        </div>

        {/* Theme Switcher Toggle */}
        <div className="relative">
          <button
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            className="p-2 rounded-xl border border-border hover:bg-accent text-foreground focus:outline-none transition-colors"
            aria-label="Toggle Theme Menu"
          >
            {theme === 'light' && <Sun className="h-4.5 w-4.5" />}
            {theme === 'dark' && <Moon className="h-4.5 w-4.5" />}
            {theme === 'system' && <Laptop className="h-4.5 w-4.5" />}
          </button>

          {themeDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setThemeDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-36 rounded-xl border border-border bg-popover text-popover-foreground p-1.5 shadow-xl z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => {
                    setTheme('light');
                    setThemeDropdownOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
                    theme === 'light' && 'text-accent-foreground bg-accent'
                  )}
                >
                  <Sun className="h-4 w-4" />
                  Light
                </button>
                <button
                  onClick={() => {
                    setTheme('dark');
                    setThemeDropdownOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
                    theme === 'dark' && 'text-accent-foreground bg-accent'
                  )}
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </button>
                <button
                  onClick={() => {
                    setTheme('system');
                    setThemeDropdownOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
                    theme === 'system' && 'text-accent-foreground bg-accent'
                  )}
                >
                  <Laptop className="h-4 w-4" />
                  System
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
export default Header;
