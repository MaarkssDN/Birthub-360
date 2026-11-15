import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../../lib/utils.js';

const textareaVariants = cva(
  // focus-visible:ring fica na base (não por variante) para que filled/ghost/holographic
  // também mostrem foco visível — WCAG 2.4.7 (antes só a variante default tinha anel).
  'bh-official-control flex min-h-[80px] w-full rounded-control border text-sm text-ink placeholder:text-ink-2 motion-safe:transition-colors motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-60',
  {
    variants: {
      variant: {
        default:
          'border-line bg-surface px-4 py-3 hover:border-line-strong focus-visible:border-line-strong',
        filled:
          'border-transparent bg-surface-2 px-4 py-3 hover:bg-surface-subtle focus-visible:bg-surface',
        ghost: 'border-transparent bg-transparent px-4 py-3 hover:bg-surface-interactive',
        holographic: 'border-line bg-surface px-4 py-3',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <textarea className={cn(textareaVariants({ variant, className }))} ref={ref} {...props} />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };
