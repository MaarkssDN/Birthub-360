import { sanitizeCsvCell } from '../../features/integrations/bitrix/service/extractionFiles.js';

/**
 * Sanitiza uma celula individual contra CSV/Formula Injection (`=`, `+`, `-`, `@`, `\t`, `\r`)
 * prefixando apostrofo e aplicando escape RFC 4180.
 */
export function formatSafeCsvCell(value: unknown): string {
  return sanitizeCsvCell(value);
}
