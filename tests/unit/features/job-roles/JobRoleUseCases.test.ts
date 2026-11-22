import { describe, expect, it } from 'vitest';
import { JobRoleUseCases } from '@/features/job-roles/application/JobRoleUseCases';
import { PrismaJobRoleRepository } from '@/features/job-roles/infra/PrismaJobRoleRepository';

describe('JobRoleUseCases — Catálogo de Agentes e Governança RBAC', () => {
  it('retorna apenas agentes permitidos para o perfil VENDEDOR', async () => {
    const repo = new PrismaJobRoleRepository();
    const useCases = new JobRoleUseCases(repo);

    const catalog = await useCases.getCatalog('VENDEDOR');

    // VENDEDOR não pode ver João Reis nem Data Hygiene (exclusivo ADMIN/GESTOR)
    const codes = catalog.map((a) => a.code);
    expect(codes).toContain('SDR_INBOUND');
    expect(codes).toContain('CLOSER_NBA');
    expect(codes).not.toContain('JOAO_REIS_DIAGNOSTIC');
    expect(codes).not.toContain('DATA_HYGIENE');
  });

  it('permite acesso a todos os agentes para GESTOR e ADMIN', async () => {
    const repo = new PrismaJobRoleRepository();
    const useCases = new JobRoleUseCases(repo);

    const catalog = await useCases.getCatalog('ADMIN');
    expect(catalog.length).toBeGreaterThanOrEqual(6);
  });

  it('bloqueia autorização de execução de agente fora do papel do usuário', async () => {
    const repo = new PrismaJobRoleRepository();
    const useCases = new JobRoleUseCases(repo);

    const auth = await useCases.authorizeExecution('VENDEDOR', 'DATA_HYGIENE');
    expect(auth.allowed).toBe(false);
    expect(auth.reason).toContain('não tem permissão');
  });

  it('valida autorização positiva quando papel e capacidade são compatíveis', async () => {
    const repo = new PrismaJobRoleRepository();
    const useCases = new JobRoleUseCases(repo);

    const auth = await useCases.authorizeExecution('VENDEDOR', 'SDR_INBOUND', 'EXECUTE_COMMUNICATION');
    expect(auth.allowed).toBe(true);
  });
});
