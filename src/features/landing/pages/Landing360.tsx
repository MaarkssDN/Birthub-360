import { useReducedMotion } from 'framer-motion';
import { ArrowUp, Loader2 } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';

const LuxuryLandingPage = lazy(() =>
  import('../luxury/LuxuryLandingPage.js').then((m) => ({ default: m.LuxuryLandingPage })),
);

import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import {
  type HeroVariant,
  trackHeroRoiSimulatorOpened,
  trackHeroVariantImpression,
  trackHeroVariantSwitched,
} from '@/lib/analytics/conversionTelemetry';
import { SoundFX } from '@/lib/soundEffects';
import {
  B360DataStreamCursor,
  B360ScrollProgress,
  useB360CardTilt,
  useB360MagneticAttraction,
  useB360ScrollParallax,
  useB360ScrollVelocityInertia,
  useB360SectionProgress,
} from '../components/CinematicFX.js';
import { PillarDetailModal } from '../components/PillarDetailModal.js';
import { RoiSimulatorModal } from '../components/RoiSimulatorModal.js';
import { CommandCenterSection } from '../components/landing360/CommandCenterSection.js';
import { Landing360Footer } from '../components/landing360/FooterSection.js';
import { Landing360Login } from '../components/landing360/LoginSection.js';
import { Landing360PublicPage } from '../components/landing360/PublicPage.js';
import { Landing360Topbar } from '../components/landing360/Topbar.js';
import { useLanding360Auth } from '../components/landing360/useLanding360Auth.js';
import './LandingAdaptive.css';
import './Landing360.css';
import './LandingCinematic.css';
import './LandingRegenerationV4.css';
import './LandingConversionV5.css';

export function Landing360({
  initialScreen = 'intro',
}: {
  initialScreen?: 'intro' | 'login';
} = {}) {
  const [activeScreen, setActiveScreen] = useState<'intro' | 'login'>(initialScreen);
  const [viewMode, setViewMode] = useState<'public' | 'command'>('public');
  const [activeModal, setActiveModal] = useState<{ title: string; desc: string } | null>(null);
  const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const auth = useLanding360Auth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- CRO & TESTES A/B (Variante A: Aceleração de Pipeline / Variante B: Multiplicação de Receita) ---
  const [abVariant, setAbVariant] = useState<HeroVariant>(() => {
    if (typeof window === 'undefined') return 'A';
    try {
      const qv = searchParams.get('variant')?.toUpperCase();
      if (qv === 'B' || qv === 'C') return qv as HeroVariant;
      if (qv === 'A') return 'A';
      const saved = sessionStorage.getItem('bh_landing_variant');
      if (saved === 'A' || saved === 'B' || saved === 'C') return saved as HeroVariant;
    } catch {}
    return 'A';
  });

  useEffect(() => {
    trackHeroVariantImpression(abVariant);
    try {
      sessionStorage.setItem('bh_landing_variant', abVariant);
    } catch {}
  }, [abVariant]);

  const handleSwitchAbVariant = (newVariant: HeroVariant) => {
    SoundFX.play('click');
    trackHeroVariantSwitched(abVariant, newVariant);
    setAbVariant(newVariant);
    try {
      sessionStorage.setItem('bh_landing_variant', newVariant);
    } catch {}
  };

  const reduceMotion = useReducedMotion();
  useB360CardTilt([viewMode, activeScreen]);
  useB360ScrollParallax();
  useB360ScrollVelocityInertia(
    '.b360-hero-console, .b360-fanned-card, .b360-feature-card, .b360-problem-card, .b360-platform-card, .b360-flow-card, .b360-integration-card',
  );
  useB360MagneticAttraction(
    '.b360-integration-card, .b360-status-pill, .b360-neon-halo-btn, .b360-aurora',
    0.32,
    220,
  );
  const { isIntersecting: isProblemIntersecting } = useB360SectionProgress('problema');

  // Sincronizar o tema dinâmico no elemento raiz para que o toggle de modo claro/escuro funcione perfeitamente
  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Sincronizar activeScreen com a rota ativa
  useEffect(() => {
    if (location.pathname === '/login') {
      setActiveScreen('login');
    } else if (location.pathname === '/' || location.pathname === '/welcome') {
      if (initialScreen === 'login') return;
      setActiveScreen('intro');
    }
  }, [location.pathname, initialScreen]);

  // Monitorar alteração de modo tela cheia
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = async () => {
    SoundFX.play('confirm');
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else {
          auth.setErrorMessage('Seu navegador não oferece suporte para modo tela cheia.');
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch {
      auth.setErrorMessage('Não foi possível alternar o modo tela cheia no navegador.');
    }
  };

  const handleBackToHome = () => {
    SoundFX.play('click');
    setActiveScreen('intro');
    if (location.pathname === '/login') {
      void navigate('/', { replace: true });
    }
  };

  // Estado do botão flutuante de voltar ao topo
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    document.title = 'Birth Hub 360° · Revenue Command Center & Multi-CRM';
  }, []);

  // Scroll reveals cinematográficos — IntersectionObserver adiciona .b360-reveal-in
  // conforme as seções entram na viewport (movimento só existe sob
  // prefers-reduced-motion: no-preference, definido no CSS).
  useEffect(() => {
    if (activeScreen !== 'intro' || !('IntersectionObserver' in window)) return;
    const root = document.querySelector('.b360-adaptive-landing');
    if (!root) return;

    const targets = root.querySelectorAll<HTMLElement>(
      '.b360-section, .b360-problem-card, .b360-platform-card, .b360-flow-card, .b360-ai-grid > div, .b360-integration-card, .b360-feature-card, .b360-module, .b360-final-cta',
    );
    if (targets.length === 0) return;

    targets.forEach((el) => {
      el.classList.add('b360-reveal');
    });
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('b360-reveal-in');
            entry.target.classList.remove('b360-reveal');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    // Fallback para saltos de scroll (scrollTo/end, âncoras, find-in-page):
    // elementos que ficam acima da viewport sem nunca intersectar ficariam
    // ocultos para sempre — um listener passivo os revela ao passar.
    const revealPassed = () => {
      for (const el of targets) {
        if (!el.classList.contains('b360-reveal-in') && el.getBoundingClientRect().bottom < 0) {
          el.classList.add('b360-reveal-in');
          io.unobserve(el);
        }
      }
    };
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        revealPassed();
      });
    };
    revealPassed();
    window.addEventListener('scroll', onScroll, { passive: true });

    targets.forEach((el) => {
      io.observe(el);
    });
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [activeScreen, viewMode]);

  // Monitorar scroll para exibição do botão Voltar ao Topo
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Limpeza de estado de modais e simuladores em mudanças de rota
  useEffect(() => {
    setSelectedPillarId(null);
    setActiveModal(null);
    setIsSimulatorOpen(false);
  }, [location.pathname]);

  const handleGoToLogin = () => {
    SoundFX.play('confirm');
    setSelectedPillarId(null);
    setActiveModal(null);
    setIsSimulatorOpen(false);
    setActiveScreen('login');
    if (location.pathname !== '/login') {
      navigate('/login');
    }
    if (typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  };

  const handleSwitchView = (mode: 'public' | 'command') => {
    SoundFX.play('click');
    setViewMode(mode);
    if (typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  };

  const handleOpenModal = (title: string, desc: string, pillarNum?: string) => {
    SoundFX.play('click');
    setSelectedPillarId(pillarNum ?? null);
    setActiveModal({ title, desc });
  };

  const handleCloseModal = () => {
    SoundFX.play('click');
    setSelectedPillarId(null);
    setActiveModal(null);
  };

  const handleOpenRoiSimulator = () => {
    SoundFX.play('click');
    trackHeroRoiSimulatorOpened(abVariant, 'landing_adaptive_hero');
    setIsSimulatorOpen(true);
  };

  const isLuxuryMode =
    searchParams.get('mode') === 'luxury' || searchParams.get('view') === 'luxury';
  if (isLuxuryMode && activeScreen === 'intro') {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center text-[#00D4FF] font-mono text-sm tracking-widest">
            INICIALIZANDO CENTRAL 360º...
          </div>
        }
      >
        <LuxuryLandingPage />
      </Suspense>
    );
  }

  if (auth.isAuthPending) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center transition-colors ${
          theme === 'dark' ? 'bg-[#0B1120]' : 'bg-[#F8FAFC]'
        }`}
      >
        <Loader2 className="animate-spin text-[#00D4FF] w-10 h-10" />
      </div>
    );
  }

  return (
    <main
      className={`relative w-full min-h-screen overflow-x-clip font-sans selection:bg-[#FF2D9B]/30 selection:text-[#00D4FF] landing-neon-root transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#06111e] text-slate-100' : 'bg-[#F8FAFC] text-slate-800'
      }`}
    >
      {activeScreen === 'intro' && (
        <>
          <B360ScrollProgress />
          <B360DataStreamCursor />
        </>
      )}
      {/* ════════════════════════════════════════════════════════════════════
          TELA 1: LANDING ADAPTADA & COMMAND CENTER INTERATIVO
      ════════════════════════════════════════════════════════════════════ */}
      <div
        className={`b360-adaptive-landing ${theme === 'dark' ? 'dark' : 'light'} ${activeScreen === 'intro' ? 'block' : 'hidden'}`}
        data-theme={theme}
      >
        {/* Camada ambiente cinematográfica — orbes de cor + anel de órbita cônico 360° */}
        <div className="b360-ambient" aria-hidden="true">
          <div className="b360-orb b360-orb-a" />
          <div className="b360-orb b360-orb-b" />
          <div className="b360-orb b360-orb-c" />
          <div className="b360-orbit-ring" />
        </div>

        {/* Topbar Fixa */}
        <Landing360Topbar
          viewMode={viewMode}
          theme={theme}
          onSwitchView={handleSwitchView}
          onOpenRoiSimulator={handleOpenRoiSimulator}
          onGoToLogin={handleGoToLogin}
          onToggleTheme={toggleTheme}
        />

        {/* MODO 1: PÁGINA PÚBLICA */}
        {viewMode === 'public' && (
          <Landing360PublicPage
            abVariant={abVariant}
            isProblemIntersecting={isProblemIntersecting}
            onGoToLogin={handleGoToLogin}
            onOpenRoiSimulator={handleOpenRoiSimulator}
            onSwitchView={handleSwitchView}
            onOpenModal={handleOpenModal}
          />
        )}

        {/* MODO 2: COMMAND CENTER (SANDBOX INTERATIVO) */}
        {viewMode === 'command' && <CommandCenterSection onOpenModal={handleOpenModal} />}

        {/* Footer Institucional + Sticky Action Bar + Dock A/B (FooterSection) */}
        <Landing360Footer
          abVariant={abVariant}
          showStickyBar={
            showScrollTop && viewMode === 'public' && activeScreen === 'intro'
          }
          onGoToLogin={handleGoToLogin}
          onSwitchAbVariant={handleSwitchAbVariant}
          onOpenModal={handleOpenModal}
        />

        {/* Modal Editorial dos 11 Módulos e Pilares da Plataforma */}
        <PillarDetailModal
          isOpen={Boolean(activeModal || selectedPillarId)}
          pillarId={selectedPillarId}
          genericModal={activeModal}
          onClose={handleCloseModal}
          onProceedToLogin={handleGoToLogin}
          onOpenRoiSimulator={handleOpenRoiSimulator}
          theme={theme}
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TELA 2: LOGIN — MODAL / TELA DE ACESSO CORPORATIVO (IMPECCABLE SPLIT-STAGE DESIGN)
      ════════════════════════════════════════════════════════════════════ */}
      <Landing360Login
        theme={theme}
        activeScreen={activeScreen}
        isFullscreen={isFullscreen}
        auth={auth}
        onBackToHome={handleBackToHome}
        onToggleTheme={toggleTheme}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* ════════════════════════════════════════════════════════════════════
          BOTÃO FLUTUANTE VOLTAR AO TOPO (NEON FLOATING ACTION BUTTON)
      ════════════════════════════════════════════════════════════════════ */}
      {showScrollTop && activeScreen === 'intro' && (
        <button
          type="button"
          onClick={() => {
            SoundFX.play('click');
            window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
          }}
          className="btn-floating-top"
          aria-label="Voltar ao topo da página"
          title="Voltar ao topo"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
      {/* Modal Global do Simulador Executivo de Previsibilidade & ROI */}
      <RoiSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onProceedToLogin={handleGoToLogin}
      />
    </main>
  );
}
