import { ArrowRight, ChevronDown, Lock, Radio, Shield } from 'lucide-react';
import { Suspense, lazy } from 'react';
import { SoundFX } from '../../../../lib/soundEffects.js';
import { MagneticButton } from './MagneticButton.js';
import { SculpturalReveal } from './SculpturalReveal.js';

const BirthHubOrbit360 = lazy(() =>
  import('../../../../components/brand/BirthHubOrbit360').then((mod) => ({
    default: mod.BirthHubOrbit360,
  })),
);

interface Act1HeroProps {
  onOpenPrivateAccess?: () => void;
}

export function Act1Hero({ onOpenPrivateAccess }: Act1HeroProps) {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-16 overflow-hidden">
      {/* Luz ambiente de refração profunda */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00D4FF]/10 via-[#0D0D0D]/60 to-[#0D0D0D]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-[#00D4FF]/12 via-[#FF2D9B]/5 to-transparent blur-3xl opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Coluna de Texto & Tese de Poder (7 Colunas no Desktop) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left z-10">
            {/* HUD Badge de Telemetria */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-[#00D4FF]/25 backdrop-blur-md shadow-[0_0_20px_rgba(0,212,255,0.12)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D4FF] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D4FF]" />
              </span>
              <span className="font-mono text-xs font-semibold tracking-wider uppercase text-[#00D4FF]">
                Arquitetura de Comando 360º · 2026
              </span>
            </div>

            {/* Manchete Monumental com Revelação Escultural */}
            <SculpturalReveal delay={0.1}>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-[-0.03em] leading-[1.04]">
                <span className="block text-[#F8F9FF]">A inteligência de negócios.</span>
                <span className="block lux-headline-hero">Unificada e soberana.</span>
              </h1>
            </SculpturalReveal>

            {/* Subtítulo de Autoridade */}
            <SculpturalReveal delay={0.22}>
              <p className="max-w-xl text-base sm:text-lg lg:text-xl text-[#9EADC8] font-normal leading-relaxed">
                Conectando dados dispersos, IA preditiva, automação e orquestração de vendas em uma
                única central executiva. Menos fragmentação. Decisões cirúrgicas. Execução em tempo real.
              </p>
            </SculpturalReveal>

            {/* Ações Primárias (CTAs com Puxão Magnético) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <MagneticButton
                onClick={() => {
                  SoundFX.play('confirm');
                  onOpenPrivateAccess?.();
                }}
                className="lux-btn-primary group"
              >
                <span>Solicitar Demonstração Executiva</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </MagneticButton>

              <a
                href="#tese"
                onPointerDown={() => SoundFX.play('focus')}
                className="lux-btn-secondary"
              >
                <span>Compreender a Arquitetura</span>
              </a>
            </div>

            {/* Indicadores de Segurança & Garantia Institucional */}
            <div className="pt-6 sm:pt-8 border-t border-white/[0.08] grid grid-cols-3 gap-6 max-w-lg">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#9EADC8] mb-1">
                  <Shield className="w-3.5 h-3.5 text-[#00D4FF]" />
                  <span>Segurança</span>
                </div>
                <div className="font-bold text-sm sm:text-base text-[#F8F9FF]">Multi-Tenant RLS</div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#9EADC8] mb-1">
                  <Lock className="w-3.5 h-3.5 text-[#FFC107]" />
                  <span>Privacidade</span>
                </div>
                <div className="font-bold text-sm sm:text-base text-[#F8F9FF]">100% LGPD Nativo</div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#9EADC8] mb-1">
                  <Radio className="w-3.5 h-3.5 text-[#FF2D9B]" />
                  <span>Velocidade</span>
                </div>
                <div className="font-bold text-sm sm:text-base text-[#F8F9FF]">Tempo Real / 120 FPS</div>
              </div>
            </div>
          </div>

          {/* Coluna 3D Gravitacional: A Órbita 360 WebGL (5 Colunas) */}
          <div className="lg:col-span-5 flex items-center justify-center relative min-h-[380px] sm:min-h-[460px]">
            {/* Halo de luz atrás da órbita */}
            <div className="absolute w-[340px] h-[340px] rounded-full bg-gradient-to-tr from-[#00D4FF]/20 via-[#FF2D9B]/10 to-[#FFC107]/15 blur-2xl -z-10" />

            <Suspense
              fallback={
                <div className="h-[360px] w-[360px] rounded-full bg-[#14141A] border border-[#00D4FF]/20 flex items-center justify-center animate-pulse">
                  <span className="font-serif italic text-4xl text-[#FFC107]">B</span>
                </div>
              }
            >
              <BirthHubOrbit360 size={420} interactive />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Indicador sutil de rolagem */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
        <span className="font-mono text-[10px] tracking-widest text-[#9EADC8] uppercase">
          Role para desconstruir
        </span>
        <ChevronDown className="w-4 h-4 text-[#00D4FF] animate-bounce" />
      </div>
    </section>
  );
}
