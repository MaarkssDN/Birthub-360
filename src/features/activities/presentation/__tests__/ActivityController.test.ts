import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { ActivityUseCases } from '../../application/ActivityUseCases.js';
import { ActivityController } from '../ActivityController.js';

/**
 * `GET /api/activities/feed.ics?owner=` aceitava qualquer string e devolvia a agenda do
 * colega — IDOR de leitura dentro do tenant (achado do handoff
 * `.agents/handoffs/onda-3/45-para-04-atividades-agenda-bugs.md`, item 4). Estes testes
 * travam a regra: sem owner → próprio usuário; owner de terceiro → só ADMIN/GESTOR.
 */

function buildResponse() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  return res;
}

function buildRequest(user: Record<string, unknown>, query: Record<string, string> = {}) {
  return {
    user: { organizationId: 'org-1', id: 'user-1', email: 'vendedor@empresa.com', ...user },
    query,
  } as unknown as Request;
}

function buildController() {
  const useCases = {
    generateIcalFeed: vi.fn().mockResolvedValue('BEGIN:VCALENDAR\r\nEND:VCALENDAR'),
  } as unknown as ActivityUseCases;
  return { controller: new ActivityController(useCases), useCases };
}

const next: NextFunction = vi.fn();

describe('ActivityController.getIcalFeed — owner arbitrário', () => {
  it('sem ?owner= exporta a agenda do próprio usuário (userName da sessão)', async () => {
    const { controller, useCases } = buildController();
    const res = buildResponse();
    await controller.getIcalFeed(buildRequest({ role: 'SDR', name: 'Maria Vendedora' }), res, next);
    expect(useCases.generateIcalFeed).toHaveBeenCalledWith('org-1', 'Maria Vendedora');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/calendar; charset=utf-8');
    expect(res.send).toHaveBeenCalled();
  });

  it('?owner= igual ao próprio nome do usuário é permitido', async () => {
    const { controller, useCases } = buildController();
    const res = buildResponse();
    await controller.getIcalFeed(
      buildRequest({ role: 'SDR', name: 'Maria Vendedora' }, { owner: '  maria vendedora ' }),
      res,
      next,
    );
    expect(useCases.generateIcalFeed).toHaveBeenCalledWith('org-1', 'maria vendedora');
    expect(res.status).not.toHaveBeenCalledWith(403);
  });

  it('?owner= de colega é recusado para papel operacional (SDR/CLOSER)', async () => {
    const { controller, useCases } = buildController();
    const res = buildResponse();
    await controller.getIcalFeed(
      buildRequest({ role: 'SDR', name: 'Maria Vendedora' }, { owner: 'João Colega' }),
      res,
      next,
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(useCases.generateIcalFeed).not.toHaveBeenCalled();
  });

  it('?owner= de colega é permitido para ADMIN (exportação de equipe)', async () => {
    const { controller, useCases } = buildController();
    const res = buildResponse();
    await controller.getIcalFeed(
      buildRequest({ role: 'ADMIN', name: 'Maria Vendedora' }, { owner: 'João Colega' }),
      res,
      next,
    );
    expect(useCases.generateIcalFeed).toHaveBeenCalledWith('org-1', 'João Colega');
  });

  it('?owner= igual ao e-mail da sessão também conta como self', async () => {
    const { controller, useCases } = buildController();
    const res = buildResponse();
    await controller.getIcalFeed(
      buildRequest({ role: 'CLOSER' }, { owner: 'Vendedor@Empresa.com' }),
      res,
      next,
    );
    // sem name na sessão, userName cai para o e-mail — self por e-mail.
    expect(useCases.generateIcalFeed).toHaveBeenCalledWith('org-1', 'Vendedor@Empresa.com');
    expect(res.status).not.toHaveBeenCalledWith(403);
  });
});
