import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  showText?: boolean;
}

export function ProgressBar({ progress, className, showText = false }: ProgressBarProps) {
  const cleanProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full select-none ${className}`}>
      {showText && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Progress</span>
          <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
            {cleanProgress.toFixed(1)}%
          </span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/40 dark:border-slate-800/40">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${cleanProgress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
export default ProgressBar;
