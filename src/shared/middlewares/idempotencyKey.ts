import { createHash } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { AuthRequest } from './authenticateToken.js';

/**
 * idempotencyKey.ts — deduplicação de mutações HTTP por `X-Idempotency-Key`.
 *
 * Contrato (MISSÃO POS4-22-IDEM, outbox mobile do Agente 85):
 * - Header `X-Idempotency-Key: <string não-vazia, ≤ 255 chars>` em métodos mutantes
 *   (POST/PUT/PATCH/DELETE). Sem header → comportamento atual preservado (backward compat).
 * - A chave é namespaced por `organizationId` do usuário autenticado: a mesma key em orgs
 *   diferentes nunca colide nem é comparada (isolamento multi-tenant).
 * - Mesma key + mesmo payload (método + path + body) → replay da resposta 2xx original
 *   com header `X-Idempotent-Replay: true` — efeito único garantido.
 * - Mesma key + payload diferente → 409 `IDEMPOTENCY_KEY_CONFLICT` (o cliente deve gerar
 *   uma nova key para uma nova intenção de mutação).
 * - Somente respostas 2xx são registradas: uma primeira tentativa que falhou (4xx/5xx)
 *   não "gasta" a key — retry com payload corrigido e mesma key é permitido.
 *
 * LIMITAÇÃO DOCUMENTADA (primeira iteração): o store é em memória por processo, com TTL de
 * 24h e teto de entradas. Não sobrevive a restart nem deduplica entre réplicas. Persistência
 * real (tabela com UNIQUE (organizationId, idempotencyKey)) é handoff para o Agente 01
 * (schema) — ver `.agents/handoffs/pos4/22-para-01-api-idem-schema.md`.
 */

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const TTL_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_KEY_LENGTH = 255;
const MAX_ENTRIES = 10_000;
const SWEEP_INTERVAL_MS = 60 * 60 * 1000; // 1h

interface CachedResponse {
  payloadHash: string;
  statusCode: number;
  body: unknown;
  expiresAt: number;
}

const store = new Map<string, CachedResponse>();

function storeKey(organizationId: string, idempotencyKey: string): string {
  return `${organizationId}${idempotencyKey}`;
}

/** Serialização estável (chaves de objeto ordenadas) para hash determinístico do payload. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'undefined';
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const entries = Object.keys(value as Record<string, unknown>)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`);
  return `{${entries.join(',')}}`;
}

function payloadHash(req: Request): string {
  return createHash('sha256')
    .update(`${req.method} ${req.originalUrl}\n${stableStringify(req.body)}`)
    .digest('hex');
}

function sweepExpired(now: number): void {
  for (const [k, v] of store) {
    if (v.expiresAt <= now) store.delete(k);
  }
  // Teto de memória: Map preserva ordem de inserção — remove os mais antigos.
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

const sweepTimer = setInterval(() => sweepExpired(Date.now()), SWEEP_INTERVAL_MS);
sweepTimer.unref?.();

/** Apenas para testes — esvazia o store em memória. */
export function __resetIdempotencyStoreForTests(): void {
  store.clear();
}

export function idempotencyKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!MUTATING_METHODS.has(req.method)) {
    next();
    return;
  }

  const rawKey = req.get('x-idempotency-key');
  if (!rawKey || rawKey.trim().length === 0) {
    next();
    return;
  }
  const idempotencyKey = rawKey.trim();
  if (idempotencyKey.length > MAX_KEY_LENGTH) {
    res.status(400).json({
      success: false,
      code: 'INVALID_IDEMPOTENCY_KEY',
      error: `X-Idempotency-Key excede ${MAX_KEY_LENGTH} caracteres`,
    });
    return;
  }

  const organizationId = (req as AuthRequest).user?.organizationId;
  // Rotas autenticadas sempre têm user.organizationId (requireTenant); se não houver,
  // não há como namespacer com segurança — deixa o fluxo normal decidir (fail-open
  // preserva backward compat; a key simplesmente não deduplica).
  if (!organizationId) {
    next();
    return;
  }

  const now = Date.now();
  const key = storeKey(organizationId, idempotencyKey);
  const hash = payloadHash(req);
  const cached = store.get(key);

  if (cached) {
    if (cached.expiresAt <= now) {
      store.delete(key);
    } else if (cached.payloadHash !== hash) {
      res.status(409).json({
        success: false,
        code: 'IDEMPOTENCY_KEY_CONFLICT',
        error:
          'X-Idempotency-Key já utilizada com payload diferente nesta organização. ' +
          'Gere uma nova chave para uma nova mutação.',
      });
      return;
    } else {
      // Replay idempotente: mesma key + mesmo payload → resposta original, efeito único.
      res.set('X-Idempotent-Replay', 'true');
      res.status(cached.statusCode).json(cached.body);
      return;
    }
  }

  // Primeira execução: captura a resposta para replay futuro. Só respostas 2xx são
  // cacheadas — falhas não consomem a key.
  const originalJson = res.json.bind(res);
  res.json = ((body?: unknown) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      store.set(key, {
        payloadHash: hash,
        statusCode: res.statusCode,
        body,
        expiresAt: Date.now() + TTL_MS,
      });
      sweepExpired(Date.now());
    }
    return originalJson(body);
  }) as Response['json'];

  next();
}
