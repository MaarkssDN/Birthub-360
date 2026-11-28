import React from 'react';

// ============================================================================
// TABLE COMPONENT
// ============================================================================
export function Table({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-full overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-850 shadow-sm ${className}`}
    >
      <table className="w-full text-sm text-left border-collapse">{children}</table>
    </div>
  );
}

export function TableHead({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <thead
      className={`bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-750 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider ${className}`}
    >
      {children}
    </thead>
  );
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function TableRow({ children, className = '', onClick }: TableRowProps) {
  return (
    <tr
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
      onClick={onClick}
      className={`border-b last:border-0 border-slate-150 dark:border-slate-750 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className = '',
  isHeader = false,
}: {
  children: React.ReactNode;
  className?: string;
  isHeader?: boolean;
}) {
  if (isHeader) {
    return (
      <th className={`px-6 py-4 font-bold text-slate-600 dark:text-slate-400 ${className}`}>
        {children}
      </th>
    );
  }
  return (
    <td className={`px-6 py-4 text-slate-750 dark:text-slate-300 font-medium ${className}`}>
      {children}
    </td>
  );
}
