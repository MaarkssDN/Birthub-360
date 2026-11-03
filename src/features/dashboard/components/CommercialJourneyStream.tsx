import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Bot,
  Building2,
  Calendar,
  ChevronDown,
  FileText,
  Layers,
  PhoneCall,
  Plus,
  Search,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SoundFX } from '../../../lib/soundEffects.js';

interface CommercialJourneyStreamProps {
  onClose?: () => void;
}

export function CommercialJourneyStream({ onClose }: CommercialJourneyStreamProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    'dynamics' | 'stages' | 'actions' | 'agents' | 'accounts' | 'won'
  >('dynamics');
  const [activeSubFilter, setActiveSubFilter] = useState<string>('all');
  const [activeTimelineMonth, setActiveTimelineMonth] = useState<string>('aug');
  const [_expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    node1: true,
    node2: true,
  });

  const _toggleNode = (id: string) => {
    SoundFX.play('click');
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-full relative overflow-hidden rounded-[2.25rem] border border-line/80 bg-[#EAEAE2] dark:bg-[#121316] text-ink p-4 sm:p-6 lg:p-7 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.6)] transition-all duration-300">
      {/* ── TOP SCULPTED HEADER ZONE (Referência: Ronas IT / Spatial UI) ── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
        {/* Left Carved Title & Back/Close */}
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white dark:bg-[#1E2026] border border-line flex items-center justify-center text-ink-2 hover:text-ink hover:scale-105 transition-all shadow-xs"
              title="Fechar visão detalhada"
              aria-label="Fechar visão detalhada"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight text-ink">
              Jornada Comercial 360°
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#D4F434] text-[#121316] shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#121316] animate-pulse" />
              Ao Vivo
            </span>
          </div>
        </div>

        {/* Right Sculpted Pill Navigation Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none p-1 bg-white/70 dark:bg-[#1A1C22]/80 backdrop-blur-xl border border-line/70 rounded-full shadow-xs">
          {[
            { id: 'dynamics', label: 'Dinâmica do Funil', icon: Search },
            { id: 'stages', label: 'Estágios & Gates', icon: Layers },
            { id: 'actions', label: 'Ações Táticas', icon: Zap },
            { id: 'agents', label: 'Agentes Autônomos', icon: Bot },
            { id: 'accounts', label: 'Contas ICP', icon: Building2 },
            { id: 'won', label: 'Fechamentos', icon: TrendingUp },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  SoundFX.play('click');
                  setActiveTab(item.id as any);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-[#252830] text-ink font-bold shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-line'
                    : 'text-ink-2 hover:text-ink hover:bg-white/50 dark:hover:bg-white/[0.05]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#00D4FF]' : 'text-ink-2'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── EXECUTIVE ENTITY SPOTLIGHT & HEALTH METRIC STRIP ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        {/* Left Entity Card: Spotlight Account */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="lg:col-span-4 p-4 rounded-3xl bg-white dark:bg-[#18191E] border border-line/80 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.4)] flex items-center gap-3.5"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#00D4FF]/20 to-[#D4F434]/20 border border-[#00D4FF]/30 flex items-center justify-center shrink-0 shadow-xs">
            <Building2 className="w-6 h-6 text-[#00D4FF]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-2">
                Enterprise ICP Tier 1
              </span>
              <span className="w-2 h-2 rounded-full bg-[#D4F434] shadow-[0_0_6px_#D4F434]" />
            </div>
            <h3 className="font-display font-bold text-sm text-ink truncate mt-0.5">
              VTech Telecom &amp; Cloud
            </h3>
            <p className="text-xs text-ink-2 font-mono truncate">
              R$ 2.400.000 ARR · Decisor C-Level
            </p>
          </div>
        </motion.div>

        {/* Center/Right 5 Crisp Metric Chips */}
        <div className="lg:col-span-8 flex flex-col justify-between gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Diagnóstico', val: 'Acelerado', unit: '', accent: 'emerald' },
              { label: 'Volume em Funil', val: '4,8M', unit: 'BRL', accent: 'brand' },
              { label: 'Win Rate', val: '34,8%', unit: 'Médio', accent: 'gold' },
              { label: 'Fit Score ICP', val: '96', unit: '/100', accent: 'cyan' },
              { label: 'Tempo Ciclo', val: '16', unit: 'dias', accent: 'lime' },
            ].map((metric) => (
              <div
                key={metric.label}
                className="p-3 rounded-2xl bg-white/70 dark:bg-[#18191E]/70 border border-line/60 shadow-xs"
              >
                <span className="block text-[10px] font-mono uppercase tracking-wider text-ink-2 truncate">
                  {metric.label}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-base sm:text-lg font-mono font-bold text-ink tracking-tight">
                    {metric.val}
                  </span>
                  {metric.unit && (
                    <span className="text-[10px] font-mono text-ink-2">{metric.unit}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Sub-Pills Filters Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Todos os Leads' },
              { id: 'calls', label: 'Visitas & Calls' },
              { id: 'cadence', label: 'Em Cadência' },
              { id: 'proposals', label: 'Propostas' },
              { id: 'pilots', label: 'Pilotos Validados' },
              { id: 'closing', label: 'Fechamento Iminente' },
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => {
                  SoundFX.play('click');
                  setActiveSubFilter(filter.id);
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                  activeSubFilter === filter.id
                    ? 'bg-white dark:bg-[#252830] text-ink border-line font-bold shadow-xs'
                    : 'bg-white/40 dark:bg-white/[0.03] text-ink-2 border-line/50 hover:bg-white/80'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── THE CONNECTED HORIZONTAL NODE STREAM (Direct Reference Implementation) ── */}
      <div className="relative overflow-x-auto pb-6 scrollbar-none">
        <div className="min-w-[840px] flex items-start gap-8 relative pt-4">
          {/* Node 1: Mês 1 / Descoberta & ICP */}
          <div className="flex-1 space-y-4 relative">
            {/* Timeline Marker Pin */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#D4F434] text-[#121316] font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_12px_rgba(212,244,52,0.4)] shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-ink block font-display">
                  Agosto · Semana 1
                </span>
                <span className="text-[10px] font-mono text-ink-2 block">
                  Entrada &amp; Qualificação
                </span>
              </div>
            </div>

            {/* Split Pills & Connected Cards */}
            <div className="pl-4 border-l-2 border-line/70 dark:border-line/40 ml-4 space-y-4 pt-2">
              {/* Dual-lobed action pill 1 */}
              <div className="inline-flex items-center rounded-full bg-white dark:bg-[#18191E] border border-line p-1 pr-3 shadow-xs gap-2">
                <span className="w-6 h-6 rounded-full bg-[#121316] dark:bg-white text-white dark:text-[#121316] flex items-center justify-center">
                  <PhoneCall className="w-3 h-3" />
                </span>
                <span className="text-xs font-semibold text-ink font-mono">Cold Call SDR × 2</span>
              </div>

              {/* Card 1: Velocidade de Conversão (Waveform Sparkline) */}
              <motion.div
                whileHover={{ y: -2 }}
                className="p-4 rounded-3xl bg-white dark:bg-[#18191E] border border-line/80 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.05)] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold font-display text-ink">
                      Velocidade de Conversão
                    </h4>
                    <span className="text-[10px] text-ink-2 font-mono">
                      Sexta-feira · Tempo Médio
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#D4F434] text-[#121316]">
                    +12% veloc.
                  </span>
                </div>

                {/* Waveform Visual Area (Matching Blood Pressure in Reference) */}
                <div className="relative h-16 w-full rounded-2xl bg-surface-2/60 overflow-hidden flex items-end">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 200 60"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="waveGradient1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 35 Q 25 15, 50 30 T 100 25 T 150 40 T 200 20 L 200 60 L 0 60 Z"
                      fill="url(#waveGradient1)"
                    />
                    <path
                      d="M0 35 Q 25 15, 50 30 T 100 25 T 150 40 T 200 20"
                      fill="none"
                      stroke="#00D4FF"
                      strokeWidth="2.5"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="px-2.5 py-1 rounded-full bg-[#121316] text-white text-[11px] font-mono font-bold shadow-md">
                      180 / 120
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-ink-2 font-mono text-[11px]">
                    Média ICP: <strong className="text-ink">160k</strong>
                  </span>
                  <span className="text-[#00D4FF] font-bold font-mono text-xs">+10 pts</span>
                </div>
              </motion.div>

              {/* Card 2: Fit do Decisor & Dores */}
              <motion.div
                whileHover={{ y: -2 }}
                className="p-4 rounded-3xl bg-white dark:bg-[#18191E] border border-line/80 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.05)] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-display text-ink">
                    Dores &amp; Sintomas Comerciais
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    Gargalo Operacional
                  </span>
                </div>
                <p className="text-xs text-ink-2">
                  Baixa taxa de resposta no primeiro contato e falta de dados de decisores.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-surface-2 text-ink">
                    Head de TI
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-surface-2 text-ink">
                    Diretor Comercial
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Center Connector Indicator & Add Action */}
          <div className="flex flex-col items-center justify-center pt-24 gap-3">
            <div className="w-7 h-7 rounded-full bg-white dark:bg-[#18191E] border border-line flex items-center justify-center text-ink-2 shadow-xs">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/prospect')}
              className="w-10 h-10 rounded-full bg-[#121316] dark:bg-white text-white dark:text-[#121316] flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer"
              title="Adicionar Oportunidade"
              aria-label="Adicionar Oportunidade"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Node 2: Mês 2 / Proposta & Negociação */}
          <div className="flex-1 space-y-4 relative">
            {/* Timeline Marker Pin */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#D4F434] text-[#121316] font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_12px_rgba(212,244,52,0.4)] shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-ink block font-display">
                  Setembro · Semana 1
                </span>
                <span className="text-[10px] font-mono text-ink-2 block">
                  Proposta &amp; PoC Piloto
                </span>
              </div>
            </div>

            {/* Split Pills & Connected Cards */}
            <div className="pl-4 border-l-2 border-line/70 dark:border-line/40 ml-4 space-y-4 pt-2">
              {/* Dual-lobed action pills */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center rounded-full bg-white dark:bg-[#18191E] border border-line p-1 pr-3 shadow-xs gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#121316] dark:bg-white text-white dark:text-[#121316] flex items-center justify-center">
                    <FileText className="w-3 h-3" />
                  </span>
                  <span className="text-xs font-semibold text-ink font-mono">Proposta v2 × 3</span>
                </div>
                <div className="inline-flex items-center rounded-full bg-white dark:bg-[#18191E] border border-line p-1 pr-3 shadow-xs gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#121316] dark:bg-white text-white dark:text-[#121316] flex items-center justify-center">
                    <PhoneCall className="w-3 h-3" />
                  </span>
                  <span className="text-xs font-semibold text-ink font-mono">
                    Acompanhamento Closer
                  </span>
                </div>
              </div>

              {/* Card 3: Probabilidade de Fechamento (Waveform Sparkline) */}
              <motion.div
                whileHover={{ y: -2 }}
                className="p-4 rounded-3xl bg-white dark:bg-[#18191E] border border-line/80 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.05)] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold font-display text-ink">
                      Probabilidade de Fechamento
                    </h4>
                    <span className="text-[10px] text-ink-2 font-mono">
                      Quinta-feira · Score AI
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#121316] text-[#D4F434] dark:bg-white dark:text-[#121316]">
                    85% score
                  </span>
                </div>

                {/* Waveform Visual Area (Matching Blood Pressure in Reference) */}
                <div className="relative h-16 w-full rounded-2xl bg-surface-2/60 overflow-hidden flex items-end">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 200 60"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="waveGradient2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4F434" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#D4F434" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 40 Q 30 20, 60 35 T 120 15 T 160 30 T 200 10 L 200 60 L 0 60 Z"
                      fill="url(#waveGradient2)"
                    />
                    <path
                      d="M0 40 Q 30 20, 60 35 T 120 15 T 160 30 T 200 10"
                      fill="none"
                      stroke="#A5C913"
                      strokeWidth="2.5"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="px-2.5 py-1 rounded-full bg-[#121316] text-white text-[11px] font-mono font-bold shadow-md">
                      135 / 92
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-ink-2 font-mono text-[11px]">
                    Pipeline: <strong className="text-ink">R$ 380.000</strong>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-xs">
                    -20% tempo
                  </span>
                </div>
              </motion.div>

              {/* Card 4: ECG de Ritmo Comercial & Cadência (Direct ECG representation!) */}
              <motion.div
                whileHover={{ y: -2 }}
                className="p-4 rounded-3xl bg-white dark:bg-[#18191E] border border-line/80 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.05)] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-display text-ink flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-rose-500" />
                    ECG de Ritmo Comercial
                  </h4>
                  <span className="text-[10px] font-mono text-ink-2">Cadência Ativa</span>
                </div>

                {/* ECG Heartbeat Waveform */}
                <div className="h-10 w-full flex items-center justify-center">
                  <svg
                    className="w-full h-8 stroke-rose-500"
                    viewBox="0 0 200 40"
                    fill="none"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M0 20 L40 20 L50 8 L60 32 L70 12 L80 20 L130 20 L140 5 L150 35 L160 14 L170 20 L200 20"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FLOATING BOTTOM HORIZON DOCK (Referência direta: bottom pill dock) ── */}
      <div className="mt-4 flex justify-center">
        <div className="inline-flex items-center gap-1 sm:gap-2 p-1.5 px-3 rounded-full bg-white/90 dark:bg-[#181A20]/90 backdrop-blur-2xl border border-line/80 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
          {/* Calendar Chip */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-2 text-ink text-xs font-mono font-bold border border-line">
            <Calendar className="w-3.5 h-3.5 text-brand" />
            <span>2026 Q4</span>
          </div>

          {/* Month / Stage Nodes with Lime Badges */}
          <div className="flex items-center gap-1">
            {[
              { id: 'jul', label: 'Jul', count: '4' },
              { id: 'aug', label: 'Ago', count: '6' },
              { id: 'sep', label: 'Set', count: '8' },
              { id: 'oct', label: 'Out', count: '5' },
              { id: 'nov', label: 'Nov', count: '3' },
              { id: 'dec', label: 'Dez', count: '2' },
            ].map((node) => {
              const isSelected = activeTimelineMonth === node.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => {
                    SoundFX.play('click');
                    setActiveTimelineMonth(node.id);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#121316] dark:bg-white text-white dark:text-[#121316] font-bold shadow-xs'
                      : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  <span>{node.label}</span>
                  <span
                    className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                      isSelected ? 'bg-[#D4F434] text-[#121316]' : 'bg-surface-2 text-ink-2'
                    }`}
                  >
                    {node.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Cockpit Action */}
          <button
            type="button"
            onClick={() => navigate('/app/crm')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4F434] hover:bg-[#C2E426] text-[#121316] text-xs font-bold font-display shadow-xs transition-transform hover:scale-105 cursor-pointer ml-1"
          >
            <span>Ver Kanban 360°</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
