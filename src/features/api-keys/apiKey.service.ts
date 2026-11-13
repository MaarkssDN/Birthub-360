// src/features/api-keys/apiKey.service.ts
//
// Gestão de API Keys de tenant (DEM-20261113-002 / MEL-07).
// A chave bruta (`bhk_...`) é mostrada UMA vez na criação; no banco fica só o
// hash SHA-256. Escopos são strings livres (`crm:read`, `export`, ...) —
// a verificação por escopo é feita no middleware que consumir a chave.

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

const KEY_PREFIX = 'bhk_';
const KEY_BYTES = 32;

export interface ApiKeyPublic {
  id: string;
  name: string;
  scopes: string[];
  createdAt: Date;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}

function hashKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function parseScopes(scopes: unknown): string[] {
  return Array.isArray(scopes) ? scopes.filter((s): s is string => typeof s === 'string') : [];
}

export async function createApiKey(input: {
  organizationId: string;
  createdByUserId: string;
  name: string;
  scopes: string[];
  expiresInDays?: number | null;
}): Promise<{ key: ApiKeyPublic; rawKey: string }> {
  const rawKey = `${KEY_PREFIX}${randomBytes(KEY_BYTES).toString('base64url')}`;
  const expiresAt =
    input.expiresInDays && input.expiresInDays > 0
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
      : null;
  const row = await prisma.aPIKey.create({
    data: {
      organizationId: input.organizationId,
      keyHash: hashKey(rawKey),
      name: input.name,
      scopes: input.scopes,
      createdByUserId: input.createdByUserId,
      expiresAt,
    },
  });
  return {
    rawKey,
    key: {
      id: row.id,
      name: row.name,
      scopes: parseScopes(row.scopes),
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      lastUsedAt: row.lastUsedAt,
      revokedAt: row.revokedAt,
    },
  };
}

export async function listApiKeys(organizationId: string): Promise<ApiKeyPublic[]> {
  const rows = await prisma.aPIKey.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    scopes: parseScopes(row.scopes),
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    lastUsedAt: row.lastUsedAt,
    revokedAt: row.revokedAt,
  }));
}

export async function revokeApiKey(organizationId: string, id: string): Promise<boolean> {
  const result = await prisma.aPIKey.updateMany({
    where: { id, organizationId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count > 0;
}

export interface VerifiedApiKey {
  id: string;
  organizationId: string;
  scopes: string[];
}

/**
 * Verifica uma chave bruta. Retorna null para chave inexistente, revogada ou
 * expirada — nunca distingue o motivo para o cliente (anti-enumeração).
 */
export async function verifyApiKey(rawKey: string): Promise<VerifiedApiKey | null> {
  if (!rawKey.startsWith(KEY_PREFIX)) return null;
  const digest = hashKey(rawKey);
  const row = await prisma.aPIKey.findUnique({ where: { keyHash: digest } });
  if (!row || row.revokedAt) return null;
  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) return null;

  // lastUsedAt é telemetria, não pode derrubar a autenticação — update
  // fire-and-forget com throttle simples (só grava se >5min desde a última).
  const stale =
    !row.lastUsedAt || Date.now() - row.lastUsedAt.getTime() > 5 * 60 * 1000;
  if (stale) {
    prisma.aPIKey
      .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);
  }

  return {
    id: row.id,
    organizationId: row.organizationId,
    scopes: parseScopes(row.scopes),
  };
}

export function apiKeyMatchesScope(key: VerifiedApiKey, scope: string): boolean {
  // Escopo '*' ou lista vazia = acesso total (compatível com chaves legadas).
  return key.scopes.length === 0 || key.scopes.includes('*') || key.scopes.includes(scope);
}

/** Comparação em tempo constante para usos que precisem revalidar hash. */
export function safeHashEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
