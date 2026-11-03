import type React from 'react';
import { cn } from '../../lib/utils.js';

export interface HeroMockupProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  badge?: string;
  children: React.ReactNode;
}

export function HeroMockup({
  title = 'Birth Hub 360° · Revenue Command Center',
  badge = 'Produção · v4.2 Enterprise',
  children,
  className,
  ...props
}: HeroMockupProps) {
  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-6xl transition-all duration-500 group',
        className,
      )}
      {...props}
    >
      {/* Halo de fundo atmosférico */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1 sm:-inset-2 rounded-3xl sm:rounded-[36px] bg-gradient-to-b from-[#00D4FF]/20 via-[#D4F434]/10 to-transparent blur-2xl opacity-60 dark:opacity-40 group-hover:opacity-80 transition-opacity"
      />

      {/* Moldura da Janela Spatial */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/15 bg-white/95 dark:bg-[#141519]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Barra superior de comando da janela */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-black/5 dark:border-white/10 bg-slate-50/70 dark:bg-[#18191E]/80 backdrop-blur-md">
          {/* Controles de janela */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-600/40" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/40" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/40" />
            <span className="ml-2 font-mono text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
              {title}
            </span>
          </div>

          {/* Badge de status central */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/60 dark:bg-white/5 border border-black/5 dark:border-white/10">
            <span className="w-2 h-2 rounded-full bg-[#D4F434] shadow-[0_0_8px_#D4F434] animate-pulse" />
            <span className="font-mono text-[10px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase">
              {badge}
            </span>
          </div>

          {/* Ações / URL simulada */}
          <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400">
              https://app.birthhub360.com.br
            </span>
          </div>
        </div>

        {/* Conteúdo Renderizado do Mockup */}
        <div className="relative p-2 sm:p-4 bg-slate-100/50 dark:bg-[#0D0E11]/60">{children}</div>
      </div>
    </div>
  );
}
