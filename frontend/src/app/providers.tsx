'use client';

import React from 'react';
import { ThemeProvider } from '../providers/ThemeProvider';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </ThemeProvider>
  );
}
