import {
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;
export const EASE_SPRING_SOFT = [0.34, 1.56, 0.64, 1] as const;
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT_SMOOTH = [0.4, 0, 0.2, 1] as const;
export const EASE_BOUNCE = [0.22, 1, 0.36, 1] as const; // Replaced bounce with smooth
export const EASE_SMOOTH = [0.25, 0.1, 0.25, 1] as const;

export const MOTION_DURATION = {
  instant: 0.1, // --duration-instant (100ms)
  fast: 0.15, // --duration-fast (150ms)
  base: 0.25, // --duration-normal (250ms)
  deliberate: 0.35, // --duration-slow (350ms)
  gentle: 0.6, // no CSS equivalent
  slow: 0.8, // no CSS equivalent
} as const;

export const SPRING_SNAPPY = { type: 'spring', stiffness: 420, damping: 32, mass: 0.7 } as const;
export const SPRING_SOFT = { type: 'spring', stiffness: 260, damping: 24, mass: 0.9 } as const;
export const SPRING_ELASTIC = { type: 'spring', stiffness: 260, damping: 24, mass: 0.9 } as const;
export const SPRING_BOUNCY = { type: 'spring', stiffness: 260, damping: 24, mass: 0.9 } as const; // Replaced with softer spring
export const SPRING_TACTILE = { type: 'spring', stiffness: 500, damping: 28, mass: 0.6 } as const;
export const SPRING_MOMENTUM = { type: 'spring', stiffness: 350, damping: 25, mass: 0.8 } as const;
export const SPRING_ORGANIC = { type: 'spring', stiffness: 280, damping: 22, mass: 0.8 } as const;

export const pillReveal: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 6 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 22 },
  },
};

export const journeyConnector: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.8, ease: EASE_PREMIUM },
  },
};

export const nodePulse: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.08, transition: { type: 'spring', stiffness: 400, damping: 15 } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25, ease: EASE_OUT_EXPO } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 8, filter: 'blur(3px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.3, ease: EASE_OUT_EXPO },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -8, filter: 'blur(3px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.3, ease: EASE_OUT_EXPO },
  },
};

export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.98, filter: 'blur(2px)' },
  show: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.28, ease: EASE_OUT_EXPO },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  show: { opacity: 1, scale: 1, transition: SPRING_SOFT },
};

export const scaleInBouncy: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  show: { opacity: 1, scale: 1, transition: SPRING_SOFT },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 12, filter: 'blur(2px)' },
  show: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.3, ease: EASE_OUT_EXPO },
  },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -12, filter: 'blur(2px)' },
  show: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.3, ease: EASE_OUT_EXPO },
  },
};

export const staggerContainer = (stagger = 0.04, delayChildren = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: EASE_PREMIUM },
  },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 18, scale: 0.99, filter: 'blur(8px)' },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: EASE_PREMIUM },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.99,
    filter: 'blur(6px)',
    transition: { duration: 0.25, ease: EASE_PREMIUM },
  },
};

export const pulseGlow: Variants = {
  initial: { scale: 1, opacity: 0.8 },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: EASE_SMOOTH,
    },
  },
};

export const shimmer: Variants = {
  initial: { backgroundPosition: '-200% 0' },
  animate: {
    backgroundPosition: ['200% 0'],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * Inclinação 3D sutil (Spatial UI) que segue o cursor sobre o elemento.
 * Desativada automaticamente quando o usuário prefere menos movimento.
 */
/**
 * Detecta se o dispositivo do usuário utiliza ponteiro de toque (coarse pointer / touch).
 * Em dispositivos móveis e WebView do Capacitor, desativa rastreamento contínuo de cursor
 * para garantir 60/120 FPS fixos e zero aquecimento de GPU.
 */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasCoarseMatch =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(pointer: coarse)').matches
        : false;
    const hasTouchEvents = 'ontouchstart' in window;
    const hasTouchPoints = typeof navigator !== 'undefined' && (navigator.maxTouchPoints ?? 0) > 0;
    setIsTouch(Boolean(hasCoarseMatch || hasTouchEvents || hasTouchPoints));
  }, []);
  return isTouch;
}

export function useTilt(intensity = 10) {
  const ref = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();
  const isTouch = useIsTouchDevice();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [intensity, -intensity]), SPRING_SOFT);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-intensity, intensity]), SPRING_SOFT);

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (reduceMotion || isTouch || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width - 0.5);
    y.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const onPointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return {
    ref,
    style: reduceMotion || isTouch ? undefined : { rotateX, rotateY, transformPerspective: 800 },
    onPointerMove,
    onPointerLeave,
  };
}

/**
 * Botão magnético: puxa levemente o conteúdo em direção ao cursor no hover.
 */
export function useMagnetic(strength = 0.35) {
  const ref = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();
  const isTouch = useIsTouchDevice();

  const x = useSpring(0, SPRING_SNAPPY);
  const y = useSpring(0, SPRING_SNAPPY);

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (reduceMotion || isTouch || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) * strength);
    y.set((event.clientY - rect.top - rect.height / 2) * strength);
  };

  const onPointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return {
    ref,
    style: isTouch || reduceMotion ? undefined : { x, y },
    onPointerMove,
    onPointerLeave,
  };
}

export const shimmerBeam: Variants = {
  initial: { x: '-100%', opacity: 0 },
  hover: {
    x: '200%',
    opacity: [0, 0.7, 0],
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
  },
};

export const pulseGlowInfinite: Variants = {
  initial: { scale: 1, opacity: 0.7 },
  animate: {
    scale: [1, 1.04, 1],
    opacity: [0.7, 1, 0.7],
    transition: { duration: 2.4, repeat: Infinity, ease: EASE_SMOOTH },
  },
};

export const badgePop: Variants = {
  hidden: { scale: 0, opacity: 0 },
  show: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 450, damping: 22 },
  },
};

export const float3D: Variants = {
  initial: { y: 0, rotateZ: 0 },
  animate: {
    y: [-3, 3, -3],
    rotateZ: [-0.8, 0.8, -0.8],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
};

/**
 * 2026 Spatial UI: Spotlight dinâmico que rastreia a posição do cursor sobre o card/botão.
 * Projeta um gradiente radial suave simulando iluminação especular em tempo real.
 */
export function useCursorSpotlight() {
  const ref = useRef<HTMLElement | null>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const reduceMotion = useReducedMotion();
  const isTouch = useIsTouchDevice();

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduceMotion || isTouch || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const onPointerEnter = () => setIsHovered(true);
  const onPointerLeave = () => setIsHovered(false);

  return {
    ref,
    coords,
    isHovered,
    onPointerMove,
    onPointerEnter,
    onPointerLeave,
    spotlightStyle:
      isHovered && !reduceMotion && !isTouch
        ? {
            background: `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, rgba(0, 229, 255, 0.14), transparent 65%)`,
          }
        : undefined,
  };
}

/**
 * Rastreia a posição global do cursor (em % da viewport) para animar elementos
 * de fundo que reagem à presença do usuário — parallax de profundidade sutil.
 * Retorna valores normalizados [−0.5, 0.5] em x e y.
 * Desativado automaticamente com prefers-reduced-motion.
 */
export function useGlobalCursorDepth() {
  const reduceMotion = useReducedMotion();
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reduceMotion || typeof window === 'undefined') return;
    const handler = (e: MouseEvent) => {
      setPos({
        x: e.clientX / window.innerWidth - 0.5,
        y: e.clientY / window.innerHeight - 0.5,
      });
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, [reduceMotion]);

  return reduceMotion ? { x: 0, y: 0 } : pos;
}

/**
 * Animação de entrada escalonada para blocos de métrica/KPI.
 * Combina fadeInUp com leve rotação 3D de perspectiva na entrada.
 */
export const metricReveal: Variants = {
  hidden: { opacity: 0, y: 24, rotateX: 8, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, ease: EASE_PREMIUM },
  },
};

/**
 * Container que orquestra entrada de métricas com stagger mais amplo.
 * Usar em wrappers de KPI / dashboard sections.
 */
export const metricsContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.1 },
  },
};

/**
 * Glow de CTA premium — usar como initial="rest" whileHover="glow" no motion.button.
 * Aparece apenas no hover; nunca em resting state.
 */
export const ctaGlow: Variants = {
  rest: { boxShadow: '0 0 0px rgba(0,229,255,0)' },
  glow: {
    boxShadow: [
      '0 0 0px rgba(0,229,255,0)',
      '0 0 24px rgba(0,229,255,0.45)',
      '0 0 12px rgba(0,229,255,0.25)',
    ],
    transition: { duration: 0.4, ease: EASE_PREMIUM },
  },
};

/**
 * Linha de scan — entra uma única vez na montagem do layout como ambientação.
 * NÃO repetir em loop (Design Language §8).
 */
export const scanLineEntry: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  show: {
    scaleX: 1,
    opacity: [0, 0.6, 0],
    transition: { duration: 1.4, ease: EASE_OUT_EXPO, delay: 0.3 },
  },
};

/**
 * -----------------------------------------------------------------------------
 * COREOGRAFIA DE INTERAÇÃO & COMPOSITOR ENGINE (v2.0)
 * -----------------------------------------------------------------------------
 */

/**
 * Transição de página otimizada para mobile / WebView:
 * Apenas 'transform' e 'opacity', sem blur pesado em runtime.
 */
export const pageTransitionClean: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: EASE_PREMIUM },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15, ease: EASE_IN_OUT_SMOOTH },
  },
};

/**
 * Coreografia de Container de Grid (KPIs, Listas e Cards de Operação)
 */
export const staggerGridContainer = (stagger = 0.04, delayChildren = 0.05): Variants => ({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: stagger, delayChildren },
  },
});

export const gridItemEntrance: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: EASE_PREMIUM },
  },
};

/**
 * Microinterações táteis para Botões e Ações de Comando (CTAs)
 */
export const buttonMotion: Variants = {
  rest: { scale: 1, y: 0 },
  hover: { y: -1.5, transition: { duration: 0.15, ease: EASE_OUT_EXPO } },
  tap: { scale: 0.97, transition: { duration: 0.08, ease: EASE_OUT_EXPO } },
};

/**
 * Microinterações para Cards de Registro e Painéis Analíticos
 */
export const cardHoverMotion: Variants = {
  rest: { y: 0 },
  hover: { y: -2, transition: { duration: 0.2, ease: EASE_PREMIUM } },
  tap: { scale: 0.99, transition: { duration: 0.08 } },
};

/**
 * Revelação suave acionada por rolagem de página (Viewport Scroll)
 * Usar com viewport: { once: true, margin: '-40px' }
 */
export const scrollRevealFadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_PREMIUM },
  },
};

export const scrollRevealScale: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.32, ease: EASE_OUT_EXPO },
  },
};

/**
 * Animações de Modais e Diálogos de Confirmação
 */
export const modalBackdropMotion: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: EASE_IN_OUT_SMOOTH } },
};

export const modalDialogMotion: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: EASE_PREMIUM },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 6,
    transition: { duration: 0.16, ease: EASE_IN_OUT_SMOOTH },
  },
};

/**
 * Drawers Laterais e Folhas de Detalhes de Leads
 */
export const drawerSlideRight: Variants = {
  hidden: { x: '100%', opacity: 0.8 },
  show: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: EASE_PREMIUM },
  },
  exit: {
    x: '100%',
    opacity: 0.8,
    transition: { duration: 0.22, ease: EASE_IN_OUT_SMOOTH },
  },
};

export const drawerSlideBottom: Variants = {
  hidden: { y: '100%', opacity: 0.8 },
  show: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: EASE_PREMIUM },
  },
  exit: {
    y: '100%',
    opacity: 0.8,
    transition: { duration: 0.22, ease: EASE_IN_OUT_SMOOTH },
  },
};

/**
 * Entrada de Linhas de Tabela: zero reflow de largura, entrada estanque em Y
 */
export const tableRowEntrance: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: EASE_PREMIUM },
  },
};
