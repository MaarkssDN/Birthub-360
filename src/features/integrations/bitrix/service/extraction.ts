import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { AuditService } from '../../../../lib/audit/audit.service.js';
import { logger } from '../../../../lib/logger.js';
import { prisma } from '../../../../lib/prisma.js';
import { computeBackoffDelayMs, sleep } from '../../../../shared/http/retryWithBackoff.js';
import { AppError } from '../../../../shared/middlewares/errorHandler.js';
import { BITRIX_FIELD_MAP_VERSION } from '../bitrixFieldMap.js';
import { BitrixDefinitiveError, callBitrix, getConnectionWebhookUrl } from './client.js';
import {
  ALL_EXTRACTION_ENTITIES,
  type BitrixExtractionEntity,
  EXTRACTION_ENTITY_SPECS,
  isExtractionEntity,
} from './extractionEntities.js';
import {
  buildXlsxWorkbook,
  deleteExtractionRunFiles,
  type ExtractionEntityDataset,
  type ExtractionFileFormat,
  readExtractionFile,
  toCsv,
  toJson,
  writeExtractionFile,
} from './extractionFiles.js';
import {
  type BitrixExtractionPeriod,
  EXTRACTION_PERIODS,
  InvalidExtractionPeriodError,
  type PeriodRange,
  resolvePeriodRange,
} from './extractionPeriod.js';
import {
  bitrixExtractionFailuresTotal,
  bitrixExtractionPartialTotal,
  bitrixExtractionRetriesTotal,
} from './metrics.js';

// ── Serviço real de Extrações Bitrix (Onda 7, Agente 06/06A) ───────────────────────────────────
//
// Constrói em cima do schema `BitrixExtractionRun` destravado pelo Agente 01A na Onda 6 (ver
// `.agents/handoffs/onda-6/01A-para-06-bitrix-extraction-run-schema.md`) — status/histórico
// persistidos no Postgres, retenção via `BITRIX_EXTRACTION_RETENTION_DAYS` (worker de expurgo
// continua DESLIGADO por padrão, fora do escopo desta rodada).
//
// Execução em segundo plano: SEM fila BullMQ dedicada. `worker.ts`/`server.ts` são arquivos
// compartilhados fora da propriedade deste agente nesta onda (ver matriz de propriedade em
// `.agents/runs/onda-7.md`) — registrar um `Worker` novo ali exigiria editar um arquivo de dono
// concorrente, o mesmo tipo de colisão que já aconteceu uma vez nesta base
// (`bitrixSync.worker.ts`, Onda 5, 06×07). Em vez disso, a extração roda "fire-and-forget" dentro
// do próprio processo HTTP, no mesmo padrão já estabelecido por `pushLeadToBitrix`
// (`outboundSync.ts`): a rota devolve a resposta assim que a linha `queued` é criada, e
// `void executeExtractionRun(...)` continua rodando depois disso, dentro do mesmo contexto de
// tenant (AsyncLocalStorage) capturado no momento da chamada. Isso não bloqueia a UI (item
// obrigatório da spec) mas tem uma limitação real, documentada em vez de escondida: uma extração
// em andamento NÃO sobrevive a um restart do processo HTTP (fica travada em "running" para sempre
// — ver `reconcileStuckRuns` abaixo). Migrar para um worker dedicado (mesmo padrão de
// `bitrixSync.worker.ts`) é a evolução natural, registrada como pendência no relatório da onda.

export interface CreateExtractionRunInput {
  connectionId: string;
  entities: string[];
  /** Campos selecionados por entidade — vazio/omitido para uma entidade = todos os campos (inclui UF_CRM_*). */
  fields?: Partial<Record<string, string[]>>;
  filters: {
    period: string;
    customFrom?: string;
    customTo?: string;
    /** Só se aplica a Negócios (pipeline). */
    categoryId?: string;
    /** Etapa (Negócio) ou status (Lead). */
    stageId?: string;
    /** Só se aplica a Leads e Negócios — Bitrix não expõe um "responsável" equivalente para Empresas/Contatos/Atividades/Usuários nesta API. */
    assignedById?: string;
    search?: string;
  };
}

interface StoredExtractionFilters {
  period: BitrixExtractionPeriod;
  customFrom?: string;
  customTo?: string;
  categoryId?: string;
  stageId?: string;
  assignedById?: string;
  search?: string;
}

interface ExtractionEntityProgress {
  entity: BitrixExtractionEntity;
  status: 'pending' | 'running' | 'done' | 'error';
  processed: number;
  pagesScanned: number;
  pagesExhausted: boolean;
  error?: string;
  /**
   * Checkpoint incremental (Onda 41, gap de auditoria "full-scan sem cursor persistido") — ISO
   * de `spec.dateField` (limite superior efetivamente usado nesta execução) gravado só quando a
   * entidade termina com `pagesExhausted: true` e sem cancelamento. Uma extração futura para a
   * MESMA conexão+entidade+preset de período lê este valor (ver `findEntityCheckpoint`) e
   * começa dali em vez de reprocessar o período inteiro de novo. Nunca gravado/lido para
   * `period: 'custom'` — período explícito do usuário sempre roda o intervalo pedido, sem
   * checkpoint (requisito 3 do handoff).
   */
  checkpointTo?: string;
  /** Presente só quando esta execução de fato retomou de um checkpoint anterior — valor ISO usado como `from` efetivo. Ausente = full-scan do período pedido (primeira vez, ou checkpoint não encontrado/aplicável). */
  resumedFrom?: string;
}

interface ExtractionFileMeta {
  format: ExtractionFileFormat;
  /** `null` = arquivo consolidado (todas as entidades, ver JSON/XLSX abaixo). CSV é sempre por entidade. */
  entity: string | null;
  filename: string;
  sizeBytes: number;
  generatedAt: string;
}

// Proteção contra loop infinito (item obrigatório da spec de extração) — 500 páginas de 50
// registros = até 25.000 registros por entidade numa única execução. Não é um teto de produto
// (uma organização grande pode ter mais que isso), é uma rede de segurança: se atingido,
// `pagesExhausted: false` fica registrado no progresso em vez de a extração rodar para sempre.
const PAGE_SAFETY_CAP = 500;

function resolveSelect(
  entity: BitrixExtractionEntity,
  fields: Partial<Record<string, string[]>>,
): string[] | undefined {
  if (entity === 'user') return undefined; // user.get não aceita `select` — sempre devolve o conjunto fixo de campos
  const requested = fields[entity];
  if (!requested || requested.length === 0) return ['*', 'UF_*']; // "extração completa": todos os campos, incluindo os personalizados
  return Array.from(new Set(['ID', ...requested]));
}

function buildFilter(
  entity: BitrixExtractionEntity,
  filters: StoredExtractionFilters,
  periodRange: PeriodRange | null,
): Record<string, unknown> {
  const spec = EXTRACTION_ENTITY_SPECS[entity];
  const filter: Record<string, unknown> = {};

  if (periodRange && spec.dateField) {
    filter[`>=${spec.dateField}`] = periodRange.from.toISOString();
    filter[`<=${spec.dateField}`] = periodRange.to.toISOString();
  }
  if (filters.search && spec.searchField) {
    filter[`%${spec.searchField}`] = filters.search;
  }
  // ASSIGNED_BY_ID só existe em Lead/Deal nesta API — aplicar a Empresa/Contato/Atividade/
  // Usuário seria um filtro que o Bitrix rejeitaria (campo inexistente = erro definitivo), não
  // um "sem efeito" silencioso. Documentado em CreateExtractionRunInput.filters.assignedById.
  if (filters.assignedById && (entity === 'lead' || entity === 'deal')) {
    filter.ASSIGNED_BY_ID = filters.assignedById;
  }
  if (entity === 'deal') {
    if (filters.categoryId) filter.CATEGORY_ID = filters.categoryId;
    if (filters.stageId) filter.STAGE_ID = filters.stageId;
  }
  if (entity === 'lead' && filters.stageId) {
    filter.STATUS_ID = filters.stageId;
  }
  return filter;
}

interface BitrixListResponse {
  result: Record<string, unknown>[];
  next?: number;
  total?: number;
}

/**
 * Quantas execuções recentes (mesma conexão, status terminal com dado utilizável) são inspecionadas
 * em busca de um checkpoint compatível. Um número pequeno é suficiente — o checkpoint que importa é
 * sempre o mais recente que bateu period+entidade; ir além disso só custaria uma leitura maior sem
 * ganho real (o histórico completo já está disponível via /extractions para auditoria manual).
 */
const CHECKPOINT_LOOKBACK = 10;

/**
 * Checkpoint incremental real (Onda 41) — antes desta mudança, `BitrixConnection.lastImportedAt`
 * existia no schema e era LIDO (`PrismaCommercialIntelligenceRepository`, métrica "última
 * sincronização") mas nunca ESCRITO por nenhum código deste repositório: puro metadado
 * informativo, não um cursor de verdade, e mesmo que fosse, é uma única data por CONEXÃO — não dá
 * pra representar 6 entidades com progresso independente (lead ≠ deal ≠ user...) num único campo.
 * Por isso o checkpoint fica em `BitrixExtractionRun.progress` (Json já existente, sem migration
 * nova), por conexão+entidade+preset de período.
 *
 * Só retoma de uma extração anterior BEM-SUCEDIDA (`status` completed/completed_partial — parcial
 * ainda conta se a ENTIDADE específica dentro dela esgotou o portal, mesmo que outra entidade da
 * mesma corrida tenha batido no teto de página) com o MESMO preset de período (`filters.period`
 * idêntico). `period: 'custom'` nunca participa — nem como origem nem como destino do lookup —
 * porque é sempre um pedido explícito do usuário (ex.: "últimos 7 dias" apontando para um intervalo
 * específico), e sobrepor isso com um cursor de uma execução anterior violaria exatamente o
 * requisito 3 do handoff (nunca sobrepor período explícito).
 */
async function findEntityCheckpoint(
  organizationId: string,
  connectionId: string,
  entity: BitrixExtractionEntity,
  period: BitrixExtractionPeriod,
  excludeRunId: string,
): Promise<Date | null> {
  if (period === 'custom') return null;
  if (!EXTRACTION_ENTITY_SPECS[entity].dateField) return null; // ex.: user — sem campo de data, sem cursor possível

  let candidates: Array<{ id: string; filters: unknown; progress: unknown }>;
  try {
    // `await` antes de qualquer encadeamento — se o mock/driver devolver `undefined` em vez de
    // uma Promise (comum em teste unitário sem stub explícito para esta chamada), encadear
    // `.catch` diretamente no retorno quebraria com "Cannot read properties of undefined".
    const rows = await prisma.bitrixExtractionRun.findMany({
      where: {
        id: { not: excludeRunId },
        organizationId,
        connectionId,
        status: { in: ['completed', 'completed_partial'] },
        entities: { has: entity },
      },
      orderBy: { completedAt: 'desc' },
      take: CHECKPOINT_LOOKBACK,
      select: { id: true, filters: true, progress: true },
    });
    candidates = rows ?? [];
  } catch (err: any) {
    logger.warn(
      { err, organizationId, connectionId, entity },
      '[bitrix] Falha ao buscar checkpoint incremental anterior — seguindo com full-scan do período pedido',
    );
    return null;
  }

  for (const candidate of candidates) {
    const candidateFilters = candidate.filters as Partial<StoredExtractionFilters> | null;
    if (!candidateFilters || candidateFilters.period !== period) continue;

    const progress = (candidate.progress as { entities?: ExtractionEntityProgress[] } | null)
      ?.entities;
    const entry = progress?.find((p) => p.entity === entity);
    if (entry?.status !== 'done' || !entry.pagesExhausted || !entry.checkpointTo) continue;

    const cursor = new Date(entry.checkpointTo);
    if (!Number.isNaN(cursor.getTime())) return cursor;
  }
  return null;
}

/**
 * Combina o período pedido (`base`) com o checkpoint encontrado: nunca começa ANTES do início
 * natural do preset pedido (ex.: um checkpoint de 10 dias atrás não faz "last7days" olhar além dos
 * 7 dias — o preset continua sendo o teto de alcance), só evita reprocessar o que já foi coberto por
 * uma execução anterior dentro dessa janela. `base: null` (preset "all") vira uma janela
 * `[checkpoint, anchorTo]` — a extração completa "all" original continua intacta, mas a PRÓXIMA
 * repetição do mesmo preset "all" passa a ser incremental de verdade.
 */
function applyCheckpoint(
  base: PeriodRange | null,
  checkpoint: Date | null,
  anchorTo: Date,
): PeriodRange | null {
  if (!checkpoint) return base;
  const to = base?.to ?? anchorTo;
  const from = base && base.from.getTime() > checkpoint.getTime() ? base.from : checkpoint;
  return { from, to };
}

let extractionBackoffDelayFn = (attempt: number) => computeBackoffDelayMs(attempt, 200, 2000);
let extractionSleepFn = sleep;

/**
 * TAREFA-SANEAMENTO-046: dorme `ms` ou retorna imediatamente se `signal` abortar — usado nos
 * backoffs de página/entidade para que um cancelamento não fique refém do tempo de espera.
 * `sleepFn` injetável em teste é preservado (a corrida é entre ele e o evento de abort).
 */
async function sleepOrAbort(
  ms: number,
  signal: AbortSignal | undefined,
  sleepFn: (ms: number) => Promise<void>,
): Promise<void> {
  if (!signal || signal.aborted) {
    if (signal?.aborted) return;
    return sleepFn(ms);
  }
  let onAbort: (() => void) | undefined;
  const aborted = new Promise<void>((resolve) => {
    onAbort = () => resolve();
    signal.addEventListener('abort', onAbort, { once: true });
  });
  await Promise.race([sleepFn(ms), aborted]);
  if (onAbort) signal.removeEventListener('abort', onAbort);
}

function isAbortError(err: unknown): boolean {
  return (
    typeof err === 'object' && err !== null && (err as { name?: string }).name === 'AbortError'
  );
}

/** Configura atraso de retentativa para testes unitários — permite eliminar waits reais. */
export function __setExtractionRetryDelayForTests(
  delayFn?: (attempt: number) => number,
  sleepFn?: (ms: number) => Promise<void>,
) {
  extractionBackoffDelayFn =
    delayFn ?? ((attempt: number) => computeBackoffDelayMs(attempt, 200, 2000));
  extractionSleepFn = sleepFn ?? sleep;
}

export const MAX_PAGE_RETRIES = 3;

async function extractEntityPages(
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
    // Cancelamento cooperativo (TAREFA-SANEAMENTO-046): checa ANTES de gastar uma chamada HTTP
    // — o `onPage` só roda depois da página chegar, então sem este check uma página extra sairia
    // mesmo com a extração já cancelada.
    if (signal?.aborted) {
      cancelled = true;
      break;
    }
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
        // Abort propagado pelo signal da execução — não é falha de página, é cancelamento.
        if (signal?.aborted || isAbortError(err)) {
          cancelled = true;
          break;
        }
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
        await sleepOrAbort(delay, signal, extractionSleepFn);
        pageAttempt++;
      }
    }

    if (cancelled) break; // abort no meio das retentativas — `data` ficou null de propósito

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

async function isCancelled(organizationId: string, runId: string): Promise<boolean> {
  const row = await prisma.bitrixExtractionRun.findFirst({
    where: { id: runId, organizationId },
    select: { status: true },
  });
  return row?.status === 'cancelled';
}

async function persistProgress(
  organizationId: string,
  runId: string,
  entities: ExtractionEntityProgress[],
  totalCount: number,
  countByEntity: Record<string, number>,
): Promise<void> {
  // `status: 'running'` no WHERE: se a linha já foi cancelada/marcada como falha por outra via
  // enquanto esta atualização estava em voo, não sobrescreve esse estado terminal com progresso
  // obsoleto.
  await prisma.bitrixExtractionRun
    .updateMany({
      where: { id: runId, organizationId, status: 'running' },
      data: {
        progress: { entities } as unknown as Prisma.InputJsonValue,
        totalCount,
        countByEntity: countByEntity as unknown as Prisma.InputJsonValue,
      },
    })
    .catch((err) =>
      logger.error(
        { err, organizationId, runId },
        '[bitrix] Falha ao gravar progresso da extração',
      ),
    );
}

async function failRun(
  organizationId: string,
  runId: string,
  message: string,
  entity: string,
): Promise<void> {
  bitrixExtractionFailuresTotal.inc({ tenant: organizationId, entity });
  await prisma.bitrixExtractionRun
    .updateMany({
      where: { id: runId, organizationId, status: 'running' },
      data: { status: 'failed', errorMessage: message, completedAt: new Date() },
    })
    .catch((err) =>
      logger.error(
        { err, organizationId, runId },
        '[bitrix] Falha ao gravar status de erro da extração',
      ),
    );
  logger.error({ organizationId, runId, entity, message }, '[bitrix] Extração falhou');
}

async function generateFiles(
  organizationId: string,
  runId: string,
  datasets: ExtractionEntityDataset[],
): Promise<ExtractionFileMeta[]> {
  const files: ExtractionFileMeta[] = [];
  const now = new Date().toISOString();

  for (const dataset of datasets) {
    const filename = `${dataset.entity}.csv`;
    const { sizeBytes } = await writeExtractionFile(
      organizationId,
      runId,
      filename,
      toCsv(dataset.rows),
    );
    files.push({ format: 'csv', entity: dataset.entity, filename, sizeBytes, generatedAt: now });
  }

  const jsonPayload = {
    generatedAt: now,
    entities: datasets.map((d) => ({ entity: d.entity, label: d.label, count: d.rows.length })),
    data: Object.fromEntries(datasets.map((d) => [d.entity, d.rows])),
  };
  const jsonFilename = 'extraction.json';
  const jsonMeta = await writeExtractionFile(
    organizationId,
    runId,
    jsonFilename,
    toJson(jsonPayload),
  );
  files.push({
    format: 'json',
    entity: null,
    filename: jsonFilename,
    sizeBytes: jsonMeta.sizeBytes,
    generatedAt: now,
  });

  const xlsxFilename = 'extraction.xlsx';
  const xlsxBuffer = await buildXlsxWorkbook(datasets);
  const xlsxMeta = await writeExtractionFile(organizationId, runId, xlsxFilename, xlsxBuffer);
  files.push({
    format: 'xlsx',
    entity: null,
    filename: xlsxFilename,
    sizeBytes: xlsxMeta.sizeBytes,
    generatedAt: now,
  });

  return files;
}

/**
 * Executor de segundo plano — chamado (sem `await`) por `createExtractionRun` logo depois de
 * criar a linha `queued`. Ver nota de arquitetura no topo do arquivo sobre por que isto não é um
 * worker BullMQ nesta rodada.
 */
export async function executeExtractionRun(organizationId: string, runId: string): Promise<void> {
  // Transição atômica queued -> running: se outra chamada concorrente (ou um cancelamento que
  // chegou antes de a linha sequer começar a rodar) já mudou o status, `count !== 1` e esta
  // execução simplesmente não faz nada — sem isso, duas chamadas quase simultâneas processariam
  // a mesma extração em paralelo (duplicando arquivos/contagens).
  const claimed = await prisma.bitrixExtractionRun.updateMany({
    where: { id: runId, organizationId, status: 'queued' },
    data: { status: 'running', startedAt: new Date(), attempts: { increment: 1 } },
  });
  if (claimed.count !== 1) return;

  const run = await prisma.bitrixExtractionRun.findFirst({ where: { id: runId, organizationId } });
  if (!run) return;

  const correlationId = run.correlationId || randomUUID();
  // TAREFA-SANEAMENTO-046: um AbortController por execução — todo `isCancelled` positivo aborta
  // o signal, que é propagado ao `callBitrix` (interrompe fetch em voo) e aos backoffs
  // (`sleepOrAbort`), em vez de esperar a página atual terminar de baixar.
  const abortController = new AbortController();
  const checkCancelled = async (): Promise<boolean> => {
    const cancelled = await isCancelled(organizationId, runId);
    if (cancelled) abortController.abort();
    return cancelled;
  };
  const entities = (run.entities as string[]).filter(isExtractionEntity);
  const fields = (run.fields as Partial<Record<string, string[]>> | null) ?? {};
  const filters = run.filters as unknown as StoredExtractionFilters;

  // Injetado explicitamente (em vez de deixar `resolvePeriodRange` usar seu próprio `new Date()`
  // default) para que o MESMO instante sirva de: (a) limite superior "to" do período e (b) âncora
  // do checkpoint gravado ao final para presets sem `to` natural (`period: 'all'`, `periodRange`
  // null) — ver `applyCheckpoint`/`checkpointTo` abaixo.
  const runNow = new Date();
  let periodRange: PeriodRange | null;
  try {
    periodRange = resolvePeriodRange(
      filters.period,
      { from: filters.customFrom, to: filters.customTo },
      runNow,
    );
  } catch (err: any) {
    await failRun(organizationId, runId, err instanceof Error ? err.message : String(err), 'run');
    return;
  }

  let webhookUrl: string;
  try {
    if (!run.connectionId) throw new AppError('Extração sem conexão Bitrix24 associada.', 400);
    webhookUrl = await getConnectionWebhookUrl(organizationId, run.connectionId);
  } catch (err: any) {
    await failRun(organizationId, runId, err instanceof Error ? err.message : String(err), 'run');
    return;
  }

  const datasets: ExtractionEntityDataset[] = [];
  const countByEntity: Record<string, number> = {};
  const progressEntities: ExtractionEntityProgress[] = entities.map((entity) => ({
    entity,
    status: 'pending',
    processed: 0,
    pagesScanned: 0,
    pagesExhausted: false,
  }));
  let totalCount = 0;
  let wasCancelled = false;
  // Entidades que pararam de paginar por causa do teto de segurança (`PAGE_SAFETY_CAP`), não por
  // terem esgotado o portal — bloqueador #12 de /AGENTS.md ("Extrações Bitrix incompletas
  // tratadas como recurso final"). Antes desta correção, isso só virava `logger.warn` (achado real
  // desta auditoria): a linha terminava com `status: 'completed'` idêntico a uma extração que de
  // fato esgotou o portal, sem nenhum sinal na tela nem métrica agregada.
  const incompleteEntities: string[] = [];

  for (const entity of entities) {
    if (await checkCancelled()) {
      wasCancelled = true;
      break;
    }

    const entry = progressEntities.find((p) => p.entity === entity);
    if (!entry) continue; // não deveria acontecer — entities e progressEntities vêm da mesma lista
    entry.status = 'running';
    await persistProgress(organizationId, runId, progressEntities, totalCount, countByEntity);

    const select = resolveSelect(entity, fields);

    // Checkpoint incremental: `run.connectionId` já foi validado como não-nulo acima (é
    // pré-requisito para termos `webhookUrl`), garantido pelo `throw` anterior a este loop.
    const checkpoint = await findEntityCheckpoint(
      organizationId,
      run.connectionId as string,
      entity,
      filters.period,
      runId,
    );
    const effectiveRange = applyCheckpoint(periodRange, checkpoint, runNow);
    if (checkpoint) {
      entry.resumedFrom = checkpoint.toISOString();
      logger.info(
        { organizationId, runId, entity, resumedFrom: entry.resumedFrom },
        '[bitrix] Extração retomando de checkpoint incremental — não reprocessando o período inteiro',
      );
    }
    const filter = buildFilter(entity, filters, effectiveRange);

    let entitySuccess = false;
    let entityAttempt = 1;
    const maxEntityAttempts = 2;

    while (entityAttempt <= maxEntityAttempts && !entitySuccess) {
      try {
        const { rows, pagesScanned, pagesExhausted, cancelled } = await extractEntityPages(
          organizationId,
          webhookUrl,
          entity,
          filter,
          select,
          correlationId,
          async (processedSoFar) => {
            entry.processed = processedSoFar;
            await persistProgress(
              organizationId,
              runId,
              progressEntities,
              totalCount + processedSoFar,
              countByEntity,
            );
            return checkCancelled();
          },
          abortController.signal,
        );

        entry.pagesScanned = pagesScanned;
        entry.pagesExhausted = pagesExhausted;
        entry.processed = rows.length;
        entry.status = cancelled ? 'pending' : 'done';
        countByEntity[entity] = rows.length;
        totalCount += rows.length;
        datasets.push({ entity, label: EXTRACTION_ENTITY_SPECS[entity].label, rows });

        // Só avança o checkpoint quando a entidade de fato esgotou o portal sem cancelamento —
        // uma entidade que bateu no teto de segurança (`pagesExhausted: false`) ainda tem
        // registros não vistos dentro do próprio período pedido; gravar um checkpoint aqui
        // faria uma futura retomada PULAR esses registros nunca lidos, não só evitar reler os
        // já lidos. Sem cursor gravado, a próxima execução compatível simplesmente refaz o
        // período inteiro de novo para essa entidade (mesmo comportamento de hoje).
        if (pagesExhausted && !cancelled) {
          entry.checkpointTo = (effectiveRange?.to ?? runNow).toISOString();
        }

        await persistProgress(organizationId, runId, progressEntities, totalCount, countByEntity);

        if (!pagesExhausted && !cancelled) {
          incompleteEntities.push(entity);
          bitrixExtractionPartialTotal.inc({ tenant: organizationId, entity });
          logger.warn(
            { organizationId, runId, entity, pagesScanned },
            '[bitrix] Extração atingiu o teto de segurança de páginas antes de esgotar o portal — contagem desta entidade é parcial',
          );
        }
        if (cancelled) {
          wasCancelled = true;
        }
        entitySuccess = true;
      } catch (err: any) {
        // Abort durante retry/backoff da entidade — cancelamento, não falha.
        if (abortController.signal.aborted || isAbortError(err)) {
          wasCancelled = true;
          break;
        }
        const isDefinitive =
          err instanceof BitrixDefinitiveError ||
          err?.statusCode === 401 ||
          err?.statusCode === 403 ||
          err?.statusCode === 400;

        if (isDefinitive || entityAttempt >= maxEntityAttempts || (await checkCancelled())) {
          entry.status = 'error';
          entry.error = err instanceof Error ? err.message : String(err);
          await persistProgress(organizationId, runId, progressEntities, totalCount, countByEntity);
          await failRun(organizationId, runId, entry.error, entity);
          return;
        }

        logger.warn(
          { organizationId, runId, entity, entityAttempt, maxEntityAttempts, err },
          '[bitrix] Falha transitória na entidade durante extração — retentando entidade inteira com backoff',
        );
        bitrixExtractionRetriesTotal.inc({ tenant: organizationId, entity });
        await sleepOrAbort(
          extractionBackoffDelayFn(entityAttempt),
          abortController.signal,
          extractionSleepFn,
        );
        entityAttempt++;
      }
    }

    if (wasCancelled) {
      break;
    }
  }

  if (wasCancelled) {
    logger.info(
      { organizationId, runId, correlationId },
      '[bitrix] Extração cancelada durante o processamento — nenhum arquivo gerado, contagem parcial preservada no histórico.',
    );
    return; // cancelExtractionRun já gravou status='cancelled'/cancelledAt — nada a sobrescrever aqui
  }

  // status='completed_partial' (valor de enum próprio — ver handoff
  // `.agents/handoffs/roadmap-v2-onda-1/06-para-01-status-extracao-parcial.md`, resolvido) sinaliza
  // que a extração terminou e gerou arquivo utilizável, mas não esgotou o portal para ao menos uma
  // entidade. `errorMessage` continua preenchido com o texto legível exibido na tela.
  const partialWarning =
    incompleteEntities.length > 0
      ? `Extração concluída, mas PARCIAL: ${incompleteEntities.map((e) => EXTRACTION_ENTITY_SPECS[e as BitrixExtractionEntity].label).join(', ')} atingiu o teto de segurança de páginas (${PAGE_SAFETY_CAP}) antes de esgotar o portal — pode haver mais registros no Bitrix24 além dos capturados nesta execução. Rode uma nova extração com um filtro de período mais estreito para cobrir o restante.`
      : null;

  try {
    const files = await generateFiles(organizationId, runId, datasets);
    await prisma.bitrixExtractionRun.update({
      where: { id: runId },
      data: {
        status: partialWarning ? 'completed_partial' : 'completed',
        completedAt: new Date(),
        totalCount,
        countByEntity: countByEntity as unknown as Prisma.InputJsonValue,
        progress: { entities: progressEntities } as unknown as Prisma.InputJsonValue,
        files: files as unknown as Prisma.InputJsonValue,
        errorMessage: partialWarning,
      },
    });
    if (partialWarning) {
      logger.warn(
        { organizationId, runId, correlationId, totalCount, incompleteEntities },
        '[bitrix] Extração concluída de forma PARCIAL — registrado em errorMessage para ficar visível na tela',
      );
    } else {
      logger.info(
        { organizationId, runId, correlationId, totalCount },
        '[bitrix] Extração concluída',
      );
    }
  } catch (err: any) {
    await failRun(organizationId, runId, err instanceof Error ? err.message : String(err), 'run');
  }
}

export async function createExtractionRun(
  organizationId: string,
  userId: string,
  input: CreateExtractionRunInput,
) {
  if (!input.connectionId) throw new AppError('Informe qual portal Bitrix24 extrair.', 400);
  await getConnectionWebhookUrl(organizationId, input.connectionId); // valida tenant + existência da conexão

  const entities = Array.from(new Set(input.entities || []));
  if (entities.length === 0)
    throw new AppError('Selecione ao menos uma entidade para extrair.', 400);
  const invalid = entities.filter((e) => !isExtractionEntity(e));
  if (invalid.length > 0) {
    throw new AppError(
      `Entidade(s) desconhecida(s): ${invalid.join(', ')}. Válidas: ${ALL_EXTRACTION_ENTITIES.join(', ')}.`,
      400,
    );
  }

  const period = input.filters?.period;
  if (!EXTRACTION_PERIODS.includes(period as BitrixExtractionPeriod)) {
    throw new AppError(`Período inválido. Válidos: ${EXTRACTION_PERIODS.join(', ')}.`, 400);
  }
  try {
    // Falha rápido (400 síncrono) em vez de só descobrir o período inválido na execução em
    // segundo plano, onde o único jeito de a pessoa saber seria reabrir o histórico.
    resolvePeriodRange(period as BitrixExtractionPeriod, {
      from: input.filters.customFrom,
      to: input.filters.customTo,
    });
  } catch (err: any) {
    if (err instanceof InvalidExtractionPeriodError) throw new AppError(err.message, 400);
    throw err;
  }

  const correlationId = randomUUID();
  const run = await prisma.bitrixExtractionRun.create({
    data: {
      organizationId,
      connectionId: input.connectionId,
      requestedBy: userId,
      entities,
      fields: (input.fields ?? {}) as unknown as Prisma.InputJsonValue,
      filters: input.filters as unknown as Prisma.InputJsonValue,
      status: 'queued',
      correlationId,
      schemaVersion: BITRIX_FIELD_MAP_VERSION,
    },
  });

  await AuditService.log({
    action: 'CREATE',
    entity: 'BitrixExtractionRun',
    entityId: run.id,
    tenantId: organizationId,
    afterState: { entities, connectionId: input.connectionId, period },
  });

  // Fire-and-forget dentro do próprio contexto de tenant da requisição (ver nota de arquitetura
  // no topo do arquivo) — mesmo padrão de `pushLeadToBitrix`. O `.catch` aqui é só uma rede de
  // segurança para um bug de programação genuíno (algo que escapou de todos os try/catch
  // internos de `executeExtractionRun`); o caminho normal de erro já grava status='failed'.
  void executeExtractionRun(organizationId, run.id).catch((err) => {
    logger.error(
      { err, organizationId, runId: run.id },
      '[bitrix] Execução da extração falhou de forma inesperada, fora do tratamento interno',
    );
  });

  return run;
}

export async function listExtractionRuns(organizationId: string, take = 50) {
  return prisma.bitrixExtractionRun.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(take, 1), 100),
  });
}

export async function getExtractionRun(organizationId: string, runId: string) {
  const run = await prisma.bitrixExtractionRun.findFirst({ where: { id: runId, organizationId } });
  if (!run) throw new AppError('Extração não encontrada.', 404);
  return run;
}

export async function cancelExtractionRun(organizationId: string, runId: string): Promise<void> {
  const { count } = await prisma.bitrixExtractionRun.updateMany({
    where: { id: runId, organizationId, status: { in: ['queued', 'running'] } },
    data: { status: 'cancelled', cancelledAt: new Date() },
  });
  if (count === 0) {
    const existing = await prisma.bitrixExtractionRun.findFirst({
      where: { id: runId, organizationId },
      select: { id: true },
    });
    if (!existing) throw new AppError('Extração não encontrada.', 404);
    throw new AppError('Esta extração já foi finalizada — não é possível cancelar.', 400);
  }
  await AuditService.log({
    action: 'UPDATE',
    entity: 'BitrixExtractionRun',
    entityId: runId,
    tenantId: organizationId,
    afterState: { status: 'cancelled' },
  });
}

/** Remove os arquivos gerados + a linha de histórico — a exclusão de uma extração precisa apagar o arquivo, não só o registro (ver handoff do schema, seção LGPD). */
export async function deleteExtractionRun(organizationId: string, runId: string): Promise<void> {
  const run = await prisma.bitrixExtractionRun.findFirst({
    where: { id: runId, organizationId },
    select: { id: true },
  });
  if (!run) throw new AppError('Extração não encontrada.', 404);
  await deleteExtractionRunFiles(organizationId, runId);
  await prisma.bitrixExtractionRun.delete({ where: { id: runId } });
  await AuditService.log({
    action: 'DELETE',
    entity: 'BitrixExtractionRun',
    entityId: runId,
    tenantId: organizationId,
  });
}

export async function downloadExtractionFile(
  organizationId: string,
  runId: string,
  format: ExtractionFileFormat,
  entity?: string,
): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
  const run = await prisma.bitrixExtractionRun.findFirst({ where: { id: runId, organizationId } });
  if (!run) throw new AppError('Extração não encontrada.', 404);
  if (run.status !== 'completed' && run.status !== 'completed_partial') {
    throw new AppError('Esta extração ainda não foi concluída — não há arquivo para baixar.', 400);
  }

  const files = (run.files as unknown as ExtractionFileMeta[] | null) ?? [];
  // CSV é sempre por entidade (uma aba não faz sentido fora de uma planilha); JSON/XLSX são
  // sempre o pacote consolidado — mesmo quando `entity` é passado por engano, ignora.
  const wantedEntity = format === 'csv' ? (entity ?? null) : null;
  const meta = files.find((f) => f.format === format && f.entity === wantedEntity);
  if (!meta) {
    throw new AppError(
      format === 'csv' && !entity
        ? 'Informe a entidade para baixar em CSV (um arquivo por entidade extraída).'
        : 'Arquivo não encontrado para este formato/entidade nesta extração.',
      400,
    );
  }

  const buffer = await readExtractionFile(organizationId, runId, meta.filename);
  if (!buffer) {
    throw new AppError(
      'Arquivo não está mais disponível neste servidor (armazenamento efêmero) — gere a extração novamente.',
      410,
    );
  }

  const contentType =
    format === 'csv'
      ? 'text/csv; charset=utf-8'
      : format === 'json'
        ? 'application/json; charset=utf-8'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return { buffer, filename: meta.filename, contentType };
}

/**
 * Retenta uma extração que falhou, foi cancelada ou terminou de forma parcial.
 * Valida autorização de tenant, limpa arquivos antigos, redefine status para 'queued',
 * registra auditoria e reinicia a execução em segundo plano.
 */
export async function retryExtractionRun(organizationId: string, runId: string) {
  const run = await prisma.bitrixExtractionRun.findFirst({
    where: { id: runId, organizationId },
  });
  if (!run) throw new AppError('Extração não encontrada.', 404);

  if (run.status === 'running' || run.status === 'queued') {
    throw new AppError('Esta extração já está em andamento ou na fila.', 400);
  }

  if (!run.connectionId) {
    throw new AppError('Extração sem conexão Bitrix24 associada.', 400);
  }
  // Valida que a conexão ainda existe e pertence à organização
  await getConnectionWebhookUrl(organizationId, run.connectionId);

  // Remove arquivos gerados anteriormente (se houver) para evitar inconsistência
  try {
    await deleteExtractionRunFiles(organizationId, runId);
  } catch (err) {
    logger.warn(
      { err, runId, organizationId },
      '[bitrix] Falha ao limpar arquivos anteriores antes do retry',
    );
  }

  const updatedRun = await prisma.bitrixExtractionRun.update({
    where: { id: runId },
    data: {
      status: 'queued',
      errorMessage: null,
      completedAt: null,
      cancelledAt: null,
      startedAt: null,
    },
  });

  await AuditService.log({
    action: 'UPDATE',
    entity: 'BitrixExtractionRun',
    entityId: runId,
    tenantId: organizationId,
    afterState: { status: 'queued', retry: true, previousAttempts: run.attempts },
  });

  bitrixExtractionRetriesTotal.inc({ tenant: organizationId, entity: 'run' });

  void executeExtractionRun(organizationId, runId).catch((err) => {
    logger.error(
      { err, organizationId, runId },
      '[bitrix] Retentativa da extração falhou de forma inesperada, fora do tratamento interno',
    );
  });

  return updatedRun;
}

export const DEFAULT_STUCK_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos
export const MAX_RUN_ATTEMPTS = 3;

/**
 * Reconcilia extrações que ficaram presas com status 'running'
 * (por exemplo, devido a reinício do processo HTTP, crash ou timeout).
 * Se a extração estiver presa por mais de stuckTimeoutMs:
 * - Se attempts < MAX_RUN_ATTEMPTS: reenfileira com status 'queued' para retry automático.
 * - Se attempts >= MAX_RUN_ATTEMPTS: marca como 'failed' com mensagem informativa.
 */
export async function reconcileStuckRuns(
  organizationId?: string,
  stuckTimeoutMs = DEFAULT_STUCK_TIMEOUT_MS,
): Promise<{ reconciledCount: number; retriedCount: number; failedCount: number }> {
  const cutoff = new Date(Date.now() - stuckTimeoutMs);
  const where: Prisma.BitrixExtractionRunWhereInput = {
    status: 'running',
    startedAt: { lte: cutoff },
    ...(organizationId ? { organizationId } : {}),
  };

  const stuckRuns = await prisma.bitrixExtractionRun.findMany({
    where,
    select: { id: true, organizationId: true, attempts: true, correlationId: true },
  });

  let retriedCount = 0;
  let failedCount = 0;

  for (const run of stuckRuns) {
    if ((run.attempts ?? 0) < MAX_RUN_ATTEMPTS) {
      await prisma.bitrixExtractionRun.update({
        where: { id: run.id },
        data: {
          status: 'queued',
          errorMessage: `Execução anterior interrompida (timeout ou reinício). Reenfileirada automaticamente (tentativa ${(run.attempts ?? 0) + 1} de ${MAX_RUN_ATTEMPTS}).`,
          startedAt: null,
        },
      });
      bitrixExtractionRetriesTotal.inc({ tenant: run.organizationId, entity: 'run' });
      void executeExtractionRun(run.organizationId, run.id);
      retriedCount++;
    } else {
      await failRun(
        run.organizationId,
        run.id,
        `Extração interrompida após ${run.attempts} tentativas (timeout ou reinício do servidor).`,
        'run',
      );
      failedCount++;
    }
  }

  return {
    reconciledCount: stuckRuns.length,
    retriedCount,
    failedCount,
  };
}

export type { BitrixExtractionEntity, BitrixExtractionPeriod };
export { ALL_EXTRACTION_ENTITIES, EXTRACTION_PERIODS };
