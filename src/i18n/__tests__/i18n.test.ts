import { describe, expect, it } from 'vitest';
import { translate } from '../index.js';

describe('i18n translate', () => {
  it('retorna copy pt-BR por padrão e interpola variáveis', () => {
    expect(translate('pt-BR', 'firstSteps.progress', { completed: 2, total: 5 })).toBe(
      '2 de 5 concluídos',
    );
  });

  it('retorna copy en-US quando a chave existe no locale', () => {
    expect(translate('en-US', 'firstSteps.title')).toBe('First steps');
    expect(translate('en-US', 'common.open')).toBe('Open');
  });

  it('faz fallback para pt-BR quando a chave não existe no locale', () => {
    expect(translate('en-US', 'chave.inexistente')).toBe('chave.inexistente');
    expect(translate('pt-BR', 'firstSteps.step.workspace.title')).toContain('workspace');
  });
});
