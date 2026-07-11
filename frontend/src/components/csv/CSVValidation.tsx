'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ValidationSeverity = 'error' | 'warning' | 'success' | 'info';

export interface ValidationMessage {
  id: string;
  severity: ValidationSeverity;
  title: string;
  detail?: string;
}

interface CSVValidationProps {
  messages: ValidationMessage[];
  className?: string;
}

const ICONS: Record<ValidationSeverity, React.ReactNode> = {
  error: <XCircle className="h-4 w-4 shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />,
  success: <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />,
  info: <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />,
};

const STYLES: Record<ValidationSeverity, string> = {
  error: 'border-destructive/25 bg-destructive/8 text-destructive',
  warning: 'border-amber-500/25 bg-amber-500/8 text-amber-600 dark:text-amber-400',
  success: 'border-emerald-500/25 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400',
  info: 'border-primary/25 bg-primary/8 text-primary',
};

export function CSVValidation({ messages, className }: CSVValidationProps) {
  if (messages.length === 0) return null;

  return (
    <AnimatePresence mode="sync">
      <div className={cn('flex flex-col gap-2', className)} role="alert" aria-live="polite">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className={cn(
              'flex items-start gap-2.5 p-3 rounded-xl border text-sm leading-relaxed',
              STYLES[msg.severity]
            )}
          >
            {ICONS[msg.severity]}
            <div>
              <span className="font-semibold">{msg.title}</span>
              {msg.detail && (
                <p className="text-xs mt-0.5 opacity-80 leading-relaxed">{msg.detail}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}

export default CSVValidation;
