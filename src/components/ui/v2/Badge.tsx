import type * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Badges v2 em estilo "soft" premium: tint -100 + texto -700 (par AA nos
// dois temas, pois as escalas semânticas invertem no .dark). O default usa
// gold, que não inverte — tint creme + texto bronze funciona nos dois temas.
const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-gold-500/30 bg-gold-100 text-gold-700',
        secondary: 'border-border-default bg-card text-card-foreground',
        destructive: 'border-danger-500/30 bg-danger-100 text-danger-700',
        outline: 'border-border-default text-foreground',
        success: 'border-success-500/30 bg-success-100 text-success-700',
        warning: 'border-warning-500/30 bg-warning-100 text-warning-700',
        info: 'border-info-500/30 bg-info-100 text-info-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  // span (não div): badge é phrasing content e pode viver dentro de <p>,
  // headings e botões sem violar o content model do HTML.
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
