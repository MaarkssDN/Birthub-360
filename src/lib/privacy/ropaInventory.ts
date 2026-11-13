// src/lib/privacy/ropaInventory.ts
//
// Inventário ROPA automatizado e verificável de drift (TAREFA-SANEAMENTO-052 / BT360-DT-0087,
// handoff 00→21 onda-saneamento-20261110). Módulo PURO — sem I/O e sem imports de runtime —
// para ser usado tanto pelo script `scripts/lgpd/verify-ropa-drift.ts` quanto por testes
// unitários sem depender de env/Prisma.
//
// Fontes de verdade verificáveis:
//   1. `prisma/schema.prisma` — models e campos existentes (parse simples, só o necessário);
//   2. `ENCRYPTED_MODEL_FIELDS` (src/lib/crypto/encryptedModelFields.ts) — registro canônico
//      dos campos cifrados em repouso (AES-256-GCM) pela extensão do Prisma.
//
// O que este módulo NÃO cobre (declarado, não escondido): campos de PII em texto puro
// (ex.: `Contact.name`, `Lead.*`, `User.email`) não possuem registro máquina-legível hoje;
// a classificação por categoria/base legal continua na narrativa do ROPA
// (`docs/lgpd/INVENTARIO_TRATAMENTO_ROPA.md`). O anexo gerado cobre a parte verificável:
// todo campo declarado como cifrado DEVE existir no schema, e vice-versa é reportado
// quando um campo cifrado some do schema (drift).

export interface SchemaModelFields {
  /** Nome do model Prisma (ex.: "Contact"). */
  name: string;
  /** Nomes dos campos declarados no bloco `model X { ... }`. */
  fields: ReadonlySet<string>;
}

export interface EncryptedFieldEntry {
  model: string;
  field: string;
}

export interface RopaDriftIssue {
  kind: 'MODEL_MISSING' | 'FIELD_MISSING';
  model: string;
  field?: string;
  detail: string;
}

/**
 * Extrai `model Nome { ... }` do schema Prisma. Parser mínimo e determinístico: blocos de
 * model terminam na primeira linha que começa com `}` em coluna 0; linhas de diretiva
 * (`@@`), comentário (`//`, `///`) e vazias são ignoradas. Campos de relação contam como
 * campos — para verificação de drift isso é irrelevante (só campos escalares estão em
 * ENCRYPTED_MODEL_FIELDS), mas mantém o parser honesto sobre o que o schema declara.
 */
export function parsePrismaSchema(schemaSource: string): Map<string, SchemaModelFields> {
  const models = new Map<string, SchemaModelFields>();
  const modelRe = /^model\s+([A-Za-z_]\w*)\s*\{/gm;
  let match: RegExpExecArray | null;
  while ((match = modelRe.exec(schemaSource)) !== null) {
    const name = match[1];
    const bodyStart = match.index + match[0].length;
    const rest = schemaSource.slice(bodyStart);
    const endMatch = /^}/m.exec(rest);
    const body = endMatch ? rest.slice(0, endMatch.index) : rest;
    const fields = new Set<string>();
    for (const line of body.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) continue;
      const fieldMatch = /^([A-Za-z_]\w*)\s+/.exec(trimmed);
      if (fieldMatch) fields.add(fieldMatch[1]);
    }
    models.set(name, { name, fields });
  }
  return models;
}

/** Achata `ENCRYPTED_MODEL_FIELDS` em lista ordenada e determinística de entradas. */
export function listEncryptedFields(
  encryptedModelFields: Readonly<Record<string, readonly string[]>>,
): EncryptedFieldEntry[] {
  const entries: EncryptedFieldEntry[] = [];
  for (const model of Object.keys(encryptedModelFields).sort()) {
    for (const field of [...encryptedModelFields[model]].sort()) {
      entries.push({ model, field });
    }
  }
  return entries;
}

/**
 * Drift schema ↔ registro de cifra: todo model/campo declarado em ENCRYPTED_MODEL_FIELDS
 * precisa existir no schema Prisma. Model ou campo ausente significa que a extensão do
 * Prisma cifra um campo que não existe (config morta) ou — pior — que o model foi renomeado
 * e a proteção em repouso caiu silenciosamente.
 */
export function findSchemaDrift(
  encryptedModelFields: Readonly<Record<string, readonly string[]>>,
  schemaSource: string,
): RopaDriftIssue[] {
  const models = parsePrismaSchema(schemaSource);
  const issues: RopaDriftIssue[] = [];
  for (const entry of listEncryptedFields(encryptedModelFields)) {
    const model = models.get(entry.model);
    if (!model) {
      issues.push({
        kind: 'MODEL_MISSING',
        model: entry.model,
        field: entry.field,
        detail: `Model "${entry.model}" declarado em ENCRYPTED_MODEL_FIELDS não existe em prisma/schema.prisma`,
      });
      continue;
    }
    if (!model.fields.has(entry.field)) {
      issues.push({
        kind: 'FIELD_MISSING',
        model: entry.model,
        field: entry.field,
        detail: `Campo "${entry.model}.${entry.field}" declarado em ENCRYPTED_MODEL_FIELDS não existe no schema`,
      });
    }
  }
  return issues;
}

export const ROPA_GENERATED_START = '<!-- ROPA:GENERATED:START -->';
export const ROPA_GENERATED_END = '<!-- ROPA:GENERATED:END -->';

/**
 * Renderiza o anexo máquina-verificável do ROPA: tabela determinística (sem timestamp —
 * uma data aqui quebraria a comparação de drift a cada regeneração) dos campos com
 * proteção em repouso verificada em código.
 */
export function renderRopaModelsMarkdown(
  encryptedModelFields: Readonly<Record<string, readonly string[]>>,
): string {
  const lines: string[] = [
    ROPA_GENERATED_START,
    '',
    '### Anexo técnico gerado automaticamente — campos com cifra em repouso',
    '',
    'Gerado por `scripts/lgpd/verify-ropa-drift.ts` a partir de',
    '`src/lib/crypto/encryptedModelFields.ts` (fonte única) e `prisma/schema.prisma`.',
    'NÃO edite manualmente: altere a fonte e rode `npx tsx scripts/lgpd/verify-ropa-drift.ts --export`.',
    'A verificação de drift (`--check`, modo padrão) falha se este bloco divergir da fonte',
    'ou se algum model/campo declarado não existir no schema.',
    '',
    '| Model Prisma | Campos cifrados (AES-256-GCM, envelope `enc:v1:`) | Base da declaração |',
    '|---|---|---|',
  ];
  for (const model of Object.keys(encryptedModelFields).sort()) {
    const fields = [...encryptedModelFields[model]].sort().join(', ');
    lines.push(`| \`${model}\` | \`${fields}\` | \`ENCRYPTED_MODEL_FIELDS\` |`);
  }
  lines.push('', ROPA_GENERATED_END);
  return lines.join('\n');
}

/**
 * Extrai o bloco gerado de um documento markdown. Retorna `null` se os marcadores
 * estiverem ausentes, duplicados ou fora de ordem — o chamador deve tratar como drift.
 */
export function extractGeneratedBlock(document: string): string | null {
  const start = document.indexOf(ROPA_GENERATED_START);
  const end = document.indexOf(ROPA_GENERATED_END);
  if (start === -1 || end === -1 || end < start) return null;
  if (document.indexOf(ROPA_GENERATED_START, start + 1) !== -1) return null;
  if (document.indexOf(ROPA_GENERATED_END, end + 1) !== -1) return null;
  return document.slice(start, end + ROPA_GENERATED_END.length);
}

/**
 * Substitui (ou insere ao final) o bloco gerado no documento. Usado por `--export`.
 * Lança erro se os marcadores existirem de forma inválida (duplicados/fora de ordem),
 * para nunca corromper o documento silenciosamente.
 */
export function upsertGeneratedBlock(document: string, block: string): string {
  const start = document.indexOf(ROPA_GENERATED_START);
  const end = document.indexOf(ROPA_GENERATED_END);
  if (start === -1 && end === -1) {
    const sep = document.endsWith('\n') ? '\n' : '\n\n';
    return `${document}${sep}${block}\n`;
  }
  if (start === -1 || end === -1 || end < start) {
    throw new Error('Marcadores ROPA:GENERATED inválidos (ausentes, duplicados ou fora de ordem)');
  }
  if (
    document.indexOf(ROPA_GENERATED_START, start + 1) !== -1 ||
    document.indexOf(ROPA_GENERATED_END, end + 1) !== -1
  ) {
    throw new Error('Marcadores ROPA:GENERATED duplicados no documento');
  }
  return `${document.slice(0, start)}${block}${document.slice(end + ROPA_GENERATED_END.length)}`;
}
