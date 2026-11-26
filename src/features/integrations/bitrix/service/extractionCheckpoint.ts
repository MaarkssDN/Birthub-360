import { logger } from '../../../../lib/logger.js';
import { prisma } from '../../../../lib/prisma.js';
import { type BitrixExtractionEntity, EXTRACTION_ENTITY_SPECS } from './extractionEntities.js';
import type { BitrixExtractionPeriod, PeriodRange } from './extractionPeriod.js';

// ── Checkpoint incremental das extrações Bitrix (extraído de extraction.ts — Onda
// consolidação-20261124, remediação do hotspot arquitetural) ──────────────────────────────────
//
// Cursor persistido por conexão+entidade+preset de período em `BitrixExtractionRun.progress`
// (Json já existente, sem migration). Este módulo só LÊ/grava a semântica do cursor — quem
// orquestra a execução continua em `extraction.ts`.

export interface StoredExtractionFilters {
  period: BitrixExtractionPeriod;
  customFrom?: string;
  customTo?: string;
  categoryId?: string;
  stageId?: string;
  assignedById?: string;
  search?: string;
}

export interface ExtractionEntityProgress {
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
export async function findEntityCheckpoint(
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
export function applyCheckpoint(
  base: PeriodRange | null,
  checkpoint: Date | null,
  anchorTo: Date,
): PeriodRange | null {
  if (!checkpoint) return base;
  const to = base?.to ?? anchorTo;
  const from = base && base.from.getTime() > checkpoint.getTime() ? base.from : checkpoint;
  return { from, to };
}
