import { useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/* -------------------------------------------------------------------------- */
/* 1. ATRAÇÃO MAGNÉTICA EM LOGOS E CARDS DO ECOSSISTEMA                       */
/* -------------------------------------------------------------------------- */

/**
 * useB360MagneticAttraction — Aplica física de atração magnética sutil aos
 * elementos selecionados (ex: cards de integração Bitrix24, HubSpot, Salesforce).
 * Ao aproximar o mouse, o elemento é atraído em direção ao ponteiro.
 * No pointerleave, retorna com amortecimento elástico (spring physics).
 */
export function useB360MagneticAttraction(selector: string, pullStrength = 0.18, maxDist = 160) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    if (typeof window === 'undefined') return;
    if (typeof window.matchMedia === 'function' && !window.matchMedia('(pointer: fine)').matches)
      return;

    const elements = document.querySelectorAll<HTMLElement>(selector);
    if (!elements.length) return;

    const cleanups: Array<() => void> = [];

    elements.forEach((el) => {
      let rafId = 0;
      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;
      let isInteracting = false;

      const updateSpring = () => {
        currentX += (targetX - currentX) * 0.22;
        currentY += (targetY - currentY) * 0.22;

        if (isInteracting || Math.abs(currentX) > 0.1 || Math.abs(currentY) > 0.1) {
          el.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
          rafId = requestAnimationFrame(updateSpring);
        } else {
          el.style.transform = '';
          currentX = 0;
          currentY = 0;
        }
      };

      const onMouseMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const dist = Math.hypot(dx, dy);

        if (dist < maxDist) {
          isInteracting = true;
          // Força de atração proporcional à proximidade
          const factor = (1 - dist / maxDist) ** 1.2 * pullStrength;
          targetX = dx * factor;
          targetY = dy * factor;

          cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(updateSpring);
        }
      };

      const onMouseLeave = () => {
        isInteracting = false;
        targetX = 0;
        targetY = 0;
      };

      const parentSection = el.closest('section') || el.parentElement || el;
      parentSection.addEventListener('mousemove', onMouseMove as EventListener, { passive: true });
      el.addEventListener('mouseleave', onMouseLeave);

      cleanups.push(() => {
        cancelAnimationFrame(rafId);
        parentSection.removeEventListener('mousemove', onMouseMove as EventListener);
        el.removeEventListener('mouseleave', onMouseLeave);
        el.style.transform = '';
      });
    });

    return () => {
      for (const fn of cleanups) fn();
    };
  }, [selector, pullStrength, maxDist, reduceMotion]);
}

/* -------------------------------------------------------------------------- */
/* 2. LEVITAÇÃO DE CARTÕES E AURORA (EFEITO PARALLAX MULTI-PLANO)             */
/* -------------------------------------------------------------------------- */

/**
 * useB360ScrollParallax — Vincula o scroll aos planos de profundidade:
 * - Cartões sobem na velocidade normal de scroll com sutil antecipação parallax
 * - A Aurora no fundo move-se mais devagar (0.35x), gerando profundidade espacial
 * GPU pura: transform translate3d, 0 layout reflows.
 */
export function useB360ScrollParallax() {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    if (typeof window === 'undefined') return;

    const heroConsole = document.querySelector<HTMLElement>('.b360-hero-console');
    const fannedCards = document.querySelector<HTMLElement>('.b360-fanned-deck');
    const ambientOrbs = document.querySelectorAll<HTMLElement>('.b360-ambient .b360-orb');
    const orbitRing = document.querySelector<HTMLElement>('.b360-orbit-ring');

    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const scrollY = window.scrollY;

        // Deslocamento dos cartões hero (sobe mais rápido no scroll)
        if (heroConsole) {
          const consoleOffset = Math.min(60, scrollY * 0.08);
          heroConsole.style.setProperty('--parallax-y', `${-consoleOffset.toFixed(1)}px`);
        }

        if (fannedCards) {
          const deckOffset = Math.min(80, scrollY * 0.1);
          fannedCards.style.setProperty('--parallax-y', `${-deckOffset.toFixed(1)}px`);
        }

        // Aurora e anel orbital movem-se com menor velocidade (profundidade de fundo)
        ambientOrbs.forEach((orb, i) => {
          const factor = 0.035 + i * 0.015;
          const orbShift = scrollY * factor;
          orb.style.setProperty('--scroll-shift-y', `${orbShift.toFixed(1)}px`);
        });

        if (orbitRing) {
          orbitRing.style.setProperty('--orbit-shift-y', `${(scrollY * 0.025).toFixed(1)}px`);
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [reduceMotion]);
}

/* -------------------------------------------------------------------------- */
/* 3. INÉRCIA ROTACIONAL (TILT BASEADO NA VELOCIDADE DE SCROLL)                */
/* -------------------------------------------------------------------------- */

/**
 * useB360ScrollVelocityInertia — Monitor de velocidade de rolagem:
 * Quando o usuário rola a página rapidamente, os cartões sofrem uma leve
 * inclinação (tilt de 2° a 4.5° no eixo X), como se o arrasto do movimento os
 * empurrasse. Ao desacelerar o scroll, uma mola (spring) traz os cartões de
 * volta a 0 graus. 100% acelerado pela GPU.
 */
export function useB360ScrollVelocityInertia(
  selector = '.b360-hero-console, .b360-fanned-card, .b360-problem-card',
) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    if (typeof window === 'undefined') return;

    const cards = document.querySelectorAll<HTMLElement>(selector);
    if (!cards.length) return;

    let lastScrollY = window.scrollY;
    let lastTime = performance.now();
    let currentVelocity = 0;
    let currentTilt = 0;
    let rafId = 0;

    const tick = (now: number) => {
      const dt = Math.max(1, now - lastTime);
      const scrollY = window.scrollY;
      const dy = scrollY - lastScrollY;

      // Velocidade instantânea em px/ms
      const instantVelocity = dy / dt;
      currentVelocity += (instantVelocity - currentVelocity) * 0.35;

      // Mapeamento para inclinação de 2° a 4.5°
      const targetTilt = Math.max(-4.5, Math.min(4.5, currentVelocity * 2.8));
      // Amortecimento tipo mola (spring)
      currentTilt += (targetTilt - currentTilt) * 0.18;

      if (Math.abs(currentTilt) > 0.02 || Math.abs(currentVelocity) > 0.01) {
        cards.forEach((card) => {
          card.style.setProperty('--scroll-tilt', `${currentTilt.toFixed(2)}deg`);
        });
      } else {
        cards.forEach((card) => {
          card.style.removeProperty('--scroll-tilt');
        });
      }

      lastScrollY = scrollY;
      lastTime = now;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      cards.forEach((card) => { card.style.removeProperty('--scroll-tilt'); });
    };
  }, [selector, reduceMotion]);
}

/* -------------------------------------------------------------------------- */
/* 4. TRANSIÇÕES EM BLOCOS: REVELAÇÃO POR INTERSEÇÃO & DESCRIPTOGRAFIA        */
/* -------------------------------------------------------------------------- */

const CIPHER_CHARS = '#%&*01/<>[]X$@ØΔλ';

/**
 * B360DecryptBlock — Exibe texto com efeito de descriptografia cibernética
 * (Matrix scramble) e máscara de vidro fosco (blur-reveal sweep) ativados
 * conforme o progresso de interseção da seção com a viewport.
 */
export function B360DecryptBlock({
  text,
  tag,
  className = '',
  active = false,
  delayMs = 0,
}: {
  text: string;
  tag?: string;
  className?: string;
  active?: boolean;
  delayMs?: number;
}) {
  const reduceMotion = useReducedMotion();
  const [displayText, setDisplayText] = useState(text);
  const [isDecrypted, setIsDecrypted] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (reduceMotion || !active || isDecrypted) {
      if (active) setDisplayText(text);
      return;
    }

    let frame = 0;
    const totalFrames = Math.max(16, Math.min(30, Math.floor(text.length * 1.2)));

    timeoutRef.current = setTimeout(() => {
      const interval = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        const resolvedLength = Math.floor(progress * text.length);

        const scrambled = text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < resolvedLength) return text[index];
            return CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)];
          })
          .join('');

        setDisplayText(scrambled);

        if (frame >= totalFrames) {
          clearInterval(interval);
          setDisplayText(text);
          setIsDecrypted(true);
        }
      }, 26);

      return () => clearInterval(interval);
    }, delayMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [active, text, delayMs, reduceMotion, isDecrypted]);

  if (reduceMotion) {
    return (
      <div className={`b360-decrypt-container ${className}`}>
        {tag && <span className="b360-problem-tag">{tag}</span>}
        <h3>{text}</h3>
      </div>
    );
  }

  return (
    <div
      className={`b360-decrypt-container ${active ? 'b360-blur-sweep-active' : ''} ${className}`}
    >
      {/* Máscara de vidro fosco que varre da esquerda para a direita */}
      <span className="b360-blur-sweep-mask" aria-hidden="true" />
      {tag && <span className="b360-problem-tag">{tag}</span>}
      <h3 className="tabular-nums">{displayText}</h3>
    </div>
  );
}

/**
 * useB360SectionIntersectionProgress — Amarra a revelação da seção alvo
 * (ex: #problema "Sua equipe precisa de contexto para avançar") ao progresso
 * de entrada na viewport.
 */
export function useB360SectionProgress(targetId = 'problema') {
  const [progress, setProgress] = useState(0);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const section = document.getElementById(targetId);
    if (!section) return;

    let rafId = 0;
    const update = () => {
      rafId = 0;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;

      // O progresso (0 a 100%) começa quando o topo toca a base da tela
      // e completa quando chega ao centro/topo da tela
      const start = vh;
      const end = 0.2 * vh;
      const rawProgress = (start - rect.top) / (start - end);
      const clamped = Math.max(0, Math.min(1, rawProgress));

      setProgress(clamped);
      if (clamped > 0.15 && !isIntersecting) {
        setIsIntersecting(true);
      }
    };

    const onScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [targetId, isIntersecting]);

  return { progress, isIntersecting };
}

