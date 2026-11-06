import {
  buildXlsxWorkbook,
  type ExtractionEntityDataset,
  sanitizeSpreadsheetFormula,
  toCsv,
  toJson,
} from '../features/integrations/bitrix/service/extractionFiles.js';

export {
  buildXlsxWorkbook,
  type ExtractionEntityDataset,
  sanitizeSpreadsheetFormula,
  toCsv,
  toJson,
};

/**
 * Sanitiza uma célula individual contra CSV/Formula Injection (`=`, `+`, `-`, `@`, `\t`, `\r`)
 * e envolve em aspas duplas com escape RFC 4180 quando necessário.
 */
export function formatSafeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const raw = typeof value === 'object' ? JSON.stringify(value) : String(value);
  const sanitized = sanitizeSpreadsheetFormula(raw);
  return /[";,\n\r]/.test(sanitized) || sanitized.startsWith("'")
    ? `"${sanitized.replace(/"/g, '""')}"`
    : sanitized;
}
