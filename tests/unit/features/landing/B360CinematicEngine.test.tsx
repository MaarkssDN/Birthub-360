import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  B360DecryptBlock,
  useB360MagneticAttraction,
  useB360ScrollParallax,
  useB360ScrollVelocityInertia,
  useB360SectionProgress,
} from '@/features/landing/components/B360CinematicEngine';
import {
  installMatchMedia,
  installRafQueue,
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

function MagneticProbe({ selector = '.magnet-target' }: { selector?: string }) {
  useB360MagneticAttraction(selector, 0.4, 200);
  return (
    <section data-testid="stage">
      <div className="magnet-target" data-testid="magnet">
        Bitrix24
      </div>
    </section>
  );
}

function ParallaxProbe() {
  useB360ScrollParallax();
  return (
    <div>
      <div className="b360-hero-console" data-testid="console">
        console
      </div>
      <div className="b360-fanned-deck" data-testid="deck">
        deck
      </div>
      <div className="b360-ambient">
        <div className="b360-orb" data-testid="orb-a">
          a
        </div>
        <div className="b360-orb" data-testid="orb-b">
          b
        </div>
      </div>
      <div className="b360-orbit-ring" data-testid="orbit">
        orbit
      </div>
    </div>
  );
}

function InertiaProbe() {
  useB360ScrollVelocityInertia('.inertia-card');
  return (
    <div>
      <article className="inertia-card" data-testid="card">
        Card
      </article>
    </div>
  );
}

function ProgressProbe({ id = 'problema' }: { id?: string }) {
  const { progress, isIntersecting } = useB360SectionProgress(id);
  return (
    <div>
      <div id={id} data-testid="section">
        seção
      </div>
      <output data-testid="progress">{progress.toFixed(2)}</output>
      <output data-testid="intersecting">{String(isIntersecting)}</output>
    </div>
  );
}

function ProgressMissing() {
  const { progress, isIntersecting } = useB360SectionProgress('ausente');
  return (
    <div>
      <output data-testid="progress">{progress.toFixed(2)}</output>
      <output data-testid="intersecting">{String(isIntersecting)}</output>
    </div>
  );
}

describe('B360CinematicEngine', () => {
  let raf: RafController;

  beforeEach(() => {
    reduceMotion.current = false;
    stubDesktopViewport();
    installMatchMedia({ reducedMotion: false, pointerFine: true });
    raf = installRafQueue();
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('useB360MagneticAttraction', () => {
    it('não instala listeners quando reduced-motion está ativo', () => {
      reduceMotion.current = true;
      render(<MagneticProbe />);
      const target = screen.getByTestId('magnet');
      fireEvent.mouseMove(screen.getByTestId('stage'), { clientX: 120, clientY: 80 });
      expect(target.style.transform).toBe('');
    });

    it('não faz nada quando o seletor não encontra elementos', () => {
      render(<MagneticProbe selector=".nao-existe" />);
      expect(raf.pendingCount()).toBe(0);
    });

    it('atrai o alvo na direção do ponteiro e solta no mouseleave', () => {
      const { unmount } = render(<MagneticProbe />);
      const target = screen.getByTestId('magnet');
      stubElementBox(target, { left: 100, top: 100, width: 80, height: 40 });

      fireEvent.mouseMove(screen.getByTestId('stage'), { clientX: 150, clientY: 110 });
      raf.flush(6, 16);
      expect(target.style.transform).toContain('translate3d');

      fireEvent.mouseLeave(target);
      // A mola ainda anima até ficar abaixo do limiar
      raf.flush(20, 200);
      unmount();
    });
  });

  describe('useB360ScrollParallax', () => {
    it('não aplica deslocamento com reduced-motion', () => {
      reduceMotion.current = true;
      render(<ParallaxProbe />);
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 400 });
      fireEvent.scroll(window);
      raf.flush(2, 16);
      expect(screen.getByTestId('console').style.getPropertyValue('--parallax-y')).toBe('');
    });

    it('atualiza variáveis de profundidade conforme o scroll', () => {
      const { unmount } = render(<ParallaxProbe />);
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 400 });
      fireEvent.scroll(window);
      raf.flush(1, 16);
      expect(screen.getByTestId('console').style.getPropertyValue('--parallax-y')).toMatch(/px/);
      expect(screen.getByTestId('deck').style.getPropertyValue('--parallax-y')).toMatch(/px/);
      expect(screen.getByTestId('orb-a').style.getPropertyValue('--scroll-shift-y')).toMatch(/px/);
      expect(screen.getByTestId('orbit').style.getPropertyValue('--orbit-shift-y')).toMatch(/px/);
      unmount();
    });
  });

  describe('useB360ScrollVelocityInertia', () => {
    it('não inicia o loop com reduced-motion', () => {
      reduceMotion.current = true;
      render(<InertiaProbe />);
      expect(raf.pendingCount()).toBe(0);
    });

    it('aplica tilt proporcional à velocidade de scroll e limpa no unmount', () => {
      const { unmount } = render(<InertiaProbe />);
      const card = screen.getByTestId('card');
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
      raf.flush(1, 0);
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 240 });
      raf.flush(4, 16);
      expect(card.style.getPropertyValue('--scroll-tilt')).toMatch(/deg/);
      unmount();
      expect(card.style.getPropertyValue('--scroll-tilt')).toBe('');
    });
  });

  describe('B360DecryptBlock', () => {
    it('mostra o texto final imediatamente com reduced-motion', () => {
      reduceMotion.current = true;
      render(<B360DecryptBlock text="Sua equipe precisa de contexto" tag="PROBLEMA" active />);
      expect(screen.getByText('PROBLEMA')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
        'Sua equipe precisa de contexto',
      );
      expect(document.querySelector('.b360-blur-sweep-mask')).not.toBeInTheDocument();
    });

    it('descriptografa o texto quando a seção fica ativa', async () => {
      vi.useFakeTimers();
      render(<B360DecryptBlock text="Contexto comercial" tag="SINAL" active delayMs={0} />);
      expect(document.querySelector('.b360-blur-sweep-active')).toBeInTheDocument();
      expect(screen.getByText('SINAL')).toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(26 * 40);
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Contexto comercial');
      vi.useRealTimers();
    });

    it('mantém o texto estático enquanto a seção não está ativa', () => {
      render(<B360DecryptBlock text="Ainda oculto" active={false} />);
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Ainda oculto');
      expect(document.querySelector('.b360-blur-sweep-active')).not.toBeInTheDocument();
    });
  });

  describe('useB360SectionProgress', () => {
    it('permanece em zero quando a seção alvo não existe', () => {
      render(<ProgressMissing />);
      expect(screen.getByTestId('progress')).toHaveTextContent('0.00');
      expect(screen.getByTestId('intersecting')).toHaveTextContent('false');
    });

    it('calcula o progresso e marca interseção conforme a seção entra na viewport', async () => {
      render(<ProgressProbe />);
      const section = screen.getByTestId('section');
      // topo da seção no meio da tela (innerHeight=800) → progresso > 0.15
      stubElementBox(section, { left: 0, top: 200, width: 800, height: 400 });
      fireEvent.scroll(window);
      raf.flush(1, 16);
      await waitFor(() => {
        expect(Number(screen.getByTestId('progress').textContent)).toBeGreaterThan(0.15);
        expect(screen.getByTestId('intersecting')).toHaveTextContent('true');
      });
    });
  });
});
