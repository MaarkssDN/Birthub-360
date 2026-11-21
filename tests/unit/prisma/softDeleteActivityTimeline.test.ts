import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

const prismaMock: any = {
  activity: {
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock('../../../src/lib/prisma.js', () => ({ prisma: prismaMock }));

const { PrismaActivityRepository } = await import(
  '../../../src/features/activities/infra/PrismaActivityRepository.js'
);

describe('Agente 11 (Pietro) & Agente 12 (Vera) - Soft Delete e onDelete: Restrict em Activity e TimelineEvent', () => {
  it('prisma/schema.prisma não deve usar onDelete: Cascade em Activity nem TimelineEvent, exigindo Restrict + deletedAt', () => {
    const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    const activityBlock = schema.match(/model Activity \{[\s\S]*?\n\}/)?.[0] ?? '';
    const timelineBlock = schema.match(/model TimelineEvent \{[\s\S]*?\n\}/)?.[0] ?? '';

    expect(activityBlock).toContain('onDelete: Restrict');
    expect(activityBlock).not.toContain('onDelete: Cascade');
    expect(activityBlock).toContain('deletedAt');

    expect(timelineBlock).toContain('onDelete: Restrict');
    expect(timelineBlock).not.toContain('onDelete: Cascade');
    expect(timelineBlock).toContain('deletedAt');
  });

  it('migration SQL deve seguir zero-downtime (lock_timeout, NOT VALID + VALIDATE CONSTRAINT)', () => {
    const migrationPath = path.resolve(
      process.cwd(),
      'prisma/migrations/20261120120000_onda2_soft_delete_activity_timeline/migration.sql',
    );
    expect(fs.existsSync(migrationPath)).toBe(true);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toContain("SET lock_timeout = '3s'");
    expect(sql).toContain('ON DELETE RESTRICT');
    expect(sql).toContain('NOT VALID');
    expect(sql).toContain('VALIDATE CONSTRAINT');
  });

  it('PrismaActivityRepository.delete deve executar soft delete (update deletedAt) e nunca hard delete', async () => {
    prismaMock.activity.findFirst.mockResolvedValue({
      id: 'act-1',
      organizationId: 'org-1',
      type: 'Ligacao',
      status: 'Pendente',
    });
    prismaMock.activity.update.mockResolvedValue({
      id: 'act-1',
      organizationId: 'org-1',
      type: 'Ligacao',
      status: 'Pendente',
      deletedAt: new Date(),
    });

    const repo = new PrismaActivityRepository();
    await repo.delete('org-1', 'act-1');

    expect(prismaMock.activity.update).toHaveBeenCalledWith({
      where: { id: 'act-1' },
      data: { deletedAt: expect.any(Date) },
    });
    expect(prismaMock.activity.delete).not.toHaveBeenCalled();
  });
});
