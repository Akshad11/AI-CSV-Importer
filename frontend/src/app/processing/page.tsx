'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useImportStore, useUploadStore, usePreviewStore, useSettingsStore, useResultsStore } from '../../store';
import { PageContainer } from '../../components/common/PageContainer';
import { LogTable } from '../../components/processing/LogTable';
import { ProgressRing } from '../../components/common/ProgressRing';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Button } from '../../components/ui/button';
import { Dialog } from '../../components/ui/dialog';
import { formatDuration } from '../../utils';
import { ImportService } from '../../services/api/importService';
import { AlertCircle, Play, Ban, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

export default function ProcessingPage() {
  const router = useRouter();
  const { fileMeta, file } = useUploadStore();
  const { columnMappings } = usePreviewStore();
  const { settings } = useSettingsStore();
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
    updateProgress,
    addLog,
    completeProcessing,
    failProcessing,
    cancelProcessing,
  } = useImportStore();

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false);

  // Trigger extraction pipeline on mount
  useEffect(() => {
    // If no active metadata is loaded, return to upload
    if (!fileMeta) {
      router.replace('/import');
      return;
    }

    if (status !== 'running') {
      startedRef.current = false;
      return;
    }

    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    let isAborted = false;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let uploadTimer: NodeJS.Timeout;
    let logsTimer1: NodeJS.Timeout;
    let logsTimer2: NodeJS.Timeout;
    let logsTimer3: NodeJS.Timeout;

    const runProcess = async () => {
      try {
        addLog({
          message: `[UPLOAD] Initializing server connection. Uploading CSV file (size: ${fileMeta.size} bytes)...`,
          type: 'info'
        });

        let uploadFinished = false;

        uploadTimer = setTimeout(() => {
            if (!uploadFinished && !isAborted) {
              addLog({
                message: `[UPLOAD] Upload still in progress. Please wait...`,
                type: 'info'
              });
            }
          }, 3000);

          let model = 'mock-model';
          if (settings.aiProvider === 'openai') model = 'gpt-4o-mini';
          else if (settings.aiProvider === 'gemini') model = 'gemini-3.5-flash';
          else if (settings.aiProvider === 'ollama') model = 'llama3';

          const responsePromise = ImportService.processCsv({
            file: file!,
            provider: settings.aiProvider,
            model,
            batchSize: 25,
            columnMappings,
            confidenceThreshold: settings.confidenceThreshold,
            defaultLeadSource: settings.defaultLeadSource,
            signal: controller.signal,
            onProgress: (pct) => {
              if (!isAborted) {
                // upload is first 15% of progress
                const val = Math.round((pct / 100) * fileMeta.rows * 0.15);
                updateProgress(
                  val,
                  0,
                  0,
                  { success: 0, warning: 0, failure: 0, speed: 0, cost: 0 }
                );
              }
            }
          });

          logsTimer1 = setTimeout(() => {
            if (!isAborted) {
              addLog({
                message: `[PARSE] Upload complete. Server is parsing CSV rows and validating headers...`,
                type: 'info'
              });
              updateProgress(
                Math.round(fileMeta.rows * 0.35),
                1,
                0,
                { success: 0, warning: 0, failure: 0, speed: 0, cost: 0 }
              );
            }
          }, 1500);

          logsTimer2 = setTimeout(() => {
            if (!isAborted) {
              addLog({
                message: `[AI] AI Ingestion Pipeline active. Extracting CRM fields using provider [${settings.aiProvider}] with model [${model}]...`,
                type: 'info'
              });
              addLog({
                message: `[AI] Running fuzzy mapping and formatting rules for cell values...`,
                type: 'info'
              });
              updateProgress(
                Math.round(fileMeta.rows * 0.70),
                2,
                0,
                { success: 0, warning: 0, failure: 0, speed: 0, cost: 0 }
              );
            }
          }, 4000);

          logsTimer3 = setTimeout(() => {
            if (!isAborted) {
              addLog({
                message: `[VALIDATION] Running lead schema validations (Zod constraints checking)...`,
                type: 'info'
              });
              updateProgress(
                Math.round(fileMeta.rows * 0.90),
                3,
                0,
                { success: 0, warning: 0, failure: 0, speed: 0, cost: 0 }
              );
            }
          }, 7500);

          const res = await responsePromise;
          uploadFinished = true;
          clearTimeout(uploadTimer);
          clearTimeout(logsTimer1);
          clearTimeout(logsTimer2);
          clearTimeout(logsTimer3);

          if (isAborted) return;

          if (res.success && res.data) {
            const { records, skipped, statistics } = res.data;

            addLog({
              message: `[FINISH] Ingestion complete: successfully parsed and imported ${records.length} records. ${skipped.length} records skipped.`,
              type: 'success'
            });

            // Set final completed progress metrics
            updateProgress(
              fileMeta.rows,
              Math.ceil(fileMeta.rows / 25),
              0,
              {
                success: statistics.imported,
                warning: statistics.warnings,
                failure: statistics.skipped,
                speed: statistics.recordsPerSecond,
                cost: statistics.totalCost
              }
            );

            // Save results to store
            useResultsStore.getState().setResults(
              records,
              skipped,
              statistics
            );

            // Add history item
            useResultsStore.getState().addHistoryItem({
              fileName: fileMeta.name,
              status: skipped.length === 0 ? 'Success' : records.length > 0 ? 'Partial' : 'Failed',
              importedRows: records.length,
              totalRows: fileMeta.rows
            });

            completeProcessing();

            // Auto-navigate to results page
            setTimeout(() => {
              router.push('/results');
            }, 1500);

          } else {
            throw new Error(res.message || "Failed processing CSV");
          }
        } catch (err: any) {
          if (err.name === 'AbortError' || isAborted) {
            addLog({
              message: `[CANCEL] Process aborted by user. Ingestion pipeline terminated.`,
              type: 'warning'
            });
            return;
          }

          const errorMsg = err.message || (err.error && err.error.message) || String(err);
          addLog({
            message: `[ERROR] Extraction failed: ${errorMsg}`,
            type: 'error'
          });
          failProcessing(errorMsg);
        }
      };

      runProcess();

    // Cleanup on unmount
    return () => {
      clearTimeout(uploadTimer);
      clearTimeout(logsTimer1);
      clearTimeout(logsTimer2);
      clearTimeout(logsTimer3);
    };
  }, [status]);

  const percentage = totalRows > 0 ? (processedRows / totalRows) * 100 : 0;

  const handleCancelConfirm = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    cancelProcessing("Cancelled by user");
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

        {/* Progress row containing ring and progress bar */}
        <div className="p-4 bg-card rounded-2xl border border-border shadow-sm flex flex-col md:flex-row items-center gap-4 select-none">
          <ProgressRing progress={percentage} size={70} strokeWidth={6} className="shrink-0" />
          <div className="flex-1 flex flex-col gap-2.5 w-full">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-muted-foreground">Pipeline Ingestion Progress</span>
              <span className="text-foreground font-mono font-bold">
                {processedRows} / {totalRows} Rows
              </span>
            </div>
            <ProgressBar progress={percentage} />
          </div>
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
          <p className="text-lg md:text-xl font-bold font-mono text-foreground">Sequential</p>
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
