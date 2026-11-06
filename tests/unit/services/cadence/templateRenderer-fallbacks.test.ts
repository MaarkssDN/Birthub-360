import { describe, expect, it } from 'vitest';
import {
  cadenceTemplateRendererService,
  TemplateRenderError,
} from '../../../../src/services/cadence/templateRenderer.service.js';

describe('CadenceTemplateRendererService — Fallbacks and Safeguards', () => {
  it('renderiza variaveis presentes normalmente', () => {
    const template = 'Ola {{lead.firstName}}, sua empresa {{lead.company}} foi selecionada.';
    const context = { lead: { firstName: 'Carlos', company: 'TechCorp' } };
    const result = cadenceTemplateRendererService.render(template, context);
    expect(result).toBe('Ola Carlos, sua empresa TechCorp foi selecionada.');
  });

  it('aplica fallback seguro quando valor esta ausente', () => {
    const template = 'Ola {{lead.firstName | default: "Prezado(a)"}}, tudo bem?';
    const context = { lead: { firstName: null } };
    const result = cadenceTemplateRendererService.render(template, context);
    expect(result).toBe('Ola Prezado(a), tudo bem?');
  });

  it('bloqueia disparo lancando TemplateRenderError se variavel nao possuir valor nem fallback no modo strict', () => {
    const template = 'Ola {{lead.firstName}}, confirmamos sua inscricao.';
    const context = { lead: { firstName: '' } };

    expect(() => cadenceTemplateRendererService.render(template, context, { strict: true })).toThrow(
      TemplateRenderError,
    );
  });
});
