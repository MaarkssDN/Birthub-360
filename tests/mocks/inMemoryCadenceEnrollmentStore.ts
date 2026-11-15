import { randomUUID } from 'node:crypto';
import type {
  IMultichannelCadenceEnrollmentStore,
  MultichannelCadenceEnrollment,
} from '../../src/shared/contracts/multichannelCadence.contract.js';

/**
 * Fake em memória de `IMultichannelCadenceEnrollmentStore` para testes unitários — substitui o
 * singleton Prisma (que exige Postgres real) nos services de cadência. Devolve CÓPIAS dos
 * registros, como o store Prisma: mutar o objeto retornado não persiste — é o comportamento
 * que os consumidores migrados precisam respeitar (update explícito).
 */
export function createInMemoryCadenceEnrollmentStore(): IMultichannelCadenceEnrollmentStore & {
  rows: Map<string, MultichannelCadenceEnrollment>;
} {
  const rows = new Map<string, MultichannelCadenceEnrollment>();
  const key = (organizationId: string, enrollmentId: string) =>
    `${organizationId}:${enrollmentId}`;

  return {
    rows,
    async enroll(params) {
      const enrollment: MultichannelCadenceEnrollment = {
        enrollmentId: `enr-${randomUUID()}`,
        organizationId: params.organizationId,
        cadenceId: params.cadenceId,
        leadId: params.leadId,
        contactEmail: params.contactEmail ?? '',
        contactPhone: params.contactPhone ?? '',
        currentStep: 1,
        status: 'active',
        enrolledAt: new Date().toISOString(),
      };
      rows.set(key(enrollment.organizationId, enrollment.enrollmentId), { ...enrollment });
      return { ...enrollment };
    },
    async get(organizationId, enrollmentId) {
      const row = rows.get(key(organizationId, enrollmentId));
      return row ? { ...row } : undefined;
    },
    async findByLead(organizationId, leadId) {
      const found = [...rows.values()]
        .filter((r) => r.organizationId === organizationId && r.leadId === leadId)
        .sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt));
      return found[0] ? { ...found[0] } : undefined;
    },
    async update(organizationId, enrollmentId, patch) {
      const k = key(organizationId, enrollmentId);
      const row = rows.get(k);
      if (!row) return undefined;
      const updated = { ...row, ...patch };
      rows.set(k, updated);
      return { ...updated };
    },
    async updateByLead(organizationId, leadId, patch) {
      const updated: MultichannelCadenceEnrollment[] = [];
      for (const [k, row] of rows) {
        if (row.organizationId === organizationId && row.leadId === leadId) {
          const next = { ...row, ...patch };
          rows.set(k, next);
          updated.push({ ...next });
        }
      }
      return updated;
    },
  };
}
