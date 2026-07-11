import React from 'react';
import { motion } from 'framer-motion';

interface ProgressRingProps {
  radius?: number;
  strokeWidth?: number;
  progress: number; // 0 to 100
  className?: string;
  size?: number;
}

export function ProgressRing({
  radius = 60,
  strokeWidth = 8,
  progress = 0,
  className,
  size,
}: ProgressRingProps) {
  const adjustedSize = size || (radius + strokeWidth) * 2;
  const normalizedRadius = adjustedSize / 2 - strokeWidth;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg height={adjustedSize} width={adjustedSize} className="transform -rotate-90">
        {/* Track Ring */}
        <circle
          className="text-slate-100 dark:text-slate-800"
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={adjustedSize / 2}
          cy={adjustedSize / 2}
        />
        {/* Progress Ring */}
        <motion.circle
          className="text-indigo-600 dark:text-indigo-400"
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={adjustedSize / 2}
          cy={adjustedSize / 2}
        />
      </svg>
      {/* Centered Text overlay */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-extrabold tracking-tighter font-mono bg-gradient-to-r from-slate-900 to-indigo-900 dark:from-slate-50 dark:to-indigo-300 bg-clip-text text-transparent">
          {progress.toFixed(0)}%
        </span>
        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 font-sans -mt-0.5">
          Ingested
        </span>
      </div>
    </div>
  );
}
export default ProgressRing;
