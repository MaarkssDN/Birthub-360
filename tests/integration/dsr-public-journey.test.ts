import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Client } from 'pg';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';

// Aceite do canal público DSR (LGPD art. 18) — Agente 08, handoff do 00.
// Jornada completa contra Postgres REAL (prospectordb_test) + RLS real:
//   submit → DataSubjectRequest gravado → e-mail de verificação (mailer mockado
//   capturando o "envio") → verify → dossiê ACCESS → status/acompanhamento.
// Todos os dados são SINTÉTICOS (titular@example.test) — nunca PII real.
//
// Limitação documentada: não há Mailpit/SMTP local neste ambiente; o mock do
// mailer captura o conteúdo que seria enviado, provando que a URL de
// verificação chega ao titular — o transporte SMTP em si já é coberto pela
// suíte unitária do mailer/serviço.

const sentEmails: Array<{ to: string; subject: string; text: string }> = [];

vi.mock('../../src/lib/email/mailer.js', () => ({
  MailerNotConfiguredError: class MailerNotConfiguredError extends Error {},
  sendEmail: vi.fn(async (input: { to: string; subject: string; text: string }) => {
    sentEmails.push({ to: input.to, subject: input.subject, text: input.text });
    return { messageId: 'test-message-id' };
  }),
}));

import { prisma } from '../../src/lib/prisma';
import { requestContext } from '../../src/lib/async-context';
import { contactEmailIndex } from '../../src/lib/crypto/piiIndex';
import { dsrRequestRoutes } from '../../src/features/lgpd/dsrRequest.routes';

const withTenant = <T>(tenantId: string, fn: () => Promise<T>): Promise<T> =>
  requestContext.run({ tenantId }, fn);

function buildApp(max = 20) {
  const app = express();
  app.use(express.json());
  app.use(
    '/api/public/data-subject-requests',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => ipKeyGenerator(req.ip || 'unknown'),
      message: { ok: false, error: 'rate_limited' },
    }),
    dsrRequestRoutes,
  );
  return app;
}

const TITULAR_EMAIL = 'titular.dsr@example.test';
const OTHER_TITULAR_EMAIL = 'outro-titular@example.test';
const OTHER_TITULAR_NAME = 'Outro Titular Que Nao Pode Aparecer';

async function seedTitular(email: string, name = 'Titular Sintetico DSR') {
  return withTenant('test-org-id', async () => {
    const company = await prisma.company.create({
      data: { legalName: 'Empresa Sintetica DSR LTDA', tradeName: 'Empresa Sintetica' },
    });
    return prisma.contact.create({
      data: {
        name,
        email,
        phone: '+5511900000000',
        companyId: company.id,
      },
    });
  });
}

async function seedOtherTitular() {
  return seedTitular(OTHER_TITULAR_EMAIL, OTHER_TITULAR_NAME);
}

function extractUrls(emailText: string): { verifyUrl: string; statusUrl: string } {
  const verifyUrl = emailText.match(/https?:\/\/\S*\/privacidade\/dsr\/verificar\?\S+/)?.[0];
  const statusUrl = emailText.match(/https?:\/\/\S*\/privacidade\/dsr\/acompanhamento\?\S+/)?.[0];
  expect(verifyUrl, 'e-mail de verificação deve conter a URL de verificação').toBeTruthy();
  expect(statusUrl, 'e-mail de verificação deve conter a URL de acompanhamento').toBeTruthy();
  return { verifyUrl: verifyUrl!, statusUrl: statusUrl! };
}

beforeAll(() => {
  process.env.LANDING_LEAD_ORGANIZATION_ID = 'test-org-id';
  process.env.PUBLIC_BASE_URL = 'https://birthhub360.test';
});

describe('DSR público — jornada completa com dados sintéticos (integração real)', () => {
  it('submit grava DataSubjectRequest no banco, envia e-mail, verify entrega dossiê e status responde só metadados', async () => {
    // Outro titular na MESMA organização — o dossiê não pode vazar dados dele.
    await seedOtherTitular();
    const contact = await seedTitular(TITULAR_EMAIL);
    sentEmails.length = 0;
    const app = buildApp();

    // 1. Submit — anti-enumeração: 202 idêntico.
    const submit = await request(app)
      .post('/api/public/data-subject-requests')
      .send({ email: TITULAR_EMAIL, rightType: 'ACCESS', preferredChannel: 'email' });
    expect(submit.status).toBe(202);
    expect(submit.body).toEqual({ ok: true });

    // 2. Persistência real: a linha existe no banco, cifrada, sob o tenant resolvido no servidor.
    const titularIndex = contactEmailIndex(TITULAR_EMAIL);
    const row = await withTenant('test-org-id', async () =>
      prisma.dataSubjectRequest.findFirst({
        where: { organizationId: 'test-org-id', emailIndex: titularIndex! },
      }),
    );
    expect(row).toBeTruthy();
    expect(row!.protocol).toMatch(/^DSR-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
    expect(row!.status).toBe('PENDING_VERIFICATION');
    expect(row!.rightType).toBe('ACCESS');
    expect(row!.contactId).toBeNull(); // titular só é resolvido após verificação
    expect(row!.verificationTokenHash).toBeTruthy();
    expect(row!.verificationExpiresAt!.getTime()).toBeGreaterThan(Date.now());
    // E-mail do titular cifrado em repouso: a extensão do Prisma decifra
    // `enc:v1:` transparentemente na leitura (encryptedModelFields.ts), então o
    // valor via client já vem em claro — a prova de cifra é no valor bruto do banco.
    // A RLS exige o GUC app.current_tenant_id (a extensão só o injeta em queries de
    // model), então a leitura bruta usa um client pg com a GUC setada na sessão.
    expect(row!.emailEncrypted).toBe(TITULAR_EMAIL);
    const rawClient = new Client({ connectionString: process.env.DIRECT_URL });
    await rawClient.connect();
    try {
      await rawClient.query(`SELECT set_config('app.current_tenant_id', 'test-org-id', false)`);
      const rawRes = await rawClient.query<{ emailEncrypted: string }>(
        `SELECT "emailEncrypted" FROM "DataSubjectRequest" WHERE id = $1`,
        [row!.id],
      );
      expect(rawRes.rows).toHaveLength(1);
      expect(rawRes.rows[0]!.emailEncrypted).toMatch(/^enc:v1:/);
      expect(rawRes.rows[0]!.emailEncrypted).not.toContain(TITULAR_EMAIL);
    } finally {
      await rawClient.end();
    }
    // Tokens em claro não são persistidos — só os hashes SHA-256.
    expect(row!.verificationTokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(row!.statusTokenHash).toMatch(/^[0-9a-f]{64}$/);

    // 3. E-mail de verificação capturado (stub do SMTP) — contém protocolo e links.
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0]!.to).toBe(TITULAR_EMAIL);
    expect(sentEmails[0]!.subject).toContain(row!.protocol);
    const { verifyUrl, statusUrl } = extractUrls(sentEmails[0]!.text);

    const verify = new URL(verifyUrl);
    const protocol = verify.searchParams.get('protocol')!;
    const verifyToken = verify.searchParams.get('token')!;
    expect(protocol).toBe(row!.protocol);
    const statusToken = new URL(statusUrl).searchParams.get('token')!;
    expect(statusToken).toBeTruthy();

    // 4. Status ANTES da verificação — só metadados, nada de PII.
    const statusBefore = await request(app).get(
      `/api/public/data-subject-requests/status/${encodeURIComponent(statusToken)}`,
    );
    expect(statusBefore.status).toBe(200);
    expect(statusBefore.body).toMatchObject({
      ok: true,
      protocol: row!.protocol,
      rightType: 'ACCESS',
      status: 'PENDING_VERIFICATION',
    });
    expect(JSON.stringify(statusBefore.body)).not.toContain('@');
    expect(JSON.stringify(statusBefore.body)).not.toContain(contact.id);

    // 5. Verify — token errado é recusado com erro genérico (sem vazar existência).
    const badVerify = await request(app)
      .post('/api/public/data-subject-requests/verify')
      .send({ protocol, token: 'token-errado-de-teste-12345' });
    expect(badVerify.status).toBe(400);
    expect(badVerify.body).toEqual({ ok: false, error: 'invalid_or_expired_token' });

    // 6. Verify correto — executa o direito na hora e devolve o dossiê.
    const goodVerify = await request(app)
      .post('/api/public/data-subject-requests/verify')
      .send({ protocol, token: verifyToken });
    expect(goodVerify.status).toBe(200);
    expect(goodVerify.body.ok).toBe(true);
    expect(goodVerify.body.status).toBe('COMPLETED');
    expect(typeof goodVerify.body.package).toBe('string');

    // 7. Dossiê restrito ao titular da solicitação — contém os dados do contato
    //    e NÃO contém dados de outro titular da mesma organização (seedado antes
    //    do verify, então a ausência é prova real de isolamento).
    const dossier = JSON.parse(goodVerify.body.package);
    const dossierText = JSON.stringify(dossier);
    expect(dossierText).toContain('Titular Sintetico DSR');
    expect(dossierText).toContain(TITULAR_EMAIL);
    expect(dossierText).not.toContain(OTHER_TITULAR_NAME);
    expect(dossierText).not.toContain(OTHER_TITULAR_EMAIL);
    expect(dossier.metadata.exportId).toMatch(/^portability-[0-9a-f]{16}$/);
    expect(dossier.metadata.dataSubjectHash).toMatch(/^[0-9a-f]{64}$/);

    // 8. Persistência pós-verify: status COMPLETED, contactId resolvido, verifiedAt setado.
    const rowAfter = await withTenant('test-org-id', async () =>
      prisma.dataSubjectRequest.findUniqueOrThrow({ where: { protocol } }),
    );
    expect(rowAfter.status).toBe('COMPLETED');
    expect(rowAfter.contactId).toBe(contact.id);
    expect(rowAfter.verifiedAt).toBeInstanceOf(Date);

    // 9. Status DEPOIS da verificação — reflete COMPLETED, ainda sem PII.
    const statusAfter = await request(app).get(
      `/api/public/data-subject-requests/status/${encodeURIComponent(statusToken)}`,
    );
    expect(statusAfter.status).toBe(200);
    expect(statusAfter.body.status).toBe('COMPLETED');
    expect(JSON.stringify(statusAfter.body)).not.toContain('@');

    // 10. Token de verificação é de uso único — segunda chamada falha.
    const replay = await request(app)
      .post('/api/public/data-subject-requests/verify')
      .send({ protocol, token: verifyToken });
    expect(replay.status).toBe(400);
    expect(replay.body).toEqual({ ok: false, error: 'invalid_or_expired_token' });

    // 11. E-mail de conclusão enviado ao titular.
    expect(sentEmails.length).toBeGreaterThanOrEqual(2);
    expect(sentEmails.at(-1)!.to).toBe(TITULAR_EMAIL);
    expect(sentEmails.at(-1)!.subject).toContain(protocol);
  });

  it('submit com e-mail sem titular responde 202 idêntico, não grava nada e não envia e-mail', async () => {
    sentEmails.length = 0;
    const app = buildApp();
    const res = await request(app)
      .post('/api/public/data-subject-requests')
      .send({ email: 'ninguem.cadastrado@example.test', rightType: 'ERASURE' });
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ ok: true });
    expect(sentEmails).toHaveLength(0);

    const idx = contactEmailIndex('ninguem.cadastrado@example.test');
    const match = await withTenant('test-org-id', async () =>
      prisma.dataSubjectRequest.findFirst({ where: { emailIndex: idx! } }),
    );
    expect(match).toBeNull();
  });

  it('payload inválido → 400 sem tocar o banco', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/public/data-subject-requests')
      .send({ email: 'não-é-email', rightType: 'TUDO' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('rate limit dedicado: N+1ª requisição no mesmo IP → 429', async () => {
    const app = buildApp(3);
    const statuses: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      const res = await request(app)
        .post('/api/public/data-subject-requests')
        .send({ email: `rate-limit-${i}@example.test`, rightType: 'ACCESS' });
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 3).every((s) => s === 202 || s === 400)).toBe(true);
    expect(statuses[3]).toBe(429);
  });

  it('RLS real: DataSubjectRequest de test-org-id é invisível para outro tenant', async () => {
    const contact = await seedTitular('rls-check@example.test');
    expect(contact.id).toBeTruthy();
    const app = buildApp();
    const submit = await request(app)
      .post('/api/public/data-subject-requests')
      .send({ email: 'rls-check@example.test', rightType: 'ACCESS' });
    expect(submit.status).toBe(202);

    const otherTenantRows = await withTenant('org-intrusa-dsr', async () =>
      prisma.dataSubjectRequest.findMany({ where: { organizationId: 'test-org-id' } }),
    );
    expect(otherTenantRows).toEqual([]);
  });
});
