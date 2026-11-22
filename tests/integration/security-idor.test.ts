/**
 * Testes adversariais de segurança - IDOR (Insecure Direct Object Reference)
 * TD-012/DT-013
 *
 * Verifica que usuários não podem acessar recursos de outros tenants/usuarios.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { signUpRealUser, withRlsBypass, withTenant, type RealSessionUser } from '../helpers/rbac-e2e-helpers';

describe('Security - IDOR Prevention', () => {
  let userA: RealSessionUser;
  let userB: RealSessionUser;
  let leadA: any;
  const createdUserIds: string[] = [];
  const createdOrgIds: string[] = [];
  const createdLeadIds: string[] = [];

  beforeAll(async () => {
    // Criar dois usuários em organizações diferentes com sufixo único
    const rnd = Math.random().toString(36).substring(2, 7);
    userA = await signUpRealUser(`user-a-idor-${rnd}`, 'VISUALIZADOR');
    userB = await signUpRealUser(`user-b-idor-${rnd}`, 'VISUALIZADOR');

    createdUserIds.push(userA.userId, userB.userId);
    createdOrgIds.push(userA.organizationId, userB.organizationId);
  }, 30_000);

  beforeEach(async () => {
    // Criar um lead para a organização A sob o contexto do tenant A (Company requer tenant scope)
    await withTenant(userA.organizationId, async () => {
      const company = await prisma.company.create({
        data: {
          legalName: 'Company A Ltda',
          tradeName: 'Company A',
          organizationId: userA.organizationId,
        },
      });

      leadA = await prisma.lead.create({
        data: {
          title: 'Lead A',
          companyId: company.id,
          organizationId: userA.organizationId,
          status: 'Lead_Recebido',
        },
      });

      createdLeadIds.push(leadA.id);
    });
  });

  afterAll(async () => {
    await withRlsBypass(async () => {
      await prisma.lead.deleteMany({ where: { id: { in: createdLeadIds } } });
      await prisma.company.deleteMany({ where: { organizationId: { in: createdOrgIds } } });
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      await prisma.organization.deleteMany({ where: { id: { in: createdOrgIds } } });
    });
  });

  describe('Tenant Isolation', () => {
    it('não deve permitir que usuário de tenant B acesse lead de tenant A', async () => {
      const leadFromB = await withTenant(userB.organizationId, () =>
        prisma.lead.findFirst({
          where: { id: leadA.id, organizationId: userB.organizationId },
        }),
      );

      // Com filtro de tenant e RLS, deve retornar null
      expect(leadFromB).toBeNull();
    });

    it('deve permitir que usuário de tenant A acesse seu próprio lead', async () => {
      const leadFromA = await withTenant(userA.organizationId, () =>
        prisma.lead.findFirst({
          where: { id: leadA.id, organizationId: userA.organizationId },
        }),
      );

      // Deve encontrar o lead
      expect(leadFromA).not.toBeNull();
      expect(leadFromA?.id).toBe(leadA.id);
    });
  });

  describe('User Isolation (mesmo tenant)', () => {
    it('deve permitir acesso para outro usuário do mesmo tenant A', async () => {
      // Criar segundo usuário no mesmo tenant A
      const rndA2 = Math.random().toString(36).substring(2, 7);
      const emailA2 = `rbac-user-a2-${rndA2}@birthhub360.com.br`;
      const userA2 = await withRlsBypass(async () => {
        return await prisma.user.create({
          data: {
            email: emailA2,
            name: `User A2 ${rndA2}`,
            role: 'VISUALIZADOR',
            organizationId: userA.organizationId,
            emailVerified: true,
          },
        });
      });
      createdUserIds.push(userA2.id);

      const leadFromA2 = await withTenant(userA.organizationId, () =>
        prisma.lead.findFirst({
          where: { id: leadA.id, organizationId: userA.organizationId },
        }),
      );

      expect(leadFromA2).not.toBeNull();
      expect(leadFromA2?.id).toBe(leadA.id);
    });
  });
});
