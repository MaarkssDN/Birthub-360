import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  type ToolDefinition,
  type ToolExecutionContext,
  toolEngine,
} from '../../../voice-runtime/ToolEngine.js';
import {
  AiToolRegistry,
  ToolInputValidationError,
  ToolUnavailableError,
  registerAiTool,
} from '../executor.js';
import { toolRegistry } from '../registry.js';

const baseCtx: ToolExecutionContext = {
  tenantId: 'tenant-a',
  allowedTools: [],
  grantedPermissions: [],
};

function makeCtx(overrides: Partial<ToolExecutionContext> = {}): ToolExecutionContext {
  return { ...baseCtx, ...overrides };
}

function makeTool(name: string, execute = vi.fn(async () => ({ ok: true }))): ToolDefinition {
  return { name, description: `tool ${name}`, parameters: {}, execute };
}

describe('B-08 — AI tool registry must be the same engine the runtime executes', () => {
  it('toolRegistry is the shared toolEngine singleton (no split-brain registry)', () => {
    // Regressão B-08: registry.ts criava `new ToolExecutionEngine()`, então uma tool
    // registrada pelo registry de IA ficava invisível para `toolEngine.executeTool`
    // ("Tool X not found") — registrada, porém indisponível.
    expect(toolRegistry).toBe(toolEngine);
  });

  it('tool registered via toolRegistry is executable via toolEngine', async () => {
    const engine = new (await import('../../../voice-runtime/ToolEngine.js')).ToolExecutionEngine();
    void engine;
    const tool = makeTool('splitBrainProbe');
    toolRegistry.registerTool(tool);
    const ctx = makeCtx({ allowedTools: ['splitBrainProbe'] });
    await expect(
      toolEngine.executeTool('s1', 'splitBrainProbe', {}, ctx),
    ).resolves.toEqual({ ok: true });
  });
});

describe('AiToolRegistry — schema, disponibilidade e autorização por ferramenta', () => {
  let registry: AiToolRegistry;

  beforeEach(() => {
    registry = new AiToolRegistry();
  });

  it('executa tool registrada com argsSchema válido', async () => {
    const execute = vi.fn(async (args: Record<string, unknown>) => ({ got: args.q }));
    registry.register({
      name: 'searchThings',
      description: 'busca',
      parameters: {},
      argsSchema: z.object({ q: z.string().min(1) }),
      execute,
    });
    const ctx = makeCtx({ allowedTools: ['searchThings'] });
    const out = await registry.execute('s1', 'searchThings', { q: 'x' }, ctx);
    expect(out).toEqual({ got: 'x' });
    expect(execute).toHaveBeenCalledOnce();
  });

  it('rejeita argumentos inválidos sem executar a tool (nunca sucesso falso)', async () => {
    const execute = vi.fn(async () => 'should-not-run');
    registry.register({
      name: 'strictTool',
      description: 'strict',
      parameters: {},
      argsSchema: z.object({ n: z.number() }),
      execute,
    });
    const ctx = makeCtx({ allowedTools: ['strictTool'] });
    await expect(
      registry.execute('s1', 'strictTool', { n: 'not-a-number' }, ctx),
    ).rejects.toBeInstanceOf(ToolInputValidationError);
    expect(execute).not.toHaveBeenCalled();
  });

  it('nega execução quando a tool não está no allowedTools do tenant (isolamento)', async () => {
    const execute = vi.fn(async () => 'nope');
    registry.register({ name: 'tenantScoped', description: 'd', parameters: {}, execute });
    await expect(
      registry.execute('s1', 'tenantScoped', {}, makeCtx({ allowedTools: [] })),
    ).rejects.toMatchObject({ name: 'ToolPermissionError' });
    expect(execute).not.toHaveBeenCalled();
  });

  it('nega tool com requiredPermission ausente em grantedPermissions', async () => {
    const execute = vi.fn(async () => 'nope');
    registry.register({
      name: 'adminTool',
      description: 'd',
      parameters: {},
      requiredPermission: 'tools:admin',
      execute,
    });
    const ctx = makeCtx({ allowedTools: ['adminTool'], grantedPermissions: [] });
    await expect(registry.execute('s1', 'adminTool', {}, ctx)).rejects.toMatchObject({
      name: 'ToolPermissionError',
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it('B-08: isAvailable=false bloqueia execução antes de chamar a tool', async () => {
    const execute = vi.fn(async () => 'nope');
    const isAvailable = vi.fn(async () => false);
    registry.register({
      name: 'downstream',
      description: 'depende de serviço externo',
      parameters: {},
      isAvailable,
      execute,
    });
    const ctx = makeCtx({ allowedTools: ['downstream'] });
    await expect(registry.execute('s1', 'downstream', {}, ctx)).rejects.toBeInstanceOf(
      ToolUnavailableError,
    );
    expect(execute).not.toHaveBeenCalled();
  });

  it('B-08: falha no health-check é fail-closed (ToolUnavailableError)', async () => {
    const execute = vi.fn(async () => 'nope');
    registry.register({
      name: 'flakyHealth',
      description: 'd',
      parameters: {},
      isAvailable: async () => {
        throw new Error('health endpoint down');
      },
      execute,
    });
    const ctx = makeCtx({ allowedTools: ['flakyHealth'] });
    await expect(registry.execute('s1', 'flakyHealth', {}, ctx)).rejects.toBeInstanceOf(
      ToolUnavailableError,
    );
    expect(execute).not.toHaveBeenCalled();
  });

  it('propaga erro real da tool — nunca engole falha como sucesso', async () => {
    registry.register({
      name: 'boom',
      description: 'd',
      parameters: {},
      execute: async () => {
        throw new Error('upstream 500');
      },
    });
    const ctx = makeCtx({ allowedTools: ['boom'] });
    await expect(registry.execute('s1', 'boom', {}, ctx)).rejects.toThrow('upstream 500');
  });
});

describe('AiToolRegistry.listToolsForModel — só anuncia o que é executável', () => {
  it('filtra por allowedTools, requiredPermission e isAvailable', async () => {
    const registry = new AiToolRegistry();
    registry.register({ name: 'ok', description: 'ok', parameters: {}, execute: async () => 1 });
    registry.register({ name: 'otherTenant', description: 'd', parameters: {}, execute: async () => 1 });
    registry.register({
      name: 'needsPerm',
      description: 'd',
      parameters: {},
      requiredPermission: 'tools:admin',
      execute: async () => 1,
    });
    registry.register({
      name: 'unavailable',
      description: 'd',
      parameters: {},
      isAvailable: async () => false,
      execute: async () => 1,
    });
    const ctx = makeCtx({
      allowedTools: ['ok', 'otherTenant', 'needsPerm', 'unavailable'],
      grantedPermissions: [],
    });
    const listed = await registry.listToolsForModel(ctx);
    expect(listed.map((t) => t.name).sort()).toEqual(['ok', 'otherTenant']);
  });

  it('não anuncia tool fora do allowedTools nem sem permissão exigida', async () => {
    const registry = new AiToolRegistry();
    registry.register({ name: 'ok', description: 'ok', parameters: {}, execute: async () => 1 });
    registry.register({ name: 'otherTenant', description: 'd', parameters: {}, execute: async () => 1 });
    registry.register({
      name: 'adminOnly',
      description: 'd',
      parameters: {},
      requiredPermission: 'tools:admin',
      execute: async () => 1,
    });
    const ctx = makeCtx({ allowedTools: ['ok', 'otherTenant', 'adminOnly'], grantedPermissions: [] });
    const listed = await registry.listToolsForModel(ctx);
    expect(listed.map((t) => t.name)).toEqual(['ok', 'otherTenant']);

    const ctx2 = makeCtx({
      allowedTools: ['ok', 'adminOnly'],
      grantedPermissions: ['tools:admin'],
    });
    const listed2 = await registry.listToolsForModel(ctx2);
    expect(listed2.map((t) => t.name)).toEqual(['ok', 'adminOnly']);
  });

  it('registerAiTool registra no singleton compartilhado', async () => {
    const tool = makeTool('singletonProbe');
    registerAiTool(tool);
    const ctx = makeCtx({ allowedTools: ['singletonProbe'] });
    await expect(toolEngine.executeTool('s9', 'singletonProbe', {}, ctx)).resolves.toEqual({
      ok: true,
    });
  });
});
