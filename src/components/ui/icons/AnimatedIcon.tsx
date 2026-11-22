import { motion, useReducedMotion } from 'framer-motion';
import type React from 'react';
import { cn } from '../../../lib/utils.js';

export interface AnimatedIconProps {
  /** Componente de ícone (Lucide, SVG ou elemento JSX) */
  icon?: React.ComponentType<{
    className?: string;
    size?: number | string;
    'aria-hidden'?: boolean | 'true' | 'false';
  }>;
  children?: React.ReactNode;
  animation?: 'float' | 'pulse' | 'spin' | 'none';
  /** Cor base do ícone ou container */
  color?: 'brand' | 'ink' | 'success' | 'warning' | 'info' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Envolve o ícone em um container com borda sutil */
  badge?: boolean;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

export function AnimatedIcon({
  icon: IconComponent,
  children,
  animation = 'none',
  color = 'ink',
  size = 'md',
  badge = false,
  interactive = false,
  className,
  onClick,
}: AnimatedIconProps) {
  const reduceMotion = useReducedMotion();

  const colorStyles = {
    brand: 'text-brand',
    ink: 'text-ink-2',
    success: 'text-success',
    warning: 'text-warning',
    info: 'text-info',
    danger: 'text-danger',
  };

  const badgeStyles = {
    brand: 'bg-brand/10 border border-brand/20',
    ink: 'bg-surface-elevated border border-line',
    success: 'bg-success/10 border border-success/20',
    warning: 'bg-warning/10 border border-warning/20',
    info: 'bg-info/10 border border-info/20',
    danger: 'bg-danger/10 border border-danger/20',
  };

  const sizePixels = {
    xs: 14,
    sm: 18,
    md: 22,
    lg: 28,
    xl: 36,
  };

  const badgeSizes = {
    xs: 'p-1 rounded-md',
    sm: 'p-1.5 rounded-lg',
    md: 'p-2 rounded-xl',
    lg: 'p-3 rounded-2xl',
    xl: 'p-4 rounded-2xl',
  };

  const getAnimationVariants = (): {
    animate?: Record<string, unknown>;
    transition?: Record<string, unknown>;
  } => {
    if (reduceMotion || animation === 'none') {
      return {};
    }

    switch (animation) {
      case 'float':
        return {
          animate: { y: [-2, 2, -2] },
          transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'pulse':
        return {
          animate: { opacity: [0.7, 1, 0.7] },
          transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'spin':
        return {
          animate: { rotate: 360 },
          transition: { duration: 8, repeat: Infinity, ease: 'linear' },
        };
      default:
        return {};
    }
  };

  const animVariants = getAnimationVariants();

  const iconContent = (
    <motion.span
      className={cn('inline-flex items-center justify-center', colorStyles[color], className)}
      animate={animVariants.animate as any}
      transition={animVariants.transition}
      whileHover={interactive && !reduceMotion ? { scale: 1.05 } : undefined}
      whileTap={interactive && !reduceMotion ? { scale: 0.95 } : undefined}
      onClick={onClick}
    >
      {IconComponent ? (
        <IconComponent size={sizePixels[size]} aria-hidden="true" className="shrink-0" />
      ) : (
        children
      )}
    </motion.span>
  );

  if (badge) {
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center transition-colors',
          badgeSizes[size],
          badgeStyles[color],
          interactive && 'cursor-pointer hover:bg-opacity-80 active:scale-95',
        )}
      >
        {iconContent}
      </div>
    );
  }

  return iconContent;
}
