import { beforeEach, describe, expect, it, vi } from 'vitest';

// findContactByPhone roda SQL cru (regexp_replace nos últimos 9 dígitos) fora do que a extensão
// $allOperations de prisma.ts intercepta — por isso passa por withRlsContext (ver
// src/lib/prisma.ts) em vez de prisma.$queryRaw direto. O mock simula a transação: `fn` recebe um
// client (`tx`) com o próprio $queryRaw mockado.
const txQueryRaw = vi.fn();
const withRlsContextMock = vi.fn((fn: (tx: { $queryRaw: typeof txQueryRaw }) => unknown) =>
  fn({ $queryRaw: txQueryRaw }),
);

vi.mock('../../../../lib/prisma.js', () => ({
  prisma: {
    whatsAppMessage: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
      findFirst: vi.fn(),
    },
    lead: { findFirst: vi.fn(), update: vi.fn() },
    timelineEvent: { create: vi.fn() },
    // Usado pelo caminho real de opt-out (recordOptOutAndPurgePendingJobs -> PrismaOptOutRepository).
    optOutRecord: { create: vi.fn(), findMany: vi.fn() },
  },
  withRlsContext: (fn: (tx: { $queryRaw: typeof txQueryRaw }) => unknown) => withRlsContextMock(fn),
}));

vi.mock('../../../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Handoff 16→00 (onda-3): produtores do outbox devem passar idempotencyKey estável — estes
// testes fixam as chaves wa-message:{waMessageId} / wa-engagement:{waMessageId}.
const { publishMock } = vi.hoisted(() => ({
  publishMock: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../../../lib/queue/domainEventMesh.service.js', () => ({
  domainEventMesh: { publish: publishMock },
}));

// Fila real do opt-out (`cancelPendingJobsForOptOut`, Agente 69) varre `whatsappCommandQueue`.
// Aqui entra uma fila fake com `getJobs`/`remove` espiões — prova de que a purga de jobs
// pendentes é de fato disparada pelo fluxo inbound de STOP, sem BullMQ/Redis reais.
const { whatsappCommandQueueMock } = vi.hoisted(() => ({
  whatsappCommandQueueMock: {
    name: 'whatsapp-command',
    getJobs: vi.fn(),
  },
}));
vi.mock('../../../../lib/queue/whatsappCommand.queue.js', () => ({
  WHATSAPP_COMMAND_QUEUE_NAME: 'whatsapp-command',
  WHATSAPP_DLQ_QUEUE_NAME: 'whatsapp-messages-dlq',
  whatsappCommandQueue: whatsappCommandQueueMock,
  whatsappDlqQueue: null,
  enqueueWhatsAppCommand: vi.fn(),
  enqueueWhatsAppDlq: vi.fn(),
}));

import { prisma } from '../../../../lib/prisma.js';
import {
  extractMessageText,
  listConversations,
  persistWhatsAppMessage,
} from '../whatsappMessage.service.js';

const messageMock = prisma.whatsAppMessage as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  groupBy: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
};
const leadMock = prisma.lead as unknown as {
  findFirst: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};
const timelineMock = prisma.timelineEvent as unknown as { create: ReturnType<typeof vi.fn> };
const optOutRecordMock = prisma.optOutRecord as unknown as {
  create: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
};
const queryRawMock = txQueryRaw;

const ORG = 'org-1';

beforeEach(() => {
  vi.clearAllMocks();
  messageMock.findUnique.mockResolvedValue(null);
  messageMock.create.mockResolvedValue({});
  messageMock.findMany.mockResolvedValue([]);
  messageMock.groupBy.mockResolvedValue([]);
  messageMock.findFirst.mockResolvedValue(null);
  leadMock.findFirst.mockResolvedValue(null);
  leadMock.update.mockResolvedValue({});
  timelineMock.create.mockResolvedValue({});
  optOutRecordMock.create.mockResolvedValue({
    id: 'optout-1',
    organizationId: ORG,
    scope: 'Global',
    leadId: null,
    email: null,
    phoneE164: null,
    originChannel: 'whatsapp',
    reason: null,
    evidence: null,
    requestedBy: null,
    createdAt: new Date(),
  });
  optOutRecordMock.findMany.mockResolvedValue([]);
  whatsappCommandQueueMock.getJobs.mockResolvedValue([]);
  queryRawMock.mockResolvedValue([]);
});

describe('findContactByPhone — contexto de RLS', () => {
  it('roda a busca por telefone dentro de withRlsContext (não em prisma.$queryRaw direto)', async () => {
    await persistWhatsAppMessage({
      organizationId: ORG,
      waMessageId: 'm-rls',
      direction: 'inbound',
      remoteJid: '5511999998888@s.whatsapp.net',
      body: 'oi',
    });

    expect(withRlsContextMock).toHaveBeenCalledTimes(1);
    expect(queryRawMock).toHaveBeenCalledTimes(1);
  });
});

describe('extractMessageText', () => {
  it('extrai texto simples de conversation', () => {
    expect(extractMessageText({ message: { conversation: 'Oi' } } as never)).toBe('Oi');
  });

  it('extrai texto de extendedTextMessage', () => {
    expect(extractMessageText({ message: { extendedTextMessage: { text: 'Olá' } } } as never)).toBe(
      'Olá',
    );
  });

  it('devolve null para mensagem sem conteúdo de texto (ex: figurinha)', () => {
    expect(extractMessageText({ message: { stickerMessage: {} } } as never)).toBeNull();
  });
});

describe('persistWhatsAppMessage', () => {
  it('ignora mensagens de grupo — não correspondem a um contato do CRM', async () => {
    await persistWhatsAppMessage({
      organizationId: ORG,
      waMessageId: 'm1',
      direction: 'inbound',
      remoteJid: '123456-group@g.us',
      body: 'oi pessoal',
    });

    expect(messageMock.create).not.toHaveBeenCalled();
  });

  it('é idempotente: não grava de novo uma mensagem já persistida', async () => {
    messageMock.findUnique.mockResolvedValue({ id: 'existing' });

    await persistWhatsAppMessage({
      organizationId: ORG,
      waMessageId: 'm1',
      direction: 'inbound',
      remoteJid: '5511999998888@s.whatsapp.net',
      body: 'oi',
    });

    expect(messageMock.create).not.toHaveBeenCalled();
  });

  it('persiste sem contato/lead quando o número não corresponde a ninguém cadastrado', async () => {
    queryRawMock.mockResolvedValue([]);

    await persistWhatsAppMessage({
      organizationId: ORG,
      waMessageId: 'm1',
      direction: 'inbound',
      remoteJid: '5511999998888@s.whatsapp.net',
      body: 'oi',
    });

    expect(messageMock.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: ORG,
        phoneE164: '+5511999998888',
        contactId: undefined,
        leadId: undefined,
      }),
    });
    expect(timelineMock.create).not.toHaveBeenCalled();
  });

  it('vincula ao lead em aberto do contato e registra no timeline quando o número bate', async () => {
    queryRawMock.mockResolvedValue([{ id: 'cont-1' }]);
    leadMock.findFirst.mockResolvedValue({ id: 'lead-1' });

    await persistWhatsAppMessage({
      organizationId: ORG,
      waMessageId: 'm1',
      direction: 'inbound',
      remoteJid: '5511999998888@s.whatsapp.net',
      body: 'Quero saber mais sobre o produto',
    });

    expect(messageMock.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ contactId: 'cont-1', leadId: 'lead-1' }),
    });
    expect(timelineMock.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'whatsapp', leadId: 'lead-1' }),
    });
  });

  it('não registra timeline para mensagem enviada por nós mesmos (outbound)', async () => {
    queryRawMock.mockResolvedValue([{ id: 'cont-1' }]);
    leadMock.findFirst.mockResolvedValue({ id: 'lead-1' });

    await persistWhatsAppMessage({
      organizationId: ORG,
      waMessageId: 'm2',
      direction: 'outbound',
      remoteJid: '5511999998888@s.whatsapp.net',
      body: 'Obrigado pelo contato!',
    });

    expect(messageMock.create).toHaveBeenCalled();
    expect(timelineMock.create).not.toHaveBeenCalled();
  });

  it('publica WHATSAPP_MESSAGE_RECEIVED com idempotencyKey estável wa-message:{waMessageId}', async () => {
    queryRawMock.mockResolvedValue([]);

    await persistWhatsAppMessage({
      organizationId: ORG,
      waMessageId: 'm-idem',
      direction: 'inbound',
      remoteJid: '5511999998888@s.whatsapp.net',
      body: 'oi',
    });

    expect(publishMock).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'WHATSAPP_MESSAGE_RECEIVED' }),
      { idempotencyKey: 'wa-message:m-idem' },
    );
  });

  it('publica ENGAGEMENT_SIGNAL_RECEIVED com idempotencyKey wa-engagement:{waMessageId} quando há lead', async () => {
    queryRawMock.mockResolvedValue([{ id: 'cont-1' }]);
    leadMock.findFirst.mockResolvedValue({ id: 'lead-1' });

    await persistWhatsAppMessage({
      organizationId: ORG,
      waMessageId: 'm-eng',
      direction: 'inbound',
      remoteJid: '5511999998888@s.whatsapp.net',
      body: 'Quero saber mais',
    });

    expect(publishMock).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'ENGAGEMENT_SIGNAL_RECEIVED' }),
      { idempotencyKey: 'wa-engagement:m-eng' },
    );
    // As duas chaves da mesma mensagem são distintas — o UNIQUE da outbox é
    // (organizationId, idempotencyKey) e não pode descartar um dos eventos.
    const keys = publishMock.mock.calls.map(
      (c) => (c[1] as { idempotencyKey: string }).idempotencyKey,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });
});

// N+1 (onda 42 — auditoria completa de rotas de listagem): a versão anterior de
// `listConversations` fazia `groupBy` (1 query) seguido de um `findFirst` por número de telefone
// dentro de `Promise.all` (até N queries adicionais — até 50 no pior caso, o `limit` padrão). A
// correção troca isso por um único `findMany` com `distinct: ['phoneE164']`. Estes testes medem o
// NÚMERO DE CHAMADAS ao Prisma mockado (não seriam capazes de rodar contra um Postgres real numa
// suíte unitária — os testes de integração de RLS já cobrem o contexto de tenant via
// `withRlsContext`/`executeWithRls`), para travar a ausência de N+1 e não deixar a implementação
// regredir silenciosamente de volta a um `findFirst` por conversa.
describe('listConversations — sem N+1', () => {
  it('busca todas as conversas com uma única query (findMany + distinct), nunca groupBy + findFirst por número', async () => {
    messageMock.findMany.mockResolvedValue([
      {
        phoneE164: '+5511999990001',
        body: 'Oi, tudo bem?',
        direction: 'inbound',
        receivedAt: new Date('2026-08-20T10:00:00Z'),
        contact: { id: 'cont-1', name: 'Fulano' },
      },
      {
        phoneE164: '+5511999990002',
        body: 'Obrigado!',
        direction: 'outbound',
        receivedAt: new Date('2026-08-21T10:00:00Z'),
        contact: null,
      },
    ]);

    const result = await listConversations(ORG);

    // Exatamente 1 chamada ao Prisma no total — nada de groupBy, nada de findFirst por item.
    expect(messageMock.findMany).toHaveBeenCalledTimes(1);
    expect(messageMock.groupBy).not.toHaveBeenCalled();
    expect(messageMock.findFirst).not.toHaveBeenCalled();

    // A query única já pede distinct por telefone + join do contato — não deixa a otimização
    // silenciosamente virar "1 query, mas ainda N+1 escondido em outro método".
    expect(messageMock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: ORG },
        distinct: ['phoneE164'],
        include: { contact: { select: { id: true, name: true } } },
      }),
    );

    // E o resultado continua correto: ordenado pela conversa mais recente primeiro.
    expect(result.map((c) => c.phoneE164)).toEqual(['+5511999990002', '+5511999990001']);
    expect(result[0]).toMatchObject({ contactId: null, lastMessageDirection: 'outbound' });
    expect(result[1]).toMatchObject({
      contactId: 'cont-1',
      contactName: 'Fulano',
      lastMessageDirection: 'inbound',
    });
  });

  it('respeita o limite pedido mesmo com mais conversas do que o limite (corte acontece depois da query única)', async () => {
    messageMock.findMany.mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => ({
        phoneE164: `+551199999000${i}`,
        body: `msg ${i}`,
        direction: 'inbound',
        receivedAt: new Date(2026, 7, 10 + i),
        contact: null,
      })),
    );

    const result = await listConversations(ORG, 2);

    expect(messageMock.findMany).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(2);
    // As duas mais recentes (índices 4 e 3, datas maiores) devem vir primeiro.
    expect(result.map((c) => c.phoneE164)).toEqual(['+5511999990004', '+5511999990003']);
  });
});

// POS4 (Onda 4 — achados do Agente 69): STOP inbound sem Lead aberto não registrava opt-out, e
// a purga de jobs pendentes (`cancelPendingJobsForOptOut`) não tinha caller em produção. Estes
// testes rodam o caminho REAL de opt-out (recordOptOutAndPurgePendingJobs -> PrismaOptOutRepository
// -> prisma.optOutRecord.create mockado + cancelPendingJobsForOptOut -> fila fake), então provam
// registro E purga de ponta a ponta, não só que uma função foi chamada.
describe('persistWhatsAppMessage — opt-out inbound sem lead aberto + purga de jobs (POS4)', () => {
  const STOP_JID = '5511999998888@s.whatsapp.net';

  function pendingJob(id: string, data: Record<string, unknown>) {
    return { id, data, remove: vi.fn().mockResolvedValue(undefined) };
  }

  it('STOP de contato identificável SEM lead aberto grava OptOutRecord por telefone/e-mail e remove jobs pendentes do mesmo número', async () => {
    queryRawMock.mockResolvedValue([{ id: 'cont-1', email: 'contato@example.com' }]);
    leadMock.findFirst.mockResolvedValue(null); // contato existe, mas nenhum lead em aberto

    const matchingJob = pendingJob('job-match', {
      organizationId: ORG,
      number: '(11) 99999-8888',
      context: {},
    });
    const otherOrgJob = pendingJob('job-other-org', {
      organizationId: 'org-vizinha',
      number: '5511999998888',
    });
    const otherNumberJob = pendingJob('job-other-number', {
      organizationId: ORG,
      number: '5511888880000',
    });
    whatsappCommandQueueMock.getJobs.mockResolvedValue([matchingJob, otherOrgJob, otherNumberJob]);

    await persistWhatsAppMessage({
      organizationId: ORG,
      waMessageId: 'm-stop-sem-lead',
      direction: 'inbound',
      remoteJid: STOP_JID,
      body: 'STOP',
    });

    // Opt-out registrado com sujeito identificável (sem leadId) — antes da correção isto não
    // acontecia porque o bloco inteiro dependia de `lead` existir.
    expect(optOutRecordMock.create).toHaveBeenCalledTimes(1);
    expect(optOutRecordMock.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: ORG,
        scope: 'Global',
        originChannel: 'whatsapp',
        leadId: null,
        email: 'contato@example.com',
        phoneE164: '+5511999998888',
        evidence: 'STOP',
      }),
    });

    // Purga real: só o job do MESMO tenant e MESMO número foi removido.
    expect(whatsappCommandQueueMock.getJobs).toHaveBeenCalled();
    expect(matchingJob.remove).toHaveBeenCalledTimes(1);
    expect(otherOrgJob.remove).not.toHaveBeenCalled();
    expect(otherNumberJob.remove).not.toHaveBeenCalled();
  });

  it('STOP de número totalmente desconhecido (sem contato no CRM) ainda registra opt-out por telefone', async () => {
    queryRawMock.mockResolvedValue([]); // nenhum contato cadastrado
    leadMock.findFirst.mockResolvedValue(null);

    await persistWhatsAppMessage({
      organizationId: ORG,
      waMessageId: 'm-stop-desconhecido',
      direction: 'inbound',
      remoteJid: STOP_JID,
      body: 'parar',
    });

    expect(optOutRecordMock.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: ORG,
        scope: 'Global',
        leadId: null,
        email: null,
        phoneE164: '+5511999998888',
      }),
    });
  });

  it('STOP com lead aberto registra opt-out casável por leadId E dispara a purga', async () => {
    queryRawMock.mockResolvedValue([{ id: 'cont-1', email: null }]);
    leadMock.findFirst.mockResolvedValue({
      id: 'lead-9',
      customFields: {},
      organizationId: ORG,
    });
    const leadJob = pendingJob('job-lead', {
      organizationId: ORG,
      leadId: 'lead-9',
      number: '5511777776666',
    });
    whatsappCommandQueueMock.getJobs.mockResolvedValue([leadJob]);

    await persistWhatsAppMessage({
      organizationId: ORG,
      waMessageId: 'm-stop-com-lead',
      direction: 'inbound',
      remoteJid: STOP_JID,
      body: 'sair',
    });

    // Flag legado preservado + registro unificado com leadId.
    expect(leadMock.update).toHaveBeenCalledWith({
      where: { id: 'lead-9' },
      data: { customFields: { optOutWhatsApp: true } },
    });
    expect(optOutRecordMock.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'lead-9',
        phoneE164: '+5511999998888',
      }),
    });
    // Job casado por leadId (não por telefone — o número do job é outro) também é purgado.
    expect(leadJob.remove).toHaveBeenCalledTimes(1);
  });

  it('mensagem comum inbound não grava opt-out nem consulta a fila', async () => {
    queryRawMock.mockResolvedValue([{ id: 'cont-1', email: 'a@b.com' }]);
    leadMock.findFirst.mockResolvedValue({ id: 'lead-1', customFields: {}, organizationId: ORG });

    await persistWhatsAppMessage({
      organizationId: ORG,
      waMessageId: 'm-normal',
      direction: 'inbound',
      remoteJid: STOP_JID,
      body: 'Quero saber mais sobre o produto',
    });

    expect(optOutRecordMock.create).not.toHaveBeenCalled();
    expect(whatsappCommandQueueMock.getJobs).not.toHaveBeenCalled();
  });

  it('STOP em mensagem OUTBOUND (enviada por nós) não registra opt-out', async () => {
    queryRawMock.mockResolvedValue([{ id: 'cont-1', email: null }]);
    leadMock.findFirst.mockResolvedValue(null);

    await persistWhatsAppMessage({
      organizationId: ORG,
      waMessageId: 'm-outbound-stop',
      direction: 'outbound',
      remoteJid: STOP_JID,
      body: 'STOP',
    });

    expect(optOutRecordMock.create).not.toHaveBeenCalled();
    expect(whatsappCommandQueueMock.getJobs).not.toHaveBeenCalled();
  });
});
