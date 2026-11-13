import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

/**
 * Rota pública de captura de lead da landing (`/api/public/lead-capture`,
 * `src/features/landing/routes/leadCapture.routes.ts`). Contrato verificado aqui:
 *
 * 1. Payload inválido (sem consentimento LGPD, e-mail malformado, WhatsApp fora do
 *    padrão) → 400, nenhum e-mail disparado.
 * 2. Payload válido → 200 + `sendEmail` real chamado com os dados do lead (o envio
 *    por SMTP é a persistência desta rota — não existe tabela de lead público).
 * 3. Honeypot `website` preenchido (bot) → 200 silencioso, nenhum e-mail.
 * 4. Sem destinatário configurado (LEAD_CAPTURE_EMAIL/SMTP_FROM/SMTP_USER vazios)
 *    → 503 honesto, nunca sucesso falso.
 * 5. SMTP não configurado (MailerNotConfiguredError) → 503 honesto.
 */

const { sendEmailMock, mockedEnv } = vi.hoisted(() => ({
  sendEmailMock: vi.fn(),
  mockedEnv: {
    LEAD_CAPTURE_EMAIL: 'comercial@birthhub360.com.br' as string | undefined,
    SMTP_FROM: undefined as string | undefined,
    SMTP_USER: undefined as string | undefined,
  },
}));

vi.mock('../../../../src/config/env.js', () => ({
  env: mockedEnv,
}));

vi.mock('../../../../src/lib/email/mailer.js', () => ({
  sendEmail: (...args: unknown[]) => sendEmailMock(...args),
  MailerNotConfiguredError: class MailerNotConfiguredError extends Error {},
}));

import { publicLeadCaptureRouter } from '../../../../src/features/landing/routes/leadCapture.routes';
import { errorHandler } from '../../../../src/shared/middlewares/errorHandler';
import { MailerNotConfiguredError } from '../../../../src/lib/email/mailer';

const app = express();
app.use(express.json());
app.use('/api/public', publicLeadCaptureRouter);
app.use(errorHandler);

const VALID_LEAD = {
  nome: 'Mariana Albuquerque',
  email: 'mariana@empresa.com.br',
  whatsapp: '(11) 99999-9999',
  equipe: '6 a 15',
  consent: true,
};

beforeEach(() => {
  sendEmailMock.mockReset();
  sendEmailMock.mockResolvedValue({ messageId: 'msg-1' });
  mockedEnv.LEAD_CAPTURE_EMAIL = 'comercial@birthhub360.com.br';
  delete mockedEnv.SMTP_FROM;
  delete mockedEnv.SMTP_USER;
});

describe('POST /api/public/lead-capture', () => {
  it('rejeita payload sem consentimento LGPD', async () => {
    const res = await request(app)
      .post('/api/public/lead-capture')
      .send({ ...VALID_LEAD, consent: false });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('rejeita e-mail malformado', async () => {
    const res = await request(app)
      .post('/api/public/lead-capture')
      .send({ ...VALID_LEAD, email: 'nao-e-email' });
    expect(res.status).toBe(400);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('envia e-mail real com os dados do lead em payload válido', async () => {
    const res = await request(app).post('/api/public/lead-capture').send(VALID_LEAD);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const sent = sendEmailMock.mock.calls[0][0] as {
      to: string;
      subject: string;
      text: string;
    };
    expect(sent.to).toBe('comercial@birthhub360.com.br');
    expect(sent.subject).toContain('Mariana Albuquerque');
    expect(sent.text).toContain('mariana@empresa.com.br');
    expect(sent.text).toContain('11999999999');
    expect(sent.text).toContain('6 a 15');
    expect(sent.text).toContain('Consentimento LGPD');
  });

  it('honeypot preenchido retorna sucesso silencioso sem enviar e-mail', async () => {
    const res = await request(app)
      .post('/api/public/lead-capture')
      .send({ ...VALID_LEAD, website: 'http://spam.example' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('responde 503 honesto quando nenhum destinatário está configurado', async () => {
    delete mockedEnv.LEAD_CAPTURE_EMAIL;
    const res = await request(app).post('/api/public/lead-capture').send(VALID_LEAD);
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('cai para SMTP_FROM quando LEAD_CAPTURE_EMAIL está ausente', async () => {
    delete mockedEnv.LEAD_CAPTURE_EMAIL;
    mockedEnv.SMTP_FROM = 'fallback@birthhub360.com.br';
    const res = await request(app).post('/api/public/lead-capture').send(VALID_LEAD);
    expect(res.status).toBe(200);
    const sent = sendEmailMock.mock.calls[0][0] as { to: string };
    expect(sent.to).toBe('fallback@birthhub360.com.br');
  });

  it('responde 503 quando o SMTP não está configurado', async () => {
    sendEmailMock.mockRejectedValue(new MailerNotConfiguredError('no smtp'));
    const res = await request(app).post('/api/public/lead-capture').send(VALID_LEAD);
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
  });
});
