import type React from 'react';
import type { HeroVariant } from '@/lib/analytics/conversionTelemetry';

export interface HeroEditorialHeadlineProps {
  abVariant: HeroVariant;
  onPrimaryCtaClick: () => void;
  onSecondaryCtaClick?: () => void;
  onGoToLogin: () => void;
  onOpenRoiSimulator: () => void;
}

export const HeroEditorialHeadline: React.FC<HeroEditorialHeadlineProps> = ({
  abVariant,
  onPrimaryCtaClick,
  onSecondaryCtaClick,
  onGoToLogin,
  onOpenRoiSimulator,
}) => {
  const handleAnchorScroll = (
    event: React.MouseEvent<HTMLAnchorElement>,
    targetId: string,
    callback?: () => void,
  ) => {
    callback?.();
    if (typeof document === 'undefined') return;
    const target = document.getElementById(targetId);
    if (target && typeof target.scrollIntoView === 'function') {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (targetId === 'demonstracao') {
        const firstInput = document.getElementById('lead-nome') as HTMLInputElement | null;
        if (firstInput) {
          window.setTimeout(() => firstInput.focus({ preventScroll: true }), 650);
        }
      }
    }
  };

  return (
    <div className="bh-n1-copy">
      <div className="bh-n1-eyebrow">
        <span className="bh-n1-eyebrow-dot" aria-hidden="true" />
        <span>REVENUE INTELLIGENCE · OPERAÇÃO 360°</span>
      </div>

      <h1 className="bh-n1-title b360-hero-title" id="bh-n1-hero-title">
        <span className="bh-n1-row bh-n1-r1 b360-hero-line">
          <span className="bh-n1-word b360-word">Dados</span>{' '}
          <span className="bh-n1-tag">que conectam.</span>
        </span>{' '}
        <span className="bh-n1-row bh-n1-r2 b360-hero-line">
          <span className="bh-n1-word b360-word">Inteligência</span>{' '}
          <span className="bh-n1-tag">que decide.</span>
        </span>{' '}
        <span className="bh-n1-row bh-n1-r3 b360-hero-line">
          <span className="bh-n1-word b360-word">Execução</span>{' '}
          <span className="bh-n1-tag">que acontece.</span>
        </span>
      </h1>

      <span className="sr-only">
        Dados que conectam. Inteligência que decide. Execução que acontece.
      </span>

      <p className="bh-n1-lead">
        <strong>Birth Hub 360°</strong> é o sistema operacional de{' '}
        <span className="bh-n1-hl-role">Revenue Intelligence</span>: CRM, IA e cadência de vendas
        integrados em uma única visão executiva.
      </p>

      <div className="bh-n1-cta-row">
        {/* biome-ignore lint/a11y/useValidAnchor: in-page section anchor with progressive smooth scroll */}
        <a
          href="#demonstracao"
          className="bh-n1-btn-primary"
          onClick={(e) => handleAnchorScroll(e, 'demonstracao', onPrimaryCtaClick)}
        >
          <span>Agendar demonstração</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>

        {/* biome-ignore lint/a11y/useValidAnchor: in-page section anchor with progressive smooth scroll */}
        <a
          href="#destaques"
          className="bh-n1-btn-secondary"
          onClick={(e) => handleAnchorScroll(e, 'destaques', onSecondaryCtaClick)}
        >
          <span>Conhecer os 11 módulos</span>
        </a>
      </div>

      <div className="bh-n1-context-strip">
        <p className="bh-n1-variant-note">
          {abVariant === 'B'
            ? 'Multiplique a capacidade de vendas da sua equipe sem precisar dobrar o headcount comercial.'
            : 'Acelere o ciclo de vendas e aumente a conversão do pipeline com IA aplicada ao dia a dia comercial.'}
        </p>
        <div className="bh-n1-meta-links">
          <span className="bh-n1-onboarding-tag">
            <strong>Ciclo de Implantação Assistida</strong> · Setup guiado · LGPD Nativo
          </span>
          <span className="bh-n1-meta-sep" aria-hidden="true">
            ·
          </span>
          <button type="button" className="bh-n1-roi-link" onClick={onOpenRoiSimulator}>
            Simular ROI ↗
          </button>
          <span className="bh-n1-meta-sep" aria-hidden="true">
            ·
          </span>
          <button
            type="button"
            className="bh-n1-login-link b360-hero-neon-btn"
            onClick={onGoToLogin}
          >
            Acessar Plataforma →
          </button>
        </div>
      </div>
    </div>
  );
};
