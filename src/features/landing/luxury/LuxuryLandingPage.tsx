import { useEffect } from 'react';
import { Act1Hero } from './components/Act1Hero.js';
import { Act2Dissonance } from './components/Act2Dissonance.js';
import { Act3Singularity } from './components/Act3Singularity.js';
import { Act4TacticalEngine } from './components/Act4TacticalEngine.js';
import { Act5SovereigntyMetrics } from './components/Act5SovereigntyMetrics.js';
import { Act6PrivatePortal } from './components/Act6PrivatePortal.js';
import { LuxuryFooter } from './components/LuxuryFooter.js';
import { LuxuryHeaderHUD } from './components/LuxuryHeaderHUD.js';
import { useSmoothInertiaScroll } from './hooks/useSmoothInertiaScroll.js';

export function LuxuryLandingPage() {
  // Ativa rolagem inercial de alta precisão
  useSmoothInertiaScroll(true);

  const scrollToPrivateAccess = () => {
    const el = document.getElementById('acesso');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Garante classe dark para a estética obsidian
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F8F9FF] selection:bg-[#00D4FF] selection:text-[#0D0D0D] font-sans antialiased overflow-x-hidden">
      {/* HUD Flutuante Superior */}
      <LuxuryHeaderHUD onOpenPrivateAccess={scrollToPrivateAccess} />

      {/* ATO I: O Núcleo de Comando (Hero 3D WebGL) */}
      <Act1Hero onOpenPrivateAccess={scrollToPrivateAccess} />

      {/* ATO II: A Dissonância Operacional (O Caos do Mercado) */}
      <Act2Dissonance />

      {/* ATO III: A Singularidade 360º (Scrollytelling & 4 Quadrantes) */}
      <Act3Singularity />

      {/* ATO IV: O Motor Tático (Enxame de IA & Interface Real) */}
      <Act4TacticalEngine />

      {/* ATO V: O Índice de Soberania (Métricas & Conformidade) */}
      <Act5SovereigntyMetrics />

      {/* ATO VI: O Portal Privado (Acesso Reservado / CTA) */}
      <Act6PrivatePortal />

      {/* Rodapé Soberano */}
      <LuxuryFooter />
    </div>
  );
}
export default LuxuryLandingPage;
