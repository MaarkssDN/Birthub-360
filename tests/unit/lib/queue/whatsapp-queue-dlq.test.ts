import { type Job, UnrecoverableError } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../../src/shared/middlewares/errorHandler.js';

const {
  mockSendWhatsAppMessage,
  mockInitWhatsApp,
  mockLogoutWhatsApp,
  mockRecordDeadLetter,
  mockEnqueueWhatsAppDlq,
  mockRecordQueueDlqMessage,
  mockRecordQueueJobCompleted,
} = vi.hoisted(() => ({
  mockSendWhatsAppMessage: vi.fn(),
  mockInitWhatsApp: vi.fn(),
  mockLogoutWhatsApp: vi.fn(),
  mockRecordDeadLetter: vi.fn(),
  mockEnqueueWhatsAppDlq: vi.fn(),
  mockRecordQueueDlqMessage: vi.fn(),
  mockRecordQueueJobCompleted: vi.fn(),
}));

vi.mock('../../../../src/features/integrations/whatsapp/whatsapp.service.js', () => ({
  sendWhatsAppMessage: mockSendWhatsAppMessage,
  initWhatsApp: mockInitWhatsApp,
  logoutWhatsApp: mockLogoutWhatsApp,
}));

vi.mock('../../../../src/lib/queue/deadLetter.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../src/lib/queue/deadLetter.js')>();
  return {
    ...actual,
    recordDeadLetter: mockRecordDeadLetter,
  };
});

vi.mock('../../../../src/lib/queue/whatsappCommand.queue.js', () => ({
  WHATSAPP_COMMAND_QUEUE_NAME: 'whatsapp-command',
  WHATSAPP_DLQ_QUEUE_NAME: 'whatsapp-messages-dlq',
  enqueueWhatsAppDlq: mockEnqueueWhatsAppDlq,
}));

vi.mock('../../../../src/lib/queue/metrics.js', () => ({
  registerQueueForMetrics: vi.fn(),
  recordQueueDlqMessage: mockRecordQueueDlqMessage,
  recordQueueJobCompleted: mockRecordQueueJobCompleted,
}));

vi.mock('../../../../src/lib/queue/redis.js', () => ({
  connection: {},
  queuesEnabled: false,
}));

import {
  handleWhatsAppJobFailure,
  isPermanentWhatsAppError,
  processWhatsAppCommandJob,
} from '../../../../src/lib/queue/whatsappCommand.worker.js';
import type { WhatsAppCommand } from '../../../../src/lib/queue/whatsappCommand.queue.js';

function makeSendJob(overrides: Partial<Job<WhatsAppCommand>> = {}): Job<WhatsAppCommand> {
  return {
    id: 'job-wa-1',
    name: 'send',
    attemptsMade: 1,
    opts: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
    data: {
      type: 'send',
      organizationId: 'org-1',
      correlationId: 'corr-1',
      number: '5511999999999',
      text: 'Olá!',
    },
    ...overrides,
  } as unknown as Job<WhatsAppCommand>;
}

describe('WhatsApp Command Worker — Dead Letter Queue & Error Classification (B-11)', () => {
  beforeEach(() => {
    mockSendWhatsAppMessage.mockReset();
    mockInitWhatsApp.mockReset();
    mockLogoutWhatsApp.mockReset();
    mockRecordDeadLetter.mockReset().mockResolvedValue(undefined);
    mockEnqueueWhatsAppDlq.mockReset().mockResolvedValue(undefined);
    mockRecordQueueDlqMessage.mockReset();
    mockRecordQueueJobCompleted.mockReset();
  });

  it('classifies HTTP 400/404/422 and unregistered numbers as permanent errors', () => {
    expect(
      isPermanentWhatsAppError(
        new AppError('O número fornecido não está registrado no WhatsApp.', 422),
      ),
    ).toBe(true);
    expect(isPermanentWhatsAppError(new AppError('Bad request', 400))).toBe(true);
    expect(isPermanentWhatsAppError(new AppError('Not found', 404))).toBe(true);
    expect(
      isPermanentWhatsAppError(
        new Error('Destinatário optou por não receber mensagens (opt-out registrado).'),
      ),
    ).toBe(true);
    expect(isPermanentWhatsAppError(new UnrecoverableError('permanent'))).toBe(true);
  });

  it('classifies HTTP 502/503/409 and network timeouts as transient errors', () => {
    expect(
      isPermanentWhatsAppError(
        new AppError(
          'Não foi possível enviar a mensagem agora (timeout ou falha de conexão).',
          502,
        ),
      ),
    ).toBe(false);
    expect(isPermanentWhatsAppError(new AppError('WhatsApp não está conectado.', 409))).toBe(false);
    expect(isPermanentWhatsAppError(new Error('ETIMEDOUT'))).toBe(false);
  });

  it('wraps permanent errors into BullMQ UnrecoverableError and moves immediately to DLQ on attempt 1', async () => {
    mockSendWhatsAppMessage.mockRejectedValueOnce(
      new AppError('O número fornecido não está registrado no WhatsApp.', 422),
    );

    const job = makeSendJob({ attemptsMade: 1 });

    let caughtError: Error | undefined;
    try {
      await processWhatsAppCommandJob(job);
    } catch (err) {
      caughtError = err as Error;
    }

    expect(caughtError).toBeInstanceOf(UnrecoverableError);

    await handleWhatsAppJobFailure(job, caughtError!);

    expect(mockRecordQueueDlqMessage).toHaveBeenCalledWith('whatsapp-command', 'permanent');
    expect(mockRecordDeadLetter).toHaveBeenCalledTimes(1);
    expect(mockEnqueueWhatsAppDlq).toHaveBeenCalledWith(
      expect.objectContaining({
        originalJobId: 'job-wa-1',
        organizationId: 'org-1',
        reason: 'permanent',
        attemptsMade: 1,
      }),
    );
  });

  it('allows transient errors to retry up to 3 attempts and moves to DLQ only after final attempt', async () => {
    const transientErr = new AppError(
      'Não foi possível enviar a mensagem agora (timeout ou falha de conexão).',
      502,
    );
    mockSendWhatsAppMessage.mockRejectedValue(transientErr);

    // Tentativa 1 falha com erro transiente: NÃO deve ir para DLQ ainda
    const jobAttempt1 = makeSendJob({ attemptsMade: 1 });
    await expect(processWhatsAppCommandJob(jobAttempt1)).rejects.toThrow(AppError);
    await handleWhatsAppJobFailure(jobAttempt1, transientErr);
    expect(mockRecordDeadLetter).not.toHaveBeenCalled();
    expect(mockEnqueueWhatsAppDlq).not.toHaveBeenCalled();

    // Tentativa 2 falha com erro transiente: NÃO deve ir para DLQ ainda
    const jobAttempt2 = makeSendJob({ attemptsMade: 2 });
    await handleWhatsAppJobFailure(jobAttempt2, transientErr);
    expect(mockRecordDeadLetter).not.toHaveBeenCalled();
    expect(mockEnqueueWhatsAppDlq).not.toHaveBeenCalled();

    // Tentativa 3 (final) esgota retries: move para DLQ com reason = max_retries_exceeded
    const jobAttempt3 = makeSendJob({ attemptsMade: 3 });
    await handleWhatsAppJobFailure(jobAttempt3, transientErr);

    expect(mockRecordQueueDlqMessage).toHaveBeenCalledWith(
      'whatsapp-command',
      'max_retries_exceeded',
    );
    expect(mockRecordDeadLetter).toHaveBeenCalledTimes(1);
    expect(mockEnqueueWhatsAppDlq).toHaveBeenCalledWith(
      expect.objectContaining({
        originalJobId: 'job-wa-1',
        organizationId: 'org-1',
        reason: 'max_retries_exceeded',
        attemptsMade: 3,
      }),
    );
  });
});
