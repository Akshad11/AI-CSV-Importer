'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUploadStore, usePreviewStore, useImportStore, useSettingsStore } from '../../store';
import { CSVPreviewTable } from '../../components/preview/CSVPreviewTable';
import { SummaryCard } from '../../components/preview/SummaryCard';
import { PageContainer } from '../../components/common/PageContainer';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { AlertCircle, ArrowLeft, Play, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function PreviewPage() {
  const router = useRouter();
  const { fileMeta } = useUploadStore();
  const { columnMappings } = usePreviewStore();
  const { startProcessing } = useImportStore();
  const { settings, availableProviders } = useSettingsStore();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // Redirect to import if no file is uploaded
  useEffect(() => {
    if (!fileMeta) {
      router.replace('/import');
    }
  }, [fileMeta, router]);

  if (!fileMeta) return null;

  const handleConfirm = () => {
    // Calculate total batches based on rows count (e.g. 50 records per batch)
    const totalRows = fileMeta.rows;
    const batchSize = 50;
    const totalBatches = Math.ceil(totalRows / batchSize);

    // Initialize Zustand processing store
    startProcessing(totalRows, totalBatches);

    // Close Dialog and route to processing screen
    setIsConfirmDialogOpen(false);
    router.push('/processing');
  };

  const mappedCount = Object.values(columnMappings).filter((v) => v !== '').length;

  return (
    <PageContainer>
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Link href="/import" className="inline-flex items-center gap-1 text-xs font-semibold hover:underline">
              <ArrowLeft className="h-3 w-3" />
              Change File
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Review Mapping</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Preview source records and confirm column mapping fields for the AI pipeline.
          </p>
        </div>
      </div>

      {/* Grid: Preview & Summary */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-4 items-start">
        {/* Main Preview Table (col-span-3) */}
        <div className="lg:col-span-3 w-full">
          <CSVPreviewTable />
        </div>

        {/* Summary Card (col-span-1) */}
        <div className="lg:col-span-1 w-full h-full lg:sticky lg:top-24">
          <SummaryCard onConfirm={() => setIsConfirmDialogOpen(true)} />
        </div>
      </div>

      {/* Confirmation Dialog overlay */}
      <Dialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        title="Initiate Ingestion Pipeline"
        description="Verify columns mapping before triggering AI extraction."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
              className="w-full sm:w-auto text-muted-foreground hover:text-foreground border-border"
            >
              Adjust mapping
            </Button>
            <Button
              onClick={handleConfirm}
              className="w-full sm:w-auto shadow-md shadow-primary/10"
              disabled={!availableProviders[settings.aiProvider]}
            >
              <Play className="h-4.5 w-4.5 mr-1.5 fill-current" />
              Start AI Processing
            </Button>
          </>
        }
      >
        <div className="space-y-4 font-sans text-sm select-none">
          <div className="p-4 rounded-xl bg-secondary border border-border space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">File Ingestion</span>
              <span className="font-semibold text-foreground">{fileMeta.name}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Total Rows</span>
              <span className="font-semibold text-foreground">{fileMeta.rows} records</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Mapped Columns</span>
              <span className="font-semibold text-foreground">
                {mappedCount} of {fileMeta.columns} columns
              </span>
            </div>
          </div>

          <div className="flex gap-3 p-3 rounded-xl bg-accent/40 border border-border text-accent-foreground">
            <Sparkles className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-xs">AI Extraction Pipeline Activated</span>
              <p className="text-xs leading-relaxed mt-0.5 opacity-90">
                AI extraction parses raw cell text, recognizes formatting anomalies, and structures names, numbers and sources according to CRM specifications.
              </p>
            </div>
          </div>
        </div>
      </Dialog>
    </PageContainer>
  );
}
