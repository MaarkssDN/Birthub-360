import { api } from '../../lib/api.js';
import type { PillarSlug } from './domain/pillarSettings.js';

/**
 * Cliente do contrato `/api/settings/pillars/:pillar` (Onda F1).
 * Envelope `{ success, data }` — `api.get/put` já desembrulam `data`.
 * PUT exige ADMIN no backend (requireRole); a UI deve exibir o erro 403
 * em vez de fingir sucesso.
 */
export interface PillarSettingsView {
  pillar: PillarSlug;
  /** Defaults mesclados com o persistido — sempre o conjunto completo do pilar. */
  values: Record<string, unknown>;
  configured: boolean;
  updatedAt: string | null;
}

const BASE = '/api/settings/pillars';

export const pillarSettingsApi = {
  get: (pillar: PillarSlug) => api.get<PillarSettingsView>(`${BASE}/${pillar}`),
  update: (pillar: PillarSlug, values: Record<string, unknown>) =>
    api.put<PillarSettingsView>(`${BASE}/${pillar}`, { values }),
};
