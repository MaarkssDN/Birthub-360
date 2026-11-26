import { useReducedMotion, type Variants } from 'framer-motion';
import { isDesignV2Enabled, DESIGN_V2_FLAGS } from '@/config/feature-flags';

/**
 * Motion V2 — Agente 35 (Mia), Onda ONDA-DESIGN-PREMIUM-2026-11-24.
 *
 * Tokens alinhados a src/styles/design-v2.css (--duration-*, --ease-*).
 * Regras do sistema:
 * - Apenas `transform` e `opacity` (GPU accelerated, 60fps).
 * - Durações 100–500ms; sem bounce, sem animações infinitas.
 * - `prefers-reduced-motion` zera toda transição via useMotionV2().
 * - Feature flag `design.newMotion` permite rollback instantâneo.
 */

export const MOTION_V2_DURATION = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
  slowest: 0.5,
} as const;

export const MOTION_V2_EASE = {
  standard: [0.4, 0, 0.2, 1],
  enter: [0.22, 1, 0.36, 1],
  exit: [0.4, 0, 1, 1],
  emphasized: [0.16, 1, 0.3, 1],
} as const;

/**
 * Retorna true quando o motion v2 está habilitado E o usuário não pediu
 * reduced motion. Componentes devem usar este hook para decidir entre
 * animar ou renderizar estado final direto.
 */
export function useMotionV2(): boolean {
  const reduced = useReducedMotion();
  return isDesignV2Enabled(DESIGN_V2_FLAGS.NEW_MOTION) && !reduced;
}

/** Fade simples — entrada/saída de overlays e troca de conteúdo. */
export const motionV2Fade: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: MOTION_V2_DURATION.normal, ease: MOTION_V2_EASE.enter },
  },
  exit: {
    opacity: 0,
    transition: { duration: MOTION_V2_DURATION.fast, ease: MOTION_V2_EASE.exit },
  },
};

/** Reveal de página/seção — fade + subida sutil de 8px. */
export const motionV2Reveal: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION_V2_DURATION.slow, ease: MOTION_V2_EASE.emphasized },
  },
};

/** Scale de cards/avatares — 0.98→1, feedback tátil sem bounce. */
export const motionV2Scale: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: MOTION_V2_DURATION.normal, ease: MOTION_V2_EASE.enter },
  },
};

/** Container com stagger — usar em listas/grids curtas (máx. ~8 itens). */
export const motionV2Stagger: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

/** Transição de rota/página — fade rápido, sem deslocamento lateral. */
export const motionV2Page: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: MOTION_V2_DURATION.normal, ease: MOTION_V2_EASE.standard },
  },
  exit: {
    opacity: 0,
    transition: { duration: MOTION_V2_DURATION.fast, ease: MOTION_V2_EASE.exit },
  },
};
