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
});
