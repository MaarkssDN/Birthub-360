// Pure graph-walk helpers for the Studio debug simulator, extracted from
// useStudioStore.ts (TAREFA-SANEAMENTO-008 / BT360-DT-0063). Both the automatic playback loop
// (startSimulation) and the manual step (stepSimulationForward) resolve "which node runs next"
// and "does ValidationEngine block this node" through these functions — previously the same
// branching logic was duplicated inline in both places and could drift apart.
//
// This is a local, client-only walk of nodes/edges — it never calls the real Voice Runtime
// (lib/voice-runtime). It exists so an author can preview branching/config without a real call,
// and it must never claim success for a node that ValidationEngine would flag as broken.
import { validationEngine } from '../../../lib/studio/ValidationEngine.js';
import type { StudioNode, StudioEdge, ValidationIssue } from '../lib/studio/types.js';

// Validation issues that must halt the simulation at `nodeId`: graph-wide issues (no nodeId) plus
// errors attached to this specific node. Warnings never block — same rule as before.
export function blockingValidationIssues(
  nodes: StudioNode[],
  edges: StudioEdge[],
  nodeId: string,
): ValidationIssue[] {
  const { issues } = validationEngine.validate(nodes, edges);
  return issues.filter((i) => (!i.nodeId || i.nodeId === nodeId) && i.type === 'error');
}

export interface SimulationStepTarget {
  nextNodeId: string | null;
  matchingEdge: StudioEdge | null;
}

// Resolves the next node after `currentNode` given its outgoing edges and the current simulation
// variables. Single outgoing edge → follow it. Multiple edges → condition nodes evaluate their
// configured variable against `value` (out-0 = match, out-1/first-fallback = no match); every
// other multi-out node type defaults to the first edge. No outgoing edges → null (end of graph).
export function resolveNextSimulationTarget(
  currentNode: StudioNode,
  outgoingEdges: StudioEdge[],
  simulationVariables: Record<string, unknown>,
): SimulationStepTarget {
  if (outgoingEdges.length === 0) {
    return { nextNodeId: null, matchingEdge: null };
  }

  if (outgoingEdges.length === 1) {
    const matchingEdge = outgoingEdges[0];
    return { nextNodeId: matchingEdge.target, matchingEdge };
  }

  if (currentNode.type === 'condition') {
    const checkVar =
      typeof currentNode.data.config?.variable === 'string'
        ? currentNode.data.config.variable
        : 'intent';
    const valToCheck = simulationVariables[checkVar] || '';
    const checkVal = currentNode.data.config?.value || '';

    const matchingEdge =
      valToCheck === checkVal
        ? // Out-0 branch (Success branch)
          outgoingEdges.find((e) => e.sourceHandle === 'out-0') || outgoingEdges[0]
        : // Out-1 branch (Fallback branch)
          outgoingEdges.find((e) => e.sourceHandle === 'out-1') ||
          outgoingEdges[1] ||
          outgoingEdges[0];
    return { nextNodeId: matchingEdge.target, matchingEdge };
  }

  // Default first edge
  const matchingEdge = outgoingEdges[0];
  return { nextNodeId: matchingEdge.target, matchingEdge };
}
