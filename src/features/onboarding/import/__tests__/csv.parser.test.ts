import { Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import {
  type CsvParsedRow,
  parseCsvLine,
  parseCsvStream,
  processCsvStreamInBatches,
} from '../csv.parser.js';

describe('[28 · Milo] Parser de importação CSV por streaming de chunks (Node streams)', () => {
  it('processa chunks arbitrários fragmentados no meio de linhas e de campos entre aspas com CRLF e BOM', async () => {
    const chunks = [
      Buffer.from('\uFEFFnome,email,observacao\r\n"Maria, ', 'utf-8'),
      Buffer.from('Silva",maria@exemplo.com,"Linha 1\nLinha 2 com ""aspas"""\r\n', 'utf-8'),
      Buffer.from('Joao,joao@exemplo.com,Simples\r\n\r\n', 'utf-8'),
      Buffer.from('Ana,ana@exemplo.com,Final', 'utf-8'),
    ];

    const stream = Readable.from(chunks);
    const rows: CsvParsedRow[] = [];

    for await (const row of parseCsvStream(stream)) {
      rows.push(row);
    }

    expect(rows).toEqual([
      {
        rowNumber: 1,
        record: {
          nome: 'Maria, Silva',
          email: 'maria@exemplo.com',
          observacao: 'Linha 1\nLinha 2 com "aspas"',
        },
      },
      {
        rowNumber: 2,
        record: {
          nome: 'Joao',
          email: 'joao@exemplo.com',
          observacao: 'Simples',
        },
      },
      {
        rowNumber: 3,
        record: {
          nome: 'Ana',
          email: 'ana@exemplo.com',
          observacao: 'Final',
        },
      },
    ]);
  });

  it('emite lotes (batches) sob demanda respeitando batchSize sem acumular todas as linhas', async () => {
    async function* generateLargeCsvChunks() {
      yield 'id,email\n';
      for (let i = 1; i <= 25; i++) {
        yield `${i},lead${i}@birthhub.test\n`;
      }
    }

    const batchLengths: number[] = [];
    const result = await processCsvStreamInBatches(
      Readable.from(generateLargeCsvChunks()),
      async (batch) => {
        batchLengths.push(batch.length);
      },
      { batchSize: 10 },
    );

    expect(result).toEqual({ totalRows: 25, batchesProcessed: 3 });
    expect(batchLengths).toEqual([10, 10, 5]);
  });

  it('rejeita linha malformada que excede maxLineBytes sem quebra de linha (proteção contra OOM)', async () => {
    const oversizedStream = Readable.from(['col1,col2\n', 'a'.repeat(2048)]);

    await expect(async () => {
      for await (const _ of parseCsvStream(oversizedStream, { maxLineBytes: 512 })) {
        // deve lançar antes de emitir a linha gigante
      }
    }).rejects.toThrow(/limite de segurança/i);
  });

  it('suporta delimitador ponto-e-vírgula (padrão Excel PT-BR)', () => {
    expect(parseCsvLine('Lead 1;11999990000;"São Paulo; SP"', ';')).toEqual([
      'Lead 1',
      '11999990000',
      'São Paulo; SP',
    ]);
  });
});
