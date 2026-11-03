import * as React from 'react';
/* eslint-disable react-refresh/only-export-components */

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '../../lib/utils.js';
import { Magnetic } from './Magnetic.js';

const buttonVariants = cva(
  'bh-official-control inline-flex items-center justify-center gap-2 whitespace-nowrap text-[13px] font-semibold tracking-[-0.015em] motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:bg-surface-subtle disabled:text-ink-2 disabled:border-transparent active:scale-[0.97]',
  {
    variants: {
      variant: {
        // Padrão Executivo High-Contrast
        default:
          'rounded-2xl bg-gradient-to-b from-[#0284c7] to-[#0369a1] dark:from-[#00b4d8] dark:to-[#0284c7] text-white shadow-[0_2px_8px_rgba(2,132,199,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_4px_16px_rgba(2,132,199,0.35)] hover:brightness-105 border-t border-t-white/30',
        primary:
          'rounded-2xl bg-gradient-to-b from-[#0284c7] to-[#0369a1] dark:from-[#00b4d8] dark:to-[#0284c7] text-white shadow-[0_2px_8px_rgba(2,132,199,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_4px_16px_rgba(2,132,199,0.35)] hover:brightness-105 border-t border-t-white/30',

        // Acento Elétrico Lime/Chartreuse (Referência Ronas IT / Spatial UI)
        electric:
          'rounded-full bg-[#D4F434] hover:bg-[#C5E826] text-[#121316] font-display font-bold shadow-[0_2px_12px_rgba(212,244,52,0.35),inset_0_1px_0_rgba(255,255,255,0.6)] hover:shadow-[0_4px_20px_rgba(212,244,52,0.45)] hover:scale-[1.02] border border-[#BDE01B]',
        lime: 'rounded-full bg-[#D4F434] hover:bg-[#C5E826] text-[#121316] font-display font-bold shadow-[0_2px_12px_rgba(212,244,52,0.35),inset_0_1px_0_rgba(255,255,255,0.6)] hover:shadow-[0_4px_20px_rgba(212,244,52,0.45)] hover:scale-[1.02] border border-[#BDE01B]',

        // Dourado/Âmbar Executivo
        brand:
          'rounded-2xl bg-gradient-to-b from-[#D4F434] to-[#BEE61C] text-[#121316] font-display font-bold shadow-[0_2px_12px_rgba(212,244,52,0.3),inset_0_1px_0_rgba(255,255,255,0.6)] hover:brightness-105 border-t border-t-white/40',

        // Card Superfície / Secundário Flutuante
        secondary:
          'rounded-2xl border border-line bg-surface/90 hover:bg-surface text-ink shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-line-strong hover:scale-[1.01]',

        tertiary:
          'rounded-2xl bg-surface text-ink hover:bg-surface-interactive border border-line shadow-xs',

        success:
          'rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:brightness-105 border-t border-t-white/20',

        destructive:
          'rounded-2xl bg-gradient-to-b from-rose-600 to-rose-700 text-white shadow-sm hover:brightness-105 border-t border-t-white/20',

        outline:
          'rounded-2xl border border-line bg-transparent text-ink hover:bg-surface hover:border-line-strong',

        ghost: 'rounded-2xl border border-transparent text-ink-2 hover:bg-surface-2 hover:text-ink',

        link: 'text-primary underline-offset-4 hover:underline',

        cosmic:
          'rounded-2xl bg-gradient-to-r from-slate-900 via-[#14141A] to-slate-900 text-white border border-brand/30 shadow-[0_2px_14px_rgba(0,212,255,0.2)] hover:border-brand/60 hover:shadow-[0_4px_22px_rgba(0,212,255,0.3)]',

        vancouver:
          'rounded-2xl border border-line bg-surface/40 hover:bg-surface/80 text-ink hover:border-brand/40 shadow-xs',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs rounded-xl',
        lg: 'h-11 px-6 text-sm rounded-2xl',
        pill: 'h-10 px-6 rounded-full font-display font-bold',
        'pill-sm': 'h-8 px-4 text-xs rounded-full font-medium',
        icon: 'h-9 w-9 p-0 rounded-full',
        'icon-sm': 'h-8 w-8 p-0 rounded-full',
        'icon-lg': 'h-11 w-11 p-0 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  soundClick?: boolean;
  soundHover?: boolean;
  sound?: string;
  shine?: boolean;
  magnetic?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      soundClick = false,
      soundHover = false,
      sound,
      shine = false,
      magnetic = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';

    const buttonContent = (
      <Comp
        {...(props as any)}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || disabled}
        aria-busy={loading || undefined}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && (
              <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
            )}
            {children}
          </>
        )}
      </Comp>
    );

    if (magnetic) {
      return <Magnetic>{buttonContent}</Magnetic>;
    }

    return buttonContent;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
