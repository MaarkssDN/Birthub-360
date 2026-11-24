import { describe, expect, it, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import {
  enforceRole,
  enforceAdminOnly,
  enforceGestorOrAbove,
  sendForbiddenResponse,
  type AuthenticatedRequest,
} from '../../../../src/lib/auth/rbac/enforcer.js';

describe('RBAC Enforcer (Bloqueadores B-01 / B-02 - Agente 97 Rocco)', () => {
  function createMocks(user?: { role: string; organizationId: string; id: string }) {
    const req = {
      user,
    } as unknown as AuthenticatedRequest;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const next = vi.fn() as NextFunction;

    return { req, res, next };
  }

  it('permite acesso quando usuário possui role ADMIN para rota enforceAdminOnly', () => {
    const { req, res, next } = createMocks({
      id: 'usr_1',
      organizationId: 'org_1',
      role: 'ADMIN',
    });

    const middleware = enforceAdminOnly();
    middleware(req as Request, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('bloqueia com 403 padronizado quando usuário SDR tenta rota enforceAdminOnly', () => {
    const { req, res, next } = createMocks({
      id: 'usr_2',
      organizationId: 'org_1',
      role: 'SDR',
    });

    const middleware = enforceAdminOnly();
    middleware(req as Request, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      code: 'FORBIDDEN',
      error: expect.stringContaining('Acesso negado'),
      requiredRoles: ['ADMIN'],
      userRole: 'SDR',
    });
  });

  it('bloqueia com 403 padronizado quando usuário VISUALIZADOR tenta rota enforceGestorOrAbove', () => {
    const { req, res, next } = createMocks({
      id: 'usr_3',
      organizationId: 'org_1',
      role: 'VISUALIZADOR',
    });

    const middleware = enforceGestorOrAbove();
    middleware(req as Request, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'FORBIDDEN',
        userRole: 'VISUALIZADOR',
      }),
    );
  });

  it('permite acesso quando usuário GESTOR acessa enforceGestorOrAbove', () => {
    const { req, res, next } = createMocks({
      id: 'usr_4',
      organizationId: 'org_1',
      role: 'GESTOR',
    });

    const middleware = enforceGestorOrAbove();
    middleware(req as Request, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('retorna 401 quando req.user não está presente', () => {
    const { req, res, next } = createMocks(undefined);

    const middleware = enforceRole(['ADMIN']);
    middleware(req as Request, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      code: 'UNAUTHORIZED',
      error: 'Autenticação necessária para acessar este recurso.',
    });
  });

  it('bloqueia papel desconhecido/não listado com 403', () => {
    const { req, res, next } = createMocks({
      id: 'usr_5',
      organizationId: 'org_1',
      role: 'UNKNOWN_ROLE',
    });

    const middleware = enforceRole(['ADMIN', 'GESTOR']);
    middleware(req as Request, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'FORBIDDEN',
        userRole: 'UNKNOWN_ROLE',
      }),
    );
  });

  // ONDA3-97-RBAC — defesa em profundidade B-01/B-02: enforceRole é export público e não pode
  // depender exclusivamente de `requireTenant` upstream para garantir escopo de tenant.
  it('nega com 403 quando req.user existe mas não tem organizationId (usuário sem vínculo de tenant)', () => {
    const { req, res, next } = createMocks({
      id: 'usr_6',
      organizationId: '',
      role: 'ADMIN',
    });

    const middleware = enforceAdminOnly();
    middleware(req as Request, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        code: 'FORBIDDEN',
      }),
    );
  });

  it('nega com 403 quando req.user.organizationId é undefined mesmo com role ADMIN', () => {
    const req = {
      user: { id: 'usr_7', role: 'ADMIN' },
    } as unknown as AuthenticatedRequest;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    const middleware = enforceAdminOnly();
    middleware(req as Request, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  // Role vazia cai no mesmo ramo de "não autenticado" (401) — fail-closed, sem next().
  it.each(['admin', 'Admin', 'ADMIN ', ' ADMIN', 'ADMIN\n', 'SUPER_ADMIN']) (
    'nega com 403 para role forjada/case-variante %j mesmo pedindo ADMIN',
    (forgedRole) => {
      const { req, res, next } = createMocks({
        id: 'usr_8',
        organizationId: 'org_1',
        role: forgedRole,
      });

      const middleware = enforceAdminOnly();
      middleware(req as Request, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    },
  );

  it('nega com 401 para role vazia mesmo pedindo ADMIN (fail-closed)', () => {
    const { req, res, next } = createMocks({
      id: 'usr_8b',
      organizationId: 'org_1',
      role: '',
    });

    const middleware = enforceAdminOnly();
    middleware(req as Request, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('nega com 403 quando allowedRoles está vazio (fail-closed: Math.min de lista vazia)', () => {
    const { req, res, next } = createMocks({
      id: 'usr_9',
      organizationId: 'org_1',
      role: 'ADMIN',
    });

    const middleware = enforceRole([]);
    middleware(req as Request, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('nega com 403 quando allowedRoles contém apenas papel desconhecido', () => {
    const { req, res, next } = createMocks({
      id: 'usr_10',
      organizationId: 'org_1',
      role: 'ADMIN',
    });

    const middleware = enforceRole(['PAPEL_INEXISTENTE' as never]);
    middleware(req as Request, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
