import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useId, useState } from 'react';
import { usePrefersReducedMotion } from './useReducedMotion.js';

// ============================================================================
// TIMELINE, TOOLTIP & TOAST FEEDBACK
// ============================================================================
interface TimelineItem {
  title: string;
  description: string;
  time: string;
  icon?: React.ReactNode;
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="space-y-6 text-left relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-700">
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-4 relative">
          <div className="h-7 w-7 rounded-full bg-white dark:bg-slate-800 border-2 border-brand text-brand flex items-center justify-center shrink-0 z-10 shadow-none">
            {item.icon || <Info className="h-3.5 w-3.5" />}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-150">{item.title}</h4>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                {item.time}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  // `group-hover` alone is invisible to keyboard users: nothing here ever receives focus, so the
  // tooltip can never appear without a mouse. Making the wrapper itself a (0) tab stop with
  // `group-focus-within` and `aria-describedby` surfaces the same text on Tab, and to a screen
  // reader, as it does on hover.
  const tooltipId = useId();
  return (
    <div
      aria-describedby={tooltipId}
      className="relative group inline-block outline-none rounded-md focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
    >
      {children}
      <div
        id={tooltipId}
        role="tooltip"
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 dark:bg-slate-950 text-white text-[10px] font-semibold rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity whitespace-nowrap z-50"
      >
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-950" />
      </div>
    </div>
  );
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return { toasts, showToast };
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const reduceMotion = usePrefersReducedMotion();
  return (
    // `aria-live="polite"` + `role="status"` announce new toasts to screen readers; without it a
    // toast is a purely visual event that a non-sighted user would never learn happened.
    <div
      aria-live="polite"
      role="status"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : undefined}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduceMotion
                ? { opacity: 0, transition: { duration: 0 } }
                : { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
            }
            className={`p-4 rounded-xl border shadow-lg flex items-start gap-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 pointer-events-auto ${
              toast.type === 'success'
                ? 'border-green-200 bg-green-50/50 dark:border-green-900/40 dark:bg-green-950/20'
                : toast.type === 'error'
                  ? 'border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20'
                  : 'border-slate-200 bg-white dark:border-slate-700'
            }`}
          >
            {toast.type === 'success' && (
              <CheckCircle
                aria-hidden="true"
                className="h-5 w-5 text-green-600 dark:text-green-450 shrink-0 mt-0.5"
              />
            )}
            {toast.type === 'error' && (
              <AlertCircle
                aria-hidden="true"
                className="h-5 w-5 text-red-600 dark:text-red-450 shrink-0 mt-0.5"
              />
            )}
            {toast.type === 'info' && (
              <Info
                aria-hidden="true"
                className="h-5 w-5 text-brand-ink dark:text-brand dark:text-blue-450 shrink-0 mt-0.5"
              />
            )}
            <span className="text-xs font-semibold leading-relaxed flex-1">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
