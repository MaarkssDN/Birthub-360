import express from 'express';
import rateLimit from 'express-rate-limit';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { requestContext } from '../../src/lib/async-context';
import {
  LANDING_DEMO_CONSENT_CHAIN_PURPOSE,
  LANDING_DEMO_CONSENT_PURPOSE,
  LANDING_DEMO_CONSENT_VERSION,
  LANDING_LEAD_SOURCE,
} from '../../src/features/public-leads/publicLead.constants';
import { publicLeadRoutes } from '../../src/features/public-leads/publicLead.routes';
import { contactEmailIndex } from '../../src/lib/crypto/piiIndex';

const CLEARTEXT_IP = /(?:^|[^0-9a-f])(?:127\.0\.0\.1|::ffff:127\.0\.0\.1)(?:[^0-9a-f]|$)/i;

function assertNoCleartextIp(value: unknown): void {
  expect(JSON.stringify(value)).not.toMatch(CLEARTEXT_IP);
}

const valid = {
  nome: 'Mariana Albuquerque',
  email: 'mariana.demo@empresa-landing.com.br',
  whatsapp: '(11) 98888-7777',
  equipe: '16 a 50',
  consent: true,
  consentTextVersion: LANDING_DEMO_CONSENT_VERSION,
  purpose: 'agendamento_demonstracao',
};

function buildApp(max = 20) {
  const app = express();
  app.use(express.json());
  app.use(
    '/api/public/demo-leads',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      message: { ok: false, error: 'rate_limited' },
    }),
    publicLeadRoutes,
  );
  return app;
}

describe('POST /api/public/demo-leads (integração)', () => {
  beforeAll(() => {
    process.env.LANDING_LEAD_ORGANIZATION_ID = 'test-org-id';
    process.env.PUBLIC_LEAD_IP_HASH_SECRET ??= 'integration-test-ip-hash-secret';
  });

  it('persiste lead + contato + prova de consentimento e responde 202 genérico', async () => {
    const res = await request(buildApp()).post('/api/public/demo-leads').send(valid);
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ ok: true });
    expect(res.body).not.toHaveProperty('leadId');

    const emailIndex = contactEmailIndex(valid.email);
    const contact = await prisma.contact.findFirst({
      where: { organizationId: 'test-org-id', emailIndex, deletedAt: null },
    });
    expect(contact).toBeTruthy();
    expect(contact?.name).toBe(valid.nome);

    const lead = await prisma.lead.findFirst({
      where: {
        organizationId: 'test-org-id',
        contactId: contact!.id,
        source: LANDING_LEAD_SOURCE,
        deletedAt: null,
      },
    });
    expect(lead).toBeTruthy();
    expect(lead?.status).toBe('Lead_Recebido');
    expect(lead?.customFields).toMatchObject({ equipe: valid.equipe });

    const consent = await prisma.publicLeadConsent.findFirst({
      where: { organizationId: 'test-org-id', leadId: lead!.id },
    });
    expect(consent).toBeTruthy();
    expect(consent?.termsVersion).toBe(LANDING_DEMO_CONSENT_VERSION);
    expect(consent?.purpose).toBe('agendamento_demonstracao');
    expect(consent?.termsText).toContain('agendamento da demonstração');
    expect(consent?.grantedAt).toBeInstanceOf(Date);

    const audit = await prisma.consentAuditRecord.findFirst({
      where: {
        organizationId: 'test-org-id',
        purpose: LANDING_DEMO_CONSENT_CHAIN_PURPOSE[LANDING_DEMO_CONSENT_PURPOSE],
        termsVersion: LANDING_DEMO_CONSENT_VERSION,
      },
      orderBy: { occurredAt: 'desc' },
      include: { details: true },
    });
    expect(audit).toBeTruthy();
    expect(audit?.details.length).toBeGreaterThan(0);
    const detailText = audit!.details.map((row) => row.detail).join('\n');
    expect(detailText).toMatch(/"ipHash"\s*:\s*"[0-9a-f]{64}"/);
    assertNoCleartextIp({ consent, lead, contact, audit, details: audit?.details });
  });

  it('não cria segundo lead no reenvio do mesmo e-mail e devolve o mesmo 202', async () => {
    const app = buildApp();
    const first = await request(app).post('/api/public/demo-leads').send({
      ...valid,
      email: 'idempotente@empresa-landing.com.br',
    });
    const second = await request(app).post('/api/public/demo-leads').send({
      ...valid,
      email: 'idempotente@empresa-landing.com.br',
      nome: 'Outro Nome Tentando Sobrescrever',
      whatsapp: '(21) 97777-6666',
    });
    expect(first.status).toBe(202);
    expect(second.status).toBe(202);

    const emailIndex = contactEmailIndex('idempotente@empresa-landing.com.br');
    const contacts = await prisma.contact.findMany({
      where: { organizationId: 'test-org-id', emailIndex, deletedAt: null },
    });
    expect(contacts).toHaveLength(1);
    expect(contacts[0]?.name).toBe(valid.nome);

    const leads = await prisma.lead.findMany({
      where: {
        organizationId: 'test-org-id',
        contactId: contacts[0]!.id,
        source: LANDING_LEAD_SOURCE,
        deletedAt: null,
      },
    });
    expect(leads).toHaveLength(1);
  });

  it('rejeita e-mail inválido e ausência de consentimento com 400', async () => {
    const app = buildApp();
    const invalidEmail = await request(app)
      .post('/api/public/demo-leads')
      .send({ ...valid, email: 'sem-arroba' });
    expect(invalidEmail.status).toBe(400);
    expect(invalidEmail.body.error).toBe('invalid_payload');
    expect(invalidEmail.body.fields.email).toBe('invalid');

    const noConsent = await request(app)
      .post('/api/public/demo-leads')
      .send({ ...valid, email: 'sem.consent@empresa-landing.com.br', consent: false });
    expect(noConsent.status).toBe(400);
    expect(noConsent.body.fields.consent).toBe('required');

    expect(noConsent.status).toBe(400);
  });

  it('honeypot devolve 202 e não grava registro', async () => {
    const email = 'honeypot@empresa-landing.com.br';
    const res = await request(buildApp())
      .post('/api/public/demo-leads')
      .send({ ...valid, email, website: 'https://spam.invalid' });
    expect(res.status).toBe(202);

    const emailIndex = contactEmailIndex(email);
    const contact = await prisma.contact.findFirst({
      where: { organizationId: 'test-org-id', emailIndex },
    });
    expect(contact).toBeNull();
  });

  it('ignora tenantId enviado pelo cliente e grava só no tenant configurado no servidor', async () => {
    const email = 'tenant-ignore@empresa-landing.com.br';
    const res = await request(buildApp())
      .post('/api/public/demo-leads')
      .send({ ...valid, email, tenantId: 'org-arbitraria' });
    expect(res.status).toBe(202);

    const emailIndex = contactEmailIndex(email);
    const contact = await prisma.contact.findFirst({
      where: { emailIndex, deletedAt: null },
    });
    expect(contact?.organizationId).toBe('test-org-id');
  });

  it('responde 429 depois de N requisições no mesmo IP', async () => {
    const app = buildApp(3);
    const statuses: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      const res = await request(app)
        .post('/api/public/demo-leads')
        .send({ ...valid, email: `rate${i}@empresa-landing.com.br` });
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 3).every((status) => status === 202 || status === 400)).toBe(true);
    expect(statuses[3]).toBe(429);
  });
  it('aceita captura sem WhatsApp', async () => {
    const email = 'sem-whatsapp@empresa-landing.com.br';
    const { whatsapp: _whatsapp, ...rest } = valid;
    const res = await request(buildApp()).post('/api/public/demo-leads').send({ ...rest, email });
    expect(res.status).toBe(202);
    const emailIndex = contactEmailIndex(email);
    const contact = await prisma.contact.findFirst({
      where: { organizationId: 'test-org-id', emailIndex, deletedAt: null },
    });
    expect(contact).toBeTruthy();
    expect(contact?.whatsapp).toBeFalsy();
  });

  it('consent !== true responde 400 e não persiste nenhum registro', async () => {
    const email = 'sem-consentimento@empresa-landing.com.br';
    const res = await request(buildApp())
      .post('/api/public/demo-leads')
      .send({ ...valid, email, consent: false });
    expect(res.status).toBe(400);
    expect(res.body.fields.consent).toBe('required');
    const emailIndex = contactEmailIndex(email);
    const contact = await prisma.contact.findFirst({
      where: { organizationId: 'test-org-id', emailIndex },
    });
    expect(contact).toBeNull();
  });

  it('RLS: tenant B não lê a prova de consentimento do tenant A', async () => {
    const email = 'rls-consent@empresa-landing.com.br';
    const res = await request(buildApp()).post('/api/public/demo-leads').send({ ...valid, email });
    expect(res.status).toBe(202);

    const emailIndex = contactEmailIndex(email);
    const contact = await prisma.contact.findFirst({
      where: { organizationId: 'test-org-id', emailIndex, deletedAt: null },
    });
    const lead = await prisma.lead.findFirst({
      where: { organizationId: 'test-org-id', contactId: contact!.id, source: LANDING_LEAD_SOURCE, deletedAt: null },
    });
    const consent = await prisma.publicLeadConsent.findFirst({
      where: { organizationId: 'test-org-id', leadId: lead!.id },
    });
    expect(consent).toBeTruthy();

    await requestContext.run({ bypassRls: true }, async () => {
      const exists = await prisma.organization.findUnique({ where: { id: 'public-lead-rls-org-b' } });
      if (!exists) {
        await prisma.organization.create({ data: { id: 'public-lead-rls-org-b', name: 'Org B RLS public lead' } });
      }
    });

    await requestContext.run({ tenantId: 'public-lead-rls-org-b' }, async () => {
      const hidden = await prisma.publicLeadConsent.findMany({ where: { id: consent!.id } });
      expect(hidden).toHaveLength(0);
    });

    await requestContext.run({ tenantId: 'test-org-id' }, async () => {
      const visible = await prisma.publicLeadConsent.findMany({ where: { id: consent!.id } });
      expect(visible).toHaveLength(1);
    });
  });
});
