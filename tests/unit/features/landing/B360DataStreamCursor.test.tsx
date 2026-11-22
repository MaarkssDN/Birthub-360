import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { B360DataStreamCursor } from '@/features/landing/components/B360DataStreamCursor';
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

function renderCursorScene() {
  return render(
    <div>
      <div className="b360-bento-p2" data-pillar="02" data-testid="card-p2">
        Inteligência de mercado
      </div>
      <div className="b360-bento-p8" data-pillar="08" data-testid="card-p8">
        Engajamento comercial
      </div>
      <div id="destaques" className="b360-pillars-stage" data-testid="pillars">
        Onze módulos
      </div>
      <button type="button">Abrir módulo</button>
      <B360DataStreamCursor />
    </div>,
  );
}

describe('B360DataStreamCursor', () => {
  let raf: RafController;

  beforeEach(() => {
    reduceMotion.current = false;
    restoreCinematicRuntime();
    stubDesktopViewport();
    installMatchMedia({ maxWidth768: false, pointerFine: true, reducedMotion: false });
    raf = installRafQueue();
    document.body.classList.remove('b360-custom-cursor-active');
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    cleanup();
    restoreCinematicRuntime();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('não renderiza o cursor quando prefers-reduced-motion está ativo', () => {
    reduceMotion.current = true;
    const { container } = render(<B360DataStreamCursor />);
    expect(container.querySelector('canvas')).not.toBeInTheDocument();
    expect(container.querySelector('.b360-cursor-focus-dot')).not.toBeInTheDocument();
    expect(document.body.classList.contains('b360-custom-cursor-active')).toBe(false);
  });

  it('renderiza canvas e cursores, mas não liga o efeito no ambiente de teste', () => {
    // Stub canvas/rAF presentes: se o guard NODE_ENV==='test' for removido, o loop
    // liga e este teste falha (classe ativa + rAF enfileirado).
    const { ctx } = installCanvasStub();
    const { container } = render(<B360DataStreamCursor />);
    expect(container.querySelector('canvas.b360-data-stream-canvas')).toBeInTheDocument();
    expect(container.querySelector('.b360-cursor-focus-dot')).toBeInTheDocument();
    expect(container.querySelector('.b360-cursor-focus-ring')).toBeInTheDocument();
    expect(document.body.classList.contains('b360-custom-cursor-active')).toBe(false);
    expect(raf.pendingCount()).toBe(0);
    expect(ctx.clearRect).not.toHaveBeenCalled();
  });

  it('não ativa o cursor customizado em viewport móvel', () => {
    enableCinematicRuntime();
    installCanvasStub();
    installMatchMedia({ maxWidth768: true, pointerFine: false });
    render(<B360DataStreamCursor />);
    expect(document.body.classList.contains('b360-custom-cursor-active')).toBe(false);
  });

  it('encerra o efeito se o canvas não oferecer contexto 2d', () => {
    enableCinematicRuntime();
    installCanvasStub('null');
    render(<B360DataStreamCursor />);
    expect(document.body.classList.contains('b360-custom-cursor-active')).toBe(false);
  });

  it('encerra o efeito se getContext lançar', () => {
    enableCinematicRuntime();
    installCanvasStub('throw');
    render(<B360DataStreamCursor />);
    expect(document.body.classList.contains('b360-custom-cursor-active')).toBe(false);
  });

  it('segue o ponteiro, destaca alvos interativos e desenha o fluxo no canvas', () => {
    enableCinematicRuntime();
    const { ctx } = installCanvasStub();
    const { container, unmount } = renderCursorScene();

    expect(document.body.classList.contains('b360-custom-cursor-active')).toBe(true);

    const canvas = container.querySelector('canvas.b360-data-stream-canvas') as HTMLCanvasElement;
    const dot = container.querySelector('.b360-cursor-focus-dot') as HTMLDivElement;
    const ring = container.querySelector('.b360-cursor-focus-ring') as HTMLDivElement;
    const button = container.querySelector('button') as HTMLButtonElement;
    const p2 = container.querySelector('.b360-bento-p2') as HTMLElement;
    const p8 = container.querySelector('.b360-bento-p8') as HTMLElement;
    const stage = container.querySelector('#destaques') as HTMLElement;

    stubElementBox(p2, { left: 80, top: 80, width: 200, height: 160 });
    stubElementBox(p8, { left: 900, top: 80, width: 200, height: 160 });
    stubElementBox(stage, { left: 0, top: 0, width: 1280, height: 700 });

    dispatchPointer(document.body, 'pointermove', 40, 40);
    expect(dot.style.opacity).toBe('1');
    expect(ring.style.opacity).toBe('1');
    expect(dot.style.transform).toContain('40px');

    // Segundo movimento com distância suficiente emite partículas e pontos de rastro
    dispatchPointer(document.body, 'pointermove', 120, 100);
    dispatchPointer(document.body, 'pointermove', 180, 140);
    dispatchPointer(p2, 'pointermove', 220, 150);
    dispatchPointer(p2, 'pointermove', 200, 130);
    dispatchPointer(p2, 'pointermove', 190, 120);
    dispatchPointer(button, 'pointermove', 160, 110);

    expect(ring.classList.contains('b360-cursor-ring-active')).toBe(true);

    act(() => {
      raf.flush(8, 16);
    });
    expect(ctx.clearRect).toHaveBeenCalled();
    expect(p2.classList.contains('b360-magnetic-lit')).toBe(true);
    expect(ring.classList.contains('b360-cursor-magnetic-p2')).toBe(true);

    dispatchPointer(p8, 'pointermove', 1000, 140);
    act(() => {
      raf.flush(3, 200);
    });
    expect(p8.classList.contains('b360-magnetic-lit')).toBe(true);
    expect(ring.classList.contains('b360-cursor-magnetic-p8')).toBe(true);

    dispatchPointer(document.body, 'pointermove', 600, 500);
    act(() => {
      raf.flush(3, 280);
    });
    expect(ring.classList.contains('b360-cursor-magnetic-p2')).toBe(false);
    expect(ring.classList.contains('b360-cursor-magnetic-p8')).toBe(false);

    document.documentElement.classList.add('dark');
    fireEvent.resize(window);
    expect(canvas.width).toBe(window.innerWidth);

    fireEvent.mouseLeave(document);
    expect(dot.style.opacity).toBe('0');
    expect(ring.style.opacity).toBe('0');

    fireEvent.mouseEnter(document);
    expect(dot.style.opacity).toBe('1');

    unmount();
    expect(document.body.classList.contains('b360-custom-cursor-active')).toBe(false);
    expect(raf.caf).toHaveBeenCalled();
  });

  it('envelhece e remove partículas após vários frames do loop', () => {
    enableCinematicRuntime();
    // Alterna feixes (stroke) e motes (fill) e mantém vida curta o bastante para expirar
    let n = 0;
    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
      n += 1;
      return n % 2 === 0 ? 0.9 : 0.1;
    });
    const { ctx } = installCanvasStub();
    const { unmount } = renderCursorScene();

    expect(document.body.classList.contains('b360-custom-cursor-active')).toBe(true);

    dispatchPointer(document.body, 'pointermove', 10, 10);
    dispatchPointer(document.body, 'pointermove', 80, 90);
    dispatchPointer(document.body, 'pointermove', 160, 200);
    dispatchPointer(document.body, 'pointermove', 240, 280);
    dispatchPointer(document.body, 'pointermove', 300, 320);

    act(() => {
      raf.flush(1, 16);
    });
    expect(ctx.clearRect).toHaveBeenCalled();

    act(() => {
      raf.flush(50, 32);
    });
    expect(ctx.stroke.mock.calls.length + ctx.fill.mock.calls.length).toBeGreaterThan(0);

    random.mockRestore();
    unmount();
  });
});
