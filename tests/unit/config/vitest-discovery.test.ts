import { describe, expect, it } from 'vitest';
import { globSync } from 'tinyglobby';
import picomatch from 'picomatch';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// BT360-DT-0044 / TAREFA-SANEAMENTO-007: regressão do gap de descoberta do Vitest.
// Em 2026-10-17 o commit 8b120cca4 adicionou `src/**/*.test.ts(x)` ao include de
// vitest.unit.config.ts — antes disso, testes co-localizados em src/features eram
// silenciosamente ignorados pela suíte unitária. Este guarda falha se (a) algum
// arquivo com cara de teste voltar a ficar fora dos padrões de include, ou
// (b) um padrão de include virar letra morta que não casa com nenhum arquivo real.
//
// Os padrões são extraídos do TEXTO do config (e não via import) porque importar
// vitest.unit.config.ts puxa vite/esbuild, que quebra sob o ambiente jsdom da
// suíte (TextEncoder/Uint8Array de realms diferentes — invariante do esbuild).

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function readIncludePatterns(): string[] {
  const configSource = readFileSync(
    path.join(REPO_ROOT, 'vitest.unit.config.ts'),
    'utf8',
  );
  const includeBlock = configSource.match(/include:\s*\[([\s\S]*?)\]/);
  expect(includeBlock, 'bloco include: [...] não encontrado em vitest.unit.config.ts').toBeTruthy();
  return [...includeBlock![1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

const includePatterns = readIncludePatterns();

const toPosix = (p: string) => p.split(path.sep).join('/');

const isIncluded = (relativePath: string) =>
  includePatterns.some((pattern) => picomatch.isMatch(relativePath, pattern));

// Candidatos a "arquivo de teste" que DEVEM ser descobertos por ESTE config:
// qualquer *.test.* / *.spec.* sob src/ e tests/unit/, e qualquer arquivo dentro
// de um diretório __tests__ nessas mesmas raízes. Escopo restrito de propósito:
// tests/integration, tests/security, tests/container, tests/e2e e tests/load têm
// runners próprios (vitest.integration/container.config.ts, Playwright, k6) —
// incluí-los aqui geraria falso positivo. Se um candidato não casar com nenhum
// include, o Vitest nunca o executa — cobertura fantasma, o problema da dívida.
const candidateFiles = globSync(
  [
    'src/**/*.{test,spec}.{ts,tsx,js,jsx,mts,cts}',
    'src/**/__tests__/**/*.{ts,tsx,js,jsx,mts,cts}',
    'tests/unit/**/*.{test,spec}.{ts,tsx,js,jsx,mts,cts}',
    'tests/unit/**/__tests__/**/*.{ts,tsx,js,jsx,mts,cts}',
  ],
  { cwd: REPO_ROOT, absolute: false },
).map(toPosix);

describe('vitest.unit.config — descoberta de testes (BT360-DT-0044)', () => {
  it('declara padrões de include para src e tests', () => {
    expect(includePatterns.length).toBeGreaterThan(0);
    expect(includePatterns).toContain('tests/unit/**/*.test.ts');
    // Os dois padrões adicionados em 8b120cca4 são o cerne da correção — se alguém
    // os remover, testes co-localizados voltam a ficar invisíveis.
    expect(includePatterns).toContain('src/**/*.test.ts');
    expect(includePatterns).toContain('src/**/*.test.tsx');
  });

  it('todo arquivo com cara de teste no repositório casa com ao menos um include', () => {
    const orphans = candidateFiles.filter((file) => !isIncluded(file));
    expect(
      orphans,
      `Arquivos de teste fora da descoberta do Vitest:\n${orphans.join('\n')}`,
    ).toEqual([]);
    // Sanidade: o guarda não pode passar por vacuidade — há centenas de testes.
    expect(candidateFiles.length).toBeGreaterThan(100);
  });

  it('cada padrão de include casa com ao menos um arquivo real (sem padrão morto)', () => {
    const deadPatterns = includePatterns.filter(
      (pattern) => globSync(pattern, { cwd: REPO_ROOT, absolute: false }).length === 0,
    );
    expect(deadPatterns).toEqual([]);
  });

  it('testes co-localizados em src/features são reconhecidos como incluídos', () => {
    // Caminho de sucesso: a convenção co-localizada (o caso da dívida) funciona.
    expect(isIncluded('src/features/activities/__tests__/foo.test.ts')).toBe(true);
    expect(isIncluded('src/features/activities/components/Bar.test.tsx')).toBe(true);
    // Caminho de falha documentado: *.spec.* e arquivos soltos em __tests__ sem
    // sufixo .test NÃO são descobertos — quem criar um teste assim deve renomear.
    expect(isIncluded('src/features/activities/__tests__/foo.spec.ts')).toBe(false);
    expect(isIncluded('src/features/activities/__tests__/helper.ts')).toBe(false);
  });
});
