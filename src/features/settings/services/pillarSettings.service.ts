/**
 * Settings por pilar — UseCases. Repositório injetável (mesmo padrão de
 * OrganizationModulesService) para teste sem banco.
 *
 * Escopo: somente preferências operacionais visíveis na aba "Ferramentas & Regras"
 * do PillarSettingsPlaceholder. NÃO concede permissão real — RBAC continua no
 * backend (requireRole nas rotas). As abas Permissões/Gatilhos/Integrações da UI
 * são placeholders visuais e não têm contrato aqui.
 */

import {
  mergePillarValues,
  PillarSettingsValidationError,
  validatePillarPatch,
  type PillarSlug,
} from '../domain/pillarSettings.js';
import {
  settingPillarSettingsRepository,
  type PillarSettingsRepository,
} from '../infrastructure/PillarSettingsSettingRepository.js';

export class PillarSettingsServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = 'PillarSettingsServiceError';
  }
}

export interface PillarSettingsView {
  pillar: PillarSlug;
  /** Defaults mesclados com o que está persistido — sempre o conjunto completo. */
  values: Record<string, unknown>;
  /** true quando a org já gravou alguma configuração deste pilar. */
  configured: boolean;
  updatedAt: string | null;
}

export class PillarSettingsService {
  constructor(
    private readonly repository: PillarSettingsRepository = settingPillarSettingsRepository,
  ) {}

  async get(organizationId: string, slug: PillarSlug): Promise<PillarSettingsView> {
    if (!organizationId) {
      throw new PillarSettingsServiceError('Contexto de organização é obrigatório.', 400);
    }
    const stored = await this.repository.load(organizationId, slug);
    return {
      pillar: slug,
      values: mergePillarValues(slug, stored?.values),
      configured: stored !== null,
      updatedAt: stored?.updatedAt ?? null,
    };
  }

  /**
   * Merge parcial: `patch` contém só os campos alterados; o restante é
   * preservado do estado persistido (ou dos defaults). Chaves desconhecidas ou
   * com tipo/faixa inválidos → PillarSettingsServiceError 400.
   */
  async update(
    organizationId: string,
    userId: string,
    slug: PillarSlug,
    patch: unknown,
  ): Promise<PillarSettingsView> {
    if (!organizationId) {
      throw new PillarSettingsServiceError('Contexto de organização é obrigatório.', 400);
    }
    let sanitized: Record<string, unknown>;
    try {
      sanitized = validatePillarPatch(slug, patch);
    } catch (error) {
      if (error instanceof PillarSettingsValidationError) {
        throw new PillarSettingsServiceError(error.message, 400);
      }
      throw error;
    }
    const stored = await this.repository.load(organizationId, slug);
    const mergedValues = mergePillarValues(slug, stored?.values);
    const nextValues = { ...mergedValues, ...sanitized };
    const now = new Date().toISOString();
    await this.repository.save(organizationId, slug, {
      version: (stored?.version ?? 0) + 1,
      values: nextValues,
      updatedByUserId: userId,
      updatedAt: now,
    });
    return {
      pillar: slug,
      values: nextValues,
      configured: true,
      updatedAt: now,
    };
  }
}

export const pillarSettingsService = new PillarSettingsService();
