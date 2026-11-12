import { Database, Server, Sparkles } from 'lucide-react';
import { Spinner, Tooltip } from '../../../components/design-system/index.js';
import type { ReadyFetchState } from './overviewTypes.js';

interface OverviewHeaderProps {
  readyState: ReadyFetchState;
  today: Date;
}

export function OverviewHeader({ readyState, today }: OverviewHeaderProps) {
  return (
    <>
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {today.toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 font-sans tracking-tight mt-1">
            Birth Hub 360 Executive
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-xl">
            Plataforma omnicanal de IA de voz para prospecção e atendimento.
          </p>
        </div>

        {/* PLATFORM READINESS — real data from GET /api/ready (database + redis), not a
            decorative "everything is green" claim. */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 w-full lg:w-auto">
          <div className="text-left mr-2 lg:border-r border-slate-200 dark:border-slate-700 pr-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Status da Plataforma</p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono">
              {today.toLocaleTimeString('pt-BR')} (UTC-3)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            {readyState.status === 'loading' && (
              <span className="flex items-center gap-1.5 text-slate-400">
                <Spinner size="sm" /> Verificando...
              </span>
            )}
            {readyState.status === 'error' && (
              <span className="flex items-center gap-1.5 text-red-500">
                <span className="h-2 w-2 rounded-full bg-red-500" /> Indisponível
              </span>
            )}
            {readyState.status === 'ready' && (
              <>
                <Tooltip text="Conexão com o banco de dados (PostgreSQL)">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Database className="h-3 w-3" />
                    <span
                      className={`h-2 w-2 rounded-full ${readyState.checks?.database === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}
                    />
                    Banco de Dados
                  </span>
                </Tooltip>
                <Tooltip text="Fila/cache Redis (sessões, idempotência)">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Server className="h-3 w-3" />
                    <span
                      className={`h-2 w-2 rounded-full ${readyState.checks?.redis === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}
                    />
                    Redis
                  </span>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
