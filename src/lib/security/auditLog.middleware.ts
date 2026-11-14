import type { NextFunction, Request, Response } from 'express';
import type { AuthRequest } from '../../shared/middlewares/authenticateToken.js';
import { requestContext } from '../async-context.js';
import { AuditService, type AuditAction } from '../audit/audit.service.js';

/**
 * Middleware Express para trilha de auditoria genérica por rota (AuditLog).
 *
 * Montado nas rotas sensíveis (DEM-20261114-003, follow-up Onda 2): exports de
 * analytics/commercial-intelligence/leads/Bitrix e GETs de detalhe de Company/Contact
 * (acesso a PII). `action` explícito cobre endpoints POST de exportação, que o
 * mapeamento por método rotularia como UPDATE.
 */
export function auditAccessMiddleware(entity: string, action?: AuditAction) {
  return (req: Request, res: Response, next: NextFunction) => {
    const actorId = (req as AuthRequest).user?.id || 'anonymous';
    // tenantId vem exclusivamente do usuário autenticado — nunca de um header controlado pelo
    // cliente. Um fallback para `x-organization-id` faria o próprio log de auditoria mentir
    // sobre de qual tenant é o acesso registrado (e, pior, mascararia um acesso indevido como
    // se fosse legítimo daquele tenant forjado).
    const tenantId = (req as AuthRequest).user?.organizationId;
    const ipAddress = req.ip || req.socket.remoteAddress;
    // entityId: primeiro parâmetro de rota presente (ex.: /companies/:id → id da empresa),
    // para que o detalhe auditado aponte o registro acessado e não só a entidade.
    const routeEntityId = Object.values(req.params)[0];

    // Ao finalizar a requisição, gravamos o log de auditoria. AuditLog tem FORCE ROW LEVEL
    // SECURITY (WITH CHECK exige app.current_tenant_id = tenantId, sem bypass — ver migration
    // 20260825120000_scope_rls_bypass_to_bootstrap_allowlist) — a extensão Prisma que seta essa
    // variável de sessão lê `requestContext.getStore()` (AsyncLocalStorage). O INSERT roda dentro
    // do callback de `res.on('finish')`, disparado depois que o resto da cadeia de middlewares já
    // retornou — reabre o contexto explicitamente aqui em vez de depender de propagação implícita
    // através do listener do EventEmitter, para o INSERT nunca rodar sem tenantId setado.
    res.on('finish', () => {
      if (res.statusCode < 400) {
        requestContext.run({ tenantId }, () => {
          AuditService.log({
            action:
              action ??
              (req.method === 'GET'
                ? 'EXPORT'
                : req.method === 'DELETE'
                  ? 'DELETE'
                  : 'UPDATE'),
            entity,
            entityId: typeof routeEntityId === 'string' ? routeEntityId : undefined,
            actorId,
            tenantId,
            ipAddress,
            device: req.headers['user-agent'],
          }).catch(() => {});
        });
      }
    });

    next();
  };
}
