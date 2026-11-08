/**
 * src/services/cadence/templateRenderer.service.ts
 * Renderizador seguro de templates de cadencia multicanal com fallbacks e travas anti-placeholders vazios.
 * (Handoff 05-para-17 / DIV-AGENTE-05-001)
 */

export interface RenderTemplateOptions {
  strict?: boolean; // Se true, lanca erro se houver variavel sem valor e sem fallback
}

export class TemplateRenderError extends Error {
  constructor(public readonly missingVariables: string[]) {
    super(
      `Variavel(is) obrigatoria(s) sem valor ou fallback no template: ${missingVariables.join(', ')}`,
    );
    this.name = 'TemplateRenderError';
  }
}

export class CadenceTemplateRendererService {
  /**
   * Renderiza templates com suporte a pipes de fallback:
   * Ex: `{{lead.firstName | default: "Ola"}}` ou `{{lead.firstName}}`
   */
  public render(
    template: string,
    context: Record<string, unknown>,
    options: RenderTemplateOptions = { strict: true },
  ): string {
    if (!template) return '';

    const missingVariables: string[] = [];

    // Regex para capturar {{ path.to.var | default: "fallback" }} ou {{ path.to.var }}
    const rendered = template.replace(
      /\{\{\s*([a-zA-Z0-9_.]+)(?:\s*\|\s*default:\s*(?:"([^"]*)"|'([^']*)'))?\s*\}\}/g,
      (fullMatch, varPath, dqFallback, sqFallback) => {
        const fallback =
          dqFallback !== undefined ? dqFallback : sqFallback !== undefined ? sqFallback : undefined;
        const value = this.resolvePath(context, varPath);

        if (value !== undefined && value !== null && String(value).trim() !== '') {
          return String(value);
        }

        if (fallback !== undefined) {
          return fallback;
        }

        missingVariables.push(varPath);
        return fullMatch; // Mantem tag para deteccao no modo strict
      },
    );

    if (options.strict && missingVariables.length > 0) {
      throw new TemplateRenderError(missingVariables);
    }

    return rendered;
  }

  private resolvePath(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }
}

export const cadenceTemplateRendererService = new CadenceTemplateRendererService();
