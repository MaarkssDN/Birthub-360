/**
 * Bitrix24 Batch Extraction Integrity & Completion Validator
 * Bloqueador B-12: Validar contagem esperada de registros em extrações batch da Bitrix contra término acidental.
 * Squad 50 — Lino (Extrações Batch e Paginação Bitrix24)
 *
 * Cargas em lote que terminam com contagem inferior à esperada são marcadas com status INCOMPLETE
 * e disparam alerta crítico para impedir que o pipeline processe uma base incompleta/truncada.
 */

import { logger } from '../../../logger.js';

export type BatchExtractionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'INCOMPLETE';

export interface BatchExtractionMetadata {
  batchId: string;
  organizationId: string;
  entityType: 'lead' | 'deal' | 'contact' | 'company';
  expectedCount: number;
  extractedCount: number;
  status: BatchExtractionStatus;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export class PartialBatchExtractionError extends Error {
  public readonly batchId: string;
  public readonly expected: number;
  public readonly actual: number;
  public readonly missing: number;

  constructor(batchId: string, expected: number, actual: number) {
    const missing = expected - actual;
    super(
      `ALERTA B-12 [Lino]: Extração em lote '${batchId}' incompleta! Esperados: ${expected}, Extraídos: ${actual} (${missing} registros ausentes).`,
    );
    this.name = 'PartialBatchExtractionError';
    this.batchId = batchId;
    this.expected = expected;
    this.actual = actual;
    this.missing = missing;
  }
}

export interface BatchValidationResult {
  isComplete: boolean;
  status: BatchExtractionStatus;
  missingCount: number;
  metadata: BatchExtractionMetadata;
}

/**
 * Valida a integridade da extração em lote comparando a contagem de registros coletados contra o total esperado da Bitrix.
 */
export function validateBatchExtractionIntegrity(
  batch: BatchExtractionMetadata,
): BatchValidationResult {
  const missingCount = Math.max(0, batch.expectedCount - batch.extractedCount);

  if (batch.extractedCount < batch.expectedCount) {
    batch.status = 'INCOMPLETE';
    batch.completedAt = new Date().toISOString();

    logger.error(
      {
        batchId: batch.batchId,
        organizationId: batch.organizationId,
        entityType: batch.entityType,
        expected: batch.expectedCount,
        actual: batch.extractedCount,
        missing: missingCount,
      },
      'ALERTA DE INTEGRIDADE [B-12 Lino]: Extração batch Bitrix24 terminou acidentalmente com dados parciais. Marcado como INCOMPLETE.',
    );

    return {
      isComplete: false,
      status: 'INCOMPLETE',
      missingCount,
      metadata: batch,
    };
  }

  batch.status = 'COMPLETED';
  batch.completedAt = new Date().toISOString();

  logger.info(
    {
      batchId: batch.batchId,
      organizationId: batch.organizationId,
      totalCount: batch.extractedCount,
    },
    'Bitrix24 Batch: extração finalizada com 100% dos registros esperados.',
  );

  return {
    isComplete: true,
    status: 'COMPLETED',
    missingCount: 0,
    metadata: batch,
  };
}
