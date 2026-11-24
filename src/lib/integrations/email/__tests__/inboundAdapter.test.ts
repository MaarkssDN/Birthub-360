import { describe, expect, it } from 'vitest';
import { buildInboundEmailPayload, toInboundEmailReply } from '../inboundAdapter.js';
import { parseRawEmail } from '../rawEmailParser.js';

const OPTS = { organizationId: 'org-1', toEmail: 'vendas@empresa.com' };

describe('buildInboundEmailPayload', () => {
  it('converte mensagem parseada completa no payload do webhook', () => {
    const parsed = parseRawEmail(
      [
        'From: Lead Teste <lead@exemplo.com>',
        'To: vendas@empresa.com',
        'Subject: Re: proposta',
        'Message-ID: <reply-9@mail.exemplo.com>',
        'In-Reply-To: <out-9@smtp.exemplo.com>',
        'Date: Mon, 23 Nov 2026 11:00:00 -0300',
        'Auto-Submitted: no',
        '',
        'Pode me ligar amanhã?',
      ].join('\r\n'),
    );

    const payload = buildInboundEmailPayload(parsed, OPTS);
    expect(payload).not.toBeNull();
    expect(payload!.organizationId).toBe('org-1');
    expect(payload!.providerMessageId).toBe('reply-9@mail.exemplo.com');
    expect(payload!.inReplyTo).toBe('out-9@smtp.exemplo.com');
    expect(payload!.fromEmail).toBe('lead@exemplo.com');
    expect(payload!.toEmail).toBe('vendas@empresa.com');
    expect(payload!.subject).toBe('Re: proposta');
    expect(payload!.body).toContain('ligar amanhã');
    expect(payload!.autoSubmittedHeader).toBe('no');
    expect(payload!.receivedAt).toBeInstanceOf(Date);
  });

  it('deriva providerMessageId determinístico quando Message-ID falta', () => {
    const raw = 'From: a@b.com\r\nTo: v@e.com\r\nSubject: sem id\r\n\r\ncorpo estável';
    const p1 = buildInboundEmailPayload(parseRawEmail(raw), OPTS)!;
    const p2 = buildInboundEmailPayload(parseRawEmail(raw), OPTS)!;
    expect(p1.providerMessageId).toMatch(/^mime-[0-9a-f]{32}$/);
    expect(p1.providerMessageId).toBe(p2.providerMessageId); // dedup estável
  });

  it('providerMessageId explícito vence Message-ID (ex.: mailbox:uid do IMAP)', () => {
    const parsed = parseRawEmail('From: a@b.com\r\nMessage-ID: <x@y>\r\n\r\ncorpo');
    const payload = buildInboundEmailPayload(parsed, {
      ...OPTS,
      providerMessageId: 'INBOX:4321:777',
    })!;
    expect(payload.providerMessageId).toBe('INBOX:4321:777');
  });

  it('devolve null sem fromEmail válido ou sem org/destino', () => {
    const semFrom = parseRawEmail('To: v@e.com\r\n\r\ncorpo');
    expect(buildInboundEmailPayload(semFrom, OPTS)).toBeNull();

    const ok = parseRawEmail('From: a@b.com\r\n\r\ncorpo');
    expect(buildInboundEmailPayload(ok, { organizationId: ' ', toEmail: 'v@e.com' })).toBeNull();
    expect(buildInboundEmailPayload(ok, { organizationId: 'o', toEmail: '' })).toBeNull();
  });

  it('propaga senderAuth do parser para o payload', () => {
    const parsed = parseRawEmail(
      'From: a@b.com\r\nAuthentication-Results: mx; spf=fail; dkim=pass; dmarc=fail\r\n\r\ncorpo',
    );
    const payload = buildInboundEmailPayload(parsed, OPTS)!;
    expect(payload.senderAuth?.spf).toBe('fail');
    expect(payload.senderAuth?.dmarc).toBe('fail');
  });
});

describe('toInboundEmailReply', () => {
  it('monta o tipo de domínio consumido por handleEmailReply/recordInboundEmail', () => {
    const payload = buildInboundEmailPayload(
      parseRawEmail('From: a@b.com\r\nSubject: oi\r\n\r\nquero resposta'),
      OPTS,
    )!;
    const reply = toInboundEmailReply(payload, 'lead-1');
    expect(reply.organizationId).toBe('org-1');
    expect(reply.leadId).toBe('lead-1');
    expect(reply.providerMessageId).toBeTruthy();
    expect(reply.fromEmail).toBe('a@b.com');
    expect(reply.receivedAt).toBeInstanceOf(Date);
  });
});
