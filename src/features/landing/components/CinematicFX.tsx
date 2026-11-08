import { useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/**
 * Camada cinematográfica complementar da landing pública e da tela de login
 * (rotas "/" e "/login"). Convive com o sistema já existente em
 * LandingAdaptive.css (.b360-ambient orbital, coreografia do hero,
 * .b360-reveal via IntersectionObserver) — este módulo adiciona apenas o que
 * faltava: scroll progress, ambient interno do hero, count-up, tilt 3D,
 * reveal tipográfico por palavras e halo neon.
 * Isolado da lógica de negócio: transform/opacity + IO + listeners passivos.
 */

/* -------------------------------------------------------------------------- */
/* Scroll progress — barra neon fina no topo                                  */
/* -------------------------------------------------------------------------- */

export function B360ScrollProgress() {
  const barRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    if (reduceMotion) {
      bar.style.display = 'none';
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? doc.scrollTop / max : 0;
      bar.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduceMotion]);

  return (
    <div className="b360-scroll-progress" aria-hidden="true">
      <div ref={barRef} className="b360-scroll-progress-bar" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Ambient interno do hero — grid + motes neon (decorativo, aria-hidden)      */
/* -------------------------------------------------------------------------- */

const MOTES = [
  { x: '8%', y: '18%', s: 5, d: '0s', c: 'cyan' },
  { x: '18%', y: '64%', s: 4, d: '1.2s', c: 'pink' },
  { x: '32%', y: '30%', s: 6, d: '2.1s', c: 'iris' },
  { x: '47%', y: '78%', s: 4, d: '0.6s', c: 'gold' },
  { x: '58%', y: '14%', s: 5, d: '1.7s', c: 'cyan' },
  { x: '71%', y: '52%', s: 7, d: '0.9s', c: 'pink' },
  { x: '84%', y: '26%', s: 4, d: '2.6s', c: 'iris' },
  { x: '92%', y: '70%', s: 5, d: '1.4s', c: 'cyan' },
  { x: '26%', y: '88%', s: 5, d: '2.9s', c: 'gold' },
  { x: '66%', y: '88%', s: 4, d: '0.3s', c: 'pink' },
] as const;

export function B360AmbientFX({ variant = 'hero' }: { variant?: 'hero' }) {
  const reduceMotion = useReducedMotion();
  return (
    <div
      className={`b360-ambientfx b360-ambientfx-${variant}`}
      aria-hidden="true"
      data-reduced={reduceMotion ? 'true' : undefined}
    >
      <span className="b360-ambientfx-blob b360-ambientfx-blob-a" />
      <span className="b360-ambientfx-blob b360-ambientfx-blob-b" />
      <span className="b360-ambientfx-grid" />
      {MOTES.map((m, i) => (
        <i
          key={i}
          className={`b360-mote b360-mote-${m.c}`}
          style={
            {
              left: m.x,
              top: m.y,
              width: m.s,
              height: m.s,
              animationDelay: m.d,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Count-up — números animados na entrada da viewport                         */
/* -------------------------------------------------------------------------- */

export function B360CountUp({
  to,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1.6,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduceMotion) {
      setValue(to);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / (duration * 1000));
          const eased = 1 - (1 - p) ** 4;
          setValue(to * eased);
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [to, duration, reduceMotion]);

  const formatted =
    decimals > 0
      ? value.toFixed(decimals).replace('.', ',')
      : Math.round(value).toLocaleString('pt-BR');

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Tilt 3D sutil nos cards do bento — só ponteiro fino, cleanup garantido     */
/* -------------------------------------------------------------------------- */

export function useB360CardTilt(deps: unknown[] = []) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const cards = document.querySelectorAll<HTMLElement>('.b360-feature-card');
    const cleanups: Array<() => void> = [];

    cards.forEach((card) => {
      const onMove = (e: PointerEvent) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(1100px) rotateY(${(px * 5).toFixed(2)}deg) rotateX(${(-py * 5).toFixed(2)}deg) translateY(-3px)`;
      };
      const onLeave = () => {
        card.style.transform = '';
      };
      card.addEventListener('pointermove', onMove, { passive: true });
      card.addEventListener('pointerleave', onLeave);
      cleanups.push(() => {
        card.removeEventListener('pointermove', onMove);
        card.removeEventListener('pointerleave', onLeave);
      });
    });

    return () => {
      for (const fn of cleanups) fn();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, ...deps]);

  return null;
}

/* -------------------------------------------------------------------------- */
/* Palavra animada — reveal tipográfico (hero e login)                        */
/* -------------------------------------------------------------------------- */

export function B360Words({
  text,
  className = '',
  baseDelay = 0,
  step = 55,
}: {
  text: string;
  className?: string;
  baseDelay?: number;
  step?: number;
}) {
  const reduceMotion = useReducedMotion();
  const words = text.split(/\s+/).filter(Boolean);
  if (reduceMotion) return <span className={className}>{text}</span>;
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          className="b360-word"
          style={{ animationDelay: `${baseDelay + i * step}ms` }}
        >
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  );
}
