/**
 * F4 (PR #243 / TAREFA de saneamento): o handler `getBitrixSyncHealth` do
 * CommercialIntelligenceController não tinha nenhum teste — era o maior bloco de
 * código novo sem cobertura apontado pelo Sonar (endpoint dedicado
 * `GET /api/commercial-intelligence/bitrix-sync-health`). Cobre sucesso e falha
 * (erro propagado via `next`, mesmo padrão dos demais handlers do controller).
 */
import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { AuthRequest } from '../../../shared/middlewares/authenticateToken.js';
import type { CommercialIntelligenceUseCases } from '../application/CommercialIntelligenceUseCases.js';
import type { CommercialIntelligenceAiService } from '../infra/CommercialIntelligenceAiService.js';
import { CommercialIntelligenceController } from '../presentation/CommercialIntelligenceController.js';

function makeRes() {
  const json = vi.fn();
  return { res: { json } as unknown as Response, json };
}

describe('CommercialIntelligenceController — getBitrixSyncHealth (F4)', () => {
  it('sucesso: delega ao use case com o organizationId do usuário e responde {success,data}', async () => {
    const health = {
      connected: true,
      totalOpen: 10,
      linked: 8,
      notLinked: 2,
      failed: 1,
      linkedRate: 80,
      lastSyncAt: null,
      syncedCount30d: 5,
      failedCount30d: 1,
    };
    const bitrixSyncHealth = vi.fn().mockResolvedValue(health);
    const controller = new CommercialIntelligenceController(
      { bitrixSyncHealth } as unknown as CommercialIntelligenceUseCases,
      {} as CommercialIntelligenceAiService,
    );

    const req = {
      user: { organizationId: 'org-42' },
      query: {},
    } as unknown as Request;
    const { res, json } = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await controller.getBitrixSyncHealth(req, res, next);

    // Sem filtro comercial — saúde de sincronização é operacional (assinatura só
    // recebe organizationId; `now` tem default interno no use case).
    expect(bitrixSyncHealth).toHaveBeenCalledTimes(1);
    expect(bitrixSyncHealth).toHaveBeenCalledWith('org-42');
    expect(json).toHaveBeenCalledWith({ success: true, data: health });
    expect(next).not.toHaveBeenCalled();
  });

  it('falha: erro do use case é propagado via next(error) — nunca engolido', async () => {
    const failure = new Error('bitrix sync health query failed');
    const controller = new CommercialIntelligenceController(
      {
        bitrixSyncHealth: vi.fn().mockRejectedValue(failure),
      } as unknown as CommercialIntelligenceUseCases,
      {} as CommercialIntelligenceAiService,
    );

    const req = {
      user: { organizationId: 'org-42' },
      query: {},
    } as unknown as AuthRequest as unknown as Request;
    const { res, json } = makeRes();
    const next = vi.fn();

    await controller.getBitrixSyncHealth(req, res, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledWith(failure);
    expect(json).not.toHaveBeenCalled();
  });
});
