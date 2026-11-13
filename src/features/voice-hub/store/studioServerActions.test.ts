// @vitest-environment jsdom
//
// Store-level coverage for the server-facing studio actions extracted from useStudioStore.ts
// into studioServerActions.ts (TAREFA-SANEAMENTO-008 / BT360-DT-0063): AI refactor/generate,
// publish and version-history open/close. The real ValidationEngine is fail-closed, so it is
// mocked to exercise both the approved and rejected publish paths.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StudioEdge, StudioNode } from '../lib/studio/types.js';

vi.mock('../../../lib/studio/ValidationEngine.js', () => ({
  validationEngine: { validate: vi.fn() },
}));

import { validationEngine } from '../../../lib/studio/ValidationEngine.js';
import { useStudioStore } from './useStudioStore.js';

const mockedValidate = vi.mocked(validationEngine.validate);

function node(id: string, type: string, config?: Record<string, unknown>): StudioNode {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: { label: id, category: 'Test', config },
  } as StudioNode;
}

function jsonResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    statusText: ok ? 'OK' : 'Unprocessable Entity',
    json: () => Promise.resolve(body),
  } as Response);
}

describe('useStudioStore — server actions (AI refactor, publish, version history UI)', () => {
  beforeEach(() => {
    useStudioStore.setState(useStudioStore.getInitialState(), true);
    vi.stubGlobal('fetch', vi.fn());
    mockedValidate.mockReturnValue({ isValid: true, issues: [] });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('applyAiRefactor', () => {
    it('replaces nodes with the real API response on success', async () => {
      const remoteNodes = [node('ai-1', 'prompt', { promptText: 'novo' })];
      vi.mocked(fetch).mockImplementation(() => jsonResponse({ nodes: remoteNodes }));

      await useStudioStore.getState().applyAiRefactor('simplify');

      expect(fetch).toHaveBeenCalledWith(
        '/api/ai/refactor',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(useStudioStore.getState().nodes).toEqual(remoteNodes);
      expect(useStudioStore.getState().simulationLogs.some((l) => l.type === 'success')).toBe(true);
    });

    it('falls back to local node tweaks when the API fails (workflow never breaks)', async () => {
      useStudioStore.setState({
        nodes: [
          node('p1', 'prompt', { promptText: 'original' }),
          node('l1', 'llm', { model: 'old-model', temperature: 0.9 }),
        ],
        edges: [],
      });
      vi.mocked(fetch).mockRejectedValue(new Error('network down'));

      await useStudioStore.getState().applyAiRefactor('moreHuman');

      const { nodes, simulationLogs } = useStudioStore.getState();
      const prompt = nodes.find((n) => n.id === 'p1');
      const llm = nodes.find((n) => n.id === 'l1');
      expect(prompt?.data.label).toBe('Atendimento Altamente Humanizado');
      expect(llm?.data.config?.model).toBe('gemini-2.5-pro');
      expect(llm?.data.config?.temperature).toBe(0.45);
      expect(simulationLogs.some((l) => l.type === 'error')).toBe(true);
    });

    it('applies reduceCost/simplify variants in the local fallback', async () => {
      useStudioStore.setState({
        nodes: [node('l1', 'llm', { model: 'x', temperature: 0.5 })],
        edges: [],
      });
      vi.mocked(fetch).mockImplementation(() => jsonResponse({}, false, 500));

      await useStudioStore.getState().applyAiRefactor('reduceCost');
      expect(useStudioStore.getState().nodes[0].data.config?.model).toBe('gemini-2.5-flash');

      await useStudioStore.getState().applyAiRefactor('simplify');
      expect(useStudioStore.getState().nodes[0].data.config?.temperature).toBe(0.1);
    });
  });

  describe('generateWorkflowFromPrompt', () => {
    it('installs the generated graph with Ready lifecycles on success', async () => {
      const genNodes = [node('g1', 'start'), node('g2', 'end')];
      const genEdges: StudioEdge[] = [
        { id: 'ge1', source: 'g1', target: 'g2', type: 'studioEdge', data: {} } as StudioEdge,
      ];
      vi.mocked(fetch).mockImplementation(() => jsonResponse({ nodes: genNodes, edges: genEdges }));

      await useStudioStore.getState().generateWorkflowFromPrompt('atendente de vendas');

      const state = useStudioStore.getState();
      expect(state.nodes).toEqual(genNodes);
      expect(state.edges).toEqual(genEdges);
      expect(state.nodeLifecycles).toEqual({ g1: 'Ready', g2: 'Ready' });
      expect(state.selectedNodeId).toBeNull();
      expect(state.simulationLogs.some((l) => l.type === 'success')).toBe(true);
    });

    it('logs an error and keeps the canvas untouched when generation fails', async () => {
      const before = useStudioStore.getState().nodes;
      vi.mocked(fetch).mockRejectedValue(new Error('boom'));

      await useStudioStore.getState().generateWorkflowFromPrompt('x');

      const state = useStudioStore.getState();
      expect(state.nodes).toBe(before);
      expect(state.simulationLogs.some((l) => l.type === 'error')).toBe(true);
    });
  });

  describe('publishWorkflowToServer', () => {
    it('blocks locally when ValidationEngine rejects the flow — no fetch is made', async () => {
      mockedValidate.mockReturnValue({
        isValid: false,
        issues: [{ id: 'err-1', type: 'error', message: 'nó quebrado' }],
      });

      await useStudioStore.getState().publishWorkflowToServer();

      expect(fetch).not.toHaveBeenCalled();
      const state = useStudioStore.getState();
      expect(state.publishState).toBe('error');
      expect(state.publishIssues).toHaveLength(1);
    });

    it('publishes successfully and stores the server workflow id', async () => {
      vi.mocked(fetch).mockImplementation(() => jsonResponse({ workflow: { id: 'wf-new-1' } }));

      await useStudioStore.getState().publishWorkflowToServer();

      expect(fetch).toHaveBeenCalledWith(
        '/api/voice-hub/workflow/publish',
        expect.objectContaining({ method: 'POST' }),
      );
      const state = useStudioStore.getState();
      expect(state.publishState).toBe('success');
      expect(state.publishIssues).toEqual([]);
      expect(state.workflowId).toBe('wf-new-1');
    });

    it('surfaces structured 422 issues from the server-side re-check', async () => {
      vi.mocked(fetch).mockImplementation(() =>
        jsonResponse(
          {
            error: 'O fluxo contém erros de validação.',
            issues: [{ id: 'srv-1', type: 'error', message: 'servidor reprovou' }],
          },
          false,
          422,
        ),
      );

      await useStudioStore.getState().publishWorkflowToServer();

      const state = useStudioStore.getState();
      expect(state.publishState).toBe('error');
      expect(state.publishIssues).toEqual([
        expect.objectContaining({ id: 'srv-1', type: 'error' }),
      ]);
    });

    it('sets publishState error (never throws) when the server is unreachable', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('offline'));

      await useStudioStore.getState().publishWorkflowToServer();

      const state = useStudioStore.getState();
      expect(state.publishState).toBe('error');
      expect(state.publishIssues).toEqual([]);
    });
  });

  describe('version history panel state', () => {
    it('openVersionHistory opens the panel, resets rollback state and fetches versions', async () => {
      useStudioStore.setState({ workflowId: 'wf-1' });
      vi.mocked(fetch).mockImplementation(() =>
        jsonResponse({ versions: [{ version: 3, publishedAt: '2026-01-01T00:00:00Z' }] }),
      );

      useStudioStore.getState().openVersionHistory();
      // fetchWorkflowVersions is fire-and-forget from the sync opener — flush microtasks.
      await vi.waitFor(() => {
        expect(useStudioStore.getState().versionHistoryState).toBe('idle');
      });

      const state = useStudioStore.getState();
      expect(state.isVersionHistoryOpen).toBe(true);
      expect(state.workflowVersions).toHaveLength(1);
      expect(fetch).toHaveBeenCalledWith('/api/voice-hub/workflow/wf-1/versions');
    });

    it('closeVersionHistory closes the panel', () => {
      useStudioStore.setState({ isVersionHistoryOpen: true });
      useStudioStore.getState().closeVersionHistory();
      expect(useStudioStore.getState().isVersionHistoryOpen).toBe(false);
    });
  });
});
