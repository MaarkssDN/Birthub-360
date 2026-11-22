import { randomUUID } from 'node:crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import type {
  IMultichannelCadenceEnrollmentStore,
  MultichannelCadenceEnrollment,
} from '../contracts/multichannelCadence.contract.js';

/**
 * Store durável (Postgres via Prisma) para matrículas de cadência multicanal — substitui o
 * `sharedCadenceEnrollmentsStore` em memória por processo (volátil em restart/deploy e divergente
 * entre réplicas; handoff 07→00, repassado ao 01).
 *
 * Persistência: tabela `MultichannelCadenceEnrollment` (migration
 * `20261112120000_multichannel_cadence_enrollment`), RLS `tenant_isolation` estrita. Toda query
 * filtra `organizationId` explicitamente — o store nunca busca "por id global", então um
 * `enrollmentId` de outro tenant simplesmente não é encontrado (defesa em profundidade sobre a
 * RLS, que já bloquearia no banco).
 *
 * `enrolledAt`/`lastActionAt` trafegam no contrato como ISO string; no banco são `TIMESTAMPTZ`.
 * O enum Postgres é PascalCase (`Active`/`Paused`/...) e o domínio usa minúsculas
 * (`'active'|'paused'|...`) — mapeamento feito aqui, sem vazar detalhe de schema (mesmo padrão de
 * `PrismaOptOutRepository`).
 */

type EnrollmentRow = Prisma.MultichannelCadenceEnrollmentGetPayload<Record<string, never>>;

type EnrollmentDelegate = PrismaClient['multichannelCadenceEnrollment'];

const STATUS_TO_DB = {
  active: 'Active',
  completed: 'Completed',
  paused: 'Paused',
  opted_out: 'OptedOut',
  failed: 'Failed',
} as const;

const STATUS_FROM_DB: Record<string, MultichannelCadenceEnrollment['status']> = {
  Active: 'active',
  Completed: 'completed',
  Paused: 'paused',
  OptedOut: 'opted_out',
  Failed: 'failed',
};

function toDomain(row: EnrollmentRow): MultichannelCadenceEnrollment {
  return {
    enrollmentId: row.id,
    organizationId: row.organizationId,
    cadenceId: row.cadenceId,
    leadId: row.leadId,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    currentStep: row.currentStep,
    status: STATUS_FROM_DB[row.status] ?? 'failed',
    enrolledAt: row.enrolledAt.toISOString(),
    lastActionAt: row.lastActionAt ? row.lastActionAt.toISOString() : undefined,
  };
}

export class PrismaMultichannelCadenceEnrollmentStore
  implements IMultichannelCadenceEnrollmentStore
{
  constructor(
    private readonly delegate: EnrollmentDelegate = prisma.multichannelCadenceEnrollment,
  ) {}

  async enroll(params: {
    organizationId: string;
    cadenceId: string;
    leadId: string;
    contactEmail?: string;
    contactPhone?: string;
  }): Promise<MultichannelCadenceEnrollment> {
    if (!params.organizationId || params.organizationId.trim() === '') {
      throw new Error('Tenancy violation: organizationId obrigatório para matrícula em cadência');
    }

    const row = await this.delegate.create({
      data: {
        id: `enr-${randomUUID()}`,
        organizationId: params.organizationId,
        cadenceId: params.cadenceId,
        leadId: params.leadId,
        contactEmail: params.contactEmail ?? '',
        contactPhone: params.contactPhone ?? '',
        currentStep: 1,
        status: 'Active',
      },
    });
    return toDomain(row);
  }

  async get(
    organizationId: string,
    enrollmentId: string,
  ): Promise<MultichannelCadenceEnrollment | undefined> {
    const row = await this.delegate.findFirst({
      where: { id: enrollmentId, organizationId },
    });
    return row ? toDomain(row) : undefined;
  }

  async findByLead(
    organizationId: string,
    leadId: string,
  ): Promise<MultichannelCadenceEnrollment | undefined> {
    const row = await this.delegate.findFirst({
      where: { organizationId, leadId },
      orderBy: { enrolledAt: 'desc' },
    });
    return row ? toDomain(row) : undefined;
  }

  async update(
    organizationId: string,
    enrollmentId: string,
    patch: Partial<Pick<MultichannelCadenceEnrollment, 'currentStep' | 'status' | 'lastActionAt'>>,
  ): Promise<MultichannelCadenceEnrollment | undefined> {
    const data: Prisma.MultichannelCadenceEnrollmentUpdateInput = {};
    if (patch.currentStep !== undefined) data.currentStep = patch.currentStep;
    if (patch.status !== undefined) data.status = STATUS_TO_DB[patch.status];
    if (patch.lastActionAt !== undefined) {
      data.lastActionAt = patch.lastActionAt ? new Date(patch.lastActionAt) : null;
    }
    if (Object.keys(data).length === 0) {
      return this.get(organizationId, enrollmentId);
    }

    // updateMany + findFirst (em vez de update com where estendido): o filtro
    // `(id, organizationId)` é aplicado no UPDATE — uma matrícula de outro tenant retorna
    // count=0 e vira `undefined`, nunca um update cross-tenant.
    const { count } = await this.delegate.updateMany({
      where: { id: enrollmentId, organizationId },
      data,
    });
    if (count === 0) return undefined;
    return this.get(organizationId, enrollmentId);
  }

  async updateByLead(
    organizationId: string,
    leadId: string,
    patch: Partial<Pick<MultichannelCadenceEnrollment, 'currentStep' | 'status' | 'lastActionAt'>>,
  ): Promise<MultichannelCadenceEnrollment[]> {
    const data: Prisma.MultichannelCadenceEnrollmentUpdateManyMutationInput = {};
    if (patch.currentStep !== undefined) data.currentStep = patch.currentStep;
    if (patch.status !== undefined) data.status = STATUS_TO_DB[patch.status];
    if (patch.lastActionAt !== undefined) {
      data.lastActionAt = patch.lastActionAt ? new Date(patch.lastActionAt) : null;
    }
    if (Object.keys(data).length === 0) return [];

    await this.delegate.updateMany({
      where: { organizationId, leadId },
      data,
    });
    const rows = await this.delegate.findMany({
      where: { organizationId, leadId },
      orderBy: { enrolledAt: 'desc' },
    });
    return rows.map(toDomain);
  }
}

/** Instância única — sem estado próprio além da conexão Prisma já compartilhada pelo app. */
export const prismaMultichannelCadenceEnrollmentStore =
  new PrismaMultichannelCadenceEnrollmentStore();
