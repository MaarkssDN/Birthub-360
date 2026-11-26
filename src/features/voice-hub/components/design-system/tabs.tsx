import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useId } from 'react';
import { useSessionStore } from '../../store/useSessionStore.js';
import { colors, getAccessibleBrandForeground } from '../tokens.js';
import { usePrefersReducedMotion } from './useReducedMotion.js';

// ============================================================================
// TABS SYSTEM & BREADCRUMBS
// ============================================================================
interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className = '',
}: {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const tablistId = useId();
  const brandColor = useSessionStore((state: any) => state.brandColor);
  const brandTextOnLight = getAccessibleBrandForeground(brandColor, colors.light.surface);
  const brandTextOnDark = getAccessibleBrandForeground(brandColor, colors.dark.surface);
  const reduceMotion = usePrefersReducedMotion();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End')
      return;
    e.preventDefault();
    let nextIndex = index;
    if (e.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = tabs.length - 1;
    const nextTab = tabs[nextIndex];
    onChange(nextTab.id);
    document.getElementById(`${tablistId}-tab-${nextTab.id}`)?.focus();
  };

  return (
    <div
      role="tablist"
      className={`flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-hide gap-1 ${className}`}
    >
      {tabs.map((tab, index) => {
        const isSelected = tab.id === activeTab;
        return (
          <button
            type="button"
            key={tab.id}
            id={`${tablistId}-tab-${tab.id}`}
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            style={
              isSelected
                ? ({
                    '--brand-fg-light': brandTextOnLight,
                    '--brand-fg-dark': brandTextOnDark,
                  } as React.CSSProperties)
                : undefined
            }
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold transition-all relative whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 rounded-t-md ${
              isSelected
                ? 'text-[var(--brand-fg-light)] dark:text-[var(--brand-fg-dark)]'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-250'
            }`}
          >
            {tab.icon && (
              <span aria-hidden="true" className="shrink-0">
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {isSelected && (
              <motion.div
                layoutId="active-tab-line"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand"
                transition={
                  reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30 }
                }
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-450 mb-4 select-none">
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-350 dark:text-slate-600" />}
          {item.onClick ? (
            <button
              type="button"
              onClick={item.onClick}
              className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-slate-800 dark:text-slate-200 font-bold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
