/**
 * db-assertions.ts — cliente de banco para asserções de persistência nos specs E2E
 * (TAREFA-SANEAMENTO-039 / BT360-DT-0089).
 *
 * Os specs validavam apenas o DOM: a UI podia "funcionar" enquanto a escrita no
 * backend falhava silenciosamente. Este helper expõe o mesmo client Prisma já
 * usado por helpers.ts (setup) para ASSERTIONS de leitura no banco de teste —
 * prova de que a ação da UI realmente persistiu.
 *
 * Regras:
 * - SOMENTE LEITURA é permitida aqui (findUnique/findFirst/findMany/count).
 *   Escrita em spec E2E continua sendo responsabilidade de helpers.ts/API —
 *   assertion que precisa criar dado deve usar o fluxo real (UI ou API).
 * - O banco é o de integração (`*_test`), garantido pela trava do
 *   prepare-integration-env.js e reforçada no playwright.config.ts.
 */
import type { Prisma } from '@prisma/client';
import { requestContext } from '../../src/lib/async-context';
import { prisma } from '../../src/lib/prisma';

export { prisma as db };

type ModelName = keyof Prisma.TypeMap['model'];

function delegateFor(model: ModelName) {
  // TypeMap usa o nome do model Prisma ("User"); o delegate no client é camelCase ("user").
  const delegateName = model.charAt(0).toLowerCase() + model.slice(1);
  const d = (prisma as unknown as Record<string, unknown>)[delegateName];
  if (!d || typeof d !== 'object') {
    throw new Error(`db-assertions: model Prisma "${String(model)}" indisponível`);
  }
  return d as {
    findUnique(args: { where: Record<string, unknown> }): Promise<unknown>;
    findFirst(args: {
      where?: Record<string, unknown>;
      orderBy?: Record<string, 'asc' | 'desc'>;
    }): Promise<unknown>;
    findMany(args?: {
      where?: Record<string, unknown>;
      take?: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
    }): Promise<unknown[]>;
    count(args?: { where?: Record<string, unknown> }): Promise<number>;
  };
}

// Leituras de assertion rodam fora de request HTTP: sem tenantId e sem bypassRls
// o wrapper de tenancy executa a query sem app.current_tenant_id e o RLS do
// Postgres devolve zero linhas (fail-closed) — o helper reportaria "ausente"
// mesmo com o dado persistido. bypassRls é honrado fora de produção para
// qualquer model (ver resolveBypassRls em src/lib/prisma-interceptors.ts),
// mesmo padrão de helpers.ts (enterWith({ bypassRls: true })).
function read<T>(fn: () => Promise<T>): Promise<T> {
  return requestContext.run({ bypassRls: true }, fn);
}

/** Busca um registro por campo único (ex.: { email }). Retorna null se não existir. */
export async function dbFindBy<K extends string>(
  model: ModelName,
  where: Record<K, string>,
): Promise<Record<string, unknown> | null> {
  const row = await read(() => delegateFor(model).findUnique({ where }));
  return (row as Record<string, unknown> | null) ?? null;
}

/** Primeira linha que satisfaz `where` (opcionalmente ordenada). Null se nenhuma. */
export async function dbFindFirst(
  model: ModelName,
  where: Record<string, unknown>,
  orderBy?: Record<string, 'asc' | 'desc'>,
): Promise<Record<string, unknown> | null> {
  const row = await read(() => delegateFor(model).findFirst({ where, orderBy }));
  return (row as Record<string, unknown> | null) ?? null;
}

/** Conta linhas que satisfazem `where`. */
export async function dbCount(
  model: ModelName,
  where?: Record<string, unknown>,
): Promise<number> {
  return read(() => delegateFor(model).count(where ? { where } : undefined));
}
