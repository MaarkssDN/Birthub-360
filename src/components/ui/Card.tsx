import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { SoundFX } from '../../lib/soundEffects.js';
import { cn } from '../../lib/utils.js';
import { BorderBeam, type BorderBeamProps } from './BorderBeam.js';

const cardVariants = cva(
  'bh-platform-card relative overflow-hidden rounded-2xl sm:rounded-3xl text-ink transition-all duration-200 ease-out border border-line bg-surface/95 dark:bg-[#16171B]/95 backdrop-blur-xl shadow-[0_4px_24px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.85)] dark:shadow-[0_4px_24px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.07)] hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_32px_-4px_rgba(0,212,255,0.12)] hover:-translate-y-0.5',
  {
    variants: {
      variant: {
        default: 'hover:border-line-strong',
        stat: 'hover:border-brand/40',
        outline:
          'border border-line bg-transparent hover:border-line-strong hover:bg-surface-interactive',
        accent: 'hover:border-brand/50 shadow-[0_4px_20px_rgba(0,212,255,0.12)]',
        elevated:
          'shadow-[0_12px_40px_-6px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_-6px_rgba(0,0,0,0.5)] border-line hover:border-line-strong',
        interactive:
          'group cursor-pointer hover:border-brand/40 hover:bg-surface-interactive hover:shadow-[0_10px_32px_-4px_rgba(0,0,0,0.08)] active:translate-y-0 active:scale-[0.99]',
        surface: 'bg-surface-2 border border-line shadow-none hover:border-line-strong',
        panel: 'hover:border-line-strong',
        metric: 'hover:border-brand/40',
        data: 'bg-surface-2 border border-line shadow-none',
        feature: 'border-brand/30 hover:border-brand/60 shadow-[0_4px_24px_rgba(0,212,255,0.12)]',
        floating:
          'shadow-[0_16px_48px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.6)] border-line-strong',
        bento: 'hover:border-brand/35',
        cosmic: 'border-brand/30 dark:border-brand/40 shadow-[0_4px_24px_rgba(0,212,255,0.15)]',
        glass:
          'border border-line bg-surface/80 dark:bg-[#16171B]/80 backdrop-blur-2xl shadow-card hover:border-line-strong',
        neon: 'border-brand/40 shadow-[0_0_24px_rgba(0,212,255,0.18)] hover:border-brand',
        // Estilo orgânico inspirado em Ronas IT / Spatial UI (pill card)
        organic:
          'rounded-3xl border border-line/70 bg-white dark:bg-[#18191E] shadow-[0_4px_24px_-2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_4px_24px_-2px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] hover:scale-[1.01] transition-transform duration-200',
      },
      padding: {
        default: 'p-6',
        sm: 'p-4',
        lg: 'p-8',
        none: 'p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
    },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  accentBar?: boolean;
  isLoading?: boolean;
  borderBeam?: boolean;
  borderBeamVariant?: BorderBeamProps['variant'];
  borderBeamDuration?: number;
  borderBeamSize?: number;
  spotlight?: boolean;
  soundHover?: boolean;
  soundClick?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      padding,
      accentBar,
      isLoading,
      borderBeam,
      borderBeamVariant = 'cyan',
      borderBeamDuration = 12,
      borderBeamSize = 220,
      spotlight = false,
      soundHover = false,
      soundClick = false,
      children,
      onPointerMove,
      onMouseEnter,
      onMouseLeave,
      onClick,
      ...props
    },
    ref,
  ) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const isInteractive = Boolean(onClick);
    const isHoverAware =
      spotlight || soundHover || Boolean(onMouseEnter || onMouseLeave || onPointerMove);

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(e);
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovered(true);
      if (soundHover) {
        SoundFX.play('hover');
      }
      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovered(false);
      onMouseLeave?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (soundClick) {
        SoundFX.play('click');
      }
      onClick?.(e);
    };

    return (
      <div
        ref={ref}
        data-accent={
          accentBar
            ? 'gold'
            : variant === 'accent' || variant === 'feature'
              ? 'pink'
              : variant === 'metric' || variant === 'stat'
                ? 'gold'
                : variant === 'data'
                  ? 'blue'
                  : undefined
        }
        className={cn(
          cardVariants({ variant, padding, className }),
          (isLoading || borderBeam || spotlight) && 'overflow-hidden isolate',
        )}
        {...(isHoverAware
          ? {
              onPointerMove: handlePointerMove,
              onMouseEnter: handleMouseEnter,
              onMouseLeave: handleMouseLeave,
            }
          : {})}
        {...(isInteractive
          ? {
              role: 'button',
              tabIndex: 0,
              onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.currentTarget.click();
                }
              },
              onClick: handleClick,
            }
          : {})}
        {...props}
      >
        {spotlight && isHovered && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-300"
            style={{
              background: 'var(--grad-glow)',
            }}
          />
        )}
        {isLoading && (
          <BorderBeam
            variant="brand"
            size={200}
            duration={3.5}
            borderWidth={1}
            radius="var(--radius-card)"
          />
        )}
        {!isLoading && borderBeam && (
          <BorderBeam
            variant={borderBeamVariant}
            size={borderBeamSize}
            duration={borderBeamDuration}
            borderWidth={1}
            radius="var(--radius-card)"
          />
        )}
        <div
          className={cn(
            'relative z-10 transition-opacity duration-300',
            isLoading && 'opacity-60 pointer-events-none select-none',
          )}
        >
          {children}
        </div>
      </div>
    );
  },
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'font-display font-bold leading-tight tracking-[-0.02em] text-[#0F2942] dark:text-[#E2F1FF]',
        className,
      )}
      {...props}
    />
  ),
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'text-sm leading-relaxed text-[#3B5A75] dark:text-[#94B3CD]',
      className,
    )}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  ),
);
CardFooter.displayName = 'CardFooter';

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
