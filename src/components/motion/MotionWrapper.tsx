import React from 'react';
import { MotionConfig, motion, useReducedMotion } from 'framer-motion';

export interface MotionWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const MotionWrapper: React.FC<MotionWrapperProps> = ({ children, className }) => {
  const prefersReducedMotion = Boolean(useReducedMotion());

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        data-testid="accessible-motion-wrapper"
        data-reduced-motion={String(prefersReducedMotion)}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
        className={className}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
};
