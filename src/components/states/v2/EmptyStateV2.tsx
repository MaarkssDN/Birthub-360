import { Inbox } from 'lucide-react';
import type React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/v2/Button';

export interface EmptyStateV2Props {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * EmptyState v2 — Agente 32 (Ema), Onda ONDA-DESIGN-PREMIUM.
 * Mesma semântica do v1 (role="status" + aria-live="polite", ícone decorativo)
 * com chrome premium: superfície `bg-card`, borda tracejada sutil e ação
 * em Button v2 (par de marca ouro/navy).
 */
export const EmptyStateV2: React.FC<EmptyStateV2Props> = ({
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
      data-testid="v2-empty-state"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-card p-8 text-center',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border-default bg-offwhite-100 text-muted-foreground"
      >
        {icon ?? <Inbox className="h-5 w-5" strokeWidth={1.5} />}
      </div>
      <h3 className="font-display text-base font-semibold text-card-foreground">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={onAction}
          className="mt-4"
          data-testid="v2-empty-state-primary-action"
        >
          {actionLabel}
        </Button>
      )}
    </section>
  );
};
