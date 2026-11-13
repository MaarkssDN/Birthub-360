import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MultichannelCadenceEnrollment } from '../../contracts/multichannelCadence.contract.js';
import { PrismaMultichannelCadenceEnrollmentStore } from '../PrismaMultichannelCadenceEnrollmentStore.js';

/**
 * Testes do store durável de matrículas de cadência multicanal.
 *
 * O delegate Prisma é substituído por um fake em memória COMPARTILHADO entre instâncias do store —
 * é exatamente o modelo mental de "restart": o processo morre, uma NOVA instância do store sobe
 * sobre o MESMO backend, e precisa enxergar os enrollments gravados antes. Se o store guardasse
 * estado próprio em memória (o bug original do `sharedCadenceEnrollmentsStore`), este teste
 * falharia.
 */

type Row = {
  id: string;
  organizationId: string;
  cadenceId: string;
  leadId: string;
  contactEmail: string;
  contactPhone: string;
  currentStep: number;
  status: string;
  enrolledAt: Date;
  lastActionAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function matches(row: Row, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([k, v]) => (row as Record<string, unknown>)[k] === v);
}

function createFakeDelegate() {
  const rows = new Map<string, Row>();
  const now = () => new Date('2026-11-12T12:00:00.000Z');

  return {
    rows,
    create: vi.fn(async ({ data }: { data: Partial<Row> }) => {
      const row: Row = {
        id: data.id as string,
        organizationId: data.organizationId as string,
        cadenceId: data.cadenceId as string,
        leadId: data.leadId as string,
        contactEmail: data.contactEmail ?? '',
        contactPhone: data.contactPhone ?? '',
        currentStep: data.currentStep ?? 1,
        status: data.status ?? 'Active',
        enrolledAt: now(),
        lastActionAt: null,
        createdAt: now(),
        updatedAt: now(),
      };
      rows.set(row.id, row);
      return row;
    }),
    findFirst: vi.fn(
      async ({ where, orderBy }: { where: Record<string, unknown>; orderBy?: unknown }) => {
        const found = [...rows.values()].filter((r) => matches(r, where));
        found.sort((a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime());
        return found[0] ?? null;
      },
    ),
    findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) =>
      [...rows.values()].filter((r) => matches(r, where)),
    ),
    updateMany: vi.fn(
      async ({ where, data }: { where: Record<string, unknown>; data: Partial<Row> }) => {
        let count = 0;
        for (const row of rows.values()) {
          if (matches(row, where)) {
            Object.assign(row, data, { updatedAt: now() });
            count += 1;
          }
        }
        return { count };
      },
    ),
  };
}

type FakeDelegate = ReturnType<typeof createFakeDelegate>;

function storeOver(delegate: FakeDelegate): PrismaMultichannelCadenceEnrollmentStore {
  // O construtor espera o delegate tipado do PrismaClient; o fake implementa o subconjunto de
  // operações usado pelo store (create/findFirst/findMany/updateMany).
  return new PrismaMultichannelCadenceEnrollmentStore(delegate as never);
}

const baseParams = {
  organizationId: 'org-a',
  cadenceId: 'default-b2b-cadence',
  leadId: 'lead-1',
  contactEmail: 'lead@example.test',
  contactPhone: '+5511999990000',
};

describe('PrismaMultichannelCadenceEnrollmentStore', () => {
  let delegate: FakeDelegate;

  beforeEach(() => {
    delegate = createFakeDelegate();
  });

  it('enroll persiste e retorna o contrato de domínio (enr- id, ISO dates, status minúsculo)', async () => {
    const store = storeOver(delegate);
    const enrollment = await store.enroll(baseParams);

    expect(enrollment.enrollmentId).toMatch(/^enr-/);
    expect(enrollment.organizationId).toBe('org-a');
    expect(enrollment.currentStep).toBe(1);
    expect(enrollment.status).toBe('active');
    expect(enrollment.enrolledAt).toBe('2026-11-12T12:00:00.000Z');
    expect(enrollment.lastActionAt).toBeUndefined();
    expect(delegate.rows.size).toBe(1);
  });

  it('enroll rejeita organizationId vazio (tenancy)', async () => {
    const store = storeOver(delegate);
    await expect(store.enroll({ ...baseParams, organizationId: '' })).rejects.toThrow(
      'Tenancy violation',
    );
    expect(delegate.rows.size).toBe(0);
  });

  it('enrollments sobrevivem a "restart": nova instância do store sobre o mesmo backend enxerga os dados', async () => {
    const before = storeOver(delegate);
    const enrolled = await before.enroll(baseParams);
    await before.update('org-a', enrolled.enrollmentId, {
      currentStep: 2,
      status: 'paused',
      lastActionAt: '2026-11-12T13:00:00.000Z',
    });

    // "Restart": instância nova, MESMO delegate (= mesmo banco).
    const after = storeOver(delegate);

    const restored = await after.get('org-a', enrolled.enrollmentId);
    expect(restored).toMatchObject({
      enrollmentId: enrolled.enrollmentId,
      currentStep: 2,
      status: 'paused',
      lastActionAt: '2026-11-12T13:00:00.000Z',
    });

    const byLead = await after.findByLead('org-a', 'lead-1');
    expect(byLead?.enrollmentId).toBe(enrolled.enrollmentId);
  });

  it('não há vazamento cross-tenant: get/update/updateByLead de outro tenant não veem nem tocam a matrícula', async () => {
    const store = storeOver(delegate);
    const enrolled = await store.enroll(baseParams);
    await store.enroll({ ...baseParams, organizationId: 'org-b', leadId: 'lead-1' });

    expect(await store.get('org-b', enrolled.enrollmentId)).toBeUndefined();
    expect(
      await store.update('org-b', enrolled.enrollmentId, { status: 'failed' }),
    ).toBeUndefined();

    // updateByLead em org-b só toca as matrículas DE org-b (a de org-a é invisível para esse
    // tenant); a matrícula de org-a permanece intacta.
    const orgBUpdated = await store.updateByLead('org-b', 'lead-1', { status: 'opted_out' });
    expect(orgBUpdated).toHaveLength(1);
    expect(orgBUpdated[0].organizationId).toBe('org-b');

    const untouched = await store.get('org-a', enrolled.enrollmentId);
    expect(untouched?.status).toBe('active');

    const orgB = [...delegate.rows.values()].find((r) => r.organizationId === 'org-b');
    expect(orgB?.status).toBe('OptedOut');
  });

  it('update mapeia status de domínio → enum do banco e de volta', async () => {
    const store = storeOver(delegate);
    const enrolled = await store.enroll(baseParams);

    const updated = await store.update('org-a', enrolled.enrollmentId, { status: 'opted_out' });
    expect(updated?.status).toBe('opted_out');
    expect(delegate.rows.get(enrolled.enrollmentId)?.status).toBe('OptedOut');
  });

  it('updateByLead marca TODAS as matrículas do lead no tenant (opt-out cross-canal)', async () => {
    const store = storeOver(delegate);
    await store.enroll(baseParams);
    await store.enroll({ ...baseParams, cadenceId: 'outra-cadencia' });
    await store.enroll({ ...baseParams, organizationId: 'org-b' });

    const updated = await store.updateByLead('org-a', 'lead-1', { status: 'opted_out' });
    expect(updated).toHaveLength(2);
    expect(updated.every((e) => e.status === 'opted_out')).toBe(true);

    const orgBRow = [...delegate.rows.values()].find((r) => r.organizationId === 'org-b');
    expect(orgBRow?.status).toBe('Active');
  });

  it('get de enrollment inexistente retorna undefined', async () => {
    const store = storeOver(delegate);
    expect(await store.get('org-a', 'enr-inexistente')).toBeUndefined();
  });
});
