import type { AuditLog, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma.js';

// Adaptado ao model canônico `AuditLog` (handoff
// .agents/handoffs/01-para-12-voicehub-adaptacao-modelos-canonicos.md — Agente 01, Estratégia 1):
// o schema real usa `tenantId` (NOT NULL), `actorId`, `entity` (obrigatório), `entityId`,
// `ipAddress` e `details` como TEXTO (não Json). O voice-hub continua emitindo suas ações de
// domínio (`USER_LOGIN`, `CALL_LOG_CREATE`, ...) via `writeAuditLog(organizationId, userId,
// action, details)` — o mapeamento acontece aqui:
//   tenantId  ← organizationId da sessão (nunca de input do cliente)
//   actorId   ← userId da sessão
//   entity    ← 'voice-hub' (agrupador estável; a ação específica fica em `action`)
//   details   ← JSON.stringify(details) — details canônico é String?, não Json
//   entityId  ← details.entityId quando o caller o fornece explicitamente, senão null
// Uma linha sem `organizationId` NÃO pode ser gravada (tenantId é NOT NULL e RLS é
// fail-closed) — createAuditLog rejeita em vez de fabricar um tenant.

const VOICE_HUB_ENTITY = 'voice-hub';

export function createAuditLog(data: {
  organizationId?: string;
  userId?: string | null;
  action: string;
  details?: unknown;
}) {
  if (!data.organizationId) {
    // Fail closed: AuditLog.tenantId é NOT NULL e a policy de RLS negaria a escrita de qualquer
    // forma — falhar aqui com erro explícito é mais honesto que uma exceção de constraint no banco.
    return Promise.reject(
      new Error('createAuditLog: organizationId é obrigatório (AuditLog.tenantId NOT NULL).'),
    );
  }

  const detailsObj =
    data.details && typeof data.details === 'object' && !Array.isArray(data.details)
      ? (data.details as Record<string, unknown>)
      : null;
  const entityId = typeof detailsObj?.entityId === 'string' ? detailsObj.entityId : null;

  return prisma.auditLog.create({
    data: {
      tenantId: data.organizationId,
      actorId: data.userId ?? null,
      entity: VOICE_HUB_ENTITY,
      entityId,
      action: data.action,
      details: data.details === undefined ? null : JSON.stringify(data.details),
    },
  });
}

export interface AuditLogListItem {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  /** details persistido como texto JSON; parseado de volta para objeto quando possível. */
  details: unknown;
  timestamp: Date;
}

// details é String? no model canônico — tenta JSON.parse para devolver o objeto original que o
// caller gravou; se não for JSON válido, devolve a string crua (nunca fabrica um objeto).
function parseDetails(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

// Tenant-scoped, paginated read of the audit trail. Resolves
// .agents/handoffs/onda-2/02-para-01-audit-log-listagem.md — writeAuditLog() already persists
// real events (USER_CREATE_BY_ADMIN, USER_LOGIN, CALL_LOG_CREATE, ...); this is the first read
// path for them. `organizationId` must come from the authenticated session (requireTenant), never from
// client input, same rule as every other tenant-scoped query in this codebase.
//
// `AuditLog` não tem relação `user` no schema canônico (actorId é string simples) — o e-mail do
// ator é resolvido numa segunda query por lista de ids, dentro do MESMO tenant das linhas lidas
// (um actorId de outra organização simplesmente não resolve e vira actorEmail null — fail closed).
export async function listAuditLogsForTenant(
  organizationId: string,
  { page, pageSize }: { page: number; pageSize: number },
): Promise<{ items: AuditLogListItem[]; total: number }> {
  const skip = (page - 1) * pageSize;
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { tenantId: organizationId },
      orderBy: { timestamp: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where: { tenantId: organizationId } }),
  ]);

  const actorIds = [...new Set(rows.map((r) => r.actorId).filter((id): id is string => !!id))];
  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds }, organizationId },
        select: { id: true, email: true },
      })
    : [];
  const emailById = new Map(actors.map((u) => [u.id, u.email]));

  const items: AuditLogListItem[] = rows.map((row: AuditLog) => ({
    id: row.id,
    actorId: row.actorId,
    actorEmail: row.actorId ? (emailById.get(row.actorId) ?? null) : null,
    action: row.action,
    entity: row.entity,
    entityId: row.entityId,
    details: parseDetails(row.details),
    timestamp: row.timestamp,
  }));

  return { items, total };
}
