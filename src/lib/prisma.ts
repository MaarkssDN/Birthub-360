import { AsyncLocalStorage } from 'node:async_hooks';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import client from 'prom-client';
import { env } from '../config/env.js';
import { requestContext } from './async-context.js';
import { type AuditAction, AuditService } from './audit/audit.service.js';
import {
  decryptSensitiveResult,
  ENCRYPTED_MODEL_FIELDS as ENCRYPTED_FIELDS,
} from './crypto/piiFields.js';
import { logger } from './logger.js';
import {
  applyPiiEncryptionToWriteArgs,
  applySoftDeleteReadFilter,
  decryptNestedContactPii,
  injectTenantIntoWriteArgs,
  isAuditableModel,
  resolveBypassRls,
} from './prisma-interceptors.js';
import { queuesEnabled } from './queue/redis.js';
import { searchQueue } from './queue/search.queue.js';
import { TENANT_INJECTED_MODELS } from './tenant-scoping-registry.js';
import {
  assertModelOperationAllowed,
  guardGlobalClientEscapes,
  TransactionEscapeError,
} from './txEscapeGuard.js';

export { TENANT_INJECTED_MODELS };

const connectionString = env.DATABASE_URL || process.env.DATABASE_URL || '';

// Campos de credencial de integração cifrados em repouso (AES-256-GCM, ver
// src/lib/crypto/secretFields.ts) — cifra ao gravar/decifra ao ler, de forma transparente para
// todo o resto do código (services continuam lendo texto puro em memória; só o valor persistido
// no Postgres é cifrado). Config e helpers em src/lib/crypto/piiFields.ts (ver ali o mapa completo
// de models/campos) — mantido apenas o mesmo nome local `ENCRYPTED_FIELDS` abaixo para não alterar
// o resto deste arquivo. `Contact` (email/phone/whatsapp) ESTÁ neste mapa: entrou, foi revertido na
// onda 39 (ver .agents/handoffs/onda-39/01-para-00-pii-contact-revertida-quebra-integration.md) e
// voltou com o índice cego (piiIndex.ts) e a decifragem aninhada
// (`decryptNestedContactPii` em ./prisma-interceptors.ts).
// Fonte da verdade: ENCRYPTED_MODEL_FIELDS em piiFields.ts.

// Production-ready connection pool configuration.
// `max` precisa ficar abaixo do pool_size do pooler do Supabase em modo "Session" (hoje 15) —
// setado em 20 antes, o pool deste único processo sozinho já estourava o limite do pooler assim
// que ~15 requisições concorrentes precisavam de conexão ao mesmo tempo, derrubando em cascata
// toda query (incluindo o Better Auth, que reusa este mesmo `prisma`/pool — ver `prismaAdapter`
// em src/lib/auth.ts): "(EMAXCONNSESSION) max clients reached in session mode - max clients are
// limited to pool_size: 15" e "Failed to get session" em toda rota autenticada.
const pool = new Pool({
  connectionString,
  max: process.env.DB_POOL_MAX
    ? parseInt(process.env.DB_POOL_MAX, 10)
    : process.env.NODE_ENV === 'test'
      ? 25
      : 10, // Máximo de clients no pool — mantém margem abaixo do pool_size:15 do pooler Supabase em prod
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 30000, // Return an error after 30 seconds if connection could not be established
  allowExitOnIdle: true,
});

// Error handling for idle clients — usa logger estruturado (não console.error) para aparecer no Pino/Datadog.
pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle database client');
});

// CPI (auditoria — "Alerta real de DB pool saturation" nunca tinha métrica real, só texto
// aspiracional em infrastructure/observability/alert.rules.yml). `pg.Pool` já mantém essas 3
// contagens internamente (nenhuma instrumentação nova de query necessária) — só faltava expô-las
// como Gauge Prometheus, mesmo padrão pull-based de src/lib/queue/metrics.ts. Consumida pelo grupo
// `birthhub-360.database.ativos-hoje` em alert.rules.yml.
export const dbPoolTotalConnections = new client.Gauge({
  name: 'pg_pool_total_connections',
  help: 'Total de clientes (conectados + sendo criados) no pool pg deste processo.',
  collect() {
    this.set(pool.totalCount);
  },
});

export const dbPoolIdleConnections = new client.Gauge({
  name: 'pg_pool_idle_connections',
  help: 'Clientes ociosos (livres para uso imediato) no pool pg deste processo.',
  collect() {
    this.set(pool.idleCount);
  },
});

export const dbPoolWaitingRequests = new client.Gauge({
  name: 'pg_pool_waiting_requests',
  help: 'Requisições aguardando um client livre do pool pg deste processo — > 0 sustentado indica pool saturado (max: 10).',
  collect() {
    this.set(pool.waitingCount);
  },
});

const adapter = new PrismaPg(pool as any);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * Transação interativa ativa (propagação de tx — parecer 15 U1/U2). Enquanto `runInTransaction`
 * estiver executando, TODA operação de model do client estendido (`prisma`) roda nesta mesma
 * transação/conexão em vez de abrir uma nova — mantendo cifragem, índice cego, injeção de tenant,
 * soft delete e auditoria, e tornando-as atômicas com SQL cru (outbox, advisory lock) do mesmo tx.
 */
interface ActiveTransaction {
  tx: Prisma.TransactionClient;
  tenantId: string;
  /** Efeitos colaterais externos (ex.: fila de busca) adiados para depois do COMMIT. */
  afterCommit: Array<() => void>;
  /**
   * X2 (parecer 15 #40): true depois que a transação terminou (COMMIT ou ROLLBACK). Promessas não
   * aguardadas criadas dentro do `fn` herdam o ALS; se rodarem depois do fim, lançam
   * `TransactionClosedError` (fail-closed, mensagem clara) em vez de usar um tx encerrado.
   */
  closed: boolean;
}
const activeTransaction = new AsyncLocalStorage<ActiveTransaction>();

/** Operação disparada (sem await) dentro de `runInTransaction` executou depois do fim do tx. */
export class TransactionClosedError extends Error {
  constructor(what: string) {
    super(
      `runInTransaction: ${what} executado depois do fim da transação (promessa não aguardada dentro do fn?). Aguarde todas as operações antes de retornar.`,
    );
    this.name = 'TransactionClosedError';
  }
}

/**
 * true se o código corrente roda dentro de um `runInTransaction` ainda aberto. Usado pelo
 * AuditService (X1): dentro do tx, falha de audit precisa propagar (o tx já está abortado).
 */
export function isInActiveTransaction(): boolean {
  const a = activeTransaction.getStore();
  return a !== undefined && !a.closed;
}

export class TransactionTenantMismatchError extends Error {
  constructor(active: string, requested: string) {
    super(
      `runInTransaction: tenant da operação (${requested || '<vazio>'}) difere do tenant da transação ativa (${active})`,
    );
    this.name = 'TransactionTenantMismatchError';
  }
}

const basePrisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

const extendedPrisma = basePrisma.$extends({
  query: {
    $allModels: {
      // `query` (a próxima operação na cadeia de extensão, ligada ao client base) não é mais usada
      // diretamente — ver comentário grande dentro de `executeWithRls` abaixo sobre por que ela foi
      // substituída por chamadas ao delegate do model/operation via o client (`tx` ou `basePrisma`)
      // passado explicitamente para cada `executeWithRls`.
      async $allOperations({ model, operation, args }) {
        const store = requestContext.getStore();
        // G1 caso (a): flag da UoW da outbox sem runInTransaction ativo → recusa antes de executar.
        assertModelOperationAllowed(
          {
            activeTransaction: activeTransaction.getStore() !== undefined,
            outboxUnitOfWorkActive:
              (store as Record<string, unknown> | undefined)?.outboxUnitOfWorkActive === true,
          },
          model as string,
          operation,
        );
        const tenantId = store?.tenantId;
        const userId = store?.userId;
        // bypassRls em produção só existe pra as rotas do Better Auth (login/signup/sessão, ver
        // server.ts e authenticateToken.ts), que precisam localizar usuário/sessão/organização
        // antes de haver um tenant conhecido. Em produção, restringe o efeito do bypass a esses
        // models — mesmo que o contexto vaze pra uma query de outro model (ex.: um handler futuro
        // do Better Auth que também toque Company/Lead), RLS continua valendo normalmente ali. Em
        // dev/test não restringe: fixtures de teste de integração (ver tests/helpers/
        // integration-setup.ts e tests/integration/tenant-isolation-db001.test.ts) legitimamente
        // manipulam múltiplos tenants fora de qualquer request HTTP, e essa camada nunca é exposta
        // a usuário real fora de produção.
        const rawBypassRls = Boolean((store as Record<string, unknown>)?.bypassRls);
        // Allowlist de models com bypassRls em produção + justificativa por model:
        // `BYPASS_RLS_ALLOWED_MODELS`/`resolveBypassRls` em ./prisma-interceptors.ts
        // (TAREFA-SANEAMENTO-013 — extraído para teste unitário isolado; comportamento idêntico).
        const bypassRls = resolveBypassRls(
          rawBypassRls,
          model as string,
          env.NODE_ENV === 'production',
        );

        const isAuditable = isAuditableModel(model as string);

        // Passos de interceptação puros (args/decisão), extraídos para ./prisma-interceptors.ts
        // na TAREFA-SANEAMENTO-013 — comportamento idêntico, agora testável em unidade isolada.
        injectTenantIntoWriteArgs(args, model as string, operation, tenantId);
        applyPiiEncryptionToWriteArgs(args, model as string, operation);
        applySoftDeleteReadFilter(args, model as string, operation);

        // IMPORTANTE (Onda 9, bug crítico de RLS — ver .agents/runs/onda-9.md): `executeWithRls`
        // costumava combinar o `SET LOCAL` de tenant com a query real via `basePrisma.$transaction([
        // setConfig, prismaPromise])` (array-form). Reproduzido de forma determinística contra
        // Postgres real (não mock): o Client Engine em TypeScript do Prisma 7 (que substituiu o
        // engine binário Rust) não garante, para esse array-form combinando uma `$executeRawUnsafe`
        // crua com uma promise vinda da cadeia de extensão (`query(args)`), que a segunda operação
        // realmente seja enviada ao Postgres dentro da MESMA transação — em alguns casos a operação
        // simplesmente não chega a gerar o INSERT/UPDATE real (nenhum erro, a promise resolve com um
        // objeto de resultado, mas a linha nunca existiu no banco), e em outros o `SET LOCAL` do
        // tenant não fica visível para a query seguinte (RLS rejeita ou devolve vazio). Confirmado
        // com `pg_backend_pid()`/log de SQL (`$on('query')`) que, fora dessa combinação específica,
        // uma transação array-form comum (duas queries do MESMO client base) funciona normalmente —
        // o problema é específico de misturar `$executeRawUnsafe` com uma promise que atravessa a
        // cadeia de extensão do Prisma.
        //
        // Fix: usar uma transação interativa (`basePrisma.$transaction(async (tx) => {...})`) e
        // executar o `SET LOCAL` e a operação real ambos via `tx` (o client vinculado à transação
        // interativa), nunca via `basePrisma` direto — isso é o padrão já usado com sucesso em
        // `withRlsContext` logo abaixo, e a documentação oficial do Prisma recomenda para RLS. Em
        // vez de receber uma `PrismaPromise` já construída (que carrega sua própria ligação ao
        // client base, não a `tx`), `executeWithRls` agora recebe uma função que constrói a operação
        // a partir do client passado (`tx` normal, ou `basePrisma` no caminho sem contexto de
        // tenant) — assim a MESMA referência de client roda o SET e a query.
        const executeWithRls = async <T>(
          build: (client: PrismaClient) => Prisma.PrismaPromise<T>,
        ): Promise<T> => {
          // Propagação de tx: dentro de runInTransaction, reusa a transação ativa (mesma conexão, mesmo
          // set_config local). Nunca abre transação nova nem aceita outro tenant/bypass ali dentro.
          const active = activeTransaction.getStore();
          if (active) {
            if (active.closed) throw new TransactionClosedError(`${model}.${operation}`);
            if (rawBypassRls) {
              throw new Error(
                'runInTransaction: bypassRls não é permitido dentro de uma transação de tenant',
              );
            }
            if (tenantId !== active.tenantId) {
              throw new TransactionTenantMismatchError(active.tenantId, tenantId ?? '');
            }
            return await build(active.tx as unknown as PrismaClient);
          }
          if (!tenantId && !bypassRls) return await build(basePrisma);
          // Sem try/catch de propósito: um `catch { return await prismaPromise }` aqui existia antes
          // e mascarava o erro real de qualquer falha (ex.: violação de unique constraint) reexecutando
          // a MESMA query fora da transação, sem nenhum app.current_tenant_id/bypass_rls setado —
          // essa segunda tentativa então falhava de um jeito diferente e enganoso (parecia RLS
          // "new row violates row-level security policy", quando o problema real era outro, ver
          // TEST-002/e2e). Se a transação com contexto de tenant falha, o erro real deve subir —
          // nunca cair pra uma tentativa sem proteção de tenant/RLS.
          return basePrisma.$transaction(
            async (tx) => {
              await tx.$executeRawUnsafe(
                `SELECT set_config('app.bypass_rls', $1, TRUE), set_config('app.current_tenant_id', $2, TRUE);`,
                bypassRls ? 'on' : 'off',
                tenantId || '',
              );
              return build(tx as unknown as PrismaClient);
            },
            {
              maxWait: process.env.NODE_ENV === 'test' ? 30000 : 15000,
              timeout: 45000,
            },
          );
        };

        // --- 3. Audit Log - Capture Before State ---
        let beforeState: Record<string, unknown> | null = null;
        if (isAuditable && (operation === 'update' || operation === 'delete')) {
          try {
            const a = args as Record<string, unknown>;
            beforeState = (await executeWithRls((client) => {
              const modelDelegate = (client as unknown as Record<string, unknown>)[
                model as string
              ] as Record<string, unknown>;
              return (modelDelegate.findUnique as (args: unknown) => Prisma.PrismaPromise<unknown>)(
                { where: a.where },
              );
            })) as Record<string, unknown> | null;
          } catch {
            // Ignore if we can't find it or where is complex
          }
        }

        // --- 4. Execute Query (Intercepting Delete) ---
        let result: Record<string, unknown> | null;
        let affectedIds: string[] = [];
        const a = args as Record<string, unknown>;

        if (isAuditable && operation === 'delete') {
          result = (await executeWithRls((client) => {
            const modelDelegate = (client as unknown as Record<string, unknown>)[
              model as string
            ] as Record<string, unknown>;
            return (modelDelegate.update as (args: unknown) => Prisma.PrismaPromise<unknown>)({
              where: a.where,
              data: { deletedAt: new Date(), deletedBy: userId, deleteReason: 'Soft delete' },
            });
          })) as Record<string, unknown>;
          if (result?.id) {
            affectedIds.push(result.id as string);
          }
        } else if (isAuditable && operation === 'deleteMany') {
          // Need to fetch IDs first to cascade
          const recordsToSoftDelete = (await executeWithRls((client) => {
            const modelDelegate = (client as unknown as Record<string, unknown>)[
              model as string
            ] as Record<string, unknown>;
            return (modelDelegate.findMany as (args: unknown) => Prisma.PrismaPromise<unknown>)({
              where: a.where,
              select: { id: true },
            });
          })) as Record<string, unknown>[];
          affectedIds = recordsToSoftDelete.map((r) => r.id as string);

          result = (await executeWithRls((client) => {
            const modelDelegate = (client as unknown as Record<string, unknown>)[
              model as string
            ] as Record<string, unknown>;
            return (modelDelegate.updateMany as (args: unknown) => Prisma.PrismaPromise<unknown>)({
              where: a.where,
              data: { deletedAt: new Date(), deletedBy: userId, deleteReason: 'Soft delete' },
            });
          })) as Record<string, unknown>;
        } else {
          // `query` é a operação original desta mesma extensão (ver `$allOperations` acima),
          // vinculada ao client base — equivalente a `client[model][operation](args)` quando
          // `client` é `basePrisma`, mas incapaz de rodar sobre `tx` (a transação interativa usada
          // por `executeWithRls` acima). Chamar o delegate de `client` diretamente pelo nome do
          // model/operation reproduz o mesmo efeito de `query(args)`, mas ligado ao client correto
          // em cada chamada (garante mesma conexão/transação do SET LOCAL de tenant).
          result = (await executeWithRls((client) => {
            const modelDelegate = (client as unknown as Record<string, unknown>)[
              model as string
            ] as Record<string, unknown>;
            return (
              modelDelegate[operation as string] as (args: unknown) => Prisma.PrismaPromise<unknown>
            )(args);
          })) as Record<string, unknown>;
        }

        // --- Cascade Soft Deletes ---
        if (
          isAuditable &&
          (operation === 'delete' || operation === 'deleteMany') &&
          affectedIds.length > 0
        ) {
          const cascadeData = {
            deletedAt: new Date(),
            deletedBy: userId,
            deleteReason: 'Cascade Soft Delete',
          };

          if (model === 'Company') {
            await executeWithRls((client) =>
              client.contact.updateMany({
                where: { companyId: { in: affectedIds } },
                data: cascadeData,
              }),
            );
            await executeWithRls((client) =>
              client.lead.updateMany({
                where: { companyId: { in: affectedIds } },
                data: cascadeData,
              }),
            );
          } else if (model === 'Contact') {
            await executeWithRls((client) =>
              client.lead.updateMany({
                where: { contactId: { in: affectedIds } },
                data: cascadeData,
              }),
            );
          } else if (model === 'Lead') {
            await executeWithRls((client) =>
              client.activity.updateMany({
                where: { leadId: { in: affectedIds } },
                data: cascadeData,
              }),
            );
          }
        }

        // --- Soft Delete (findUnique filtering) ---
        if (isAuditable && (operation === 'findUnique' || operation === 'findUniqueOrThrow')) {
          if (result && result.deletedAt !== null) {
            if (operation === 'findUniqueOrThrow') {
              throw new Prisma.PrismaClientKnownRequestError(
                'An operation failed because it depends on one or more records that were required but not found.',
                { code: 'P2025', clientVersion: Prisma.prismaVersion.client },
              );
            }
            return null;
          }
        }

        // --- 5. Audit Log & Search Queue ---
        if (isAuditable && ['create', 'update', 'delete'].includes(operation) && result) {
          // Cast seguro: o `.includes` acima já garante operation ∈ {create,update,delete}.
          const action = operation.toUpperCase() as AuditAction;
          const entityId = result.id as string | undefined;
          // `await`ado de propósito (não fire-and-forget): AuditService.log grava em AuditLog, cuja
          // policy de RLS exige `app.current_tenant_id` setado (migration
          // 20260825120000_scope_rls_bypass_to_bootstrap_allowlist), então cada chamada abre sua
          // própria transação interativa via executeWithRls acima. Sem await, uma sequência rápida
          // de creates/updates (import em massa, ação bulk) disparava dezenas dessas transações em
          // paralelo sem nenhum controle de concorrência, estourando o pool de conexões do pooler do
          // Supabase (P2028 "Unable to start a transaction in the given time") — reproduzido
          // importando 103 empresas em sequência. `await` aqui serializa: a transação de auditoria
          // desta operação termina antes da próxima operação começar a sua.
          // AuditService.log já captura e loga qualquer erro internamente (nunca rejeita), então
          // nenhum try/catch é necessário aqui.
          await AuditService.log({
            action,
            entity: model as string,
            entityId,
            actorId: userId as string | undefined,
            tenantId: (tenantId || result.organizationId) as string | undefined,
            beforeState: beforeState ?? undefined,
            afterState: operation === 'delete' ? undefined : result,
          });

          if (queuesEnabled && (model === 'Company' || model === 'Lead')) {
            const indexName = model === 'Company' ? 'companies' : 'leads';
            const searchAction =
              operation === 'delete' ? 'delete' : operation === 'create' ? 'add' : 'update';
            const payload = {
              index: indexName,
              action: searchAction,
              data: operation === 'delete' ? [result.id] : [{ ...result }],
            };
            const enqueue = () => {
              searchQueue
                ?.add(searchAction, payload)
                .catch((err) => logger.error(err, 'Failed to enqueue search index task'));
            };
            // Dentro de runInTransaction: só enfileira após COMMIT (rollback não reindexa).
            const active = activeTransaction.getStore();
            if (active) active.afterCommit.push(enqueue);
            else enqueue();
          }
        }

        // --- 6. Criptografia de credenciais em repouso (read) ---
        if (ENCRYPTED_FIELDS[model as string]) {
          result = decryptSensitiveResult(model as string, result);
        }

        // --- 6b. Descriptografia de PII de Contact em relações aninhadas (read) ---
        // `decryptSensitiveResult` acima só decifra quando Contact é o MODEL da própria operação
        // (`prisma.contact.findMany(...)`) — uma query de outro model que traz Contact junto via
        // `include`/`select` aninhado (ex.: `prisma.lead.findFirst({ include: { contact: true } })`)
        // nunca passa por ali, e o e-mail/telefone/whatsapp do contato voltariam como ciphertext
        // cru para quem espera texto puro. Era exatamente esse o modo de quebra que
        // `document-signature.routes.test.ts` expôs na tentativa anterior (ver piiFields.ts).
        //
        // Em vez de mapear cada relação que aponta pra Contact (frágil — quebra de novo a cada
        // relação nova), decifra POR FORMA: qualquer valor de string em `email`/`phone`/`whatsapp`,
        // em qualquer profundidade do resultado, que comece com o prefixo versionado `enc:v1:`
        // (`decryptField` já trata qualquer outro valor como texto legado/sem cifra e devolve
        // sem alteração) — idempotente mesmo quando já decifrado pelo passo 6 acima.
        result = decryptNestedContactPii(result) as typeof result;

        return result;
      },
    },
  },
}) as unknown as PrismaClient; // Cast needed due to complex extension types

/**
 * Client exportado: o estendido envolto pelo guard G1 (ver txEscapeGuard.ts). Dentro de
 * runInTransaction ou da UoW da outbox, `prisma.$queryRaw*`/`$executeRaw*` e `prisma.$transaction`
 * lançam TransactionEscapeError em vez de escapar do tx. Operações de model passam com tx ativo
 * (reusam o tx); com outboxUnitOfWorkActive SEM tx ativo, o $allOperations recusa (caso a).
 */
export const prisma = guardGlobalClientEscapes(extendedPrisma, () => ({
  activeTransaction: activeTransaction.getStore() !== undefined,
  outboxUnitOfWorkActive:
    (requestContext.getStore() as Record<string, unknown> | undefined)?.outboxUnitOfWorkActive ===
    true,
}));

/**
 * Executa `fn` dentro de uma transação com `app.current_tenant_id`/`app.bypass_rls` já setados.
 *
 * Necessário para SQL cru (`$executeRaw`/`$queryRaw`): esses métodos não passam pela extensão
 * `$allOperations` acima (ela só intercepta operações de model), então uma query crua na tabela
 * "prisma" exportada nunca teria o contexto de tenant setado — e bateria na RLS mesmo com um
 * usuário autenticado normal (ver DocumentChunk em ingestion.service.ts).
 */
export async function withRlsContext<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  // G1: withRlsContext abre OUTRA transação; dentro de runInTransaction isso escaparia do tx ativo.
  if (activeTransaction.getStore()) {
    throw new TransactionEscapeError('$transaction', {
      activeTransaction: true,
      outboxUnitOfWorkActive: false,
    });
  }
  const store = requestContext.getStore();
  const tenantId = store?.tenantId ?? '';
  const bypassRls = Boolean((store as Record<string, unknown>)?.bypassRls);
  return basePrisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(
        `SELECT set_config('app.bypass_rls', $1, TRUE), set_config('app.current_tenant_id', $2, TRUE);`,
        bypassRls ? 'on' : 'off',
        tenantId,
      );
      return fn(tx);
    },
    {
      maxWait: 15000,
      timeout: 30000,
    },
  );
}

/**
 * Cliente entregue por `runInTransaction`: delegates de model do client ESTENDIDO (cifragem, índice
 * cego, injeção de tenant, soft delete, auditoria — todos roteados para a transação ativa) + SQL cru
 * (`$queryRaw*`/`$executeRaw*`) direto na transação real. Compatível com o `SqlExecutor` do #32.
 */
export type TransactionalClient = PrismaClient;

const RAW_METHODS = new Set([
  '$queryRaw',
  '$executeRaw',
  '$queryRawUnsafe',
  '$executeRawUnsafe',
  '$queryRawTyped',
]);

function makeTransactionalClient(active: ActiveTransaction): TransactionalClient {
  return new Proxy({} as TransactionalClient, {
    get(_target, prop) {
      if (typeof prop === 'string' && RAW_METHODS.has(prop)) {
        // X3: `$queryRawTyped` também vai para o tx real. Se o client não tiver o método (typedSql
        // desligado), lança em vez de cair no client global fora do tx.
        const fn = (
          active.tx as unknown as Record<string, ((...a: unknown[]) => unknown) | undefined>
        )[prop];
        return (...args: unknown[]) => {
          if (active.closed) throw new TransactionClosedError(`tx.${prop}`);
          if (typeof fn !== 'function') {
            throw new Error(`runInTransaction: tx.${prop} não disponível neste client`);
          }
          return fn.apply(active.tx, args);
        };
      }
      if (prop === '$runCommandRaw') {
        // X3: só MongoDB; nunca deve cair no client global a partir do tx.
        return () => {
          throw new Error('runInTransaction: $runCommandRaw não é suportado dentro do tx');
        };
      }
      if (prop === '$transaction') {
        // Aninhado: reusa a mesma transação (forma função). Forma array não é suportada aqui.
        return (arg: unknown) => {
          if (typeof arg !== 'function') {
            throw new Error(
              'runInTransaction: $transaction([...]) não é suportado dentro do tx; use a forma função',
            );
          }
          return (arg as (c: TransactionalClient) => Promise<unknown>)(
            makeTransactionalClient(active),
          );
        };
      }
      if (prop === 'then') return undefined; // não é thenable
      return (prisma as unknown as Record<string | symbol, unknown>)[prop];
    },
  });
}

/**
 * Unidade de trabalho sobre o client ESTENDIDO (parecer 15 U1/U2/U3). Abre UMA transação interativa
 * no client base, faz `set_config('app.bypass_rls','off',true)` + `set_config('app.current_tenant_id',
 * tenant, true)` e executa `fn` com um client transacional: toda operação de model do `prisma`
 * (inclusive chamada indireta, ex.: AuditService) e o SQL cru do client entregue rodam na mesma
 * conexão/transação. Efeitos externos (fila de busca) só depois do COMMIT.
 *
 * - Tenant: `organizationId` explícito ou o do `requestContext`; sem tenant → erro (fail-closed).
 *   Divergência entre os dois → `TransactionTenantMismatchError`. Nunca aceita bypassRls.
 * - Aninhado: se já houver transação ativa do MESMO tenant, reusa (mesma conexão); outro tenant → erro.
 * - Assinatura compatível com `PrismaOutboxUnitOfWork` (#32): `new PrismaOutboxUnitOfWork(
 *   (fn) => runInTransaction(fn))`.
 */
export async function runInTransaction<R>(
  fn: (tx: TransactionalClient) => Promise<R>,
  opts: { organizationId?: string; maxWaitMs?: number; timeoutMs?: number } = {},
): Promise<R> {
  const store = requestContext.getStore() as Record<string, unknown> | undefined;
  const ctxTenant = (store?.tenantId as string | undefined) ?? '';
  const tenantId = opts.organizationId ?? ctxTenant;
  if (!tenantId) {
    throw new Error(
      'runInTransaction: tenant obrigatório (requestContext.tenantId ou opts.organizationId)',
    );
  }
  if (ctxTenant && ctxTenant !== tenantId) {
    throw new TransactionTenantMismatchError(ctxTenant, tenantId);
  }

  const current = activeTransaction.getStore();
  if (current) {
    if (current.tenantId !== tenantId)
      throw new TransactionTenantMismatchError(current.tenantId, tenantId);
    return await fn(makeTransactionalClient(current));
  }

  const afterCommit: Array<() => void> = [];
  const result = await requestContext.run(
    { ...(store ?? {}), tenantId, bypassRls: false } as Parameters<typeof requestContext.run>[0],
    () =>
      basePrisma.$transaction(
        async (tx) => {
          await tx.$executeRawUnsafe(
            `SELECT set_config('app.bypass_rls', 'off', TRUE), set_config('app.current_tenant_id', $1, TRUE);`,
            tenantId,
          );
          const active: ActiveTransaction = { tx, tenantId, afterCommit, closed: false };
          // `async/await` dentro do run: ancora a store mesmo se `fn` devolver PrismaPromise lazy.
          try {
            return await activeTransaction.run(
              active,
              async () => await fn(makeTransactionalClient(active)),
            );
          } finally {
            // X2: a partir daqui (COMMIT/ROLLBACK em seguida) qualquer op tardia lança
            // TransactionClosedError em vez de usar o tx encerrado.
            active.closed = true;
          }
        },
        {
          maxWait: opts.maxWaitMs ?? (process.env.NODE_ENV === 'test' ? 30000 : 15000),
          timeout: opts.timeoutMs ?? 45000,
        },
      ),
  );
  for (const cb of afterCommit) {
    try {
      cb();
    } catch (err) {
      logger.error({ err }, 'runInTransaction: falha em efeito pós-commit');
    }
  }
  return result;
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma;

// Graceful shutdown handling. `beforeExit` pode disparar mais de uma vez (o event loop pode
// esvaziar de novo enquanto o handler async anterior ainda está rodando) — process.once garante
// que $disconnect()/pool.end() só rodem uma vez, evitando "Called end on pool more than once".
process.once('beforeExit', async () => {
  logger.info('Shutting down Prisma client and database connection pool...');
  await prisma.$disconnect();
  await pool.end();
  logger.info('Shutdown complete.');
});
