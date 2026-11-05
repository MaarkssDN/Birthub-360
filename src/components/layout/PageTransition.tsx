import { motion, useReducedMotion } from 'framer-motion';
import type React from 'react';
import { pageTransitionClean } from '../../lib/motion.js';
import { cn } from '../../lib/utils.js';

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function PageTransition({ children, className, id }: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={cn('flex-1 flex flex-col min-h-0 min-w-0', className)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      key={id}
      variants={pageTransitionClean}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn('flex-1 flex flex-col min-h-0 min-w-0 motion-gpu', className)}
    >
      {children}
    </motion.div>
  );
}
export default PageTransition;
