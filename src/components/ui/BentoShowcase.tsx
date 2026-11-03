import { Bot, Network, PhoneCall, ShieldCheck, Sparkles } from 'lucide-react';
import type React from 'react';
import { cn } from '../../lib/utils.js';

export function BentoShowcase({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'w-full max-w-7xl mx-auto py-8 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6',
        className,
      )}
      {...props}
    >
      {/* ── CARD 1: ENXAME AUTÔNOMO DE IA (SPAN 2) - CIANO NEON ── */}
      <div className="md:col-span-2 relative group rounded-3xl border border-[#00D4FF]/30 dark:border-[#00D4FF]/25 bg-gradient-to-br from-white via-sky-50/40 to-cyan-50/30 dark:from-[#111927] dark:via-[#0F172A] dark:to-[#0B1120] backdrop-blur-xl p-7 sm:p-9 shadow-[0_8px_30px_rgba(0,212,255,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:border-[#00D4FF]/60 transition-all duration-300 flex flex-col justify-between overflow-hidden">
        <div className="pointer-events-none absolute -top-12 -right-12 w-80 h-80 rounded-full blur-3xl opacity-20 bg-[#00D4FF] group-hover:opacity-35 transition-opacity" />

        <div className="relative z-10 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4FF]/15 text-[#0369a1] dark:text-[#00D4FF] border border-[#00D4FF]/40 font-mono text-[11px] font-bold uppercase tracking-wider mb-3">
            <Bot className="w-3.5 h-3.5 text-[#00D4FF]" />
            <span>Pilar 06 · Inteligência Artificial Autônoma</span>
          </div>

          <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0284c7] dark:text-[#00D4FF] mb-2 tracking-tight">
            Enxame de Agentes IA para Aceleração de Deals
          </h3>

          <p className="text-sm sm:text-base text-slate-600 dark:text-[#94d2f8] max-w-xl leading-relaxed font-normal">
            Agentes especializados (SDR, Closer e RevOps) que qualificam oportunidades em tempo
            real, auditam conformidade de playbook e geram a Próxima Melhor Ação com latência
            inferior a 50ms.
          </p>
        </div>

        {/* Visual Mockup Card Interativo */}
        <div className="relative rounded-2xl border border-[#00D4FF]/25 dark:border-[#00D4FF]/20 bg-white/90 dark:bg-[#131E30]/90 p-4 sm:p-5 space-y-3 shadow-inner">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-1.5 font-bold text-[#0284c7] dark:text-[#00D4FF]">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-[#00D4FF]" /> Agente NBA
              (Next-Best-Action)
            </span>
            <span className="text-slate-500 dark:text-[#70d6ff] font-semibold">
              Execução em 38ms
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-black/5 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                Disparar proposta customizada com trava de margem de 35%
              </div>
              <div className="text-[11px] text-[#0284c7] dark:text-[#70d6ff] font-mono mt-0.5">
                Conta: Hospital São Lucas · Fit Score 96% · Gate Decisor Aprovado
              </div>
            </div>
            <span className="shrink-0 px-3 py-1 rounded-full font-mono text-[10px] font-bold bg-[#D4F434] text-[#121316] shadow-xs">
              +34% Probabilidade
            </span>
          </div>
        </div>
      </div>

      {/* ── CARD 2: ECOSSISTEMA MULTI-CRM (SPAN 1) - ROSA NEON ── */}
      <div className="relative group rounded-3xl border border-[#FF2D9B]/30 dark:border-[#FF2D9B]/25 bg-gradient-to-br from-white via-pink-50/40 to-rose-50/30 dark:from-[#21111E] dark:via-[#190D18] dark:to-[#120811] backdrop-blur-xl p-7 sm:p-8 shadow-[0_8px_30px_rgba(255,45,155,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:border-[#FF2D9B]/60 transition-all duration-300 flex flex-col justify-between overflow-hidden">
        <div className="pointer-events-none absolute -bottom-10 -right-10 w-48 h-48 rounded-full blur-2xl opacity-20 bg-[#FF2D9B] group-hover:opacity-35 transition-opacity" />

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2D9B]/15 text-[#be185d] dark:text-[#FF2D9B] border border-[#FF2D9B]/40 font-mono text-[11px] font-bold uppercase tracking-wider mb-3">
            <Network className="w-3.5 h-3.5 text-[#FF2D9B]" />
            <span>Pilar 01 · Conectividade Multi-CRM</span>
          </div>

          <h3 className="font-display text-xl sm:text-2xl font-extrabold text-[#db2777] dark:text-[#FF2D9B] mb-2 tracking-tight">
            Adeus aos Silos de Dados
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#f8b4d8] leading-relaxed mb-6 font-normal">
            Sincronização bidirecional em tempo real com tolerância a falhas, garantindo a mesma
            verdade no Bitrix24, Salesforce, HubSpot e Pipedrive.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs font-bold">
          <div className="p-3 rounded-xl bg-white/80 dark:bg-white/5 border border-[#FF2D9B]/25 text-[#00D4FF] dark:text-[#38bdf8] shadow-xs">
            Bitrix24 ⚡
          </div>
          <div className="p-3 rounded-xl bg-white/80 dark:bg-white/5 border border-[#FF2D9B]/25 text-[#0284c7] dark:text-[#60a5fa] shadow-xs">
            Salesforce ☁️
          </div>
          <div className="p-3 rounded-xl bg-white/80 dark:bg-white/5 border border-[#FF2D9B]/25 text-[#ea580c] dark:text-[#fb923c] shadow-xs">
            HubSpot 🟠
          </div>
          <div className="p-3 rounded-xl bg-white/80 dark:bg-white/5 border border-[#FF2D9B]/25 text-[#16a34a] dark:text-[#4ade80] shadow-xs">
            Pipedrive 🟢
          </div>
        </div>
      </div>

      {/* ── CARD 3: ENRIQUECIMENTO B2B (SPAN 1) - LIME CHARTREUSE ── */}
      <div className="relative group rounded-3xl border border-[#D4F434]/40 dark:border-[#D4F434]/30 bg-gradient-to-br from-white via-lime-50/40 to-emerald-50/30 dark:from-[#171D12] dark:via-[#13190E] dark:to-[#0C1108] backdrop-blur-xl p-7 sm:p-8 shadow-[0_8px_30px_rgba(212,244,52,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:border-[#D4F434]/70 transition-all duration-300 flex flex-col justify-between overflow-hidden">
        <div className="pointer-events-none absolute -top-8 -left-8 w-48 h-48 rounded-full blur-2xl opacity-20 bg-[#D4F434] group-hover:opacity-35 transition-opacity" />

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4F434]/20 text-[#121316] dark:text-[#D4F434] border border-[#D4F434]/50 font-mono text-[11px] font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-[#121316] dark:text-[#D4F434]" />
            <span>Pilar 02 · Inteligência de Mercado</span>
          </div>

          <h3 className="font-display text-xl sm:text-2xl font-extrabold text-[#3f6212] dark:text-[#D4F434] mb-2 tracking-tight">
            ICP Scoring &amp; Receita Federal
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#dcf0a5] leading-relaxed mb-4 font-normal">
            Enriquecimento automático via CNPJ oficial, checagem cadastral, telefones validados e
            mapeamento do organograma de tomadores de decisão.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 dark:bg-black/40 border border-[#D4F434]/30 font-mono text-xs space-y-2 shadow-xs">
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span>Score Preditivo ICP</span>
            <span className="text-[#121316] dark:text-[#D4F434] font-extrabold px-2 py-0.5 rounded bg-[#D4F434]/25">
              96/100 · Tier 1
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span>Decisores C-Level</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
              4 Contatos Validados
            </span>
          </div>
        </div>
      </div>

      {/* ── CARD 4: CADÊNCIA MULTICANAL & TELEFONIA 3CX (SPAN 2) - DOURADO RADIANTE ── */}
      <div className="md:col-span-2 relative group rounded-3xl border border-[#F59E0B]/30 dark:border-[#F59E0B]/25 bg-gradient-to-br from-white via-amber-50/40 to-yellow-50/30 dark:from-[#211A11] dark:via-[#1B140B] dark:to-[#110D07] backdrop-blur-xl p-7 sm:p-9 shadow-[0_8px_30px_rgba(245,158,11,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:border-[#F59E0B]/60 transition-all duration-300 flex flex-col justify-between overflow-hidden">
        <div className="pointer-events-none absolute -bottom-10 -right-10 w-80 h-80 rounded-full blur-3xl opacity-20 bg-[#F59E0B] group-hover:opacity-35 transition-opacity" />

        <div className="relative z-10 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F59E0B]/15 text-[#b45309] dark:text-[#F59E0B] border border-[#F59E0B]/40 font-mono text-[11px] font-bold uppercase tracking-wider mb-3">
            <PhoneCall className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Pilar 03 · Orquestração de Vendas</span>
          </div>

          <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#d97706] dark:text-[#F59E0B] mb-2 tracking-tight">
            Cadência Multicanal com Voz &amp; WhatsApp Ativo
          </h3>

          <p className="text-sm sm:text-base text-slate-600 dark:text-[#fed7aa] max-w-xl leading-relaxed font-normal">
            Esteira coordenada de pontos de contato que aciona ligações via telefonia PABX/3CX com
            transcrição automática, disparos de WhatsApp e follow-ups por e-mail com rastreio de
            engajamento.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-black/30 border border-[#F59E0B]/25 shadow-xs">
            <div className="text-xs font-bold text-[#b45309] dark:text-[#F59E0B] mb-1">
              Etapa 01: Voz 3CX
            </div>
            <div className="text-[11px] text-slate-600 dark:text-[#fde68a] leading-relaxed">
              Ligação gravada, transcrita e resumida pela IA com detecção de sentimento
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-black/30 border border-[#F59E0B]/25 shadow-xs">
            <div className="text-xs font-bold text-[#b45309] dark:text-[#F59E0B] mb-1">
              Etapa 02: WhatsApp
            </div>
            <div className="text-[11px] text-slate-600 dark:text-[#fde68a] leading-relaxed">
              Envio do resumo executivo e confirmação de data da reunião
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-black/30 border border-[#F59E0B]/25 shadow-xs">
            <div className="text-xs font-bold text-[#b45309] dark:text-[#F59E0B] mb-1">
              Etapa 03: Proposta Viva
            </div>
            <div className="text-[11px] text-slate-600 dark:text-[#fde68a] leading-relaxed">
              Alerta instantâneo quando o decisor abre ou compartilha o documento
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
