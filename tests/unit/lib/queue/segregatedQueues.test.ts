import { describe, expect, it, vi } from 'vitest';
import {
  BATCH_REPORTS_QUEUE_NAME,
  CRITICAL_MAIL_QUEUE_NAME,
  enqueueBatchReport,
  enqueueCriticalMail,
} from '../../../../src/lib/queue/segregatedQueues.js';

describe('Agente 23 (Pina) - Segregação de Filas BullMQ', () => {
  it('deve possuir nomes de filas distintos e segregados para critical mail e batch reports', () => {
    expect(CRITICAL_MAIL_QUEUE_NAME).toBe('critical-mail');
    expect(BATCH_REPORTS_QUEUE_NAME).toBe('batch-reports');
    expect(CRITICAL_MAIL_QUEUE_NAME).not.toBe(BATCH_REPORTS_QUEUE_NAME);
  });

  it('deve enfileirar ou degradar graciosamente sem erros quando filas estão desabilitadas', async () => {
    const mailJobId = await enqueueCriticalMail({
      organizationId: 'org-test',
      to: 'user@example.com',
      subject: 'Redefinição de Senha',
      template: 'password-reset',
      payload: { token: 'abc-123' },
    });

    const reportJobId = await enqueueBatchReport({
      organizationId: 'org-test',
      reportType: 'csv-leads-export',
      requestedByUserId: 'usr-admin',
      parameters: { startDate: '2026-01-01' },
    });

    // Em ambiente de teste unitário sem Redis rodando localmente, ambos retornam string ou null
    expect(mailJobId === null || typeof mailJobId === 'string').toBe(true);
    expect(reportJobId === null || typeof reportJobId === 'string').toBe(true);
  });
});
