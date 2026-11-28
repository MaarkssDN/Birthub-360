// Internal shared module for workflowRuntimeService.ts — types, constants and pure graph/config
// helpers used by both the node executors (workflowRuntimeNodes.ts) and the turn orchestration
// (workflowRuntimeService.ts). Extracted to keep workflowRuntimeService.ts under the architecture
// hotspot limit; nothing here is part of the module's public API (the service re-exports only the
// types/functions it always exported).

import type { Prisma } from '@prisma/client';
import type { StudioEdge, StudioNode } from '../../studio/types.js';
import type { KnowledgeDocument } from '../../voice-runtime/intelligence/KnowledgeConfidenceEngine.js';

export type RuntimeProvider = 'GoogleGemini' | 'OpenAI' | 'Claude';
export type RuntimeNodeType =
  | 'start'
  | 'llm'
  | 'prompt'
  | 'question'
  | 'condition'
  | 'switch'
  | 'memory'
  | 'end'
  | 'knowledge'
  | 'tool'
  | 'voice'
  | 'human_handoff';

export type RuntimeConfig = Record<string, Prisma.JsonValue>;

export interface RuntimeNode extends Record<string, Prisma.JsonValue> {
  id: string;
  type: RuntimeNodeType;
  config: RuntimeConfig;
}

// Public alias for `RuntimeNode`, exported so a caller resuming an interrupted turn (Agente 05,
// see `resumeAfterTool` below and `.agents/handoffs/onda-6/04-para-05-tool-pending-contrato.md`)
// has a named type to reference without importing the internal `RuntimeNode` name. Structurally
// identical — `state.nodes` (already public on `WorkflowRuntimeState`) is exactly `WorkflowNode[]`.
export type WorkflowNode = RuntimeNode;

export interface RuntimeEdge extends Record<string, Prisma.JsonValue> {
  id: string;
  source: string;
  target: string;
  sourceHandle: string | null;
  isFallback: boolean;
  priority: number;
}

/**
 * This snapshot is persisted inside Session.metadata, so its public type deliberately satisfies
 * Prisma.JsonObject. Keeping the runtime state JSON-safe prevents test-only casts from hiding a
 * production persistence mismatch and makes the session snapshot portable across workers.
 *
 * Deliberately NOT extended with new top-level fields for organizationId/agentId/knowledgeDocuments
 * (added in Onda 5 for `knowledge` node support) — every field here must be a required, always
 * JSON-safe (non-`undefined`) value, because `extends Record<string, Prisma.JsonValue>` and an
 * optional property (`foo?: T`, whose type TypeScript always widens to `T | undefined`) cannot
 * coexist on one interface. A genuinely new REQUIRED field is equally unworkable here: both
 * `__tests__/telephonyService.test.ts` and `__tests__/workflowRuntimeService.test.ts` (Agente 08,
 * out of scope for this agent) build `WorkflowRuntimeState`/`Session.metadata` fixtures that
 * predate Onda 5 and do not set it, and TypeScript's spread-of-`Partial<T>` inference makes a
 * required-but-fixture-omitted field surface as `T | undefined` there too. So call-scoped,
 * JSON-safe-but-not-structurally-required data added after the original 9 fields below lives
 * inside the existing required `variables` map instead, under the reserved `__runtime*` keys —
 * see `getRuntimeTenantId`/`getRuntimeAgentId`/`getRuntimeKnowledgeDocuments` further down.
 */
export interface WorkflowRuntimeState extends Record<string, Prisma.JsonValue> {
  workflowId: string;
  version: number;
  currentNodeId: string | null;
  variables: Record<string, string>;
  preferredProvider: RuntimeProvider;
  retries: Record<string, number>;
  ended: boolean;
  nodes: RuntimeNode[];
  edges: RuntimeEdge[];
}

// Reserved `variables` keys carrying call-scoped runtime context (see the `WorkflowRuntimeState`
// doc comment above for why these live inside `variables` instead of as top-level fields). Not
// namespaced against a user typing the literal string in a Studio prompt/condition — an
// astronomically unlikely collision, and even then the leaked value (a tenant id) is not a
// secret — but kept clearly distinguishable from ordinary session variables regardless.
export const RUNTIME_TENANT_ID_VAR = '__runtimeTenantId';
export const RUNTIME_AGENT_ID_VAR = '__runtimeAgentId';
export const RUNTIME_KNOWLEDGE_DOCS_VAR = '__runtimeKnowledgeDocumentsJson';
// Holds the last successfully resolved `voice` node override as it is carried forward across
// turns inside the same JSON-safe `variables` map (see the `WorkflowRuntimeState` doc comment
// above) — same reserved-key pattern as tenant/agent id and knowledge documents.
export const RUNTIME_VOICE_OVERRIDE_VAR = '__runtimeVoiceOverrideJson';

export function getRuntimeTenantId(state: WorkflowRuntimeState): string {
  return state.variables[RUNTIME_TENANT_ID_VAR] ?? '';
}

export function getRuntimeAgentId(state: WorkflowRuntimeState): string | null {
  return state.variables[RUNTIME_AGENT_ID_VAR] || null;
}

export function getRuntimeKnowledgeDocuments(state: WorkflowRuntimeState): KnowledgeDocument[] {
  const raw = state.variables[RUNTIME_KNOWLEDGE_DOCS_VAR];
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as KnowledgeDocument[]) : [];
  } catch {
    // A corrupted/hand-edited session snapshot must degrade to "no documents", never throw
    // mid-call — same fail-safe posture as `toStudioGraph` treating a malformed nodes/edges Json
    // column as `[]` in `initializeWorkflowRuntime`.
    return [];
  }
}

export function getRuntimeVoiceOverride(state: WorkflowRuntimeState): VoiceOverride | undefined {
  const raw = state.variables[RUNTIME_VOICE_OVERRIDE_VAR];
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      typeof (parsed as Record<string, unknown>).voice === 'string' &&
      (parsed as Record<string, unknown>).voice
    ) {
      const language = (parsed as Record<string, unknown>).language;
      return {
        voice: (parsed as { voice: string }).voice,
        ...(typeof language === 'string' && language ? { language } : {}),
      };
    }
    return undefined;
  } catch {
    // Same fail-safe posture as `getRuntimeKnowledgeDocuments`: a corrupted snapshot degrades to
    // "no override" (Twilio's default voice), never a thrown error mid-call.
    return undefined;
  }
}

/**
 * Twilio's own named TTS voice, resolved from the nearest `voice` node the call has passed
 * through (Onda 6 MVP — see the `resolveVoiceOverride` doc comment below for exactly what is and
 * is not honored). Absent whenever no `voice` node has been reached yet, or the configured
 * `provider`/`voiceId` has no known Twilio-native mapping.
 */
export interface VoiceOverride {
  voice: string;
  language?: string;
}

/**
 * MVP transfer target resolved from the nearest `human_handoff` node the call has passed through
 * (Onda 6 rodada 2 — see `resolveTransferDetails` below for exactly what is and is not resolved).
 * `to` is always the node's own literal `fallbackNumber` — this MVP dials that number directly and
 * has no department->number lookup/PBX routing; `department` is carried through purely as a label
 * for logging/observability on the telephony side, never resolved into a phone number itself. See
 * `.agents/handoffs/onda-6/04-para-05-transferDetails-contrato.md`.
 */
export interface TransferDetails {
  to: string;
  timeoutSec: number;
  record: boolean;
  message: string;
  department?: string;
}

export interface PreparedWorkflowTurn {
  state: WorkflowRuntimeState;
  mode: 'llm' | 'direct' | 'tool_pending' | 'transfer';
  systemInstruction?: string;
  preferredProvider?: RuntimeProvider;
  directReply?: string;
  nextQuestion?: string;
  shouldEnd: boolean;
  voiceOverride?: VoiceOverride;
  transferDetails?: TransferDetails;
}

export const SUPPORTED_TYPES = new Set<RuntimeNodeType>([
  'start',
  'llm',
  'prompt',
  'question',
  'condition',
  'switch',
  'memory',
  'end',
  'knowledge',
  'tool',
  'voice',
  'human_handoff',
]);

// 'knowledge' and 'tool' were unsupported through Onda 4 (see git history for the removed
// UNSUPPORTED_REASON entries) — as of Onda 5 they are executed for real
// (`applyKnowledgeNode`/`executeToolNodeAsync` in workflowRuntimeNodes.ts). 'voice' became
// executable in Onda 6 rodada 1 as a Twilio-named-TTS MVP (see `resolveVoiceOverride` below and
// `.agents/handoffs/onda-6/04-para-05-voiceOverride-contrato.md`) — it is a passive node that only
// sets `PreparedWorkflowTurn.voiceOverride` and continues to the next node, never an interaction
// by itself. 'human_handoff' became executable in Onda 6 rodada 2
// (`.agents/handoffs/onda-6/00-para-04-human-handoff-mvp.md`): the Studio node already carries a
// literal `fallbackNumber` phone number in its own config (no department->number lookup/schema
// change needed, which was the blocker `.agents/handoffs/onda-5/04-para-05-voice-human-handoff-
// design.md` raised) — see `resolveTransferDetails` below. It is a terminal-of-turn node exactly
// like `prompt`/`question`/`tool`: the synchronous graph walk stops there and
// `PreparedWorkflowTurn.mode` becomes `'transfer'`; unlike `tool`, there is no resume function —
// the runtime has nothing further to execute once a real telephony bridge takes over (Agente 05,
// `telephony.controller.ts`). See docs/patterns/workflow-execution-contract.md §2/§3 for the
// up-to-date executable list. No node type is unsupported by the runtime's capability gate today —
// `UNSUPPORTED_REASON` is kept (empty) as the extension point for the next node type that needs it,
// rather than removed, so `validateRuntimeCompatibility` does not need reshaping again next time.
export const UNSUPPORTED_REASON: Partial<Record<string, string>> = {};

export const SUPPORTED_TOOL_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

export function asRecord(value: unknown): RuntimeConfig {
  // Workflow config is persisted in a Prisma Json column before it reaches the runtime. This cast
  // narrows that already-validated JSON boundary; the runtime never accepts arbitrary JS objects
  // directly from request bodies here.
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as RuntimeConfig)
    : {};
}

export function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function isTruthy(value: unknown): boolean {
  return value === true || (typeof value === 'string' && value.trim().toLowerCase() === 'true');
}

export function asOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function toStudioGraph(
  nodes: unknown,
  edges: unknown,
): { nodes: StudioNode[]; edges: StudioEdge[] } {
  return {
    nodes: Array.isArray(nodes) ? (nodes as StudioNode[]) : [],
    edges: Array.isArray(edges) ? (edges as StudioEdge[]) : [],
  };
}

export function outgoingFor(edges: StudioEdge[], nodeId: string): StudioEdge[] {
  return edges.filter((edge) => edge.source === nodeId);
}

export function branchHandles(edges: StudioEdge[], nodeId: string): Set<string> {
  return new Set(
    outgoingFor(edges, nodeId)
      .map((edge) => edge.sourceHandle)
      .filter((handle): handle is string => typeof handle === 'string' && handle.length > 0),
  );
}

// Twilio's <Say> verb synthesizes speech only from Twilio's own voice catalog — Amazon Polly
// voices under a `Polly.<Name>` identifier, or Google voices under `Google.<name>`
// (https://www.twilio.com/docs/voice/twiml/say#voice). It has no concept of an ElevenLabs voice
// id at all, so a Studio `voice` node's default config (`provider: 'ElevenLabs', voiceId:
// 'Rachel_pt_BR'`) has no honest translation into a Twilio voice name — Option 2 (real
// ElevenLabs synthesis via <Play>) would be needed for that, and is explicitly out of scope for
// this MVP (see .agents/handoffs/onda-6/00-para-04-tool-midcall-voice-upload.md). This table only
// recognizes voice identifiers that ARE ALREADY real, documented Twilio voice names — it never
// guesses "the closest Twilio voice" for an unrelated provider's voice id (AGENTS.md §14: never
// fabricate). Keys are matched case-insensitively, both with and without the `Polly.`/`Google.`
// prefix, against whatever a tenant typed into the Studio inspector's `voiceId` field.
const KNOWN_TWILIO_VOICE_NAMES: Record<string, string> = {
  'polly.camila': 'Polly.Camila',
  camila: 'Polly.Camila',
  'polly.camila-neural': 'Polly.Camila-Neural',
  'camila-neural': 'Polly.Camila-Neural',
  'polly.vitoria': 'Polly.Vitoria',
  vitoria: 'Polly.Vitoria',
  'polly.vitória': 'Polly.Vitoria',
  vitória: 'Polly.Vitoria',
  'polly.ricardo': 'Polly.Ricardo',
  ricardo: 'Polly.Ricardo',
  'google.pt-br-standard-a': 'Google.pt-BR-Standard-A',
  'pt-br-standard-a': 'Google.pt-BR-Standard-A',
};

// Only a `provider` naming Twilio's own TTS engines is even eligible for the lookup above — this
// is a second, independent guard (not a substitute for the allowlist itself) against an
// accidental short-name collision with an unrelated provider's voice id.
const TWILIO_NATIVE_VOICE_PROVIDERS = new Set([
  'twilio',
  'amazonpolly',
  'amazon',
  'polly',
  'google',
  'googletts',
  'googlecloudtts',
]);

/**
 * Resolves a Studio `voice` node's `provider`/`voiceId` into the Twilio-native voice name
 * `PreparedWorkflowTurn.voiceOverride` carries. Only `voiceId` (an already-valid Twilio/Polly/
 * Google voice identifier) and, if present, `language` are honored — `stability`/`clarity`/
 * `speechRate` (ElevenLabs-specific synthesis controls) have no Twilio <Say> equivalent and are
 * silently ignored, never rejected as a validation error (see
 * docs/patterns/workflow-execution-contract.md §3). Returns `undefined` whenever there is no known
 * mapping — the caller must never fall back to guessing a voice name.
 */
export function resolveVoiceOverride(config: RuntimeConfig): VoiceOverride | undefined {
  const provider = asString(config.provider)
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
  const voiceId = asString(config.voiceId);
  if (!voiceId || !TWILIO_NATIVE_VOICE_PROVIDERS.has(provider)) return undefined;

  const mapped = KNOWN_TWILIO_VOICE_NAMES[voiceId.toLowerCase()];
  if (!mapped) return undefined;

  const language = asString(config.language);
  return { voice: mapped, ...(language ? { language } : {}) };
}

const DEFAULT_TRANSFER_TIMEOUT_SEC = 30;
const DEFAULT_TRANSFER_MESSAGE = 'Aguarde um momento enquanto encaminho sua ligação.';

/**
 * Resolves a Studio `human_handoff` node's config into the `TransferDetails` Agente 05 dials —
 * MVP: `to` is always the node's own literal `fallbackNumber`, never a department->number lookup
 * (that remains a separate, out-of-scope PBX-routing feature — see
 * `.agents/handoffs/onda-6/04-para-05-transferDetails-contrato.md`). Returns `undefined` whenever
 * `fallbackNumber` is missing/empty — the caller must never invent a destination number.
 */
export function resolveTransferDetails(config: RuntimeConfig): TransferDetails | undefined {
  const to = asString(config.fallbackNumber);
  if (!to) return undefined;

  const timeoutSec = asNumber(config.ringTimeoutSec, DEFAULT_TRANSFER_TIMEOUT_SEC);
  const record = isTruthy(config.recordCall);
  const message = asString(config.transferMessage) || DEFAULT_TRANSFER_MESSAGE;
  const department = asString(config.department);

  return { to, timeoutSec, record, message, ...(department ? { department } : {}) };
}

export function mapRuntimeProvider(value: unknown): RuntimeProvider | null {
  const normalized = asString(value)
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
  if (normalized === 'gemini' || normalized === 'googlegemini') return 'GoogleGemini';
  if (normalized === 'openai') return 'OpenAI';
  if (normalized === 'claude' || normalized === 'anthropic') return 'Claude';
  return null;
}

export function compileNodes(nodes: StudioNode[]): RuntimeNode[] {
  return nodes
    .filter((node): node is StudioNode & { type: RuntimeNodeType } =>
      Boolean(node.type && SUPPORTED_TYPES.has(node.type as RuntimeNodeType)),
    )
    .map((node) => ({ id: node.id, type: node.type, config: asRecord(node.data.config) }));
}

export function compileEdges(edges: StudioEdge[]): RuntimeEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: typeof edge.sourceHandle === 'string' ? edge.sourceHandle : null,
    isFallback: edge.data?.isFallback === true,
    priority: typeof edge.data?.priority === 'number' ? edge.data.priority : 0,
  }));
}

export function nodeById(state: WorkflowRuntimeState, nodeId: string | null): RuntimeNode | null {
  if (!nodeId) return null;
  return state.nodes.find((node) => node.id === nodeId) ?? null;
}

export function orderedOutgoing(state: WorkflowRuntimeState, nodeId: string): RuntimeEdge[] {
  return state.edges
    .filter((edge) => edge.source === nodeId)
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
}

export function selectHandle(
  state: WorkflowRuntimeState,
  nodeId: string,
  handle: string,
): RuntimeEdge | null {
  const outgoing = orderedOutgoing(state, nodeId);
  return (
    outgoing.find((edge) => edge.sourceHandle === handle) ??
    outgoing.find((edge) => edge.isFallback) ??
    null
  );
}

export function selectDefaultEdge(state: WorkflowRuntimeState, nodeId: string): RuntimeEdge | null {
  return orderedOutgoing(state, nodeId)[0] ?? null;
}

export function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(
    /\{\{\s*([\w.-]+)\s*\}\}/g,
    (_match, key: string) => variables[key] ?? '',
  );
}

export function normalizeComparable(value: string): string {
  return value.trim().toLocaleLowerCase('pt-BR');
}
