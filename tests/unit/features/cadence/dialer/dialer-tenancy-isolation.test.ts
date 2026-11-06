import type { Prisma, PrismaClient } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TenantContextMissingError } from '../../../../../src/lib/async-context.js';
import { Campaign } from '../../../../../src/features/cadence/dialer/domain/entities/Campaign.js';
import { Lead } from '../../../../../src/features/cadence/dialer/domain/entities/Lead.js';
import { PhoneNumber } from '../../../../../src/features/cadence/dialer/domain/value-objects/PhoneNumber.js';
import { PgCampaignRepository } from '../../../../../src/features/cadence/dialer/infrastructure/db/repositories/PgCampaignRepository.js';
import { PgLeadRepository } from '../../../../../src/features/cadence/dialer/infrastructure/db/repositories/PgLeadRepository.js';

describe('Dialer Tenancy Isolation — Multi-Tenant Verification (B-10 / DIV-AGENTE-01-001)', () => {
  const queryRaw = vi.fn();
  const executeRaw = vi.fn();
  const prismaMock = { $queryRaw: queryRaw, $executeRaw: executeRaw } as unknown as PrismaClient;

  const TENANT_A = 'org-tenant-alpha';
  const TENANT_B = 'org-tenant-beta';

  const campaignAProps = {
    id: '11111111-aaaa-4111-8111-111111111111',
    organizationId: TENANT_A,
    name: 'Campanha Alpha',
    status: 'active' as const,
    createdAt: new Date('2026-10-10T10:00:00Z'),
    updatedAt: new Date('2026-10-10T10:00:00Z'),
  };

  const leadAProps = {
    id: '22222222-aaaa-4222-8222-222222222222',
    organizationId: TENANT_A,
    campaignId: campaignAProps.id,
    name: 'Lead Alpha 1',
    phone: PhoneNumber.create('+5511999990001'),
    status: 'pending' as const,
    attempts: 0,
    nextAttemptAt: new Date('2026-10-10T10:00:00Z'),
    createdAt: new Date('2026-10-10T10:00:00Z'),
    updatedAt: new Date('2026-10-10T10:00:00Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PgCampaignRepository Isolation', () => {
    it('falha fail-closed sem organizationId explícito, construtor ou contexto', async () => {
      const unscopedRepo = new PgCampaignRepository(prismaMock);
      const campaign = Campaign.restore({ ...campaignAProps, organizationId: undefined });

      await expect(unscopedRepo.save(campaign)).rejects.toThrow(TenantContextMissingError);
      await expect(unscopedRepo.findById(campaignAProps.id)).rejects.toThrow(TenantContextMissingError);
      await expect(unscopedRepo.findActive()).rejects.toThrow(TenantContextMissingError);
      await expect(unscopedRepo.findAll()).rejects.toThrow(TenantContextMissingError);
    });

    it('impede que o Tenant B acesse campanha do Tenant A em findById', async () => {
      const repoB = new PgCampaignRepository(prismaMock, TENANT_B);
      // Mock do banco retornando vazio pois o WHERE organization_id = TENANT_B não casa
      queryRaw.mockResolvedValueOnce([]);

      const result = await repoB.findById(campaignAProps.id);
      expect(result).toBeNull();

      const lastQuery = queryRaw.mock.calls[0]?.[0] as Prisma.Sql;
      expect(lastQuery.sql).toContain('organization_id =');
      expect(lastQuery.values).toContain(TENANT_B);
      expect(lastQuery.values).not.toContain(TENANT_A);
    });

    it('restringe findActive exclusivamente ao escopo do tenant solicitante', async () => {
      const repoA = new PgCampaignRepository(prismaMock, TENANT_A);
      queryRaw.mockResolvedValueOnce([
        {
          id: campaignAProps.id,
          organization_id: TENANT_A,
          name: campaignAProps.name,
          status: 'active',
          created_at: campaignAProps.createdAt,
          updated_at: campaignAProps.updatedAt,
        },
      ]);

      const campaigns = await repoA.findActive();
      expect(campaigns).toHaveLength(1);
      expect(campaigns[0]?.toProps().organizationId).toBe(TENANT_A);

      const querySql = queryRaw.mock.calls[0]?.[0] as Prisma.Sql;
      expect(querySql.values).toEqual([TENANT_A]);
    });
  });

  describe('PgLeadRepository Isolation', () => {
    it('falha fail-closed sem tenant em qualquer operação com leads', async () => {
      const unscopedRepo = new PgLeadRepository(prismaMock);
      const lead = Lead.restore({ ...leadAProps, organizationId: undefined });

      await expect(unscopedRepo.save(lead)).rejects.toThrow(TenantContextMissingError);
      await expect(unscopedRepo.findById(leadAProps.id)).rejects.toThrow(TenantContextMissingError);
      await expect(unscopedRepo.claimNextEligible('camp-1', new Date(), 10)).rejects.toThrow(
        TenantContextMissingError,
      );
      await expect(unscopedRepo.getCampaignStats('camp-1')).rejects.toThrow(TenantContextMissingError);
    });

    it('garante que Tenant B nunca reserva (claimNextEligible) leads do Tenant A', async () => {
      const repoB = new PgLeadRepository(prismaMock, TENANT_B);
      queryRaw.mockResolvedValueOnce([]);

      const now = new Date('2026-10-10T12:00:00Z');
      const claimed = await repoB.claimNextEligible(campaignAProps.id, now, 5);
      expect(claimed).toHaveLength(0);

      const querySql = queryRaw.mock.calls[0]?.[0] as Prisma.Sql;
      // Garante que o organizationId injetado na CTE e no UPDATE é estritamente o do Tenant B
      expect(querySql.sql).toContain('WHERE organization_id =');
      expect(querySql.sql).toContain('FOR UPDATE SKIP LOCKED');
      expect(querySql.sql).toContain('leads.organization_id =');
      expect(querySql.values).toContain(TENANT_B);
      expect(querySql.values).not.toContain(TENANT_A);
    });

    it('impede que Tenant B consulte estatísticas de campanha do Tenant A', async () => {
      const repoB = new PgLeadRepository(prismaMock, TENANT_B);
      queryRaw.mockResolvedValueOnce([
        {
          total_leads: '0',
          pending: '0',
          in_progress: '0',
          contacted: '0',
          exhausted: '0',
          do_not_call: '0',
          invalid_number: '0',
        },
      ]);

      const stats = await repoB.getCampaignStats(campaignAProps.id);
      expect(stats.totalLeads).toBe(0);

      const querySql = queryRaw.mock.calls[0]?.[0] as Prisma.Sql;
      expect(querySql.values).toEqual([TENANT_B, campaignAProps.id]);
    });

    it('rejeita saveMany quando houver mistura de organizationIds no mesmo lote', async () => {
      const repoA = new PgLeadRepository(prismaMock, TENANT_A);
      const leadAlpha = Lead.restore(leadAProps);
      const leadBeta = Lead.restore({
        ...leadAProps,
        id: '33333333-bbbb-4333-8333-333333333333',
        organizationId: TENANT_B,
      });

      await expect(repoA.saveMany([leadAlpha, leadBeta])).rejects.toThrow(
        /cannot mix multiple organizationIds/,
      );
    });
  });
});
