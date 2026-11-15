import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSellerScoreProfile } from '@/components/ui/useSellerScoreProfile';

const getSellerProfile = vi.fn();

vi.mock('@/features/gamification/api/gamification.api', () => ({
  gamificationApi: {
    getSellerProfile: (...args: unknown[]) => getSellerProfile(...args),
  },
}));

afterEach(() => {
  getSellerProfile.mockReset();
});

describe('useSellerScoreProfile', () => {
  it('carrega o perfil do seller e marca como carregado', async () => {
    const profile = { seller: 'Ana', score: 42 };
    getSellerProfile.mockResolvedValue(profile);

    const { result } = renderHook(() => useSellerScoreProfile('Ana'));

    expect(result.current.gamificationLoaded).toBe(false);
    expect(result.current.sellerScore).toBeNull();

    await waitFor(() => expect(result.current.gamificationLoaded).toBe(true));
    expect(result.current.sellerScore).toEqual(profile);
    expect(getSellerProfile).toHaveBeenCalledWith('Ana');
  });

  it('marca como carregado mesmo quando a API falha', async () => {
    getSellerProfile.mockRejectedValue(new Error('falha'));

    const { result } = renderHook(() => useSellerScoreProfile());

    await waitFor(() => expect(result.current.gamificationLoaded).toBe(true));
    expect(result.current.sellerScore).toBeNull();
    expect(getSellerProfile).toHaveBeenCalledWith(undefined);
  });

  it('re-busca quando sellerName muda', async () => {
    getSellerProfile.mockResolvedValue(null);
    const { rerender } = renderHook(({ name }) => useSellerScoreProfile(name), {
      initialProps: { name: 'A' },
    });
    await waitFor(() => expect(getSellerProfile).toHaveBeenCalledWith('A'));

    rerender({ name: 'B' });
    await waitFor(() => expect(getSellerProfile).toHaveBeenCalledWith('B'));
  });
});
