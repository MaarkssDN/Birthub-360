/**
 * Settings Infrastructure — adaptador real de PillarSettingsRepository.
 * Uma linha de `Setting` por (organizationId, userId=null, key=settings.pilar.<slug>).
 * Mesmo helper de organization-modules; RLS por tenant via requestContext
 * (authenticateToken + requireTenant no mount da rota).
 */

import {
  findSetting,
  upsertSetting,
} from '../../../lib/voice-hub/repositories/settingRepository.js';
import {
  pillarSettingKey,
  type PillarSettingsStoredState,
  type PillarSlug,
} from '../domain/pillarSettings.js';

export interface PillarSettingsRepository {
  load(organizationId: string, slug: PillarSlug): Promise<PillarSettingsStoredState | null>;
  save(
    organizationId: string,
    slug: PillarSlug,
    state: PillarSettingsStoredState,
  ): Promise<void>;
}

function parseStoredState(value: unknown): PillarSettingsStoredState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const values =
    raw.values && typeof raw.values === 'object' && !Array.isArray(raw.values)
      ? (raw.values as Record<string, unknown>)
      : {};
  return {
    version: typeof raw.version === 'number' ? raw.version : 1,
    values,
    updatedByUserId: typeof raw.updatedByUserId === 'string' ? raw.updatedByUserId : null,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
  };
}

export class SettingPillarSettingsRepository implements PillarSettingsRepository {
  async load(organizationId: string, slug: PillarSlug): Promise<PillarSettingsStoredState | null> {
    const row = await findSetting(organizationId, null, pillarSettingKey(slug));
    return row ? parseStoredState(row.value) : null;
  }

  async save(
    organizationId: string,
    slug: PillarSlug,
    state: PillarSettingsStoredState,
  ): Promise<void> {
    await upsertSetting(organizationId, null, pillarSettingKey(slug), state);
  }
}

export const settingPillarSettingsRepository = new SettingPillarSettingsRepository();
