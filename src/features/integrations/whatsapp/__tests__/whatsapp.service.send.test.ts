import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * POS4 — prova de que `sendWhatsAppMessage` (src/features/integrations/whatsapp/whatsapp.service.ts)
 * realmente aplica o anti-ban do Agente 56 (`whatsAppAntiBanThrottler` + `sendPresenceUpdate
 * ('composing')`) no caminho de envio via socket Baileys. Antes da correção, o throttler existia
 * mas era dead code: nenhuma chamada o alcançava.
 *
 * O throttler NÃO é mockado de propósito — os testes medem o comportamento real (delay
 * humanizado serializado por organização). Cada teste usa uma organização própria para não
 * herdar `lastDispatchedAt` de execuções anteriores (o throttler é singleton de módulo).
 */

const redisStore = new Map<string, string>();
vi.mock('../../../../../src/lib/queue/redis.js', () => ({
  queuesEnabled: false,
  isDedicatedWorkerProcess: false,
  redisConfigured: false,
  connection: {},
  cacheConnection: {
    get: vi.fn(async (key: string) => redisStore.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      redisStore.set(key, value);
      return 'OK';
    }),
  },
}));

vi.mock('../../../../../src/lib/logger.js', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('../../../../../src/lib/async-context.js', () => ({
  requestContext: { run: (_ctx: unknown, fn: () => unknown) => fn() },
}));

vi.mock('../../../../../src/features/integrations/whatsapp/whatsappMessage.service.js', () => ({
  extractMessageText: vi.fn(() => ''),
  persistWhatsAppMessage: vi.fn().mockResolvedValue(undefined),
}));

const isOptedOutMock = vi.fn().mockResolvedValue(false);
vi.mock('../../../../../src/features/cadence/application/optOutService.js', () => ({
  isOptedOut: (...args: unknown[]) => isOptedOutMock(...args),
}));
vi.mock('../../../../../src/features/cadence/infra/PrismaOptOutRepository.js', () => ({
  prismaOptOutRepository: {},
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    rmSync: vi.fn(),
  },
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
  rmSync: vi.fn(),
}));

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn(async (qr: string) => `data:image/png;base64,${qr}`) },
}));

const enqueueWhatsAppCommandMock = vi.fn().mockResolvedValue(undefined);
vi.mock('../../../../../src/lib/queue/whatsappCommand.queue.js', () => ({
  enqueueWhatsAppCommand: (...args: unknown[]) => enqueueWhatsAppCommandMock(...args),
}));

type EventHandler = (...args: unknown[]) => unknown;
const socketHandlers = new Map<string, EventHandler>();
const mockSocket = {
  ev: {
    on: vi.fn((event: string, handler: EventHandler) => {
      socketHandlers.set(event, handler);
    }),
  },
  logout: vi.fn(),
  onWhatsApp: vi.fn(async () => [{ exists: true, jid: 'fake-jid@s.whatsapp.net' }]),
  sendPresenceUpdate: vi.fn().mockResolvedValue(undefined),
  sendMessage: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@whiskeysockets/baileys', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: vi.fn(() => mockSocket),
    useMultiFileAuthState: vi.fn(async () => ({ state: {}, saveCreds: vi.fn() })),
    fetchLatestBaileysVersion: vi
      .fn()
      .mockResolvedValue({ version: [2, 3000, 1015901307], isLatest: true }),
    DisconnectReason: { loggedOut: 401 },
    Browsers: { macOS: () => ['Atlas', 'Desktop', '1.0'] },
    initAuthCreds: vi.fn(() => ({})),
  };
});

const { initWhatsApp, sendWhatsAppMessage } = await import(
  '../../../../../src/features/integrations/whatsapp/whatsapp.service'
);
const { whatsAppAntiBanThrottler } = await import(
  '../../../../../src/lib/integrations/whatsapp/baileys.client'
);

let orgCounter = 0;
async function connectFreshOrg(): Promise<string> {
  const orgId = `org-throttle-${Date.now()}-${orgCounter++}`;
  await initWhatsApp(orgId);
  const connectionUpdate = socketHandlers.get('connection.update')!;
  await connectionUpdate({ connection: 'open' });
  return orgId;
}

afterEach(() => {
  vi.clearAllMocks();
  isOptedOutMock.mockResolvedValue(false);
  redisStore.clear();
  socketHandlers.clear();
});

describe('sendWhatsAppMessage — anti-ban throttler + presença (POS4)', () => {
  it('aplica sendPresenceUpdate(composing) antes do sendMessage e registra disparo no throttler', async () => {
    const orgId = await connectFreshOrg();

    const result = await sendWhatsAppMessage(orgId, '11999998888', 'Olá!');

    expect(result).toBe(true);
    expect(mockSocket.sendPresenceUpdate).toHaveBeenCalledWith(
      'composing',
      'fake-jid@s.whatsapp.net',
    );
    expect(mockSocket.sendMessage).toHaveBeenCalledWith('fake-jid@s.whatsapp.net', {
      text: 'Olá!',
    });
    // Ordem: presença ANTES da mensagem.
    const presenceOrder = mockSocket.sendPresenceUpdate.mock.invocationCallOrder[0];
    const sendOrder = mockSocket.sendMessage.mock.invocationCallOrder[0];
    expect(presenceOrder).toBeLessThan(sendOrder);
    // O throttler registrou o disparo desta organização.
    expect(whatsAppAntiBanThrottler.getRecord(orgId)?.totalDispatched).toBe(1);
  });

  it('disparos concorrentes da MESMA organização são serializados pelo throttler (delay humanizado real)', async () => {
    const orgId = await connectFreshOrg();

    const startedAt = Date.now();
    // Duas chamadas "ao mesmo tempo", como o worker BullMQ (concurrency > 1) faria.
    const [first, second] = await Promise.all([
      sendWhatsAppMessage(orgId, '11999997777', 'msg 1'),
      sendWhatsAppMessage(orgId, '11999997777', 'msg 2'),
    ]);
    const elapsed = Date.now() - startedAt;

    expect(first).toBe(true);
    expect(second).toBe(true);
    expect(mockSocket.sendMessage).toHaveBeenCalledTimes(2);
    expect(whatsAppAntiBanThrottler.getRecord(orgId)?.totalDispatched).toBe(2);
    // Sem serialização as duas leriam "sem registro anterior" e nenhuma dormiria (~0ms).
    // Com a cadeia por org, a segunda espera o delay humanizado (3–8s) — piso conservador
    // de 2,5s cobre jitter de timer sem tornar o teste flaky.
    expect(elapsed).toBeGreaterThanOrEqual(2_500);
  }, 20_000);

  it('organizações diferentes não bloqueiam uma à outra no throttler', async () => {
    const orgA = await connectFreshOrg();
    const orgB = await connectFreshOrg();

    // Org A já disparou → próximo disparo dela dorme; org B nunca disparou → imediato.
    await sendWhatsAppMessage(orgA, '11999996666', 'primeiro A');

    const startedAt = Date.now();
    let bResolvedInMs = -1;
    const bPromise = sendWhatsAppMessage(orgB, '11999995555', 'primeiro B').then((r) => {
      bResolvedInMs = Date.now() - startedAt;
      return r;
    });
    const [resA, resB] = await Promise.all([
      sendWhatsAppMessage(orgA, '11999996666', 'segundo A'),
      bPromise,
    ]);

    expect(resA).toBe(true);
    expect(resB).toBe(true);
    expect(whatsAppAntiBanThrottler.getRecord(orgA)?.totalDispatched).toBe(2);
    expect(whatsAppAntiBanThrottler.getRecord(orgB)?.totalDispatched).toBe(1);
    // B resolveu sem esperar o sleep humanizado (3–8s) do 2º disparo de A — a fila do
    // throttler é por organização, não global.
    expect(bResolvedInMs).toBeGreaterThanOrEqual(0);
    expect(bResolvedInMs).toBeLessThan(2_500);
  }, 20_000);
});
