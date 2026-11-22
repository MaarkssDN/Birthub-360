import { motion, useReducedMotion } from 'framer-motion';
import type React from 'react';

interface SculpturalRevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  as?: 'div' | 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export function SculpturalReveal({
  children,
  delay = 0,
  duration = 0.85,
  className = '',
  as = 'div',
}: SculpturalRevealProps) {
  const reduceMotion = Boolean(useReducedMotion());

  if (reduceMotion) {
    const Component = as;
    return <Component className={className}>{children}</Component>;
  }

  const MotionComponent = motion[as];

  return (
    <div className={`overflow-hidden ${className}`}>
      <MotionComponent
        initial={{
          clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)',
          y: 40,
          opacity: 0,
        }}
        whileInView={{
          clipPath: 'polygon(0 0%, 100% 0%, 100% 100%, 0 100%)',
          y: 0,
          opacity: 1,
        }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{
          duration,
          delay,
          ease: [0.16, 1, 0.3, 1], // Inércia executiva canônica
        }}
      >
        {children}
      </MotionComponent>
    </div>
  );
}
