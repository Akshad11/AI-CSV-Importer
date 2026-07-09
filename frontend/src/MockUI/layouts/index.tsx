import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants';
import { cn } from '../lib/utils';
import { useStore } from '../store';
import { Moon, Sun, Bell, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSidebarOpen, closeSidebar } = useStore();

  // Close sidebar on route change on mobile
  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={closeSidebar}
        />
      )}
      
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-white p-4 shrink-0 h-screen transition-all duration-300 ease-in-out dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800",
        "w-64 md:w-20 lg:w-64",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex h-14 items-center px-2 mb-4 justify-between md:justify-center lg:justify-start">
          <div className="flex items-center gap-4 md:gap-0 lg:gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <span className="font-bold text-xs">CSV</span>
            </div>
            <span className="font-medium text-slate-900 dark:text-slate-50 md:hidden lg:block">Importer</span>
          </div>
          <button className="md:hidden text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50" onClick={closeSidebar}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto overflow-x-hidden">
          <nav className="space-y-1">
            {ROUTES.map((route) => {
              const Icon = route.icon;
              const isActive = location.pathname.startsWith(route.path) || (location.pathname === '/' && route.path === '/dashboard');
              return (
                <button
                  key={route.path}
                  onClick={() => navigate(route.path)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors md:justify-center lg:justify-start",
                    isActive
                      ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  )}
                  title={route.label}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="md:hidden lg:block whitespace-nowrap">{route.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4 md:hidden lg:block">
          <div className="flex items-center gap-3 px-3">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">System Health</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full w-3/4 bg-green-500"></div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Normal</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function Header() {
  const { theme, setTheme, toggleSidebar } = useStore();
  const location = useLocation();
  
  const currentRoute = ROUTES.find(r => location.pathname.startsWith(r.path)) || ROUTES[0];

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      return;
    }
    
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 shrink-0 dark:border-slate-800 dark:bg-slate-950 sticky top-0 z-30">
      <div className="flex items-center gap-3 md:gap-4">
        <button 
          className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </button>
        <nav className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
          <span className="hidden sm:inline">Home</span>
          <span className="hidden sm:inline mx-2 text-slate-400">/</span>
          <span className="text-slate-900 dark:text-slate-50 line-clamp-1">{currentRoute?.label || 'Dashboard'}</span>
        </nav>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <button className="relative h-8 w-8 rounded-full bg-slate-100 p-2 text-slate-500 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-50 hidden sm:block">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-red-500"></span>
        </button>
        <button onClick={toggleTheme} className="h-8 w-8 rounded-full bg-slate-100 p-2 text-slate-500 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-50">
          {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-sm font-medium border border-slate-300 dark:border-slate-700 ml-1">
          JD
        </div>
      </div>
    </header>
  );
}

export function MainLayout() {
  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden dark:bg-slate-950 dark:text-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden w-full relative">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 flex flex-col gap-4 md:gap-6 w-full">
          <div className="mx-auto w-full max-w-6xl flex flex-col min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
