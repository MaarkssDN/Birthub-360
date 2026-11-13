// Server-facing workflow actions for the Voice Hub studio, extracted from useStudioStore.ts
// (TAREFA-SANEAMENTO-008 / BT360-DT-0063): AI refactor/generation (Catarina AI), publish and the
// version-history/rollback panel. Same factory pattern as workflowPersistence.ts — the store
// spreads these actions and passes `() => workflowEpoch` so async responses are still dropped
// when the workflow context changed mid-flight (no cross-workflow writes).
import { validationEngine } from '../../../lib/studio/ValidationEngine.js';
import { clientLogger as logger } from '../../../lib/clientLogger.js';
import type { NodeLifecycleState, StudioState } from './studioTypes.js';
import type { ValidationIssue, WorkflowVersionSummary } from '../lib/studio/types.js';

type SetStudioState = (
  state: Partial<StudioState> | ((state: StudioState) => Partial<StudioState>),
) => void;

export function createStudioServerActions(
  get: () => StudioState,
  set: SetStudioState,
  getEpoch: () => number,
): Pick<
  StudioState,
  | 'applyAiRefactor'
  | 'generateWorkflowFromPrompt'
  | 'publishWorkflowToServer'
  | 'openVersionHistory'
  | 'closeVersionHistory'
  | 'fetchWorkflowVersions'
  | 'rollbackWorkflowToVersion'
> {
  return {
    // AI Flow Refactoring and Generation
    applyAiRefactor: async (mode) => {
      const epoch = getEpoch();
      get().addSimulationLog({
        type: 'event',
        message: `Enviando fluxo ativo para a Catarina AI para refatoração real (modo: ${mode})...`,
      });

      try {
        const response = await fetch('/api/ai/refactor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, nodes: get().nodes }),
        });

        if (!response.ok) {
          throw new Error(`Erro na API: ${response.statusText}`);
        }

        const data = await response.json();
        if (epoch !== getEpoch()) return;
        if (data?.nodes) {
          set({ nodes: data.nodes });
          get().addSimulationLog({
            type: 'success',
            message: `Catarina AI completou a refatoração do grafo de execução visual usando IA real!`,
          });
        }
      } catch (err: unknown) {
        if (epoch !== getEpoch()) return;
        logger.error({ err }, 'Error applying AI refactor to workflow');
        const errMessage = err instanceof Error ? err.message : String(err);
        get().addSimulationLog({
          type: 'error',
          message: `Falha na refatoração real da Catarina AI: ${errMessage}. Revertendo para simulação offline local...`,
        });

        // Fallback local logic to guarantee the user's workflow never breaks
        set((state) => {
          const updatedNodes = state.nodes.map((n) => {
            if (n.type === 'prompt') {
              return {
                ...n,
                data: {
                  ...n.data,
                  label:
                    mode === 'moreHuman'
                      ? 'Atendimento Altamente Humanizado'
                      : 'Atendimento Otimizado AI',
                  config: {
                    ...n.data.config,
                    promptText:
                      mode === 'moreHuman'
                        ? 'Você é um assistente virtual empático, natural, que respira e usa pausas de voz para soar humano.'
                        : 'Responda de forma extremamente curta e concisa para economizar latência de áudio.',
                  },
                },
              };
            }
            if (n.type === 'llm') {
              return {
                ...n,
                data: {
                  ...n.data,
                  config: {
                    ...n.data.config,
                    model: mode === 'reduceCost' ? 'gemini-2.5-flash' : 'gemini-2.5-pro',
                    temperature: mode === 'simplify' ? 0.1 : 0.45,
                  },
                },
              };
            }
            return n;
          });
          return { nodes: updatedNodes };
        });
      }
    },

    generateWorkflowFromPrompt: async (prompt) => {
      const epoch = getEpoch();
      get().addSimulationLog({
        type: 'event',
        message: `Catarina AI está processando o prompt natural com Gemini real: "${prompt}"...`,
      });

      try {
        const response = await fetch('/api/ai/generate-workflow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          throw new Error(`Erro na API: ${response.statusText}`);
        }

        const data = await response.json();
        if (epoch !== getEpoch()) return;
        if (data?.nodes && data.edges) {
          const lifecycles: Record<string, NodeLifecycleState> = {};
          data.nodes.forEach((n: { id: string }) => {
            lifecycles[n.id] = 'Ready';
          });

          set({
            nodes: data.nodes,
            edges: data.edges,
            nodeLifecycles: lifecycles,
            selectedNodeId: null,
            activeSimulationNodeId: null,
          });

          get().addSimulationLog({
            type: 'success',
            message: `Catarina AI (Gemini Real) gerou um grafo completo contendo ${data.nodes.length} nodes e ${data.edges.length} conexões com sucesso!`,
          });
        }
      } catch (err: unknown) {
        if (epoch !== getEpoch()) return;
        logger.error({ err }, 'Error generating workflow from prompt');
        const errMessage = err instanceof Error ? err.message : String(err);
        get().addSimulationLog({
          type: 'error',
          message: `Falha na geração real de fluxo: ${errMessage}.`,
        });
      }
    },

    publishWorkflowToServer: async () => {
      const epoch = getEpoch();
      const { nodes, edges } = get();

      // Fast local pre-check so an obviously-broken flow doesn't even round-trip: purely a UX
      // shortcut, NOT the enforcement point. The server independently re-runs ValidationEngine
      // against the persisted row and is the only thing allowed to set status: 'active'.
      const localResult = validationEngine.validate(nodes, edges);
      if (!localResult.isValid) {
        set({ publishState: 'error', publishIssues: localResult.issues });
        get().addSimulationLog({
          type: 'error',
          message: `Publicação bloqueada: ${localResult.issues.filter((i) => i.type === 'error').length} erro(s) de validação precisam ser corrigidos antes de ativar este fluxo.`,
        });
        return;
      }

      set({ publishState: 'publishing' });
      try {
        const res = await fetch('/api/voice-hub/workflow/publish', { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (epoch !== getEpoch()) return;

        if (res.ok) {
          set({
            publishState: 'success',
            publishIssues: [],
            workflowId: data.workflow?.id ?? get().workflowId,
          });
          get().addSimulationLog({
            type: 'success',
            message: 'Fluxo validado e publicado com sucesso. Status: ativo.',
          });
          // A fresh publish archives a new version — keep an already-open history panel current
          // instead of leaving it showing a now-stale list.
          if (get().isVersionHistoryOpen) {
            get().fetchWorkflowVersions();
          }
          return;
        }

        // 422 (ValidationFailedError) carries structured issues from the server-side re-check;
        // any other non-OK status is a generic failure with no issues to display.
        const issues: ValidationIssue[] = Array.isArray(data.issues) ? data.issues : [];
        set({ publishState: 'error', publishIssues: issues });
        get().addSimulationLog({
          type: 'error',
          message: `Falha ao publicar: ${data.error || res.statusText || 'erro desconhecido no servidor'}`,
        });
      } catch (err: any) {
        if (epoch !== getEpoch()) return;
        logger.error({ err }, 'Error publishing workflow to server');
        set({ publishState: 'error', publishIssues: [] });
        get().addSimulationLog({
          type: 'error',
          message: 'Falha ao publicar: não foi possível contatar o servidor.',
        });
      }
    },

    // "Histórico de Publicações": GET /workflow/:id/versions, tenant/workflow-scoped server-side
    // (workflowRepository.findWorkflowByIdForTenant — see workflowVersioning.test.ts). Never called
    // with any id other than this session's own `workflowId`, so a version list can never mix
    // tenants or workflows (AGENTS.md §15).
    openVersionHistory: () => {
      set({
        isVersionHistoryOpen: true,
        rollbackState: 'idle',
        rollbackIssues: [],
        rollbackError: null,
      });
      get().fetchWorkflowVersions();
    },

    closeVersionHistory: () => {
      set({ isVersionHistoryOpen: false });
    },

    fetchWorkflowVersions: async () => {
      const epoch = getEpoch();
      const { workflowId } = get();
      if (!workflowId) {
        // Nothing has round-tripped through the server yet (or nothing has ever been published) —
        // a real empty state, never a fabricated placeholder list.
        set({ workflowVersions: [], versionHistoryState: 'idle', versionHistoryError: null });
        return;
      }

      set({ versionHistoryState: 'loading', versionHistoryError: null });
      try {
        const res = await fetch(`/api/voice-hub/workflow/${workflowId}/versions`);
        const data = await res.json().catch(() => ({}));
        if (epoch !== getEpoch()) return;

        if (!res.ok) {
          set({
            versionHistoryState: 'error',
            workflowVersions: [],
            versionHistoryError:
              data.error || 'Não foi possível carregar o histórico de publicações.',
          });
          return;
        }

        const versions: WorkflowVersionSummary[] = Array.isArray(data.versions)
          ? data.versions
          : [];
        set({ versionHistoryState: 'idle', workflowVersions: versions, versionHistoryError: null });
      } catch (err: any) {
        if (epoch !== getEpoch()) return;
        logger.error({ err }, 'Error fetching workflow version history');
        set({
          versionHistoryState: 'error',
          workflowVersions: [],
          versionHistoryError: 'Não foi possível contatar o servidor.',
        });
      }
    },

    rollbackWorkflowToVersion: async (version: number) => {
      const epoch = getEpoch();
      const { workflowId } = get();
      if (!workflowId) return;

      set({
        rollbackState: 'rolling-back',
        rollbackTargetVersion: version,
        rollbackIssues: [],
        rollbackError: null,
      });

      try {
        const res = await fetch(
          `/api/voice-hub/workflow/${workflowId}/versions/${version}/rollback`,
          {
            method: 'POST',
          },
        );
        const data = await res.json().catch(() => ({}));
        if (epoch !== getEpoch()) return;

        if (res.ok && data.workflow) {
          const lifecycles: Record<string, NodeLifecycleState> = {};
          (Array.isArray(data.workflow.nodes) ? data.workflow.nodes : []).forEach(
            (n: { id: string }) => {
              lifecycles[n.id] = 'Ready';
            },
          );
          set({
            nodes: data.workflow.nodes || [],
            edges: data.workflow.edges || [],
            nodeLifecycles: lifecycles,
            workflowId: data.workflow.id ?? workflowId,
            rollbackState: 'success',
            rollbackTargetVersion: null,
          });
          get().addSimulationLog({
            type: 'success',
            message: `Rollback concluído: versão ${version} restaurada e publicada como v${data.workflow.version}.`,
          });
          // Rollback archives the version it superseded — refresh so the list reflects it.
          await get().fetchWorkflowVersions();
          return;
        }

        // 422 (ValidationFailedError) carries the same structured `issues` shape as
        // publishWorkflowToServer's rejection path — surfaced with the same ValidationIssuesList,
        // never a silent failure on a rejected rollback.
        const issues: ValidationIssue[] = Array.isArray(data.issues) ? data.issues : [];
        set({
          rollbackState: 'error',
          rollbackIssues: issues,
          rollbackError: data.error || 'Não foi possível restaurar esta versão.',
          rollbackTargetVersion: null,
        });
        get().addSimulationLog({
          type: 'error',
          message: `Falha ao restaurar versão ${version}: ${data.error || res.statusText || 'erro desconhecido no servidor'}`,
        });
      } catch (err: any) {
        if (epoch !== getEpoch()) return;
        logger.error({ err }, 'Error rolling back workflow version');
        set({
          rollbackState: 'error',
          rollbackIssues: [],
          rollbackError: 'Não foi possível contatar o servidor.',
          rollbackTargetVersion: null,
        });
        get().addSimulationLog({
          type: 'error',
          message: 'Falha ao restaurar versão: não foi possível contatar o servidor.',
        });
      }
    },
  };
}
