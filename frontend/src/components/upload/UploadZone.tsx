'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion } from 'framer-motion';
import { UploadCloud, AlertCircle, RefreshCw } from 'lucide-react';
import { APP_CONFIG } from '../../config';
import { formatBytes } from '../../utils';
import { parseCsvFile } from '../../utils/parseCsvContent';
import { cn } from '../../lib/utils';
import { useUploadStore, usePreviewStore } from '../../store';

interface UploadZoneProps {
  onSuccess: () => void;
}

export function UploadZone({ onSuccess }: UploadZoneProps) {
  const { setFile, setUploadError, uploadError, isUploading, setUploading } = useUploadStore();
  const { setPreviewData } = usePreviewStore();
  const [parseProgress, setParseProgress] = useState(0);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      // Clear previous errors
      setUploadError(null);

      // Handle Rejections first
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        const errorMsg = rejection.errors[0]?.message || 'Invalid file type.';
        if (rejection.file.size > APP_CONFIG.maxFileSize) {
          setUploadError(`File is too large. Maximum size is ${formatBytes(APP_CONFIG.maxFileSize)}.`);
        } else {
          setUploadError(errorMsg);
        }
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      setUploading(true);

      parseCsvFile(file, {
        onProgress: (pct) => setParseProgress(pct),
        onSuccess: (result) => {
          setFile(file, {
            name: file.name,
            size: file.size,
            rows: result.totalRows,
            columns: result.columnsCount,
            headers: result.headers,
            encoding: 'UTF-8',
            delimiter: result.delimiter,
          });

          setPreviewData(result.allRows, result.delimiter, 'UTF-8', result.mapping);
          setUploading(false);
          onSuccess();
        },
        onError: (msg) => {
          setUploadError(msg);
          setUploading(false);
        },
      });
    },
    [setFile, setUploadError, setUploading, setPreviewData, onSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxSize: APP_CONFIG.maxFileSize,
    multiple: false,
    disabled: isUploading,
  });

  return (
    <div className="flex flex-col gap-4 w-full select-none">
      <div {...getRootProps()} className="focus:outline-none w-full">
        <motion.div
          className={cn(
            'border-2 border-dashed rounded-2xl p-10 md:p-16 text-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-ring flex flex-col items-center justify-center min-h-[320px]',
            isDragActive
              ? 'border-primary bg-primary/10 scale-[1.01]'
              : 'border-border hover:border-primary/80 bg-card'
          )}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
        >
          <input {...getInputProps()} />

          {isUploading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center">
              <RefreshCw className="h-10 w-10 text-primary animate-spin" />
            </div>
            <div>
              <h4 className="text-base font-bold text-foreground">Analyzing CSV Data</h4>
              <p className="text-xs text-muted-foreground mt-1">Reading headers and structural schemas ({parseProgress}%)</p>
            </div>
            <div className="h-1.5 w-36 rounded-full bg-secondary overflow-hidden border border-border">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${parseProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className={cn(
              'h-12 w-12 rounded-2xl bg-secondary border border-border text-muted-foreground flex items-center justify-center mb-6 shadow-sm',
              isDragActive && 'bg-primary/10 border-primary/20 text-primary'
            )}>
              <UploadCloud className="h-6 w-6" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-foreground">
              {isDragActive ? 'Drop the file here' : 'Drop your CSV file here'}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
              Drag and drop your spreadsheet, or click to browse files locally.
            </p>
            <span className="text-[10px] text-muted-foreground font-mono mt-8 border border-border px-2 py-1 rounded bg-muted">
              Supports .csv files up to {formatBytes(APP_CONFIG.maxFileSize)}
            </span>
          </div>
        )}
      </motion.div>
      </div>

      {/* Error state */}
      {uploadError && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Validation Error</span>
            <p className="text-xs mt-0.5 leading-relaxed text-destructive">{uploadError}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
export default UploadZone;
