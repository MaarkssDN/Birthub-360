import React from 'react';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <section
      role="status"
      aria-live="polite"
      data-testid="canonical-empty-state"
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 p-8 text-center"
    >
      <div
        aria-hidden="true"
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
      >
        {icon ?? '✦'}
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          data-testid="empty-state-primary-action"
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 focus-visible:ring-2"
        >
          {actionLabel}
        </button>
      )}
    </section>
  );
};
