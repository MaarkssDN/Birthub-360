import { ArrowRight, Calculator, CheckCircle2, Sparkles } from 'lucide-react';
import React from 'react';
import { PillarData, PillarThemeColor } from './PillarRegistry.js';

export interface PillarContentProps {
  pillar: PillarData;
  theme: 'dark' | 'light';
  onAction: () => void;
  onClose: () => void;
  onOpenRoiSimulator?: () => void;
}

export function PillarContent({
  pillar,
  theme,
  onAction,
  onClose,
  onOpenRoiSimulator,
}: PillarContentProps) {
  const IconComponent = pillar.icon;

  const getAccentStyles = (color: PillarThemeColor) => {
    if (theme === 'dark') {
      switch (color) {
        case 'pink':
          return {
            badge: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
            titleText: 'text-pink-400',
            iconColor: 'text-pink-400',
            borderSubtle: 'border-pink-500/20',
            haloGradient: 'from-[#FF2D9B] via-[#8B7DFF] via-[#00D4FF] to-[#FFC107]',
          };
        case 'gold':
          return {
            badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
            titleText: 'text-amber-400',
            iconColor: 'text-amber-400',
            borderSubtle: 'border-amber-500/20',
            haloGradient: 'from-[#FFC107] via-[#FF2D9B] via-[#00D4FF] to-[#8B7DFF]',
          };
        case 'iris':
          return {
            badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
            titleText: 'text-violet-400',
            iconColor: 'text-violet-400',
            borderSubtle: 'border-violet-500/20',
            haloGradient: 'from-[#8B7DFF] via-[#00D4FF] via-[#FF2D9B] to-[#FFC107]',
          };
        default:
          return {
            badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
            titleText: 'text-cyan-400',
            iconColor: 'text-cyan-400',
            borderSubtle: 'border-cyan-500/20',
            haloGradient: 'from-[#00D4FF] via-[#FF2D9B] via-[#FFC107] to-[#8B7DFF]',
          };
      }
    }
    // Light Mode
    switch (color) {
      case 'pink':
        return {
          badge: 'bg-pink-50 text-pink-700 border-pink-200',
          titleText: 'text-pink-700',
          iconColor: 'text-pink-600',
          borderSubtle: 'border-pink-200',
          haloGradient: 'from-[#DB2777] via-[#7C3AED] via-[#0284C7] to-[#D97706]',
        };
      case 'gold':
        return {
          badge: 'bg-amber-50 text-amber-800 border-amber-200',
          titleText: 'text-amber-700',
          iconColor: 'text-amber-600',
          borderSubtle: 'border-amber-200',
          haloGradient: 'from-[#D97706] via-[#DB2777] via-[#0284C7] to-[#7C3AED]',
        };
      case 'iris':
        return {
          badge: 'bg-violet-50 text-violet-700 border-violet-200',
          titleText: 'text-violet-700',
          iconColor: 'text-violet-600',
          borderSubtle: 'border-violet-200',
          haloGradient: 'from-[#7C3AED] via-[#0284C7] via-[#DB2777] to-[#D97706]',
        };
      default:
        return {
          badge: 'bg-sky-50 text-sky-800 border-sky-200',
          titleText: 'text-sky-700',
          iconColor: 'text-sky-600',
          borderSubtle: 'border-sky-200',
          haloGradient: 'from-[#0284C7] via-[#DB2777] via-[#D97706] to-[#7C3AED]',
        };
    }
  };

  const accent = getAccentStyles(pillar.themeColor);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      {/* ====================================================================
          ÁREA 01: CONTEÚDO EDITORIAL & CAPACIDADES EFETIVAS (DESKTOP ESQUERDA)
          ==================================================================== */}
      <div className="lg:col-span-6 space-y-5">
        {/* Badges superiores: Número, Categoria e Disponibilidade */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase font-bold tracking-wider border ${accent.badge}`}
          >
            {pillar.badge}
          </span>
          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
            Pilar {pillar.num} / 08
          </span>
          <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {pillar.availability}
          </span>
        </div>

        {/* Título Oficial (Sora) e Tagline (Inter) */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${accent.borderSubtle} ${
                theme === 'dark' ? 'bg-slate-900/60' : 'bg-slate-100'
              }`}
            >
              <IconComponent className={`w-5 h-5 ${accent.iconColor}`} />
            </div>
            <h2
              id="b360-dialog-title"
              className={`font-display text-2xl lg:text-3xl font-extrabold tracking-tight ${accent.titleText}`}
            >
              {pillar.modalTitle}
            </h2>
          </div>

          <p
            id="b360-dialog-desc"
            className={`text-sm lg:text-base font-sans font-medium leading-snug ${
              theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
            }`}
          >
            {pillar.tagline}
          </p>
        </div>

        {/* Descrição Comercial Aprofundada */}
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed font-sans ${
            theme === 'dark'
              ? 'bg-slate-900/40 border-slate-800/80 text-slate-300'
              : 'bg-slate-50 border-slate-200/90 text-slate-700'
          }`}
        >
          {pillar.commercialDescription}
        </div>

        {/* Capacidades Efetivamente Existentes */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-display text-xs font-bold uppercase tracking-wider ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Capacidades Operacionais Comprovadas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {pillar.capabilities.map((cap) => (
              <div
                key={cap.title}
                className={`p-3 rounded-xl border space-y-1 transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-950/70 border-slate-800/90 text-slate-300 hover:border-slate-700'
                    : 'bg-white border-slate-200 shadow-sm text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${accent.iconColor}`} />
                  <span
                    className={
                      theme === 'dark' ? 'text-slate-100 font-sans' : 'text-slate-900 font-sans'
                    }
                  >
                    {cap.title}
                  </span>
                </div>
                <p
                  className={`text-[11px] leading-normal font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}
                >
                  {cap.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Botões Cápsula com Glow Multicolorido Sleep Cycle */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          {/* Botão Primário Cápsula com Halo Multicolorido */}
          <div className="relative inline-flex group p-[2px] rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-[0_0_20px_rgba(0,212,255,0.2),0_0_25px_rgba(255,45,155,0.15)]">
            {/* Halo Multicolorido Vivo (Sleep Cycle Inspired) */}
            <span
              className={`absolute inset-0 bg-gradient-to-r ${accent.haloGradient} rounded-full opacity-90 group-hover:opacity-100 blur-[2px] transition-opacity duration-300 animate-pulse`}
            />
            <button
              type="button"
              data-primary-action="true"
              onClick={onAction}
              className={`relative z-10 px-6 py-3 rounded-full text-xs uppercase tracking-wider font-mono font-bold transition-all flex items-center justify-center gap-2 ${
                theme === 'dark'
                  ? 'bg-[#0B132B] text-white hover:bg-slate-900'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <span>{pillar.ctaText}</span>
              <ArrowRight className="w-4 h-4 text-[#00D4FF] group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Atalho ao Simulador de ROI quando aplicável */}
          {(pillar.id === '01' || pillar.id === '05') && onOpenRoiSimulator && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRoiSimulator();
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-mono font-semibold transition-colors border ${
                theme === 'dark'
                  ? 'border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10'
                  : 'border-sky-300 text-sky-700 hover:bg-sky-50'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" /> Simular ROI
            </button>
          )}

          {/* Botão Secundário Fechar */}
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-full text-xs font-sans font-semibold transition-colors ${
              theme === 'dark'
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700 hover:text-slate-900'
            }`}
          >
            Fechar
          </button>
        </div>
      </div>

      {/* ====================================================================
          ÁREA 02: VISUALIZAÇÃO CONTEXTUAL & IMPACTO MENSURÁVEL (DESKTOP DIREITA)
          ==================================================================== */}
      <div className="lg:col-span-6 space-y-5">
        {/* Container do Visualizador Contextual */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-semibold">
            <span
              className={`flex items-center gap-1.5 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Interface Operacional
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                theme === 'dark'
                  ? 'bg-slate-900/80 text-slate-400 border-slate-700/60'
                  : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}
            >
              Simulação baseada em dados operacionais
            </span>
          </div>

          {/* Renderização do Mockup Realístico Contextualizado */}
          <div className="transition-all duration-300">{pillar.renderVisualizer(theme)}</div>
        </div>

        {/* Métricas e Benefícios Específicos com Metadados Claros */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3
              className={`font-display text-xs font-bold uppercase tracking-wider ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Impacto & Benefícios Mensuráveis
            </h3>
            <span className="text-[9px] font-mono text-slate-400">
              * Projeções baseadas em simulações
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {pillar.metrics.map((m) => (
              <div
                key={m.label}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-950/70 border-slate-800/90'
                    : 'bg-slate-50 border-slate-200/90 shadow-sm'
                }`}
              >
                <div className={`font-display text-xl font-black ${accent.titleText}`}>
                  {m.value}
                </div>
                <div
                  className={`text-[11px] font-sans font-semibold mt-0.5 ${
                    theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  {m.label}
                </div>
                {m.trend && (
                  <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                    {m.trend}
                  </span>
                )}
                {m.context && (
                  <span className="text-[8px] font-mono text-slate-500 block uppercase tracking-wider mt-0.5">
                    ({m.context})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
