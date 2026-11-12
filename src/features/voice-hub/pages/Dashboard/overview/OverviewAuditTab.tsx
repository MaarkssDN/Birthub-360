import { ShieldCheck } from 'lucide-react';
import { Card } from '../../../components/design-system/index.js';

export function OverviewAuditTab() {
  return (
    <Card className="p-8 space-y-8 animate-fade-in text-left">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-750 pb-4">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-iris dark:text-iris rounded-lg">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            UX Audit Report — Birth Hub 360
          </h2>
          <p className="text-sm text-slate-500">
            Mapeamento da jornada do usuário e otimização de fluxos de onboarding.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Fricções & Gargalos Identificados
          </h3>
          <div className="space-y-3 font-medium text-xs leading-relaxed text-slate-650 dark:text-slate-300">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Cadastro & Primeiros Passos
              </p>
              <p className="mt-1 text-slate-500">
                O usuário caía em uma tela vazia sem instruções de "qual ação tomar". O Onboarding
                Wizard de 4 fases elimina essa ambiguidade.
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Painel executivo com dados de exemplo
              </p>
              <p className="mt-1 text-slate-500">
                A Visão Geral exibia KPIs de negócio (tokens, custo, CSAT, SLA, latência) fixos no
                código, sem fonte de dado real — corrigido nesta revisão: só métricas reais
                (agentes, chamadas) aparecem como número; o restante mostra estado vazio explícito
                até existir telemetria real.
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Sessão do usuário não identificada
              </p>
              <p className="mt-1 text-slate-500">
                O shell (barra lateral) lia um cookie que o servidor nunca definia, mostrando sempre
                um usuário de exemplo fixo. Corrigido: a sessão real vem de GET /api/auth/me.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Soluções Aplicadas
          </h3>
          <div className="space-y-3 font-medium text-xs leading-relaxed text-slate-650 dark:text-slate-300">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Onboarding Direcionado
              </p>
              <p className="mt-1 text-slate-500">
                Wizard reativo exibe a porcentagem real de finalização do checklist, persistida no
                servidor.
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Estados explícitos de loading/erro/vazio
              </p>
              <p className="mt-1 text-slate-500">
                Toda seção com dado remoto mostra esqueleto de carregamento, mensagem de erro com
                retry, ou estado vazio — nunca um número inventado no lugar do dado ainda não
                carregado.
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Sessão e navegação coerentes
              </p>
              <p className="mt-1 text-slate-500">
                Expiração de sessão em qualquer chamada autenticada redireciona para o Login em vez
                de deixar a tela travada com dado obsoleto.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
