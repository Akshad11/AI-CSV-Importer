'use client';

import React, { useMemo } from 'react';
import { useUploadStore, usePreviewStore, useSettingsStore } from '../../store';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { FileSpreadsheet, Check, X, AlertTriangle, Sparkles, IndianRupee, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatBytes } from '../../utils';

interface SummaryCardProps {
  onConfirm: () => void;
}

export function SummaryCard({ onConfirm }: SummaryCardProps) {
  const router = useRouter();
  const { fileMeta } = useUploadStore();
  const { columnMappings } = usePreviewStore();
  const { settings, availableProviders } = useSettingsStore();

  // Calculate estimated parameters
  const estimatedCost = useMemo(() => {
    if (!fileMeta) return 0;
    let costPerRowUsd = 0.0;
    if (settings.aiProvider === 'openai') {
      costPerRowUsd = 0.0005;
    } else if (settings.aiProvider === 'gemini') {
      costPerRowUsd = 0.00015;
    } else if (settings.aiProvider === 'ollama') {
      costPerRowUsd = 0.0;
    } else {
      costPerRowUsd = 0.0001;
    }
    const costInUsd = fileMeta.rows * costPerRowUsd;
    return costInUsd * 83.0; // Conversion rate: 1 USD = 83 INR
  }, [fileMeta, settings.aiProvider]);

  const estimatedTime = useMemo(() => {
    if (!fileMeta) return 0;
    // Approx 1 batch of 50 takes 3 seconds
    const batches = Math.ceil(fileMeta.rows / 50);
    return Math.max(3, batches * 2.5);
  }, [fileMeta]);

  // Check if critical fields are mapped
  const mappedFields = Object.values(columnMappings);
  const hasEmail = mappedFields.includes('email');
  const mappedCount = mappedFields.filter((f) => f !== '').length;

  if (!fileMeta) return null;

  return (
    <Card className="shadow-sm flex flex-col justify-between h-full font-sans select-none">
      <CardHeader className="pb-3 border-b border-border mb-4 bg-muted/30">
        <div className="flex items-center gap-2 text-primary">
          <FileSpreadsheet className="h-5 w-5" />
          <CardTitle className="text-base font-bold text-foreground">
            Import Summary
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between gap-6">
        <div className="space-y-4">
          {/* File Attributes list */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border">
              <span className="text-muted-foreground font-medium">File Name</span>
              <span className="font-semibold text-foreground truncate max-w-[150px]" title={fileMeta.name}>
                {fileMeta.name}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border">
              <span className="text-muted-foreground font-medium">File Size</span>
              <span className="font-semibold text-foreground">
                {formatBytes(fileMeta.size)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border">
              <span className="text-muted-foreground font-medium">Total Rows</span>
              <span className="font-semibold text-foreground">
                {fileMeta.rows}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border">
              <span className="text-muted-foreground font-medium">Delimiter / Encoding</span>
              <span className="font-mono font-semibold text-foreground">
                {fileMeta.delimiter === '\t' ? 'TAB' : `"${fileMeta.delimiter || ','}"`} / {fileMeta.encoding || 'UTF-8'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border">
              <span className="text-muted-foreground font-medium">Mapped Columns</span>
              <span className="font-semibold text-primary">
                {mappedCount} of {fileMeta.columns}
              </span>
            </div>
          </div>

          {/* AI Metrics Card */}
          <div className="p-3 bg-accent/40 border border-border rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-primary font-semibold text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Extraction Estimates</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Duration</span>
                  <span className="text-xs font-bold text-foreground">
                    ~{estimatedTime.toFixed(0)}s
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Estimated Cost</span>
                  <span className="text-xs font-bold text-foreground">
                    ₹{estimatedCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          {!hasEmail && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl border border-warning/20 bg-warning/10 text-warning text-xs leading-relaxed">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Missing Email Mapping</span>
                <p className="mt-0.5 text-warning/80">
                  Email is the primary key for lead matching. Rows without mapped emails will be skipped.
                </p>
              </div>
            </div>
          )}

          {/* AI Provider key warning banner */}
          {!availableProviders[settings.aiProvider] && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs leading-relaxed font-sans">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Provider Not Integrated</span>
                <p className="mt-0.5 text-destructive/80">
                  Your API Key or Local AI is not integrated for {settings.aiProvider === 'openai' ? 'ChatGPT' : settings.aiProvider === 'gemini' ? 'Gemini' : 'Local Llama'}.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Panel */}
        <div className="flex flex-col gap-2.5 pt-4 border-t border-border">
          <Button
            onClick={onConfirm}
            className="w-full shadow-md shadow-primary/10"
            disabled={mappedCount === 0 || !availableProviders[settings.aiProvider]}
          >
            <Check className="h-4.5 w-4.5 mr-1.5" />
            Confirm Import
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/import')}
            className="w-full text-muted-foreground hover:text-foreground border-border"
          >
            <X className="h-4.5 w-4.5 mr-1.5" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
export default SummaryCard;
