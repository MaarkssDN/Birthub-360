import { config } from 'dotenv';
import path from 'path';
import { Client } from 'pg';

// Load test environment variables before Prisma initializes
config({ path: path.resolve(process.cwd(), '.env.test') });

// O default da factory em NODE_ENV=test usa repositório in-memory. A captura pública
// de lead precisa gravar ConsentAuditRecord de verdade para o teste de integração
// asserir a âncora LGPD no banco. Definido aqui (setupFile) para valer antes do
// singleton ser criado no primeiro import.
if (!process.env.CONSENT_CHAIN_USE_PRISMA) {
  process.env.CONSENT_CHAIN_USE_PRISMA = '1';
}

// Seatbelt: se .env.test não existir (ou estiver desatualizado) — por exemplo, alguém rodando
// `vitest run -c vitest.integration.config.ts` direto, sem passar pelo `pretest:integration` que
// prepara o arquivo — DATABASE_URL cai de volta pro que já estiver no processo, que numa máquina
// de dev normalmente aponta pro banco de desenvolvimento de verdade ("prospectordb"). O afterAll()
// abaixo faz `prisma.organization.deleteMany()` SEM where; rodar isso contra o banco de dev real
// apaga todas as organizações e, por causa do ON DELETE CASCADE em BitrixConnection/BitrixSyncRule
// (diferente do ON DELETE SET NULL em Company/Contact/Lead), destrói silenciosamente toda conexão
// Bitrix24 salva. Recusar rodar fora de um banco cujo nome sinalize claramente "teste" é mais
// seguro do que confiar que .env.test sempre vai existir e estar correto.
const databaseUrl = process.env.DATABASE_URL ?? '';
if (!/\/[\w-]*test[\w-]*(\?|$)/i.test(databaseUrl)) {
  throw new Error(
    `Testes de integração recusaram rodar: DATABASE_URL não aponta para um banco de teste isolado ` +
      `(esperado um nome de banco contendo "test", ex: "prospectordb_test"; recebido "${databaseUrl || '(vazio)'}"). ` +
      `Rode via "npm run test:integration" (que prepara .env.test automaticamente) em vez de invocar o vitest direto.`,
  );
}

import { vi, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';

// Mock meilisearch completely so Prisma triggers won't fail
vi.mock('../../src/lib/search/index.js', () => ({
  meili: {
    index: () => ({
      addDocuments: vi.fn().mockResolvedValue({}),
      updateDocuments: vi.fn().mockResolvedValue({}),
      deleteDocuments: vi.fn().mockResolvedValue({}),
    }),
  },
}));

import { prisma } from '../../src/lib/prisma';
import { requestContext } from '../../src/lib/async-context';

// REMED-06 v5: prospector_app não tem DELETE em Organization. Os testes limpam org por
// id fixo antes de recriar; sem o DELETE a suíte quebra no primeiro deleteMany. O fallback
// usa o owner do cluster de teste (o mesmo papel do bootstrap), só quando o app recebe 42501.
// Testes que provam o REVOKE usam SQL cru, não este método.
const originalOrgDeleteMany = prisma.organization.deleteMany.bind(prisma.organization);
const originalOrgDelete = prisma.organization.delete.bind(prisma.organization);

function testOwnerDatabaseUrl(appUrl: string): string | null {
  if (process.env.MIGRATOR_DATABASE_URL) return process.env.MIGRATOR_DATABASE_URL;
  if (process.env.DIRECT_URL) return process.env.DIRECT_URL;
  const replacements: Array<[string, string]> = [
    ['prospector_app:ci_app_test_pass', 'prospector_migrator:ci_migrator_test_pass'],
    ['prospector_app:ci_app_test_pass', 'prospector:prospector_test_pass'],
    ['prospector_app:prospector_app_pass', 'prospector_migrator:prospector_migrator_pass'],
    ['prospector_app:prospector_app_pass', 'prospector:prospector_test_pass'],
  ];
  for (const [from, to] of replacements) {
    if (appUrl.includes(from)) return appUrl.replace(from, to);
  }
  return null;
}

function isOrgDeleteDenied(error: unknown): boolean {
  return /permission denied for table "?Organization"?|42501/.test(String((error as Error)?.message ?? error));
}

async function deleteOrganizationsAsOwner(args?: {
  where?: { id?: string | { in?: string[] } };
}): Promise<{ count: number }> {
  const url = testOwnerDatabaseUrl(databaseUrl);
  if (!url) {
    throw new Error('prospector_app sem DELETE em Organization e sem URL de owner para limpar o banco de teste');
  }
  const where = args?.where;
  let targetIds: string[] = [];
  if (typeof where?.id === 'string') {
    targetIds = [where.id];
  } else if (where?.id && Array.isArray(where.id.in)) {
    targetIds = where.id.in;
  } else if (where && Object.keys(where).length > 0) {
    throw new Error('organization.deleteMany: filtro não suportado no fallback de owner');
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    // Permite bypass de RLS na conexão do owner para operações administrativas de teste
    await client.query(`SELECT set_config('app.bypass_rls', 'on', false)`).catch(() => {});

    // Se nenhum filtro foi fornecido, descobre todos os IDs de Organization existentes
    if (targetIds.length === 0) {
      const res = await client.query<{ id: string }>('SELECT id FROM "Organization"');
      targetIds = res.rows.map((r) => r.id);
    }

    if (targetIds.length === 0) return { count: 0 };

    // Para cada organização, limpa as tabelas com FK RESTRICT ou triggers de retenção.
    // As 22 tabelas abaixo têm FK organizationId → Organization ON DELETE RESTRICT desde a
    // migração 20261112000000_tenant_fk_cascade_to_restrict (TAREFA-SANEAMENTO-014): sem
    // deletar os filhos antes, o DELETE da Organization falha com violação de FK.
    const RESTRICT_FK_TABLES = [
      'AIGuardrailEvent',
      'AgentExecution',
      'AgentMemoryRecord',
      'RoleMemoryRecord',
      'OrganizationMemoryRecord',
      'LeadStageHistory',
      'DealClosureEvent',
      'ForecastSnapshot',
      'AccountIntelligenceSnapshot',
      'CopilotoDealHealthSnapshot',
      'CopilotoConsentRecord',
      'OrganizationAiConsent',
      'OptOutRecord',
      'CallLog',
      'VoiceCallLog',
      'ThreeCXCallEvent',
      'BitrixSyncLog',
      'ExternalCrmSyncLog',
      'DomainEventOutbox',
      'DomainEventConsumption',
      'ProspectingSearchExecution',
      'FlywheelApproachRecord',
    ];
    for (const orgId of targetIds) {
      // Seta a flag LGPD oficial (ADR-006 / migration 20261021000000) para permitir DELETE na cadeia desta org
      await client.query(`SELECT set_config('app.lgpd_chain_retention_org', $1, false)`, [orgId]);
      await client.query(`DELETE FROM "ConsentAuditRecord" WHERE "organizationId" = $1`, [orgId]).catch(() => {});
      await client.query(`DELETE FROM "ConsentAuditChainHead" WHERE "organizationId" = $1`, [orgId]).catch(() => {});
      for (const table of RESTRICT_FK_TABLES) {
        await client.query(`DELETE FROM "${table}" WHERE "organizationId" = $1`, [orgId]).catch(() => {});
      }
      await client.query(`DELETE FROM "user" WHERE "organizationId" = $1`, [orgId]).catch(() => {});
    }

    const deleted = await client.query('DELETE FROM "Organization" WHERE id = ANY($1::text[])', [targetIds]);
    return { count: deleted.rowCount ?? 0 };
  } finally {
    await client.end();
  }
}

prisma.organization.deleteMany = (async (args?: { where?: { id?: string | { in?: string[] } } }) => {
  try {
    return await originalOrgDeleteMany(args as never);
  } catch (error) {
    if (!isOrgDeleteDenied(error)) throw error;
    return deleteOrganizationsAsOwner(args);
  }
}) as typeof prisma.organization.deleteMany;

prisma.organization.delete = (async (args: { where: { id?: string; [key: string]: unknown } }) => {
  try {
    return await originalOrgDelete(args as never);
  } catch (error) {
    if (!isOrgDeleteDenied(error)) throw error;
    if (typeof args?.where?.id === 'string') {
      await deleteOrganizationsAsOwner({ where: { id: args.where.id } });
      return { id: args.where.id } as never;
    }
    throw error;
  }
}) as typeof prisma.organization.delete;

// Roda fora de qualquer request HTTP, então não há tenantId nem sessão do Better Auth por trás
// dessas queries — sem bypassRls elas seriam bloqueadas pelas mesmas policies de FORCE ROW LEVEL
// SECURITY que protegem Organization/User em produção (ver src/lib/async-context.ts).
const withRlsBypass = <T>(fn: () => Promise<T>): Promise<T> =>
  requestContext.run({ bypassRls: true }, fn);

// Onda 6 / MEL-44 (agente 14): a versão anterior iterava TODAS as organizações do banco e rodava
// 7 `deleteMany` por org via Prisma+RLS — ~700 queries sequenciais (cada uma ainda abrindo
// transação com set_config de tenant). Como worktrees da mesma onda compartilham o mesmo
// `prospectordb_test`, o número de orgs acumuladas cresce sem teto e o beforeAll/afterEach/
// afterAll estourava o hookTimeout de 30s — todos os testes do arquivo apareciam como "skipped"
// (reproduzido em capability-engine/import-agent-catalog/backfill-*: 51 testes skipped, hooks
// timeout 30s, banco com 98 orgs).
//
// A limpeza global abaixo é semanticamente idêntica — o loop antigo já apagava todas as linhas
// de todas as orgs — mas roda na conexão owner (`testOwnerDatabaseUrl`, papel
// `prospector_migrator`, que tem BYPASSRLS — ver scripts/db/create-app-role.sql), então um DELETE
// por tabela resolve tudo em ~7 queries, independente do número de orgs. O `set_config` de
// bypass fica como cinto-e-suspensório para ambientes cujo papel owner não tenha BYPASSRLS mas
// cujas policies ainda honrem `app.bypass_rls` (as que fecharam bypass no ITEM-02 são cobertas
// pelo atributo BYPASSRLS do papel, não pelo GUC).
//
// Ordem preserva a do loop antigo (filhos antes dos pais). As tabelas fora desta lista não são
// tocadas — mesmo comportamento anterior.
const CLEANUP_TABLES = [
  'TimelineEvent',
  'Activity',
  'Note',
  'PublicLeadConsent',
  'Lead',
  'Contact',
  'Company',
] as const;

let cleanupClientPromise: Promise<Client> | null = null;
const getCleanupClient = (): Promise<Client> => {
  cleanupClientPromise ??= (async () => {
    const url = testOwnerDatabaseUrl(databaseUrl);
    if (!url) {
      throw new Error(
        'Limpeza de integração exige URL de owner (MIGRATOR_DATABASE_URL/DIRECT_URL) ' +
          'com papel BYPASSRLS — sem ela o DELETE global violaria a RLS de tenant.',
      );
    }
    const client = new Client({ connectionString: url });
    await client.connect();
    await client.query(`SELECT set_config('app.bypass_rls', 'on', false)`);
    return client;
  })();
  return cleanupClientPromise;
};

const cleanDatabase = async () => {
  const client = await getCleanupClient();
  for (const table of CLEANUP_TABLES) {
    await client.query(`DELETE FROM "${table}"`);
  }
};

const seedDatabase = async () =>
  withRlsBypass(async () => {
    // Add default test organization to resolve foreign key constraints
    const exists = await prisma.organization.findUnique({ where: { id: 'test-org-id' } });
    if (!exists) {
      await prisma.organization.create({
        data: { id: 'test-org-id', name: 'Test Org' },
      });
    }
  });

beforeAll(async () => {
  await seedDatabase();
  await cleanDatabase();
});

// A maioria dos testes de integração chama use-cases/repositórios direto (sem passar pelo
// Express), então não há authenticateToken pra popular o requestContext com o tenant, como
// acontece numa requisição real. enterWith (ao contrário de run) não precisa de um callback
// envolvendo o teste inteiro — aplica o tenant padrão pro resto da execução do teste atual, o
// suficiente pra RLS deixar passar as queries tenant-scoped que esses testes exercitam. Testes que
// precisam de outro tenant ou de bypass (ex.: tests/integration/tenant-isolation-db001.test.ts)
// sobrescrevem isso explicitamente com requestContext.run(...).
beforeEach(() => {
  requestContext.enterWith({ tenantId: 'test-org-id' });
});

afterEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
  await withRlsBypass(async () => {
    try {
      await prisma.user.deleteMany();
    } catch (error) {
      void error;
    }
    // REMED-06 v5 (#35): prospector_app não tem mais DELETE em Organization (offboarding só como
    // migrator — ADR-006). As orgs de teste ficam no banco descartável de teste; o cleanDatabase()
    // acima já limpou os dados de negócio por tenant. Qualquer outro erro continua quebrando.
    try {
      await prisma.organization.deleteMany();
    } catch (error) {
      if (!/permission denied for table Organization|42501/.test(String((error as Error)?.message ?? error))) throw error;
    }
  });
  // Fecha a conexão owner da limpeza global (getCleanupClient) — sem isto o Client do pg fica
  // aberto e o worker do Vitest não termina limpo no fim da suíte.
  if (cleanupClientPromise) {
    const client = await cleanupClientPromise;
    await client.end();
  }
  await prisma.$disconnect();
});
