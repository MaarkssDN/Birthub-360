import { Readable } from 'node:stream';

export interface CsvStreamParseOptions {
  /** Delimitador de colunas. Padrão: `,` */
  delimiter?: string;
  /** Quantidade máxima de linhas emitidas por lote (batch) quando `onBatch` é usado. Padrão: 500 */
  batchSize?: number;
  /** Quando true (padrão), ignora linhas completamente vazias. */
  skipEmptyLines?: boolean;
  /** Limite máximo de bytes por linha para evitar exaustão de buffer em arquivos malformados. Padrão: 1MB */
  maxLineBytes?: number;
}

export interface CsvParsedRow {
  /** Índice da linha de dados (1-based, após o cabeçalho). */
  rowNumber: number;
  /** Mapa `{ [header]: valor }` da linha. */
  record: Record<string, string>;
}

/**
 * Parser de linha CSV compatível com RFC 4180 (suporta campos entre aspas, delimitadores
 * internos e aspas escapadas `""`).
 */
export function parseCsvLine(line: string, delimiter = ','): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === '"' && current.length === 0) {
      inQuotes = true;
      continue;
    }

    if (ch === delimiter) {
      fields.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  fields.push(current.trim());
  return fields;
}

function hasUnclosedQuotes(fragment: string): boolean {
  let inQuotes = false;
  for (let i = 0; i < fragment.length; i++) {
    const ch = fragment[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < fragment.length && fragment[i + 1] === '"') {
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    }
  }
  return inQuotes;
}

/**
 * Converte uma entrada (`Readable` do Node, `AsyncIterable<Buffer | string>` ou `string`/`Buffer`
 * envolto em stream de chunks) em um `AsyncGenerator<CsvParsedRow>` que processa o CSV
 * incrementalmente sem carregar o arquivo inteiro em memória RAM (Agente 28 — Milo).
 */
export async function* parseCsvStream(
  source: Readable | AsyncIterable<Buffer | string>,
  options: CsvStreamParseOptions = {},
): AsyncGenerator<CsvParsedRow, void, undefined> {
  const delimiter = options.delimiter ?? ',';
  const skipEmptyLines = options.skipEmptyLines ?? true;
  const maxLineBytes = options.maxLineBytes ?? 1024 * 1024;
  const decoder = new TextDecoder('utf-8');

  let buffer = '';
  let headers: string[] | null = null;
  let rowNumber = 0;
  let firstChunk = true;

  const emitLine = (rawLine: string): CsvParsedRow | null => {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    if (skipEmptyLines && line.trim().length === 0) {
      return null;
    }

    const values = parseCsvLine(line, delimiter);
    if (!headers) {
      headers = values.map((h, idx) => h || `col_${idx + 1}`);
      return null;
    }

    rowNumber++;
    const record: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      record[headers[i]] = values[i] ?? '';
    }
    return { rowNumber, record };
  };

  for await (const rawChunk of source) {
    const chunkText =
      typeof rawChunk === 'string'
        ? rawChunk
        : decoder.decode(rawChunk, { stream: true });

    buffer += firstChunk ? chunkText.replace(/^\uFEFF/, '') : chunkText;
    firstChunk = false;

    if (buffer.length > maxLineBytes && !buffer.includes('\n')) {
      throw new Error(`Linha CSV excede o limite de segurança (${maxLineBytes} bytes).`);
    }

    let searchStart = 0;
    while (true) {
      const nlIndex = buffer.indexOf('\n', searchStart);
      if (nlIndex === -1) break;

      const candidate = buffer.slice(0, nlIndex);
      if (hasUnclosedQuotes(candidate)) {
        // Quebra de linha dentro de campo entre aspas — aguarda o fechamento.
        searchStart = nlIndex + 1;
        continue;
      }

      buffer = buffer.slice(nlIndex + 1);
      searchStart = 0;

      const parsed = emitLine(candidate);
      if (parsed) yield parsed;
    }
  }

  buffer += decoder.decode();
  if (buffer.length > 0) {
    const parsed = emitLine(buffer);
    if (parsed) yield parsed;
  }
}

/**
 * Consome um `Readable` de CSV em lotes (`batchSize`) aplicando backpressure natural do Node
 * stream: o próximo chunk só é lido quando a promise `onBatch` do lote atual resolve.
 */
export async function processCsvStreamInBatches(
  source: Readable | AsyncIterable<Buffer | string>,
  onBatch: (batch: CsvParsedRow[]) => Promise<void> | void,
  options: CsvStreamParseOptions = {},
): Promise<{ totalRows: number; batchesProcessed: number }> {
  const batchSize = Math.max(1, options.batchSize ?? 500);
  let batch: CsvParsedRow[] = [];
  let totalRows = 0;
  let batchesProcessed = 0;

  for await (const row of parseCsvStream(source, options)) {
    batch.push(row);
    totalRows++;
    if (batch.length >= batchSize) {
      await onBatch(batch);
      batchesProcessed++;
      batch = [];
    }
  }

  if (batch.length > 0) {
    await onBatch(batch);
    batchesProcessed++;
  }

  return { totalRows, batchesProcessed };
}
