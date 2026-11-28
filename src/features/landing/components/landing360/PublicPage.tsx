import { type HeroVariant, trackHeroCtaPrimaryClick } from '@/lib/analytics/conversionTelemetry';
import { LandingHero } from '../hero-n1/index.js';
import { AiSection, IntegrationsSection, ProofSection } from './AiEcosystemSection.js';
import { FinalCtaSection } from './FinalCtaSection.js';
import { LeadCaptureSection } from './LeadCaptureSection.js';
import { ModulesSection } from './ModulesSection.js';
import { FlowSection, PlatformSection } from './PlatformFlowSection.js';
import { ProblemSection } from './ProblemSection.js';

interface Landing360PublicPageProps {
  abVariant: HeroVariant;
  isProblemIntersecting: boolean;
  onGoToLogin: () => void;
  onOpenRoiSimulator: () => void;
  onSwitchView: (mode: 'public' | 'command') => void;
  onOpenModal: (title: string, desc: string, pillarNum?: string) => void;
}

/** MODO 1: PÁGINA PÚBLICA — hero, módulos, prova social, captura de lead e CTA final. */
export function Landing360PublicPage({
  abVariant,
  isProblemIntersecting,
  onGoToLogin,
  onOpenRoiSimulator,
  onSwitchView,
  onOpenModal,
}: Landing360PublicPageProps) {
  return (
    <div className="b360-shell">
      {/* Hero Section — N1 Neon Editorial Cinematic */}
      <LandingHero
        abVariant={abVariant}
        onPrimaryCtaClick={() => trackHeroCtaPrimaryClick(abVariant, 'Agendar demonstração')}
        onGoToLogin={onGoToLogin}
        onOpenRoiSimulator={onOpenRoiSimulator}
        onOpenCommandSandbox={() => onSwitchView('command')}
      />

      <ModulesSection onOpenModal={onOpenModal} />
      <ProblemSection isProblemIntersecting={isProblemIntersecting} />
      <PlatformSection />
      <FlowSection />
      <AiSection onOpenModal={onOpenModal} />
      <IntegrationsSection />
      <ProofSection />
      <LeadCaptureSection abVariant={abVariant} />
      <FinalCtaSection
        abVariant={abVariant}
        onOpenRoiSimulator={onOpenRoiSimulator}
        onSwitchView={onSwitchView}
        onGoToLogin={onGoToLogin}
      />
    </div>
  );
}
