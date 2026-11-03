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
      brand: 'from-[#00D4FF]/30 to-[#00D4FF]/0 dark:from-[#00D4FF]/20',
      cyan: 'from-[#00D4FF]/35 to-[#00D4FF]/0 dark:from-[#00D4FF]/25',
      lime: 'from-[#D4F434]/40 to-[#D4F434]/0 dark:from-[#D4F434]/25',
      pink: 'from-[#FF2D9B]/35 to-[#FF2D9B]/0 dark:from-[#FF2D9B]/20',
      gold: 'from-[#F59E0B]/35 to-[#F59E0B]/0 dark:from-[#F59E0B]/20',
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

export function Glow({
  className,
  variant,
  color = 'brand',
  blur = 'lg',
  ...props
}: GlowProps) {
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
