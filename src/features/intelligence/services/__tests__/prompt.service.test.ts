import { describe, expect, it } from 'vitest';
import type {
  CreatePromptData,
  PromptEntity,
  PromptRepository,
  UpdatePromptData,
} from '../../domain/Prompt';
import { PromptService } from '../prompt.service';

class FakePromptRepository implements PromptRepository {
  private prompts: PromptEntity[] = [];

  constructor(initial: PromptEntity[] = []) {
    this.prompts = [...initial];
  }

  async listByOrganization(organizationId: string): Promise<PromptEntity[]> {
    return this.prompts.filter((p) => p.organizationId === organizationId);
  }

  async findById(organizationId: string, id: string): Promise<PromptEntity | null> {
    return this.prompts.find((p) => p.organizationId === organizationId && p.id === id) ?? null;
  }

  async findByCategory(organizationId: string, category: string): Promise<PromptEntity | null> {
    return (
      this.prompts.find((p) => p.organizationId === organizationId && p.category === category) ??
      null
    );
  }

  async create(data: CreatePromptData): Promise<PromptEntity> {
    const entity: PromptEntity = {
      id: `prompt-${this.prompts.length + 1}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.prompts.push(entity);
    return entity;
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdatePromptData,
  ): Promise<PromptEntity | null> {
    const idx = this.prompts.findIndex((p) => p.organizationId === organizationId && p.id === id);
    if (idx === -1) return null;
    const current = this.prompts[idx];
    const updated: PromptEntity = {
      ...current,
      ...data,
      updatedAt: new Date(),
    };
    this.prompts[idx] = updated;
    return updated;
  }

  async deleteById(organizationId: string, id: string): Promise<boolean> {
    const prev = this.prompts.length;
    this.prompts = this.prompts.filter(
      (p) => !(p.organizationId === organizationId && p.id === id),
    );
    return this.prompts.length < prev;
  }
}

describe('PromptService', () => {
  const ORG = 'org-1';

  it('lista apenas os prompts da organização informada', async () => {
    const repo = new FakePromptRepository([
      {
        id: 'p1',
        organizationId: ORG,
        name: 'SDR Greeting',
        category: 'sdr',
        content: 'Olá {{name}}',
      },
      {
        id: 'p2',
        organizationId: 'other-org',
        name: 'Closer Pitch',
        category: 'closer',
        content: 'Proposta {{val}}',
      },
    ]);
    const service = new PromptService(repo);

    const list = await service.listPrompts(ORG);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('SDR Greeting');
  });

  it('rejeita criação sem nome, categoria ou conteúdo', async () => {
    const service = new PromptService(new FakePromptRepository());

    await expect(
      service.createPrompt(ORG, { name: '', category: 'sdr', content: 'texto' }),
    ).rejects.toThrow('Nome do prompt é obrigatório.');

    await expect(
      service.createPrompt(ORG, { name: 'Prompt', category: '', content: 'texto' }),
    ).rejects.toThrow('Categoria do prompt é obrigatória.');

    await expect(
      service.createPrompt(ORG, { name: 'Prompt', category: 'sdr', content: '' }),
    ).rejects.toThrow('Conteúdo do prompt é obrigatório.');
  });

  it('cria prompt com sucesso e isolamento por tenant', async () => {
    const repo = new FakePromptRepository();
    const service = new PromptService(repo);

    const created = await service.createPrompt(ORG, {
      name: 'Qualificação Rápida',
      category: 'qualificacao',
      content: 'Qual é seu faturamento anual?',
      variables: { tier: 'enterprise' },
    });

    expect(created.id).toBeDefined();
    expect(created.organizationId).toBe(ORG);
    expect(created.name).toBe('Qualificação Rápida');
  });

  it('lança 404 ao buscar ou atualizar prompt inexistente', async () => {
    const service = new PromptService(new FakePromptRepository());

    await expect(service.getPromptById(ORG, 'inexistente')).rejects.toThrow(
      'Prompt não encontrado.',
    );
    await expect(service.updatePrompt(ORG, 'inexistente', { name: 'Novo' })).rejects.toThrow(
      'Prompt não encontrado para atualização.',
    );
  });
});
