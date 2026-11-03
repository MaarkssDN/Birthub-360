import type React from 'react';
import { ArrowRight, Lock, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { Button } from './Button.js';
import { Glow } from './Glow.js';

export interface CtaBannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  onCtaClick?: () => void;
  title?: React.ReactNode;
  description?: string;
}

export function CtaBanner({
  onCtaClick,
  title,
  description = 'Elimine silos entre marketing, pré-vendas e fechamento. Conecte múltiplos CRMs e multiplique suas conversões com agentes de IA em tempo real.',
  className,
  ...props
}: CtaBannerProps) {
  return (
    <div
      className={cn(
        'relative w-full max-w-6xl mx-auto rounded-3xl sm:rounded-[36px] overflow-hidden p-8 sm:p-14 text-center',
        'border border-[#00D4FF]/30 dark:border-[#00D4FF]/25 bg-gradient-to-b from-white via-slate-50 to-sky-50/20 dark:from-[#181920] dark:via-[#14151A] dark:to-[#0B1120]',
        'shadow-[0_20px_60px_rgba(0,212,255,0.08)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.8)]',
        className,
      )}
      {...props}
    >
      {/* Luz ambiente Launch UI Glow */}
      <Glow variant="top" color="lime" blur="xl" />
      <Glow variant="bottom" color="cyan" blur="xl" />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Pill Kicker */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4F434]/20 text-[#121316] dark:text-[#D4F434] border border-[#D4F434]/50 font-mono text-[11px] font-bold uppercase tracking-wider mb-6">
          <Zap className="w-3.5 h-3.5 text-[#121316] dark:text-[#D4F434]" />
          <span>Transformação Comercial Imediata</span>
        </div>

        {/* Headline com Cores Diferenciadas (Nunca Branco Chapado) */}
        <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-5 leading-tight">
          {title || (
            <>
              <span className="text-[#0284c7] dark:text-[#00D4FF]">Pronto para transformar </span>
              <span className="text-[#d97706] dark:text-[#F59E0B]">sua operação de vendas?</span>
            </>
          )}
        </h2>

        {/* Subtitle com Azul Leitura Neon no Dark Mode */}
        <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-[#70d6ff] mb-8 leading-relaxed font-normal">
          {description}
        </p>

        {/* Botão de Ação Principal */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <Button
            variant="electric"
            size="pill"
            onClick={onCtaClick}
            className="flex items-center gap-2 text-sm sm:text-base shadow-xl"
          >
            <span>Acessar Plataforma Agora</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            variant="secondary"
            size="pill"
            onClick={onCtaClick}
            className="text-sm font-semibold"
          >
            Agendar Demonstração VIP
          </Button>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-black/5 dark:border-white/10 text-xs font-mono font-medium">
          <div className="flex items-center justify-center gap-2 text-[#0284c7] dark:text-[#00D4FF]">
            <Lock className="w-4 h-4" />
            <span>100% LGPD & Multi-Tenant</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-[#3f6212] dark:text-[#D4F434]">
            <Zap className="w-4 h-4" />
            <span>Setup Rápido em &lt; 15 min</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Disponibilidade 99.98% SLA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
