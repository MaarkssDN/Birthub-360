import { clientLogger as logger } from '../../../lib/clientLogger.js';
import type { StudioState } from './studioTypes.js';

type GetState = () => StudioState;
type SetState = (
  update: Partial<StudioState> | ((state: StudioState) => Partial<StudioState>),
) => void;

export function createAiWorkflowActions(get: GetState, set: SetState, getEpoch: () => number) {
  return {
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
  };
}
