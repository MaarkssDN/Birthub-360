import { describe, expect, it } from 'vitest';
import { getFirstStepsForRole, matchesAudience, type StepAudience } from '../firstSteps.js';

function stepIds(role: string): string[] {
  return getFirstStepsForRole(role).map((step) => step.id);
}

describe('getFirstStepsForRole (MEL-38)', () => {
  it('inclui os passos comuns para todos os papéis', () => {
    for (const role of ['ADMIN', 'GESTOR', 'CLOSER', 'SDR', 'VISUALIZADOR']) {
      const ids = stepIds(role);
      expect(ids).toEqual(
        expect.arrayContaining(['workspace', 'crm', 'settings', 'dashboard', 'reports']),
      );
    }
  });

  it('mostra passos de gestão apenas para ADMIN/GESTOR', () => {
    expect(stepIds('ADMIN')).toContain('forecast');
    expect(stepIds('GESTOR')).toContain('forecast');
    expect(stepIds('CLOSER')).not.toContain('forecast');
    expect(stepIds('SDR')).not.toContain('forecast');
    expect(stepIds('VISUALIZADOR')).not.toContain('forecast');
  });

  it('mostra passos administrativos apenas para ADMIN', () => {
    for (const role of ['ADMIN', 'GESTOR', 'CLOSER', 'SDR', 'VISUALIZADOR']) {
      const ids = stepIds(role);
      if (role === 'ADMIN') {
        expect(ids).toEqual(expect.arrayContaining(['team', 'moduleAccess']));
      } else {
        expect(ids).not.toContain('team');
        expect(ids).not.toContain('moduleAccess');
      }
    }
  });

  it('mostra passos comerciais para SDR e acima, mas não para VISUALIZADOR', () => {
    for (const role of ['ADMIN', 'GESTOR', 'CLOSER', 'SDR']) {
      const ids = stepIds(role);
      expect(ids).toEqual(expect.arrayContaining(['prospect', 'activities', 'mesa']));
    }
    const viewerIds = stepIds('VISUALIZADOR');
    expect(viewerIds).not.toContain('prospect');
    expect(viewerIds).not.toContain('activities');
    expect(viewerIds).not.toContain('mesa');
  });

  it('retorna false para audiência desconhecida', () => {
    expect(matchesAudience('unknown' as StepAudience, 'ADMIN')).toBe(false);
  });
});
