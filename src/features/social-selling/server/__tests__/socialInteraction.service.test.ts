import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * RN-SOC-02 / AC-SOC-002 (MOD-11): vínculo de 1 clique da interação social à timeline do Lead.
 * Cobre: gravação do TimelineEvent com type 'social_selling', trava de tenancy (lead de outro
 * tenant nunca recebe evento), defaults de kind/channel, e o rate limit anti-rajada por
 * organização (RN-SOC-03 / RECONST-028 — bloqueio de "disparos predatórios" enquanto não existe
 * envio real a plataforma, ver socialRateLimit.ts).
 */

const leadFindFirstMock = vi.fn();
const timelineEventCreateMock = vi.fn();
vi.mock('../../../../lib/prisma.js', () => ({
  prisma: {
    lead: {
      findFirst: (...args: unknown[]) => leadFindFirstMock(...args),
    },
    timelineEvent: {
      create: (...args: unknown[]) => timelineEventCreateMock(...args),
    },
  },
}));

vi.mock('../../../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { AppError } from '../../../../shared/middlewares/errorHandler.js';
import { SocialInteractionService } from '../socialInteraction.service.js';
import { resetSocialSellingRateLimitersForTests } from '../socialRateLimit.js';

const service = new SocialInteractionService();

beforeEach(() => {
  leadFindFirstMock.mockReset();
  timelineEventCreateMock.mockReset();
  resetSocialSellingRateLimitersForTests();
  leadFindFirstMock.mockResolvedValue({ id: 'lead-1' });
  timelineEventCreateMock.mockResolvedValue({ id: 'evt-1' });
});

describe('SocialInteractionService.recordInteraction — timeline do CRM (RN-SOC-02)', () => {
  it('grava TimelineEvent type social_selling vinculado ao lead da organização', async () => {
    const result = await service.recordInteraction('org-1', {
      leadId: 'lead-1',
      kind: 'approach_sent',
      channel: 'linkedin',
      summary: 'Abordagem sobre previsibilidade de receita',
    });

    expect(leadFindFirstMock).toHaveBeenCalledWith({
      where: { id: 'lead-1', organizationId: 'org-1' },
      select: { id: true },
    });
    expect(timelineEventCreateMock).toHaveBeenCalledWith({
      data: {
        type: 'social_selling',
        description:
          'Abordagem social enviada via linkedin: Abordagem sobre previsibilidade de receita',
        leadId: 'lead-1',
      },
      select: { id: true },
    });
    expect(result).toEqual({
      timelineEventId: 'evt-1',
      leadId: 'lead-1',
      kind: 'approach_sent',
      channel: 'linkedin',
    });
  });

  it('lead de outra organização (ou inexistente) → 404 e NENHUM evento gravado (trava de tenancy)', async () => {
    leadFindFirstMock.mockResolvedValue(null);

    const error = await service
      .recordInteraction('org-1', { leadId: 'lead-de-outro-tenant' })
      .catch((e) => e);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).statusCode).toBe(404);
    expect(timelineEventCreateMock).not.toHaveBeenCalled();
  });

  it('leadId ausente → 400 antes de tocar no banco', async () => {
    const error = await service.recordInteraction('org-1', { leadId: '   ' }).catch((e) => e);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).statusCode).toBe(400);
    expect(leadFindFirstMock).not.toHaveBeenCalled();
    expect(timelineEventCreateMock).not.toHaveBeenCalled();
  });

  it('aplica defaults: kind=approach_sent e channel=linkedin quando omitidos', async () => {
    const result = await service.recordInteraction('org-1', { leadId: 'lead-1' });

    expect(result.kind).toBe('approach_sent');
    expect(result.channel).toBe('linkedin');
    expect(timelineEventCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: 'Abordagem social enviada via linkedin',
        }),
      }),
    );
  });

  it('kind interaction_received gera descrição de interação recebida', async () => {
    await service.recordInteraction('org-1', {
      leadId: 'lead-1',
      kind: 'interaction_received',
      channel: 'whatsapp',
      summary: 'Lead comentou no post',
    });

    expect(timelineEventCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: 'Interação social recebida via whatsapp: Lead comentou no post',
        }),
      }),
    );
  });

  it('rate limit por organização: após o teto por hora, novas interações → 429 sem gravar', async () => {
    // Default: 20 interações/hora por organização (socialRateLimit.ts).
    for (let i = 0; i < 20; i++) {
      await service.recordInteraction('org-limitada', { leadId: 'lead-1' });
    }
    expect(timelineEventCreateMock).toHaveBeenCalledTimes(20);

    const error = await service
      .recordInteraction('org-limitada', { leadId: 'lead-1' })
      .catch((e) => e);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).statusCode).toBe(429);
    // A chamada bloqueada não tocou no banco.
    expect(leadFindFirstMock).toHaveBeenCalledTimes(20);
    expect(timelineEventCreateMock).toHaveBeenCalledTimes(20);
  });

  it('rate limit é por organização — estourar uma não afeta a outra', async () => {
    for (let i = 0; i < 20; i++) {
      await service.recordInteraction('org-a', { leadId: 'lead-1' });
    }
    await expect(service.recordInteraction('org-a', { leadId: 'lead-1' })).rejects.toMatchObject({
      statusCode: 429,
    });
    await expect(service.recordInteraction('org-b', { leadId: 'lead-1' })).resolves.toMatchObject({
      timelineEventId: 'evt-1',
    });
  });
});
