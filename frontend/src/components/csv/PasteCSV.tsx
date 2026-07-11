'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardPaste, RefreshCw, ArrowRight, Activity, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { useUploadStore, usePreviewStore, useSettingsStore } from '../../store';
import { parseCsvText, detectDelimiter } from '../../utils/parseCsvContent';
import { Button } from '../ui/button';
import { CSVTextarea } from './CSVTextarea';
import { PasteToolbar } from './PasteToolbar';
import { DetectedInfo } from './DetectedInfo';
import { CSVValidation, ValidationMessage } from './CSVValidation';
import { cn } from '../../lib/utils';

// ─── Validation logic ─────────────────────────────────────────────────────────

function validateCsvText(text: string): ValidationMessage[] {
  const messages: ValidationMessage[] = [];

  if (!text.trim()) {
    messages.push({
      id: 'empty',
      severity: 'error',
      title: 'Input is empty',
      detail: 'Paste or type CSV content into the textarea above.',
    });
    return messages;
  }

  const lines = text.trim().split('\n').filter((l) => l.trim() !== '');

  if (lines.length < 2) {
    messages.push({
      id: 'min-rows',
      severity: 'error',
      title: 'Minimum 2 rows required',
      detail: 'The first row should be the header, followed by at least one data row.',
    });
  }

  // Delimiter detection
  const delimiters = [',', ';', '\t', '|'];
  const firstLine = lines[0] ?? '';
  const hasDelimiter = delimiters.some((d) => firstLine.includes(d));
  if (!hasDelimiter) {
    messages.push({
      id: 'no-delimiter',
      severity: 'error',
      title: 'No delimiter detected',
      detail: 'Could not find a comma, semicolon, tab, or pipe in the first row. Make sure your data is separated.',
    });
  }

  // Header check
  const detectedDelim = detectDelimiter(text);
  const headers = firstLine.split(detectedDelim).map((h) => h.trim());

  const blankHeaders = headers.filter((h) => h === '');
  if (blankHeaders.length > 0) {
    messages.push({
      id: 'blank-headers',
      severity: 'warning',
      title: `${blankHeaders.length} blank header(s) detected`,
      detail: 'Columns without names will be imported as unmapped fields.',
    });
  }

  const headerSet = new Set<string>();
  const duplicates: string[] = [];
  headers.forEach((h) => {
    if (h && headerSet.has(h)) duplicates.push(h);
    headerSet.add(h);
  });
  if (duplicates.length > 0) {
    messages.push({
      id: 'dup-headers',
      severity: 'warning',
      title: `Duplicate header(s): ${duplicates.join(', ')}`,
      detail: 'Duplicate column names may cause unexpected import behaviour.',
    });
  }

  // Consistent column count
  const headerCount = headers.length;
  const inconsistentRows: number[] = [];
  lines.slice(1, 20).forEach((line, i) => {
    const cols = line.split(detectedDelim).length;
    if (Math.abs(cols - headerCount) > 1) inconsistentRows.push(i + 2);
  });
  if (inconsistentRows.length > 0) {
    messages.push({
      id: 'inconsistent-cols',
      severity: 'warning',
      title: `Inconsistent column count on rows: ${inconsistentRows.slice(0, 5).join(', ')}`,
      detail: 'Some rows have a different number of columns than the header. They may be skipped during import.',
    });
  }

  // Large data warning
  const rowCount = lines.length - 1;
  if (rowCount > 5000) {
    messages.push({
      id: 'large-data',
      severity: 'info',
      title: `Large dataset: ${rowCount.toLocaleString()} rows detected`,
      detail: 'Parsing may take a moment. The UI will remain responsive.',
    });
  }

  // All good
  if (messages.length === 0) {
    messages.push({
      id: 'valid',
      severity: 'success',
      title: 'CSV structure looks great!',
      detail: `${rowCount} data rows and ${headerCount} columns detected. Ready to proceed.`,
    });
  }

  return messages;
}

// ─── PasteCSV ─────────────────────────────────────────────────────────────────

export function PasteCSV() {
  const router = useRouter();
  const { setFile, setUploading, setUploadError, isUploading } = useUploadStore();
  const { setPreviewData } = usePreviewStore();
  const { settings, availableProviders } = useSettingsStore();

  const [csvText, setCsvText] = useState('');
  const [validationMessages, setValidationMessages] = useState<ValidationMessage[]>([]);
  const [isParsed, setIsParsed] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);

  // Live detected stats (from quick text analysis, before full parse)
  const [liveStats, setLiveStats] = useState({ rows: 0, cols: 0, delimiter: ',' });

  // Debounce ref for auto-detect
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Quick stats from raw text (no full parse — just count lines/cols)
  const computeLiveStats = useCallback((text: string) => {
    if (!text.trim()) {
      setLiveStats({ rows: 0, cols: 0, delimiter: ',' });
      return;
    }
    const lines = text.trim().split('\n').filter((l) => l.trim());
    const del = detectDelimiter(text);
    const cols = lines[0] ? lines[0].split(del).length : 0;
    setLiveStats({ rows: Math.max(0, lines.length - 1), cols, delimiter: del });
  }, []);

  const handleTextChange = useCallback(
    (text: string) => {
      setCsvText(text);
      setIsParsed(false);
      setValidationMessages([]);

      // Debounced live stats
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => computeLiveStats(text), 150);
    },
    [computeLiveStats]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handlePaste = useCallback(
    (text: string) => {
      handleTextChange(text);
      // Auto-parse on paste
      handleParse(text);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleParse = useCallback(
    (textOverride?: string) => {
      const text = textOverride ?? csvText;
      if (!text.trim()) {
        setValidationMessages([
          { id: 'empty', severity: 'error', title: 'Input is empty', detail: 'Paste or type some CSV content first.' },
        ]);
        return;
      }

      setIsParsing(true);
      setParseProgress(10);
      setUploadError(null);

      parseCsvText(text, {
        onProgress: (pct) => setParseProgress(pct),
        onSuccess: (result) => {
          // Generate a virtual File from the text blob so the existing flow works
          const blob = new Blob([text], { type: 'text/csv' });
          const virtualFile = new File([blob], 'pasted-data.csv', { type: 'text/csv' });

          setFile(virtualFile, {
            name: 'pasted-data.csv',
            size: blob.size,
            rows: result.totalRows,
            columns: result.columnsCount,
            headers: result.headers,
            encoding: 'UTF-8',
            delimiter: result.delimiter,
          });

          setPreviewData(result.allRows, result.delimiter, 'UTF-8', result.mapping);

          setIsParsed(true);
          setIsParsing(false);
          setParseProgress(100);

          toast.success(`CSV parsed successfully!`, {
            description: `${result.totalRows.toLocaleString()} rows · ${result.columnsCount} columns · delimiter: "${result.delimiter}"`,
          });
        },
        onError: (msg) => {
          setUploadError(msg);
          setIsParsing(false);
          setParseProgress(0);
          toast.error('Parsing failed', { description: msg });
        },
      });
    },
    [csvText, setFile, setPreviewData, setUploadError]
  );

  const handleValidate = useCallback(() => {
    const msgs = validateCsvText(csvText);
    setValidationMessages(msgs);

    const hasErrors = msgs.some((m) => m.severity === 'error');
    if (!hasErrors && csvText.trim()) {
      // Trigger parse after successful validation
      handleParse();
    }
  }, [csvText, handleParse]);

  const handleClear = useCallback(() => {
    setCsvText('');
    setValidationMessages([]);
    setIsParsed(false);
    setParseProgress(0);
    setLiveStats({ rows: 0, cols: 0, delimiter: ',' });
    toast.info('Cleared', { description: 'All pasted content has been removed.' });
  }, []);

  const handleLoadSample = useCallback(
    (sample: string) => {
      setCsvText(sample);
      computeLiveStats(sample);
      setIsParsed(false);
      setValidationMessages([]);
    },
    [computeLiveStats]
  );

  const handlePasteFromClipboard = useCallback(
    (text: string) => {
      setCsvText(text);
      computeLiveStats(text);
      handleParse(text);
    },
    [computeLiveStats, handleParse]
  );

  const showStats = liveStats.rows > 0 || liveStats.cols > 0;

  return (
    <div className="flex flex-col gap-4 w-full select-none">
      {/* Header card */}
      <div className="flex flex-col gap-1.5 p-5 rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2.5 text-foreground mb-1">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <ClipboardPaste className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Paste CSV Content</h3>
            <p className="text-xs text-muted-foreground">
              Paste your CSV data directly. Auto-detection finds the delimiter, maps columns, and prepares your import.
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <PasteToolbar
          hasContent={csvText.trim().length > 0}
          isParsing={isParsing}
          onClear={handleClear}
          onValidate={handleValidate}
          onLoadSample={handleLoadSample}
          onPasteFromClipboard={handlePasteFromClipboard}
          className="mt-1"
        />
      </div>

      {/* Textarea */}
      <CSVTextarea
        value={csvText}
        onChange={handleTextChange}
        onPaste={handlePaste}
        disabled={isParsing || isUploading}
        aria-label="CSV paste input area"
      />

      {/* Parsing progress overlay */}
      <AnimatePresence>
        {isParsing && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card shadow-sm"
          >
            <RefreshCw className="h-4 w-4 text-primary animate-spin shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Parsing CSV…</p>
              <p className="text-xs text-muted-foreground">Reading headers and row structure ({parseProgress}%)</p>
            </div>
            <div className="h-1.5 w-24 rounded-full bg-secondary overflow-hidden border border-border">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${parseProgress}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detected info */}
      <AnimatePresence>
        {showStats && !isParsing && (
          <DetectedInfo
            rowCount={liveStats.rows}
            columnCount={liveStats.cols}
            delimiter={liveStats.delimiter}
            charCount={csvText.length}
          />
        )}
      </AnimatePresence>

      {/* Validation messages */}
      <CSVValidation messages={validationMessages} />

      {/* Success / Proceed card */}
      <AnimatePresence>
        {isParsed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="p-4 border border-border bg-card rounded-2xl shadow-sm flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              {!availableProviders[settings.aiProvider] ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                  <span className="text-xs font-medium text-destructive">
                    AI pipeline not configured for {settings.aiProvider}
                  </span>
                </>
              ) : (
                <>
                  <Activity className="h-3.5 w-3.5 text-primary animate-pulse" />
                  <span className="text-[11px] font-mono font-medium text-muted-foreground">
                    Structure check passed · ready to map
                  </span>
                </>
              )}
            </div>

            <Button
              onClick={() => router.push('/preview')}
              size="sm"
              className="shadow-md shadow-primary/10 shrink-0"
              disabled={!availableProviders[settings.aiProvider]}
            >
              Mapping configuration
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PasteCSV;
