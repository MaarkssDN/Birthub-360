import { createHash } from 'node:crypto';

export interface VersionedPromptDefinition {
  promptId: string;
  version: string;
  systemTemplate: string;
  userTemplate?: string;
}

export interface PromptTraceMetadata {
  promptId: string;
  promptVersion: string;
  promptHash: string;
  tenantId: string;
  model: string;
  executedAt: string;
}

export function computePromptHash(definition: VersionedPromptDefinition): string {
  const canonical = `${definition.promptId}@${definition.version}\n${definition.systemTemplate.trim()}\n${(definition.userTemplate ?? '').trim()}`;
  return createHash('sha256').update(canonical, 'utf8').digest('hex').slice(0, 16);
}

export function buildPromptTraceMetadata(params: {
  definition: VersionedPromptDefinition;
  tenantId: string;
  model: string;
  now?: Date;
}): PromptTraceMetadata {
  if (!params.definition.promptId?.trim() || !params.definition.version?.trim()) {
    throw new Error('promptId e version são obrigatórios para rastreabilidade de IA.');
  }
  if (!params.tenantId?.trim()) {
    throw new Error('tenantId é obrigatório nos traces de execução de IA.');
  }
  return {
    promptId: params.definition.promptId,
    promptVersion: params.definition.version,
    promptHash: computePromptHash(params.definition),
    tenantId: params.tenantId,
    model: params.model,
    executedAt: (params.now ?? new Date()).toISOString(),
  };
}

export async function executeVersionedPromptCall<TResult>(params: {
  definition: VersionedPromptDefinition;
  tenantId: string;
  model: string;
  invokeModel: (trace: PromptTraceMetadata) => Promise<TResult>;
  onTrace?: (trace: PromptTraceMetadata) => void;
}): Promise<{ result: TResult; trace: PromptTraceMetadata }> {
  const trace = buildPromptTraceMetadata({
    definition: params.definition,
    tenantId: params.tenantId,
    model: params.model,
  });
  params.onTrace?.(trace);
  const result = await params.invokeModel(trace);
  return { result, trace };
}
