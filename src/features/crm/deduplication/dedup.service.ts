export interface CrmContactCandidate {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

/**
 * SQUAD40-48-DEDUP — estende o candidato puro com os campos que a detecção pontuada e o
 * planejador de merge precisam. `organizationId` é OBRIGATÓRIO aqui de propósito: toda
 * comparação/fusão é escopada por tenant — dois contatos de organizações diferentes com o
 * mesmo e-mail são clientes distintos, nunca duplicata (mesmo princípio documentado em
 * `deduplication.worker.ts`). `document` aceita CPF (11 dígitos) ou CNPJ (14 dígitos) em
 * qualquer máscara; `normalizeDocument` extrai só os dígitos.
 */
export interface ScoredCrmContact extends CrmContactCandidate {
  organizationId: string;
  document?: string | null;
}

export type DuplicateMatchReason =
  | 'EMAIL'
  | 'PHONE_E164'
  | 'DOCUMENT'
  | 'PHONETIC_NAME'
  | 'FUZZY_NAME';

export interface ScoredDuplicateMatch {
  primaryId: string;
  duplicateId: string;
  organizationId: string;
  /** Score de similaridade 0..1 — match exato de chave forte fica >= 0.9; fuzzy usa Jaro-Winkler. */
  score: number;
  reasons: DuplicateMatchReason[];
}

/** Scores fixos por tipo de evidência — quanto mais forte a chave, maior o score. */
const EXACT_MATCH_SCORES: Record<Exclude<DuplicateMatchReason, 'FUZZY_NAME'>, number> = {
  EMAIL: 1,
  DOCUMENT: 0.98,
  PHONE_E164: 0.95,
  PHONETIC_NAME: 0.9,
};

/** Limiar default para casar nomes "parecidos" (ex.: acento/grafia divergente). */
export const DEFAULT_FUZZY_NAME_THRESHOLD = 0.92;

export function normalizePhoneToE164(
  rawPhone: string | null | undefined,
  defaultCountryCode: string = '55',
): string | null {
  if (!rawPhone) return null;
  const digits = rawPhone.replace(/\D+/g, '');
  if (digits.length < 10) return null;
  if (digits.startsWith(defaultCountryCode) && digits.length >= 12) {
    return `+${digits}`;
  }
  return `+${defaultCountryCode}${digits}`;
}

export function computePhoneticKeyPtBr(rawName: string): string {
  return rawName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/PH/g, 'F')
    .replace(/Y/g, 'I')
    .replace(/W/g, 'V')
    .replace(/Z/g, 'S')
    .replace(/([A-Z])\1+/g, '$1')
    .replace(/[^A-Z0-9 ]/g, '')
    .trim();
}

export function detectDuplicateCrmContacts(
  contacts: readonly CrmContactCandidate[],
): { primaryId: string; duplicateId: string; reason: 'EMAIL' | 'PHONE_E164' | 'PHONETIC_NAME' }[] {
  const duplicates: {
    primaryId: string;
    duplicateId: string;
    reason: 'EMAIL' | 'PHONE_E164' | 'PHONETIC_NAME';
  }[] = [];

  const byEmail = new Map<string, string>();
  const byPhone = new Map<string, string>();
  const byPhonetic = new Map<string, string>();

  for (const c of contacts) {
    const cleanEmail = c.email?.trim().toLowerCase();
    const e164 = normalizePhoneToE164(c.phone);
    const phonetic = computePhoneticKeyPtBr(c.name);

    if (cleanEmail && byEmail.has(cleanEmail)) {
      duplicates.push({
        primaryId: byEmail.get(cleanEmail)!,
        duplicateId: c.id,
        reason: 'EMAIL',
      });
      continue;
    }
    if (e164 && byPhone.has(e164)) {
      duplicates.push({
        primaryId: byPhone.get(e164)!,
        duplicateId: c.id,
        reason: 'PHONE_E164',
      });
      continue;
    }
    if (phonetic && byPhonetic.has(phonetic)) {
      duplicates.push({
        primaryId: byPhonetic.get(phonetic)!,
        duplicateId: c.id,
        reason: 'PHONETIC_NAME',
      });
      continue;
    }

    if (cleanEmail) byEmail.set(cleanEmail, c.id);
    if (e164) byPhone.set(e164, c.id);
    if (phonetic) byPhonetic.set(phonetic, c.id);
  }

  return duplicates;
}

/**
 * Normaliza CPF/CNPJ para dígitos puros. Retorna `null` quando o documento não tem
 * comprimento válido (CPF=11, CNPJ=14) — validação de dígito verificador fica fora do
 * escopo desta camada (detecção, não verificação fiscal).
 */
export function normalizeDocument(rawDocument: string | null | undefined): string | null {
  if (!rawDocument) return null;
  const digits = rawDocument.replace(/\D+/g, '');
  if (digits.length === 11 || digits.length === 14) return digits;
  return null;
}

/** Normalização para comparação fuzzy de nomes: minúsculas, sem acento, só [a-z0-9 ]. */
function normalizeNameForSimilarity(rawName: string): string {
  return rawName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Similaridade de Jaro-Winkler (0..1) sobre strings já normalizadas. Usada só como sinal
 * fraco de detecção — nunca como critério único de merge automático.
 */
export function jaroWinklerSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const matchDistance = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const aMatches = new Array<boolean>(a.length).fill(false);
  const bMatches = new Array<boolean>(b.length).fill(false);

  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }
  transpositions /= 2;

  const jaro = (matches / a.length + matches / b.length + (matches - transpositions) / matches) / 3;

  // Prefixo comum até 4 caracteres recebe boost (Winkler).
  let prefix = 0;
  const maxPrefix = Math.min(4, a.length, b.length);
  while (prefix < maxPrefix && a[prefix] === b[prefix]) prefix++;

  return jaro + prefix * 0.1 * (1 - jaro);
}

/**
 * Detecta pares de contatos duplicados DENTRO de um mesmo tenant, com score e razões.
 *
 * Diferenças em relação a `detectDuplicateCrmContacts` (mantida intacta por compatibilidade):
 * - exige `organizationId` em cada candidato e NUNCA cruza tenants (as chaves dos mapas são
 *   prefixadas por tenant);
 * - adiciona `document` (CPF/CNPJ normalizado) como chave forte;
 * - adiciona match fuzzy de nome via Jaro-Winkler quando nenhuma chave exata bate
 *   (`FUZZY_NAME`, só reportado se `score >= fuzzyNameThreshold`);
 * - cada par carrega `score` + `reasons` para priorização/auditoria na UI de merge.
 *
 * Complexidade: chaves exatas são O(n); o fuzzy é O(n²) limitado por bucket de inicial do
 * nome normalizado por tenant — aceitável para lotes de preview/varredura de higiene.
 */
export function detectScoredDuplicates(
  contacts: readonly ScoredCrmContact[],
  options?: { fuzzyNameThreshold?: number },
): ScoredDuplicateMatch[] {
  const fuzzyThreshold = options?.fuzzyNameThreshold ?? DEFAULT_FUZZY_NAME_THRESHOLD;
  const matches: ScoredDuplicateMatch[] = [];

  const byEmail = new Map<string, ScoredCrmContact>();
  const byPhone = new Map<string, ScoredCrmContact>();
  const byDocument = new Map<string, ScoredCrmContact>();
  const byPhonetic = new Map<string, ScoredCrmContact>();
  const fuzzyBuckets = new Map<string, ScoredCrmContact[]>();

  const tenantKey = (org: string, value: string) => `${org}${value}`;
  const fuzzyBucketKey = (org: string, normalizedName: string) =>
    `${org}|${normalizedName.charAt(0)}`;

  const scoreFor = (reasons: DuplicateMatchReason[]): number => {
    let best = 0;
    for (const reason of reasons) {
      if (reason !== 'FUZZY_NAME') best = Math.max(best, EXACT_MATCH_SCORES[reason]);
    }
    return best;
  };

  for (const c of contacts) {
    const cleanEmail = c.email?.trim().toLowerCase() || null;
    const e164 = normalizePhoneToE164(c.phone);
    const document = normalizeDocument(c.document);
    const phonetic = computePhoneticKeyPtBr(c.name);
    const normalizedName = normalizeNameForSimilarity(c.name);

    // Coleta TODAS as chaves exatas que batem com um registro já visto do mesmo tenant —
    // um par pode ter e-mail E telefone iguais; registrar as duas razões melhora a auditoria.
    const reasons: DuplicateMatchReason[] = [];
    let primary: ScoredCrmContact | undefined;

    if (cleanEmail) {
      const hit = byEmail.get(tenantKey(c.organizationId, cleanEmail));
      if (hit) {
        primary ??= hit;
        reasons.push('EMAIL');
      }
    }
    if (e164) {
      const hit = byPhone.get(tenantKey(c.organizationId, e164));
      if (hit) {
        primary ??= hit;
        reasons.push('PHONE_E164');
      }
    }
    if (document) {
      const hit = byDocument.get(tenantKey(c.organizationId, document));
      if (hit) {
        primary ??= hit;
        reasons.push('DOCUMENT');
      }
    }
    if (phonetic) {
      const hit = byPhonetic.get(tenantKey(c.organizationId, phonetic));
      if (hit) {
        primary ??= hit;
        reasons.push('PHONETIC_NAME');
      }
    }

    let fuzzyScore = 0;
    if (!primary && normalizedName.length >= 4 && phonetic) {
      const bucket = fuzzyBuckets.get(fuzzyBucketKey(c.organizationId, normalizedName)) ?? [];
      for (const seen of bucket) {
        const sim = jaroWinklerSimilarity(normalizedName, normalizeNameForSimilarity(seen.name));
        if (sim >= fuzzyThreshold && sim > fuzzyScore) {
          fuzzyScore = sim;
          primary = seen;
        }
      }
      if (primary) reasons.push('FUZZY_NAME');
    }

    if (primary && reasons.length > 0) {
      const score = reasons.includes('FUZZY_NAME')
        ? Math.max(scoreFor(reasons), fuzzyScore)
        : scoreFor(reasons);
      matches.push({
        primaryId: primary.id,
        duplicateId: c.id,
        organizationId: c.organizationId,
        score,
        reasons,
      });
      continue;
    }

    if (cleanEmail) byEmail.set(tenantKey(c.organizationId, cleanEmail), c);
    if (e164) byPhone.set(tenantKey(c.organizationId, e164), c);
    if (document) byDocument.set(tenantKey(c.organizationId, document), c);
    if (phonetic) byPhonetic.set(tenantKey(c.organizationId, phonetic), c);
    if (normalizedName.length >= 4) {
      const key = fuzzyBucketKey(c.organizationId, normalizedName);
      const bucket = fuzzyBuckets.get(key);
      if (bucket) bucket.push(c);
      else fuzzyBuckets.set(key, [c]);
    }
  }

  return matches;
}

/* ------------------------------------------------------------------------- */
/* Planejador de merge (dry-run) — função pura, sem I/O, sem delete físico.   */
/* ------------------------------------------------------------------------- */

export interface MergeableContactSnapshot {
  id: string;
  organizationId: string;
  /** Campos escalares candidatos a mesclagem (name, email, phone, document, ...). */
  fields: Record<string, string | null | undefined>;
}

export interface PlannedMergedField {
  field: string;
  /** Valor resultante no registro sobrevivente após o merge. */
  value: string | null;
  /** Origem do valor: campo do sobrevivente, resgatado do duplicado, ou ambos vazios. */
  source: 'primary' | 'duplicate' | 'empty';
  /** true quando ambos tinham valores diferentes — o do sobrevivente vence e o conflito é auditado. */
  conflict: boolean;
}

export interface ContactMergePlan {
  survivorId: string;
  duplicateId: string;
  organizationId: string;
  /** Campos mesclados em ordem alfabética determinística. */
  fields: PlannedMergedField[];
  /** Nomes dos campos que entraram em conflito (ambos preenchidos, valores divergentes). */
  conflicts: string[];
  /** Payload pronto para trilha de auditoria — o executor real deve persistir isto. */
  audit: {
    action: 'CRM_CONTACT_MERGE_PLAN';
    organizationId: string;
    survivorId: string;
    duplicateId: string;
    conflictCount: number;
    filledFromDuplicate: string[];
  };
}

const isBlank = (v: string | null | undefined): v is null | undefined | '' =>
  v === null || v === undefined || v.trim() === '';

/**
 * Planeja a fusão segura de um par de contatos duplicados — SOMENTE dry-run: nenhum dado é
 * escrito e nenhum registro é apagado. Regras de resolução de campo (nunca perda silenciosa):
 *
 * 1. Ambos vazios → resultado vazio (`source: 'empty'`).
 * 2. Só o duplicado tem valor → valor resgatado (`source: 'duplicate'`) — dado nunca se perde.
 * 3. Ambos têm valor igual (após trim) → mantém o do sobrevivente, sem conflito.
 * 4. Ambos têm valor divergente → CONFLITO: o valor do sobrevivente vence
 *    (`source: 'primary'`, `conflict: true`) e o campo entra em `conflicts`/`audit` para
 *    revisão humana — a decisão de sobrescrever nunca é silenciosa.
 *
 * Guarda de tenancy: `primary` e `duplicate` precisam pertencer ao mesmo `organizationId`;
 * caso contrário lança erro — fusão cross-tenant é proibida.
 */
export function planContactMerge(
  primary: MergeableContactSnapshot,
  duplicate: MergeableContactSnapshot,
): ContactMergePlan {
  if (primary.organizationId !== duplicate.organizationId) {
    throw new Error(
      `planContactMerge: cross-tenant merge blocked (primary org ${primary.organizationId}, duplicate org ${duplicate.organizationId})`,
    );
  }
  if (primary.id === duplicate.id) {
    throw new Error('planContactMerge: cannot merge a contact into itself');
  }

  const fieldNames = Array.from(
    new Set([...Object.keys(primary.fields), ...Object.keys(duplicate.fields)]),
  ).sort();

  const fields: PlannedMergedField[] = [];
  const conflicts: string[] = [];
  const filledFromDuplicate: string[] = [];

  for (const field of fieldNames) {
    const primaryValue = primary.fields[field];
    const duplicateValue = duplicate.fields[field];
    // Trim único por campo: blank (null/undefined/vazio/espaços) vira null aqui.
    const pTrim = isBlank(primaryValue) ? null : primaryValue.trim();
    const dTrim = isBlank(duplicateValue) ? null : duplicateValue.trim();

    if (pTrim === null && dTrim === null) {
      fields.push({ field, value: null, source: 'empty', conflict: false });
    } else if (pTrim === null) {
      fields.push({ field, value: dTrim, source: 'duplicate', conflict: false });
      filledFromDuplicate.push(field);
    } else if (dTrim === null || pTrim === dTrim) {
      fields.push({ field, value: pTrim, source: 'primary', conflict: false });
    } else {
      fields.push({ field, value: pTrim, source: 'primary', conflict: true });
      conflicts.push(field);
    }
  }

  return {
    survivorId: primary.id,
    duplicateId: duplicate.id,
    organizationId: primary.organizationId,
    fields,
    conflicts,
    audit: {
      action: 'CRM_CONTACT_MERGE_PLAN',
      organizationId: primary.organizationId,
      survivorId: primary.id,
      duplicateId: duplicate.id,
      conflictCount: conflicts.length,
      filledFromDuplicate,
    },
  };
}
