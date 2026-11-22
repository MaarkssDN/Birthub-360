import { prisma } from '../../../lib/prisma.js';
import type {
  CreatePromptData,
  PromptEntity,
  PromptRepository,
  UpdatePromptData,
} from '../domain/Prompt.js';

export class PrismaPromptRepository implements PromptRepository {
  async listByOrganization(organizationId: string): Promise<PromptEntity[]> {
    const rows = await prisma.prompt.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r: any) => ({
      id: r.id,
      organizationId: r.organizationId,
      name: r.name,
      category: r.category,
      content: r.content ?? '',
      variables: (r.variables ?? {}) as Record<string, unknown>,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async findById(organizationId: string, id: string): Promise<PromptEntity | null> {
    const r: any = await prisma.prompt.findFirst({
      where: { id, organizationId },
    });
    if (!r) return null;
    return {
      id: r.id,
      organizationId: r.organizationId,
      name: r.name,
      category: r.category,
      content: r.content ?? '',
      variables: (r.variables ?? {}) as Record<string, unknown>,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  async findByCategory(organizationId: string, category: string): Promise<PromptEntity | null> {
    const r: any = await prisma.prompt.findFirst({
      where: { organizationId, category },
    });
    if (!r) return null;
    return {
      id: r.id,
      organizationId: r.organizationId,
      name: r.name,
      category: r.category,
      content: r.content ?? '',
      variables: (r.variables ?? {}) as Record<string, unknown>,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  async create(data: CreatePromptData): Promise<PromptEntity> {
    const r: any = await prisma.prompt.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        category: data.category,
        content: data.content,
        variables: (data.variables ?? {}) as object,
      } as any,
    });
    return {
      id: r.id,
      organizationId: r.organizationId,
      name: r.name,
      category: r.category,
      content: r.content ?? '',
      variables: (r.variables ?? {}) as Record<string, unknown>,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdatePromptData,
  ): Promise<PromptEntity | null> {
    const existing = await prisma.prompt.findFirst({
      where: { id, organizationId },
    });
    if (!existing) return null;

    const r: any = await prisma.prompt.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.category ? { category: data.category } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.variables !== undefined ? { variables: data.variables as object } : {}),
      },
    });
    return {
      id: r.id,
      organizationId: r.organizationId,
      name: r.name,
      category: r.category,
      content: r.content ?? '',
      variables: (r.variables ?? {}) as Record<string, unknown>,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  async deleteById(organizationId: string, id: string): Promise<boolean> {
    const res = await prisma.prompt.deleteMany({
      where: { id, organizationId },
    });
    return res.count > 0;
  }
}

export const prismaPromptRepository = new PrismaPromptRepository();
