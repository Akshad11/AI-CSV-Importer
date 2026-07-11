'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useImportStore, useUploadStore } from '../../store';
import { PageContainer } from '../../components/common/PageContainer';
import { LogTable } from '../../components/processing/LogTable';
import { ProgressRing } from '../../components/common/ProgressRing';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Button } from '../../components/ui/button';
import { Dialog } from '../../components/ui/dialog';
import { formatDuration } from '../../utils';
import { extractionSimulator } from '../../services/simulator/extractionSim';
import { AlertCircle, Play, Ban, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

export default function ProcessingPage() {
  const router = useRouter();
  const { fileMeta } = useUploadStore();
  const {
    status,
    processedRows,
    totalRows,
    estimatedTimeRemaining,
    recordsPerSecond,
    totalCost,
    successCount,
    warningCount,
    failureCount,
    resetProcessing,
  } = useImportStore();

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  // Trigger extraction pipeline on mount
  useEffect(() => {
    // If no active metadata is loaded, return to upload
    if (!fileMeta) {
      router.replace('/import');
      return;
    }

    // Start simulator if we are running
    if (status === 'running') {
      extractionSimulator.start(() => {
        // Auto navigate to results on successful simulation completion
        setTimeout(() => {
          router.push('/results');
        }, 2000);
      });
    }

    // Cleanup simulator on unmount (cancel active timers)
    return () => {
      // We don't cancel if already completed, only if unmounted mid-run
      if (useImportStore.getState().status === 'running') {
        extractionSimulator.cancel();
      }
    };
  }, [fileMeta, router, status]);

  const percentage = totalRows > 0 ? (processedRows / totalRows) * 100 : 0;

  const handleCancelConfirm = () => {
    extractionSimulator.cancel();
    setIsCancelDialogOpen(false);
  };

  return (
    <PageContainer>
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">AI Extraction Pipeline</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Intelligently scanning raw spreadsheet rows and populating CRM fields in real time.
          </p>
        </div>
        {status === 'running' && (
          <Button
            variant="destructive"
            onClick={() => setIsCancelDialogOpen(true)}
            className="w-full sm:w-auto shadow-sm"
          >
            <Ban className="h-4 w-4 mr-2" />
            Cancel Import
          </Button>
        )}
        {status === 'completed' && (
          <Button
            onClick={() => router.push('/results')}
            className="w-full sm:w-auto shadow-sm"
          >
            View Results
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
        {(status === 'cancelled' || status === 'error') && (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
               variant="outline"
              onClick={() => {
                resetProcessing();
                router.push('/import');
              }}
              className="flex-1 sm:flex-none border-border"
            >
              Re-upload File
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-card border border-border shadow-sm rounded-2xl flex flex-col justify-center select-none">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</span>
          <div className="mt-1 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${
              status === 'completed' ? 'bg-success' :
              status === 'running' ? 'bg-primary animate-pulse' :
              status === 'cancelled' ? 'bg-warning' : 'bg-destructive'
            }`} />
            <span className="text-base font-bold text-foreground capitalize">
              {status === 'running' ? 'Active' : status}
            </span>
          </div>
        </div>

        <div className="p-4 bg-card border border-border shadow-sm rounded-2xl flex flex-col justify-center select-none">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estimated Time</span>
          <span className="text-base font-bold text-foreground font-mono mt-0.5">
            {formatDuration(estimatedTimeRemaining)}
          </span>
        </div>

        <div className="p-4 bg-card border border-border shadow-sm rounded-2xl flex flex-col justify-center select-none">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Throughput Rate</span>
          <span className="text-base font-bold text-foreground font-mono mt-0.5">
            {recordsPerSecond.toFixed(1)} rows/s
          </span>
        </div>

        <div className="p-4 bg-card border border-border shadow-sm rounded-2xl flex flex-col justify-center select-none">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estimated Cost</span>
          <span className="text-base font-bold text-foreground font-mono mt-0.5">
            ₹{totalCost.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Main Logs Board */}
      <div className="flex flex-col gap-3">
        <LogTable />

        {/* Progress bar below logs */}
        <div className="p-4 bg-card rounded-2xl border border-border shadow-sm flex flex-col gap-3 select-none">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-muted-foreground">Pipeline Ingestion Progress</span>
            <span className="text-foreground font-mono font-bold">
              {processedRows} / {totalRows} Rows
            </span>
          </div>
          <ProgressBar progress={percentage} />
        </div>
      </div>

      {/* Processing Live Stats summary bar */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 select-none">
        <div className="text-center p-3.5 bg-card rounded-2xl border border-border shadow-sm">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Imported</p>
          <p className="text-lg md:text-xl font-bold font-mono text-success">{successCount}</p>
        </div>
        <div className="text-center p-3.5 bg-card rounded-2xl border border-border shadow-sm">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Warnings</p>
          <p className="text-lg md:text-xl font-bold font-mono text-warning">{warningCount}</p>
        </div>
        <div className="text-center p-3.5 bg-card rounded-2xl border border-border shadow-sm">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Skipped</p>
          <p className="text-lg md:text-xl font-bold font-mono text-destructive">{failureCount}</p>
        </div>
        <div className="text-center p-3.5 bg-card rounded-2xl border border-border shadow-sm hidden md:block">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Awaiting</p>
          <p className="text-lg md:text-xl font-bold font-mono text-muted-foreground">{Math.max(0, totalRows - processedRows)}</p>
        </div>
        <div className="text-center p-3.5 bg-card rounded-2xl border border-border shadow-sm hidden md:block">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Workers</p>
          <p className="text-lg md:text-xl font-bold font-mono text-foreground">4 Parallel</p>
        </div>
      </div>

      {/* Cancellation Dialog overlay */}
      <Dialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        title="Cancel Ingestion Pipeline?"
        description="Are you sure you want to stop the AI lead extraction stream?"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
              className="w-full sm:w-auto text-muted-foreground hover:text-foreground border-border"
            >
              Resume extraction
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              className="w-full sm:w-auto shadow-sm shadow-destructive/10"
            >
              <Ban className="h-4.5 w-4.5 mr-1.5" />
              Cancel and Discard
            </Button>
          </>
        }
      >
        <div className="flex gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-sans">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Irreversible Action</span>
            <p className="mt-0.5 leading-relaxed text-destructive">
              Stopping the process is permanent. Mapped CRM records and warnings compiled for this file during this run will be discarded immediately.
            </p>
          </div>
        </div>
      </Dialog>
    </PageContainer>
  );
}
