import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Compass,
  Lock,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  type HeroVariant,
  trackHeroCtaPrimaryClick,
  trackHeroRoiSimulatorOpened,
  trackHeroVariantImpression,
  trackHeroVariantSwitched,
} from '../../../lib/analytics/conversionTelemetry.js';
import { SoundFX } from '../../../lib/soundEffects.js';
import { RoiSimulatorModal } from './RoiSimulatorModal.js';

export type { HeroVariant };

interface HeroConversionSectionProps {
  onGoToLogin: () => void;
  theme?: 'light' | 'dark';
}

interface VariantContent {
  tag: string;
  tagColor: string;
  titlePrefix: string;
  titleHighlight: string;
  titleSuffix: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  microProof: string;
}

const VARIANTS: Record<HeroVariant, VariantContent> = {
  A: {
    tag: 'REVENUE COMMAND CENTER • PREVISIBILIDADE TOTAL',
    tagColor: '#00D4FF',
    titlePrefix: 'Pare de perder vendas no ',
    titleHighlight: 'escuro do seu CRM.',
    titleSuffix: ' Previsibilidade total de receita e execução ágil.',
    subtitle:
      'O BirthHub 360° unifica seus dados comerciais, detecta gargalos antes que custem contratos e guia sua equipe com IA para fechar mais negócios em menos tempo.',
    ctaPrimary: 'Ver Cockpit em Ação',
    ctaSecondary: 'Simular Previsibilidade',
    microProof: '⭐ Mais de R$ 180M em negociações orquestradas sem preenchimento manual.',
  },
  B: {
    tag: 'AUTONOMOUS REVOPS PLATFORM • VELOCIDADE & EXECUÇÃO',
    tagColor: '#FF2D9B',
    titlePrefix: 'Seu pipeline atualizado e ',
    titleHighlight: 'operado por IA,',
    titleSuffix: ' enquanto seu time foca em fechar contratos.',
    subtitle:
      'Conecte voz, WhatsApp, enriquecimento preditivo e cadências multicanal diretamente ao seu CRM. Elimine 15 horas semanais de trabalho manual por vendedor.',
    ctaPrimary: 'Experimentar Automação Grátis',
    ctaSecondary: 'Conhecer o VoiceHub & Agentes',
    microProof: '⚡ Tempo médio de resposta a novos leads reduzido de 4 horas para 47 segundos.',
  },
  C: {
    tag: 'EXPANSÃO COMERCIAL B2B • RETORNO SOBRE O PIPELINE',
    tagColor: '#F59E0B',
    titlePrefix: 'Converta até 34% mais ',
    titleHighlight: 'oportunidades',
    titleSuffix: ' com inteligência comercial de ponta a ponta.',
    subtitle:
      'Do primeiro sinal de compra ao contrato assinado. Tenha um centro de comando completo que identifica clientes prontos para fechar e diz exatamente onde agir.',
    ctaPrimary: 'Acessar Demonstração Imediata',
    ctaSecondary: 'Falar com Especialista',
    microProof:
      '🛡️ Integração via API/Webhooks com seu CRM atual • Setup completo em menos de 1 semana.',
  },
};

export function HeroConversionSection({ onGoToLogin }: HeroConversionSectionProps) {
  // Inicialização inteligente da variante (via URL ?v=a|b|c ou default 'A')
  const [activeVariant, setActiveVariant] = useState<HeroVariant>(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const vParam = searchParams.get('v')?.toUpperCase();
      if (vParam === 'A' || vParam === 'B' || vParam === 'C') {
        return vParam;
      }
      const saved = sessionStorage.getItem('bh_hero_variant') as HeroVariant;
      if (saved && (saved === 'A' || saved === 'B' || saved === 'C')) {
        return saved;
      }
    } catch {
      // Fallback seguro em ambientes sem window
    }
    return 'A';
  });

  const [activeTabTelemetry, setActiveTabTelemetry] = useState<'deal' | 'voice'>('deal');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const content = VARIANTS[activeVariant];

  // 1. Rastrear visualização da variante do Hero (com deduplicação de sessão)
  useEffect(() => {
    trackHeroVariantImpression(activeVariant);
  }, [activeVariant]);

  const handleSelectVariant = (variant: HeroVariant) => {
    SoundFX.play('click');
    if (variant !== activeVariant) {
      trackHeroVariantSwitched(activeVariant, variant);
    }
    setActiveVariant(variant);
    try {
      sessionStorage.setItem('bh_hero_variant', variant);
      const url = new URL(window.location.href);
      url.searchParams.set('v', variant.toLowerCase());
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore
    }
  };

  const handlePrimaryClick = () => {
    SoundFX.play('confirm');
    trackHeroCtaPrimaryClick(activeVariant, content.ctaPrimary);
    onGoToLogin();
  };

  const handleSecondaryClick = () => {
    SoundFX.play('click');
    if (activeVariant === 'A' || activeVariant === 'C') {
      trackHeroRoiSimulatorOpened(activeVariant, 'hero_secondary');
      setIsSimulatorOpen(true);
    } else {
      const el =
        document.getElementById('ia') ||
        document.getElementById('pilares') ||
        document.getElementById('problema');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section
      id="hero"
      aria-label="Seção Principal de Conversão"
      className="relative px-5 pt-12 pb-20 sm:px-8 lg:px-14 overflow-hidden border-b border-slate-700/60 transition-colors"
    >
      {/* Halos luminosos neon sutis de fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-10 right-10 w-[550px] h-[550px] max-w-full rounded-full blur-[150px] bg-[#00D4FF]/12"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 left-10 w-[500px] h-[500px] max-w-full rounded-full blur-[150px] bg-[#FF2D9B]/10"
      />

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center">
        {/* ====================================================================
            BARRA DE TESTE A/B INTERATIVO (EXPERIMENTAÇÃO RÁPIDA EM TEMPO REAL)
            ==================================================================== */}
        <div className="mb-6 inline-flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-full bg-slate-900 border border-slate-700 shadow-inner">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-slate-200 px-3 py-1 hidden sm:inline-flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#00D4FF]" />
            Teste A/B:
          </span>
          <button
            type="button"
            onClick={() => handleSelectVariant('A')}
            className={`px-3 py-1 rounded-full font-mono text-xs font-bold transition-all ${
              activeVariant === 'A'
                ? 'bg-[#00D4FF] text-slate-950 shadow-[0_0_12px_rgba(0,212,255,0.4)]'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            A · Previsibilidade
          </button>
          <button
            type="button"
            onClick={() => handleSelectVariant('B')}
            className={`px-3 py-1 rounded-full font-mono text-xs font-bold transition-all ${
              activeVariant === 'B'
                ? 'bg-[#FF2D9B] text-white shadow-[0_0_12px_rgba(255,45,155,0.4)]'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            B · Automação IA
          </button>
          <button
            type="button"
            onClick={() => handleSelectVariant('C')}
            className={`px-3 py-1 rounded-full font-mono text-xs font-bold transition-all ${
              activeVariant === 'C'
                ? 'bg-[#F59E0B] text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            C · Aceleração & ROI
          </button>
        </div>

        {/* ====================================================================
            BLOCO CENTRAL: HEADLINE + SUBTITLE + CTAs
            ==================================================================== */}
        <div className="text-center max-w-4xl mx-auto flex flex-col items-center">
          {/* Eyebrow Kicker com Status Pulsante (Container opaco de alto contraste) */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider mb-5 shadow-sm bg-slate-950 border"
            style={{
              color: content.tagColor,
              borderColor: `${content.tagColor}50`,
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_currentColor]"
              style={{ backgroundColor: content.tagColor }}
            />
            <span>{content.tag}</span>
          </div>

          {/* Headline H1 com Contraste Neon de Alta Conversão */}
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.18] text-center mb-6">
            <span className="block text-sm sm:text-base font-mono font-bold uppercase tracking-widest text-sky-700 dark:text-[#00D4FF] mb-2">
              Dados que Conectam · Inteligência que Decide
            </span>
            <span className="landing-title-cyan">{content.titlePrefix}</span>
            <span
              className="font-extrabold ml-1.5"
              style={{
                color:
                  activeVariant === 'B' ? '#FF2D9B' : activeVariant === 'C' ? '#F59E0B' : '#00D4FF',
                textShadow:
                  activeVariant === 'B'
                    ? '0 0 20px rgba(255,45,155,0.35)'
                    : activeVariant === 'C'
                      ? '0 0 20px rgba(245,158,11,0.35)'
                      : '0 0 20px rgba(0,212,255,0.35)',
              }}
            >
              {content.titleHighlight}
            </span>
            <br className="hidden sm:inline" />
            <span className="landing-title-gold block sm:inline mt-1 sm:mt-0">
              {content.titleSuffix}
            </span>
          </h1>

          {/* Subtítulo de Conversão - Sem texto branco ou preto puro */}
          <p className="landing-subtitle text-base sm:text-lg md:text-xl font-medium max-w-3xl leading-relaxed text-center mx-auto mb-8">
            {content.subtitle}
          </p>

          {/* ================================================================
              BOTOES DE ACAO PRIMARIO E SECUNDARIO (MENOS DE 10 SEGUNDOS)
              ================================================================ */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrimaryClick}
              className="btn-cta-light btn-cta-pulse w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-mono text-sm sm:text-base font-bold uppercase tracking-wider cursor-pointer shadow-lg hover:shadow-[0_0_25px_rgba(0,212,255,0.45)] transition-all"
            >
              <span>{content.ctaPrimary}</span>
              <ArrowRight className="w-5 h-5 text-slate-950" />
            </button>

            <button
              type="button"
              onClick={handleSecondaryClick}
              className="btn-secondary-dark w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl font-mono text-sm font-bold uppercase tracking-wider transition-all border border-slate-700 hover:border-slate-500"
            >
              <span>{content.ctaSecondary}</span>
              <Compass className="w-4 h-4 text-[#00D4FF]" />
            </button>
          </div>

          {/* Micro-Garantia Anti-Fricção */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-xs text-slate-200">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Acesso Imediato
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Sem cartão de crédito
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Setup Multi-CRM via API
            </span>
          </div>
        </div>

        {/* ====================================================================
            IMAGEM DE APOIO: MOCKUP INTERATIVO DE COCKPIT (ABOVE THE FOLD)
            Projetado para prender a atenção e validar a promessa em 3 segundos
            ==================================================================== */}
        <div className="mt-14 w-full max-w-5xl mx-auto">
          <div className="relative rounded-2xl sm:rounded-3xl border border-slate-700/80 bg-slate-900/90 dark:bg-[#101524]/95 backdrop-blur-xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Top Bar da Janela */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-600/50" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/50" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/50" />
                <span className="ml-2 font-mono text-[11px] font-semibold text-slate-200 hidden sm:inline">
                  BirthHub 360° · Revenue Operating System v4.2
                </span>
              </div>

              {/* Status ao vivo */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399]" />
                <span className="font-mono text-[10px] font-bold tracking-wider text-slate-300 uppercase">
                  Telemetria Ativa
                </span>
              </div>
            </div>

            {/* Conteúdo interno do Cockpit */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
              {/* Barra de KPIs Rápidos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-200 mb-1">
                    <span>PIPELINE MONITORADO</span>
                    <TrendingUp className="w-4 h-4 text-[#00D4FF]" />
                  </div>
                  <div className="font-display text-xl sm:text-2xl font-black text-cyan-400">
                    R$ 4.820.000
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 mt-1">
                    ▲ +34% este trimestre
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-200 mb-1">
                    <span>PRECISÃO PREDITIVA</span>
                    <BarChart3 className="w-4 h-4 text-[#FF2D9B]" />
                  </div>
                  <div className="font-display text-xl sm:text-2xl font-black text-pink-400">
                    99.4%
                  </div>
                  <div className="text-[11px] font-mono text-slate-200 mt-1">
                    Forecast auditado por IA
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-200 mb-1">
                    <span>TEMPO DE RESPOSTA</span>
                    <Zap className="w-4 h-4 text-[#F59E0B]" />
                  </div>
                  <div className="font-display text-xl sm:text-2xl font-black text-amber-400">
                    47 segundos
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 mt-1">
                    Via VoiceHub & WhatsApp
                  </div>
                </div>
              </div>

              {/* Seletor de visualização do card de apoio */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      SoundFX.play('click');
                      setActiveTabTelemetry('deal');
                    }}
                    className={`px-3 py-1 rounded-lg font-mono text-xs font-bold transition-all ${
                      activeTabTelemetry === 'deal'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(0,212,255,0.2)]'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    1. Deal Intelligence
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      SoundFX.play('click');
                      setActiveTabTelemetry('voice');
                    }}
                    className={`px-3 py-1 rounded-lg font-mono text-xs font-bold transition-all ${
                      activeTabTelemetry === 'voice'
                        ? 'bg-pink-950 text-pink-300 border border-pink-400/60 shadow-[0_0_10px_rgba(255,45,155,0.2)]'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    2. Agente Autônomo VoiceHub
                  </button>
                </div>
                <span className="font-mono text-[11px] text-slate-300 hidden sm:inline">
                  {content.microProof}
                </span>
              </div>

              {/* Card dinâmico conforme aba ativa */}
              {activeTabTelemetry === 'deal' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-cyan-500/30">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-400 font-bold">
                        Oportunidade Prioritária
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Score IA: 94% (Fechamento Iminente)
                      </span>
                    </div>
                    <div className="font-display text-lg font-bold text-slate-100">
                      Hospital Materno Alpha · R$ 320.000
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      Sinal de compra detectado: CFO e Diretor de Compras revisaram a proposta 3
                      vezes nas últimas 2 horas.
                    </p>
                  </div>

                  <div className="flex flex-col justify-between p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="text-xs font-mono text-slate-300">
                      <span className="text-amber-400 font-bold">Próxima Ação Recomendada:</span>{' '}
                      Disparar minuta de assinatura com cláusula SLA prioritária.
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-300">
                      <span className="flex items-center gap-1.5 text-cyan-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        CRM Sincronizado via Webhook
                      </span>
                      <span className="text-slate-300">Há 2 minutos</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-pink-500/30">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-pink-400 font-bold flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5" />
                        Agente de Voz & WhatsApp
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30">
                        Cadência Ativa
                      </span>
                    </div>
                    <div className="font-display text-lg font-bold text-slate-100">
                      Qualificação Automática · 42 segundos
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed italic border-l-2 border-pink-500/40 pl-3">
                      “Olá Dr. Renato, identificamos sua solicitação sobre o módulo de previsão de
                      receita. O especialista tem horário livre hoje às 16:30. Podemos confirmar?”
                    </p>
                  </div>

                  <div className="flex flex-col justify-between p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="text-xs font-mono text-slate-300">
                      <span className="text-emerald-400 font-bold">Resultado:</span> Lead confirmou
                      reunião para 16:30. Oportunidade movida automaticamente para o estágio
                      “Reunião Agendada”.
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-300">
                      <span className="flex items-center gap-1.5 text-pink-400">
                        <PhoneCall className="w-3.5 h-3.5" />
                        Gravação & Transcrição Salvas
                      </span>
                      <span className="text-slate-300">Zero preenchimento manual</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Selos de Confiança Enterprise e Integração */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">Conexão API & Webhooks:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                    Bitrix24
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                    Salesforce
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                    HubSpot
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                    WhatsApp API
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px]">
                  <span className="inline-flex items-center gap-1 text-slate-300">
                    <Lock className="w-3.5 h-3.5 text-[#00D4FF]" />
                    Isolamento RLS Multi-Tenant
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    LGPD 100% Conforme
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulador Executivo de ROI & Previsibilidade */}
      <RoiSimulatorModal
        isOpen={isSimulatorOpen}
        variant={activeVariant}
        onClose={() => setIsSimulatorOpen(false)}
        onProceedToLogin={onGoToLogin}
      />
    </section>
  );
}
