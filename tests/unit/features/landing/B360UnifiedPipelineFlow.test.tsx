import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { B360UnifiedPipelineFlow } from '@/features/landing/components/B360UnifiedPipelineFlow';
import {
  enableCinematicRuntime,
  installCanvasStub,
  installMatchMedia,
  installRafQueue,
  restoreCinematicRuntime,
  stubDesktopViewport,
  stubElementBox,
  dispatchPointer,
  type RafController,
} from './cinematicTestUtils';

const reduceMotion = { current: false };

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    useReducedMotion: () => reduceMotion.current,
  };
});

describe('B360UnifiedPipelineFlow', () => {
  let raf: RafController;

  beforeEach(() => {
    reduceMotion.current = false;
    restoreCinematicRuntime();
    stubDesktopViewport();
    installMatchMedia({ reducedMotion: false, pointerFine: true });
    raf = installRafQueue();
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return 900;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get() {
        return 400;
      },
    });
  });

  afterEach(() => {
    cleanup();
    restoreCinematicRuntime();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('mostra o painel estático com conectores quando reduced-motion está ativo', () => {
    reduceMotion.current = true;
    render(<B360UnifiedPipelineFlow />);
    expect(
      screen.getByRole('region', { name: /visualização de pipeline integrado/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Pipeline Unificado/i)).toBeInTheDocument();
    expect(screen.getByText(/Bitrix24, HubSpot, Salesforce, WhatsApp, VoiceHub/i)).toBeInTheDocument();
    expect(document.querySelector('canvas')).not.toBeInTheDocument();
  });

  it('renderiza o HUD interativo, mas não liga o loop de canvas no ambiente de teste', () => {
    // Stub canvas/rAF presentes: se o guard NODE_ENV==='test' for removido, o loop
    // agenda rAF e este teste falha.
    const { ctx } = installCanvasStub();
    render(<B360UnifiedPipelineFlow />);
    expect(
      screen.getByRole('region', {
        name: /fluxo interativo de pipeline unificado/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/FLUXO CONTÍNUO DE SINAIS/i)).toBeInTheDocument();
    expect(screen.getByText(/Eventos integrados:/i)).toBeInTheDocument();
    expect(screen.getByText('1.482')).toBeInTheDocument();
    expect(document.querySelector('canvas.b360-unified-pipeline-canvas')).toBeInTheDocument();
    expect(raf.pendingCount()).toBe(0);
    expect(ctx.clearRect).not.toHaveBeenCalled();
  });

  it('não inicia o loop se o contexto 2d estiver indisponível', () => {
    enableCinematicRuntime();
    installCanvasStub('null');
    render(<B360UnifiedPipelineFlow />);
    expect(raf.pendingCount()).toBe(0);
  });

  it('não inicia o loop se getContext lançar', () => {
    enableCinematicRuntime();
    installCanvasStub('throw');
    render(<B360UnifiedPipelineFlow />);
    expect(raf.pendingCount()).toBe(0);
  });

  it('anima pacotes no canvas, desvia no hover e incrementa os eventos integrados', () => {
    enableCinematicRuntime();
    const { ctx } = installCanvasStub();
    const { container, unmount } = render(<B360UnifiedPipelineFlow />);

    const canvas = container.querySelector('canvas.b360-unified-pipeline-canvas') as HTMLCanvasElement;
    stubElementBox(canvas, { left: 0, top: 0, width: 900, height: 400 });
    expect(canvas.width).toBe(900);
    expect(canvas.height).toBeGreaterThanOrEqual(340);

    // lastSpawn usa performance.now(); o rAF precisa avançar a partir desse relógio
    const clock = performance.now();
    act(() => {
      raf.flush(1, clock);
    });
    expect(ctx.clearRect).toHaveBeenCalled();
    expect(ctx.bezierCurveTo).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith('PIPELINE 360°', expect.any(Number), expect.any(Number));

    // Spawn (intervalo 140ms) e percurso até t >= 1 (~0.0035/frame → ~290 frames)
    act(() => {
      raf.flush(20, clock + 200);
    });
    dispatchPointer(canvas, 'pointermove', 450, 200);
    act(() => {
      raf.flush(300, clock + 520);
    });
    expect(ctx.arc).toHaveBeenCalled();
    const kpi = container.querySelector('.b360-pipeline-kpi') as HTMLElement;
    const numeric = Number((kpi.textContent || '').replace(/\D/g, ''));
    expect(numeric).toBeGreaterThan(1482);

    dispatchPointer(canvas, 'pointerleave', 0, 0);
    act(() => {
      raf.flush(4, clock + 6000);
    });

    fireEvent.resize(window);
    expect(canvas.width).toBe(900);

    unmount();
    expect(raf.caf).toHaveBeenCalled();
  });
});
