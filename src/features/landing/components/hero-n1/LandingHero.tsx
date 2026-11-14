import type React from 'react';
import type { HeroVariant } from '@/lib/analytics/conversionTelemetry';
import { HeroCommandCenter } from './HeroCommandCenter';
import { HeroEditorialHeadline } from './HeroEditorialHeadline';
import { useHeroN1Motion } from './HeroMotion';
import './LandingHeroN1.css';

export interface LandingHeroProps {
  abVariant: HeroVariant;
  onPrimaryCtaClick: () => void;
  onSecondaryCtaClick?: () => void;
  onGoToLogin: () => void;
  onOpenRoiSimulator: () => void;
  onOpenCommandSandbox?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  abVariant,
  onPrimaryCtaClick,
  onSecondaryCtaClick,
  onGoToLogin,
  onOpenRoiSimulator,
  onOpenCommandSandbox,
}) => {
  const { isPlaying, isReducedMotion, statusMessage, replaySequence } = useHeroN1Motion();

  const rootClasses = [
    'bh-n1-hero',
    isPlaying ? 'is-playing' : '',
    isReducedMotion ? 'is-reduced-motion' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={rootClasses} id="inicio" aria-labelledby="bh-n1-hero-title">
      <div className="bh-n1-backdrop" aria-hidden="true">
        <div className="bh-n1-aura bh-n1-aura-cyan" />
        <div className="bh-n1-aura bh-n1-aura-pink" />
        <div className="bh-n1-aura bh-n1-aura-iris" />
        <div className="bh-n1-grid" />
      </div>

      <div className="bh-n1-grid-layout">
        <HeroEditorialHeadline
          abVariant={abVariant}
          onPrimaryCtaClick={onPrimaryCtaClick}
          onSecondaryCtaClick={onSecondaryCtaClick}
          onGoToLogin={onGoToLogin}
          onOpenRoiSimulator={onOpenRoiSimulator}
        />

        <HeroCommandCenter
          statusMessage={statusMessage}
          onReplaySequence={replaySequence}
          onOpenCommandSandbox={onOpenCommandSandbox}
        />
      </div>
    </section>
  );
};
