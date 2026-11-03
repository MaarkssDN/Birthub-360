import { useState } from 'react';
import { BirthHubLogo } from '../../../components/brand/BirthHubLogo.js';
import {
  AuroraButton,
  BentoShowcase,
  CtaBanner,
  HeroMockup,
  PricingSection,
  StatsGrid,
} from '../../../components/ui/index.js';
import { SoundFX } from '../../../lib/soundEffects.js';
import { CommercialJourneyStream } from '../../dashboard/components/CommercialJourneyStream.js';
import '../pages/AuroraMotion.css';

export interface LaunchLandingViewProps {
  onGoToLogin: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const OFFICIAL_PILLARS = [
  {
    id: '01',
    name: 'HUB COMERCIAL',
    desc: 'Centralização de contas, pipeline unificado e visão 360° de cada oportunidade em negociação.',
    color: '#00D4FF',
    tag: 'Pipeline Central',
    cardBgLight: 'from-sky-50/50 to-white',
    cardBgDark: 'dark:from-[#101928] dark:to-[#0C121D]',
  },
  {
    id: '02',
    name: 'INTELIGÊNCIA DE MERCADO',
    desc: 'Enriquecimento analítico de dados B2B, sinais de compra e qualificação precisa de decisores.',
    color: '#FF2D9B',
    tag: 'Decisão por Dados',
    cardBgLight: 'from-pink-50/50 to-white',
    cardBgDark: 'dark:from-[#21111E] dark:to-[#140B13]',
  },
  {
    id: '03',
    name: 'ORQUESTRAÇÃO DE VENDAS',
    desc: 'Cadências multicanal coordenadas, regras de passagem de bastão e esteira de fechamento.',
    color: '#00D4FF',
    tag: 'Fluxos Integrados',
    cardBgLight: 'from-cyan-50/50 to-white',
    cardBgDark: 'dark:from-[#0E1A26] dark:to-[#09111A]',
  },
  {
    id: '04',
    name: 'PERFORMANCE COMERCIAL',
    desc: 'Telemetria de conversão, velocidade de avanço no funil, metas e produtividade da equipe.',
    color: '#F59E0B',
    tag: 'Metas & Velocidade',
    cardBgLight: 'from-amber-50/50 to-white',
    cardBgDark: 'dark:from-[#21190E] dark:to-[#151009]',
  },
  {
    id: '05',
    name: 'PREVISIBILIDADE COMERCIAL',
    desc: 'Modelagem estatística de probabilidade, análise de pipeline ponderado e cenários embasados no histórico real.',
    color: '#F59E0B',
    tag: 'Pipeline Ponderado',
    cardBgLight: 'from-yellow-50/50 to-white',
    cardBgDark: 'dark:from-[#211B0E] dark:to-[#141109]',
  },
  {
    id: '06',
    name: 'INTELIGÊNCIA ARTIFICIAL',
    desc: 'Copiloto comercial ancorado nos dados da empresa, diagnóstico de entraves e suporte ativo em negociações.',
    color: '#8B7DFF',
    tag: 'Copiloto & Modelos',
    cardBgLight: 'from-purple-50/50 to-white',
    cardBgDark: 'dark:from-[#1A1428] dark:to-[#110D1B]',
  },
  {
    id: '07',
    name: 'AUTOMAÇÃO & CONEXÕES',
    desc: 'Gatilhos automatizados de tarefas, regras de avanço de estágio e integrações contínuas de CRM e telefonia.',
    color: '#D4F434',
    tag: 'Ações Automáticas',
    cardBgLight: 'from-lime-50/50 to-white',
    cardBgDark: 'dark:from-[#181F10] dark:to-[#0F140A]',
  },
  {
    id: '08',
    name: 'ENGAJAMENTO COMERCIAL',
    desc: 'Régua de relacionamento, telemetria de interações ativas e acompanhamento de compradores corporativos.',
    color: '#00D4FF',
    tag: 'Interações Ativas',
    cardBgLight: 'from-sky-50/50 to-white',
    cardBgDark: 'dark:from-[#101928] dark:to-[#0C121D]',
  },
];

const FAQS = [
  {
    q: 'Como funciona a integração com CRMs legados como o Bitrix24?',
    a: 'O Birth Hub 360° opera como uma camada de inteligência e orquestração conectada via API REST e webhooks bidirecionais. Os dados de leads, contatos e negócios são sincronizados em tempo real com tolerância a falhas e fila durável.',
    color: '#00D4FF',
  },
  {
    q: 'O que diferencia o Enxame de Agentes de IA dos chatbots comuns?',
    a: 'Nossos agentes executam papéis estruturados de receita (SDR, Closer, RevOps) operando sobre a governança de dados da empresa, aplicando playbook formal, analisando áudios transcritos e gerando Next-Best-Actions precisas.',
    color: '#FF2D9B',
  },
  {
    q: 'A plataforma cumpre integralmente a LGPD?',
    a: 'Sim. Todo o ciclo de vida dos dados pessoais obedece a políticas rígidas de minimização, retenção, isolamento multi-tenant (RLS) e criptografia ponta a ponta.',
    color: '#D4F434',
  },
  {
    q: 'Qual o tempo médio de implantação da plataforma?',
    a: 'O provisionamento é imediato. A configuração dos módulos e a conexão inicial dos webhooks leva menos de 15 minutos pelo assistente de Onboarding.',
    color: '#F59E0B',
  },
];

export function LaunchLandingView({ onGoToLogin, theme, onToggleTheme }: LaunchLandingViewProps) {
  const [viewMode, setViewMode] = useState<'public' | 'command'>('public');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    SoundFX.play('click');
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleSwitchView = (mode: 'public' | 'command') => {
    SoundFX.play('confirm');
    setViewMode(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative w-full overflow-hidden bg-[#F4F7FB] dark:bg-[#07090D] transition-colors duration-300">
      {/* ── 1. TOPBAR COM BRAND + SELETOR DE VISUALIZAÇÃO + AURORA BUTTON ── */}
      <header className="sticky top-0 z-50 w-full bg-[#F4F7FB]/90 dark:bg-[#0A0E17]/90 backdrop-blur-2xl border-b border-[#D8E4EF]/80 dark:border-white/10 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo Oficial Birth Hub 360 */}
          <a href="#hero" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 relative flex items-center justify-center">
              <BirthHubLogo variant="icon" title="Birth Hub 360" className="w-full h-full" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-extrabold tracking-tight text-[#1E4E75] dark:text-[#8EE4EF]">
                Birthub{' '}
                <strong className="text-xs font-black text-[#ED3197] align-super tracking-normal">
                  360°
                </strong>
              </span>
            </div>
          </a>

          {/* Seletor Pílula: Página Pública vs Command Center (Referência HTML) */}
          <nav
            className="p-1 bg-[#EAF0F8] dark:bg-white/5 border border-[#DAE5F1] dark:border-white/10 rounded-full flex items-center gap-1 shadow-inner"
            aria-label="Alternar visualização"
          >
            <button
              type="button"
              onClick={() => handleSwitchView('public')}
              className={`px-4 sm:px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'public'
                  ? 'bg-white dark:bg-[#1E293B] text-[#1B617B] dark:text-[#00D4FF] shadow-sm'
                  : 'text-[#607591] dark:text-slate-400 hover:text-[#1B617B] dark:hover:text-white'
              }`}
            >
              Página pública
            </button>
            <button
              type="button"
              onClick={() => handleSwitchView('command')}
              className={`px-4 sm:px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'command'
                  ? 'bg-white dark:bg-[#1E293B] text-[#1B617B] dark:text-[#00D4FF] shadow-sm'
                  : 'text-[#607591] dark:text-slate-400 hover:text-[#1B617B] dark:hover:text-white'
              }`}
            >
              Command Center
            </button>
          </nav>

          {/* Links e Botão Aurora */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <AuroraButton size="small" onClick={onGoToLogin}>
              <span>Explorar plataforma →</span>
            </AuroraButton>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════
          VISUALIZAÇÃO 1: PÁGINA PÚBLICA (AURORA MOTION PREVIEW)
      ════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'public' && (
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-16">
          {/* ── HERO CELESTIAL AURORA ── */}
          <section id="hero" className="aurora-hero mt-2">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center min-h-[550px] p-8 sm:p-14 lg:p-16 gap-8 relative z-10">
              {/* Esquerda: Copywriting Editorial */}
              <div className="lg:col-span-7 space-y-6">
                <div className="text-[11px] font-mono font-extrabold uppercase tracking-[0.22em] text-[#78E1F7]">
                  O NOVO RITMO DA INTELIGÊNCIA COMERCIAL
                </div>

                <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.03] text-[#BFEFFF]">
                  Conecte ideias.
                  <br />
                  <em className="not-italic text-[#FFC0DE]">Acelere resultados.</em>
                </h1>

                <p className="max-w-xl text-base sm:text-lg text-[#B5D7DF] leading-relaxed font-normal">
                  Uma operação comercial inteira, conduzida por inteligência, criatividade e agentes
                  autônomos que trabalham em conjunto com a sua equipe.
                </p>

                <div className="pt-2">
                  <AuroraButton onClick={onGoToLogin}>
                    <span>Conhecer a experiência</span>
                    <span aria-hidden="true">↗</span>
                  </AuroraButton>
                </div>

                <div className="pt-4 text-xs font-mono text-[#9BC3D2]">
                  ✦ <b className="text-[#B8F1EC] font-bold">Supervisor 360°</b> · Orquestração
                  inteligente · Experiência integrada Multi-CRM
                </div>
              </div>

              {/* Direita: Cena 3D Orbit com Celestial Orb & Satélite */}
              <div className="lg:col-span-5 aurora-orbit-scene select-none" aria-hidden="true">
                <div className="aurora-orb">
                  <span className="small-orb" />
                </div>

                {/* Floating Frosted Glass Chips */}
                <div className="aurora-floating-chip aurora-chip-1">
                  INTELIGÊNCIA ATIVA
                  <strong>Supervisor 360°</strong>
                </div>

                <div className="aurora-floating-chip aurora-chip-2">
                  ECOSSISTEMA
                  <strong>8 pilares conectados</strong>
                </div>
              </div>
            </div>
          </section>

          {/* ── DESTAQUES: 4 CARDS EDITORIAIS COM ARTE GEOMÉTRICA (REFERÊNCIA HTML) ── */}
          <section id="destaques" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
              <div>
                <span className="text-[11px] font-mono font-extrabold uppercase tracking-[0.22em] text-[#0284c7] dark:text-[#78E1F7]">
                  UMA PLATAFORMA, MUITAS POSSIBILIDADES
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#245978] dark:text-[#BFEFFF] mt-1.5">
                  Descubra novos caminhos
                </h2>
              </div>
              <p className="max-w-md text-sm text-[#647794] dark:text-[#94D2F8] leading-relaxed">
                Cards editoriais com luz, textura e profundidade. Informação objetiva, sem
                sobrecarregar a interface.
              </p>
            </div>

            <div className="aurora-feature-grid">
              {/* Card 1: Supervisor IA */}
              <button type="button" onClick={onGoToLogin} className="aurora-feature one group">
                <span className="text-[10px] font-mono font-extrabold tracking-[0.18em] text-white/70">
                  DESTAQUE / 01
                </span>
                <span className="aurora-card-art" aria-hidden="true" />
                <span className="absolute bottom-6 left-6 right-6">
                  <h3 className="font-display text-2xl font-bold tracking-tight text-[#F0E8FF] mb-1">
                    Supervisor IA
                  </h3>
                  <p className="text-xs text-white/80 leading-relaxed max-w-[200px]">
                    Um único ponto de comando para orquestrar toda a receita.
                  </p>
                </span>
                <span className="absolute right-5 bottom-6 w-8 h-8 rounded-full border border-white/40 flex items-center justify-center text-white text-xs group-hover:scale-110 transition-transform">
                  ↗
                </span>
              </button>

              {/* Card 2: Prospecção inteligente */}
              <button type="button" onClick={onGoToLogin} className="aurora-feature two group">
                <span className="text-[10px] font-mono font-extrabold tracking-[0.18em] text-white/70">
                  DESTAQUE / 02
                </span>
                <span className="aurora-card-art" aria-hidden="true" />
                <span className="absolute bottom-6 left-6 right-6">
                  <h3 className="font-display text-2xl font-bold tracking-tight text-[#E8FFFF] mb-1">
                    Prospecção
                  </h3>
                  <p className="text-xs text-white/80 leading-relaxed max-w-[200px]">
                    Precisão em cada oportunidade e qualificação de CNPJs.
                  </p>
                </span>
                <span className="absolute right-5 bottom-6 w-8 h-8 rounded-full border border-white/40 flex items-center justify-center text-white text-xs group-hover:scale-110 transition-transform">
                  ↗
                </span>
              </button>

              {/* Card 3: Inteligência comercial */}
              <button type="button" onClick={onGoToLogin} className="aurora-feature three group">
                <span className="text-[10px] font-mono font-extrabold tracking-[0.18em] text-white/70">
                  DESTAQUE / 03
                </span>
                <span className="aurora-card-art" aria-hidden="true" />
                <span className="absolute bottom-6 left-6 right-6">
                  <h3 className="font-display text-2xl font-bold tracking-tight text-[#FFF3E8] mb-1">
                    Inteligência
                  </h3>
                  <p className="text-xs text-white/80 leading-relaxed max-w-[200px]">
                    Dados auditados que guiam decisões e eliminam achismos.
                  </p>
                </span>
                <span className="absolute right-5 bottom-6 w-8 h-8 rounded-full border border-white/40 flex items-center justify-center text-white text-xs group-hover:scale-110 transition-transform">
                  ↗
                </span>
              </button>

              {/* Card 4: VoiceHub */}
              <button type="button" onClick={onGoToLogin} className="aurora-feature four group">
                <span className="text-[10px] font-mono font-extrabold tracking-[0.18em] text-white/70">
                  DESTAQUE / 04
                </span>
                <span className="aurora-card-art" aria-hidden="true" />
                <span className="absolute bottom-6 left-6 right-6">
                  <h3 className="font-display text-2xl font-bold tracking-tight text-[#F0F2FF] mb-1">
                    VoiceHub
                  </h3>
                  <p className="text-xs text-white/80 leading-relaxed max-w-[200px]">
                    Conversas gravadas, transcritas e integradas à cadência.
                  </p>
                </span>
                <span className="absolute right-5 bottom-6 w-8 h-8 rounded-full border border-white/40 flex items-center justify-center text-white text-xs group-hover:scale-110 transition-transform">
                  ↗
                </span>
              </button>
            </div>
          </section>

          {/* ── DEMONSTRAÇÃO VIVA DO PRODUTO (JORNADA 360) ── */}
          <section className="space-y-4 pt-4">
            <HeroMockup title="Birth Hub 360° · Revenue Operating System">
              <CommercialJourneyStream />
            </HeroMockup>
          </section>

          {/* ── MÉTRICAS DE IMPACTO ── */}
          <section id="metricas" className="py-6 space-y-6">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-[11px] font-mono font-extrabold uppercase tracking-[0.22em] text-[#0284c7] dark:text-[#00D4FF]">
                TELEMETRIA REAL EM TEMPO REAL
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#245978] dark:text-[#BFEFFF] mt-1">
                Indicadores auditados de ponta a ponta
              </h2>
            </div>
            <StatsGrid />
          </section>

          {/* ── BENTO SHOWCASE ── */}
          <section id="recursos">
            <BentoShowcase />
          </section>

          {/* ── STRIP DE CONVERSÃO DO SUPERVISOR (REFERÊNCIA HTML) ── */}
          <section className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 sm:p-10 rounded-[28px] bg-gradient-to-r from-[#EEF4FA] to-[#E3EDF7] dark:from-[#111928] dark:to-[#0B1220] border border-[#DCE7F3] dark:border-white/10 shadow-sm">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1E4E75] dark:text-[#8EE4EF]">
                A próxima ação começa com uma conversa.
              </h3>
              <p className="text-sm text-[#6F8095] dark:text-[#70D6FF] max-w-xl">
                O Supervisor recebe a intenção e aciona os agentes certos, dentro dos módulos do
                Birth Hub 360°.
              </p>
            </div>

            <AuroraButton onClick={onGoToLogin}>
              <span>Falar com o Supervisor</span>
              <span aria-hidden="true">↗</span>
            </AuroraButton>
          </section>

          {/* ── 8 PILARES OFICIAIS ── */}
          <section id="pilares" className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-[11px] font-mono font-extrabold uppercase tracking-[0.22em] text-[#ED3197]">
                METODOLOGIA OFICIAL
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#245978] dark:text-[#BFEFFF] mt-1">
                Seus oito pilares de crescimento
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {OFFICIAL_PILLARS.map((pilar) => (
                <div
                  key={pilar.id}
                  className={`relative rounded-3xl p-6 border bg-gradient-to-br ${pilar.cardBgLight} ${pilar.cardBgDark} shadow-xs hover:scale-[1.02] transition-all flex flex-col justify-between`}
                  style={{ borderColor: `${pilar.color}35` }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className="font-mono text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: `${pilar.color}20`,
                          color: pilar.color,
                          border: `1px solid ${pilar.color}45`,
                        }}
                      >
                        Pilar {pilar.id}
                      </span>
                      <span
                        className="font-mono text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: pilar.color }}
                      >
                        {pilar.tag}
                      </span>
                    </div>

                    <h3
                      className="font-display text-lg font-extrabold mb-2 leading-snug"
                      style={{ color: pilar.color }}
                    >
                      {pilar.name}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                      {pilar.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Status Ativo
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]"
                      style={{ backgroundColor: pilar.color, color: pilar.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── PLANOS & PREÇOS ── */}
          <section id="precos">
            <PricingSection onSelectPlan={() => onGoToLogin()} />
          </section>

          {/* ── FAQ ── */}
          <section id="faq" className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
              <span className="text-[11px] font-mono font-extrabold uppercase tracking-[0.22em] text-[#0284c7] dark:text-[#00D4FF]">
                TIRE SUAS DÚVIDAS
              </span>
              <h2 className="font-display text-3xl font-extrabold text-[#245978] dark:text-[#BFEFFF] mt-1">
                Perguntas Frequentes
              </h2>
            </div>

            <div className="space-y-3.5">
              {FAQS.map((faq, i) => {
                const isOpen = activeFaq === i;
                return (
                  <div
                    key={faq.q}
                    className="rounded-2xl border bg-white/90 dark:bg-[#111928] shadow-xs overflow-hidden transition-all duration-200"
                    style={{
                      borderColor: isOpen ? `${faq.color}60` : 'rgba(216,228,239,0.8)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(i)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 font-sans font-bold text-sm sm:text-base cursor-pointer"
                      style={{ color: isOpen ? faq.color : undefined }}
                    >
                      <span className={isOpen ? undefined : 'text-slate-800 dark:text-slate-100'}>
                        {faq.q}
                      </span>
                      <span
                        className="font-mono text-lg font-bold px-2 py-0.5 rounded-full"
                        style={{
                          color: faq.color,
                          backgroundColor: `${faq.color}15`,
                        }}
                      >
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>
                    {isOpen && (
                      <div
                        className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t pt-3 font-normal"
                        style={{ borderColor: `${faq.color}20` }}
                      >
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── CTA BANNER FINAL ── */}
          <section>
            <CtaBanner onCtaClick={onGoToLogin} />
          </section>
        </main>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          VISUALIZAÇÃO 2: COMMAND CENTER INTERATIVO (REFERÊNCIA HTML)
      ════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'command' && (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar Esquerda do Command Center (Referência HTML) */}
            <aside className="lg:col-span-3 min-h-[740px] rounded-3xl bg-[#0A1728] p-6 text-[#C9DAF0] shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 text-lg font-bold text-[#8EE4EF] pb-4 border-b border-white/10">
                <BirthHubLogo variant="icon" title="Birth Hub 360" className="w-7 h-7" />
                <span>Birthub 360°</span>
              </div>

              <small className="text-[10px] font-mono font-extrabold uppercase tracking-[0.16em] text-[#8294AE] block pt-2">
                PRINCIPAL
              </small>

              <div className="space-y-1">
                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#1A4258] to-[#233053] text-[#B4F4FF] border border-[#2B6B85] font-semibold text-xs text-left"
                >
                  <span className="w-2 h-2 rounded-full bg-[#00D4FF] shadow-[0_0_8px_#00D4FF]" />
                  <span>Command Center</span>
                </button>
                <button
                  type="button"
                  onClick={onGoToLogin}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 text-[#ADBDD5] hover:text-white text-xs text-left transition-colors"
                >
                  <span>✧</span>
                  <span>Inteligência</span>
                </button>
                <button
                  type="button"
                  onClick={onGoToLogin}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 text-[#ADBDD5] hover:text-white text-xs text-left transition-colors"
                >
                  <span>▦</span>
                  <span>CRM &amp; BI</span>
                </button>
                <button
                  type="button"
                  onClick={onGoToLogin}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 text-[#ADBDD5] hover:text-white text-xs text-left transition-colors"
                >
                  <span>◎</span>
                  <span>Prospecção</span>
                </button>
                <button
                  type="button"
                  onClick={onGoToLogin}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 text-[#ADBDD5] hover:text-white text-xs text-left transition-colors"
                >
                  <span>⌘</span>
                  <span>Automações</span>
                </button>
                <button
                  type="button"
                  onClick={onGoToLogin}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 text-[#ADBDD5] hover:text-white text-xs text-left transition-colors"
                >
                  <span>◈</span>
                  <span>VoiceHub</span>
                </button>
              </div>

              <small className="text-[10px] font-mono font-extrabold uppercase tracking-[0.16em] text-[#8294AE] block pt-4">
                CONTROLE
              </small>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={onGoToLogin}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 text-[#ADBDD5] hover:text-white text-xs text-left transition-colors"
                >
                  <span>◉</span>
                  <span>Governança &amp; LGPD</span>
                </button>
                <button
                  type="button"
                  onClick={onGoToLogin}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 text-[#ADBDD5] hover:text-white text-xs text-left transition-colors"
                >
                  <span>⥈</span>
                  <span>Integrações Multi-CRM</span>
                </button>
              </div>
            </aside>

            {/* Painel Principal do Command Center */}
            <main className="lg:col-span-9 space-y-6 min-w-0">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-mono font-extrabold uppercase tracking-[0.2em] text-[#0284c7] dark:text-[#78E1F7]">
                    SEU CENTRO DE OPERAÇÕES
                  </span>
                  <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#2A5B8F] dark:text-[#BEE6FF] mt-1">
                    Command Center
                  </h1>
                  <p className="text-xs sm:text-sm text-[#7888A0] dark:text-[#A8BEDB]">
                    Agentes, operações e inteligência em uma única experiência.
                  </p>
                </div>

                <AuroraButton size="small" onClick={onGoToLogin}>
                  <span>+ Nova missão</span>
                </AuroraButton>
              </div>

              {/* Banner do Supervisor On-line (Referência HTML) */}
              <section className="aurora-supervisor">
                <div className="relative z-10 max-w-xl space-y-2">
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-[0.2em] text-[#78E1F7]">
                    SUPERVISOR ON-LINE
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#BEE6FF]">
                    O que vamos conquistar hoje?
                  </h2>
                  <p className="text-xs sm:text-sm text-[#A8BEDB] pb-3">
                    Descreva seu objetivo. Eu coordeno os agentes e reúno os resultados em um só
                    lugar.
                  </p>
                  <AuroraButton size="small" onClick={onGoToLogin}>
                    <span>Iniciar missão →</span>
                  </AuroraButton>
                </div>
              </section>

              {/* 3 Métricas Ilustrativas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border border-[#E0E9F4] dark:border-white/10 bg-white dark:bg-[#0D1524] shadow-xs">
                  <small className="text-xs text-[#8292AA] dark:text-slate-400 font-medium">
                    Missões concluídas
                  </small>
                  <strong className="block text-3xl font-extrabold text-[#37689D] dark:text-[#8EE4EF] my-1 font-display">
                    128
                  </strong>
                  <span className="text-[11px] text-[#289D8D] font-mono">● Telemetria ao vivo</span>
                </div>

                <div className="p-5 rounded-2xl border border-[#E0E9F4] dark:border-white/10 bg-white dark:bg-[#0D1524] shadow-xs">
                  <small className="text-xs text-[#8292AA] dark:text-slate-400 font-medium">
                    Agentes acionados
                  </small>
                  <strong className="block text-3xl font-extrabold text-[#ED3197] my-1 font-display">
                    19
                  </strong>
                  <span className="text-[11px] text-[#289D8D] font-mono">● Enxame autônomo</span>
                </div>

                <div className="p-5 rounded-2xl border border-[#E0E9F4] dark:border-white/10 bg-white dark:bg-[#0D1524] shadow-xs">
                  <small className="text-xs text-[#8292AA] dark:text-slate-400 font-medium">
                    Oportunidades em Deal
                  </small>
                  <strong className="block text-3xl font-extrabold text-[#D97706] dark:text-[#FFC107] my-1 font-display">
                    86
                  </strong>
                  <span className="text-[11px] text-[#289D8D] font-mono">● Pipeline 360°</span>
                </div>
              </div>

              {/* Grid dos 8 Módulos Funcionais */}
              <div className="space-y-4 pt-2">
                <div>
                  <span className="text-[11px] font-mono font-extrabold uppercase tracking-[0.2em] text-[#0284c7] dark:text-[#78E1F7]">
                    EXPLORE A PLATAFORMA
                  </span>
                  <h2 className="font-display text-2xl font-extrabold text-[#245978] dark:text-[#BFEFFF] mt-1">
                    Seus oito pilares operacionais
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {[
                    {
                      label: 'Inteligência',
                      desc: 'Insights e decisões',
                      ico: '✧',
                      color: '#0C9DC6',
                      bg: '#E6F9FF',
                    },
                    {
                      label: 'CRM & BI',
                      desc: 'Pipeline e dados',
                      ico: '▦',
                      color: '#B650BB',
                      bg: '#F9E9FC',
                    },
                    {
                      label: 'Prospecção',
                      desc: 'Descobrir contas ICP',
                      ico: '◎',
                      color: '#C4931D',
                      bg: '#FFF3D5',
                    },
                    {
                      label: 'Automações',
                      desc: 'Fluxos inteligentes',
                      ico: '⌘',
                      color: '#796BDE',
                      bg: '#EAE8FF',
                    },
                    {
                      label: 'Gamificação',
                      desc: 'Evolução e metas',
                      ico: '✦',
                      color: '#0C9DC6',
                      bg: '#E6F9FF',
                    },
                    {
                      label: 'Roleplay',
                      desc: 'Simulações de vendas',
                      ico: '◇',
                      color: '#B650BB',
                      bg: '#F9E9FC',
                    },
                    {
                      label: 'Social Selling',
                      desc: 'Presença e conexão',
                      ico: '✺',
                      color: '#C4931D',
                      bg: '#FFF3D5',
                    },
                    {
                      label: 'VoiceHub',
                      desc: 'Conversas inteligentes',
                      ico: '◈',
                      color: '#796BDE',
                      bg: '#EAE8FF',
                    },
                  ].map((mod) => (
                    <button
                      key={mod.label}
                      type="button"
                      onClick={onGoToLogin}
                      className="p-4 rounded-2xl border border-[#E7EEFA] dark:border-white/10 bg-gradient-to-br from-white to-[#F3F8FF] dark:from-[#111928] dark:to-[#0C121E] shadow-xs hover:-translate-y-1 hover:shadow-md transition-all text-left space-y-2 cursor-pointer"
                    >
                      <span
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
                        style={{ backgroundColor: mod.bg, color: mod.color }}
                      >
                        {mod.ico}
                      </span>
                      <div>
                        <b className="block text-xs sm:text-sm font-bold text-[#2E5E89] dark:text-white">
                          {mod.label}
                        </b>
                        <span className="text-[11px] text-[#8794A7] leading-tight block">
                          {mod.desc}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      )}

      {/* ── FOOTER INSTITUCIONAL ── */}
      <footer className="w-full py-8 px-4 sm:px-8 border-t border-[#DFE9F2] dark:border-white/10 bg-white/60 dark:bg-[#06080C]/90 text-xs text-[#8190A7] mt-16">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
          <span>Birthub 360° — Aurora Motion &amp; Command Center</span>
          <span>Design original inspirado em efeitos de luz celestiais</span>
        </div>
      </footer>
    </div>
  );
}
