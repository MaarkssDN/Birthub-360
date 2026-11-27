import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { motionV2Reveal, useMotionV2 } from '@/lib/motion-v2';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Desloca o reveal para baixo da dobra sem animar (ex.: conteúdo já visível). */
  disabled?: boolean;
}

/**
 * Reveal v2 — wrapper de entrada de seção/página.
 * Renderiza estado final direto quando `design.newMotion` está off ou o
 * usuário prefere reduced motion (via useMotionV2).
 */
export function Reveal({ children, className, disabled = false }: RevealProps) {
  const enabled = useMotionV2();

  if (!enabled || disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} variants={motionV2Reveal} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}
