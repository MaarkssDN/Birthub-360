import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSmoothInertiaScroll } from '@/features/landing/luxury/hooks/useSmoothInertiaScroll';

describe('useSmoothInertiaScroll', () => {
  const originalScrollTo = window.scrollTo;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    window.scrollTo = vi.fn();
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    window.scrollTo = originalScrollTo;
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('não deve anexar listeners se enabled for false', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    renderHook(() => useSmoothInertiaScroll(false));

    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      'wheel',
      expect.any(Function),
      expect.anything(),
    );
  });

  it('não deve ativar quando prefers-reduced-motion estiver ativo', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    renderHook(() => useSmoothInertiaScroll(true));

    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      'wheel',
      expect.any(Function),
      expect.anything(),
    );
  });

  it('anexa e limpa listeners de evento wheel no unmount quando habilitado', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useSmoothInertiaScroll(true));

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'wheel',
      expect.any(Function),
      { passive: false },
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'wheel',
      expect.any(Function),
    );
  });

  it('intercepta wheel fora de campos de formulário e chama scrollTo via rAF', async () => {
    renderHook(() => useSmoothInertiaScroll(true));

    const wheel = new WheelEvent('wheel', { deltaY: 120, cancelable: true });
    window.dispatchEvent(wheel);

    expect(wheel.defaultPrevented).toBe(true);
    // rAF do jsdom dispara em ~16ms; aguarda o primeiro frame de interpolação
    await new Promise((r) => setTimeout(r, 60));
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('não intercepta wheel originado dentro de input/textarea', () => {
    renderHook(() => useSmoothInertiaScroll(true));

    const input = document.createElement('input');
    document.body.appendChild(input);
    const wheel = new WheelEvent('wheel', { deltaY: 120, cancelable: true });
    input.dispatchEvent(wheel);

    expect(wheel.defaultPrevented).toBe(false);
    input.remove();
  });

  it('desativa em dispositivo touch estreito (ontouchstart + innerWidth < 1024)', () => {
    const originalTouch = (window as { ontouchstart?: unknown }).ontouchstart;
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'ontouchstart', {
      value: () => {},
      configurable: true,
    });
    Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    renderHook(() => useSmoothInertiaScroll(true));

    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      'wheel',
      expect.any(Function),
      expect.anything(),
    );

    Object.defineProperty(window, 'ontouchstart', {
      value: originalTouch,
      configurable: true,
    });
    Object.defineProperty(window, 'innerWidth', { value: originalWidth, configurable: true });
  });
});
