import { Check, Sparkles } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { cn } from '../../lib/utils.js';
import { Button } from './Button.js';

export interface PricingPlan {
  id: string;
  name: string;
  badge?: string;
  priceMonthly: string;
  priceAnnual: string;
  period: string;
  description: string;
  features: string[];
  ctaText: string;
  popular?: boolean;
  titleColor: string;
  descColor: string;
  accentColor: string;
}

const DEFAULT_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Growth Core',
    priceMonthly: 'R$ 2.490',
    priceAnnual: 'R$ 1.990',
    period: '/mês',
    description:
      'Para operações comerciais que precisam estruturar cadência e enriquecimento de dados.',
    titleColor: 'text-[#0284c7] dark:text-[#00D4FF]',
    descColor: 'text-slate-600 dark:text-[#94d2f8]',
    accentColor: '#00D4FF',
    features: [
      'Até 5 assentos SDR / Closer',
      'Enriquecimento de 2.000 contas ICP/mês',
      'Pipeline 360° com Kanban comercial',
      'Integração Bitrix24 ou CRM único',
      'Cadência e automações de follow-up',
    ],
    ctaText: 'Iniciar com Growth',
    popular: false,
  },
  {
    id: 'scale',
    name: 'Enterprise OS',
    badge: 'Mais Adotado por Líderes Comerciais',
    priceMonthly: 'R$ 5.900',
    priceAnnual: 'R$ 4.720',
    period: '/mês',
    description:
      'O sistema operacional completo com Enxame de Agentes IA e orquestração de receita.',
    titleColor: 'text-[#3f6212] dark:text-[#D4F434]',
    descColor: 'text-slate-700 dark:text-[#dcf0a5]',
    accentColor: '#D4F434',
    features: [
      'Assentos ilimitados SDR + Closers',
      'Enriquecimento de 10.000 contas ICP/mês',
      'Enxame de Agentes de IA Autônomos (SDR & NBA)',
      'Multi-CRM bidirecional (Bitrix24, Salesforce, HubSpot)',
      'Discador 3CX e WhatsApp Business integrados',
      'Forecast preditivo com modelagem estatística',
      'SLA corporativo com suporte dedicado',
    ],
    ctaText: 'Acelerar com Enterprise OS',
    popular: true,
  },
  {
    id: 'custom',
    name: 'Swarm Dedicated',
    priceMonthly: 'Sob Consulta',
    priceAnnual: 'Sob Consulta',
    period: '',
    description:
      'Para grandes corporações com requisitos avançados de governança, infraestrutura e IA dedicada.',
    titleColor: 'text-[#d97706] dark:text-[#F59E0B]',
    descColor: 'text-slate-600 dark:text-[#fed7aa]',
    accentColor: '#F59E0B',
    features: [
      'Instância isolada ou On-Premise VPC',
      'Treinamento de LLMs com dados proprietários',
      'Governança de privacidade LGPD personalizada',
      'Workflows customizados e agentes de nicho',
      'Engenheiro de implantação e CS dedicado 24/7',
    ],
    ctaText: 'Falar com Especialista',
    popular: false,
  },
];

export interface PricingSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  onSelectPlan?: (planId: string) => void;
}

export function PricingSection({ onSelectPlan, className, ...props }: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  return (
    <div className={cn('w-full max-w-7xl mx-auto py-8', className)} {...props}>
      {/* Switch de Ciclo de Faturamento */}
      <div className="flex items-center justify-center mb-12">
        <div className="inline-flex items-center p-1.5 rounded-full bg-slate-200/80 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              'px-5 py-2 rounded-full font-sans text-xs sm:text-sm font-bold transition-all cursor-pointer',
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-[#1C1E24] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
            )}
          >
            Faturamento Mensal
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={cn(
              'flex items-center gap-2 px-5 py-2 rounded-full font-sans text-xs sm:text-sm font-bold transition-all cursor-pointer',
              billingCycle === 'annual'
                ? 'bg-[#121316] text-[#D4F434] dark:bg-[#D4F434] dark:text-[#121316] shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
            )}
          >
            <span>Anual</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono tracking-wider bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30">
              -20% OFF
            </span>
          </button>
        </div>
      </div>

      {/* Grid de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {DEFAULT_PLANS.map((plan) => {
          const isPop = plan.popular;
          return (
            <div
              key={plan.id}
              className={cn(
                'relative flex flex-col justify-between rounded-3xl p-7 sm:p-8 transition-all duration-300',
                isPop
                  ? 'border-2 border-[#D4F434] bg-gradient-to-b from-white via-lime-50/20 to-white dark:from-[#171D12] dark:via-[#141810] dark:to-[#0F130B] shadow-[0_16px_50px_rgba(212,244,52,0.18)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)] scale-100 md:scale-[1.03] z-10'
                  : 'border border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#121317]/80 backdrop-blur-xl shadow-md hover:border-black/15 dark:hover:border-white/20',
              )}
            >
              {/* Badge Pop */}
              {isPop && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-[#121316] text-[#D4F434] border border-[#D4F434]/40 font-mono text-[11px] font-bold uppercase tracking-wider shadow-md">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4F434]" />
                    {plan.badge}
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3
                    className={cn(
                      'font-display text-2xl font-extrabold tracking-tight',
                      plan.titleColor,
                    )}
                  >
                    {plan.name}
                  </h3>
                </div>

                <p
                  className={cn(
                    'text-xs sm:text-sm mb-6 leading-relaxed font-normal',
                    plan.descColor,
                  )}
                >
                  {plan.description}
                </p>

                {/* Preço */}
                <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-black/5 dark:border-white/10">
                  <span
                    className={cn(
                      'font-display text-3xl sm:text-4xl font-extrabold',
                      isPop
                        ? 'text-[#3f6212] dark:text-[#D4F434]'
                        : 'text-slate-900 dark:text-slate-100',
                    )}
                  >
                    {billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly}
                  </span>
                  {plan.period && (
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {plan.period}
                    </span>
                  )}
                </div>

                {/* Lista de Features */}
                <div className="space-y-3 mb-8">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Inclui na plataforma:
                  </span>
                  <ul className="space-y-2.5">
                    {plan.features.map((feat) => (
                      <li
                        key={feat}
                        className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300"
                      >
                        <Check
                          className={cn(
                            'w-4 h-4 shrink-0 mt-0.5',
                            isPop ? 'text-[#D4F434]' : 'text-[#00D4FF]',
                          )}
                        />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Botão de Ação */}
              <Button
                variant={isPop ? 'electric' : 'secondary'}
                size="lg"
                className="w-full font-bold uppercase tracking-wider text-xs sm:text-sm"
                onClick={() => onSelectPlan?.(plan.id)}
              >
                {plan.ctaText}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
