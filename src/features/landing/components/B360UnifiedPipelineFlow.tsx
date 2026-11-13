import { useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface StreamPacket {
  id: number;
  sourceIndex: number;
  t: number; // 0 a 1 ao longo da curva
  speed: number;
  color: string;
  label: string;
  size: number;
  deflectX: number;
  deflectY: number;
}

interface ConnectorSource {
  name: string;
  tag: string;
  color: string;
  side: 'left' | 'right';
  yOffset: number; // -1 a 1
}

const SOURCES: ConnectorSource[] = [
  { name: 'Bitrix24', tag: 'SYNC REALTIME', color: '#00D4FF', side: 'left', yOffset: -0.65 },
  { name: 'HubSpot', tag: 'INBOUND DEALS', color: '#FF7A59', side: 'left', yOffset: -0.15 },
  { name: 'WhatsApp API', tag: 'WHATSAPP BOT', color: '#22C55E', side: 'left', yOffset: 0.45 },
  { name: 'Salesforce', tag: 'ENTERPRISE CRM', color: '#00A1E0', side: 'right', yOffset: -0.65 },
  { name: 'VoiceHub', tag: 'CALL TELEMETRY', color: '#8B7DFF', side: 'right', yOffset: -0.15 },
  { name: 'Webhooks & APIs', tag: 'EVENT STREAM', color: '#FF2D9B', side: 'right', yOffset: 0.45 },
];

const PACKET_LABELS = ['LEAD', 'DEAL', 'EVENT', 'VOICE', 'SYNC', 'SLA', 'PIPELINE'];

/**
 * B360UnifiedPipelineFlow — Visualização Cinematográfica de Pipeline Unificado
 * Substitui o mini-jogo de blocos caindo por pacotes luminosos que fluem dos
 * conectores do ecossistema em direção ao módulo central com desvio fluido
 * interativo em tempo real ao passar o mouse.
 */
export function B360UnifiedPipelineFlow() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduceMotion = useReducedMotion();
  const [pulseCount, setPulseCount] = useState(1482);

  useEffect(() => {
    if (reduceMotion) return;
    if (typeof window === 'undefined') return;
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      return;
    }
    if (!ctx) return;

    canvas.width = container.clientWidth;
    let width = canvas.width;
    canvas.height = Math.max(340, container.clientHeight);
    let height = canvas.height;

    const onResize = () => {
      if (!container || !canvas) return;
      canvas.width = container.clientWidth;
      width = canvas.width;
      canvas.height = Math.max(340, container.clientHeight);
      height = canvas.height;
    };
    window.addEventListener('resize', onResize, { passive: true });

    let mouseX = -9999;
    let mouseY = -9999;
    let isHovering = false;

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isHovering = true;
    };

    const onPointerLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
      isHovering = false;
    };

    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', onPointerLeave);

    const packets: StreamPacket[] = [];
    const MAX_PACKETS = 36;
    let packetSeq = 0;
    let centralPulse = 0;

    // Gerador de pacote
    const spawnPacket = () => {
      if (packets.length >= MAX_PACKETS) return;
      const sourceIdx = Math.floor(Math.random() * SOURCES.length);
      const source = SOURCES[sourceIdx];
      packets.push({
        id: ++packetSeq,
        sourceIndex: sourceIdx,
        t: 0,
        speed: 0.0035 + Math.random() * 0.003,
        color: source.color,
        label: PACKET_LABELS[Math.floor(Math.random() * PACKET_LABELS.length)],
        size: Math.random() * 2 + 3,
        deflectX: 0,
        deflectY: 0,
      });
    };

    let rafId = 0;
    let lastSpawn = performance.now();

    const tick = (now: number) => {
      if (now - lastSpawn > 140) {
        spawnPacket();
        lastSpawn = now;
      }

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Desenho das Linhas Guia dos Conectores (Streamlines)
      SOURCES.forEach((source) => {
        const startX = source.side === 'left' ? 40 : width - 40;
        const startY = centerY + source.yOffset * (height * 0.38);

        const cp1X = source.side === 'left' ? startX + width * 0.18 : startX - width * 0.18;
        const cp1Y = startY;
        const cp2X = source.side === 'left' ? centerX - 60 : centerX + 60;
        const cp2Y = centerY;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, centerX, centerY);
        ctx.strokeStyle = `rgba(${source.color.includes('255, 45') ? '255, 45, 155' : '0, 212, 255'}, 0.12)`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Nó de ancoragem do conector
        ctx.beginPath();
        ctx.arc(startX, startY, 4, 0, Math.PI * 2);
        ctx.fillStyle = source.color;
        ctx.shadowColor = source.color;
        ctx.shadowBlur = 8;
        ctx.fill();

        ctx.restore();
      });

      // 2. Módulo Central (Pipeline Unificado 360°)
      centralPulse = Math.max(0, centralPulse - 0.04);
      const coreRadius = 38 + centralPulse * 8;

      ctx.save();
      // Anel Externo Pulsante
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius + 14, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 212, 255, ${(0.18 + centralPulse * 0.4).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00D4FF';
      ctx.shadowBlur = 12;
      ctx.stroke();

      // Núcleo Central
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 4, centerX, centerY, coreRadius);
      coreGrad.addColorStop(0, 'rgba(0, 212, 255, 0.35)');
      coreGrad.addColorStop(0.7, 'rgba(11, 20, 42, 0.95)');
      coreGrad.addColorStop(1, 'rgba(6, 12, 28, 0.98)');
      ctx.fillStyle = coreGrad;
      ctx.fill();
      ctx.strokeStyle = '#00D4FF';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Ícone / Texto Central
      ctx.font = '700 11px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#E8F2FF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PIPELINE 360°', centerX, centerY - 6);

      ctx.font = '600 9.5px Inter, sans-serif';
      ctx.fillStyle = '#00D4FF';
      ctx.fillText('UNIFICADO', centerX, centerY + 8);
      ctx.restore();

      // 3. Atualização e Renderização dos Pacotes com Desvio Fluido
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.t += p.speed;

        if (p.t >= 1) {
          packets.splice(i, 1);
          centralPulse = 1.0;
          setPulseCount((prev) => prev + 1);
          continue;
        }

        const source = SOURCES[p.sourceIndex];
        const startX = source.side === 'left' ? 40 : width - 40;
        const startY = centerY + source.yOffset * (height * 0.38);

        const cp1X = source.side === 'left' ? startX + width * 0.18 : startX - width * 0.18;
        const cp1Y = startY;
        const cp2X = source.side === 'left' ? centerX - 60 : centerX + 60;
        const cp2Y = centerY;

        // Equação cúbica de Bézier B(t)
        const t = p.t;
        const invT = 1 - t;
        const bx =
          invT * invT * invT * startX +
          3 * invT * invT * t * cp1X +
          3 * invT * t * t * cp2X +
          t * t * t * centerX;
        const by =
          invT * invT * invT * startY +
          3 * invT * invT * t * cp1Y +
          3 * invT * t * t * cp2Y +
          t * t * t * centerY;

        // Desvio Fluido Interativo ao Aproximar o Mouse
        let targetDeflectX = 0;
        let targetDeflectY = 0;

        if (isHovering) {
          const dx = bx + p.deflectX - mouseX;
          const dy = by + p.deflectY - mouseY;
          const dist = Math.hypot(dx, dy);
          const DEFLECT_RADIUS = 130;

          if (dist < DEFLECT_RADIUS && dist > 0) {
            const force = ((DEFLECT_RADIUS - dist) / DEFLECT_RADIUS) ** 1.4;
            // Empuxo tangencial e perpendicular suave
            const angle = Math.atan2(dy, dx);
            targetDeflectX = Math.cos(angle) * force * 52;
            targetDeflectY = Math.sin(angle) * force * 52;
          }
        }

        // Amortecimento suave do desvio
        p.deflectX += (targetDeflectX - p.deflectX) * 0.18;
        p.deflectY += (targetDeflectY - p.deflectY) * 0.18;

        const renderX = bx + p.deflectX;
        const renderY = by + p.deflectY;

        ctx.save();
        // Rastro luminoso do pacote (feixe fotônico)
        const trailAlpha = (1 - p.t * 0.4) * 0.85;
        ctx.beginPath();
        ctx.arc(renderX, renderY, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.globalAlpha = trailAlpha;
        ctx.fill();

        // Núcleo branco brilhante
        ctx.beginPath();
        ctx.arc(renderX, renderY, p.size * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Rótulo micro do pacote
        if (p.t > 0.15 && p.t < 0.85 && p.size > 3.8) {
          ctx.font = '700 8px "IBM Plex Mono", monospace';
          ctx.fillStyle = p.color;
          ctx.textAlign = 'center';
          ctx.fillText(p.label, renderX, renderY - 8);
        }

        ctx.restore();
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [reduceMotion]);

  if (reduceMotion) {
    return (
      <section
        className="b360-pipeline-static-panel"
        aria-label="Visualização de Pipeline Integrado"
      >
        <div className="b360-pipeline-banner flex items-center justify-between p-4 rounded-2xl border border-slate-700/60">
          <span className="font-mono text-xs text-sky-400 font-bold uppercase">
            ✦ Pipeline Unificado · Operação 360° em Tempo Real
          </span>
          <span className="font-mono text-xs text-slate-300">
            Conectores Ativos: Bitrix24, HubSpot, Salesforce, WhatsApp, VoiceHub
          </span>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className="b360-unified-pipeline-wrapper"
      aria-label="Fluxo Interativo de Pipeline Unificado e Conectores do Ecossistema"
    >
      <div className="b360-pipeline-hud-overlay">
        <span className="b360-pipeline-badge">
          <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
          FLUXO CONTÍNUO DE SINAIS & DADOS
        </span>
        <span className="b360-pipeline-kpi">
          Eventos integrados: <strong>{pulseCount.toLocaleString('pt-BR')}</strong>
        </span>
      </div>
      <canvas ref={canvasRef} className="b360-unified-pipeline-canvas" />
    </section>
  );
}
