import { useEffect, useState } from 'react';
import { gamificationApi } from '../../features/gamification/api/gamification.api.js';
import type { SellerScore } from '../../features/gamification/domain/Gamification.js';

/**
 * Ponte dashboard → gamification: o dashboard (feature) não pode importar internals de
 * gamification (no-cross-feature-imports). Este hook vive na camada de UI compartilhada —
 * mesmo padrão de GamificationWidget.tsx, que já consome o domínio de gamification.
 */
export function useSellerScoreProfile(sellerName?: string): {
  sellerScore: SellerScore | null;
  gamificationLoaded: boolean;
} {
  const [sellerScore, setSellerScore] = useState<SellerScore | null>(null);
  const [gamificationLoaded, setGamificationLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    gamificationApi
      .getSellerProfile(sellerName)
      .then((profile) => {
        if (mounted) setSellerScore(profile);
      })
      .catch(() => {
        if (mounted) setSellerScore(null);
      })
      .finally(() => {
        if (mounted) setGamificationLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, [sellerName]);

  return { sellerScore, gamificationLoaded };
}
