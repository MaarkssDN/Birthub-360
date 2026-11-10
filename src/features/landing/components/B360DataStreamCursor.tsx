import { useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';

/**
 * Interface dos feixes de luz e motes de dados fotônicos
 */
interface StreamParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  initialSize: number;
  alpha: number;
  color: string;
  age: number;
  maxAge: number;
  isBeam: boolean;
}

/**
 * Ponto de histórico para desenho das fibras ópticas e sinapses neurais
 */
interface TrailPoint {
  x: number;
  y: number;
  time: number;
}

/**
 * B360DataStreamCursor — Cursor de Alta Precisão (Ponto de Foco) +
 * Rastro de Partículas (Fluxo de Dados & Feixes de Luz Sutis) +
 * Conexões Neurais de Fibra Óptica (Ativadas em áreas escuras e na seção "Onze módulos") +
 * Interação Magnética com Revelação Glassmorphism nos cards de
 * "Inteligência de mercado" (P02) e "Engajamento comercial" (P08).
 *
 * Totalmente acessível: desativa em prefers-reduced-motion e dispositivos de toque.
 */
export function B360DataStreamCursor() {
  const reduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduceMotion) return;
    if (typeof window === 'undefined') return;
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') return;
    // Habilitado para todos os ambientes desktop e estações com mouse/trackpad
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 768px)').matches
    ) {
      return;
    }

    const canvas = canvasRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!canvas || !dot || !ring) return;

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      return;
    }
    if (!ctx) return;

    document.body.classList.add('b360-custom-cursor-active');

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize, { passive: true });

    // Estado do mouse e cursor
    let mouseX = -100;
    let mouseY = -100;
    let prevMouseX = -100;
    let prevMouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isVisible = false;
    let isHoveringInteractive = false;
    let neuralIntensity = 0.35; // 0 a 1

    const particles: StreamParticle[] = [];
    const trail: TrailPoint[] = [];
    const MAX_TRAIL_POINTS = 22;

    // Paleta oficial de dados e feixes ópticos Birthub 360
    const PALETTE = [
      '#00D4FF', // Azul Ciano Neon
      '#FF2D9B', // Rosa Neon
      '#8B7DFF', // Íris Violeta
      '#00E5FF', // Feixe Ciano Intenso
      '#FF65B2', // Feixe Rosa Suave
    ];

    const onPointerMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
        ringX = mouseX;
        ringY = mouseY;
      }

      // Posicionamento síncrono e instantâneo do ponto de foco central (0ms de atraso)
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;

      const dx = mouseX - prevMouseX;
      const dy = mouseY - prevMouseY;
      const dist = Math.hypot(dx, dy);

      // Emissão orgânica de feixes e motes de dados ao mover o mouse
      if (dist > 3 && prevMouseX > 0) {
        const spawnCount = Math.min(4, Math.max(1, Math.floor(dist / 8)));
        for (let i = 0; i < spawnCount; i++) {
          const ratio = (i + 1) / (spawnCount + 1);
          const px = prevMouseX + dx * ratio;
          const py = prevMouseY + dy * ratio;
          const perpAngle = Math.atan2(dy, dx) + Math.PI / 2;
          const spread = (Math.random() - 0.5) * 4;
          const isBeam = Math.random() > 0.45;
          const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];

          particles.push({
            x: px + Math.cos(perpAngle) * spread,
            y: py + Math.sin(perpAngle) * spread,
            vx: -dx * 0.08 + (Math.random() - 0.5) * 0.8,
            vy: -dy * 0.08 + (Math.random() - 0.5) * 0.8,
            size: isBeam ? Math.random() * 1.8 + 1.2 : Math.random() * 2.4 + 1.2,
            initialSize: isBeam ? 2.5 : 3.0,
            alpha: 0.88,
            color,
            age: 0,
            maxAge: Math.floor(Math.random() * 20 + 24),
            isBeam,
          });
        }

        // Adiciona ponto ao histórico para conexões neurais
        trail.push({ x: mouseX, y: mouseY, time: performance.now() });
        if (trail.length > MAX_TRAIL_POINTS) {
          trail.shift();
        }
      }

      prevMouseX = mouseX;
      prevMouseY = mouseY;

      // Detecção de elementos interativos para expansão do anel de foco
      const targetEl = e.target as HTMLElement | null;
      if (targetEl) {
        const interactive = Boolean(
          targetEl.closest(
            'button, a, input, textarea, select, [role="button"], .b360-feature-card, .b360-neon-halo-btn, .b360-fanned-card',
          ),
        );
        if (interactive !== isHoveringInteractive) {
          isHoveringInteractive = interactive;
          if (interactive) {
            ring.classList.add('b360-cursor-ring-active');
          } else {
            ring.classList.remove('b360-cursor-ring-active');
          }
        }
      }
    };

    const onPointerLeave = () => {
      isVisible = false;
      dot.style.opacity = '0';
      ring.style.opacity = '0';
      ring.classList.remove(
        'b360-cursor-ring-active',
        'b360-cursor-magnetic-p2',
        'b360-cursor-magnetic-p8',
      );
    };

    const onPointerEnter = () => {
      isVisible = true;
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave);
    document.addEventListener('mouseenter', onPointerEnter);

    // Cache de referências para os cartões de "Inteligência de mercado" e "Engajamento comercial"
    const getTargetCards = () => {
      const p2 = document.querySelector<HTMLElement>('.b360-bento-p2, [data-pillar="02"]');
      const p8 = document.querySelector<HTMLElement>('.b360-bento-p8, [data-pillar="08"]');
      return { p2, p8 };
    };

    // Detecção se o cursor está sobre a seção "Onze módulos" (#destaques)
    const checkPillarsStage = (): boolean => {
      const stage =
        document.getElementById('destaques') ||
        document.querySelector<HTMLElement>('.b360-pillars-stage');
      if (!stage) return false;
      const rect = stage.getBoundingClientRect();
      return mouseY >= rect.top - 60 && mouseY <= rect.bottom + 60;
    };

    let rafId = 0;

    // Loop de Renderização e Animação Fluida (RAF)
    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Suavização (lerp) do anel de foco óptico para sensação cinematográfica
      ringX += (mouseX - ringX) * 0.24;
      ringY += (mouseY - ringY) * 0.24;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;

      // 2. Cálculo de Proximidade Magnética com os Cartões P02 e P08
      const { p2, p8 } = getTargetCards();
      const PROXIMITY_RADIUS = 260; // Raio de influência magnética em pixels
      let magneticActive = false;

      const updateCardMagnetic = (
        card: HTMLElement | null,
        type: 'p2' | 'p8',
        accentRgb: string,
      ) => {
        if (!card) return 0;
        const rect = card.getBoundingClientRect();
        // Ponto mais próximo do retângulo do cartão
        const closestX = Math.max(rect.left, Math.min(mouseX, rect.right));
        const closestY = Math.max(rect.top, Math.min(mouseY, rect.bottom));
        const dist = Math.hypot(mouseX - closestX, mouseY - closestY);

        if (dist < PROXIMITY_RADIUS && isVisible) {
          const intensity = Math.pow(1 - dist / PROXIMITY_RADIUS, 1.25);
          const relX = ((mouseX - rect.left) / rect.width) * 100;
          const relY = ((mouseY - rect.top) / rect.height) * 100;

          card.style.setProperty('--magnetic-x', `${relX.toFixed(1)}%`);
          card.style.setProperty('--magnetic-y', `${relY.toFixed(1)}%`);
          card.style.setProperty('--magnetic-intensity', intensity.toFixed(3));
          card.style.setProperty('--magnetic-rgb', accentRgb);
          card.classList.add('b360-magnetic-lit');

          if (type === 'p2') {
            ring.classList.add('b360-cursor-magnetic-p2');
            ring.classList.remove('b360-cursor-magnetic-p8');
          } else {
            ring.classList.add('b360-cursor-magnetic-p8');
            ring.classList.remove('b360-cursor-magnetic-p2');
          }
          magneticActive = true;
          return intensity;
        } else {
          if (card.classList.contains('b360-magnetic-lit')) {
            card.classList.remove('b360-magnetic-lit');
            card.style.setProperty('--magnetic-intensity', '0');
          }
          return 0;
        }
      };

      const intP2 = updateCardMagnetic(p2, 'p2', '255, 45, 155');
      const intP8 = updateCardMagnetic(p8, 'p8', '139, 125, 255');

      if (!magneticActive) {
        ring.classList.remove('b360-cursor-magnetic-p2', 'b360-cursor-magnetic-p8');
      }

      // 3. Modulação de Intensidade Neural (Ativa na seção "Onze módulos" ou tema dark)
      const isOverPillars = checkPillarsStage();
      const isDarkMode = document.documentElement.classList.contains('dark');
      const targetNeural = isOverPillars ? 1.0 : isDarkMode ? 0.72 : 0.35;
      neuralIntensity += (targetNeural - neuralIntensity) * 0.08;

      // 4. Renderização das Conexões de Fibra Óptica / Sinapses Neurais
      // Limpeza de pontos de rastro antigos
      const now = performance.now();
      while (trail.length > 0 && now - trail[0].time > 650) {
        trail.shift();
      }

      if (trail.length > 2 && isVisible && neuralIntensity > 0.05) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Traçado contínuo em gradiente suave (Azul Ciano -> Rosa Neon)
        for (let i = 0; i < trail.length - 1; i++) {
          const ptA = trail[i];
          const ptB = trail[i + 1];
          const progress = i / trail.length;
          const alpha = (progress * 0.45 + 0.1) * neuralIntensity;

          const grad = ctx.createLinearGradient(ptA.x, ptA.y, ptB.x, ptB.y);
          // Transição gradual entre azul ciano (#00D4FF) e rosa (#FF2D9B)
          grad.addColorStop(0, `rgba(0, 212, 255, ${alpha.toFixed(3)})`);
          grad.addColorStop(1, `rgba(255, 45, 155, ${(alpha * 0.95).toFixed(3)})`);

          ctx.beginPath();
          ctx.moveTo(ptA.x, ptA.y);
          ctx.lineTo(ptB.x, ptB.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.1 + progress * 0.8;
          ctx.shadowColor = '#00D4FF';
          ctx.shadowBlur = isOverPillars ? 8 : 4;
          ctx.stroke();
        }

        // Filamentos sinápticos secundários em leque conectando o cursor ao rastro recente
        if (trail.length >= 6) {
          const anchorIdx = Math.max(0, trail.length - 5);
          const anchor = trail[anchorIdx];
          const filamentAlpha = 0.22 * neuralIntensity;

          const filGrad = ctx.createLinearGradient(mouseX, mouseY, anchor.x, anchor.y);
          filGrad.addColorStop(0, `rgba(255, 45, 155, ${filamentAlpha.toFixed(3)})`);
          filGrad.addColorStop(1, `rgba(0, 212, 255, ${(filamentAlpha * 0.3).toFixed(3)})`);

          ctx.beginPath();
          ctx.moveTo(mouseX, mouseY);
          // Ponto de controle curvado para imitar nervura neural
          const cx = (mouseX + anchor.x) / 2 + (mouseY - anchor.y) * 0.15;
          const cy = (mouseY + anchor.y) / 2 - (mouseX - anchor.x) * 0.15;
          ctx.quadraticCurveTo(cx, cy, anchor.x, anchor.y);
          ctx.strokeStyle = filGrad;
          ctx.lineWidth = 0.8;
          ctx.shadowBlur = 4;
          ctx.stroke();
        }

        ctx.restore();
      }

      // 5. Conexões de Nodos Diretas para os Cartões Próximos (P02 / P08)
      if (isVisible && (intP2 > 0.05 || intP8 > 0.05)) {
        ctx.save();
        const drawSynapseToCard = (card: HTMLElement | null, color: string, intensity: number) => {
          if (!card || intensity <= 0.05) return;
          const rect = card.getBoundingClientRect();
          const targetX = rect.left + rect.width / 2;
          const targetY = rect.top + 28; // Nó do cabeçalho do cartão

          const grad = ctx.createLinearGradient(mouseX, mouseY, targetX, targetY);
          grad.addColorStop(0, `rgba(232, 242, 255, ${(intensity * 0.7).toFixed(3)})`);
          grad.addColorStop(0.5, color.replace(')', `, ${(intensity * 0.55).toFixed(3)})`));
          grad.addColorStop(1, color.replace(')', `, ${(intensity * 0.1).toFixed(3)})`));

          ctx.beginPath();
          ctx.moveTo(mouseX, mouseY);
          const midX = (mouseX + targetX) / 2;
          const midY = (mouseY + targetY) / 2 - 18;
          ctx.quadraticCurveTo(midX, midY, targetX, targetY);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.2;
          ctx.shadowColor = color.includes('255, 45') ? '#FF2D9B' : '#8B7DFF';
          ctx.shadowBlur = 10;
          ctx.stroke();

          // Ponto de pulso sináptico sobre o nó do cartão
          ctx.beginPath();
          ctx.arc(targetX, targetY, 3, 0, Math.PI * 2);
          ctx.fillStyle = color.replace(')', `, ${(intensity * 0.85).toFixed(3)})`);
          ctx.fill();
        };

        drawSynapseToCard(p2, 'rgba(255, 45, 155', intP2);
        drawSynapseToCard(p8, 'rgba(139, 125, 255', intP8);
        ctx.restore();
      }

      // 6. Atualização e Renderização das Partículas (Motes & Feixes de Luz)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age++;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;

        const lifeRatio = 1 - p.age / p.maxAge;
        if (lifeRatio <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const currentAlpha = p.alpha * lifeRatio;
        const currentSize = p.initialSize * (0.4 + 0.6 * lifeRatio);

        ctx.save();

        if (p.isBeam) {
          // Feixe de luz sutil — linha aerodinâmica com brilho
          const tailX = p.x - p.vx * 3.5;
          const tailY = p.y - p.vy * 3.5;
          const beamGrad = ctx.createLinearGradient(tailX, tailY, p.x, p.y);
          beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          beamGrad.addColorStop(1, p.color);

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = beamGrad;
          ctx.globalAlpha = currentAlpha;
          ctx.lineWidth = currentSize * 0.8;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.stroke();
        } else {
          // Mote de dados fotônico — orbe com halo suave
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = currentAlpha;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.fill();
        }

        ctx.restore();
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('mouseleave', onPointerLeave);
      document.removeEventListener('mouseenter', onPointerEnter);
      document.body.classList.remove('b360-custom-cursor-active');

      const { p2, p8 } = getTargetCards();
      p2?.classList.remove('b360-magnetic-lit');
      p8?.classList.remove('b360-magnetic-lit');
    };
  }, [reduceMotion]);

  if (reduceMotion) return null;

  return (
    <>
      {/* Canvas acelerado por hardware para fluxo de partículas, feixes e conexões neurais */}
      <canvas ref={canvasRef} className="b360-data-stream-canvas" aria-hidden="true" />

      {/* Ponto de foco central — núcleo de precisão óptica */}
      <div ref={dotRef} className="b360-cursor-focus-dot" aria-hidden="true" />

      {/* Anel de foco óptico com abertura e resposta magnética */}
      <div ref={ringRef} className="b360-cursor-focus-ring" aria-hidden="true" />
    </>
  );
}
