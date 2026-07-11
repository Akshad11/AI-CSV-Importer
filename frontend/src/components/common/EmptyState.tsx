import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      {icon && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-full mb-4 shadow-inner">
          {icon}
        </div>
      )}
      <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-50">{title}</h3>
      <p className="text-xs md:text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
export default EmptyState;
