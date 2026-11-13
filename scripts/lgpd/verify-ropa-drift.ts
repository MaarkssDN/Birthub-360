// scripts/lgpd/verify-ropa-drift.ts
//
// Verificação de drift do ROPA (TAREFA-SANEAMENTO-052 / BT360-DT-0087): garante que o
// inventário de tratamento de dados (`docs/lgpd/INVENTARIO_TRATAMENTO_ROPA.md`) permanece
// sincronizado com as fontes máquina-legíveis de proteção de PII:
//
//   1. `src/lib/crypto/encryptedModelFields.ts` — campos cifrados em repouso (AES-256-GCM);
//   2. `prisma/schema.prisma` — models/campos realmente existentes.
//
// Uso:
//   npx tsx scripts/lgpd/verify-ropa-drift.ts            # check (padrão): falha (exit 1) em drift
//   npx tsx scripts/lgpd/verify-ropa-drift.ts --export   # regenera o anexo no ROPA
//
// O anexo gerado vive entre os marcadores `<!-- ROPA:GENERATED:START/END -->` no documento
// do ROPA — nunca edite esse bloco à mão.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENCRYPTED_MODEL_FIELDS } from '../../src/lib/crypto/encryptedModelFields.js';
import {
  extractGeneratedBlock,
  findSchemaDrift,
  renderRopaModelsMarkdown,
  upsertGeneratedBlock,
} from '../../src/lib/privacy/ropaInventory.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCHEMA_PATH = join(ROOT, 'prisma', 'schema.prisma');
const ROPA_PATH = join(ROOT, 'docs', 'lgpd', 'INVENTARIO_TRATAMENTO_ROPA.md');

function main(): void {
  const mode = process.argv[2];
  if (mode !== undefined && mode !== '--export') {
    console.error(`Argumento desconhecido: ${mode}. Uso: [--export]`);
    process.exit(2);
  }

  const schemaSource = readFileSync(SCHEMA_PATH, 'utf8');
  const ropaDocument = readFileSync(ROPA_PATH, 'utf8');
  const generated = renderRopaModelsMarkdown(ENCRYPTED_MODEL_FIELDS);

  if (mode === '--export') {
    const updated = upsertGeneratedBlock(ropaDocument, generated);
    if (updated === ropaDocument) {
      console.log('[ropa-drift] Anexo já está sincronizado — nada a exportar.');
      return;
    }
    writeFileSync(ROPA_PATH, updated, 'utf8');
    console.log(`[ropa-drift] Anexo regenerado em ${ROPA_PATH}`);
    return;
  }

  const issues: string[] = [];

  // 1. Drift schema ↔ registro de cifra em repouso.
  for (const issue of findSchemaDrift(ENCRYPTED_MODEL_FIELDS, schemaSource)) {
    issues.push(`[schema-drift] ${issue.detail}`);
  }

  // 2. Drift documento ↔ fonte gerada.
  const committed = extractGeneratedBlock(ropaDocument);
  if (committed === null) {
    issues.push(
      '[doc-drift] Marcadores ROPA:GENERATED ausentes ou inválidos em docs/lgpd/INVENTARIO_TRATAMENTO_ROPA.md — rode: npx tsx scripts/lgpd/verify-ropa-drift.ts --export',
    );
  } else if (committed.trim() !== generated.trim()) {
    issues.push(
      '[doc-drift] Anexo gerado do ROPA diverge da fonte (ENCRYPTED_MODEL_FIELDS/schema). Rode: npx tsx scripts/lgpd/verify-ropa-drift.ts --export',
    );
  }

  if (issues.length > 0) {
    console.error('[ropa-drift] FALHOU — divergências encontradas:');
    for (const issue of issues) console.error(`  - ${issue}`);
    process.exit(1);
  }

  const fieldCount = Object.values(ENCRYPTED_MODEL_FIELDS).reduce((n, f) => n + f.length, 0);
  console.log(
    `[ropa-drift] OK — ${Object.keys(ENCRYPTED_MODEL_FIELDS).length} models / ${fieldCount} campos cifrados conferem com o schema e o ROPA está sincronizado.`,
  );
}

main();
