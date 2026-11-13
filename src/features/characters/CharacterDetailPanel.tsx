import { motion } from 'framer-motion';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  CircleDot,
  Loader2,
  Route,
  Send,
  Square,
  X,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import type { CharacterApiEntry } from './characterApiTypes.js';
import { OPERATIONAL_STATES, type OperationalState } from './characterRuntime.js';
import { useCharacterExecution } from './useCharacterExecution.js';

const STATE_LABELS: Record<OperationalState, string> = {
  available: 'Disponível',
  queued: 'Aguardando',
  processing: 'Processando',
  delegating: 'Delegando',
  completed: 'Concluído',
  error: 'Erro',
  blocked: 'Bloqueado',
  unavailable: 'Indisponível',
};

const RUNTIME_STATUS_LABELS: Record<string, string> = {
  available: 'Disponível',
  degraded: 'Degradado',
  unavailable: 'Indisponível',
};

const STATE_COLORS: Record<OperationalState, string> = {
  available: 'var(--ok)',
  queued: 'var(--warn)',
  processing: 'var(--brand)',
  delegating: 'var(--iris)',
  completed: 'var(--ok)',
  error: 'var(--red)',
  blocked: 'var(--color-warning)',
  unavailable: 'var(--ink-2)',
};

function StateBadge({ state }: { state: OperationalState }) {
  const color = STATE_COLORS[state];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border"
      style={{
        color,
        borderColor: `color-mix(in srgb, ${color} 33%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)`,
      }}
      data-testid={`state-badge-${state}`}
    >
      <CircleDot className="w-3 h-3" aria-hidden="true" />
      {STATE_LABELS[state]}
    </span>
  );
}

export function CharacterDetailPanel({
  entry,
  onClose,
}: {
  entry: CharacterApiEntry;
  onClose: () => void;
}) {
  const [mission, setMission] = useState('');
  const { exec, run, cancel } = useCharacterExecution(entry.id);
  const canExecute =
    entry.runtime.dispatch === 'swarm-stream' && entry.runtime.status === 'available';

  return (
    <motion.aside
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      className="fixed inset-y-0 right-0 z-[950] w-full max-w-md border-l border-white/10 bg-[#0B0F1A]/95 backdrop-blur-xl flex flex-col"
      role="dialog"
      aria-label={`Detalhes do personagem ${entry.name}`}
      data-testid="character-detail-panel"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="bh-character-avatar flex items-center justify-center w-12 h-12 rounded-full shrink-0"
            data-state={exec.visualState}
            style={{
              background: `linear-gradient(135deg, ${entry.palette.primary}33, ${entry.palette.secondary}1f)`,
              boxShadow: entry.palette.halo,
            }}
          >
            <img src={entry.svg} alt={entry.ariaLabel} className="w-8 h-8" />
          </div>
          <div className="min-w-0">
            <h2
              className="font-bold text-sm truncate"
              style={{ color: entry.headingColor, fontFamily: 'Sora, sans-serif' }}
            >
              {entry.name}
            </h2>
            <p className="text-[11px] truncate" style={{ color: entry.subheadingColor }}>
              {entry.role}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar detalhes do personagem"
          className="p-1.5 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Status operacional */}
        <section aria-label="Estado operacional">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-mono uppercase tracking-wide text-white/50">Estado</h3>
            <StateBadge state={exec.operationalState} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {OPERATIONAL_STATES.map((s) => (
              <span
                key={s}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: STATE_COLORS[s],
                  opacity: exec.operationalState === s ? 1 : 0.25,
                }}
                title={STATE_LABELS[s]}
              />
            ))}
          </div>
        </section>

        {/* Vínculo runtime */}
        <section aria-label="Vínculo com agente" className="space-y-2">
          <h3 className="text-[11px] font-mono uppercase tracking-wide text-white/50">
            Vínculo operacional
          </h3>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-mono">
            <div>
              <dt className="text-white/40">Camada</dt>
              <dd className="text-white/80">{entry.layer}</dd>
            </div>
            <div>
              <dt className="text-white/40">Agente</dt>
              <dd className="text-white/80 break-all">
                {entry.linkedAgentId ?? entry.contextGroup ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-white/40">Runtime</dt>
              <dd className="text-white/80">{entry.runtime.kind}</dd>
            </div>
            <div>
              <dt className="text-white/40">Status</dt>
              <dd className="text-white/80">
                {RUNTIME_STATUS_LABELS[entry.runtime.status] ?? entry.runtime.status}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-white/40">Dispatch</dt>
              <dd className="text-white/80">{entry.runtime.dispatch}</dd>
            </div>
            {entry.runtime.httpRoute && (
              <div className="col-span-2">
                <dt className="text-white/40">Rota real</dt>
                <dd className="text-brand break-all">{entry.runtime.httpRoute}</dd>
              </div>
            )}
            {entry.runtime.reason && (
              <div className="col-span-2">
                <dt className="text-white/40">Motivo</dt>
                <dd className="text-amber-300/90">{entry.runtime.reason}</dd>
              </div>
            )}
          </dl>
        </section>

        {/* Capacidades */}
        {entry.runtime.capabilities.length > 0 && (
          <section aria-label="Capacidades">
            <h3 className="text-[11px] font-mono uppercase tracking-wide text-white/50 mb-2">
              Capacidades
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {entry.runtime.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-white/70"
                >
                  {cap}
                </span>
              ))}
            </div>
          </section>
        )}

        {entry.runtime.requiresApproval && (
          <p className="text-[11px] text-amber-300/90 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Agente exige aprovação para operações de escrita.
          </p>
        )}

        {/* Execução via Supervisor 00 */}
        <section aria-label="Execução de missão" className="space-y-2">
          <h3 className="text-[11px] font-mono uppercase tracking-wide text-white/50 flex items-center gap-1.5">
            <Route className="w-3.5 h-3.5" /> Missão via Supervisor 00
          </h3>

          {!canExecute ? (
            <p className="text-[11px] text-white/50">
              {entry.runtime.dispatch === 'module-surface'
                ? 'Este agente executa pela superfície do próprio módulo (rota dedicada).'
                : 'Sem caminho de execução hoje — vínculo indisponível ou bloqueado.'}
            </p>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !exec.running) {
                      e.preventDefault();
                      void run(mission);
                    }
                  }}
                  placeholder={`Missão para ${entry.name} via Supervisor...`}
                  aria-label={`Missão para o agente ${entry.name}`}
                  disabled={exec.running}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-brand/50 disabled:opacity-50"
                />
                {exec.running ? (
                  <button
                    type="button"
                    onClick={cancel}
                    aria-label="Cancelar execução"
                    className="px-3 py-2 rounded-lg bg-red-600/80 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <Square className="w-3 h-3 fill-current" /> Parar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void run(mission)}
                    disabled={!mission.trim()}
                    aria-label="Enviar missão"
                    className="px-3 py-2 rounded-lg bg-brand text-on-brand text-xs font-bold flex items-center gap-1 disabled:opacity-40"
                  >
                    <Send className="w-3 h-3" /> Enviar
                  </button>
                )}
              </div>

              {exec.executionId && (
                <p className="text-[10px] font-mono text-white/40 break-all">
                  executionId: {exec.executionId}
                  {exec.activeAgent && <> · agente: {exec.activeAgent}</>}
                </p>
              )}

              {/* Resultado */}
              {exec.output && (
                <div className="rounded-lg bg-white/[0.03] border border-white/10 p-3 text-[11px] text-white/85 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {exec.output}
                </div>
              )}
              {exec.error && (
                <div
                  role="alert"
                  className="rounded-lg bg-red-950/50 border border-red-500/30 p-3 text-[11px] text-red-200 flex items-start gap-2"
                >
                  <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  {exec.error}
                </div>
              )}

              {/* Timeline de eventos reais */}
              {exec.events.length > 0 && (
                <ol className="space-y-1 max-h-44 overflow-y-auto" aria-label="Eventos da execução">
                  {exec.events.map((ev, i) => (
                    <li key={i} className="flex items-start gap-2 text-[10px] font-mono">
                      {ev.kind === 'error' ? (
                        <XCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                      ) : ev.kind === 'routing' ? (
                        <Bot className="w-3 h-3 text-iris mt-0.5 shrink-0" />
                      ) : ev.kind === 'result' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                      ) : (
                        <Loader2 className="w-3 h-3 text-brand mt-0.5 shrink-0" />
                      )}
                      <span className="text-white/70">
                        {ev.label}
                        {ev.detail && <span className="text-white/40"> — {ev.detail}</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </section>

        <p className="text-[10px] text-white/30 font-mono">
          id: {entry.id} · command: {entry.command}
        </p>
      </div>
    </motion.aside>
  );
}
