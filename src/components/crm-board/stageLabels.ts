import type { LeadStatus } from '../../types/index.js';

/**
 * Rótulos canônicos de exibição para desacoplar chaves históricas de banco (`LeadStatus`)
 * de nomes legados de pilotos de clientes na camada visual multi-tenant (Horizonte 2).
 * Extraído de CrmBoard.tsx na TAREFA-SANEAMENTO-002 (W4) — re-exportado por CrmBoard.tsx
 * para preservar a API pública do módulo.
 */
export const STAGE_DISPLAY_LABELS: Partial<Record<LeadStatus, string>> = {
  'Piloto VTECH': 'Piloto Técnico (PoC)',
  'Piloto Birthub 360 Profile': 'Piloto Hub 360° — Em Curso',
  'Piloto Birthub 360 Profile - Concluído': 'Piloto Hub 360° — Concluído',
  'Piloto Birthub 360 Profile - Cancelado': 'Piloto Hub 360° — Cancelado',
  'Piloto Logística': 'Piloto Operacional — Em Curso',
  'Piloto Logístico - Concluído': 'Piloto Operacional — Concluído',
  'Piloto Logístico - Cancelado': 'Piloto Operacional — Cancelado',
};

export function formatStageLabel(stage: LeadStatus): string {
  return STAGE_DISPLAY_LABELS[stage] ?? stage;
}
