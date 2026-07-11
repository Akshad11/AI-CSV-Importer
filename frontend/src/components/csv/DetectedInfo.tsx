'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Rows3, Columns3, SeparatorHorizontal, HardDrive, Timer } from 'lucide-react';
import { cn } from '../../lib/utils';
import { delimiterLabel, estimateImportTime } from '../../utils/parseCsvContent';

interface DetectedInfoProps {
  rowCount: number;
  columnCount: number;
  delimiter: string;
  charCount: number;
  className?: string;
}

interface StatPillProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}

function StatPill({ icon, label, value, accent }: StatPillProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-0.5 px-3.5 py-2.5 rounded-xl border border-border bg-secondary',
        accent && 'border-primary/20 bg-primary/5'
      )}
    >
      <div className={cn('flex items-center gap-1.5 text-muted-foreground', accent && 'text-primary')}>
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-sm font-bold text-foreground font-mono mt-0.5">{value}</span>
    </div>
  );
}

export function DetectedInfo({ rowCount, columnCount, delimiter, charCount, className }: DetectedInfoProps) {
  // Estimate file size: raw chars encoded in UTF-8 ≈ 1 byte/char
  const estimatedBytes = charCount;
  const estimatedSize =
    estimatedBytes < 1024
      ? `${estimatedBytes} B`
      : estimatedBytes < 1024 * 1024
      ? `${(estimatedBytes / 1024).toFixed(1)} KB`
      : `${(estimatedBytes / (1024 * 1024)).toFixed(2)} MB`;

  const importTime = estimateImportTime(rowCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2', className)}
    >
      <StatPill
        icon={<Rows3 className="h-3 w-3" />}
        label="Rows"
        value={rowCount.toLocaleString()}
        accent={rowCount > 0}
      />
      <StatPill
        icon={<Columns3 className="h-3 w-3" />}
        label="Columns"
        value={columnCount.toLocaleString()}
      />
      <StatPill
        icon={<SeparatorHorizontal className="h-3 w-3" />}
        label="Delimiter"
        value={delimiterLabel(delimiter)}
      />
      <StatPill
        icon={<HardDrive className="h-3 w-3" />}
        label="Est. Size"
        value={estimatedSize}
      />
      <StatPill
        icon={<Timer className="h-3 w-3" />}
        label="Import Time"
        value={importTime}
      />
    </motion.div>
  );
}

export default DetectedInfo;
