import { describe, expect, it } from 'vitest';
import type {
  CreateSavedViewData,
  SavedViewEntity,
  SavedViewRepository,
} from '../../domain/SavedView';
import { SavedViewService } from '../savedView.service';

class FakeSavedViewRepository implements SavedViewRepository {
  private views: SavedViewEntity[] = [];

  constructor(initial: SavedViewEntity[] = []) {
    this.views = [...initial];
  }

  async listByUser(organizationId: string, userId: string): Promise<SavedViewEntity[]> {
    return this.views.filter((v) => v.organizationId === organizationId && v.userId === userId);
  }

  async create(data: CreateSavedViewData): Promise<SavedViewEntity> {
    const entity: SavedViewEntity = {
      id: `view-${this.views.length + 1}`,
      ...data,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.views.push(entity);
    return entity;
  }

  async deleteById(organizationId: string, userId: string, id: string): Promise<number> {
    const prevLen = this.views.length;
    this.views = this.views.filter(
      (v) => !(v.id === id && v.organizationId === organizationId && v.userId === userId),
    );
    return prevLen - this.views.length;
  }
}

describe('SavedViewService', () => {
  const org = 'org-1';
  const user = 'user-1';

  it('lista views do usuário e tenant corretos', async () => {
    const repo = new FakeSavedViewRepository([
      {
        id: '1',
        organizationId: org,
        userId: user,
        name: 'Minha View',
        funnel: 'Lead',
        filters: { owner: user },
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        organizationId: 'other-org',
        userId: user,
        name: 'Outra Org',
        funnel: 'Lead',
        filters: {},
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const service = new SavedViewService(repo);

    const views = await service.listSavedViews(org, user);
    expect(views).toHaveLength(1);
    expect(views[0].name).toBe('Minha View');
  });

  it('rejeita criação sem nome', async () => {
    const service = new SavedViewService(new FakeSavedViewRepository());
    await expect(
      service.createSavedView(org, user, { name: '   ', funnel: 'Lead' }),
    ).rejects.toThrow('Nome da view é obrigatório.');
  });

  it('rejeita criação com funil inválido', async () => {
    const service = new SavedViewService(new FakeSavedViewRepository());
    await expect(
      service.createSavedView(org, user, { name: 'Test', funnel: 'Invalido' }),
    ).rejects.toThrow('Funil inválido');
  });

  it('cria view com sucesso com dados válidos', async () => {
    const repo = new FakeSavedViewRepository();
    const service = new SavedViewService(repo);

    const created = await service.createSavedView(org, user, {
      name: 'Negócios Quentes',
      funnel: 'Negocio',
      filters: { q: 'quente' },
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Negócios Quentes');
    expect(created.funnel).toBe('Negocio');
  });

  it('lança 404 ao tentar excluir view inexistente', async () => {
    const service = new SavedViewService(new FakeSavedViewRepository());
    await expect(service.deleteSavedView(org, user, 'inexistente')).rejects.toThrow(
      'View não encontrada.',
    );
  });
});
