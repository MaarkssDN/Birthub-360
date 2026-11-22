import { prisma } from '../../../lib/prisma.js';
import type {
  CreateSavedViewData,
  SavedViewEntity,
  SavedViewFilters,
  SavedViewRepository,
} from '../domain/SavedView.js';

export class PrismaSavedViewRepository implements SavedViewRepository {
  async listByUser(organizationId: string, userId: string): Promise<SavedViewEntity[]> {
    const records = await prisma.savedView.findMany({
      where: { organizationId, userId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      userId: r.userId,
      name: r.name,
      funnel: r.funnel,
      filters: (r.filters ?? {}) as SavedViewFilters,
      isDefault: r.isDefault,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async create(data: CreateSavedViewData): Promise<SavedViewEntity> {
    const record = await prisma.savedView.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        name: data.name,
        funnel: data.funnel,
        filters: (data.filters ?? {}) as object,
      },
    });

    return {
      id: record.id,
      organizationId: record.organizationId,
      userId: record.userId,
      name: record.name,
      funnel: record.funnel,
      filters: (record.filters ?? {}) as SavedViewFilters,
      isDefault: record.isDefault,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async deleteById(organizationId: string, userId: string, id: string): Promise<number> {
    const result = await prisma.savedView.deleteMany({
      where: { id, organizationId, userId },
    });
    return result.count;
  }
}

export const prismaSavedViewRepository = new PrismaSavedViewRepository();
