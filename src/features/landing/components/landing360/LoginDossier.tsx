import { Cpu, Lock, ShieldCheck } from 'lucide-react';

/** Coluna esquerda do login — dossiê executivo de Revenue Intelligence (desktop only). */
export function LoginDossier() {
  return (
    <div className="hidden lg:flex flex-col justify-between col-span-5 space-y-6 pt-2">
      <div>
        {/* Telemetria de Sistema ao Vivo */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>BH360 COMMAND CENTER · ONLINE</span>
        </div>

        {/* Título de Alto Contraste Editorial */}
        <h1 className="font-display text-3xl xl:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15] mb-4">
          A infraestrutura definitiva de{' '}
          <span className="bg-gradient-to-r from-[#00D4FF] via-[#0284C7] to-[#8B5CF6] dark:from-[#00D4FF] dark:via-[#38BDF8] dark:to-[#A78BFA] bg-clip-text text-transparent">
            Revenue Intelligence
          </span>
        </h1>

        <p className="font-sans text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
          Orquestre seu pipeline comercial com 20+ agentes especialistas autônomos, visão unificada
          360° e isolamento rigoroso de tenancy sob a LGPD.
        </p>

        {/* 3 Pilares com Micro-Métricas e Ícones */}
        <div className="space-y-3.5">
          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#0C1526]/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm transition-all hover:border-[#00D4FF]/40">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00D4FF]/10 text-[#00D4FF] flex items-center justify-center shrink-0 mt-0.5 border border-[#00D4FF]/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-mono text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                  01. Pipeline 360° Multi-Tenant
                </h4>
                <p className="font-sans text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Postgres Row Level Security nativo, isolamento criptográfico por organização e
                  consultas otimizadas por índices e políticas de tenant.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#0C1526]/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm transition-all hover:border-[#00D4FF]/40">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5 border border-purple-500/20">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-mono text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                  02. Enxame de IA Especialista
                </h4>
                <p className="font-sans text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  20+ agentes de prospecção, qualificação, forecast e coaching atuando em cadência
                  sob política de zero alucinação.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#0C1526]/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm transition-all hover:border-[#00D4FF]/40">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/20">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-mono text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                  03. Governança & LGPD Nativa
                </h4>
                <p className="font-sans text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Criptografia AES-256-GCM em repouso para credenciais e PII, gestão de
                  consentimento e trilha de auditoria viva imutável.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges de Certificação e Conformidade Técnica */}
      <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center gap-2 font-mono text-[10px] text-slate-600 dark:text-slate-400">
        <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
          SOC-2 TYPE II READY
        </span>
        <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
          ISO 27001 READY
        </span>
        <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
          LGPD POR DESIGN
        </span>
        <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
          AES-256-GCM
        </span>
      </div>
    </div>
  );
}
