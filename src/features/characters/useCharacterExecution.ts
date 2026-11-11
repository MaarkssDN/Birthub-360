import { useCallback, useRef, useState } from 'react';
import { readSseStream, sseRequestInit } from '../../lib/sse.js';
import type { SwarmEvent } from '../intelligence/agents/supervisor.agent.js';
import type { CharacterState } from './characterCatalog.js';
import {
  mapSwarmEventToOperationalState,
  type OperationalState,
  operationalStateToCharacterState,
} from './characterRuntime.js';

/**
 * Execução real de missão via Supervisor 00 (`/api/agent/swarm/stream`).
 *
 * - `executionId` = sessionId enviado ao enxame (idempotência no backend:
 *   mesmo id nunca executa 2x por organização).
 * - Estados derivados EXCLUSIVAMENTE de eventos SSE reais — nunca de timers.
 * - `queued` é um evento SSE real emitido pelo gate de concorrência.
 */

export interface ExecutionEvent {
  at: string;
  kind: 'info' | 'routing' | 'result' | 'error' | 'system';
  label: string;
  detail?: string;
}

export interface CharacterExecution {
  executionId: string | null;
  operationalState: OperationalState;
  /** Estado visual derivado (data-state do avatar). */
  visualState: CharacterState;
  running: boolean;
  output: string;
  error: string | null;
  activeAgent: string | null;
  events: ExecutionEvent[];
}

const INITIAL: CharacterExecution = {
  executionId: null,
  operationalState: 'available',
  visualState: 'idle',
  running: false,
  output: '',
  error: null,
  activeAgent: null,
  events: [],
};

function pushEvent(
  events: ExecutionEvent[],
  kind: ExecutionEvent['kind'],
  label: string,
  detail?: string,
): ExecutionEvent[] {
  return [...events, { at: new Date().toISOString(), kind, label, detail }];
}

export function useCharacterExecution(characterId: string) {
  const [exec, setExec] = useState<CharacterExecution>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setExec(INITIAL);
  }, []);

  const run = useCallback(
    async (mission: string) => {
      const trimmed = mission.trim();
      if (!trimmed || exec.running) return;

      const executionId = crypto.randomUUID();
      const controller = new AbortController();
      abortRef.current = controller;

      setExec({
        ...INITIAL,
        executionId,
        running: true,
        operationalState: 'processing',
        visualState: 'processing',
        events: pushEvent(
          [],
          'system',
          'Missão enviada ao Supervisor 00',
          `executionId: ${executionId}`,
        ),
      });

      try {
        const response = await fetch(
          '/api/agent/swarm/stream',
          sseRequestInit(
            {
              mission: `[Personagem: ${characterId}] ${trimmed}`,
              sessionId: executionId,
              characterId,
            },
            controller.signal,
          ),
        );

        await readSseStream(response, (evt) => {
          if (evt.event === 'queued') {
            try {
              const q = JSON.parse(evt.data) as { position?: number };
              setExec((prev) => ({
                ...prev,
                operationalState: 'queued',
                visualState: operationalStateToCharacterState('queued'),
                events: pushEvent(
                  prev.events,
                  'info',
                  'Aguardando slot de execução',
                  q.position ? `posição ${q.position} na fila` : undefined,
                ),
              }));
            } catch {
              /* frame malformado — ignora */
            }
            return;
          }

          if (evt.event === 'end') {
            setExec((prev) => ({
              ...prev,
              running: false,
              operationalState: 'completed',
              visualState: 'success',
              events: pushEvent(prev.events, 'system', 'Execução concluída'),
            }));
            return;
          }

          if (evt.event === 'error') {
            let message = evt.data;
            try {
              const parsed = JSON.parse(evt.data);
              message =
                typeof parsed === 'string' ? parsed : (parsed?.message ?? parsed?.type ?? evt.data);
            } catch {
              /* data já é texto */
            }
            setExec((prev) => ({
              ...prev,
              running: false,
              operationalState: 'error',
              visualState: 'error',
              error: String(message),
              events: pushEvent(prev.events, 'error', 'Falha na execução', String(message)),
            }));
            return;
          }

          // Frames de dados do enxame (SwarmEvent)
          try {
            const parsed = JSON.parse(evt.data) as SwarmEvent & { type?: string };
            const state = mapSwarmEventToOperationalState(parsed);
            setExec((prev) => {
              let events = prev.events;
              let output = prev.output;
              let error = prev.error;
              let activeAgent = prev.activeAgent;

              if (parsed.type === 'routing') {
                activeAgent = parsed.nextAgent || parsed.agent || activeAgent;
                events = pushEvent(
                  events,
                  'routing',
                  `Delegação: ${parsed.agent === 'supervisor' ? 'Supervisor 00' : parsed.agent}`,
                  parsed.nextAgent ? `próximo: ${parsed.nextAgent}` : parsed.reasoning,
                );
              } else if (parsed.type === 'agent_result') {
                if (parsed.content)
                  output = output ? `${output}\n\n${parsed.content}` : parsed.content;
                if (parsed.reasoning) {
                  events = pushEvent(
                    events,
                    'result',
                    `Resultado de ${parsed.agent}`,
                    parsed.reasoning,
                  );
                }
              } else if (parsed.type === 'agent_error') {
                error = parsed.content || 'Erro no agente especialista.';
                events = pushEvent(events, 'error', `Erro em ${parsed.agent}`, parsed.content);
              } else if (parsed.type === 'final') {
                if (parsed.content)
                  output = output ? `${output}\n\n${parsed.content}` : parsed.content;
              }

              return {
                ...prev,
                operationalState: state,
                visualState: operationalStateToCharacterState(state),
                activeAgent,
                output,
                error,
                events,
              };
            });
          } catch {
            /* frame não-JSON — ignora */
          }
        });

        // Stream encerrou sem 'end'/'error' explícito — marca concluído.
        setExec((prev) =>
          prev.running
            ? {
                ...prev,
                running: false,
                operationalState: 'completed',
                visualState: 'success',
                events: pushEvent(prev.events, 'system', 'Stream encerrado'),
              }
            : prev,
        );
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          setExec((prev) => ({
            ...prev,
            running: false,
            operationalState: 'error',
            visualState: 'error',
            error: 'Execução cancelada pelo usuário.',
            events: pushEvent(prev.events, 'system', 'Execução cancelada'),
          }));
        } else {
          setExec((prev) => ({
            ...prev,
            running: false,
            operationalState: 'error',
            visualState: 'error',
            error: err?.message || 'Falha de conexão com o enxame.',
            events: pushEvent(prev.events, 'error', 'Falha de conexão', err?.message),
          }));
        }
      } finally {
        abortRef.current = null;
      }
    },
    [characterId, exec.running],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { exec, run, cancel, reset };
}
