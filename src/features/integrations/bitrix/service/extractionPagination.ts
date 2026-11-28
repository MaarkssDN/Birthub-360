import { logger } from '../../../../lib/logger.js';
import { computeBackoffDelayMs, sleep } from '../../../../shared/http/retryWithBackoff.js';
import { AppError } from '../../../../shared/middlewares/errorHandler.js';
import { BitrixCallAbortedError, BitrixDefinitiveError, callBitrix } from './client.js';
import { type BitrixExtractionEntity, EXTRACTION_ENTITY_SPECS } from './extractionEntities.js';
import { bitrixExtractionRetriesTotal } from './metrics.js';

// ── Motor de paginação Bitrix24 das extrações (extraído de extraction.ts — Onda
// consolidação-20261124, remediação do hotspot arquitetural) ──────────────────────────────────
//
// Contém APENAS o loop de páginas (`extractEntityPages`): cursor `start`/`next`, teto de
// segurança, retentativa por página com backoff e propagação de cancelamento. O orquestrador
// por entidade/run continua em `extraction.ts` — este módulo não conhece Prisma nem o modelo
// `BitrixExtractionRun`, só o contrato HTTP do Bitrix.

// Proteção contra loop infinito (item obrigatório da spec de extração) — 500 páginas de 50
// registros = até 25.000 registros por entidade numa única execução. Não é um teto de produto
// (uma organização grande pode ter mais que isso), é uma rede de segurança: se atingido,
// `pagesExhausted: false` fica registrado no progresso em vez de a extração rodar para sempre.
export const PAGE_SAFETY_CAP = 500;

const MAX_PAGE_RETRIES = 3;

interface BitrixListResponse {
  result: Record<string, unknown>[];
  next?: number;
  total?: number;
}

let extractionBackoffDelayFn = (attempt: number) => computeBackoffDelayMs(attempt, 200, 2000);
let extractionSleepFn = sleep;

/** Configura atraso de retentativa para testes unitários — permite eliminar waits reais. */
export function __setExtractionRetryDelayForTests(
  delayFn?: (attempt: number) => number,
  sleepFn?: (ms: number) => Promise<void>,
) {
  extractionBackoffDelayFn =
    delayFn ?? ((attempt: number) => computeBackoffDelayMs(attempt, 200, 2000));
  extractionSleepFn = sleepFn ?? sleep;
}

/**
 * Backoff compartilhado entre a retentativa POR PÁGINA (aqui dentro) e a retentativa da
 * ENTIDADE INTEIRA (em `extraction.ts`) — ambas usam o mesmo par de funções injetáveis para
 * que `__setExtractionRetryDelayForTests` controle os dois caminhos de uma vez.
 */
export async function waitExtractionRetryBackoff(attempt: number): Promise<void> {
  await extractionSleepFn(extractionBackoffDelayFn(attempt));
}

export async function extractEntityPages(
  organizationId: string,
  webhookUrl: string,
  entity: BitrixExtractionEntity,
  filter: Record<string, unknown>,
  select: string[] | undefined,
  correlationId: string,
  onPage: (processedSoFar: number) => Promise<boolean>,
  signal?: AbortSignal,
): Promise<{
  rows: Record<string, unknown>[];
  pagesScanned: number;
  pagesExhausted: boolean;
  cancelled: boolean;
}> {
  const method = EXTRACTION_ENTITY_SPECS[entity].listMethod;
  const rows: Record<string, unknown>[] = [];
  let start = 0;
  let pagesScanned = 0;
  let pagesExhausted = false;
  let cancelled = false;

  while (pagesScanned < PAGE_SAFETY_CAP) {
    // Cancelamento cooperativo (TAREFA-SANEAMENTO-046): abort entre páginas encerra sem nova
    // chamada de rede — o signal também é propagado a cada `callBitrix` abaixo.
    if (signal?.aborted) throw new BitrixCallAbortedError();
    const params: Record<string, unknown> = { filter, start };
    if (select) params.select = select;
    if (entity !== 'user') params.order = { ID: 'ASC' }; // ordem estável — evita pular/duplicar registro se algo for criado/alterado entre páginas

    let data: BitrixListResponse | null = null;
    let pageAttempt = 1;

    while (pageAttempt <= MAX_PAGE_RETRIES) {
      try {
        data = await callBitrix<BitrixListResponse>(webhookUrl, method, params, {
          correlationId,
          signal,
        });
        break;
      } catch (err: any) {
        // Cancelamento cooperativo propaga imediatamente — nunca retentado como falha transitória.
        if (err instanceof BitrixCallAbortedError) throw err;
        // Erro definitivo (401/403/filtro inválido) propaga imediatamente sem retentar
        if (
          err instanceof BitrixDefinitiveError ||
          err?.statusCode === 401 ||
          err?.statusCode === 403 ||
          err?.statusCode === 400
        ) {
          throw err;
        }

        if (pageAttempt >= MAX_PAGE_RETRIES) {
          logger.error(
            { correlationId, entity, start, pageAttempt, maxPageAttempts: MAX_PAGE_RETRIES, err },
            '[bitrix] Retentativas de página esgotadas na extração',
          );
          throw err;
        }

        const delay = extractionBackoffDelayFn(pageAttempt);
        logger.warn(
          {
            correlationId,
            entity,
            start,
            pageAttempt,
            maxPageAttempts: MAX_PAGE_RETRIES,
            delayMs: delay,
          },
          '[bitrix] Falha transitória ao buscar página da extração — retentando com backoff',
        );
        bitrixExtractionRetriesTotal.inc({ tenant: organizationId, entity });
        await extractionSleepFn(delay);
        pageAttempt++;
      }
    }

    if (!data) {
      throw new AppError(`Falha ao obter dados da página start=${start} do Bitrix24.`, 502);
    }

    rows.push(...data.result);
    pagesScanned++;

    cancelled = await onPage(rows.length);
    if (cancelled) break;

    if (data.next == null || data.result.length === 0) {
      pagesExhausted = true;
      break;
    }
    start = data.next;
  }

  return { rows, pagesScanned, pagesExhausted, cancelled };
}
