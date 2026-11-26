import { type HeroVariant, trackHeroCtaPrimaryClick } from '@/lib/analytics/conversionTelemetry';

interface FinalCtaSectionProps {
  abVariant: HeroVariant;
  onOpenRoiSimulator: () => void;
  onSwitchView: (mode: 'public' | 'command') => void;
  onGoToLogin: () => void;
}

/** Final CTA — controle total de receita. */
export function FinalCtaSection({
  abVariant,
  onOpenRoiSimulator,
  onSwitchView,
  onGoToLogin,
}: FinalCtaSectionProps) {
  return (
    <section className="b360-final-cta">
      <div className="b360-eyebrow">CONTROLE TOTAL DE RECEITA</div>
      <h2>Coloque sua operação comercial sob comando.</h2>
      <p>
        Explore a experiência do Birth Hub 360° e descubra como dados, equipe e execução se
        potencializam mutuamente em uma única plataforma soberana.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <a
          href="#demonstracao"
          className="b360-aurora"
          onClick={() =>
            trackHeroCtaPrimaryClick(abVariant, 'Garantir Demonstração Gratuita - Final')
          }
        >
          <span className="b360-aurora-inner">
            Garantir Demonstração Gratuita <span aria-hidden="true">→</span>
          </span>
        </a>
        <button type="button" onClick={onOpenRoiSimulator} className="b360-hero-pill-btn">
          Simular ROI Comercial ↗
        </button>
        <button
          className="b360-hero-secondary-btn"
          type="button"
          onClick={() => onSwitchView('command')}
        >
          Ver Command Center
        </button>
        <button type="button" onClick={onGoToLogin} className="b360-hero-secondary-btn">
          Acessar Plataforma
        </button>
      </div>
    </section>
  );
}
