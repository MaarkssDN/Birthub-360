/**
 * Settings por pilar — domínio compartilhado (isomórfico: usado pelo servidor
 * em src/features/settings/services e pelo cliente em PillarSettingsPlaceholder).
 *
 * Persistência: uma linha de `Setting` por organização (userId = null) com
 * `key = settings.pilar.<slug>` e `value` JSON `{ version, values, ... }` —
 * mesmo padrão de `organization.modules` (ver
 * src/features/organization-modules/infra/SettingOrganizationModulesRepository.ts
 * e src/lib/voice-hub/repositories/settingRepository.ts). Sem mudança de schema.
 */

export const PILLAR_SLUGS = [
  'hub',
  'market',
  'sales',
  'performance',
  'predictability',
  'ai',
  'automation',
  'engagement',
] as const;

export type PillarSlug = (typeof PILLAR_SLUGS)[number];

/** Nomes exibidos em App.tsx (prop `pillarName` do PillarSettingsPlaceholder). */
export const PILLAR_NAME_TO_SLUG: Record<string, PillarSlug> = {
  'Hub Comercial': 'hub',
  'Inteligência de Mercado': 'market',
  'Orquestração de Vendas': 'sales',
  'Performance Comercial': 'performance',
  'Previsibilidade Comercial': 'predictability',
  'Inteligência Artificial': 'ai',
  'Automação & Conectividade': 'automation',
  'Engajamento Comercial': 'engagement',
};

export const PILLAR_SETTING_KEY_PREFIX = 'settings.pilar.';

export function pillarSettingKey(slug: PillarSlug): string {
  return `${PILLAR_SETTING_KEY_PREFIX}${slug}`;
}

export function isPillarSlug(value: string): value is PillarSlug {
  return (PILLAR_SLUGS as readonly string[]).includes(value);
}

type FieldType = 'number' | 'boolean' | 'string' | 'enum';

interface FieldSpec {
  type: FieldType;
  enumValues?: readonly string[];
  min?: number;
  max?: number;
}

/**
 * Catálogo de campos persistíveis por pilar. Qualquer chave fora deste mapa é
 * rejeitada no PUT (400) — evita que a UI grave lixo arbitrário no Setting.
 * Campos de outras abas (permissoes/automacoes/integracoes) NÃO entram aqui:
 * são placeholders visuais e não têm contrato de persistência.
 */
export const PILLAR_FIELDS: Record<PillarSlug, Record<string, FieldSpec>> = {
  hub: {
    stagnationDays: { type: 'number', min: 1, max: 365 },
    requireLossReason: { type: 'boolean' },
    dedupCnpj: { type: 'boolean' },
  },
  market: {
    minRevenue: { type: 'string' },
    autoEnrich: { type: 'boolean' },
    signalAlerts: { type: 'boolean' },
  },
  sales: {
    speedToLeadMin: { type: 'number', min: 1, max: 1440 },
    requireBant: { type: 'boolean' },
    dailyTouchesLimit: { type: 'number', min: 1, max: 1000 },
  },
  performance: {
    benchmarkRate: { type: 'number', min: 0, max: 100 },
    repScoreActive: { type: 'boolean' },
    anomalyAlerts: { type: 'boolean' },
  },
  predictability: {
    modelType: { type: 'enum', enumValues: ['historico', 'manual'] },
    freezeDay: { type: 'number', min: 1, max: 28 },
    confidenceFactor: { type: 'number', min: 0, max: 100 },
  },
  ai: {
    model: { type: 'string' },
    temperature: { type: 'number', min: 0, max: 2 },
    piiMasking: { type: 'boolean' },
  },
  automation: {
    biDirectional: { type: 'boolean' },
    syncIntervalMin: { type: 'number', min: 1, max: 1440 },
    retryCount: { type: 'number', min: 0, max: 10 },
  },
  engagement: {
    clickToCall: { type: 'boolean' },
    recordCalls: { type: 'boolean' },
    workingHoursOnly: { type: 'boolean' },
  },
};

/** Valores iniciais — mesmos defaults que a UI usava antes de persistir. */
export const PILLAR_DEFAULTS: Record<PillarSlug, Record<string, unknown>> = {
  hub: { stagnationDays: 14, requireLossReason: true, dedupCnpj: true },
  market: { minRevenue: 'R$ 5.000.000', autoEnrich: true, signalAlerts: true },
  sales: { speedToLeadMin: 5, requireBant: true, dailyTouchesLimit: 40 },
  performance: { benchmarkRate: 18.5, repScoreActive: true, anomalyAlerts: true },
  predictability: { modelType: 'historico', freezeDay: 25, confidenceFactor: 85 },
  ai: { model: 'Claude 3.5 Sonnet', temperature: 0.3, piiMasking: true },
  automation: { biDirectional: true, syncIntervalMin: 5, retryCount: 3 },
  engagement: { clickToCall: true, recordCalls: true, workingHoursOnly: true },
};

export interface PillarSettingsStoredState {
  version: number;
  values: Record<string, unknown>;
  updatedByUserId: string | null;
  updatedAt: string | null;
}

export class PillarSettingsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PillarSettingsValidationError';
  }
}

/**
 * Valida e saneia um patch de settings de pilar. Devolve APENAS os campos
 * conhecidos com tipos corretos. Lança PillarSettingsValidationError (400) em
 * chave desconhecida ou tipo/faixa inválidos.
 */
export function validatePillarPatch(
  slug: PillarSlug,
  patch: unknown,
): Record<string, unknown> {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new PillarSettingsValidationError('Campo "values" deve ser um objeto.');
  }
  const fields = PILLAR_FIELDS[slug];
  const sanitized: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(patch as Record<string, unknown>)) {
    const spec = fields[key];
    if (!spec) {
      throw new PillarSettingsValidationError(
        `Campo desconhecido para o pilar "${slug}": ${key}`,
      );
    }
    switch (spec.type) {
      case 'boolean':
        if (typeof raw !== 'boolean') {
          throw new PillarSettingsValidationError(`Campo "${key}" deve ser booleano.`);
        }
        sanitized[key] = raw;
        break;
      case 'number': {
        if (typeof raw !== 'number' || !Number.isFinite(raw)) {
          throw new PillarSettingsValidationError(`Campo "${key}" deve ser numérico.`);
        }
        if (spec.min !== undefined && raw < spec.min) {
          throw new PillarSettingsValidationError(
            `Campo "${key}" deve ser >= ${spec.min}.`,
          );
        }
        if (spec.max !== undefined && raw > spec.max) {
          throw new PillarSettingsValidationError(
            `Campo "${key}" deve ser <= ${spec.max}.`,
          );
        }
        sanitized[key] = raw;
        break;
      }
      case 'string': {
        if (typeof raw !== 'string' || raw.trim().length === 0) {
          throw new PillarSettingsValidationError(`Campo "${key}" deve ser texto não vazio.`);
        }
        sanitized[key] = raw.trim();
        break;
      }
      case 'enum': {
        if (typeof raw !== 'string' || !spec.enumValues?.includes(raw)) {
          throw new PillarSettingsValidationError(
            `Campo "${key}" deve ser um de: ${spec.enumValues?.join(', ')}.`,
          );
        }
        sanitized[key] = raw;
        break;
      }
    }
  }
  return sanitized;
}

/** Mescla defaults + valores persistidos (persistidos vencem). */
export function mergePillarValues(
  slug: PillarSlug,
  storedValues: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  return { ...PILLAR_DEFAULTS[slug], ...(storedValues ?? {}) };
}
