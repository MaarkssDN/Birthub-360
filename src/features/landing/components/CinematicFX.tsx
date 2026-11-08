import { useReducedMotion } from 'framer-motion';
import { BarChart3, BrainCircuit, Database, GitBranch, Network, Workflow } from 'lucide-react';
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

/**
 * Nós de dados decorativos — adaptação original do movimento físico observado
 * na referência, sem reproduzir símbolos monetários ou a identidade externa.
 * A animação é pausada fora da viewport e removida em reduced-motion.
 */
const DATA_NODES = [
  { id: 'network', Icon: Network, tone: 'cyan' },
  { id: 'brain', Icon: BrainCircuit, tone: 'iris' },
  { id: 'workflow', Icon: Workflow, tone: 'pink' },
  { id: 'database', Icon: Database, tone: 'gold' },
  { id: 'chart', Icon: BarChart3, tone: 'cyan' },
  { id: 'branch', Icon: GitBranch, tone: 'iris' },
] as const;

export function B360FloatingNodes({ variant = 'hero' }: { variant?: 'hero' | 'footer' }) {
  const fieldRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    if (!('IntersectionObserver' in window)) {
      field.dataset.active = 'true';
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        field.dataset.active = entry.isIntersecting ? 'true' : 'false';
      },
      { threshold: 0.01 },
    );
    observer.observe(field);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={fieldRef} className={`b360-node-field b360-node-field-${variant}`} aria-hidden="true">
      {DATA_NODES.map(({ id, Icon, tone }) => (
        <span key={id} className={`b360-data-node b360-data-node-${id} b360-data-node-${tone}`}>
          <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
        </span>
      ))}
    </div>
  );
}

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
      <B360FloatingNodes variant="hero" />
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
    if (typeof window.matchMedia === 'function' && !window.matchMedia('(pointer: fine)').matches)
      return;

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
  const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  if (reduceMotion || isTest) return <span className={className}>{text}</span>;
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <span className={`b360-words-wrap ${className}`.trim()}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="b360-word-item">
          <span
            className="b360-word"
            style={{ animationDelay: `${baseDelay + i * step}ms` }}
          >
            {w}
          </span>
          {i < words.length - 1 ? '\u00A0' : null}
        </span>
      ))}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Botão Neon Halo — cápsula com halo cônico e glow difuso multi-cor         */
/* -------------------------------------------------------------------------- */

export function B360NeonButton({
  children,
  onClick,
  className = '',
  disabled = false,
  type = 'button',
  variant = 'cyan',
  title,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'cyan' | 'pink' | 'gold' | 'iris';
  title?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={`b360-neon-halo-btn b360-neon-halo-btn-${variant} ${className}`}
    >
      <span className="b360-neon-halo-btn-content">{children}</span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Fanned Card Deck — Visão em leque 3D com perspectiva e hover coordenado   */
/* Inspirado nos frames 00:03-00:04 do vídeo de referência                  */
/* -------------------------------------------------------------------------- */

export interface FannedCardItem {
  id: string;
  num: string;
  title: string;
  tag: string;
  accentColor: string;
  desc: string;
  kpi: string;
}

const DEFAULT_FANNED_CARDS: FannedCardItem[] = [
  {
    id: '01',
    num: '01',
    title: 'Visão Unificada de Pipeline',
    tag: 'PIPELINE 360°',
    accentColor: '#00D4FF',
    desc: 'Visão unificada de oportunidades, contas e negociações com sincronização em tempo real.',
    kpi: 'R$ 4,2M pipeline',
  },
  {
    id: '06',
    num: '06',
    title: 'Íris IA & Enxame',
    tag: '24 AGENTES IA',
    accentColor: '#8B7DFF',
    desc: 'Supervisor autônomo orquestrando agentes especializados em vendas, previsão e CRM.',
    kpi: '24 agentes ativos',
  },
  {
    id: '02',
    num: '02',
    title: 'Sinais de Mercado B2B',
    tag: 'ENRIQUECIMENTO B2B',
    accentColor: '#FF2D9B',
    desc: 'Mapeamento de decisores, detecção preditiva de sinais de compra e qualificação ICP.',
    kpi: '96% match ICP',
  },
];

export function B360FannedCardDeck({
  cards = DEFAULT_FANNED_CARDS,
  onSelectCard,
}: {
  cards?: FannedCardItem[];
  onSelectCard?: (card: FannedCardItem) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="b360-fanned-container" data-reduced={reduceMotion ? 'true' : undefined}>
      <div className="b360-fanned-deck">
        {cards.map((c, i) => {
          const offset = i - (cards.length - 1) / 2;
          const rotZ = reduceMotion ? 0 : offset * 7;
          const transX = reduceMotion ? 0 : offset * 26;
          const transY = reduceMotion ? 0 : Math.abs(offset) * 10;
          const isHovered = hoveredIdx === i;

          return (
            <button
              type="button"
              key={c.id}
              onClick={() => onSelectCard?.(c)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`b360-fanned-card ${isHovered ? 'b360-fanned-card-active' : ''}`}
              style={
                {
                  '--card-accent': c.accentColor,
                  '--card-rot': `${rotZ}deg`,
                  '--card-tx': `${transX}px`,
                  '--card-ty': `${transY}px`,
                  zIndex: isHovered ? 10 : 3 - Math.abs(offset),
                } as React.CSSProperties
              }
            >
              <span className="b360-fanned-card-glow" />
              <span className="b360-fanned-card-header">
                <span className="b360-fanned-card-num">{c.num}</span>
                <span className="b360-fanned-card-tag">{c.tag}</span>
              </span>
              <strong className="b360-fanned-card-title">{c.title}</strong>
              <span className="b360-fanned-card-desc">{c.desc}</span>
              <span className="b360-fanned-card-footer">
                <span className="b360-fanned-card-kpi">{c.kpi}</span>
                <span className="b360-fanned-card-arrow">→</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Floating Gravity Nodes — Simulação com física interativa de nós de dados  */
/* Inspirado nos tokens caindo e repelindo o cursor no rodapé do vídeo        */
/* -------------------------------------------------------------------------- */

interface GravityNodeState {
  label: string;
  sublabel: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
}

const GRAVITY_NODES_DATA = [
  { label: 'P01 Hub', sublabel: 'Pipeline 360°', color: '#00D4FF' },
  { label: 'P02 Mercado', sublabel: 'Enriquecimento', color: '#FF2D9B' },
  { label: 'P03 Orquestração', sublabel: 'SLA < 15m', color: '#FFC107' },
  { label: 'P04 Performance', sublabel: 'Score & Metas', color: '#00D4FF' },
  { label: 'P05 Previsão', sublabel: 'Forecast Ponderado', color: '#8B7DFF' },
  { label: 'P06 Íris IA', sublabel: 'Supervisor Ativo', color: '#8B7DFF' },
  { label: 'P07 Automação', sublabel: 'Webhooks & Filas', color: '#FFC107' },
  { label: 'P08 Engajamento', sublabel: 'WhatsApp Cadência', color: '#FF2D9B' },
  { label: '24 Agentes IA', sublabel: 'Enxame Paralelo', color: '#8B7DFF' },
  { label: '59 Capacidades', sublabel: 'Catálogo Oficial', color: '#00D4FF' },
  { label: '100% RLS', sublabel: 'Multi-tenant Seguro', color: '#FFC107' },
  { label: 'Bitrix24 Realtime', sublabel: 'Sync Bidirecional', color: '#00D4FF' },
];

export {
  B360DecryptBlock,
  useB360MagneticAttraction,
  useB360ScrollParallax,
  useB360ScrollVelocityInertia,
  useB360SectionProgress,
} from './B360CinematicEngine.js';
export { B360DataStreamCursor } from './B360DataStreamCursor.js';
export { B360UnifiedPipelineFlow } from './B360UnifiedPipelineFlow.js';

export function B360FloatingGravityNodes() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      if (typeof canvas.getContext === 'function') {
        ctx = canvas.getContext('2d');
      }
    } catch {
      return;
    }
    if (!ctx) return;

    canvas.width = container.clientWidth;
    let width = canvas.width;
    canvas.height = 320;
    let height = canvas.height;

    const nodes: GravityNodeState[] = GRAVITY_NODES_DATA.map((item, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      return {
        label: item.label,
        sublabel: item.sublabel,
        color: item.color,
        x: 40 + col * (width / 4) + Math.random() * 20,
        y: 40 + row * 80 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        w: 154,
        h: 42,
      };
    });

    let mouseX = -9999;
    let mouseY = -9999;

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const onPointerLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
    };

    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', onPointerLeave);

    const onResize = () => {
      if (!container || !canvas) return;
      canvas.width = container.clientWidth;
      width = canvas.width;
      canvas.height = 320;
      height = canvas.height;
    };
    window.addEventListener('resize', onResize, { passive: true });

    let raf = 0;

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      for (const node of nodes) {
        node.vx *= 0.985;
        node.vy *= 0.985;

        const dx = node.x + node.w / 2 - mouseX;
        const dy = node.y + node.h / 2 - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = 130;

        if (dist < minDist && dist > 0) {
          const force = (minDist - dist) / minDist;
          node.vx += (dx / dist) * force * 1.8;
          node.vy += (dy / dist) * force * 1.8;
        }

        node.vx += (Math.random() - 0.5) * 0.08;
        node.vy += (Math.random() - 0.5) * 0.08;

        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 10) {
          node.x = 10;
          node.vx = Math.abs(node.vx) * 0.8;
        } else if (node.x + node.w > width - 10) {
          node.x = width - 10 - node.w;
          node.vx = -Math.abs(node.vx) * 0.8;
        }

        if (node.y < 10) {
          node.y = 10;
          node.vy = Math.abs(node.vy) * 0.8;
        } else if (node.y + node.h > height - 10) {
          node.y = height - 10 - node.h;
          node.vy = -Math.abs(node.vy) * 0.8;
        }

        const r = 21;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(node.x, node.y, node.w, node.h, r);

        ctx.fillStyle = 'rgba(11, 17, 32, 0.88)';
        ctx.fill();

        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1.4;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 10;
        ctx.stroke();

        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(node.x + 18, node.y + node.h / 2, 4, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = '700 12px "IBM Plex Mono", monospace';
        ctx.fillStyle = '#E8F2FF';
        ctx.fillText(node.label, node.x + 30, node.y + 19);

        ctx.font = '500 10.5px Inter, sans-serif';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(node.sublabel, node.x + 30, node.y + 33);

        ctx.restore();
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', onResize);
    };
  }, [reduceMotion]);

  if (reduceMotion) {
    return (
      <div className="b360-gravity-static-grid">
        {GRAVITY_NODES_DATA.map((item, idx) => (
          <div key={idx} className="b360-gravity-static-node" style={{ borderColor: item.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <div className="flex flex-col">
              <span className="font-mono text-xs font-bold text-[#E8F2FF]">{item.label}</span>
              <span className="text-[10px] text-slate-400 font-sans">{item.sublabel}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="b360-gravity-canvas-wrapper" aria-hidden="true">
      <canvas ref={canvasRef} className="b360-gravity-canvas" />
    </div>
  );
}
