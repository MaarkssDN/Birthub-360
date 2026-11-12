import { clientLogger as logger } from '../../../lib/clientLogger.js';
import { validationEngine } from '../../../lib/studio/ValidationEngine.js';
import type { ValidationIssue, WorkflowVersionSummary } from '../lib/studio/types.js';
import type { StudioState } from './studioTypes.js';

type GetState = () => StudioState;
type SetState = (
  update: Partial<StudioState> | ((state: StudioState) => Partial<StudioState>),
) => void;

export function createServerWorkflowActions(get: GetState, set: SetState, getEpoch: () => number) {
  return {
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
