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
  LucideIcon,
  Network,
  PhoneCall,
  Search,
  Sparkles,
  TrendingUp,
  Workflow,
} from 'lucide-react';
import React from 'react';

export type PillarThemeColor = 'cyan' | 'pink' | 'gold' | 'iris';
export type PillarId = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08';
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
  renderVisualizer: () => React.ReactNode;
}

// ============================================================================
// 1. COMPONENTES DE VISUALIZAÇÃO CONTEXTUAL (SIMULAÇÃO OPERACIONAL BASEADA EM DADOS)
// ============================================================================

/** 01 — Hub Comercial: pipeline, contas, oportunidades, atividades e contexto comercial unificado */
export function VisualizerHubComercial() {
  return (
    <div className="rounded-2xl border border-sky-500/30 bg-slate-900/80 dark:bg-slate-950/80 p-4 space-y-3 font-mono text-xs shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <span className="flex items-center gap-1.5 text-sky-400 font-bold uppercase tracking-wider text-[11px]">
          <Layers className="w-3.5 h-3.5" /> Pipeline Ativo • R$ 1.040.000
        </span>
        <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px] font-semibold">
          3 Negócios em Foco
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Coluna 1: Qualificação */}
        <div className="rounded-xl bg-slate-950/90 dark:bg-slate-900/60 p-2.5 border border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span className="font-semibold">QUALIFICAÇÃO</span>
            <span className="text-sky-400 font-bold">R$ 180k</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/90 dark:bg-slate-950/80 border border-slate-700/60">
            <p className="text-[11px] font-semibold text-slate-200 truncate">Indústria Alfa S/A</p>
            <p className="text-[9px] text-slate-400 font-sans">Score ICP: 94 • 2 decisores</p>
            <span className="mt-1 inline-block text-[8px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              Próx: Mapear Diretor
            </span>
          </div>
        </div>

        {/* Coluna 2: Proposta */}
        <div className="rounded-xl bg-slate-950/90 dark:bg-slate-900/60 p-2.5 border border-sky-500/40 space-y-1.5 shadow-[0_0_12px_rgba(0,212,255,0.12)]">
          <div className="flex justify-between items-center text-[10px] text-sky-300">
            <span className="font-semibold">PROPOSTA</span>
            <span className="text-sky-400 font-bold">R$ 340k</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/90 dark:bg-slate-950/80 border border-sky-500/50">
            <p className="text-[11px] font-semibold text-sky-200 truncate">Varejo Global Ltda</p>
            <p className="text-[9px] text-emerald-400 font-semibold font-sans">Próx: Reunião Diretoria</p>
            <span className="mt-1 inline-block text-[8px] px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-500/30">
              Proposta V2 Enviada
            </span>
          </div>
        </div>

        {/* Coluna 3: Fechamento */}
        <div className="rounded-xl bg-slate-950/90 dark:bg-slate-900/60 p-2.5 border border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span className="font-semibold">FECHAMENTO</span>
            <span className="text-emerald-400 font-bold">R$ 520k</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/90 dark:bg-slate-950/80 border border-emerald-500/40">
            <p className="text-[11px] font-semibold text-slate-200 truncate">FinTech Horizons</p>
            <p className="text-[9px] text-amber-400 font-semibold font-sans">Minuta Jurídica (90%)</p>
            <span className="mt-1 inline-block text-[8px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
              Aguardando Assinatura
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 02 — Inteligência de Mercado: enriquecimento de dados B2B, ICP, sinais de compra, decisores e priorização */
export function VisualizerMercado() {
  return (
    <div className="rounded-2xl border border-pink-500/30 bg-slate-900/80 dark:bg-slate-950/80 p-4 space-y-3 font-mono text-xs shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <span className="flex items-center gap-1.5 text-pink-400 font-bold uppercase tracking-wider text-[11px]">
          <Database className="w-3.5 h-3.5" /> Enriquecimento CNPJ • Receita & QSA
        </span>
        <span className="px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/30 text-[10px] font-semibold">
          ICP Score: 96/100
        </span>
      </div>

      <div className="rounded-xl bg-slate-950/90 dark:bg-slate-900/60 p-3 border border-pink-500/30 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div>
            <h4 className="text-sm font-bold text-slate-100 font-sans tracking-tight">TechLog Logística Integrada S/A</h4>
            <span className="text-[10px] text-slate-400">CNPJ: 14.288.901/0001-44 • Matriz São Paulo/SP</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold w-fit">
            Receita Presumida: R$ 50M a R$ 100M
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80 text-[11px]">
          <div>
            <span className="text-slate-500 text-[10px] block">CNAE Principal</span>
            <span className="text-slate-200 font-semibold">4930-2 (Cargas)</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">Decisor no QSA</span>
            <span className="text-pink-300 font-semibold">Diretor Comercial</span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-slate-500 text-[10px] block">Canal Corporativo</span>
            <span className="text-emerald-400 font-semibold">E-mail Validado ✓</span>
          </div>
        </div>

        <div className="p-2 rounded bg-pink-950/30 border border-pink-500/20 text-[10px] text-pink-200 font-sans">
          <strong>Sinal de Compra:</strong> Contratação ativa de 8 executivos de vendas + Expansão recente de filiais no Sul.
        </div>
      </div>
    </div>
  );
}

/** 03 — Orquestração de Vendas: cadências, passagem de bastão SDR → Closer, SLAs e próxima melhor ação */
export function VisualizerOrquestracao() {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-slate-900/80 dark:bg-slate-950/80 p-4 space-y-3 font-mono text-xs shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <span className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
          <Workflow className="w-3.5 h-3.5" /> Cadência Executiva • Passo 3 de 5
        </span>
        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-semibold">
          SLA Restante: 25 min
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-950/80 border border-slate-800 opacity-60">
          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
            ✓
          </span>
          <div className="flex-1">
            <span className="text-slate-300 font-semibold">D+0 • E-mail de Apresentação de Valor</span>
            <span className="text-slate-500 text-[10px] block font-sans">Entregue • Aberto 2x pelo lead</span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/90 border border-amber-500/50 shadow-[0_0_12px_rgba(255,193,7,0.12)]">
          <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-bold animate-pulse">
            3
          </span>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="text-amber-300 font-bold">D+2 • Ligação VoiceHub + Follow-up WhatsApp</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                NEXT BEST ACTION
              </span>
            </div>
            <span className="text-slate-300 text-[10px] block font-sans mt-0.5">
              Roteiro tático: validar dor de controle do Diretor de Operações e propor passagem para Closer.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 text-[10px]">
          <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold">
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
export function VisualizerPerformance() {
  return (
    <div className="rounded-2xl border border-violet-500/30 bg-slate-900/80 dark:bg-slate-950/80 p-4 space-y-3 font-mono text-xs shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <span className="flex items-center gap-1.5 text-violet-400 font-bold uppercase tracking-wider text-[11px]">
          <BarChart3 className="w-3.5 h-3.5" /> Telemetria de Conversão do Funil
        </span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
          Meta do Mês: 87% Atingida
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 block font-semibold">ENTRADA</span>
          <span className="text-sm font-bold text-slate-200">1.240</span>
          <span className="text-[9px] text-slate-500 block">leads no mês</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="text-[10px] text-violet-400 block font-semibold">QUALIF.</span>
          <span className="text-sm font-bold text-violet-300">410</span>
          <span className="text-[9px] text-emerald-400 block">33.1% conv.</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="text-[10px] text-sky-400 block font-semibold">PROPOSTA</span>
          <span className="text-sm font-bold text-sky-300">185</span>
          <span className="text-[9px] text-emerald-400 block">45.1% conv.</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.12)]">
          <span className="text-[10px] text-emerald-400 block font-semibold">GANHOS</span>
          <span className="text-sm font-bold text-emerald-300">78</span>
          <span className="text-[9px] text-emerald-400 block">42.2% conv.</span>
        </div>
      </div>

      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <span>Velocidade Média do Ciclo: <strong className="text-slate-200">18 dias</strong></span>
        <span>Produtividade: <strong className="text-violet-300">14 calls + 3 demos/dia por rep</strong></span>
      </div>
    </div>
  );
}

/** 05 — Previsibilidade Comercial: representação de cenários, projeção de receita e pipeline ponderado */
export function VisualizerPrevisibilidade() {
  return (
    <div className="rounded-2xl border border-sky-500/30 bg-slate-900/80 dark:bg-slate-950/80 p-4 space-y-3 font-mono text-xs shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <span className="flex items-center gap-1.5 text-sky-400 font-bold uppercase tracking-wider text-[11px]">
          <TrendingUp className="w-3.5 h-3.5" /> Modelagem Estatística • Forecast Mensal
        </span>
        <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px] font-semibold">
          94% Confiança
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 block font-semibold">CONSERVADOR</span>
          <span className="text-base font-bold text-slate-200">R$ 1.180.000</span>
          <span className="text-[9px] text-slate-500 block">95% probabilidade</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/90 border border-sky-500/50 shadow-[0_0_12px_rgba(0,212,255,0.15)] text-center">
          <span className="text-[10px] text-sky-300 font-bold block">CENÁRIO PROVÁVEL</span>
          <span className="text-base font-bold text-sky-300">R$ 1.450.000</span>
          <span className="text-[9px] text-emerald-400 block font-semibold">meta orçamentária</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 block font-semibold">OTIMISTA</span>
          <span className="text-base font-bold text-slate-200">R$ 1.720.000</span>
          <span className="text-[9px] text-slate-500 block">upside mapeado</span>
        </div>
      </div>

      <div className="p-2 rounded-lg bg-sky-950/30 border border-sky-500/20 text-[10px] text-sky-300 font-sans flex items-center justify-between">
        <span>Pipeline Ponderado Total: <strong>R$ 2.450.000</strong></span>
        <span>Taxa de Slippage Prevista: <strong>6.2%</strong></span>
      </div>
    </div>
  );
}

/** 06 — Inteligência Artificial: diagnóstico contextual, análise de entraves e recomendações fundamentadas */
export function VisualizerIaCopilot() {
  return (
    <div className="rounded-2xl border border-pink-500/30 bg-slate-900/80 dark:bg-slate-950/80 p-4 space-y-3 font-mono text-xs shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <span className="flex items-center gap-1.5 text-pink-400 font-bold uppercase tracking-wider text-[11px]">
          <Bot className="w-3.5 h-3.5" /> Copiloto IA • Recomendação Tática em Tempo Real
        </span>
        <span className="px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30 text-[10px] font-bold">
          Confidence: 91%
        </span>
      </div>

      <div className="rounded-xl bg-slate-950/90 p-3 border border-pink-500/40 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
          <span className="text-[11px] font-bold text-slate-200">
            Objeção Detectada: &quot;Orçamento congelado até o próximo trimestre&quot;
          </span>
        </div>
        <p className="text-[11px] text-slate-300 font-sans leading-relaxed pl-6">
          <strong>Recomendação Tática:</strong> Propor ativação em 2 etapas (Setup técnico no mês corrente com início de faturamento no próximo ciclo fiscal). No histórico da sua conta, esse modelo converteu <strong>78%</strong> das objeções semelhantes.
        </p>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-sans">
        <span>Análise baseada em 142 negociações com perfil similar</span>
        <span className="text-pink-300 font-semibold font-mono">Status: Ação Pronta para Envio</span>
      </div>
    </div>
  );
}

/** 07 — Automação e Conectividade: fluxos, gatilhos, APIs, webhooks comprovadamente implementados */
export function VisualizerAutomacao() {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-slate-900/80 dark:bg-slate-950/80 p-4 space-y-3 font-mono text-xs shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <span className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
          <Network className="w-3.5 h-3.5" /> Gateway de APIs & Webhooks • Telemetria Ativa
        </span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
          99.98% SLA
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-200 font-semibold block">API Bitrix24</span>
            <span className="text-[10px] text-slate-400 font-sans">Via REST / Webhook</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-200 font-semibold block">Webhooks REST</span>
            <span className="text-[10px] text-slate-400 font-sans">Retry Exponencial</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-200 font-semibold block">Event Bus</span>
            <span className="text-[10px] text-slate-400 font-sans">Latência: 120ms</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
        </div>
      </div>

      <div className="p-2 rounded bg-amber-950/30 border border-amber-500/20 text-[10px] text-amber-200 font-sans">
        <strong>Conectores Reais:</strong> Integração via API REST aberta, fila idempotente e webhooks seguros autenticados com chave HMAC.
      </div>
    </div>
  );
}

/** 08 — Engajamento Comercial: histórico multicanal, interações, telefonia e rastreabilidade */
export function VisualizerEngajamento() {
  return (
    <div className="rounded-2xl border border-violet-500/30 bg-slate-900/80 dark:bg-slate-950/80 p-4 space-y-3 font-mono text-xs shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <span className="flex items-center gap-1.5 text-violet-400 font-bold uppercase tracking-wider text-[11px]">
          <PhoneCall className="w-3.5 h-3.5" /> VoiceHub • Chamada Gravada & Transcrita
        </span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
          Sentimento: Positivo (88%)
        </span>
      </div>

      <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-200 font-semibold">Ligação: Diretor de Tecnologia</span>
          <span className="text-slate-400">Duração: 04:18 • WebRTC</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-700/60 font-sans text-slate-300 text-[11px] leading-relaxed">
          &quot;Perfeito. Gostei da integração nativa com o nosso CRM e da segurança com LGPD. Podemos agendar a demonstração técnica para quinta-feira às 14h.&quot;
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-sans">
          <span>Ação automática: Reunião criada na agenda</span>
          <span className="text-emerald-400 font-semibold font-mono">Deal atualizado no CRM ✓</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. REGISTRO TIPADO DOS 8 PILARES COMERCIAIS (PILLAR_REGISTRY)
// ============================================================================

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
      { value: '+42%', label: 'Velocidade de Negociação', trend: 'Ciclo médio reduzido', context: 'Simulação' },
      { value: 'Zero', label: 'Deals Esquecidos', trend: 'Rastreabilidade total', context: 'Simulação' },
      { value: '< 3 cliques', label: 'Auditoria de Contas', trend: 'Navegação instantânea', context: 'Simulação' },
    ],
    renderVisualizer: () => <VisualizerHubComercial />,
  },

  '02': {
    id: '02',
    num: '02',
    badge: 'PROSPECÇÃO B2B & SINAIS DE COMPRA',
    title: 'Inteligência de Mercado',
    modalTitle: '02. Inteligência de Mercado',
    tagline: 'Enriqueça dados B2B, identifique sinais de compra e qualifique decisores com precisão.',
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
      { value: '3x mais', label: 'Precisão na Qualificação', trend: 'Filtro por ICP', context: 'Simulação' },
      { value: '-70%', label: 'Tempo de Pesquisa Cadastral', trend: 'Automação CNPJ', context: 'Simulação' },
      { value: '100%', label: 'Conformidade LGPD', trend: 'Base legal auditada', context: 'Simulação' },
    ],
    renderVisualizer: () => <VisualizerMercado />,
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
      { value: '+65%', label: 'Disciplina de Follow-ups', trend: 'Régua automatizada', context: 'Simulação' },
      { value: '4 dias', label: 'Ciclo de Qualificação', trend: 'Transição ágil', context: 'Simulação' },
      { value: '100%', label: 'Leads no SLA', trend: 'Sem gargalos ocultos', context: 'Simulação' },
    ],
    renderVisualizer: () => <VisualizerOrquestracao />,
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
      { value: '+28%', label: 'Eficiência de Conversão', trend: 'Eliminação de atritos', context: 'Simulação' },
      { value: '18 dias', label: 'Ciclo Médio de Vendas', trend: 'Visibilidade total', context: 'Simulação' },
      { value: 'Tempo Real', label: 'Apuração de Metas', trend: 'Telemetria contínua', context: 'Simulação' },
    ],
    renderVisualizer: () => <VisualizerPerformance />,
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
      { value: '94%', label: 'Confiabilidade Estatística', trend: 'Modelo calibrado', context: 'Simulação' },
      { value: '45 dias', label: 'Antecipação de Desvios', trend: 'Correção de rota', context: 'Simulação' },
      { value: '3 Faixas', label: 'Cenários Modelados', trend: 'Orçamento seguro', context: 'Simulação' },
    ],
    renderVisualizer: () => <VisualizerPrevisibilidade />,
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
      { value: '2h / dia', label: 'Otimização Operacional', trend: 'Menos burocracia', context: 'Simulação' },
      { value: '+35%', label: 'Superação de Objeções', trend: 'Argumentos táticos', context: 'Simulação' },
      { value: '-50%', label: 'Rampa de Novos Vendedores', trend: 'Treinamento contínuo', context: 'Simulação' },
    ],
    renderVisualizer: () => <VisualizerIaCopilot />,
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
      { value: '99.98%', label: 'Sucesso de Sincronização', trend: 'Fila idempotente', context: 'Simulação' },
      { value: 'Zero', label: 'Perda de Eventos', trend: 'Retry automático', context: 'Simulação' },
      { value: '< 120ms', label: 'Latência do Event Bus', trend: 'Entrega imediata', context: 'Simulação' },
    ],
    renderVisualizer: () => <VisualizerAutomacao />,
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
      { value: '+50%', label: 'Produtividade de Ligações', trend: 'Discador com 1 clique', context: 'Simulação' },
      { value: '100%', label: 'Auditoria de Interações', trend: 'Gravações vinculadas', context: 'Simulação' },
      { value: 'Instantâneo', label: 'Resumo com IA', trend: 'Transcrição ponta a ponta', context: 'Simulação' },
    ],
    renderVisualizer: () => <VisualizerEngajamento />,
  },
};
