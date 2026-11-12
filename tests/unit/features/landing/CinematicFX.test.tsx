import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  B360AmbientFX,
  B360CountUp,
  B360FannedCardDeck,
  B360FloatingGravityNodes,
  B360FloatingNodes,
  B360NeonButton,
  B360ScrollProgress,
  B360Words,
  useB360CardTilt,
} from '@/features/landing/components/CinematicFX';
import {
  enableCinematicRuntime,
  installCanvasStub,
  installIntersectingObserver,
  installMatchMedia,
  installRafQueue,
  restoreCinematicRuntime,
  stubDesktopViewport,
  stubElementBox,
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

function TiltProbe() {
  useB360CardTilt([]);
  return (
    <article className="b360-feature-card" data-testid="card">
      Card
    </article>
  );
}

describe('CinematicFX', () => {
  let raf: RafController;

  beforeEach(() => {
    reduceMotion.current = false;
    restoreCinematicRuntime();
    stubDesktopViewport();
    installMatchMedia({ reducedMotion: false, pointerFine: true, maxWidth768: false });
    raf = installRafQueue();
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return 800;
      },
    });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 2000,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(document.documentElement, 'scrollTop', {
      configurable: true,
      writable: true,
      value: 0,
    });
  });

  afterEach(() => {
    cleanup();
    restoreCinematicRuntime();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('B360ScrollProgress', () => {
    it('esconde a barra quando reduced-motion está ativo', () => {
      reduceMotion.current = true;
      const { container } = render(<B360ScrollProgress />);
      const bar = container.querySelector('.b360-scroll-progress-bar') as HTMLDivElement;
      expect(bar.style.display).toBe('none');
    });

    it('atualiza a escala da barra conforme o scroll e o resize', () => {
      const { container, unmount } = render(<B360ScrollProgress />);
      const bar = container.querySelector('.b360-scroll-progress-bar') as HTMLDivElement;
      expect(bar.style.transform).toBe('scaleX(0)');

      Object.defineProperty(document.documentElement, 'scrollTop', {
        configurable: true,
        value: 600,
      });
      fireEvent.scroll(window);
      raf.flush(1, 16);
      expect(bar.style.transform).toBe('scaleX(0.5)');

      fireEvent.resize(window);
      raf.flush(1, 32);
      unmount();
    });
  });

  describe('B360FloatingNodes e B360AmbientFX', () => {
    it('marca o campo como ativo quando não há IntersectionObserver', () => {
      const original = window.IntersectionObserver;
      // @ts-expect-error — simula ambiente sem IO
      delete (window as { IntersectionObserver?: unknown }).IntersectionObserver;
      const { container } = render(<B360FloatingNodes variant="footer" />);
      const field = container.querySelector('.b360-node-field-footer') as HTMLElement;
      expect(field.dataset.active).toBe('true');
      expect(container.querySelectorAll('.b360-data-node')).toHaveLength(6);
      window.IntersectionObserver = original;
    });

    it('liga e desliga a animação conforme a visibilidade do campo', () => {
      let observerCb: IntersectionObserverCallback | null = null;
      class CapturingIO implements IntersectionObserver {
        readonly root = null;
        readonly rootMargin = '';
        readonly thresholds: ReadonlyArray<number> = [];
        constructor(cb: IntersectionObserverCallback) {
          observerCb = cb;
        }
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
        takeRecords(): IntersectionObserverEntry[] {
          return [];
        }
      }
      window.IntersectionObserver = CapturingIO as unknown as typeof IntersectionObserver;
      const { container, unmount } = render(<B360FloatingNodes />);
      const field = container.querySelector('.b360-node-field') as HTMLElement;
      expect(observerCb).toBeTruthy();
      observerCb?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      expect(field.dataset.active).toBe('true');
      observerCb?.(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      expect(field.dataset.active).toBe('false');
      unmount();
    });

    it('renderiza o ambient do hero com motes e respeita reduced-motion', () => {
      reduceMotion.current = true;
      const { container } = render(<B360AmbientFX />);
      const root = container.querySelector('.b360-ambientfx-hero') as HTMLElement;
      expect(root).toHaveAttribute('data-reduced', 'true');
      expect(container.querySelectorAll('.b360-mote')).toHaveLength(10);
      expect(container.querySelector('.b360-ambientfx-grid')).toBeInTheDocument();
    });
  });

  describe('B360CountUp', () => {
    it('mostra o valor final imediatamente com reduced-motion', () => {
      reduceMotion.current = true;
      render(
        <B360CountUp to={99.9} prefix="" suffix="%" decimals={1} />,
      );
      expect(screen.getByText('99,9%')).toBeInTheDocument();
    });

    it('anima até o alvo quando o número entra na viewport', () => {
      installIntersectingObserver();
      render(<B360CountUp to={50} suffix="+" duration={0.05} />);
      expect(screen.getByText('0+')).toBeInTheDocument();
      const started = performance.now();
      act(() => {
        raf.flush(1, started);
        raf.flush(1, started + 80);
      });
      expect(screen.getByText('50+')).toBeInTheDocument();
    });
  });

  describe('useB360CardTilt', () => {
    it('não inclina cards quando o ponteiro não é fino', () => {
      installMatchMedia({ pointerFine: false, reducedMotion: false });
      render(<TiltProbe />);
      const card = screen.getByTestId('card');
      fireEvent.pointerMove(card, { clientX: 40, clientY: 20 });
      expect(card.style.transform).toBe('');
    });

    it('aplica perspectiva no hover e limpa ao sair', () => {
      const { unmount } = render(<TiltProbe />);
      const card = screen.getByTestId('card');
      stubElementBox(card, { left: 0, top: 0, width: 200, height: 100 });
      fireEvent.pointerMove(card, { clientX: 150, clientY: 20 });
      expect(card.style.transform).toContain('perspective(1100px)');
      fireEvent.pointerLeave(card);
      expect(card.style.transform).toBe('');
      unmount();
    });
  });

  describe('B360Words', () => {
    it('renderiza o texto corrido no ambiente de teste', () => {
      render(<B360Words text="Dados que Conectam" className="titulo" />);
      const el = screen.getByText('Dados que Conectam');
      expect(el.tagName).toBe('SPAN');
      expect(el).toHaveClass('titulo');
      expect(document.querySelector('.b360-word-item')).not.toBeInTheDocument();
    });

    it('parte o texto em palavras animadas fora do ambiente de teste', () => {
      enableCinematicRuntime();
      const { container } = render(<B360Words text="Inteligência que Decide" baseDelay={10} step={20} />);
      expect(container.querySelectorAll('.b360-word-item')).toHaveLength(3);
      expect(container.querySelector('.b360-word')).toHaveStyle({ animationDelay: '10ms' });
      expect(screen.getByText('Inteligência')).toBeInTheDocument();
      expect(screen.getByText('Decide')).toBeInTheDocument();
    });

    it('cai no texto corrido com reduced-motion mesmo fora do ambiente de teste', () => {
      enableCinematicRuntime();
      reduceMotion.current = true;
      render(<B360Words text="Fluxo contínuo" />);
      expect(screen.getByText('Fluxo contínuo')).toBeInTheDocument();
      expect(document.querySelector('.b360-word-item')).not.toBeInTheDocument();
    });
  });

  describe('B360NeonButton', () => {
    it('dispara o clique, aplica variante e respeita disabled', () => {
      const onClick = vi.fn();
      const { rerender } = render(
        <B360NeonButton variant="pink" ariaLabel="Começar" onClick={onClick}>
          Começar agora
        </B360NeonButton>,
      );
      const btn = screen.getByRole('button', { name: 'Começar' });
      expect(btn).toHaveClass('b360-neon-halo-btn-pink');
      fireEvent.click(btn);
      expect(onClick).toHaveBeenCalledTimes(1);

      rerender(
        <B360NeonButton disabled onClick={onClick}>
          Bloqueado
        </B360NeonButton>,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Bloqueado' }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('B360FannedCardDeck', () => {
    it('renderiza o leque padrão, destaca no hover e notifica a seleção', () => {
      const onSelect = vi.fn();
      render(<B360FannedCardDeck onSelectCard={onSelect} />);
      expect(screen.getByText('Visão Unificada de Pipeline')).toBeInTheDocument();
      expect(screen.getByText('Íris IA & Enxame')).toBeInTheDocument();
      expect(screen.getByText('Sinais de Mercado B2B')).toBeInTheDocument();

      const first = screen.getByRole('button', { name: /Visão Unificada de Pipeline/i });
      fireEvent.mouseEnter(first);
      expect(first).toHaveClass('b360-fanned-card-active');
      fireEvent.click(first);
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: '01' }));
      fireEvent.mouseLeave(first);
      expect(first).not.toHaveClass('b360-fanned-card-active');
    });

    it('zera a rotação do leque com reduced-motion', () => {
      reduceMotion.current = true;
      const { container } = render(<B360FannedCardDeck />);
      const root = container.querySelector('.b360-fanned-container') as HTMLElement;
      expect(root).toHaveAttribute('data-reduced', 'true');
      const card = container.querySelector('.b360-fanned-card') as HTMLElement;
      expect(card.style.getPropertyValue('--card-rot')).toBe('0deg');
      expect(card.style.getPropertyValue('--card-tx')).toBe('0px');
    });
  });

  describe('B360FloatingGravityNodes', () => {
    it('mostra a grade estática acessível com reduced-motion', () => {
      reduceMotion.current = true;
      render(<B360FloatingGravityNodes />);
      expect(document.querySelector('.b360-gravity-static-grid')).toBeInTheDocument();
      expect(screen.getByText('P01 Hub')).toBeInTheDocument();
      expect(screen.getByText('24 Agentes IA')).toBeInTheDocument();
      expect(document.querySelector('canvas')).not.toBeInTheDocument();
    });

    it('não liga a física no ambiente de teste', () => {
      // Stub canvas presente: se o guard NODE_ENV==='test' for removido, a física
      // agenda rAF e este teste falha.
      const { ctx } = installCanvasStub();
      const { container } = render(<B360FloatingGravityNodes />);
      expect(container.querySelector('.b360-gravity-canvas')).toBeInTheDocument();
      expect(raf.pendingCount()).toBe(0);
      expect(ctx.clearRect).not.toHaveBeenCalled();
    });

    it('simula a física no canvas, repele no ponteiro e respeita as bordas', () => {
      enableCinematicRuntime();
      const { ctx } = installCanvasStub();
      const { container, unmount } = render(<B360FloatingGravityNodes />);
      const canvas = container.querySelector('.b360-gravity-canvas') as HTMLCanvasElement;
      stubElementBox(canvas, { left: 0, top: 0, width: 800, height: 320 });

      raf.flush(4, 16);
      expect(ctx.clearRect).toHaveBeenCalled();
      expect(ctx.roundRect).toHaveBeenCalled();
      expect(ctx.fillText).toHaveBeenCalled();

      fireEvent.pointerMove(canvas, { clientX: 80, clientY: 60 });
      raf.flush(6, 80);
      fireEvent.pointerLeave(canvas);
      fireEvent.resize(window);
      expect(canvas.height).toBe(320);
      unmount();
      expect(raf.caf).toHaveBeenCalled();
    });
  });
});
