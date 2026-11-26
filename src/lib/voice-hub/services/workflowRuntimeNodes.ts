// Node-level executors and the publish-time capability gate for the workflow runtime, extracted
// from workflowRuntimeService.ts to keep that file under the architecture hotspot limit. All
// functions here are pure with respect to module state: they mutate only the `WorkflowRuntimeState`
// snapshot they are given (or return validation issues), exactly as they did when they lived in the
// service file. Shared types/helpers live in workflowRuntimeShared.ts.

import { logger } from '../../logger.js';
import type { StudioEdge, StudioNode, ValidationIssue } from '../../studio/types.js';
import { executeHttpTool } from '../../voice-runtime/HttpToolExecutor.js';
import {
  type KnowledgeDocument,
  knowledgeConfidenceEngine,
} from '../../voice-runtime/intelligence/KnowledgeConfidenceEngine.js';
import * as agentRepository from '../repositories/agentRepository.js';
import type { AgentConfiguration } from '../types/agent.js';
import { getAiConsent } from './settingService.js';
import {
  asNumber,
  asOptionalNumber,
  asRecord,
  asString,
  branchHandles,
  getRuntimeAgentId,
  getRuntimeKnowledgeDocuments,
  getRuntimeTenantId,
  isTruthy,
  mapRuntimeProvider,
  normalizeComparable,
  orderedOutgoing,
  outgoingFor,
  RUNTIME_VOICE_OVERRIDE_VAR,
  type RuntimeConfig,
  type RuntimeEdge,
  type RuntimeNode,
  type RuntimeNodeType,
  renderTemplate,
  resolveTransferDetails,
  resolveVoiceOverride,
  SUPPORTED_TOOL_METHODS,
  SUPPORTED_TYPES,
  selectDefaultEdge,
  selectHandle,
  UNSUPPORTED_REASON,
  type WorkflowRuntimeState,
} from './workflowRuntimeShared.js';

/**
 * Server-side capability gate for the runtime, complementary to ValidationEngine's graph-shape
 * validation. A workflow may be visually valid yet still contain a node that the production
 * telephony executor cannot honestly execute. Those graphs fail closed at publish time instead
 * of being marked active and silently ignored during a real call.
 */
export function validateRuntimeCompatibility(
  nodes: StudioNode[],
  edges: StudioEdge[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const node of nodes) {
    const type = node.type;
    if (!type || !SUPPORTED_TYPES.has(type as RuntimeNodeType)) {
      const reason = type ? UNSUPPORTED_REASON[type] : 'O nó não possui um tipo executável.';
      issues.push({
        id: `err-runtime-unsupported-${node.id}`,
        nodeId: node.id,
        type: 'error',
        message: `Este nó ainda não pode ser publicado no runtime de telefonia. ${reason ?? 'Executor de produção indisponível.'}`,
      });
      continue;
    }

    const outgoing = outgoingFor(edges, node.id);
    if (
      !['condition', 'switch', 'question'].includes(type) &&
      type !== 'end' &&
      outgoing.length > 1
    ) {
      issues.push({
        id: `err-runtime-fanout-${node.id}`,
        nodeId: node.id,
        type: 'error',
        message:
          'O runtime exige uma única saída para nós não condicionais; fan-out paralelo ainda não é executado de forma determinística.',
      });
    }

    const config = asRecord(node.data.config);

    if (type === 'llm' && !mapRuntimeProvider(config.provider)) {
      issues.push({
        id: `err-runtime-provider-${node.id}`,
        nodeId: node.id,
        type: 'error',
        message: 'Provedor LLM não suportado pelo runtime. Use Gemini, OpenAI ou Claude.',
      });
    }

    if (type === 'tool') {
      const method = asString(config.method).toUpperCase() || 'GET';
      if (!SUPPORTED_TOOL_METHODS.has(method)) {
        issues.push({
          id: `err-runtime-tool-method-${node.id}`,
          nodeId: node.id,
          type: 'error',
          message: `Método HTTP '${method}' não é suportado pelo executor de Tool. Use GET, POST, PUT, PATCH ou DELETE.`,
        });
      }
    }

    if (type === 'condition') {
      if (isTruthy(config.naturalLanguageCheck)) {
        issues.push({
          id: `err-runtime-nl-condition-${node.id}`,
          nodeId: node.id,
          type: 'error',
          message:
            'Condição em linguagem natural ainda não é executável. Use uma variável de sessão e operador determinístico.',
        });
      }

      const operator = asString(config.operator).toLowerCase() || 'equals';
      if (
        ![
          'equals',
          'not_equals',
          'contains',
          'not_contains',
          'exists',
          'not_exists',
          'regex',
        ].includes(operator)
      ) {
        issues.push({
          id: `err-runtime-condition-operator-${node.id}`,
          nodeId: node.id,
          type: 'error',
          message: `Operador de condição '${operator}' não é suportado pelo runtime.`,
        });
      }

      const handles = branchHandles(edges, node.id);
      if (!handles.has('out-0') || !handles.has('out-1')) {
        issues.push({
          id: `err-runtime-condition-edges-${node.id}`,
          nodeId: node.id,
          type: 'error',
          message: 'Condition precisa conectar out-0 (verdadeiro) e out-1 (falso/fallback).',
        });
      }
    }

    if (type === 'question') {
      const handles = branchHandles(edges, node.id);
      if (!handles.has('out-0') || !handles.has('out-1')) {
        issues.push({
          id: `err-runtime-question-edges-${node.id}`,
          nodeId: node.id,
          type: 'error',
          message:
            'Question precisa conectar out-0 (resposta válida) e out-1 (tentativas esgotadas).',
        });
      }

      const validationRegex = asString(config.validationRegex);
      if (validationRegex) {
        try {
          new RegExp(validationRegex, 'i');
        } catch {
          issues.push({
            id: `err-runtime-question-regex-${node.id}`,
            nodeId: node.id,
            type: 'error',
            message: 'A expressão regular configurada na Question é inválida.',
          });
        }
      }
    }

    if (type === 'switch') {
      const outgoingSwitch = outgoingFor(edges, node.id);
      const invalidHandle = outgoingSwitch.find(
        (edge) =>
          !edge.data?.isFallback &&
          !(typeof edge.sourceHandle === 'string' && /^out-\d+$/.test(edge.sourceHandle)),
      );
      if (invalidHandle) {
        issues.push({
          id: `err-runtime-switch-edge-${invalidHandle.id}`,
          nodeId: node.id,
          type: 'error',
          message:
            'Cada saída do Switch precisa usar um sourceHandle out-N ou ser marcada explicitamente como fallback.',
        });
      }
    }
  }

  return issues;
}

function applyMemoryNode(config: RuntimeConfig, variables: Record<string, string>): void {
  const operation = asString(config.operation).toLowerCase();
  const variableName = asString(config.variableName);

  if (operation === 'reset' || operation === 'reset session') {
    for (const key of Object.keys(variables)) delete variables[key];
    return;
  }

  if (!variableName) return;

  if (
    operation === 'delete variable' ||
    operation === 'remove variable' ||
    operation === 'delete'
  ) {
    delete variables[variableName];
    return;
  }

  variables[variableName] = renderTemplate(asString(config.variableValue), variables);
}

function evaluateCondition(config: RuntimeConfig, variables: Record<string, string>): boolean {
  const variable = asString(config.variable);
  const operator = asString(config.operator).toLowerCase() || 'equals';
  const actual = variables[variable] ?? '';
  const expected = renderTemplate(asString(config.value), variables);
  const a = normalizeComparable(actual);
  const b = normalizeComparable(expected);

  switch (operator) {
    case 'equals':
      return a === b;
    case 'not_equals':
      return a !== b;
    case 'contains':
      return a.includes(b);
    case 'not_contains':
      return !a.includes(b);
    case 'exists':
      return actual.trim().length > 0;
    case 'not_exists':
      return actual.trim().length === 0;
    case 'regex': {
      try {
        return new RegExp(expected, 'i').test(actual);
      } catch {
        return false;
      }
    }
    default:
      return false;
  }
}

function routeSwitch(state: WorkflowRuntimeState, node: RuntimeNode): RuntimeEdge | null {
  const variableName = asString(node.config.variableToCheck);
  const actual = normalizeComparable(state.variables[variableName] ?? '');
  const paths = Object.entries(node.config)
    .map(([key, value]) => {
      const match = /^path(\d+)$/.exec(key);
      return match ? { index: Number(match[1]), value: asString(value) } : null;
    })
    .filter((entry): entry is { index: number; value: string } => entry !== null)
    .sort((a, b) => a.index - b.index);

  const matched = paths.find((entry) => normalizeComparable(entry.value) === actual);
  if (matched) return selectHandle(state, node.id, `out-${matched.index}`);

  return orderedOutgoing(state, node.id).find((edge) => edge.isFallback) ?? null;
}

/**
 * `evaluateKnowledge` is a keyword-confidence lookup over whatever documents were baked into the
 * state snapshot at call start, NOT a real vector/embeddings search — see
 * `KnowledgeConfidenceEngine.ts`'s own "RAG Simulator" comment and
 * `docs/patterns/workflow-execution-contract.md` §2. This function must never present a
 * low-confidence/no-match result as a fact (AGENTS.md §14) and must never invent a result for a
 * `database` name that matches no configured document.
 *
 * The query is always the caller's most recent utterance (`variables.lastUserText`) — the Studio
 * config table for `knowledge` (`ragTopK`, `minScoreThreshold`, `searchStrategy`,
 * `autoChunkSize`) has no field to pick a different query source today. `ragTopK`/
 * `searchStrategy`/`autoChunkSize` are accepted by the Studio schema but are NOT honored here:
 * the engine returns a single best match, not a ranked top-K over chunked documents. Only
 * `minScoreThreshold` is honored, as an additional (never looser) floor on top of the engine's
 * own fixed threshold.
 */
function applyKnowledgeNode(state: WorkflowRuntimeState, node: RuntimeNode): void {
  const query = state.variables.lastUserText ?? '';
  const requestedDatabase = asString(node.config.database);
  const documents = getRuntimeKnowledgeDocuments(state);
  const pool = requestedDatabase
    ? documents.filter(
        (doc) => normalizeComparable(doc.name) === normalizeComparable(requestedDatabase),
      )
    : documents;

  const result = knowledgeConfidenceEngine.evaluateKnowledge(query, pool);
  const minScoreThreshold = asNumber(node.config.minScoreThreshold, 0);
  const isLowConfidence = result.isLowConfidence || result.confidence < minScoreThreshold;

  // Fixed variable names (no `variableToSave` field exists for `knowledge` in the Studio config
  // table) — a downstream `prompt`/`question`/`condition` node reads these via the existing
  // `{{variable}}` template mechanism (see renderTemplate). Both a generic "most recent lookup"
  // set and a per-node-id set are written so multiple knowledge nodes in one graph don't clobber
  // each other's result.
  state.variables.knowledge_result = result.snippetUsed;
  state.variables.knowledge_document = result.document;
  state.variables.knowledge_confidence = String(result.confidence);
  state.variables.knowledge_is_low_confidence = String(isLowConfidence);
  state.variables[`knowledge_${node.id}_result`] = result.snippetUsed;
  state.variables[`knowledge_${node.id}_is_low_confidence`] = String(isLowConfidence);
}

// The Studio's `tool` node registry persists `headers` as a JSON-encoded string in
// `data.config.headers` (see `store/useStudioStore.ts`'s `tool` node `defaultConfig`, e.g.
// `'{"Authorization": "Bearer token_secret"}'`) — every workflow published through the Inspector
// carries it that way, never as a live object. Parsing it here (instead of requiring an object) is
// what actually makes a configured header like `Authorization` reach the request; accepting an
// object too keeps this tolerant of a future Studio change without another silent breakage.
function toToolHeaders(value: unknown, variables: Record<string, string>): Record<string, string> {
  let parsed: unknown = value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return {};
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return {};
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  const headers: Record<string, string> = {};
  for (const [key, raw] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof raw === 'string') headers[key] = renderTemplate(raw, variables);
  }
  return headers;
}

/**
 * `tool` failure fallback — applied whenever a real HTTP attempt (`executeToolNodeAsync`) did not
 * end in `result.ok`, regardless of which entry point drove it (call-start's
 * `advanceUntilInteractionAsync`, or a mid-call `resumeAfterTool`). Never a fabricated success,
 * never an unhandled exception up into `telephonyService.ts`.
 *
 * Onda 6 history: through Onda 5, a `tool` node reached mid-conversation (via the synchronous
 * `prepareWorkflowTurn`) could not perform a real network call at all — the synchronous path had
 * no way to `await` one — so it degraded straight to this fallback without ever calling the
 * configured endpoint. As of Onda 6, `advanceUntilInteraction` (sync) instead stops the graph at a
 * `tool` node (`mode: 'tool_pending'`, see `PreparedWorkflowTurn`) and the real call happens in
 * `resumeAfterTool` (workflowRuntimeService.ts) — this function is now reached only on a genuine
 * failure (timeout, blocked URL, non-2xx, consent not granted), never merely because the call was
 * reached mid-conversation. See `.agents/handoffs/onda-6/04-para-05-tool-pending-contrato.md`.
 */
function applyToolFallback(state: WorkflowRuntimeState, node: RuntimeNode, reason: string): void {
  state.variables.tool_ok = 'false';
  state.variables.tool_status = reason;
  state.variables.tool_error = reason;
  // biome-ignore lint/performance/noDelete: variables é Record<string,string> — `= undefined` não
  // compila; delete é a única forma de remover a chave e preservar a semântica de "ausente".
  delete state.variables.tool_result;
  state.variables[`tool_${node.id}_ok`] = 'false';
  state.variables[`tool_${node.id}_error`] = reason;
}

/**
 * Real execution path for a `tool` node — called from `advanceUntilInteractionAsync` (before the
 * call's first `prompt`/`question`) and, as of Onda 6, from `resumeAfterTool` (a `tool` node
 * reached later, mid-conversation). SSRF/timeout/retry defense lives in `executeHttpTool`
 * (`lib/voice-runtime/HttpToolExecutor.ts`), reusing `isPrivateOrReservedHost` from
 * `src/validators/index.ts` — never re-implemented here.
 *
 * Gated on the same tenant-level external-data-egress consent already required for AI providers
 * (`getAiConsent`, AGENTS.md §16) before the call fires: a `tool` node sends caller/lead fields
 * (`{{from}}`, `{{to}}`, workflow variables) to a tenant-configured URL, an external destination
 * for personal data exactly like the AI Gateway's, and today the only consent primitive this
 * platform has is that one — reusing it here is a real check now rather than none while a
 * dedicated "tool endpoint" consent flag is decided as a separate product change. Checked fresh on
 * every call (never cached in the immutable per-call state), fail-closed on the lookup itself
 * erroring (mirrors `requireAiProviderConsent`'s middleware, which returns 503 rather than
 * treating a DB error as "no consent") — never fabricate consent, never let an outage silently
 * downgrade to "allowed".
 */
export async function executeToolNodeAsync(
  state: WorkflowRuntimeState,
  node: RuntimeNode,
): Promise<void> {
  const organizationId = getRuntimeTenantId(state);
  try {
    const consent = await getAiConsent(organizationId);
    if (!consent.granted) {
      logger.warn(
        {
          workflowId: state.workflowId,
          organizationId,
          nodeId: node.id,
        },
        'Workflow tool node blocked: tenant has not granted external data consent',
      );
      applyToolFallback(state, node, 'consent_not_granted');
      return;
    }
  } catch (error: any) {
    logger.error(
      {
        workflowId: state.workflowId,
        organizationId,
        nodeId: node.id,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to verify tenant consent before executing workflow tool node',
    );
    applyToolFallback(state, node, 'consent_check_unavailable');
    return;
  }

  const endpoint = renderTemplate(asString(node.config.endpoint), state.variables);
  const bodyPayload =
    typeof node.config.bodyPayload === 'string'
      ? renderTemplate(node.config.bodyPayload, state.variables)
      : node.config.bodyPayload;

  const result = await executeHttpTool({
    method: asString(node.config.method) || 'GET',
    endpoint,
    headers: toToolHeaders(node.config.headers, state.variables),
    bodyPayload,
    timeoutMs: asOptionalNumber(node.config.timeoutMs),
    retryLimit: asOptionalNumber(node.config.retryLimit),
  });

  if (result.ok) {
    state.variables.tool_ok = 'true';
    state.variables.tool_status = String(result.status ?? '');
    state.variables.tool_result = result.body ?? '';
    // biome-ignore lint/performance/noDelete: idem applyToolFallback — Record<string,string>.
    delete state.variables.tool_error;
    state.variables[`tool_${node.id}_ok`] = 'true';
    state.variables[`tool_${node.id}_result`] = result.body ?? '';
    logger.info(
      {
        workflowId: state.workflowId,
        organizationId: getRuntimeTenantId(state),
        agentId: getRuntimeAgentId(state),
        nodeId: node.id,
        status: result.status,
      },
      'Workflow tool node executed successfully',
    );
    return;
  }

  logger.warn(
    {
      workflowId: state.workflowId,
      organizationId: getRuntimeTenantId(state),
      agentId: getRuntimeAgentId(state),
      nodeId: node.id,
      reason: result.error,
    },
    'Workflow tool node failed; continuing the call on the fallback path',
  );
  applyToolFallback(state, node, result.error ?? 'unknown_error');
}

export async function loadAgentKnowledgeDocuments(
  organizationId: string,
  agentId: string,
): Promise<KnowledgeDocument[]> {
  try {
    // Tenant-scoped lookup: `agentRepository.getAgent` only returns a row when `agentId` actually
    // belongs to `organizationId`, so a mismatched/foreign agentId yields no documents rather than
    // another tenant's knowledge base — this is the tenant-isolation guarantee for `knowledge`.
    const agent = await agentRepository.getAgent(agentId, organizationId);
    if (!agent) return [];
    const config = (agent.configuration as unknown as AgentConfiguration) || {};
    return Array.isArray(config.knowledge) ? config.knowledge : [];
  } catch (error: any) {
    logger.error(
      {
        organizationId,
        agentId,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to load agent knowledge documents for workflow runtime',
    );
    return [];
  }
}

/**
 * Executes every node type that has no I/O side effect requiring `await` — shared by both
 * `advanceUntilInteraction` (sync, every phone turn) and `advanceUntilInteractionAsync` (async,
 * call start only) so `condition`/`switch`/`memory`/`llm`/`knowledge` semantics can never drift
 * between the two entry points. Returns the id of the next node to visit, or `null` to stop.
 * Caller has already handled `prompt`/`question`/`end`/`tool` before reaching this function.
 */
export function advanceDeterministicNode(
  state: WorkflowRuntimeState,
  node: RuntimeNode,
): string | null {
  if (node.type === 'llm') {
    const provider = mapRuntimeProvider(node.config.provider);
    if (provider) state.preferredProvider = provider;
    return selectDefaultEdge(state, node.id)?.target ?? null;
  }

  if (node.type === 'memory') {
    applyMemoryNode(node.config, state.variables);
    return selectDefaultEdge(state, node.id)?.target ?? null;
  }

  if (node.type === 'condition') {
    const matched = evaluateCondition(node.config, state.variables);
    return selectHandle(state, node.id, matched ? 'out-0' : 'out-1')?.target ?? null;
  }

  if (node.type === 'switch') {
    return routeSwitch(state, node)?.target ?? null;
  }

  if (node.type === 'knowledge') {
    applyKnowledgeNode(state, node);
    return selectDefaultEdge(state, node.id)?.target ?? null;
  }

  if (node.type === 'voice') {
    // Passive node: it never interacts with the caller by itself, only (re)sets the active
    // Twilio voice override for whatever interaction comes next — see `resolveVoiceOverride`.
    // Reaching a `voice` node with no known mapping clears any earlier override rather than
    // leaving a stale one from a previous `voice` node in the same call.
    const override = resolveVoiceOverride(node.config);
    if (override) {
      state.variables[RUNTIME_VOICE_OVERRIDE_VAR] = JSON.stringify(override);
    } else {
      delete state.variables[RUNTIME_VOICE_OVERRIDE_VAR];
    }
    return selectDefaultEdge(state, node.id)?.target ?? null;
  }

  return selectDefaultEdge(state, node.id)?.target ?? null;
}

export function hasResolvableTransfer(node: RuntimeNode): boolean {
  return resolveTransferDetails(node.config) !== undefined;
}

/**
 * Shared by both graph walkers (`advanceUntilInteraction`/`advanceUntilInteractionAsync`): a
 * `human_handoff` node reached with no configured `fallbackNumber` is never a stopping point —
 * AGENTS.md §14 forbids fabricating a transfer destination, so this treats it exactly like a
 * failed `tool` node (see `applyToolFallback`): log a warning, leave a recoverable
 * `handoff_ok`/`handoff_error` pair for a downstream `condition` node, and continue the walk past
 * it on its single outgoing edge (or stop the call if it has none). Never invents a phone number.
 */
export function skipUnresolvableHumanHandoff(
  state: WorkflowRuntimeState,
  node: RuntimeNode,
): string | null {
  logger.warn(
    {
      workflowId: state.workflowId,
      nodeId: node.id,
    },
    'Workflow human_handoff node has no fallbackNumber configured; skipping the transfer and continuing on the default path',
  );
  state.variables.handoff_ok = 'false';
  state.variables.handoff_error = 'fallback_number_missing';
  state.variables[`handoff_${node.id}_ok`] = 'false';
  state.variables[`handoff_${node.id}_error`] = 'fallback_number_missing';
  return selectDefaultEdge(state, node.id)?.target ?? null;
}
