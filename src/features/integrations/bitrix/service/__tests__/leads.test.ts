import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const auditServiceMock = { log: vi.fn() };
vi.mock('@/lib/audit/audit.service', () => ({ AuditService: auditServiceMock }));

const prismaMock = {
  lead: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() },
  company: { create: vi.fn() },
  contact: { create: vi.fn() },
  bitrixConnection: { findFirst: vi.fn() },
  user: { findFirst: vi.fn() },
};
// DEBT-0020: a importação agora roda company/contact/lead.create dentro de
// runInTransaction (rollback atômico por item). O mock executa `fn` direto com o prismaMock —
// os delegates são os mesmos, só sem tx/rollback real (rollback é responsabilidade do Postgres,
// coberta pela integração, não por este unitário).
const runInTransactionMock = vi.fn(async (fn: (tx: unknown) => Promise<unknown>, _opts?: unknown) =>
  fn(prismaMock),
);
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock, runInTransaction: runInTransactionMock }));

// Mesmo padrão de CompanyUseCases.test.ts — leads.ts agora enfileira enriquecimento após criar a
// Company importada (ver comentário em leads.ts), então precisa do mesmo mock pra não puxar o
// Queue/Redis real no import do módulo.
const enrichmentQueueMock = { add: vi.fn() };
vi.mock('@/lib/queue/enrichment.queue', () => ({ enrichmentQueue: enrichmentQueueMock }));

const clientMock = {
  callBitrix: vi.fn(),
  getStatusLabels: vi.fn(),
  getConnectionWebhookUrl: vi.fn(),
};
vi.mock('../client.js', () => clientMock);

vi.mock('../customFields.js', () => ({
  resolveEnumMaps: vi.fn().mockResolvedValue(new Map()),
  applyInboundCustomFields: vi
    .fn()
    .mockReturnValue({ qualification: {}, leadFields: {}, contactRole: null }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  clientMock.getConnectionWebhookUrl.mockResolvedValue(
    'https://portal.bitrix24.com.br/rest/1/token/',
  );
  clientMock.getStatusLabels.mockResolvedValue(new Map());
  prismaMock.lead.findMany.mockResolvedValue([]); // nenhum lead já importado, por padrão
});

/**
 * P0-2 da auditoria: antes desta correção, o import automático (regra + botão rápido) sempre
 * consultava `crm.lead.list` com `start=0` fixo, então só enxergava a primeira página do Bitrix —
 * se ela já estivesse toda importada, os registros das páginas seguintes nunca eram alcançados.
 * Estes testes cobrem a função que corrigiu isso: findUnimportedBitrixLeadIds precisa seguir o
 * cursor `next` sozinha até achar `limit` IDs novos ou esgotar o portal.
 */
describe('findUnimportedBitrixLeadIds — paginação real (P0-2)', () => {
  it('segue o cursor `next` quando a primeira página está toda importada e a segunda tem o registro novo', async () => {
    clientMock.callBitrix
      .mockResolvedValueOnce({
        result: [{ ID: '1' }, { ID: '2' }],
        next: 50,
        total: 3,
      })
      .mockResolvedValueOnce({
        result: [{ ID: '3' }],
        next: undefined,
        total: 3,
      });
    // '1' e '2' já importados; '3' (achado só na segunda página) ainda não.
    prismaMock.lead.findMany.mockResolvedValue([{ bitrixLeadId: '1' }, { bitrixLeadId: '2' }]);

    const { findUnimportedBitrixLeadIds } = await import('../leads.js');
    const { ids, pagesScanned, pagesExhausted } = await findUnimportedBitrixLeadIds(
      'org-1',
      'conn-1',
      25,
    );

    expect(ids).toEqual(['3']);
    expect(pagesScanned).toBe(2);
    expect(pagesExhausted).toBe(true);
    // Confirma que a segunda chamada de fato pediu start=50 (o `next` da primeira página), não start=0 de novo.
    expect(clientMock.callBitrix).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      'crm.lead.list',
      expect.objectContaining({ start: 50 }),
    );
  });

  it('para no teto de páginas escaneadas (pagesExhausted=false) em vez de escanear o portal inteiro indefinidamente', async () => {
    // Todo página devolve registros já importados e sempre tem `next` — simula um portal enorme
    // 100% já sincronizado, cenário em que sem um teto o worker ficaria varrendo para sempre.
    clientMock.callBitrix.mockImplementation(
      async (_url: string, _method: string, params: { start: number }) => ({
        result: [{ ID: String(params.start) }],
        next: params.start + 50,
        total: 999999,
      }),
    );
    prismaMock.lead.findMany.mockResolvedValue(
      Array.from({ length: 2000 }, (_, i) => ({ bitrixLeadId: String(i * 50) })),
    );

    const { findUnimportedBitrixLeadIds } = await import('../leads.js');
    const { ids, pagesScanned, pagesExhausted } = await findUnimportedBitrixLeadIds(
      'org-1',
      'conn-1',
      25,
      {},
      5,
    );

    expect(ids).toEqual([]);
    expect(pagesScanned).toBe(5);
    expect(pagesExhausted).toBe(false);
  });

  it('para assim que junta `limit` IDs, sem escanear páginas além do necessário', async () => {
    clientMock.callBitrix.mockResolvedValueOnce({
      result: [{ ID: '1' }, { ID: '2' }, { ID: '3' }],
      next: 50,
      total: 3,
    });

    const { findUnimportedBitrixLeadIds } = await import('../leads.js');
    const { ids, pagesScanned } = await findUnimportedBitrixLeadIds('org-1', 'conn-1', 2);

    expect(ids).toEqual(['1', '2']);
    expect(pagesScanned).toBe(1);
    expect(clientMock.callBitrix).toHaveBeenCalledTimes(1);
  });
});

describe('importSelectedBitrixLeads — corrida de importação concorrente (P2-3)', () => {
  it('trata violação de unique constraint (P2002) como já importado, não como falha do lote inteiro', async () => {
    prismaMock.lead.findFirst.mockResolvedValue(null); // passou pela checagem prévia — a corrida acontece DEPOIS disso
    clientMock.callBitrix.mockResolvedValue({ result: { ID: '42', TITLE: 'Lead concorrente' } });
    prismaMock.company.create.mockResolvedValue({ id: 'company-1' });
    const p2002 = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    prismaMock.lead.create.mockRejectedValue(p2002);

    const { importSelectedBitrixLeads } = await import('../leads.js');
    const result = await importSelectedBitrixLeads('org-1', 'conn-1', ['42']);

    expect(result).toEqual({
      imported: 0,
      skipped: 1,
      skippedConflicts: 0,
      skippedNotOwned: 0,
      failed: 0,
      importedLeadIds: [],
    });
  });

  it('conta erros que não são P2002 como "failed" em vez de derrubar o lote inteiro (achado corrigido: auditoria da plataforma)', async () => {
    // Antes desta correção, um erro não-P2002 num item propagava pra fora do loop inteiro e
    // descartava os contadores já coletados dos itens anteriores — o frontend mostrava "falha ao
    // importar" mesmo quando outros itens do lote já tinham sido criados de verdade.
    prismaMock.lead.findFirst.mockResolvedValue(null);
    clientMock.callBitrix.mockResolvedValue({ result: { ID: '42', TITLE: 'Lead' } });
    prismaMock.company.create.mockResolvedValue({ id: 'company-1' });
    prismaMock.lead.create.mockRejectedValue(new Error('Falha de conexão com o banco'));

    const { importSelectedBitrixLeads } = await import('../leads.js');
    const result = await importSelectedBitrixLeads('org-1', 'conn-1', ['42']);

    expect(result).toEqual({
      imported: 0,
      skipped: 0,
      skippedConflicts: 0,
      skippedNotOwned: 0,
      failed: 1,
      importedLeadIds: [],
    });
  });

  it('um item com erro real não impede os demais itens do lote de serem importados', async () => {
    prismaMock.lead.findFirst.mockResolvedValue(null);
    clientMock.callBitrix
      .mockResolvedValueOnce({ result: { ID: '1', TITLE: 'Lead com erro' } })
      .mockResolvedValueOnce({ result: { ID: '2', TITLE: 'Lead ok' } });
    prismaMock.company.create.mockResolvedValue({ id: 'company-1' });
    prismaMock.lead.create
      .mockRejectedValueOnce(new Error('Falha de conexão com o banco'))
      .mockResolvedValueOnce({ id: 'lead-2' });

    const { importSelectedBitrixLeads } = await import('../leads.js');
    const result = await importSelectedBitrixLeads('org-1', 'conn-1', ['1', '2']);

    expect(result).toEqual({
      imported: 1,
      skipped: 0,
      skippedConflicts: 0,
      skippedNotOwned: 0,
      failed: 1,
      importedLeadIds: ['lead-2'],
    });
  });
});

/**
 * Cobre a correção de .agents/handoffs/onda-7/04-para-06-owner-bitrix-nome-nao-id.md:
 * Lead.owner precisa gravar o User.id do responsável (casado por e-mail via ASSIGNED_BY_ID),
 * nunca o User.name — o nome quebrava requireLeadOwnership (RBAC) e duplicava vendedores no
 * ranking de BI por owner.
 */
describe('importSelectedBitrixLeads — owner grava User.id, não User.name (Onda 10)', () => {
  it('resolve ASSIGNED_BY_ID -> e-mail do usuário Bitrix -> User.id do Atlas e grava esse id em Lead.owner', async () => {
    prismaMock.lead.findFirst.mockResolvedValue(null); // não existe ainda / sem conflito de posse (sem phone/email)
    prismaMock.user.findFirst.mockResolvedValue({ id: 'user-cuid-ana' }); // resolveAtlasUserIdByEmail
    prismaMock.company.create.mockResolvedValue({ id: 'company-1' });
    prismaMock.lead.create.mockResolvedValue({ id: 'lead-1' });

    clientMock.callBitrix.mockImplementation(async (_url: string, method: string) => {
      if (method === 'user.get') {
        return {
          result: [{ ID: '7', NAME: 'Ana', LAST_NAME: 'Souza', EMAIL: 'ana@birthhub360.com.br' }],
        };
      }
      if (method === 'crm.lead.get') {
        return { result: { ID: '42', TITLE: 'Lead Ana', ASSIGNED_BY_ID: '7' } };
      }
      throw new Error(`método Bitrix inesperado neste teste: ${method}`);
    });

    const { importSelectedBitrixLeads } = await import('../leads.js');
    const result = await importSelectedBitrixLeads('org-1', 'conn-1', ['42']);

    expect(result).toEqual({
      imported: 1,
      skipped: 0,
      skippedConflicts: 0,
      skippedNotOwned: 0,
      failed: 0,
      importedLeadIds: ['lead-1'],
    });
    expect(prismaMock.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: 'org-1',
          email: { equals: 'ana@birthhub360.com.br', mode: 'insensitive' },
        },
      }),
    );
    expect(prismaMock.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ owner: 'user-cuid-ana' }),
      }),
    );
    // Nunca o nome — essa era exatamente a convenção quebrada que este teste protege contra regressão.
    const createdData = prismaMock.lead.create.mock.calls[0][0].data;
    expect(createdData.owner).not.toBe('Ana Souza');
  });

  it('sem correspondência de e-mail no Atlas, importa o lead sem responsável (owner null) — nunca fabrica um vínculo', async () => {
    prismaMock.lead.findFirst.mockResolvedValue(null);
    prismaMock.user.findFirst.mockResolvedValue(null); // nenhum usuário Atlas com esse e-mail
    prismaMock.company.create.mockResolvedValue({ id: 'company-1' });
    prismaMock.lead.create.mockResolvedValue({ id: 'lead-2' });

    clientMock.callBitrix.mockImplementation(async (_url: string, method: string) => {
      if (method === 'user.get') {
        return { result: [{ ID: '8', NAME: 'Carla', EMAIL: 'carla@bitrix-externo.com' }] };
      }
      if (method === 'crm.lead.get') {
        return { result: { ID: '43', TITLE: 'Lead Carla', ASSIGNED_BY_ID: '8' } };
      }
      throw new Error(`método Bitrix inesperado neste teste: ${method}`);
    });

    const { importSelectedBitrixLeads } = await import('../leads.js');
    const result = await importSelectedBitrixLeads('org-1', 'conn-1', ['43']);

    expect(result.imported).toBe(1);
    expect(prismaMock.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ owner: null }) }),
    );
  });
});

/**
 * DEBT-0020 — importação Bitrix não atômica → órfãos parciais. Antes, company.create /
 * contact.create / lead.create eram transações independentes: uma falha no lead.create (ex.:
 * P2002 da unique constraint numa corrida, ou queda de conexão) deixava Company e Contact
 * commitados órfãos, sem Lead. Agora os três creates + o audit IMPORT rodam dentro de UM
 * runInTransaction por item — rollback de tudo em qualquer falha — e o enrichmentQueue (efeito
 * externo) só é enfileirado DEPOIS do commit.
 */
describe('importSelectedBitrixLeads — atomicidade por item (DEBT-0020)', () => {
  it('executa os creates do item dentro de runInTransaction com o tenant da organização', async () => {
    prismaMock.lead.findFirst.mockResolvedValue(null);
    prismaMock.user.findFirst.mockResolvedValue(null);
    clientMock.callBitrix.mockResolvedValue({
      result: { ID: '42', TITLE: 'Lead ok', NAME: 'Ana', LAST_NAME: 'Souza' },
    });
    prismaMock.company.create.mockResolvedValue({ id: 'company-1' });
    prismaMock.contact.create.mockResolvedValue({ id: 'contact-1' });
    prismaMock.lead.create.mockResolvedValue({ id: 'lead-1' });

    const { importSelectedBitrixLeads } = await import('../leads.js');
    const result = await importSelectedBitrixLeads('org-1', 'conn-1', ['42']);

    expect(result.imported).toBe(1);
    // Uma transação por item, escopada no tenant — nunca uma transação pro lote inteiro
    // (lotes de até 100 itens estourariam o timeout de 45s do runInTransaction).
    expect(runInTransactionMock).toHaveBeenCalledTimes(1);
    expect(runInTransactionMock).toHaveBeenCalledWith(expect.any(Function), {
      organizationId: 'org-1',
    });
    // company -> contact -> lead todos dentro do mesmo runInTransaction (chamados durante o fn).
    expect(prismaMock.company.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.contact.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.lead.create).toHaveBeenCalledTimes(1);
    // Enriquecimento enfileirado uma vez, pós-commit, com o id da empresa criada.
    expect(enrichmentQueueMock.add).toHaveBeenCalledTimes(1);
    expect(enrichmentQueueMock.add).toHaveBeenCalledWith('enrich-company', {
      companyId: 'company-1',
      organizationId: 'org-1',
    });
  });

  it('falha no meio do item (lead.create rejeita) conta como failed e NÃO enfileira enriquecimento — rollback remove os órfãos parciais', async () => {
    prismaMock.lead.findFirst.mockResolvedValue(null);
    clientMock.callBitrix.mockResolvedValue({ result: { ID: '42', TITLE: 'Lead', NAME: 'Ana' } });
    prismaMock.company.create.mockResolvedValue({ id: 'company-orfa' });
    prismaMock.contact.create.mockResolvedValue({ id: 'contact-orfa' });
    prismaMock.lead.create.mockRejectedValue(new Error('connection lost mid-import'));

    const { importSelectedBitrixLeads } = await import('../leads.js');
    const result = await importSelectedBitrixLeads('org-1', 'conn-1', ['42']);

    expect(result).toEqual({
      imported: 0,
      skipped: 0,
      skippedConflicts: 0,
      skippedNotOwned: 0,
      failed: 1,
      importedLeadIds: [],
    });
    // A empresa "criada" dentro do tx que deu rollback não pode ir para a fila de
    // enriquecimento — seria enriquecer um registro que não existe.
    expect(enrichmentQueueMock.add).not.toHaveBeenCalled();
    // Audit IMPORT também não roda (está dentro do tx — só executa se os creates passarem).
    expect(auditServiceMock.log).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: 'IMPORT' }),
    );
  });

  it('P2002 no lead.create continua contado como skipped (corrida de importação) sem enfileirar enriquecimento', async () => {
    prismaMock.lead.findFirst.mockResolvedValue(null);
    clientMock.callBitrix.mockResolvedValue({ result: { ID: '42', TITLE: 'Lead' } });
    prismaMock.company.create.mockResolvedValue({ id: 'company-1' });
    const p2002 = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    prismaMock.lead.create.mockRejectedValue(p2002);

    const { importSelectedBitrixLeads } = await import('../leads.js');
    const result = await importSelectedBitrixLeads('org-1', 'conn-1', ['42']);

    expect(result.skipped).toBe(1);
    expect(result.failed).toBe(0);
    expect(enrichmentQueueMock.add).not.toHaveBeenCalled();
  });
});
