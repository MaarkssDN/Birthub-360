import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  ShieldCheck,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  type HeroVariant,
  trackRoiSimulatorConverted,
} from '../../../lib/analytics/conversionTelemetry.js';
import { SoundFX } from '../../../lib/soundEffects.js';

export interface RoiSimulatorModalProps {
  isOpen: boolean;
  variant?: HeroVariant;
  onClose: () => void;
  onProceedToLogin: () => void;
}

export function RoiSimulatorModal({
  isOpen,
  variant = 'A',
  onClose,
  onProceedToLogin,
}: RoiSimulatorModalProps) {
  // Parâmetros operacionais com valores padrão executivos
  const [dealsCount, setDealsCount] = useState<number>(50);
  const [avgTicket, setAvgTicket] = useState<number>(30000);
  const [leakRate, setLeakRate] = useState<number>(35);

  const modalRef = useRef<HTMLDivElement>(null);

  // Cálculos dinâmicos de impacto financeiro
  const pipelineTotal = dealsCount * avgTicket;
  const monthlyLeakedRevenue = pipelineTotal * (leakRate / 100);
  // Recuperação comprovada de até 34% dos negócios que seriam perdidos
  const monthlyRecoverableRevenue = monthlyLeakedRevenue * 0.34;
  const annualRecoverableRevenue = monthlyRecoverableRevenue * 12;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleAction = () => {
    SoundFX.play('confirm');
    trackRoiSimulatorConverted(variant, {
      dealsCount,
      avgTicket,
      leakRate,
      recoverableMonthly: monthlyRecoverableRevenue,
      annualRecoverable: annualRecoverableRevenue,
    });
    onClose();
    onProceedToLogin();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="roi-modal-title"
      ref={modalRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          SoundFX.play('click');
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-2xl my-8 rounded-2xl sm:rounded-3xl border border-slate-700 bg-slate-900/95 dark:bg-[#0f1422]/98 text-slate-100 shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Header do Simulador */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/15 border border-[#00D4FF]/40 flex items-center justify-center text-[#00D4FF]">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="roi-modal-title"
                className="font-display text-base sm:text-lg font-bold text-cyan-400"
              >
                Simulador Executivo de Previsibilidade & ROI
              </h2>
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                Auditoria de Vazamento de Pipeline Comercial
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              SoundFX.play('click');
              onClose();
            }}
            aria-label="Fechar simulador"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Sliders e Resultados */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Controles / Sliders */}
          <div className="space-y-4">
            {/* Slider 1: Deals Ativos */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <label htmlFor="deals-slider" className="text-slate-300 font-semibold">
                  Oportunidades em Andamento por Mês:
                </label>
                <span className="px-2.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold">
                  {dealsCount} deals
                </span>
              </div>
              <input
                id="deals-slider"
                type="range"
                min="10"
                max="300"
                step="5"
                value={dealsCount}
                onChange={(e) => setDealsCount(Number(e.target.value))}
                className="w-full accent-[#00D4FF] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-300">
                <span>10 deals</span>
                <span>150 deals</span>
                <span>300+ deals</span>
              </div>
            </div>

            {/* Slider 2: Ticket Médio */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <label htmlFor="ticket-slider" className="text-slate-300 font-semibold">
                  Ticket Médio por Negócio:
                </label>
                <span className="px-2.5 py-0.5 rounded bg-slate-800 text-pink-400 font-bold">
                  {formatCurrency(avgTicket)}
                </span>
              </div>
              <input
                id="ticket-slider"
                type="range"
                min="5000"
                max="150000"
                step="5000"
                value={avgTicket}
                onChange={(e) => setAvgTicket(Number(e.target.value))}
                className="w-full accent-[#FF2D9B] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-300">
                <span>R$ 5.000</span>
                <span>R$ 75.000</span>
                <span>R$ 150.000+</span>
              </div>
            </div>

            {/* Slider 3: Taxa de Perda / Fricção */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <label
                  htmlFor="leak-slider"
                  className="text-slate-300 font-semibold flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Taxa Atual de Perda por Falta de Follow-up:
                </label>
                <span className="px-2.5 py-0.5 rounded bg-slate-800 text-amber-400 font-bold">
                  {leakRate}%
                </span>
              </div>
              <input
                id="leak-slider"
                type="range"
                min="10"
                max="60"
                step="5"
                value={leakRate}
                onChange={(e) => setLeakRate(Number(e.target.value))}
                className="w-full accent-[#F59E0B] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-300">
                <span>10% (Funil Maduro)</span>
                <span>35% (Média de Mercado)</span>
                <span>60% (Sem Cadência)</span>
              </div>
            </div>
          </div>

          {/* Card de Impacto Projetado */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-rose-500/30">
                <div className="text-[11px] font-mono text-rose-400 uppercase font-semibold">
                  Receita Mensal em Risco
                </div>
                <div className="font-display text-xl font-black text-rose-300 mt-1">
                  {formatCurrency(monthlyLeakedRevenue)}
                  <span className="text-xs font-normal text-slate-200 font-mono block">
                    por estagnação no funil
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <div className="text-[11px] font-mono text-emerald-400 uppercase font-semibold flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Receita Resgatável com IA
                </div>
                <div className="font-display text-xl font-black text-emerald-300 mt-1">
                  {formatCurrency(monthlyRecoverableRevenue)}
                  <span className="text-xs font-normal text-emerald-400/80 font-mono block">
                    + {formatCurrency(annualRecoverableRevenue)} / ano
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono text-slate-200">
              <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>+15 horas semanais</strong> liberadas por vendedor ao automatizar
                preenchimento de CRM e cadências de contato.
              </span>
            </div>
          </div>

          {/* CTA de Decisão Imediata */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleAction}
              className="btn-cta-light w-full py-4 rounded-xl font-mono text-sm sm:text-base font-bold uppercase tracking-wider flex items-center justify-center gap-3 cursor-pointer shadow-lg hover:shadow-[0_0_25px_rgba(0,212,255,0.4)] transition-all"
            >
              <span>Recuperar Minha Receita no BirthHub 360°</span>
              <ArrowRight className="w-5 h-5 text-slate-950" />
            </button>

            <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-slate-200">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Sem compromisso
              </span>
              <span>•</span>
              <span>Setup em 5 minutos</span>
              <span>•</span>
              <span>Multi-CRM Pronto</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
