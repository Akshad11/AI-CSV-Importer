'use client';

import React, { useEffect, useRef } from 'react';
import { useImportStore } from '../../store';
import { cn } from '../../lib/utils';
import { formatDate } from '../../utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export function LogTable() {
  const { logs, status } = useImportStore();
  const listRef = useRef<HTMLDivElement>(null);

  // Auto scroll to top when new logs arrive (since we prepend new logs)
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [logs.length]);

  return (
    <div className="flex-1 rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col min-h-[360px] max-h-[500px]">
      {/* Header banner */}
      <div className="border-b border-border bg-muted/40 px-5 py-4 flex items-center justify-between select-none">
        <div>
          <h3 className="font-bold text-sm text-foreground">AI Extraction Activity Stream</h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-sans">Live logs from the parallel pipeline workers</p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-mono font-bold text-muted-foreground border border-border select-none uppercase tracking-wider">
          {status === 'running' ? 'Streaming' : status.toUpperCase()}
        </span>
      </div>

      {/* Terminal View */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 bg-zinc-950 text-zinc-300 font-mono text-xs space-y-2 select-text scroll-smooth">
        {logs.length > 0 ? (
          logs.map((log) => {
            const isInfo = log.type === 'info';
            const isSuccess = log.type === 'success';
            const isWarning = log.type === 'warning';
            const isError = log.type === 'error';

            return (
              <div
                key={log.id}
                className={cn(
                  'py-1.5 px-3 rounded-lg border flex flex-col gap-1 transition-all duration-150 animate-in fade-in slide-in-from-top-1',
                  isInfo && 'bg-zinc-900/40 border-zinc-800/60 text-zinc-400',
                  isSuccess && 'bg-primary/10 border-primary/20 text-primary',
                  isWarning && 'bg-warning/10 border-warning/20 text-warning',
                  isError && 'bg-destructive/10 border-destructive/20 text-destructive'
                )}
              >
                {/* Time & Title info row */}
                <div className="flex items-center gap-2 select-none">
                  <span className="text-[10px] text-zinc-500 shrink-0">
                    {formatDate(log.timestamp).split(',')[1]?.trim() || formatDate(log.timestamp)}
                  </span>
                  
                  {isSuccess && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                  {isWarning && <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />}
                  {isError && <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                  {isInfo && <Info className="h-3.5 w-3.5 text-zinc-500 shrink-0" />}

                  {log.rowNumber && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0 border border-zinc-700/50">
                      Row #{log.rowNumber}
                    </span>
                  )}
                  {log.targetField && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/20 border border-primary/30 text-primary shrink-0 font-sans">
                      field: {log.targetField}
                    </span>
                  )}

                  {log.certainty !== undefined && (
                    <span className={cn(
                      'ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded font-mono border shrink-0',
                      log.certainty > 0.85
                        ? 'bg-success/20 border-success/30 text-success'
                        : 'bg-warning/20 border-warning/30 text-warning'
                    )}>
                      certainty: {log.certainty.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Message body */}
                <div className="pl-0 mt-0.5 text-zinc-200 leading-relaxed font-sans text-xs">
                  {log.message}
                </div>

                {/* Grid details for AI extraction values */}
                {(log.rawInput || log.extractedValue) && (
                  <div className="mt-1.5 grid grid-cols-2 gap-3 py-1 px-2.5 rounded bg-black/40 border border-zinc-900 text-[10px]">
                    <div className="truncate">
                      <span className="text-zinc-500 select-none uppercase font-bold block text-[8px] tracking-wider">Raw CSV Value</span>
                      <span className="text-zinc-400 italic block mt-0.5 truncate">{log.rawInput || 'empty'}</span>
                    </div>
                    <div className="truncate">
                      <span className="text-zinc-500 select-none uppercase font-bold block text-[8px] tracking-wider">Extracted Lead Value</span>
                      <span className="text-primary font-bold block mt-0.5 truncate">{log.extractedValue || 'N/A'}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-500 font-sans italic select-none">
            Initializing pipeline logs...
          </div>
        )}
      </div>
    </div>
  );
}
export default LogTable;
