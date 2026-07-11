'use client';

import React from 'react';
import { useUploadStore, usePreviewStore, useSettingsStore } from '../../store';
import { FileSpreadsheet, X, ArrowRight, Activity, Calendar, AlertTriangle } from 'lucide-react';
import { formatBytes, formatDate } from '../../utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export function FileCard() {
  const router = useRouter();
  const { fileMeta, clearFile } = useUploadStore();
  const { clearPreview } = usePreviewStore();
  const { settings, availableProviders } = useSettingsStore();

  if (!fileMeta) return null;

  const handleRemove = () => {
    clearFile();
    clearPreview();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-5 border border-border bg-card rounded-2xl shadow-sm flex flex-col gap-5 select-none relative"
    >
      {/* Remove Button */}
      <button
        onClick={handleRemove}
        className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Remove uploaded file"
      >
        <X className="h-4.5 w-4.5" />
      </button>

      <div className="flex items-start gap-4">
        {/* Excel Icon Container */}
        <div className="h-12 w-12 rounded-xl bg-success/10 text-success flex items-center justify-center shadow-inner shrink-0">
          <FileSpreadsheet className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1 pr-6">
          <h4 className="font-bold text-foreground truncate" title={fileMeta.name}>
            {fileMeta.name}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground font-mono">
            <span>{formatBytes(fileMeta.size)}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(fileMeta.uploadDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Attributes Grid */}
      <div className="grid grid-cols-2 gap-4 bg-secondary p-4 rounded-xl border border-border">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Total Data Rows
          </span>
          <span className="text-lg font-bold text-foreground mt-0.5">
            {fileMeta.rows}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Calculated Columns
          </span>
          <span className="text-lg font-bold text-foreground mt-0.5">
            {fileMeta.columns}
          </span>
        </div>
      </div>

      {/* API Key integration warning alert */}
      {!availableProviders[settings.aiProvider] && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs leading-relaxed">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">AI Pipeline Disabled</span>
            <p className="mt-0.5 text-destructive/80">
              Your API Key or Local AI is not integrated for {settings.aiProvider === 'openai' ? 'ChatGPT' : settings.aiProvider === 'gemini' ? 'Gemini' : settings.aiProvider === 'openrouter' ? 'OpenRouter' : 'Local Llama'}. Please configure it in your environment.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4 mt-1">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span className="text-[11px] font-mono font-medium text-muted-foreground">
            Structure check passed
          </span>
        </div>

        <Button
          onClick={() => router.push('/preview')}
          className="shadow-md shadow-primary/10"
          size="sm"
          disabled={!availableProviders[settings.aiProvider]}
        >
          Mapping configuration
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </div>
    </motion.div>
  );
}
export default FileCard;
