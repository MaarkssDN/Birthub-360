/**
 * Stub de `crawlee` para testes unitários — o pacote real NÃO é dependência do projeto
 * (o crawler roda no worker Temporal, que tem sua própria resolução de dependências). Sem este
 * alias em `vitest.unit.config.ts`, qualquer import de `src/features/prospecting/crawlee/*`
 * falha com "Failed to resolve import". Testes que precisam de comportamento específico
 * sobrescrevem via `vi.mock('crawlee', () => ...)` — este stub só garante que o specifier
 * resolve.
 */
export class PlaywrightCrawler {
  public options: Record<string, unknown>;
  constructor(options: Record<string, unknown> = {}) {
    this.options = options;
  }
  async run(_urls: string[]): Promise<void> {
    // no-op: testes unitários nunca devem lançar browser real
  }
}
