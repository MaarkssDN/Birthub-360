import {
  ArrowRight,
  BarChart3,
  Bot,
  Briefcase,
  Calculator,
  CheckCircle2,
  Cpu,
  Database,
  Layers,
  type LucideIcon,
  Network,
  PhoneCall,
  Search,
  Settings,
  Share2,
  Smartphone,
  Sparkles,
  TrendingUp,
  Workflow,
} from 'lucide-react';
import type React from 'react';

export type PillarThemeColor = 'cyan' | 'pink' | 'gold' | 'iris';
export type PillarId = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11';
export type PillarAvailability = 'Operacional' | 'Disponível no CRM' | 'Conector API Ativo';

export interface PillarCapability {
  title: string;
  desc: string;
}

export interface PillarBenefit {
  value: string;
  label: string;
  trend?: string;
  context?: string;
}

export interface PillarData {
  id: PillarId;
  num: string;
  badge: string;
  title: string;
  modalTitle: string;
  tagline: string;
  commercialDescription: string;
  detailedDesc: string;
  themeColor: PillarThemeColor;
  icon: LucideIcon;
  route: string;
  ctaText: string;
  availability: PillarAvailability;
  capabilities: PillarCapability[];
  metrics: PillarBenefit[];
  renderVisualizer: (theme?: 'dark' | 'light') => React.ReactNode;
}

// ============================================================================
// 1. COMPONENTES DE VISUALIZAÇÃO CONTEXTUAL (SIMULAÇÃO OPERACIONAL BASEADA EM DADOS)
// ============================================================================

/** 01 — Hub Comercial: pipeline, contas, oportunidades, atividades e contexto comercial unificado */
export function VisualizerHubComercial({ theme = 'dark' }: { theme?: 'dark' | 'light' } = {}) {
  const isDark = theme === 'dark';
  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 font-mono text-xs shadow-inner transition-colors ${
        isDark
          ? 'border-sky-500/30 bg-slate-900/80 text-slate-300'
          : 'border-sky-300 bg-sky-50/50 text-slate-700'
      }`}
    >
      <div
        className={`flex items-center justify-between border-b pb-2.5 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <span
          className={`flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] ${
            isDark ? 'text-sky-400' : 'text-sky-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Pipeline Ativo • R$ 1.040.000
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isDark
              ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
              : 'bg-sky-100 text-sky-800 border-sky-300'
          }`}
        >
          3 Negócios em Foco
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Coluna 1: Qualificação */}
        <div
          className={`rounded-xl p-2.5 border space-y-1.5 ${
            isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-center text-[10px]">
            <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              QUALIFICAÇÃO
            </span>
            <span className={`font-bold ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>R$ 180k</span>
          </div>
          <div
            className={`p-2 rounded-lg border ${
              isDark ? 'bg-slate-900/90 border-slate-700/60' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <p
              className={`text-[11px] font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-900'}`}
            >
              Indústria Alfa S/A
            </p>
            <p className={`text-[9px] font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Score ICP: 94 • 2 decisores
            </p>
            <span
              className={`mt-1 inline-block text-[8px] px-1.5 py-0.5 rounded ${
                isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
              }`}
            >
              Próx: Mapear Diretor
            </span>
          </div>
        </div>

        {/* Coluna 2: Proposta */}
        <div
          className={`rounded-xl p-2.5 border space-y-1.5 ${
            isDark
              ? 'bg-slate-950/90 border-sky-500/40 shadow-[0_0_12px_rgba(0,212,255,0.12)]'
              : 'bg-white border-sky-300 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-center text-[10px]">
            <span className={`font-semibold ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>
              PROPOSTA
            </span>
            <span className={`font-bold ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>R$ 340k</span>
          </div>
          <div
            className={`p-2 rounded-lg border ${
              isDark ? 'bg-slate-900/90 border-sky-500/50' : 'bg-sky-50/70 border-sky-200'
            }`}
          >
            <p
              className={`text-[11px] font-semibold truncate ${isDark ? 'text-sky-200' : 'text-sky-900'}`}
            >
              Varejo Global Ltda
            </p>
            <p
              className={`text-[9px] font-semibold font-sans ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}
            >
              Próx: Reunião Diretoria
            </p>
            <span
              className={`mt-1 inline-block text-[8px] px-1.5 py-0.5 rounded border ${
                isDark
                  ? 'bg-sky-950/80 text-sky-300 border-sky-500/30'
                  : 'bg-sky-100 text-sky-800 border-sky-300'
              }`}
            >
              Proposta V2 Enviada
            </span>
          </div>
        </div>

        {/* Coluna 3: Fechamento */}
        <div
          className={`rounded-xl p-2.5 border space-y-1.5 ${
            isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-center text-[10px]">
            <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              FECHAMENTO
            </span>
            <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              R$ 520k
            </span>
          </div>
          <div
            className={`p-2 rounded-lg border ${
              isDark
                ? 'bg-slate-900/90 border-emerald-500/40'
                : 'bg-emerald-50/70 border-emerald-200'
            }`}
          >
            <p
              className={`text-[11px] font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-900'}`}
            >
              FinTech Horizons
            </p>
            <p
              className={`text-[9px] font-semibold font-sans ${isDark ? 'text-amber-400' : 'text-amber-600'}`}
            >
              Minuta Jurídica (90%)
            </p>
            <span
              className={`mt-1 inline-block text-[8px] px-1.5 py-0.5 rounded border ${
                isDark
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}
            >
              Aguardando Assinatura
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 02 — Inteligência de Mercado: enriquecimento de dados B2B, ICP, sinais de compra, decisores e priorização */
export function VisualizerMercado({ theme = 'dark' }: { theme?: 'dark' | 'light' } = {}) {
  const isDark = theme === 'dark';
  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 font-mono text-xs shadow-inner transition-colors ${
        isDark
          ? 'border-pink-500/30 bg-slate-900/80 text-slate-300'
          : 'border-pink-300 bg-pink-50/40 text-slate-700'
      }`}
    >
      <div
        className={`flex items-center justify-between border-b pb-2.5 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <span
          className={`flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] ${
            isDark ? 'text-pink-400' : 'text-pink-700'
          }`}
        >
          <Database className="w-3.5 h-3.5" /> Enriquecimento CNPJ • Receita & QSA
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isDark
              ? 'bg-pink-500/10 text-pink-400 border-pink-500/30'
              : 'bg-pink-100 text-pink-800 border-pink-300'
          }`}
        >
          ICP Score: 96/100
        </span>
      </div>

      <div
        className={`rounded-xl p-3 border space-y-2.5 ${
          isDark ? 'bg-slate-950/90 border-pink-500/30' : 'bg-white border-pink-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div>
            <h4
              className={`text-sm font-bold font-sans tracking-tight ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              TechLog Logística Integrada S/A
            </h4>
            <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              CNPJ: 14.288.901/0001-44 • Matriz São Paulo/SP
            </span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold w-fit ${
              isDark
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
          >
            Receita Presumida: R$ 50M a R$ 100M
          </span>
        </div>

        <div
          className={`grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t text-[11px] ${
            isDark ? 'border-slate-800/80' : 'border-slate-200'
          }`}
        >
          <div>
            <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              CNAE Principal
            </span>
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              4930-2 (Cargas)
            </span>
          </div>
          <div>
            <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Decisor no QSA
            </span>
            <span className={`font-semibold ${isDark ? 'text-pink-300' : 'text-pink-700'}`}>
              Diretor Comercial
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Canal Corporativo
            </span>
            <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              E-mail Validado ✓
            </span>
          </div>
        </div>

        <div
          className={`p-2 rounded border text-[10px] font-sans ${
            isDark
              ? 'bg-pink-950/30 border-pink-500/20 text-pink-200'
              : 'bg-pink-50 border-pink-200 text-pink-900'
          }`}
        >
          <strong>Sinal de Compra:</strong> Contratação ativa de 8 executivos de vendas + Expansão
          recente de filiais no Sul.
        </div>
      </div>
    </div>
  );
}

/** 03 — Orquestração de Vendas: cadências, passagem de bastão SDR → Closer, SLAs e próxima melhor ação */
export function VisualizerOrquestracao({ theme = 'dark' }: { theme?: 'dark' | 'light' } = {}) {
  const isDark = theme === 'dark';
  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 font-mono text-xs shadow-inner transition-colors ${
        isDark
          ? 'border-amber-500/30 bg-slate-900/80 text-slate-300'
          : 'border-amber-300 bg-amber-50/40 text-slate-700'
      }`}
    >
      <div
        className={`flex items-center justify-between border-b pb-2.5 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <span
          className={`flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] ${
            isDark ? 'text-amber-400' : 'text-amber-700'
          }`}
        >
          <Workflow className="w-3.5 h-3.5" /> Cadência Executiva • Passo 3 de 5
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isDark
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-amber-100 text-amber-800 border-amber-300'
          }`}
        >
          SLA Restante: 25 min
        </span>
      </div>

      <div className="space-y-2">
        <div
          className={`flex items-center gap-3 p-2 rounded-xl border opacity-75 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
              isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            ✓
          </span>
          <div className="flex-1">
            <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
              D+0 • E-mail de Apresentação de Valor
            </span>
            <span
              className={`text-[10px] block font-sans ${isDark ? 'text-slate-500' : 'text-slate-500'}`}
            >
              Entregue • Aberto 2x pelo lead
            </span>
          </div>
        </div>

        <div
          className={`flex items-center gap-3 p-2.5 rounded-xl border ${
            isDark
              ? 'bg-slate-950/90 border-amber-500/50 shadow-[0_0_12px_rgba(255,193,7,0.12)]'
              : 'bg-white border-amber-300 shadow-sm'
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse ${
              isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
            }`}
          >
            3
          </span>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                D+2 • Ligação VoiceHub + Follow-up WhatsApp
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                  isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                }`}
              >
                NEXT BEST ACTION
              </span>
            </div>
            <span
              className={`text-[10px] block font-sans mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
            >
              Roteiro tático: validar dor de controle do Diretor de Operações e propor passagem para
              Closer.
            </span>
          </div>
        </div>

        <div
          className={`flex items-center gap-3 p-2 rounded-xl border text-[10px] ${
            isDark
              ? 'bg-slate-950/80 border-slate-800 text-slate-400'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
              isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
            }`}
          >
            4
          </span>
          <div className="flex-1">
            <span>D+4 • Passagem de Bastão (Handover SDR → Closer com Checklist BANT)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 04 — Performance Comercial: metas, produtividade, conversão e velocidade do funil */
export function VisualizerPerformance({ theme = 'dark' }: { theme?: 'dark' | 'light' } = {}) {
  const isDark = theme === 'dark';
  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 font-mono text-xs shadow-inner transition-colors ${
        isDark
          ? 'border-violet-500/30 bg-slate-900/80 text-slate-300'
          : 'border-violet-300 bg-violet-50/40 text-slate-700'
      }`}
    >
      <div
        className={`flex items-center justify-between border-b pb-2.5 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <span
          className={`flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] ${
            isDark ? 'text-violet-400' : 'text-violet-700'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> Telemetria de Conversão do Funil
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isDark
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}
        >
          Meta do Mês: 87% Atingida
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div
          className={`p-2.5 rounded-xl border ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span
            className={`text-[10px] block font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
          >
            ENTRADA
          </span>
          <span className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            1.240
          </span>
          <span className={`text-[9px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            leads no mês
          </span>
        </div>
        <div
          className={`p-2.5 rounded-xl border ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span
            className={`text-[10px] block font-semibold ${isDark ? 'text-violet-400' : 'text-violet-700'}`}
          >
            QUALIF.
          </span>
          <span className={`text-sm font-bold ${isDark ? 'text-violet-300' : 'text-violet-800'}`}>
            410
          </span>
          <span className={`text-[9px] block ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            33.1% conv.
          </span>
        </div>
        <div
          className={`p-2.5 rounded-xl border ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span
            className={`text-[10px] block font-semibold ${isDark ? 'text-sky-400' : 'text-sky-700'}`}
          >
            PROPOSTA
          </span>
          <span className={`text-sm font-bold ${isDark ? 'text-sky-300' : 'text-sky-800'}`}>
            185
          </span>
          <span className={`text-[9px] block ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            45.1% conv.
          </span>
        </div>
        <div
          className={`p-2.5 rounded-xl border ${
            isDark
              ? 'bg-slate-950/80 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.12)]'
              : 'bg-white border-emerald-300 shadow-sm'
          }`}
        >
          <span
            className={`text-[10px] block font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}
          >
            GANHOS
          </span>
          <span className={`text-sm font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
            78
          </span>
          <span className={`text-[9px] block ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            42.2% conv.
          </span>
        </div>
      </div>

      <div
        className={`p-2 rounded-lg border flex items-center justify-between text-[10px] ${
          isDark
            ? 'bg-slate-950/60 border-slate-800/80 text-slate-400'
            : 'bg-white border-slate-200 text-slate-600 shadow-sm'
        }`}
      >
        <span>
          Velocidade Média do Ciclo:{' '}
          <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>18 dias</strong>
        </span>
        <span>
          Produtividade:{' '}
          <strong className={isDark ? 'text-violet-300' : 'text-violet-700'}>
            14 calls + 3 demos/dia por rep
          </strong>
        </span>
      </div>
    </div>
  );
}

/** 05 — Previsibilidade Comercial: representação de cenários, projeção de receita e pipeline ponderado */
export function VisualizerPrevisibilidade({ theme = 'dark' }: { theme?: 'dark' | 'light' } = {}) {
  const isDark = theme === 'dark';
  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 font-mono text-xs shadow-inner transition-colors ${
        isDark
          ? 'border-sky-500/30 bg-slate-900/80 text-slate-300'
          : 'border-sky-300 bg-sky-50/40 text-slate-700'
      }`}
    >
      <div
        className={`flex items-center justify-between border-b pb-2.5 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <span
          className={`flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] ${
            isDark ? 'text-sky-400' : 'text-sky-700'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Modelagem Estatística • Forecast Mensal
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isDark
              ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
              : 'bg-sky-100 text-sky-800 border-sky-300'
          }`}
        >
          94% Confiança
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div
          className={`p-2.5 rounded-xl border text-center ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span
            className={`text-[10px] block font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
          >
            CONSERVADOR
          </span>
          <span className={`text-base font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            R$ 1.180.000
          </span>
          <span className={`text-[9px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            95% probabilidade
          </span>
        </div>
        <div
          className={`p-2.5 rounded-xl border text-center ${
            isDark
              ? 'bg-slate-950/90 border-sky-500/50 shadow-[0_0_12px_rgba(0,212,255,0.15)]'
              : 'bg-white border-sky-300 shadow-sm'
          }`}
        >
          <span
            className={`text-[10px] font-bold block ${isDark ? 'text-sky-300' : 'text-sky-700'}`}
          >
            CENÁRIO PROVÁVEL
          </span>
          <span className={`text-base font-bold ${isDark ? 'text-sky-300' : 'text-sky-800'}`}>
            R$ 1.450.000
          </span>
          <span
            className={`text-[9px] block font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}
          >
            meta orçamentária
          </span>
        </div>
        <div
          className={`p-2.5 rounded-xl border text-center ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span
            className={`text-[10px] block font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
          >
            OTIMISTA
          </span>
          <span className={`text-base font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            R$ 1.720.000
          </span>
          <span className={`text-[9px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            upside mapeado
          </span>
        </div>
      </div>

      <div
        className={`p-2 rounded-lg border text-[10px] font-sans flex items-center justify-between ${
          isDark
            ? 'bg-sky-950/30 border-sky-500/20 text-sky-300'
            : 'bg-white border-slate-200 text-sky-800 shadow-sm'
        }`}
      >
        <span>
          Pipeline Ponderado Total: <strong>R$ 2.450.000</strong>
        </span>
        <span>
          Taxa de Slippage Prevista: <strong>6.2%</strong>
        </span>
      </div>
    </div>
  );
}

/** 06 — Inteligência Artificial: diagnóstico contextual, análise de entraves e recomendações fundamentadas */
export function VisualizerIaCopilot({ theme = 'dark' }: { theme?: 'dark' | 'light' } = {}) {
  const isDark = theme === 'dark';
  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 font-mono text-xs shadow-inner transition-colors ${
        isDark
          ? 'border-pink-500/30 bg-slate-900/80 text-slate-300'
          : 'border-pink-300 bg-pink-50/40 text-slate-700'
      }`}
    >
      <div
        className={`flex items-center justify-between border-b pb-2.5 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <span
          className={`flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] ${
            isDark ? 'text-pink-400' : 'text-pink-700'
          }`}
        >
          <Bot className="w-3.5 h-3.5" /> Copiloto IA • Recomendação Tática em Tempo Real
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            isDark
              ? 'bg-pink-500/15 text-pink-300 border-pink-500/30'
              : 'bg-pink-100 text-pink-800 border-pink-300'
          }`}
        >
          Confidence: 91%
        </span>
      </div>

      <div
        className={`rounded-xl p-3 border space-y-2 ${
          isDark ? 'bg-slate-950/90 border-pink-500/40' : 'bg-white border-pink-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2">
          <Sparkles className={`w-4 h-4 shrink-0 ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />
          <span className={`text-[11px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            Objeção Detectada: &quot;Orçamento congelado até o próximo trimestre&quot;
          </span>
        </div>
        <p
          className={`text-[11px] font-sans leading-relaxed pl-6 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
        >
          <strong>Recomendação Tática:</strong> Propor ativação em 2 etapas (Setup técnico no mês
          corrente com início de faturamento no próximo ciclo fiscal). No histórico da sua conta,
          esse modelo converteu <strong>78%</strong> das objeções semelhantes.
        </p>
      </div>

      <div
        className={`flex items-center justify-between text-[10px] px-1 font-sans ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}
      >
        <span>Análise baseada em 142 negociações com perfil similar</span>
        <span className={`font-semibold font-mono ${isDark ? 'text-pink-300' : 'text-pink-700'}`}>
          Status: Ação Pronta para Envio
        </span>
      </div>
    </div>
  );
}

/** 07 — Automação e Conectividade: fluxos, gatilhos, APIs, webhooks comprovadamente implementados */
export function VisualizerAutomacao({ theme = 'dark' }: { theme?: 'dark' | 'light' } = {}) {
  const isDark = theme === 'dark';
  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 font-mono text-xs shadow-inner transition-colors ${
        isDark
          ? 'border-amber-500/30 bg-slate-900/80 text-slate-300'
          : 'border-amber-300 bg-amber-50/40 text-slate-700'
      }`}
    >
      <div
        className={`flex items-center justify-between border-b pb-2.5 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <span
          className={`flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] ${
            isDark ? 'text-amber-400' : 'text-amber-700'
          }`}
        >
          <Network className="w-3.5 h-3.5" /> Gateway de APIs & Webhooks • Telemetria Ativa
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isDark
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}
        >
          99.98% SLA
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div
          className={`p-2.5 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div>
            <span className={`font-semibold block ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              API Bitrix24
            </span>
            <span
              className={`text-[10px] font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
            >
              Via REST / Webhook
            </span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
        </div>

        <div
          className={`p-2.5 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div>
            <span className={`font-semibold block ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              Webhooks REST
            </span>
            <span
              className={`text-[10px] font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
            >
              Retry Exponencial
            </span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
        </div>

        <div
          className={`p-2.5 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div>
            <span className={`font-semibold block ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              Event Bus
            </span>
            <span
              className={`text-[10px] font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
            >
              Latência: 120ms
            </span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
        </div>
      </div>

      <div
        className={`p-2 rounded border text-[10px] font-sans ${
          isDark
            ? 'bg-amber-950/30 border-amber-500/20 text-amber-200'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}
      >
        <strong>Conectores Reais:</strong> Integração via API REST aberta, fila idempotente e
        webhooks seguros autenticados com chave HMAC.
      </div>
    </div>
  );
}

/** 08 — Engajamento Comercial: histórico multicanal, interações, telefonia e rastreabilidade */
export function VisualizerEngajamento({ theme = 'dark' }: { theme?: 'dark' | 'light' } = {}) {
  const isDark = theme === 'dark';
  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 font-mono text-xs shadow-inner transition-colors ${
        isDark
          ? 'border-violet-500/30 bg-slate-900/80 text-slate-300'
          : 'border-violet-300 bg-violet-50/40 text-slate-700'
      }`}
    >
      <div
        className={`flex items-center justify-between border-b pb-2.5 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <span
          className={`flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] ${
            isDark ? 'text-violet-400' : 'text-violet-700'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" /> VoiceHub • Chamada Gravada & Transcrita
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isDark
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}
        >
          Sentimento: Positivo (88%)
        </span>
      </div>

      <div
        className={`rounded-xl p-3 border space-y-2 ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between text-[11px]">
          <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            Ligação: Diretor de Tecnologia
          </span>
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            Duração: 04:18 • WebRTC
          </span>
        </div>
        <div
          className={`p-2 rounded-lg border font-sans text-[11px] leading-relaxed ${
            isDark
              ? 'bg-slate-900/90 border-slate-700/60 text-slate-300'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          &quot;Perfeito. Gostei da integração nativa com o nosso CRM e da segurança com LGPD.
          Podemos agendar a demonstração técnica para quinta-feira às 14h.&quot;
        </div>
        <div
          className={`flex items-center justify-between text-[10px] pt-1 font-sans ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          <span>Ação automática: Reunião criada na agenda</span>
          <span
            className={`font-semibold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}
          >
            Deal atualizado no CRM ✓
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. REGISTRO TIPADO DOS 8 PILARES COMERCIAIS (PILLAR_REGISTRY)
// ============================================================================

/** 09 — Admin & Operations: governança, papéis, acesso por módulo e telemetria da plataforma */
export function VisualizerAdminOps({ theme = 'dark' }: { theme?: 'dark' | 'light' } = {}) {
  const isDark = theme === 'dark';
  const rows = [
    { label: 'Settings Globais', meta: 'Organização · 14 políticas', ok: true },
    { label: 'Equipe & Papéis', meta: 'RBAC · 6 perfis ativos', ok: true },
    { label: 'Module Access', meta: '11 módulos concedidos', ok: true },
    { label: 'Feature Flags', meta: '3 flags em rollout', ok: false },
  ];
  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 font-mono text-xs shadow-inner transition-colors ${
        isDark
          ? 'border-cyan-500/30 bg-slate-900/80 text-slate-300'
          : 'border-cyan-300 bg-cyan-50/40 text-slate-700'
      }`}
    >
      <div
        className={`flex items-center justify-between border-b pb-2.5 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <span
          className={`flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] ${
            isDark ? 'text-cyan-400' : 'text-cyan-700'
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> Governança · Admin & Operations
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isDark
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
              : 'bg-cyan-100 text-cyan-800 border-cyan-300'
          }`}
        >
          RBAC Ativo
        </span>
      </div>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div
            key={r.label}
            className={`flex items-center justify-between p-2 rounded-lg border text-[11px] ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {r.label}
            </span>
            <span className="flex items-center gap-2">
              <span
                className={`text-[9px] font-sans ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
              >
                {r.meta}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  r.ok ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                }`}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 10 — Mobile & Field Sales: FieldMeetingRecorder, offline sync e IA edge */
export function VisualizerFieldSales({ theme = 'dark' }: { theme?: 'dark' | 'light' } = {}) {
  const isDark = theme === 'dark';
  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 font-mono text-xs shadow-inner transition-colors ${
        isDark
          ? 'border-pink-500/30 bg-slate-900/80 text-slate-300'
          : 'border-pink-300 bg-pink-50/40 text-slate-700'
      }`}
    >
      <div
        className={`flex items-center justify-between border-b pb-2.5 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <span
          className={`flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] ${
            isDark ? 'text-pink-400' : 'text-pink-700'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" /> FieldMeetingRecorder · Android
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isDark
              ? 'bg-pink-500/10 text-pink-400 border-pink-500/30'
              : 'bg-pink-100 text-pink-800 border-pink-300'
          }`}
        >
          Offline Sync
        </span>
      </div>
      <div
        className={`rounded-xl p-3 border space-y-2.5 ${
          isDark ? 'bg-slate-950/90 border-pink-500/30' : 'bg-white border-pink-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}
          >
            Visita técnica — Cliente Aurora
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
              isDark ? 'bg-rose-500/15 text-rose-300' : 'bg-rose-100 text-rose-700'
            }`}
          >
            ● REC 12:04
          </span>
        </div>
        <div className="flex items-center gap-1 h-8">
          {[10, 18, 26, 14, 22, 30, 16, 24, 12, 20, 28, 15].map((h, i) => (
            <i key={i} className="flex-1 rounded-sm bg-pink-400/70" style={{ height: `${h}px` }} />
          ))}
        </div>
        <div className="flex items-center justify-between text-[9px] font-sans">
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            IA edge transcrevendo localmente
          </span>
          <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>
            Sync pendente: 3 registros
          </span>
        </div>
      </div>
    </div>
  );
}

/** 11 — Social Selling: geração de abordagem por canal com copywriting assistido por IA */
export function VisualizerSocialSelling({ theme = 'dark' }: { theme?: 'dark' | 'light' } = {}) {
  const isDark = theme === 'dark';
  const channels = ['LinkedIn', 'WhatsApp', 'E-mail'];
  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 font-mono text-xs shadow-inner transition-colors ${
        isDark
          ? 'border-amber-500/30 bg-slate-900/80 text-slate-300'
          : 'border-amber-300 bg-amber-50/40 text-slate-700'
      }`}
    >
      <div
        className={`flex items-center justify-between border-b pb-2.5 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <span
          className={`flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] ${
            isDark ? 'text-amber-400' : 'text-amber-700'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" /> ApproachGenerator · Shadow Copy
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isDark
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-amber-100 text-amber-800 border-amber-300'
          }`}
        >
          Copy por IA
        </span>
      </div>
      <div className="flex gap-1.5">
        {channels.map((c, i) => (
          <span
            key={c}
            className={`px-2 py-1 rounded-lg text-[9px] font-bold border ${
              i === 0
                ? isDark
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
                : isDark
                  ? 'bg-slate-950/80 text-slate-400 border-slate-800'
                  : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            {c}
          </span>
        ))}
      </div>
      <div
        className={`rounded-xl p-3 border space-y-1.5 ${
          isDark ? 'bg-slate-950/90 border-amber-500/25' : 'bg-white border-amber-200 shadow-sm'
        }`}
      >
        <p
          className={`text-[10px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
        >
          “Olá {'{nome}'}, vi que a {'{empresa}'} expandiu a operação comercial no Sul — exatamente
          o cenário em que ajudamos empresas como a sua a estruturar cadências multicanal em 30
          dias…”
        </p>
        <div className="flex items-center justify-between text-[9px] font-sans">
          <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>
            Tom: consultivo · Personalização: conta + decisor
          </span>
          <span className={isDark ? 'text-amber-400' : 'text-amber-700'}>Aprovar →</span>
        </div>
      </div>
    </div>
  );
}

export const PILLARS_EDITORIAL_DATA: Record<string, PillarData> = {
  '01': {
    id: '01',
    num: '01',
    badge: 'PIPELINE 360° & CONTAS UNIFICADAS',
    title: 'Hub Comercial',
    modalTitle: '01. Hub Comercial',
    tagline: 'Centralize contas, pipeline e oportunidades em uma visão 360° de cada negociação.',
    commercialDescription:
      'Elimine a fragmentação entre planilhas e sistemas isolados. O Hub Comercial consolida o histórico completo de negociações, decisores envolvidos, estágios de evolução e valores ponderados em uma esteira única e transparente.',
    detailedDesc:
      'Elimine a fragmentação entre planilhas e sistemas isolados. O Hub Comercial consolida o histórico completo de negociações, decisores envolvidos, estágios de evolução e valores ponderados em uma esteira única e transparente.',
    themeColor: 'cyan',
    icon: Layers,
    route: '/app/crm',
    ctaText: 'Acessar Pipeline no CRM',
    availability: 'Disponível no CRM',
    capabilities: [
      {
        title: 'Kanban & Grid Multidimensional',
        desc: 'Visualização dinâmica de deals por valor, probabilidade de fechamento e urgência de ação.',
      },
      {
        title: 'Visão 360° de Contas & Decisores',
        desc: 'Mapeamento de organogramas, múltiplos contatos e histórico de interações por empresa.',
      },
      {
        title: 'Timeline Auditável de Negociação',
        desc: 'Registro cronológico inviolável de atividades, notas, propostas enviadas e status de aceite.',
      },
      {
        title: 'Governança & RLS Multi-Tenant',
        desc: 'Isolamento estrito de dados por organização e controle granular de papéis operacionais (RBAC).',
      },
    ],
    metrics: [
      {
        value: '+42%',
        label: 'Velocidade de Negociação',
        trend: 'Ciclo médio reduzido',
        context: 'Simulação',
      },
      {
        value: 'Zero',
        label: 'Deals Esquecidos',
        trend: 'Rastreabilidade total',
        context: 'Simulação',
      },
      {
        value: '< 3 cliques',
        label: 'Auditoria de Contas',
        trend: 'Navegação instantânea',
        context: 'Simulação',
      },
    ],
    renderVisualizer: (theme) => <VisualizerHubComercial theme={theme} />,
  },

  '02': {
    id: '02',
    num: '02',
    badge: 'PROSPECÇÃO B2B & SINAIS DE COMPRA',
    title: 'Inteligência de Mercado',
    modalTitle: '02. Inteligência de Mercado',
    tagline:
      'Enriqueça dados B2B, identifique sinais de compra e qualifique decisores com precisão.',
    commercialDescription:
      'Mapeie e qualifique o mercado endereçável (TAM) com precisão cirúrgica. Identifique empresas ativas no Brasil por CNAE, receita presumida, quadro societário (QSA) e descubra o contato corporativo direto de quem realmente decide.',
    detailedDesc:
      'Mapeie e qualifique o mercado endereçável (TAM) com precisão cirúrgica. Identifique empresas ativas no Brasil por CNAE, receita presumida, quadro societário (QSA) e descubra o contato corporativo direto de quem realmente decide.',
    themeColor: 'pink',
    icon: Database,
    route: '/app/market-intelligence',
    ctaText: 'Explorar Inteligência de Mercado',
    availability: 'Operacional',
    capabilities: [
      {
        title: 'Consulta em Massa de Empresas B2B',
        desc: 'Acesso instantâneo a dados cadastrais, porte, regime tributário e saúde financeira de CNPJs.',
      },
      {
        title: 'Mapa de Sócios & Decisores (QSA)',
        desc: 'Identificação de diretores, sócios-administradores e canais diretos de contato corporativo.',
      },
      {
        title: 'Score Preditivo de ICP',
        desc: 'Algoritmo que classifica a aderência de cada empresa ao Perfil de Cliente Ideal da sua operação.',
      },
      {
        title: 'Conformidade Rigorosa com LGPD',
        desc: 'Tratamento de dados com rastreabilidade, base legal declarada e privacidade por design.',
      },
    ],
    metrics: [
      {
        value: '3x mais',
        label: 'Precisão na Qualificação',
        trend: 'Filtro por ICP',
        context: 'Simulação',
      },
      {
        value: '-70%',
        label: 'Tempo de Pesquisa Cadastral',
        trend: 'Automação CNPJ',
        context: 'Simulação',
      },
      {
        value: '100%',
        label: 'Conformidade LGPD',
        trend: 'Base legal auditada',
        context: 'Simulação',
      },
    ],
    renderVisualizer: (theme) => <VisualizerMercado theme={theme} />,
  },

  '03': {
    id: '03',
    num: '03',
    badge: 'CADÊNCIA MULTICANAL & NEXT BEST ACTION',
    title: 'Orquestração de Vendas',
    modalTitle: '03. Orquestração de Vendas',
    tagline: 'Coordene cadências multicanal, passagem de bastão e a próxima ação de vendas.',
    commercialDescription:
      'Acabe com o improviso nas abordagens. A plataforma orquestra sequências combinadas de e-mail, telefone, WhatsApp e redes profissionais, indicando ao vendedor o passo mais efetivo a cada momento da jornada.',
    detailedDesc:
      'Acabe com o improviso nas abordagens. A plataforma orquestra sequências combinadas de e-mail, telefone, WhatsApp e redes profissionais, indicando ao vendedor o passo mais efetivo a cada momento da jornada.',
    themeColor: 'gold',
    icon: Workflow,
    route: '/app/cadence',
    ctaText: 'Ver Cadências de Vendas',
    availability: 'Operacional',
    capabilities: [
      {
        title: 'Cadências Omnichannel Automatizadas',
        desc: 'Sequenciamento inteligente de toques por múltiplos canais com intervalos calculados.',
      },
      {
        title: 'Next Best Action (NBA) Preditivo',
        desc: 'Sugestão dinâmica da melhor abordagem baseada na resposta e estágio do lead.',
      },
      {
        title: 'Passagem de Bastão SDR → Closer',
        desc: 'Transição estruturada com checklist obrigatório de qualificação e agendamento automático.',
      },
      {
        title: 'Fila Diária Priorizada (Daily Plan)',
        desc: 'Rotina diária organizada por impacto financeiro e risco de esfriamento do contato.',
      },
    ],
    metrics: [
      {
        value: '+65%',
        label: 'Disciplina de Follow-ups',
        trend: 'Régua automatizada',
        context: 'Simulação',
      },
      {
        value: '4 dias',
        label: 'Ciclo de Qualificação',
        trend: 'Transição ágil',
        context: 'Simulação',
      },
      { value: '100%', label: 'Leads no SLA', trend: 'Sem gargalos ocultos', context: 'Simulação' },
    ],
    renderVisualizer: (theme) => <VisualizerOrquestracao theme={theme} />,
  },

  '04': {
    id: '04',
    num: '04',
    badge: 'TELEMETRIA DO FUNIL & VELOCIDADE',
    title: 'Performance Comercial',
    modalTitle: '04. Performance Comercial',
    tagline: 'Acompanhe conversão, velocidade do funil, metas e produtividade da equipe.',
    commercialDescription:
      'Transforme intuição em indicadores matemáticos. Analise a taxa real de passagem entre estágios, meça os dias de permanência em cada fase e acompanhe metas individuais e coletivas em painéis de alta resolução.',
    detailedDesc:
      'Transforme intuição em indicadores matemáticos. Analise a taxa real de passagem entre estágios, meça os dias de permanência em cada fase e acompanhe metas individuais e coletivas em painéis de alta resolução.',
    themeColor: 'iris',
    icon: BarChart3,
    route: '/app/analytics',
    ctaText: 'Abrir Painel de Analytics',
    availability: 'Operacional',
    capabilities: [
      {
        title: 'Métricas de Conversão por Etapa',
        desc: 'Taxas percentuais de conversão detalhadas por origem, vendedor e segmento de mercado.',
      },
      {
        title: 'Velocidade do Ciclo de Venda (Velocity)',
        desc: 'Tempo médio de permanência por estágio com alertas automáticos de deals estagnados.',
      },
      {
        title: 'Gestão Dinâmica de Metas Operacionais',
        desc: 'Acompanhamento de atingimento de metas com projeção de fechamento em tempo real.',
      },
      {
        title: 'Relatórios de Produtividade do Time',
        desc: 'Volume de ligações, reuniões agendadas e propostas emitidas por integrante.',
      },
    ],
    metrics: [
      {
        value: '+28%',
        label: 'Eficiência de Conversão',
        trend: 'Eliminação de atritos',
        context: 'Simulação',
      },
      {
        value: '18 dias',
        label: 'Ciclo Médio de Vendas',
        trend: 'Visibilidade total',
        context: 'Simulação',
      },
      {
        value: 'Tempo Real',
        label: 'Apuração de Metas',
        trend: 'Telemetria contínua',
        context: 'Simulação',
      },
    ],
    renderVisualizer: (theme) => <VisualizerPerformance theme={theme} />,
  },

  '05': {
    id: '05',
    num: '05',
    badge: 'PIPELINE PONDERADO & MODELAGEM ESTATÍSTICA',
    title: 'Previsibilidade Comercial',
    modalTitle: '05. Previsibilidade Comercial',
    tagline: 'Modele probabilidades, pipeline ponderado e cenários baseados no histórico real.',
    commercialDescription:
      'Projeções financeiras confiáveis para tomadas de decisão da diretoria. O motor estatístico do Birth Hub 360 calcula o forecast ponderando taxas históricas de ganho/perda, maturidade do lead e sinais de engajamento.',
    detailedDesc:
      'Projeções financeiras confiáveis para tomadas de decisão da diretoria. O motor estatístico do Birth Hub 360 calcula o forecast ponderando taxas históricas de ganho/perda, maturidade do lead e sinais de engajamento.',
    themeColor: 'cyan',
    icon: TrendingUp,
    route: '/app/forecast',
    ctaText: 'Ver Previsão de Receita',
    availability: 'Operacional',
    capabilities: [
      {
        title: 'Pipeline Ponderado por Probabilidade',
        desc: 'Ponderação estatística por histórico real de conversão em vez de palpites comerciais.',
      },
      {
        title: 'Cenários de Fechamento (Conservador/Provável/Otimista)',
        desc: 'Modelagem de 3 faixas de faturamento para alinhamento orçamentário seguro.',
      },
      {
        title: 'Detecção Precoce de Deal Slippage',
        desc: 'Identificação imediata de negociações que estão postergando a data de fechamento.',
      },
      {
        title: 'Auditoria Retroativa de Win/Loss',
        desc: 'Calibração contínua dos fatores probabilísticos com base nos motivos reais de perda.',
      },
    ],
    metrics: [
      {
        value: '94%',
        label: 'Confiabilidade Estatística',
        trend: 'Modelo calibrado',
        context: 'Simulação',
      },
      {
        value: '45 dias',
        label: 'Antecipação de Desvios',
        trend: 'Correção de rota',
        context: 'Simulação',
      },
      {
        value: '3 Faixas',
        label: 'Cenários Modelados',
        trend: 'Orçamento seguro',
        context: 'Simulação',
      },
    ],
    renderVisualizer: (theme) => <VisualizerPrevisibilidade theme={theme} />,
  },

  '06': {
    id: '06',
    num: '06',
    badge: 'COPILOTO DE IA CONTEXTUAL & DIAGNÓSTICO',
    title: 'Inteligência Artificial',
    modalTitle: '06. Inteligência Artificial',
    tagline: 'Um copiloto conectado aos dados da empresa e ao contexto das negociações.',
    commercialDescription:
      'Uma IA comercial nativa que compreende o contexto único da sua organização. O Copiloto analisa conversas, detecta entraves ocultos, recomenda respostas para objeções difíceis e apoia a preparação para reuniões decisivas.',
    detailedDesc:
      'Uma IA comercial nativa que compreende o contexto único da sua organização. O Copiloto analisa conversas, detecta entraves ocultos, recomenda respostas para objeções difíceis e apoia a preparação para reuniões decisivas.',
    themeColor: 'pink',
    icon: Bot,
    route: '/app/intelligence',
    ctaText: 'Acessar Hub de Inteligência',
    availability: 'Operacional',
    capabilities: [
      {
        title: 'Diagnóstico em Tempo Real de Deals',
        desc: 'Avaliação instantânea do risco de perda e sugestão de argumentos táticos corretivos.',
      },
      {
        title: 'Matriz Inteligente de Objeções',
        desc: 'Banco vivo de respostas para objeções de preço, concorrência e autoridade decisória.',
      },
      {
        title: 'Simulação & Roleplay de Negociação',
        desc: 'Treinamento contínuo de vendedores com IA simulando perfis reais de compradores.',
      },
      {
        title: 'Resumos Automáticos de Interações',
        desc: 'Síntese imediata dos pontos críticos acordados em chamadas e reuniões gravadas.',
      },
    ],
    metrics: [
      {
        value: '2h / dia',
        label: 'Otimização Operacional',
        trend: 'Menos burocracia',
        context: 'Simulação',
      },
      {
        value: '+35%',
        label: 'Superação de Objeções',
        trend: 'Argumentos táticos',
        context: 'Simulação',
      },
      {
        value: '-50%',
        label: 'Rampa de Novos Vendedores',
        trend: 'Treinamento contínuo',
        context: 'Simulação',
      },
    ],
    renderVisualizer: (theme) => <VisualizerIaCopilot theme={theme} />,
  },

  '07': {
    id: '07',
    num: '07',
    badge: 'ECOSSISTEMA DE APIS & CONECTIVIDADE MULTI-CRM',
    title: 'Automação & Conectividade Multi-CRM',
    modalTitle: '07. Automação & Conectividade Multi-CRM',
    tagline: 'Sincronize CRMs, acione gatilhos e integre ferramentas por APIs e webhooks.',
    commercialDescription:
      'Operação comercial sem silos. Conecte o Birth Hub 360 ao Bitrix24, HubSpot, Salesforce, ERPs e ferramentas financeiras através de APIs abertas, garantindo sincronização bidirecional, idempotência e entrega garantida de eventos.',
    detailedDesc:
      'Operação comercial sem silos. Conecte o Birth Hub 360 ao Bitrix24, HubSpot, Salesforce, ERPs e ferramentas financeiras através de APIs abertas, garantindo sincronização bidirecional, idempotência e entrega garantida de eventos.',
    themeColor: 'gold',
    icon: Network,
    route: '/app/automations',
    ctaText: 'Ver Central de Automações',
    availability: 'Conector API Ativo',
    capabilities: [
      {
        title: 'Sincronização Bidirecional em Tempo Real',
        desc: 'Espelhamento automático de leads, empresas, contatos e etapas entre plataformas via API e Webhook.',
      },
      {
        title: 'Webhooks Customizados com Retry Exponencial',
        desc: 'Garantia de integridade e reenvio automático em caso de instabilidade de terceiros.',
      },
      {
        title: 'Gatilhos Automáticos Multi-Sistema',
        desc: 'Disparo de ações imediatas mediante eventos de mudança de status ou aceite de proposta.',
      },
      {
        title: 'Observabilidade & Logs Técnicos Auditáveis',
        desc: 'Painel completo de telemetria de requisições, latência e status de conectores.',
      },
    ],
    metrics: [
      {
        value: '99.98%',
        label: 'Sucesso de Sincronização',
        trend: 'Fila idempotente',
        context: 'Simulação',
      },
      { value: 'Zero', label: 'Perda de Eventos', trend: 'Retry automático', context: 'Simulação' },
      {
        value: '< 120ms',
        label: 'Latência do Event Bus',
        trend: 'Entrega imediata',
        context: 'Simulação',
      },
    ],
    renderVisualizer: (theme) => <VisualizerAutomacao theme={theme} />,
  },

  '08': {
    id: '08',
    num: '08',
    badge: 'TELEFONIA EM NUVEM & VOZ COM IA',
    title: 'Engajamento Comercial',
    modalTitle: '08. Engajamento Comercial',
    tagline: 'Reúna telefonia, interações e histórico de contatos em uma comunicação integrada.',
    commercialDescription:
      'Comunicação direta da tela do CRM sem dispositivos externos. Realize chamadas em nuvem via VoiceHub, obtenha transcrição automática com extração de sentimentos e unifique mensagens oficiais do WhatsApp em uma timeline única.',
    detailedDesc:
      'Comunicação direta da tela do CRM sem dispositivos externos. Realize chamadas em nuvem via VoiceHub, obtenha transcrição automática com extração de sentimentos e unifique mensagens oficiais do WhatsApp em uma timeline única.',
    themeColor: 'iris',
    icon: PhoneCall,
    route: '/app/voice-hub',
    ctaText: 'Conhecer o VoiceHub',
    availability: 'Operacional',
    capabilities: [
      {
        title: 'Discador em Nuvem WebRTC (VoiceHub)',
        desc: 'Ligação com 1 clique direto da plataforma ou aplicativo móvel com discagem inteligente.',
      },
      {
        title: 'Gravação & Transcrição Automática com IA',
        desc: 'Conversão imediata de áudio em texto com identificação de interlocutores e sentimento.',
      },
      {
        title: 'WhatsApp Business API Oficial Integrada',
        desc: 'Troca de mensagens centralizada e atrelada diretamente ao cadastro do lead ou negócio.',
      },
      {
        title: 'Timeline Unificada Omnichannel',
        desc: 'Visão histórica consolidada de todas as chamadas, mensagens e e-mails trocados.',
      },
    ],
    metrics: [
      {
        value: '+50%',
        label: 'Produtividade de Ligações',
        trend: 'Discador com 1 clique',
        context: 'Simulação',
      },
      {
        value: '100%',
        label: 'Auditoria de Interações',
        trend: 'Gravações vinculadas',
        context: 'Simulação',
      },
      {
        value: 'Instantâneo',
        label: 'Resumo com IA',
        trend: 'Transcrição ponta a ponta',
        context: 'Simulação',
      },
    ],
    renderVisualizer: (theme) => <VisualizerEngajamento theme={theme} />,
  },

  '09': {
    id: '09',
    num: '09',
    badge: 'GOVERNANÇA & FUNDAÇÃO OPERACIONAL',
    title: 'Admin & Operations',
    modalTitle: '09. Admin & Operations',
    tagline:
      'Camada de administração da plataforma: settings, equipe, acesso por módulo e telemetria.',
    commercialDescription:
      'A fundação operacional que sustenta todos os módulos comerciais: configurações globais, gestão de equipe e papéis, controle de acesso granular por módulo, feature flags e observabilidade de consumo. Não é um módulo comercial — é o que torna a operação auditável e escalável.',
    detailedDesc:
      'A fundação operacional que sustenta todos os módulos comerciais: configurações globais, gestão de equipe e papéis (RBAC), controle de acesso granular por módulo, feature flags com rollout controlado, catálogo de módulos por organização e relatórios de bug, consumo de IA e notificações.',
    themeColor: 'cyan',
    icon: Settings,
    route: '/app/settings',
    ctaText: 'Abrir Administração',
    availability: 'Disponível no CRM',
    capabilities: [
      {
        title: 'Settings Globais & Feature Flags',
        desc: 'Configurações da organização com rollout controlado de funcionalidades por tenant.',
      },
      {
        title: 'Equipe, Papéis & Module Access',
        desc: 'Gestão de usuários com RBAC e concessão granular de acesso aos 11 módulos.',
      },
      {
        title: 'Telemetria de Consumo & IA',
        desc: 'Monitoramento de uso da plataforma, consumo de tokens de IA e relatórios de bug integrados.',
      },
      {
        title: 'Resiliência & Failover',
        desc: 'Painéis de resiliência operacional e failover para continuidade da receita.',
      },
    ],
    metrics: [
      {
        value: '11 módulos',
        label: 'Catálogo por organização',
        trend: 'Concessão granular',
        context: 'Simulação',
      },
      {
        value: 'RBAC',
        label: 'Controle de papéis',
        trend: 'Mínimo privilégio',
        context: 'Simulação',
      },
      {
        value: '100%',
        label: 'Auditoria de acessos',
        trend: 'Logs imutáveis',
        context: 'Simulação',
      },
    ],
    renderVisualizer: (theme) => <VisualizerAdminOps theme={theme} />,
  },

  '10': {
    id: '10',
    num: '10',
    badge: 'FORÇA DE CAMPO & APP ANDROID',
    title: 'Mobile & Field Sales',
    modalTitle: '10. Mobile & Field Sales',
    tagline:
      'Vendas em campo com gravação de reuniões, sincronização offline e IA edge no app Android.',
    commercialDescription:
      'O vendedor não para quando sai do escritório. O FieldMeetingRecorder registra reuniões externas com áudio e IA edge, sincroniza offline e devolve os insights ao pipeline — tudo pelo app Android dedicado construído com Capacitor.',
    detailedDesc:
      'O vendedor não para quando sai do escritório. O FieldMeetingRecorder registra reuniões externas com gravação de áudio, transcrição por IA edge e sincronização offline; o app Android via Capacitor mantém a mesma plataforma na palma da mão, com os mesmos dados e governança do desktop.',
    themeColor: 'pink',
    icon: Smartphone,
    route: '/app',
    ctaText: 'Conhecer o App de Campo',
    availability: 'Disponível no CRM',
    capabilities: [
      {
        title: 'FieldMeetingRecorder',
        desc: 'Gravação de reuniões externas com transcrição automática e extração de próximos passos.',
      },
      {
        title: 'Sincronização Offline-first',
        desc: 'Registros capturados em campo sincronizam com o CRM quando a conexão retorna.',
      },
      {
        title: 'IA Edge no Dispositivo',
        desc: 'Processamento local de áudio e texto para reduzir latência e custo de API.',
      },
      {
        title: 'App Android via Capacitor',
        desc: 'Aplicativo nativo com a mesma experiência da plataforma web, incluindo Voice Hub dedicado.',
      },
    ],
    metrics: [
      {
        value: '100%',
        label: 'Reuniões registradas',
        trend: 'Sem retrabalho de anotações',
        context: 'Simulação',
      },
      {
        value: 'Offline',
        label: 'Operação sem sinal',
        trend: 'Fila de sincronização',
        context: 'Simulação',
      },
      {
        value: 'Edge AI',
        label: 'Processamento local',
        trend: 'Menor latência',
        context: 'Simulação',
      },
    ],
    renderVisualizer: (theme) => <VisualizerFieldSales theme={theme} />,
  },

  '11': {
    id: '11',
    num: '11',
    badge: 'VENDA SOCIAL & COPY ASSISTIDO',
    title: 'Social Selling',
    modalTitle: '11. Social Selling',
    tagline:
      'Abordagens personalizadas por canal com copywriting assistido por IA e persistência de interações.',
    commercialDescription:
      'Venda onde o decisor está: LinkedIn, WhatsApp e e-mail. O módulo gera abordagens personalizadas por conta e decisor, com copywriting assistido por IA e persistência de cada interação — concedido por módulo à organização.',
    detailedDesc:
      'Venda onde o decisor está: LinkedIn, WhatsApp e e-mail. O SocialSellingHub combina geração de abordagens personalizadas por conta e decisor, copywriting assistido por IA (shadow copy), abordagem estruturada por canal e persistência de interações para alimentar o pipeline com contexto real.',
    themeColor: 'gold',
    icon: Share2,
    route: '/social-selling',
    ctaText: 'Abrir Social Selling',
    availability: 'Disponível no CRM',
    capabilities: [
      {
        title: 'ApproachGeneratorCard',
        desc: 'Geração de abordagens personalizadas por canal usando contexto da conta e do decisor.',
      },
      {
        title: 'Shadow Copywriting por IA',
        desc: 'Rascunhos de mensagens em tom consultivo prontos para revisão e aprovação humana.',
      },
      {
        title: 'Abordagem Estruturada por Canal',
        desc: 'Sequências adaptadas a LinkedIn, WhatsApp e e-mail com cadência própria.',
      },
      {
        title: 'Persistência de Interações',
        desc: 'Cada toque registrado na linha do tempo 360° da conta, alimentando o Hub Comercial.',
      },
    ],
    metrics: [
      {
        value: '3+ canais',
        label: 'Abordagem multicanal',
        trend: 'LinkedIn · WhatsApp · E-mail',
        context: 'Simulação',
      },
      {
        value: 'IA',
        label: 'Copy assistido',
        trend: 'Aprovação humana',
        context: 'Simulação',
      },
      {
        value: '360°',
        label: 'Contexto unificado',
        trend: 'Interações persistidas',
        context: 'Simulação',
      },
    ],
    renderVisualizer: (theme) => <VisualizerSocialSelling theme={theme} />,
  },
};
