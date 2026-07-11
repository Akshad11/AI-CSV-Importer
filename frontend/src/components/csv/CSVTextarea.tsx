'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';

const PLACEHOLDER = `Name,Email,Phone,Company
John Doe,john@example.com,9876543210,Acme Corp
Jane Doe,jane@example.com,9988776655,Tech Inc
Bob Smith,bob@example.com,8877665544,Startup Ltd`;

interface CSVTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onPaste?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function CSVTextarea({
  value,
  onChange,
  onPaste,
  disabled,
  className,
  'aria-label': ariaLabel,
}: CSVTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height to content (up to a max)
  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    // min 280px, max 560px — keeps UI usable for small and huge data
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 280), 560)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Let the native paste happen first, then call onPaste callback
    if (onPaste) {
      // Use setTimeout(0) so React has committed the new value
      setTimeout(() => {
        if (textareaRef.current) {
          onPaste(textareaRef.current.value);
        }
      }, 0);
    }
  };

  // Character / row / column counters derived from value
  const charCount = value.length;
  const lines = value ? value.split('\n') : [];
  const rowCount = Math.max(0, lines.length - 1); // minus header row
  const colCount =
    lines.length > 0 ? lines[0].split(/[,;\t|]/).length : 0;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Textarea */}
      <div
        className={cn(
          'relative rounded-2xl border border-border bg-card transition-all duration-200 overflow-hidden',
          'focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15',
          disabled && 'opacity-60 pointer-events-none'
        )}
      >
        <textarea
          ref={textareaRef}
          id="csv-paste-textarea"
          value={value}
          onChange={handleChange}
          onPaste={handlePaste}
          disabled={disabled}
          placeholder={PLACEHOLDER}
          aria-label={ariaLabel ?? 'Paste CSV content here'}
          aria-multiline="true"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
          wrap="off"
          className={cn(
            // Layout
            'w-full resize-none min-h-[280px] max-h-[560px] overflow-auto',
            // Typography — monospace, consistent line-height
            'font-mono text-sm leading-6',
            // Colors
            'bg-transparent text-foreground placeholder:text-muted-foreground/40',
            // Padding — leave room for the line-number gutter feel
            'px-4 py-4',
            // Focus ring handled by parent wrapper
            'outline-none border-none',
            // Horizontal scroll for wide CSVs
            'whitespace-pre overflow-x-auto',
            // Smooth scrolling
            'scroll-smooth'
          )}
          style={{ tabSize: 4 }}
        />

        {/* Subtle top gradient fade when content overflows */}
        {value.split('\n').length > 14 && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent" />
        )}
      </div>

      {/* Counters row */}
      <div className="flex items-center justify-between px-1 select-none" aria-live="polite" aria-atomic="true">
        <div className="flex items-center gap-4 text-[11px] font-mono text-muted-foreground">
          <span>
            <span className="text-foreground font-semibold">{charCount.toLocaleString()}</span>
            {' '}chars
          </span>
          <span>
            <span className="text-foreground font-semibold">{rowCount.toLocaleString()}</span>
            {' '}rows
          </span>
          <span>
            <span className="text-foreground font-semibold">{colCount}</span>
            {' '}cols
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">
          Ctrl+V / ⌘V to paste
        </span>
      </div>
    </div>
  );
}

export default CSVTextarea;
