// @vitest-environment jsdom
//
// Store-level coverage for the simulation/debugger actions extracted from useStudioStore.ts
// into simulationActions.ts + simulationGraph.ts (TAREFA-SANEAMENTO-008 / BT360-DT-0063).
// The real ValidationEngine is fail-closed (always isValid:false), so it is mocked here to
// exercise BOTH paths: a flow the engine approves walks the graph, and one it rejects must halt
// with an explicit error — never silently advance past a broken node.
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

function edge(id: string, source: string, target: string): StudioEdge {
  return { id, source, target, type: 'studioEdge', data: {} } as StudioEdge;
}

// start → voice → llm → prompt → knowledge → human_handoff → end
// Covers every node-type-specific branch of logNodeTypeDetails in simulationActions.ts.
const CHAIN_NODES: StudioNode[] = [
  node('start-1', 'start'),
  node('voice-1', 'voice', { provider: 'deepgram', voiceId: 'aura' }),
  node('llm-1', 'llm', { model: 'gemini-2.5-flash', temperature: 0.1 }),
  node('prompt-1', 'prompt', { promptText: 'Seja breve.' }),
  node('knowledge-1', 'knowledge', { database: 'FAQs' }),
  node('handoff-1', 'human_handoff', { department: 'Suporte' }),
  node('end-1', 'end'),
];
const CHAIN_EDGES: StudioEdge[] = [
  edge('e1', 'start-1', 'voice-1'),
  edge('e2', 'voice-1', 'llm-1'),
  edge('e3', 'llm-1', 'prompt-1'),
  edge('e4', 'prompt-1', 'knowledge-1'),
  edge('e5', 'knowledge-1', 'handoff-1'),
  edge('e6', 'handoff-1', 'end-1'),
];

function validEngine() {
  mockedValidate.mockReturnValue({ isValid: true, issues: [] });
}

describe('useStudioStore — simulation actions', () => {
  beforeEach(() => {
    useStudioStore.setState(useStudioStore.getInitialState(), true);
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Ensure no interval leaks between tests even if a test failed mid-simulation.
    useStudioStore.getState().stopSimulation();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('log & variable helpers', () => {
    it('addSimulationLog prepends timestamped entries and caps the list at 100', () => {
      const store = useStudioStore.getState();
      for (let i = 0; i < 105; i++) {
        store.addSimulationLog({ type: 'info', message: `log-${i}` });
      }
      const logs = useStudioStore.getState().simulationLogs;
      expect(logs).toHaveLength(100);
      expect(logs[0].message).toBe('log-104'); // newest first
      expect(logs[0].timestamp).toBeTruthy();
    });

    it('clearSimulationLogs empties the log and update/deleteSimulationVariable mutate the map', () => {
      const store = useStudioStore.getState();
      store.addSimulationLog({ type: 'info', message: 'x' });
      store.clearSimulationLogs();
      expect(useStudioStore.getState().simulationLogs).toEqual([]);

      store.updateSimulationVariable('intent', 'Suporte');
      expect(useStudioStore.getState().simulationVariables.intent).toBe('Suporte');
      store.deleteSimulationVariable('intent');
      expect(useStudioStore.getState().simulationVariables.intent).toBeUndefined();
    });
  });

  describe('startSimulation', () => {
    it('refuses to start when the flow has no Start node (honest error, never a fake run)', () => {
      useStudioStore.setState({ nodes: [node('prompt-1', 'prompt')], edges: [] });
      validEngine();

      useStudioStore.getState().startSimulation();

      const state = useStudioStore.getState();
      expect(state.isDebugging).toBe(false);
      expect(state.simulationLogs.some((l) => l.type === 'error')).toBe(true);
    });

    it('blocks the run when ValidationEngine rejects the flow', () => {
      useStudioStore.setState({ nodes: CHAIN_NODES, edges: CHAIN_EDGES });
      mockedValidate.mockReturnValue({
        isValid: false,
        issues: [{ id: 'err-1', type: 'error', message: 'fluxo inválido' }],
      });

      useStudioStore.getState().startSimulation();

      const state = useStudioStore.getState();
      expect(state.isDebugging).toBe(false);
      expect(state.simulationLogs[0].type).toBe('error');
      expect(state.simulationLogs[0].message).toContain('bloqueada');
    });

    it('walks the whole chain, emits node-type logs and stops at human_handoff', () => {
      useStudioStore.setState({
        nodes: CHAIN_NODES,
        edges: CHAIN_EDGES,
        simulationSpeedMs: 1,
      });
      validEngine();

      useStudioStore.getState().startSimulation();
      expect(useStudioStore.getState().isDebugging).toBe(true);
      expect(useStudioStore.getState().activeSimulationNodeId).toBe('start-1');

      // Each tick completes the active node and activates the next; human_handoff stops the run.
      for (let i = 0; i < 8 && useStudioStore.getState().isDebugging; i++) {
        vi.advanceTimersByTime(1);
      }

      const state = useStudioStore.getState();
      const messages = state.simulationLogs.map((l) => l.message).join('\n');
      expect(messages).toContain('Voice setup');
      expect(messages).toContain('Mounting LLM Provider config');
      expect(messages).toContain('system instruction compilation');
      expect(messages).toContain('vector search RAG query');
      expect(messages).toContain('Transferindo chamada telefônica');
      expect(state.isDebugging).toBe(false);
      expect(state.activeSimulationNodeId).toBeNull();
    });

    it('pauses and resumes the interval loop', () => {
      useStudioStore.setState({
        nodes: [node('start-1', 'start'), node('end-1', 'end')],
        edges: [edge('e1', 'start-1', 'end-1')],
        simulationSpeedMs: 1000,
      });
      validEngine();

      const store = useStudioStore.getState();
      store.startSimulation();
      store.pauseSimulation();
      expect(useStudioStore.getState().isSimulationPaused).toBe(true);

      const logsAfterPause = useStudioStore.getState().simulationLogs.length;
      vi.advanceTimersByTime(5000);
      // Paused: no step ran — active node and log count unchanged.
      expect(useStudioStore.getState().activeSimulationNodeId).toBe('start-1');
      expect(useStudioStore.getState().simulationLogs.length).toBe(logsAfterPause);

      store.resumeSimulation();
      expect(useStudioStore.getState().isSimulationPaused).toBe(false);
      vi.advanceTimersByTime(1000);
      // One step: start completed, end activated then immediately stopped (end node).
      expect(useStudioStore.getState().isDebugging).toBe(false);
    });

    it('stepSimulationForward halts with an explicit error when the active node has blocking validation issues', () => {
      useStudioStore.setState({
        nodes: [node('start-1', 'start'), node('end-1', 'end')],
        edges: [edge('e1', 'start-1', 'end-1')],
        simulationSpeedMs: 1,
        activeSimulationNodeId: 'start-1',
        isDebugging: true,
      });
      // First call (startSimulation's pre-check isn't used here — stepSimulationForward path):
      // make the engine valid for the pre-check but return an error for start-1's step.
      mockedValidate.mockImplementation((_nodes, _edges) => ({
        isValid: true,
        issues: [{ id: 'err-node', type: 'error', message: 'prompt vazio', nodeId: 'start-1' }],
      }));

      useStudioStore.getState().stepSimulationForward();

      const state = useStudioStore.getState();
      // The node is marked 'Failed' transiently, but stopSimulation() then resets every
      // lifecycle to 'Ready' — the observable contract is the halt + the surfaced error.
      expect(state.isDebugging).toBe(false);
      const errorLog = state.simulationLogs.find((l) => l.type === 'error');
      expect(errorLog?.message).toContain('prompt vazio');
      expect(state.nodeLifecycles['start-1']).toBe('Ready');
    });
  });

  describe('stepSimulationForward / stepSimulationBackward', () => {
    it('is a no-op without an active simulation node', () => {
      useStudioStore.setState({ activeSimulationNodeId: null });
      const before = useStudioStore.getState().simulationLogs.length;
      useStudioStore.getState().stepSimulationForward();
      expect(useStudioStore.getState().simulationLogs.length).toBe(before);
    });

    it('is a no-op when the active node no longer exists', () => {
      useStudioStore.setState({
        activeSimulationNodeId: 'ghost',
        nodes: [],
        edges: [],
      });
      const before = useStudioStore.getState().simulationLogs.length;
      useStudioStore.getState().stepSimulationForward();
      expect(useStudioStore.getState().simulationLogs.length).toBe(before);
    });

    it('advances start → end and stops at the graph end', () => {
      useStudioStore.setState({
        nodes: [node('start-1', 'start'), node('end-1', 'end')],
        edges: [edge('e1', 'start-1', 'end-1')],
        activeSimulationNodeId: 'start-1',
        simulationStepIndex: 0,
      });
      validEngine();

      useStudioStore.getState().stepSimulationForward();
      let state = useStudioStore.getState();
      expect(state.activeSimulationNodeId).toBe('end-1');
      expect(state.simulationStepIndex).toBe(1);
      expect(state.nodeLifecycles['start-1']).toBe('Completed');
      expect(state.nodeLifecycles['end-1']).toBe('Executing');

      // Second step: end has no outgoing edges → stopSimulation.
      useStudioStore.getState().stepSimulationForward();
      state = useStudioStore.getState();
      expect(state.isDebugging).toBe(false);
      expect(state.activeSimulationNodeId).toBeNull();
    });

    it('stepSimulationBackward only logs a warning (documented simplification)', () => {
      useStudioStore.getState().stepSimulationBackward();
      const last = useStudioStore.getState().simulationLogs[0];
      expect(last.type).toBe('warn');
      expect(last.message).toContain('Retrocesso');
    });
  });

  describe('stopSimulation', () => {
    it('clears the interval and resets every node lifecycle to Ready', () => {
      useStudioStore.setState({
        nodes: [node('start-1', 'start'), node('end-1', 'end')],
        edges: [edge('e1', 'start-1', 'end-1')],
        simulationSpeedMs: 1,
        nodeLifecycles: { 'start-1': 'Executing', 'end-1': 'Ready' },
      });
      validEngine();
      useStudioStore.getState().startSimulation();
      useStudioStore.getState().stopSimulation();

      const state = useStudioStore.getState();
      expect(state.isDebugging).toBe(false);
      expect(state.activeSimulationNodeId).toBeNull();
      expect(state.simulationStepIndex).toBe(-1);
      expect(state.nodeLifecycles['start-1']).toBe('Ready');
      expect(state.nodeLifecycles['end-1']).toBe('Ready');

      // Interval really cleared: advancing time must not add more logs.
      const count = state.simulationLogs.length;
      vi.advanceTimersByTime(10000);
      expect(useStudioStore.getState().simulationLogs.length).toBe(count);
    });
  });
});
