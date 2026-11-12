import { addEdge } from '@xyflow/react';
import { create } from 'zustand';
import type { NodeType, StudioEdge, StudioNode } from '../lib/studio/types.js';
import { createAiWorkflowActions } from './aiWorkflowActions.js';
import { initialEdges, initialNodes } from './initialData.js';
import { nodeRegistry } from './nodeRegistry.js';
import { createServerWorkflowActions } from './serverWorkflowActions.js';
import { createSimulationActions } from './simulationActions.js';
import { createWorkflowPersistenceActions } from './workflowPersistence.js';

export { workflowGraphSnapshot } from './workflowPersistence.js';

import type { StudioState } from './studioTypes.js';

export type {
  NodeLifecycleState,
  NodeRegistryItem,
  SimulationLog,
  StudioState,
} from './studioTypes.js';
// Re-exports for backwards compatibility
export { nodeRegistry };

let workflowEpoch = 0;

export const useStudioStore = create<StudioState>((set, get) => ({
  past: [],
  future: [],
  clipboard: null,

  saveSnapshot: () => {
    const { nodes, edges, past } = get();
    // avoid saving identical snapshots
    if (past.length > 0) {
      const last = past[past.length - 1];
      if (
        JSON.stringify(last.nodes) === JSON.stringify(nodes) &&
        JSON.stringify(last.edges) === JSON.stringify(edges)
      )
        return;
    }
    set({
      past: [...past, { nodes: structuredClone(nodes), edges: structuredClone(edges) }],
      future: [],
    });
  },

  undo: () => {
    const { past, future, nodes, edges } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    set({
      past: newPast,
      future: [{ nodes, edges }, ...future],
      nodes: previous.nodes,
      edges: previous.edges,
    });
  },

  redo: () => {
    const { past, future, nodes, edges } = get();
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    set({
      past: [...past, { nodes, edges }],
      future: newFuture,
      nodes: next.nodes,
      edges: next.edges,
    });
  },

  copySelection: () => {
    const { nodes, edges } = get();
    const selectedNodes = nodes.filter((n) => n.selected);
    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
    const selectedEdges = edges.filter(
      (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target),
    );
    set({ clipboard: { nodes: selectedNodes, edges: selectedEdges } });
  },

  autoAlignNodes: () => {
    const { nodes, saveSnapshot } = get();
    saveSnapshot();
    const sorted = [...nodes].sort((a, b) => a.position.y - b.position.y);
    let currentY = 50;
    const aligned = sorted.map((n) => {
      const res = { ...n, position: { x: 300, y: currentY } };
      currentY += 150;
      return res;
    });
    set({ nodes: aligned });
  },

  deleteSelection: () => {
    const { nodes, edges, saveSnapshot } = get();
    const selectedNodes = nodes.filter((n) => n.selected).map((n) => n.id);
    if (selectedNodes.length === 0) return;

    saveSnapshot();
    set({
      nodes: nodes.filter((n) => !n.selected),
      edges: edges.filter(
        (e) => !selectedNodes.includes(e.source) && !selectedNodes.includes(e.target),
      ),
    });
  },

  pasteSelection: () => {
    const { clipboard, nodes, edges, saveSnapshot } = get();
    if (!clipboard || clipboard.nodes.length === 0) return;
    saveSnapshot();

    const idMapping: Record<string, string> = {};
    const newNodes = clipboard.nodes.map((n) => {
      const newId = crypto.randomUUID();
      idMapping[n.id] = newId;
      return {
        ...n,
        id: newId,
        selected: true,
        position: { x: n.position.x + 50, y: n.position.y + 50 },
      };
    });

    const newEdges = clipboard.edges.map((e) => ({
      ...e,
      id: crypto.randomUUID(),
      source: idMapping[e.source],
      target: idMapping[e.target],
    }));

    set({
      nodes: [...nodes.map((n) => ({ ...n, selected: false })), ...newNodes],
      edges: [...edges.map((e) => ({ ...e, selected: false })), ...newEdges],
    });
  },

  nodes: initialNodes,
  edges: initialEdges,
  selectedNodeId: null,
  favorites: ['prompt', 'llm', 'knowledge'],
  templates: [
    {
      id: 'temp-1',
      name: 'Recepção e Qualificação Padrão',
      nodes: initialNodes.slice(0, 5),
      edges: initialEdges.slice(0, 4),
    },
  ],
  searchQuery: '',
  activeCategory: 'all',
  nodeLifecycles: {
    'start-1': 'Ready',
    'voice-1': 'Ready',
    'llm-1': 'Ready',
    'prompt-1': 'Ready',
    'condition-1': 'Ready',
    'handoff-1': 'Ready',
    'knowledge-1': 'Ready',
    'end-1': 'Ready',
  },

  // Debug / Simulation state
  isDebugging: false,
  activeSimulationNodeId: null,
  simulationStepIndex: -1,
  simulationLogs: [],
  simulationVariables: {
    customer_name: 'Marcelo Silva',
    hasCompletedSurvey: 'false',
    intent: 'Suporte',
    confidenceScore: 0.94,
    caller_phone: '+5511999998888',
    channel: 'Telefone',
  },
  isSimulationPaused: false,
  simulationSpeedMs: 1500,

  publishState: 'idle',
  publishIssues: [],

  workflowId: null,
  workflowContext: null,
  loadState: 'loading',
  saveState: 'idle',
  savedGraph: null,
  setWorkflowContext: (context) => {
    workflowEpoch += 1;
    get().stopSimulation();
    set({
      workflowContext: context,
      nodes: [],
      edges: [],
      workflowId: null,
      past: [],
      future: [],
      clipboard: null,
      selectedNodeId: null,
      nodeLifecycles: {},
      templates: [],
      favorites: [],
      searchQuery: '',
      activeCategory: 'all',
      simulationVariables: {},
      simulationLogs: [],
      activeSimulationNodeId: null,
      isDebugging: false,
      simulationStepIndex: -1,
      isSimulationPaused: false,
      loadState: 'loading',
      saveState: 'idle',
      savedGraph: null,
      publishState: 'idle',
      publishIssues: [],
      isVersionHistoryOpen: false,
      workflowVersions: [],
      versionHistoryState: 'idle',
      versionHistoryError: null,
      rollbackState: 'idle',
      rollbackIssues: [],
      rollbackError: null,
      rollbackTargetVersion: null,
    });
  },

  isVersionHistoryOpen: false,
  workflowVersions: [],
  versionHistoryState: 'idle',
  versionHistoryError: null,

  rollbackState: 'idle',
  rollbackIssues: [],
  rollbackError: null,
  rollbackTargetVersion: null,

  // Node State mutators
  setNodes: (nodes) =>
    set((state) => ({
      nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes,
    })),
  setEdges: (edges) =>
    set((state) => ({
      edges: typeof edges === 'function' ? edges(state.edges) : edges,
    })),

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  addNodeFromRegistry: (type, position) => {
    const regItem = nodeRegistry[type];
    if (!regItem) return;

    const newId = `${type}-${Date.now()}`;
    const newNode: StudioNode = {
      id: newId,
      type: type as NodeType,
      position: position || {
        x: 400 + ((get().nodes.length * 25) % 200),
        y: 300 + ((get().nodes.length * 25) % 200),
      },
      data: {
        label: `${regItem.label} ${get().nodes.filter((n) => n.type === type).length + 1}`,
        category: regItem.category,
        config: { ...regItem.defaultConfig },
      },
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      nodeLifecycles: { ...state.nodeLifecycles, [newId]: 'Ready' },
    }));
  },

  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      activeSimulationNodeId:
        state.activeSimulationNodeId === id ? null : state.activeSimulationNodeId,
    }));
  },

  updateNodeConfig: (id, key, value) => {
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              config: {
                ...n.data.config,
                [key]: value,
              },
            },
          };
        }
        return n;
      }),
    }));
  },

  updateNodeMetadata: (id, updates) => {
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              label: updates.label !== undefined ? updates.label : n.data.label,
              description:
                updates.description !== undefined ? updates.description : n.data.description,
            },
          };
        }
        return n;
      }),
    }));
  },

  toggleFavorite: (type) => {
    set((state) => {
      const isFav = state.favorites.includes(type);
      return {
        favorites: isFav ? state.favorites.filter((t) => t !== type) : [...state.favorites, type],
      };
    });
  },

  saveAsTemplate: (name) => {
    const { nodes, edges } = get();
    const newTemp = {
      id: `temp-${Date.now()}`,
      name,
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    set((state) => ({
      templates: [...state.templates, newTemp],
    }));
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setActiveCategory: (cat) => set({ activeCategory: cat }),

  setNodeLifecycle: (id, state) => {
    set((stateObj) => ({
      nodeLifecycles: { ...stateObj.nodeLifecycles, [id]: state },
    }));
  },

  connectNodes: (connection) => {
    set((state) => {
      const sourceNode = state.nodes.find((n) => n.id === connection.source);
      const targetNode = state.nodes.find((n) => n.id === connection.target);

      const edgeData: StudioEdge['data'] = {
        category: 'Flow',
        description: `Conecta ${sourceNode?.data.label} a ${targetNode?.data.label}`,
        condition: '',
        priority: 1,
        weight: 1,
        event: 'next',
      };

      if (sourceNode?.type === 'condition') {
        const branchIndex = connection.sourceHandle === 'out-0' ? 0 : 1;
        edgeData.condition = branchIndex === 0 ? 'Variable == Value' : 'Fallback';
        edgeData.isFallback = branchIndex === 1;
        edgeData.category = 'Branch';
      } else if (sourceNode?.type === 'switch') {
        const handleId = connection.sourceHandle || 'out-0';
        const index = parseInt(handleId.split('-')[1], 10) || 0;
        const variable = sourceNode.data.config?.variableToCheck || 'userIntent';
        const value = sourceNode.data.config?.[`path${index}`] || `Caminho ${index}`;
        edgeData.condition = `${variable} == ${value}`;
        edgeData.category = 'Switch Branch';
      }

      const newEdge: StudioEdge = {
        id: `e-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source || '',
        target: connection.target || '',
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'studioEdge',
        data: edgeData,
      };

      return {
        edges: addEdge(newEdge, state.edges) as StudioEdge[],
      };
    });
  },

  updateEdgeData: (edgeId, updates) => {
    set((state) => ({
      edges: state.edges.map((e) => {
        if (e.id === edgeId) {
          return {
            ...e,
            data: {
              ...e.data,
              ...updates,
            },
          };
        }
        return e;
      }),
    }));
  },

  // Simulation Controls & Execution Loop
  ...createSimulationActions(get, set),
  ...createAiWorkflowActions(get, set, () => workflowEpoch),
  ...createWorkflowPersistenceActions(get, set, () => workflowEpoch),
  ...createServerWorkflowActions(get, set, () => workflowEpoch),
}));
