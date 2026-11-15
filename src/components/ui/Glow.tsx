import { cva, type VariantProps } from 'class-variance-authority';
import type React from 'react';
import { cn } from '../../lib/utils.js';

const glowVariants = cva('pointer-events-none absolute w-full overflow-hidden select-none', {
  variants: {
    variant: {
      top: 'top-0',
      above: '-top-[128px]',
      bottom: 'bottom-0',
      below: '-bottom-[128px]',
      center: 'top-1/2 -translate-y-1/2',
    },
    color: {
      brand: 'from-orbit-blue/30 to-orbit-blue/0 dark:from-orbit-blue/20',
      cyan: 'from-orbit-blue/35 to-orbit-blue/0 dark:from-orbit-blue/25',
      lime: 'from-[var(--neon-lime)]/40 to-[var(--neon-lime)]/0 dark:from-[var(--neon-lime)]/25',
      pink: 'from-pink/35 to-pink/0 dark:from-pink/20',
      gold: 'from-warn/35 to-warn/0 dark:from-warn/20',
      subtle: 'from-slate-400/20 to-slate-400/0 dark:from-white/10',
    },
  },
  defaultVariants: {
    variant: 'top',
    color: 'brand',
  },
});

export interface GlowProps
  extends Omit<React.ComponentProps<'div'>, 'color'>,
    VariantProps<typeof glowVariants> {
  blur?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const blurMap = {
  sm: 'blur-[32px]',
  md: 'blur-[64px]',
  lg: 'blur-[96px]',
  xl: 'blur-[128px]',
  '2xl': 'blur-[160px]',
};

export function Glow({ className, variant, color = 'brand', blur = 'lg', ...props }: GlowProps) {
  return (
    <div
      data-slot="glow"
      aria-hidden="true"
      className={cn(glowVariants({ variant }), className)}
      {...props}
    >
      <div
        className={cn(
          'absolute left-1/2 h-[260px] w-[75%] -translate-x-1/2 rounded-full bg-gradient-to-b',
          glowVariants({ color: color ?? 'brand' }),
          blurMap[blur],
        )}
      />
    </div>
  );
}
