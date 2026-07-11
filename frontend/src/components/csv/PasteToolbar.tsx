'use client';

import React, { useState } from 'react';
import { Clipboard, Trash2, ShieldCheck, Copy, FileDown } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

const SAMPLE_CSV = `Name,Email,Phone,Company,City,Country
John Doe,john.doe@acme.com,9876543210,Acme Corp,New York,USA
Jane Smith,jane.smith@tech.io,9988776655,Tech Inc,London,UK
Bob Johnson,bob.j@startup.dev,8877665544,Startup Ltd,Bangalore,India
Alice Brown,alice.b@enterprise.co,7766554433,Enterprise Co,Sydney,Australia
Charlie Wilson,charlie.w@global.net,6655443322,Global Net,Toronto,Canada`;

interface PasteToolbarProps {
  hasContent: boolean;
  isParsing: boolean;
  onClear: () => void;
  onValidate: () => void;
  onLoadSample: (csv: string) => void;
  onPasteFromClipboard: (text: string) => void;
  className?: string;
}

export function PasteToolbar({
  hasContent,
  isParsing,
  onClear,
  onValidate,
  onLoadSample,
  onPasteFromClipboard,
  className,
}: PasteToolbarProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [isPasting, setIsPasting] = useState(false);

  const handleCopyExample = async () => {
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(SAMPLE_CSV);
      toast.success('Example CSV copied to clipboard!', {
        description: 'Paste it into the textarea using Ctrl+V or ⌘V.',
      });
    } catch {
      toast.error('Could not access clipboard', {
        description: 'Please copy the example manually.',
      });
    } finally {
      setIsCopying(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      setIsPasting(true);
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast.warning('Clipboard is empty', {
          description: 'Copy some CSV content first, then try again.',
        });
        return;
      }
      onPasteFromClipboard(text);
      toast.success('Content pasted from clipboard!');
    } catch {
      toast.error('Could not read clipboard', {
        description: 'Please paste manually using Ctrl+V or ⌘V in the text area.',
      });
    } finally {
      setIsPasting(false);
    }
  };

  const handleLoadSample = () => {
    onLoadSample(SAMPLE_CSV);
    toast.success('Sample CSV loaded!', {
      description: `${SAMPLE_CSV.split('\n').length - 1} sample rows loaded.`,
    });
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2',
        className
      )}
      role="toolbar"
      aria-label="CSV paste tools"
    >
      {/* Paste from clipboard */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePasteFromClipboard}
        disabled={isParsing || isPasting}
        aria-label="Paste CSV from clipboard"
        className="gap-1.5"
      >
        <Clipboard className="h-3.5 w-3.5" />
        {isPasting ? 'Pasting…' : 'Paste from Clipboard'}
      </Button>

      {/* Load sample */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleLoadSample}
        disabled={isParsing}
        aria-label="Load sample CSV data"
        className="gap-1.5"
      >
        <FileDown className="h-3.5 w-3.5" />
        Load Sample
      </Button>

      {/* Copy example to clipboard */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopyExample}
        disabled={isCopying}
        aria-label="Copy example CSV format to clipboard"
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <Copy className="h-3.5 w-3.5" />
        {isCopying ? 'Copying…' : 'Copy Example'}
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Validate */}
      <Button
        variant="outline"
        size="sm"
        onClick={onValidate}
        disabled={!hasContent || isParsing}
        aria-label="Validate CSV content"
        className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Validate
      </Button>

      {/* Clear */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        disabled={!hasContent || isParsing}
        aria-label="Clear all CSV content"
        className="gap-1.5 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Clear All
      </Button>
    </div>
  );
}

export default PasteToolbar;
