/**
 * db-assertions.ts — Agente 22 (Verificação de Realidade)
 * TAREFA-SANEAMENTO-039 / BT360-DT-0089 — asserções diretas no PostgreSQL para specs E2E.
 *
 * Problema que resolve: os specs de tests/e2e validavam apenas o DOM/resposta HTTP — um falso
 * positivo clássico é a UI (ou a rota) devolver sucesso enquanto a escrita no banco falha ou é
 * revertida. Estas helpers consultam o Postgres REAL (mesma DATABASE_URL do servidor sob teste,
 * via src/lib/prisma.ts) e permitem afirmar que a mutação persistiu de fato.
 *
 * Decisões:
 * - SQL cru via `withRlsContext` + `$queryRaw`: NÃO passa pela extensão `$allOperations` do client
 *   estendido, então enxerga `deletedAt` preenchido (o filtro de soft delete só existe no client
 *   estendido) e não sofre mutação de args. O contexto de tenant/bypass é setado via
 *   `set_config('app.bypass_rls'...)` dentro da transação, como em todo o resto do app.
 * - `requestContext.enterWith({ bypassRls: true })`: fora de produção `resolveBypassRls` honra o
 *   bypass para qualquer model (fixtures E2E manipulam múltiplos tenants legitimamente — mesmo
 *   padrão de tests/e2e/helpers.ts). Em produção o bypass é negado, então esta suíte nunca deve
 *   rodar contra produção (tests/e2e já é gated para .env.test).
 * - Identificadores (tabela/coluna) são validados por regex antes de entrar em `Prisma.raw` —
 *   sem isso, um nome dinâmico vindo de input externo seria injeção de SQL. Valores sempre vão
 *   como parâmetro bound (`${value}`), nunca interpolados.
 */

import { expect } from '@playwright/test';
import { Prisma } from '@prisma/client';
import { requestContext } from '../../src/lib/async-context';
import { withRlsContext } from '../../src/lib/prisma';

// Nome de tabela/coluna Postgres (camelCase quoted, ex.: "Lead", "deletedAt").
const SAFE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

function assertIdentifier(kind: 'tabela' | 'coluna', name: string): void {
  if (!SAFE_IDENTIFIER.test(name)) {
    throw new Error(`db-assertions: ${kind} inválido para SQL raw: ${JSON.stringify(name)}`);
  }
}

/**
 * Lê UMA linha da tabela pelo `id`, SEM o filtro de soft delete do client estendido.
 * Retorna `null` quando a linha não existe. `deletedAt`/`deletedBy` vêm preenchidos quando o
 * registro foi soft-deletado — é assim que se prova persistência de DELETE (o GET 404 sozinho
 * não distingue "apagado de verdade" de "filtro de leitura").
 */
export async function fetchDbRow(
  table: string,
  id: string,
): Promise<Record<string, unknown> | null> {
  assertIdentifier('tabela', table);
  requestContext.enterWith({ bypassRls: true });
  return withRlsContext(async (tx) => {
    const rows = await tx.$queryRaw<Record<string, unknown>[]>`
      SELECT * FROM ${Prisma.raw(`"${table}"`)} WHERE "id" = ${id} LIMIT 1`;
    return rows[0] ?? null;
  });
}

/**
 * Afirma que a linha `table#id` existe no banco e que cada campo de `expected` confere
 * (comparação via `toEqual` — Date vem como Date, string/número/null direto).
 * Retorna a linha crua para asserções adicionais (ex.: `deletedAt`).
 */
export async function expectDbRow(
  table: string,
  id: string,
  expected: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const row = await fetchDbRow(table, id);
  expect(row, `linha ${table}#${id} deve existir no PostgreSQL`).not.toBeNull();
  for (const [field, value] of Object.entries(expected)) {
    assertIdentifier('coluna', field);
    expect(row?.[field], `${table}.${field} persistido no banco`).toEqual(value);
  }
  return row as Record<string, unknown>;
}

/**
 * Conta linhas da tabela onde `column = value` — útil para provar que uma requisição rejeitada
 * (400/403/422) NÃO gravou nada (caminho de falha da TAREFA-SANEAMENTO-039).
 */
export async function countDbRows(
  table: string,
  column: string,
  value: unknown,
): Promise<number> {
  assertIdentifier('tabela', table);
  assertIdentifier('coluna', column);
  requestContext.enterWith({ bypassRls: true });
  return withRlsContext(async (tx) => {
    const rows = await tx.$queryRaw<{ count: bigint | number }[]>`
      SELECT COUNT(*)::int AS count FROM ${Prisma.raw(`"${table}"`)}
      WHERE ${Prisma.raw(`"${column}"`)} = ${value}`;
    const count = rows[0]?.count;
    if (count === undefined || count === null) {
      throw new Error(`db-assertions: COUNT(*) não retornou valor para ${table}.${column}`);
    }
    return Number(count);
  });
}

/**
 * Afirma soft delete persistido: a linha continua na tabela com `deletedAt` preenchido.
 * Complementa o 404 da API — prova que a exclusão foi gravada, não apenas filtrada na leitura.
 */
export async function expectDbRowSoftDeleted(table: string, id: string): Promise<void> {
  const row = await fetchDbRow(table, id);
  expect(row, `linha ${table}#${id} deve continuar na tabela após soft delete`).not.toBeNull();
  expect(row?.deletedAt, `${table}.deletedAt deve estar preenchido`).not.toBeNull();
}
