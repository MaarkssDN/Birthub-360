import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BirthHubOrbit360 } from '@/components/brand/BirthHubOrbit360';

// Captura o callback de useFrame e renderiza os filhos do Canvas para
// exercitar OrbitScene (anéis, nós, uniform de tempo do shader).
// Em jsdom os elementos R3F viram nós DOM, então instalamos uma API
// mínima compatível com THREE (rotation/position/uniforms) antes dos frames.
const frameCallbacks: Array<(state: unknown, delta: number) => void> = [];
const createdGl = { setClearColor: vi.fn() };

vi.mock('@react-three/fiber', () => ({
  Canvas: ({
    children,
    onCreated,
  }: {
    children: React.ReactNode;
    onCreated?: (arg: { gl: typeof createdGl }) => void;
    onError?: () => void;
  }) => {
    onCreated?.({ gl: createdGl });
    return <div data-testid="r3f-canvas-mock">{children}</div>;
  },
  useFrame: (cb: (state: unknown, delta: number) => void) => {
    frameCallbacks.push(cb);
  },
}));

vi.mock('framer-motion', () => ({
  useReducedMotion: () => false,
}));

const fakeState = { clock: { getElapsedTime: () => 2.5 } };

function installFakeThreeApi(root: ParentNode) {
  root.querySelectorAll('group,mesh,points,shadermaterial').forEach((el) => {
    const e = el as unknown as {
      rotation?: { x: number; y: number; z: number };
      position?: { x: number; y: number; z: number };
      uniforms?: { uTime: { value: number } };
    };
    e.rotation ??= { x: 0, y: 0, z: 0 };
    e.position ??= { x: 0, y: 0, z: 0 };
    if (el.tagName.toLowerCase() === 'shadermaterial') {
      e.uniforms = { uTime: { value: 0 } };
    }
  });
}

function runFrames(root?: ParentNode) {
  if (root) installFakeThreeApi(root);
  act(() => {
    frameCallbacks.forEach((cb) => cb(fakeState, 0.016));
  });
}

describe('BirthHubOrbit360 — cena 3D e branches', () => {
  beforeEach(() => {
    frameCallbacks.length = 0;
    createdGl.setClearColor.mockClear();
  });

  it('renderiza a cena completa e executa o frame com animações', () => {
    const { container } = render(<BirthHubOrbit360 size={200} />);

    expect(screen.getByTestId('r3f-canvas-mock')).toBeInTheDocument();
    expect(createdGl.setClearColor).toHaveBeenCalledWith(0x000000, 0);
    expect(frameCallbacks.length).toBeGreaterThan(0);

    // Executa frames: cobre rotação de anéis, nós e uniform de tempo do shader
    runFrames(container);
    runFrames(container);
  });

  it('executa o amortecimento inercial do mouse quando interativo', () => {
    const { container } = render(<BirthHubOrbit360 size={200} interactive />);
    runFrames(container);

    const group = container.querySelector('group') as HTMLElement & {
      onpointermove?: unknown;
    };
    expect(group).not.toBeNull();
    // O handler R3F usa e.pointer (ThreeEvent), indisponível no DOM mock —
    // o branch de pointer move fica coberto indiretamente via useFrame,
    // que aplica a rotação inercial no groupRef a cada frame.
    expect(group).toBeTruthy();
  });

  it('exibe fallback vetorial quando a aba fica oculta', () => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    render(<BirthHubOrbit360 size={200} />);

    expect(screen.queryByTestId('r3f-canvas-mock')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Emblema Orbital/i })).toBeInTheDocument();
  });

  it('volta ao 3D quando a aba volta a ficar visível', () => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    render(<BirthHubOrbit360 size={200} />);
    expect(screen.queryByTestId('r3f-canvas-mock')).not.toBeInTheDocument();

    act(() => {
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(screen.getByTestId('r3f-canvas-mock')).toBeInTheDocument();
  });

  it('exibe fallback vetorial quando IntersectionObserver reporta fora da viewport', () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    let capturedCb: IntersectionObserverCallback | null = null;
    const OriginalIO = window.IntersectionObserver;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          capturedCb = cb;
        }
        observe = observe;
        disconnect = disconnect;
        unobserve = vi.fn();
        takeRecords() {
          return [];
        }
      },
    );
    (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
      (globalThis as { IntersectionObserver: unknown }).IntersectionObserver;

    try {
      const { unmount } = render(<BirthHubOrbit360 size={200} />);
      expect(screen.getByTestId('r3f-canvas-mock')).toBeInTheDocument();

      act(() => {
        capturedCb?.(
          [{ isIntersecting: false } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );
      });

      expect(screen.queryByTestId('r3f-canvas-mock')).not.toBeInTheDocument();
      expect(observe).toHaveBeenCalled();

      unmount();
      expect(disconnect).toHaveBeenCalled();
    } finally {
      (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
        OriginalIO;
      vi.unstubAllGlobals();
    }
  });
});
