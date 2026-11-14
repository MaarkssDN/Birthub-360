import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CadenceRunState, CadenceTouch } from '../domain/cadence.js';
import { startCadenceRun } from '../domain/cadence.js';

/**
 * Reconciliação 2026-11 (handoff 05-para-17 / DIV-AGENTE-05-001): prova que o pipeline real de
 * despacho de cadência (`infra/dispatchers/CadenceDispatchers.ts`) renderiza os placeholders
 * `{{...}}` dos templates via `CadenceTemplateRendererService` em modo strict — antes disto os
 * placeholders iam literalmente para o lead (ou o serviço existia sem nenhum consumidor).
 */

const sendWhatsAppMessage = vi.fn();
const sendEmail = vi.fn();
const checkOptOutStatus = vi.fn();
const syncActivityToBitrix = vi.fn();

let leadRow: Record<string, unknown> | null;
let calendarEventRow: Record<string, unknown> | null;

vi.mock('../../../lib/prisma.js', () => ({
  prisma: {
    lead: {
      findFirst: vi.fn(async () => leadRow),
    },
    cadenceCalendarEvent: {
      findFirst: vi.fn(async () => calendarEventRow),
    },
    activity: { create: vi.fn(async () => ({})) },
    timelineEvent: { create: vi.fn(async () => ({})) },
  },
}));

vi.mock('../../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../../lib/email/mailer.js', () => ({
  sendEmail: (...args: unknown[]) => sendEmail(...args),
  MailerNotConfiguredError: class MailerNotConfiguredError extends Error {},
}));

vi.mock('../../integrations/whatsapp/whatsapp.service.js', () => ({
  sendWhatsAppMessage: (...args: unknown[]) => sendWhatsAppMessage(...args),
}));

vi.mock('../../integrations/bitrix/service/outboundSync.js', () => ({
  syncActivityToBitrix: (...args: unknown[]) => syncActivityToBitrix(...args),
}));

vi.mock('../../../shared/services/optOutCheck.service.js', () => ({
  checkOptOutStatus: (...args: unknown[]) => checkOptOutStatus(...args),
}));

import {
  emailCadenceDispatcher,
  whatsAppCadenceDispatcher,
} from '../infra/dispatchers/CadenceDispatchers.js';

function makeRun(): CadenceRunState {
  return startCadenceRun({
    id: 'run-1',
    organizationId: 'org-1',
    leadId: 'lead-1',
    sequenceId: 'seq-1',
    startedAt: new Date('2026-11-14T12:00:00Z'),
    createdBy: null,
  });
}

function makeTouch(templateRef: string, channel: 'whatsapp' | 'email' = 'whatsapp'): CadenceTouch {
  return { order: 1, channel, delayHoursFromPrevious: 0, templateRef };
}

describe('Pipeline real de cadência — renderização de placeholders via CadenceTemplateRendererService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkOptOutStatus.mockResolvedValue({ blocked: false, allowed: true, code: null, reason: null });
    sendWhatsAppMessage.mockResolvedValue({});
    sendEmail.mockResolvedValue({ messageId: 'msg-1' });
    syncActivityToBitrix.mockResolvedValue(undefined);
    leadRow = {
      contactId: 'contact-1',
      contact: {
        name: 'Maria Silva',
        whatsapp: '+5511999990000',
        phone: null,
        email: 'maria@acme.com',
      },
      company: { tradeName: 'Acme', legalName: 'Acme LTDA' },
    };
    calendarEventRow = null;
  });

  it('WhatsApp: renderiza {{contact_name}} e {{company_name}} antes de enviar', async () => {
    const outcome = await whatsAppCadenceDispatcher.dispatch(
      makeTouch('Olá {{contact_name}}, tudo bem? Falo da {{company_name}}.'),
      makeRun(),
    );

    expect(outcome.result).toBe('sent');
    expect(sendWhatsAppMessage).toHaveBeenCalledWith(
      'org-1',
      '+5511999990000',
      'Olá Maria Silva, tudo bem? Falo da Acme.',
      undefined,
      { leadId: 'lead-1' },
    );
  });

  it('WhatsApp: bloqueia o toque (sem chamar provedor) quando placeholder não tem valor nem fallback', async () => {
    const outcome = await whatsAppCadenceDispatcher.dispatch(
      makeTouch('Oi {{contact_name}}, sua reunião é {{meeting_time}}.'),
      makeRun(),
    );

    expect(outcome.result).toBe('failed');
    expect(outcome.error).toContain('meeting_time');
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });

  it('WhatsApp: aplica fallback | default: quando o dado do lead está ausente', async () => {
    leadRow = {
      contactId: 'contact-1',
      contact: { name: null, whatsapp: '+5511999990000', phone: null, email: null },
      company: null,
    };

    const outcome = await whatsAppCadenceDispatcher.dispatch(
      makeTouch('Olá {{contact_name | default: "Prezado(a)"}}, tudo bem?'),
      makeRun(),
    );

    expect(outcome.result).toBe('sent');
    expect(sendWhatsAppMessage).toHaveBeenCalledWith(
      'org-1',
      '+5511999990000',
      'Olá Prezado(a), tudo bem?',
      undefined,
      { leadId: 'lead-1' },
    );
  });

  it('E-mail: renderiza placeholders no assunto e no corpo antes do split subject/body', async () => {
    const outcome = await emailCadenceDispatcher.dispatch(
      makeTouch(
        'Assunto: Proposta — {{company_name}}\n\nOlá {{contact_name}}, segue a proposta.',
        'email',
      ),
      makeRun(),
    );

    expect(outcome.result).toBe('sent');
    expect(sendEmail).toHaveBeenCalledWith({
      to: 'maria@acme.com',
      // splitSubjectAndBody usa a 1ª linha verbatim como assunto (comportamento pré-existente:
      // os playbooks prefixam com "Assunto:" literal — não alterado nesta reconciliação).
      subject: 'Assunto: Proposta — Acme',
      text: 'Olá Maria Silva, segue a proposta.',
    });
  });

  it('E-mail: meeting_url/meeting_time são preenchidos a partir do CadenceCalendarEvent agendado', async () => {
    calendarEventRow = {
      meetUrl: 'https://meet.google.com/abc-defg-hij',
      scheduledStart: new Date('2026-11-15T14:30:00Z'),
    };

    const outcome = await emailCadenceDispatcher.dispatch(
      makeTouch(
        'Assunto: Confirmação\n\nOlá {{contact_name}}, nos vemos em {{meeting_time}}: {{meeting_url}}',
        'email',
      ),
      makeRun(),
    );

    expect(outcome.result).toBe('sent');
    const sent = sendEmail.mock.calls[0][0] as { subject: string; text: string };
    expect(sent.text).toContain('https://meet.google.com/abc-defg-hij');
    expect(sent.text).not.toContain('{{');
    expect(sent.text).toContain('Maria Silva');
  });
});
