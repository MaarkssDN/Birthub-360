import { useEffect } from 'react';

/**
 * Hook de Rolagem Inercial Suave (Inertia Damped Scroll)
 * Simula a física inercial do Lenis com 60/120 FPS via requestAnimationFrame
 * e interpolação linear (LERP), sem adicionar dependências pesadas ao bundle.
 *
 * Desativa automaticamente em dispositivos de toque e quando
 * `prefers-reduced-motion` estiver ativo.
 */
export function useSmoothInertiaScroll(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Respeita prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Desativa em dispositivos de toque puro (mobile/tablet nativo já possui inércia elástica)
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice && window.innerWidth < 1024) return;

    let targetY = window.scrollY;
    let currentY = window.scrollY;
    let isRunning = false;
    let animationFrameId: number;

    const lerpFactor = 0.085; // Damping inercial de alta precisão

    const updateScroll = () => {
      // Interpolação suave em direção ao alvo
      currentY += (targetY - currentY) * lerpFactor;

      window.scrollTo(0, Math.round(currentY));

      // Continua enquanto houver diferença perceptível
      if (Math.abs(targetY - currentY) > 0.5) {
        animationFrameId = requestAnimationFrame(updateScroll);
      } else {
        isRunning = false;
        currentY = targetY;
      }
    };

    const onWheel = (e: WheelEvent) => {
      // Não intercepta se o usuário estiver rolando dentro de um modal ou textarea
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('textarea, input, select, [data-scrollable="true"]')) {
        return;
      }

      // Previne salto abrupto padrão do mousewheel no desktop
      e.preventDefault();

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      targetY += e.deltaY * 0.95;
      targetY = Math.max(0, Math.min(targetY, maxScroll));

      if (!isRunning) {
        isRunning = true;
        animationFrameId = requestAnimationFrame(updateScroll);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', onWheel);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [enabled]);
}
