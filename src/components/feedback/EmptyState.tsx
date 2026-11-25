import { Inbox } from 'lucide-react';
import type React from 'react';
import { cn } from '../../lib/utils.js';
import { Button } from '../ui/Button.js';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

/** Estado vazio canônico (S30-03). role="status" + aria-live="polite": ausência de
 *  dados é informativa, não alarmante — não usa role="alert". Ícone é decorativo
 *  (aria-hidden); título/descrição carregam a informação para leitores de tela. */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}) => {
  return (
    <section
      role="status"
      aria-live="polite"
      data-testid="canonical-empty-state"
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/60 p-8 text-center',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface-2 text-ink-2"
      >
        {icon ?? <Inbox className="h-5 w-5" strokeWidth={1.5} />}
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-ink-2">{description}</p>
      {actionLabel && onAction && (
        <Button
          type="button"
          variant="vancouver"
          size="sm"
          onClick={onAction}
          data-testid="empty-state-primary-action"
          className="mt-4"
        >
          {actionLabel}
        </Button>
      )}
    </section>
  );
};
