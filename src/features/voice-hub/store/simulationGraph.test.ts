// Unit tests for the pure simulation graph-walk helpers extracted from useStudioStore.ts
// (TAREFA-SANEAMENTO-008 / BT360-DT-0063). Covers success paths (single edge, multi-edge default,
// condition true/false branches) and failure paths (missing node reference is handled by the
// caller; blocking validation issues must halt the walk — never silently advance).
import { describe, expect, it } from 'vitest';
import type { StudioNode, StudioEdge } from '../lib/studio/types.js';
import { blockingValidationIssues, resolveNextSimulationTarget } from './simulationGraph.js';

function node(id: string, type: string, config?: Record<string, unknown>): StudioNode {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: { label: id, config },
  } as StudioNode;
}

function edge(id: string, source: string, target: string, sourceHandle?: string): StudioEdge {
  return { id, source, target, sourceHandle } as StudioEdge;
}

describe('resolveNextSimulationTarget', () => {
  it('returns null when the node has no outgoing edges (end of graph)', () => {
    const n = node('a', 'prompt');
    expect(resolveNextSimulationTarget(n, [], {})).toEqual({
      nextNodeId: null,
      matchingEdge: null,
    });
  });

  it('follows the single outgoing edge', () => {
    const n = node('a', 'prompt');
    const e = edge('e1', 'a', 'b');
    const result = resolveNextSimulationTarget(n, [e], {});
    expect(result.nextNodeId).toBe('b');
    expect(result.matchingEdge).toBe(e);
  });

  it('defaults to the first edge for non-condition nodes with multiple outgoing edges', () => {
    const n = node('a', 'llm');
    const e1 = edge('e1', 'a', 'b');
    const e2 = edge('e2', 'a', 'c');
    const result = resolveNextSimulationTarget(n, [e1, e2], {});
    expect(result.nextNodeId).toBe('b');
  });

  it('condition node: matching variable takes the out-0 (success) branch', () => {
    const n = node('cond', 'condition', { variable: 'intent', value: 'Suporte' });
    const eOut0 = edge('e0', 'cond', 'yes', 'out-0');
    const eOut1 = edge('e1', 'cond', 'no', 'out-1');
    const result = resolveNextSimulationTarget(n, [eOut0, eOut1], { intent: 'Suporte' });
    expect(result.nextNodeId).toBe('yes');
    expect(result.matchingEdge).toBe(eOut0);
  });

  it('condition node: non-matching variable takes the out-1 (fallback) branch', () => {
    const n = node('cond', 'condition', { variable: 'intent', value: 'Suporte' });
    const eOut0 = edge('e0', 'cond', 'yes', 'out-0');
    const eOut1 = edge('e1', 'cond', 'no', 'out-1');
    const result = resolveNextSimulationTarget(n, [eOut0, eOut1], { intent: 'Vendas' });
    expect(result.nextNodeId).toBe('no');
    expect(result.matchingEdge).toBe(eOut1);
  });

  it('condition node: missing explicit handles falls back to positional edges', () => {
    const n = node('cond', 'condition', { variable: 'intent', value: 'Suporte' });
    const first = edge('e0', 'cond', 'yes');
    const second = edge('e1', 'cond', 'no');
    // match → out-0 handle ausente → primeira edge
    expect(resolveNextSimulationTarget(n, [first, second], { intent: 'Suporte' }).nextNodeId).toBe(
      'yes',
    );
    // sem match → out-1 ausente → outgoingEdges[1]
    expect(resolveNextSimulationTarget(n, [first, second], { intent: 'X' }).nextNodeId).toBe('no');
  });

  it('condition node: defaults variable to "intent" and value to "" when config is absent', () => {
    const n = node('cond', 'condition');
    const eOut0 = edge('e0', 'cond', 'yes', 'out-0');
    const eOut1 = edge('e1', 'cond', 'no', 'out-1');
    // intent ausente → '' === '' → branch de sucesso
    expect(resolveNextSimulationTarget(n, [eOut0, eOut1], {}).nextNodeId).toBe('yes');
  });
});

describe('blockingValidationIssues', () => {
  it('surfaces graph-wide validation errors for any node (fail-closed engine)', () => {
    // src/lib/studio/ValidationEngine.ts currently returns a single graph-wide error
    // ('validation-unavailable') — the simulator must treat that as blocking for every node
    // rather than advancing past an unvalidated graph.
    const nodes = [node('start-1', 'start'), node('end-1', 'end')];
    const edges = [edge('e1', 'start-1', 'end-1')];
    const issues = blockingValidationIssues(nodes, edges, 'start-1');
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.every((i) => i.type === 'error')).toBe(true);
  });
});
