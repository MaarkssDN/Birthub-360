/**
 * TAREFA-SANEAMENTO-052 (BT360-DT-0087) — Inventário ROPA automatizado e verificável.
 *
 * Gera `docs/lgpd/INVENTARIO_CAMPOS_PII.md` a partir de DUAS fontes de anotação de PII:
 *
 *  1. `src/lib/crypto/encryptedModelFields.ts` — fonte única de verdade dos campos
 *     cifrados em repouso (AES-256-GCM). Qualquer `Model.field` aqui DEVE existir no
 *     schema (drift schema↔código = falha).
 *  2. Comentários de documentação do `prisma/schema.prisma` que mencionam marcadores
 *     de dado pessoal (`dados pessoais`, `pii`, `cifrad`, `LGPD`, `titular`) — cobre
 *     campos pessoais NÃO cifrados (ex.: Contact.name), que também entram no ROPA.
 *
 * Uso:
 *   npx tsx scripts/lgpd/ropa-inventory.ts           # regenera o inventário
 *   npx tsx scripts/lgpd/ropa-inventory.ts --check   # falha (exit 1) se houver drift
 *
 * O artefato gerado é a evidência exportável para auditoria/RIPD; `--check` é o gate
 * de drift entre as anotações do schema/código e a documentação regulatória.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENCRYPTED_MODEL_FIELDS } from '../../src/lib/crypto/encryptedModelFields.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SCHEMA_PATH = resolve(ROOT, 'prisma/schema.prisma');
const OUT_PATH = resolve(ROOT, 'docs/lgpd/INVENTARIO_CAMPOS_PII.md');

const PII_COMMENT_MARKERS = [/dados pessoais/i, /\bpii\b/i, /cifrad/i, /lgpd/i, /titular/i];

interface SchemaField {
  name: string;
  type: string;
  doc: string;
}
interface SchemaModel {
  name: string;
  fields: SchemaField[];
}

function parseSchema(): Map<string, SchemaModel> {
  const src = readFileSync(SCHEMA_PATH, 'utf8');
  const models = new Map<string, SchemaModel>();
  let current: SchemaModel | null = null;
  let pendingDoc: string[] = [];

  for (const rawLine of src.split(/\r?\n/)) {
    const line = rawLine.trim();
    const modelMatch = /^model\s+(\w+)\s*\{/.exec(line);
    if (modelMatch) {
      current = { name: modelMatch[1], fields: [] };
      models.set(current.name, current);
      pendingDoc = [];
      continue;
    }
    if (current && line === '}') {
      current = null;
      continue;
    }
    if (!current) {
      // Comentários de documentação fora de model (/// ou //) — acumula para o próximo campo.
      if (/^(\/\/\/|\/\/)/.test(line)) pendingDoc.push(line.replace(/^\/\/\/?\s?/, ''));
      continue;
    }
    if (/^(\/\/\/|\/\/)/.test(line)) {
      pendingDoc.push(line.replace(/^\/\/\/?\s?/, ''));
      continue;
    }
    const fieldMatch = /^(\w+)\s+([\w[\]?]+)/.exec(line);
    if (fieldMatch) {
      current.fields.push({ name: fieldMatch[1], type: fieldMatch[2], doc: pendingDoc.join(' ') });
      pendingDoc = [];
    }
  }
  return models;
}

interface InventoryRow {
  model: string;
  field: string;
  type: string;
  encrypted: boolean;
  docSnippet: string;
}

function collectInventory(models: Map<string, SchemaModel>): {
  rows: InventoryRow[];
  errors: string[];
} {
  const errors: string[] = [];
  const rows: InventoryRow[] = [];

  // 1) Registro de cifragem em repouso — fonte de verdade do código.
  for (const [model, fields] of Object.entries(ENCRYPTED_MODEL_FIELDS)) {
    const schemaModel = models.get(model);
    if (!schemaModel) {
      errors.push(`ENCRYPTED_MODEL_FIELDS referencia model "${model}" ausente no schema.prisma`);
      continue;
    }
    for (const field of fields) {
      const schemaField = schemaModel.fields.find((f) => f.name === field);
      if (!schemaField) {
        errors.push(
          `ENCRYPTED_MODEL_FIELDS.${model} referencia campo "${field}" ausente no schema`,
        );
        continue;
      }
      rows.push({
        model,
        field,
        type: schemaField.type,
        encrypted: true,
        docSnippet: schemaField.doc.slice(0, 160),
      });
    }
  }

  // 2) Campos com anotação de dado pessoal nos comentários do schema (não cifrados).
  for (const model of models.values()) {
    for (const f of model.fields) {
      const isEncrypted = (ENCRYPTED_MODEL_FIELDS[model.name] ?? []).includes(f.name);
      if (isEncrypted) continue; // já coberto pela fonte 1
      if (f.doc && PII_COMMENT_MARKERS.some((re) => re.test(f.doc))) {
        rows.push({
          model: model.name,
          field: f.name,
          type: f.type,
          encrypted: false,
          docSnippet: f.doc.slice(0, 160),
        });
      }
    }
  }

  rows.sort((a, b) => a.model.localeCompare(b.model) || a.field.localeCompare(b.field));
  return { rows, errors };
}

function render(rows: InventoryRow[]): string {
  const lines: string[] = [
    '# Inventário de Campos com Dados Pessoais (ROPA técnico)',
    '',
    '> **GERADO AUTOMATICAMENTE** por `scripts/lgpd/ropa-inventory.ts` (TAREFA-SANEAMENTO-052).',
    '> Não editar à mão — rode `npx tsx scripts/lgpd/ropa-inventory.ts` para regenerar.',
    '> Gate de drift: `npx tsx scripts/lgpd/ropa-inventory.ts --check` falha se schema ou',
    '> `ENCRYPTED_MODEL_FIELDS` divergirem deste arquivo.',
    '',
    'Fontes: `prisma/schema.prisma` (anotações de PII em comentários) +',
    '`src/lib/crypto/encryptedModelFields.ts` (campos cifrados em repouso).',
    'Narrativa legal/finalidades/bases legais: ver `INVENTARIO_TRATAMENTO_ROPA.md` e',
    '`docs/lgpd-base-legal.md`.',
    '',
    `Total: ${rows.length} campos em ${new Set(rows.map((r) => r.model)).size} models.`,
    '',
    '| Model | Campo | Tipo | Cifrado em repouso | Anotação no schema |',
    '|---|---|---|---|---|',
  ];
  for (const r of rows) {
    const doc = r.docSnippet.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim() || '—';
    lines.push(`| ${r.model} | ${r.field} | ${r.type} | ${r.encrypted ? 'sim' : 'não'} | ${doc} |`);
  }
  lines.push('');
  return lines.join('\n');
}

function main(): void {
  const check = process.argv.includes('--check');
  const models = parseSchema();
  const { rows, errors } = collectInventory(models);

  for (const e of errors) {
    console.error(`[ropa-inventory] ERRO: ${e}`);
  }

  const content = render(rows);
  if (check) {
    let current = '';
    try {
      current = readFileSync(OUT_PATH, 'utf8');
    } catch {
      console.error(`[ropa-inventory] ERRO: ${OUT_PATH} não existe — rode sem --check para gerar`);
      process.exit(1);
    }
    const drift = current.replace(/\r\n/g, '\n') !== content;
    if (errors.length > 0 || drift) {
      console.error(
        `[ropa-inventory] DRIFT detectado: ${errors.length} erro(s) de referência, inventário ${drift ? 'desatualizado' : 'ok'}. Rode: npx tsx scripts/lgpd/ropa-inventory.ts`,
      );
      process.exit(1);
    }
    console.log(`[ropa-inventory] OK — ${rows.length} campos PII inventariados, sem drift.`);
    return;
  }

  if (errors.length > 0) {
    console.error(
      `[ropa-inventory] ${errors.length} erro(s) — inventário NÃO gravado (fail-closed).`,
    );
    process.exit(1);
  }
  writeFileSync(OUT_PATH, content, 'utf8');
  console.log(`[ropa-inventory] gravado: ${OUT_PATH} (${rows.length} campos)`);
}

main();
