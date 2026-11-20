import { describe, expect, it } from 'vitest';
import {
  validateBatchExtractionIntegrity,
  type BatchExtractionMetadata,
} from '../../../../src/lib/integrations/bitrix/batch/extractor.js';

describe('Bitrix24 Batch Extraction Integrity (B-12 Lino)', () => {
  it('marks batch as INCOMPLETE and alerts operator when extracted count is lower than expected', () => {
    const partialBatch: BatchExtractionMetadata = {
      batchId: 'batch-lead-001',
      organizationId: 'org-tenant-1',
      entityType: 'lead',
      expectedCount: 1000,
      extractedCount: 450, // Accidental premature exit
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
    };

    const result = validateBatchExtractionIntegrity(partialBatch);

    expect(result.isComplete).toBe(false);
    expect(result.status).toBe('INCOMPLETE');
    expect(result.missingCount).toBe(550);
    expect(result.metadata.status).toBe('INCOMPLETE');
    expect(result.metadata.completedAt).toBeDefined();
  });

  it('marks batch as COMPLETED when all expected records have been extracted', () => {
    const fullBatch: BatchExtractionMetadata = {
      batchId: 'batch-deal-002',
      organizationId: 'org-tenant-1',
      entityType: 'deal',
      expectedCount: 500,
      extractedCount: 500,
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
    };

    const result = validateBatchExtractionIntegrity(fullBatch);

    expect(result.isComplete).toBe(true);
    expect(result.status).toBe('COMPLETED');
    expect(result.missingCount).toBe(0);
    expect(result.metadata.status).toBe('COMPLETED');
  });
});
