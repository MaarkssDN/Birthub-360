import { logger } from '../../logger.js';
import * as workflowRepository from '../repositories/workflowRepository.js';
import {
  advanceDeterministicNode,
  executeToolNodeAsync,
  hasResolvableTransfer,
  loadAgentKnowledgeDocuments,
  skipUnresolvableHumanHandoff,
  validateRuntimeCompatibility,
} from './workflowRuntimeNodes.js';
import {
  asNumber,
  asString,
  compileEdges,
  compileNodes,
  getRuntimeVoiceOverride,
  mapRuntimeProvider,
  nodeById,
  type PreparedWorkflowTurn,
  RUNTIME_AGENT_ID_VAR,
  RUNTIME_KNOWLEDGE_DOCS_VAR,
  RUNTIME_TENANT_ID_VAR,
  type RuntimeNode,
  renderTemplate,
  resolveTransferDetails,
  selectDefaultEdge,
  selectHandle,
  toStudioGraph,
  type WorkflowNode,
  type WorkflowRuntimeState,
} from './workflowRuntimeShared.js';

// Public surface preserved from before the module split (see workflowRuntimeShared.ts /
// workflowRuntimeNodes.ts headers): callers keep importing everything from this file.
export type {
  PreparedWorkflowTurn,
  RuntimeNodeType,
  RuntimeProvider,
  TransferDetails,
  VoiceOverride,
  WorkflowNode,
  WorkflowRuntimeState,
} from './workflowRuntimeShared.js';
export { mapRuntimeProvider, validateRuntimeCompatibility };

/**
 * Synchronous graph walk used by every `prepareWorkflowTurn` call (a live phone turn,
 * `telephonyService.ts` calling it without `await`). As of Onda 6, a `tool` node is a stopping
 * point exactly like `prompt`/`question`/`end`: it cannot perform a real network call from inside
 * this synchronous function (that would either break the non-`await`ed call site or block the
 * event loop for every other concurrent call), so it leaves `currentNodeId` pointed at the `tool`
 * node itself and returns — `prepareWorkflowTurn` turns that into `mode: 'tool_pending'` and the
 * caller must resume with `resumeAfterTool` (below), which performs the real HTTP call and then
 * continues the walk from there. See `.agents/handoffs/onda-6/04-para-05-tool-pending-contrato.md`.
 */
function advanceUntilInteraction(
  state: WorkflowRuntimeState,
  fromNodeId: string | null,
): WorkflowRuntimeState {
  let currentId = fromNodeId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) {
      state.ended = true;
      state.currentNodeId = null;
      logger.error(
        {
          workflowId: state.workflowId,
          nodeId: currentId,
        },
        'Workflow runtime stopped an unexpected cycle',
      );
      return state;
    }
    visited.add(currentId);

    const node = nodeById(state, currentId);
    if (!node) {
      state.ended = true;
      state.currentNodeId = null;
      logger.error(
        {
          workflowId: state.workflowId,
          nodeId: currentId,
        },
        'Workflow runtime could not resolve node',
      );
      return state;
    }

    if (node.type === 'human_handoff') {
      if (hasResolvableTransfer(node)) {
        state.currentNodeId = node.id;
        return state;
      }
      currentId = skipUnresolvableHumanHandoff(state, node);
      continue;
    }

    if (node.type === 'prompt' || node.type === 'question' || node.type === 'tool') {
      state.currentNodeId = node.id;
      return state;
    }

    if (node.type === 'end') {
      state.ended = true;
      state.currentNodeId = node.id;
      return state;
    }

    currentId = advanceDeterministicNode(state, node);
  }

  state.ended = true;
  state.currentNodeId = null;
  return state;
}

/**
 * Async twin of `advanceUntilInteraction`, used only by `initializeWorkflowRuntime` (i.e. the
 * segment of the graph between `start` and the call's first `prompt`/`question`). A `tool` node
 * reached here performs a real HTTP call inline (`executeToolNodeAsync`) because this function is
 * already `await`ed by its only caller; a `tool` node reached later, mid-conversation, instead
 * goes through `advanceUntilInteraction` (sync) + `resumeAfterTool` — see that pair's doc
 * comments for why the two entry points cannot share one code path.
 */
async function advanceUntilInteractionAsync(
  state: WorkflowRuntimeState,
  fromNodeId: string | null,
): Promise<WorkflowRuntimeState> {
  let currentId = fromNodeId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) {
      state.ended = true;
      state.currentNodeId = null;
      logger.error(
        {
          workflowId: state.workflowId,
          nodeId: currentId,
        },
        'Workflow runtime stopped an unexpected cycle',
      );
      return state;
    }
    visited.add(currentId);

    const node = nodeById(state, currentId);
    if (!node) {
      state.ended = true;
      state.currentNodeId = null;
      logger.error(
        {
          workflowId: state.workflowId,
          nodeId: currentId,
        },
        'Workflow runtime could not resolve node',
      );
      return state;
    }

    if (node.type === 'prompt' || node.type === 'question') {
      state.currentNodeId = node.id;
      return state;
    }

    if (node.type === 'end') {
      state.ended = true;
      state.currentNodeId = node.id;
      return state;
    }

    if (node.type === 'human_handoff') {
      // Known limitation, same shape as the `voice` node's opening-greeting gap documented in
      // `.agents/handoffs/onda-6/04-para-05-voiceOverride-contrato.md`: `initializeWorkflowRuntime`
      // returns a bare `WorkflowRuntimeState`, not a `PreparedWorkflowTurn`, so a `human_handoff`
      // reached in this initial segment (before the call's first `prompt`/`question`) stops the
      // walk here (never fabricates a transfer, never silently drops it) but has no channel to
      // surface `mode: 'transfer'` to a caller yet. `currentNodeId` stays correctly pointed at it,
      // so the very next `prepareWorkflowTurn` call re-signals `mode: 'transfer'` via the same
      // defensive re-check `advanceUntilInteraction` relies on for `tool`.
      if (hasResolvableTransfer(node)) {
        state.currentNodeId = node.id;
        return state;
      }
      currentId = skipUnresolvableHumanHandoff(state, node);
      continue;
    }

    if (node.type === 'tool') {
      await executeToolNodeAsync(state, node);
      currentId = selectDefaultEdge(state, node.id)?.target ?? null;
      continue;
    }

    currentId = advanceDeterministicNode(state, node);
  }

  state.ended = true;
  state.currentNodeId = null;
  return state;
}

function cloneState(state: WorkflowRuntimeState): WorkflowRuntimeState {
  return structuredClone(state);
}

function advancePastCurrent(
  state: WorkflowRuntimeState,
  current: RuntimeNode,
  handle?: string,
): WorkflowRuntimeState {
  const edge = handle
    ? selectHandle(state, current.id, handle)
    : selectDefaultEdge(state, current.id);
  return advanceUntilInteraction(state, edge?.target ?? null);
}

function questionText(state: WorkflowRuntimeState): string | undefined {
  const current = nodeById(state, state.currentNodeId);
  if (current?.type !== 'question') return undefined;
  const text = renderTemplate(asString(current.config.questionText), state.variables);
  return text || undefined;
}

function closingMessage(state: WorkflowRuntimeState): string {
  const current = nodeById(state, state.currentNodeId);
  const configured = current?.type === 'end' ? asString(current.config.closingMessage) : '';
  return configured || 'Obrigado pelo contato. Até logo.';
}

export async function initializeWorkflowRuntime(
  organizationId: string,
  initialVariables: Record<string, unknown> = {},
  // Optional today because `telephonyService.ts` (Agente 05) does not pass it yet at its two
  // call sites (`startCall`/`startOutboundCall`, both of which already have the resolved `Agent`
  // in scope) — see .agents/handoffs/onda-5/04-para-05-pass-agentid-to-workflow-runtime.md.
  // Without it, `knowledge` nodes execute honestly with zero documents (never a fabricated
  // match) instead of failing; adding the argument is additive and does not change any existing
  // caller's behavior.
  agentId?: string,
): Promise<WorkflowRuntimeState | null> {
  const workflow = await workflowRepository.findActiveWorkflowForTenant(organizationId);
  if (!workflow) return null;

  const { nodes, edges } = toStudioGraph(workflow.nodes, workflow.edges);
  const runtimeIssues = validateRuntimeCompatibility(nodes, edges);
  if (runtimeIssues.length > 0) {
    logger.error(
      {
        organizationId,
        workflowId: workflow.id,
        issueIds: runtimeIssues.map((issue) => issue.id),
      },
      'Active workflow is not runtime-compatible; refusing to execute it',
    );
    return null;
  }

  const start = nodes.find((node) => node.type === 'start');
  if (!start) return null;

  const knowledgeDocuments = agentId
    ? await loadAgentKnowledgeDocuments(organizationId, agentId)
    : [];

  const state: WorkflowRuntimeState = {
    workflowId: workflow.id,
    version: workflow.version,
    currentNodeId: start.id,
    variables: {
      ...Object.fromEntries(
        Object.entries(initialVariables)
          .filter(([, value]) => value !== null && value !== undefined)
          .map(([key, value]) => [key, String(value)]),
      ),
      [RUNTIME_TENANT_ID_VAR]: organizationId,
      ...(agentId ? { [RUNTIME_AGENT_ID_VAR]: agentId } : {}),
      [RUNTIME_KNOWLEDGE_DOCS_VAR]: JSON.stringify(knowledgeDocuments),
    },
    preferredProvider: 'GoogleGemini',
    retries: {},
    ended: false,
    nodes: compileNodes(nodes),
    edges: compileEdges(edges),
  };

  return advanceUntilInteractionAsync(state, start.id);
}

export function getWorkflowOpeningQuestion(state: WorkflowRuntimeState | null): string | null {
  if (!state || state.ended) return null;
  return questionText(state) ?? null;
}

// Single attachment point for `voiceOverride` on every `PreparedWorkflowTurn` this module
// returns (`prepareWorkflowTurn` and `resumeAfterTool`), so no individual `return` inside either
// function has to remember to carry it — see `resolveVoiceOverride`/`getRuntimeVoiceOverride`
// above for what is and is not resolvable.
function attachVoiceOverride(turn: PreparedWorkflowTurn): PreparedWorkflowTurn {
  const voiceOverride = getRuntimeVoiceOverride(turn.state);
  return voiceOverride ? { ...turn, voiceOverride } : turn;
}

/**
 * Checks whether the graph walk just stopped at a node that itself demands a special
 * `PreparedWorkflowTurn.mode` instead of the ordinary `llm`/`direct` result the caller was
 * building — a `tool` node (`tool_pending`, resumed via `resumeAfterTool`) or a `human_handoff`
 * node with a resolvable transfer (`transfer`, terminal — no resume function exists for it).
 * Returns `null` when neither applies, so the caller falls through to its normal `llm`/`direct`
 * logic unchanged. Centralizing this (instead of re-deriving it after every `advancePastCurrent`
 * call, as the pre-Onda-6-rodada-2 `isToolPending` helper required its callers to do individually)
 * is what guarantees a `human_handoff` reached right after a `tool`/`question`/`prompt` node is
 * never silently missed at any of the call sites below.
 */
function pendingInterruptTurn(state: WorkflowRuntimeState): PreparedWorkflowTurn | null {
  const node = nodeById(state, state.currentNodeId);
  if (!node) return null;

  if (node.type === 'tool') {
    return { state, mode: 'tool_pending', shouldEnd: false };
  }

  if (node.type === 'human_handoff') {
    const transferDetails = resolveTransferDetails(node.config);
    if (transferDetails) {
      return { state, mode: 'transfer', transferDetails, shouldEnd: false };
    }
  }

  return null;
}

export function prepareWorkflowTurn(
  state: WorkflowRuntimeState,
  userText: string,
): PreparedWorkflowTurn {
  return attachVoiceOverride(prepareWorkflowTurnInternal(state, userText));
}

function prepareWorkflowTurnInternal(
  state: WorkflowRuntimeState,
  userText: string,
): PreparedWorkflowTurn {
  const next = cloneState(state);
  next.variables.lastUserText = userText;

  if (next.ended) {
    return { state: next, mode: 'direct', directReply: closingMessage(next), shouldEnd: true };
  }

  const current = nodeById(next, next.currentNodeId);
  if (!current) {
    next.ended = true;
    return { state: next, mode: 'direct', directReply: closingMessage(next), shouldEnd: true };
  }

  // Defensive only: a correct caller never calls `prepareWorkflowTurn` again while the previous
  // turn's `mode` was `'tool_pending'`/`'transfer'` — it calls `resumeAfterTool` for the former
  // (see `.agents/handoffs/onda-6/04-para-05-tool-pending-contrato.md`), and there is nothing to
  // resume for the latter (`human_handoff` has no resume function — see
  // `.agents/handoffs/onda-6/04-para-05-transferDetails-contrato.md`). If a caller re-invokes this
  // anyway while still parked on either node, re-signal the same mode rather than silently
  // treating the node as a generic dead end.
  const pendingAtCurrent = pendingInterruptTurn(next);
  if (pendingAtCurrent) return pendingAtCurrent;

  if (current.type === 'question') {
    const regexText = asString(current.config.validationRegex);
    let valid = true;
    if (regexText) {
      try {
        valid = new RegExp(regexText, 'i').test(userText);
      } catch {
        valid = false;
      }
    }

    if (!valid) {
      const attempts = (next.retries[current.id] ?? 0) + 1;
      next.retries[current.id] = attempts;
      const maxRetryCount = Math.max(0, asNumber(current.config.maxRetryCount, 3));
      const fallbackPrompt = renderTemplate(
        asString(current.config.fallbackPrompt) ||
          asString(current.config.questionText) ||
          'Não entendi. Pode repetir?',
        next.variables,
      );

      if (attempts <= maxRetryCount) {
        return { state: next, mode: 'direct', directReply: fallbackPrompt, shouldEnd: false };
      }

      delete next.retries[current.id];
      advancePastCurrent(next, current, 'out-1');
      const pendingAfterRetriesExhausted = pendingInterruptTurn(next);
      if (pendingAfterRetriesExhausted) return pendingAfterRetriesExhausted;
      const nextQuestion = questionText(next);
      return {
        state: next,
        mode: 'direct',
        directReply: [fallbackPrompt, nextQuestion].filter(Boolean).join(' '),
        shouldEnd: next.ended,
      };
    }

    const variableToSave = asString(current.config.variableToSave);
    if (variableToSave) next.variables[variableToSave] = userText;
    delete next.retries[current.id];
    advancePastCurrent(next, current, 'out-0');

    const pendingAfterAnswer = pendingInterruptTurn(next);
    if (pendingAfterAnswer) return pendingAfterAnswer;

    const afterQuestion = nodeById(next, next.currentNodeId);
    if (afterQuestion?.type === 'prompt') {
      const instruction = renderTemplate(asString(afterQuestion.config.promptText), next.variables);
      advancePastCurrent(next, afterQuestion);
      const pendingAfterPrompt = pendingInterruptTurn(next);
      if (pendingAfterPrompt) return pendingAfterPrompt;
      return {
        state: next,
        mode: 'llm',
        systemInstruction: instruction,
        preferredProvider: next.preferredProvider,
        nextQuestion: questionText(next),
        shouldEnd: next.ended,
      };
    }

    const nextQuestion = questionText(next);
    return {
      state: next,
      mode: 'direct',
      directReply:
        nextQuestion ?? (next.ended ? closingMessage(next) : 'Obrigado. Pode continuar.'),
      shouldEnd: next.ended,
    };
  }

  if (current.type === 'prompt') {
    const instruction = renderTemplate(asString(current.config.promptText), next.variables);
    advancePastCurrent(next, current);
    const pendingAfterPrompt = pendingInterruptTurn(next);
    if (pendingAfterPrompt) return pendingAfterPrompt;
    return {
      state: next,
      mode: 'llm',
      systemInstruction: instruction,
      preferredProvider: next.preferredProvider,
      nextQuestion: questionText(next),
      shouldEnd: next.ended,
    };
  }

  next.ended = true;
  return { state: next, mode: 'direct', directReply: closingMessage(next), shouldEnd: true };
}

/**
 * Resumes a call that `prepareWorkflowTurn` paused with `mode: 'tool_pending'` — the async
 * continuation promised in `.agents/handoffs/onda-6/04-para-05-tool-pending-contrato.md`. `node`
 * must be the pending `tool` node (`state.nodes.find((n) => n.id === state.currentNodeId)`, or
 * whatever reference the caller already holds from the turn that returned `tool_pending`); if it
 * does not match a `tool` node actually at `state.currentNodeId`, this degrades to ending the call
 * rather than guessing at a graph position, exactly like `prepareWorkflowTurn` does for any other
 * unresolvable/corrupted state.
 *
 * Performs the real HTTP call (`executeToolNodeAsync`, reusing the same consent gate and
 * `HttpToolExecutor` SSRF/timeout/retry defense already used at call start), then continues
 * walking the graph exactly like `prepareWorkflowTurn` would — including returning another
 * `tool_pending` if a second `tool` node follows immediately, or `tool_ok='false'`/`tool_error`
 * on the same fallback path a live call-start failure already takes (`applyToolFallback`) — never
 * a fabricated success and never an unhandled exception back into `telephonyService.ts`.
 */
export async function resumeAfterTool(
  state: WorkflowRuntimeState,
  node: WorkflowNode,
): Promise<PreparedWorkflowTurn> {
  const next = cloneState(state);
  const toolNode = nodeById(next, node.id);

  if (toolNode?.type !== 'tool') {
    logger.error(
      {
        workflowId: next.workflowId,
        nodeId: node.id,
      },
      'resumeAfterTool called without a matching pending tool node',
    );
    next.ended = true;
    return attachVoiceOverride({
      state: next,
      mode: 'direct',
      directReply: closingMessage(next),
      shouldEnd: true,
    });
  }

  await executeToolNodeAsync(next, toolNode);
  advancePastCurrent(next, toolNode);

  const pendingAfterTool = pendingInterruptTurn(next);
  if (pendingAfterTool) return attachVoiceOverride(pendingAfterTool);

  const current = nodeById(next, next.currentNodeId);

  if (current?.type === 'prompt') {
    const instruction = renderTemplate(asString(current.config.promptText), next.variables);
    advancePastCurrent(next, current);
    const pendingAfterPrompt = pendingInterruptTurn(next);
    if (pendingAfterPrompt) return attachVoiceOverride(pendingAfterPrompt);
    return attachVoiceOverride({
      state: next,
      mode: 'llm',
      systemInstruction: instruction,
      preferredProvider: next.preferredProvider,
      nextQuestion: questionText(next),
      shouldEnd: next.ended,
    });
  }

  if (current?.type === 'question') {
    return attachVoiceOverride({
      state: next,
      mode: 'direct',
      directReply:
        questionText(next) ?? (next.ended ? closingMessage(next) : 'Obrigado. Pode continuar.'),
      shouldEnd: next.ended,
    });
  }

  return attachVoiceOverride({
    state: next,
    mode: 'direct',
    directReply: closingMessage(next),
    shouldEnd: true,
  });
}
