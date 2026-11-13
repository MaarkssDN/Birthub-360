import { vi } from 'vitest';

export type MediaFlags = {
  reducedMotion?: boolean;
  maxWidth768?: boolean;
  pointerFine?: boolean;
};

/**
 * matchMedia controlável para prefers-reduced-motion, viewport móvel e pointer fino.
 */
export function installMatchMedia(flags: MediaFlags = {}): MediaFlags {
  const impl = (query: string): MediaQueryList => {
    const q = query.replace(/\s+/g, ' ').trim();
    let matches = false;
    if (q.includes('prefers-reduced-motion') && q.includes('reduce')) {
      matches = Boolean(flags.reducedMotion);
    } else if (q.includes('max-width: 768px') || q.includes('max-width:768px')) {
      matches = Boolean(flags.maxWidth768);
    } else if (q.includes('pointer: fine') || q.includes('pointer:fine')) {
      matches = flags.pointerFine !== false;
    }
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    } as MediaQueryList;
  };
  window.matchMedia = vi.fn(impl) as unknown as typeof window.matchMedia;
  return flags;
}

export type CanvasStub = {
  clearRect: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  beginPath: ReturnType<typeof vi.fn>;
  moveTo: ReturnType<typeof vi.fn>;
  lineTo: ReturnType<typeof vi.fn>;
  stroke: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  arc: ReturnType<typeof vi.fn>;
  quadraticCurveTo: ReturnType<typeof vi.fn>;
  bezierCurveTo: ReturnType<typeof vi.fn>;
  createLinearGradient: ReturnType<typeof vi.fn>;
  createRadialGradient: ReturnType<typeof vi.fn>;
  fillText: ReturnType<typeof vi.fn>;
  roundRect: ReturnType<typeof vi.fn>;
  lineCap: string;
  lineJoin: string;
  strokeStyle: unknown;
  fillStyle: unknown;
  lineWidth: number;
  shadowColor: string;
  shadowBlur: number;
  globalAlpha: number;
  font: string;
  textAlign: string;
  textBaseline: string;
};

export function createCanvasContextStub(): CanvasStub {
  return {
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillText: vi.fn(),
    roundRect: vi.fn(),
    lineCap: 'butt',
    lineJoin: 'miter',
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    shadowColor: '',
    shadowBlur: 0,
    globalAlpha: 1,
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
  };
}

export function installCanvasStub(
  mode: 'ok' | 'null' | 'throw' = 'ok',
  ctx: CanvasStub = createCanvasContextStub(),
) {
  const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
    if (mode === 'throw') {
      throw new Error('canvas unavailable');
    }
    if (mode === 'null') return null;
    return ctx as unknown as CanvasRenderingContext2D;
  });
  return { ctx, spy };
}

export type RafController = {
  flush: (frames?: number, t0?: number) => void;
  pendingCount: () => number;
  raf: ReturnType<typeof vi.fn>;
  caf: ReturnType<typeof vi.fn>;
};

/**
 * rAF em fila — evita loop infinito no jsdom e permite avançar frames com asserts.
 */
export function installRafQueue(): RafController {
  let nextId = 1;
  const pending = new Map<number, FrameRequestCallback>();
  const raf = vi.fn((cb: FrameRequestCallback) => {
    const id = nextId++;
    pending.set(id, cb);
    return id;
  });
  const caf = vi.fn((id: number) => {
    pending.delete(id);
  });
  vi.stubGlobal('requestAnimationFrame', raf);
  vi.stubGlobal('cancelAnimationFrame', caf);
  return {
    flush(frames = 1, t0 = 16) {
      for (let i = 0; i < frames; i++) {
        const batch = [...pending.entries()];
        pending.clear();
        for (const [, cb] of batch) {
          cb(t0 + i * 16);
        }
      }
    },
    pendingCount: () => pending.size,
    raf,
    caf,
  };
}

export function stubDesktopViewport(width = 1280, height = 800) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width, writable: true });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
    writable: true,
  });
}

export function stubElementBox(
  el: Element,
  box: { left: number; top: number; width: number; height: number },
) {
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    x: box.left,
    y: box.top,
    left: box.left,
    top: box.top,
    right: box.left + box.width,
    bottom: box.top + box.height,
    width: box.width,
    height: box.height,
    toJSON: () => ({}),
  } as DOMRect);
}

/** Dispara o IntersectionObserver como "visível" no momento do observe. */
export function installIntersectingObserver() {
  const instances: Array<{ cb: IntersectionObserverCallback; el?: Element }> = [];
  class ImmediateIO implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin = '';
    readonly thresholds: ReadonlyArray<number> = [];
    private readonly cb: IntersectionObserverCallback;
    constructor(cb: IntersectionObserverCallback) {
      this.cb = cb;
      instances.push({ cb });
    }
    observe(el: Element): void {
      const entry = {
        isIntersecting: true,
        target: el,
        intersectionRatio: 1,
        time: 0,
        boundingClientRect: el.getBoundingClientRect(),
        intersectionRect: el.getBoundingClientRect(),
        rootBounds: null,
      } as IntersectionObserverEntry;
      this.cb([entry], this);
    }
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  globalThis.IntersectionObserver = ImmediateIO as unknown as typeof IntersectionObserver;
  window.IntersectionObserver = ImmediateIO as unknown as typeof IntersectionObserver;
  return instances;
}

export function enableCinematicRuntime() {
  vi.stubEnv('NODE_ENV', 'development');
  process.env.NODE_ENV = 'development';
}

export function restoreCinematicRuntime() {
  vi.unstubAllEnvs();
  process.env.NODE_ENV = 'test';
}

export function dispatchPointer(
  target: EventTarget,
  type: 'pointermove' | 'pointerleave' | 'pointerenter',
  x = 0,
  y = 0,
) {
  // jsdom não implementa PointerEvent e ignora clientX em pointer*.
  // Um MouseEvent com o type do ponteiro, e clientX/Y forçados, chega no listener
  // de window com alvo de Element (closest disponível).
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
  });
  Object.defineProperty(event, 'clientX', { configurable: true, value: x });
  Object.defineProperty(event, 'clientY', { configurable: true, value: y });
  target.dispatchEvent(event);
}

