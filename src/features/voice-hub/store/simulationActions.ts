import { validationEngine } from '../../../lib/studio/ValidationEngine.js';
import type { StudioEdge } from '../lib/studio/types.js';
import type { StudioState } from './studioTypes.js';

let simulationTimer: ReturnType<typeof setInterval> | null = null;

type GetState = () => StudioState;
type SetState = (
  update: Partial<StudioState> | ((state: StudioState) => Partial<StudioState>),
) => void;

export function createSimulationActions(get: GetState, set: SetState) {
  return {
    addSimulationLog: (log) => {
      const timestamp = new Date().toLocaleTimeString('pt-BR');
      set((state) => ({
        simulationLogs: [{ ...log, timestamp }, ...state.simulationLogs].slice(0, 100),
      }));
    },

    clearSimulationLogs: () => set({ simulationLogs: [] }),
    updateSimulationVariable: (key, value) =>
      set((state) => ({
        simulationVariables: { ...state.simulationVariables, [key]: value },
      })),
    deleteSimulationVariable: (key) =>
      set((state) => {
        const newVars = { ...state.simulationVariables };
        delete newVars[key];
        return { simulationVariables: newVars };
      }),

    startSimulation: () => {
      if (simulationTimer) clearInterval(simulationTimer);

      // IMPORTANT: this is a local, client-only walk of the current nodes/edges graph — it never
      // calls the real Voice Runtime (lib/voice-runtime, owned by Agente 04), which today doesn't
      // even consume Workflow.nodes/edges yet (see handoff 07-para-04). It exists to let an author
      // preview branching/config without a real call, and it must never claim success for a node
      // that ValidationEngine would flag as broken — see the per-step check in runStep() below.
      const { nodes: startNodes } = get();
      const startNode = startNodes.find((n) => n.type === 'start');

      if (!startNode) {
        get().addSimulationLog({
          type: 'error',
          message:
            'Não é possível simular: nenhum nó Start encontrado no fluxo. Adicione um nó Start e conecte-o ao restante do fluxo.',
        });
        return;
      }

      if (!validationEngine.validate(startNodes, get().edges).isValid) {
        get().addSimulationLog({
          type: 'error',
          message: 'Simulação bloqueada: o fluxo não possui validação disponível e aprovada.',
        });
        return;
      }

      set({
        isDebugging: true,
        simulationStepIndex: 0,
        activeSimulationNodeId: startNode.id,
        isSimulationPaused: false,
        simulationLogs: [],
      });

      get().addSimulationLog({
        nodeId: startNode.id,
        nodeLabel: startNode.data.label,
        type: 'info',
        message:
          'Iniciando simulação local (mock) — não é uma chamada real de voz nem invoca o Voice Runtime em produção.',
      });

      get().setNodeLifecycle(startNode.id, 'Executing');

      const runStep = () => {
        const { activeSimulationNodeId, nodes, edges, isSimulationPaused, simulationVariables } =
          get();
        if (isSimulationPaused) return;
        if (!activeSimulationNodeId) return;

        const currentNode = nodes.find((n) => n.id === activeSimulationNodeId);
        if (!currentNode) {
          get().addSimulationLog({
            type: 'error',
            message: `Simulação interrompida: nó "${activeSimulationNodeId}" não existe mais no fluxo (foi removido durante a simulação?).`,
          });
          get().stopSimulation();
          return;
        }

        // Never claim success for a node ValidationEngine would reject at publish time (e.g. an
        // empty prompt, a Tool node with no endpoint, an LLM node with no provider). Simulating
        // past a broken node would be exactly the kind of "fingir sucesso" the runtime contract
        // forbids — surface the real error and halt instead.
        const { issues: liveIssues } = validationEngine.validate(nodes, edges);
        const blockingIssues = liveIssues.filter(
          (i) => (!i.nodeId || i.nodeId === currentNode.id) && i.type === 'error',
        );
        if (blockingIssues.length > 0) {
          get().setNodeLifecycle(currentNode.id, 'Failed');
          get().addSimulationLog({
            nodeId: currentNode.id,
            nodeLabel: currentNode.data.label,
            type: 'error',
            message: `Falha em ${currentNode.data.label}: ${blockingIssues.map((i) => i.message).join(' ')}`,
          });
          get().stopSimulation();
          return;
        }

        // Node execution completed
        get().setNodeLifecycle(currentNode.id, 'Completed');
        get().addSimulationLog({
          nodeId: currentNode.id,
          nodeLabel: currentNode.data.label,
          type: 'success',
          message: `Node ${currentNode.data.label} executado com sucesso (simulação local). Latência estimada: ${currentNode.data.metrics?.latencyMs || 15}ms`,
        });

        // Determine next node
        let nextNodeId: string | null = null;
        let matchingEdge: StudioEdge | null = null;

        const outgoingEdges = edges.filter((e) => e.source === currentNode.id);

        if (outgoingEdges.length === 1) {
          matchingEdge = outgoingEdges[0];
          nextNodeId = matchingEdge.target;
        } else if (outgoingEdges.length > 1) {
          // Evaluate conditions
          if (currentNode.type === 'condition') {
            const checkVar =
              typeof currentNode.data.config?.variable === 'string'
                ? currentNode.data.config.variable
                : 'intent';
            const valToCheck = simulationVariables[checkVar] || '';
            const checkVal = currentNode.data.config?.value || '';

            if (valToCheck === checkVal) {
              // Out-0 branch (Success branch)
              matchingEdge =
                outgoingEdges.find((e) => e.sourceHandle === 'out-0') || outgoingEdges[0];
            } else {
              // Out-1 branch (Fallback branch)
              matchingEdge =
                outgoingEdges.find((e) => e.sourceHandle === 'out-1') ||
                outgoingEdges[1] ||
                outgoingEdges[0];
            }
            nextNodeId = matchingEdge.target;
          } else {
            // Default first edge
            matchingEdge = outgoingEdges[0];
            nextNodeId = matchingEdge.target;
          }
        }

        if (nextNodeId) {
          const nextNode = nodes.find((n) => n.id === nextNodeId);
          if (nextNode) {
            get().addSimulationLog({
              nodeId: nextNodeId,
              nodeLabel: nextNode.data.label,
              type: 'event',
              message: `Ativando próximo Node: ${nextNode.data.label} via canal de decisão "${matchingEdge?.data?.description || 'Next Link'}"`,
            });
            get().setNodeLifecycle(nextNodeId, 'Executing');
            set({
              activeSimulationNodeId: nextNodeId,
              simulationStepIndex: get().simulationStepIndex + 1,
            });

            // Specific logs based on node types
            if (nextNode.type === 'voice') {
              get().addSimulationLog({
                nodeId: nextNodeId,
                nodeLabel: nextNode.data.label,
                type: 'info',
                message: `Voice setup: provider="${nextNode.data.config?.provider}", voice="${nextNode.data.config?.voiceId || 'Rachel'}"`,
              });
            } else if (nextNode.type === 'llm') {
              get().addSimulationLog({
                nodeId: nextNodeId,
                nodeLabel: nextNode.data.label,
                type: 'info',
                message: `Mounting LLM Provider config: model="${nextNode.data.config?.model || 'gemini-2.5-pro'}", temperature=${nextNode.data.config?.temperature || 0.2}`,
              });
            } else if (nextNode.type === 'prompt') {
              get().addSimulationLog({
                nodeId: nextNodeId,
                nodeLabel: nextNode.data.label,
                type: 'info',
                message: `Fired system instruction compilation: Text length=${typeof nextNode.data.config?.promptText === 'string' ? nextNode.data.config.promptText.length : 0} characters. DeepThinking: active.`,
              });
            } else if (nextNode.type === 'human_handoff') {
              get().addSimulationLog({
                nodeId: nextNodeId,
                nodeLabel: nextNode.data.label,
                type: 'warn',
                message: `Transferindo chamada telefônica para o departamento "${nextNode.data.config?.department}"`,
              });
              get().addSimulationLog({
                nodeId: nextNodeId,
                nodeLabel: nextNode.data.label,
                type: 'success',
                message: `Canal telefônico roteado para suporte ao vivo.`,
              });
              get().stopSimulation();
            } else if (nextNode.type === 'knowledge') {
              get().addSimulationLog({
                nodeId: nextNodeId,
                nodeLabel: nextNode.data.label,
                type: 'info',
                message: `Executing vector search RAG query against database "${nextNode.data.config?.database || 'Notion FAQs'}"`,
              });
              get().addSimulationLog({
                nodeId: nextNodeId,
                nodeLabel: nextNode.data.label,
                type: 'success',
                message: `Knowledge source search complete. Returned 3 chunks. Match score: 0.91`,
              });
            } else if (nextNode.type === 'end') {
              get().addSimulationLog({
                nodeId: nextNodeId,
                nodeLabel: nextNode.data.label,
                type: 'success',
                message: 'Conexão encerrada de forma limpa. Transcrição salva na plataforma.',
              });
              get().stopSimulation();
            }
          } else {
            get().stopSimulation();
          }
        } else {
          // No outgoing connections, end of execution
          get().addSimulationLog({
            nodeId: currentNode.id,
            nodeLabel: currentNode.data.label,
            type: 'info',
            message: 'Fim do grafo de execução visual.',
          });
          get().stopSimulation();
        }
      };

      simulationTimer = setInterval(runStep, get().simulationSpeedMs);
    },

    stopSimulation: () => {
      if (simulationTimer) {
        clearInterval(simulationTimer);
        simulationTimer = null;
      }

      const lifecycles = { ...get().nodeLifecycles };
      Object.keys(lifecycles).forEach((k) => {
        lifecycles[k] = 'Ready';
      });

      set({
        isDebugging: false,
        activeSimulationNodeId: null,
        simulationStepIndex: -1,
        isSimulationPaused: false,
        nodeLifecycles: lifecycles,
      });

      get().addSimulationLog({
        type: 'info',
        message: 'Debugger / Simulation session terminated.',
      });
    },

    pauseSimulation: () => {
      set({ isSimulationPaused: true });
      get().addSimulationLog({ type: 'warn', message: 'Sessão de simulação pausada.' });
    },

    resumeSimulation: () => {
      set({ isSimulationPaused: false });
      get().addSimulationLog({ type: 'info', message: 'Sessão de simulação retomada.' });
    },

    stepSimulationForward: () => {
      // Single manual tick forward
      const { activeSimulationNodeId, nodes, edges, simulationVariables } = get();
      if (!activeSimulationNodeId) return;

      const currentNode = nodes.find((n) => n.id === activeSimulationNodeId);
      if (!currentNode) return;

      // Same rule as the automatic playback loop in startSimulation: don't advance past a node
      // that ValidationEngine flags as an error, and don't silently mark it "Completed".
      const { issues: liveIssues } = validationEngine.validate(nodes, edges);
      const blockingIssues = liveIssues.filter(
        (i) => (!i.nodeId || i.nodeId === currentNode.id) && i.type === 'error',
      );
      if (blockingIssues.length > 0) {
        get().setNodeLifecycle(currentNode.id, 'Failed');
        get().addSimulationLog({
          nodeId: currentNode.id,
          nodeLabel: currentNode.data.label,
          type: 'error',
          message: `Falha em ${currentNode.data.label}: ${blockingIssues.map((i) => i.message).join(' ')}`,
        });
        get().stopSimulation();
        return;
      }

      get().setNodeLifecycle(currentNode.id, 'Completed');

      let nextNodeId: string | null = null;
      const outgoingEdges = edges.filter((e) => e.source === currentNode.id);

      if (outgoingEdges.length === 1) {
        nextNodeId = outgoingEdges[0].target;
      } else if (outgoingEdges.length > 1) {
        if (currentNode.type === 'condition') {
          const checkVar =
            typeof currentNode.data.config?.variable === 'string'
              ? currentNode.data.config.variable
              : 'intent';
          const valToCheck = simulationVariables[checkVar] || '';
          const checkVal = currentNode.data.config?.value || '';

          if (valToCheck === checkVal) {
            nextNodeId =
              outgoingEdges.find((e) => e.sourceHandle === 'out-0')?.target ||
              outgoingEdges[0].target;
          } else {
            nextNodeId =
              outgoingEdges.find((e) => e.sourceHandle === 'out-1')?.target ||
              outgoingEdges[1].target ||
              outgoingEdges[0].target;
          }
        } else {
          nextNodeId = outgoingEdges[0].target;
        }
      }

      if (nextNodeId) {
        const nextNode = nodes.find((n) => n.id === nextNodeId);
        if (nextNode) {
          get().setNodeLifecycle(nextNodeId, 'Executing');
          set({
            activeSimulationNodeId: nextNodeId,
            simulationStepIndex: get().simulationStepIndex + 1,
          });
          get().addSimulationLog({
            nodeId: nextNodeId,
            nodeLabel: nextNode.data.label,
            type: 'event',
            message: `Manual step forward: Ativando node ${nextNode.data.label}`,
          });
        }
      } else {
        get().stopSimulation();
      }
    },

    stepSimulationBackward: () => {
      // For simplicity, reset or log manual step back
      get().addSimulationLog({
        type: 'warn',
        message: 'Retrocesso de passo manual acionado.',
      });
    },

    // AI Flow Refactoring and Generation
  };
}
