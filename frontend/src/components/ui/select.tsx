import * as React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string }>;
  label?: string;
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none">
            {label}
          </label>
        )}
        <div className="relative w-full flex items-center">
          <select
            className={cn(
              'flex h-10 w-full appearance-none rounded-xl border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all select-none',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            ref={ref}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-popover text-popover-foreground">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none select-none" />
        </div>
        {error && <span className="text-xs text-destructive font-mono mt-0.5">{error}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
