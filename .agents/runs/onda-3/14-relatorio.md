# Relatório — Agente 14 | Onda 3 | MEL-24: cobertura real do dependency-cruiser

Branch: `agente/14-onda3-arquitetura` (base `integracao/onda-3`)
Data: 2026-11-14 (sessão)

## Diagnóstico

A premissa do backlog ("só ~61 módulos cruzados por incompatibilidade com TS7") **não se
confirmou nesta base**: `typescript@6.0.3` + `dependency-cruiser@18.7.2` cruzam o grafo
completo sem warnings de versão não suportada. O gate `verify:architecture-coverage`
(commit `177b34145`, Onda 49) já existia e já falhava alto em cenários de parser quebrado.

A lacuna real encontrada era outra: **os entrypoints `worker-<dominio>.ts` nunca eram
cruzados**. Os scripts npm e os comandos internos passavam apenas `src server.ts worker.ts`
como argumentos do depcruise. `worker-core.ts`, `worker-crm.ts`, `worker-extracoes.ts`,
`worker-ia.ts`, `worker-mercado.ts` e `worker-prospecting.ts` são processos separados
(não importados por `worker.ts` nem por nada mais no repo) — 6 arquivos e suas subárvores
de imports ficavam fora de qualquer regra de arquitetura. A contagem por módulos mascarava
isso porque `modules.length` incluía módulos não-`src` (builtins Node, assets) e porque
`listSourceFiles()` também não contava os `worker-*.ts` — os dois lados erravam juntos.

## Antes / Depois

| Métrica | Antes | Depois |
|---|---|---|
| Módulos cruzados (`depcruise --output-type json`) | 1956 | 1962 (+6 workers) |
| Arquivos-fonte esperados (`listSourceFiles`) | 1905 | 1911 (+6 workers + worker.ts já contava) |
| `worker-*.ts` cobertos pelo cruise | 0 de 6 | 6 de 6 |
| Violações (com `--ignore-known`) | 0 | 0 |
| Known violations na baseline | 150 entradas (69 ativas + 81 stale) | 69 (stale removidas) |
| `verify:architecture-coverage` | ✅ 1956/1905 | ✅ 1962/1911 |
| `check:hotspots` | ✅ 1905 arquivos | ✅ 1911 arquivos |
| `lint:architecture` (err) | ✅ exit 0 | ✅ exit 0 |
| `npx tsc --noEmit` | — | ✅ exit 0 |

Cobertura efetiva: **100% dos arquivos-fonte de `src/` + entrypoints** são alcançáveis
pelo cruise (diff de conjuntos verificado manualmente: antes faltavam exatamente os 6
`worker-*.ts`; depois, nenhum arquivo em disco ficou de fora).

## Alterações

1. `scripts/architecture/verify-cruise-coverage.ts`
   - `DEPCRUISE_COMMAND`: `worker.ts` → `worker*.ts` (glob resolvido pelo próprio
     depcruise, portável cmd.exe/bash — não depende de expansão de shell).
   - Comentários atualizados.
2. `scripts/architecture/check-hotspots.ts`
   - `SCAN_ROOTS`: `worker.ts` → `worker*.ts`.
   - `listSourceFiles()` ganhou `expandScanRoot()`: expande `*` contra `readdirSync(root)`
     com regex mínimo (sem `?`/`**`/classes — padrões são fixos no arquivo, sem input externo).
3. `scripts/architecture/generate-known-violations-baseline.mjs`
   - `DEPCRUISE_CMD` alinhado para `worker*.ts` (baselines futuras incluem os workers).
4. `.dependency-cruiser.cjs` — apenas comentários de uso (comando de exemplo).
5. `.dependency-cruiser-known-violations.json` — regenerada via
   `node scripts/architecture/generate-known-violations-baseline.mjs`: 150 → 69 entradas
   (remoção das 81 stale reportadas pelo próprio depcruise; diff contém apenas deleções).

Nenhuma dependência alterada, nenhum código de produto tocado.

## Pendente — aprovação do Agente 00

`package.json` (aprovação do 00) ainda aponta `lint:architecture` para
`src server.ts worker.ts`. O gate npm oficial continua sem cruzar os 6 workers até que os
scripts sejam atualizados para `worker*.ts`:

- `lint:architecture` → `depcruise ... src server.ts worker*.ts`
- `verify:architecture-coverage` já usa comando próprio (corrigido aqui) — não depende do script.
- `test:architecture` herda `lint:architecture`.

Handoff aberto: `.agents/handoffs/onda-3/14-para-00-package-json-worker-glob.md`.

Até a aprovação, a chamada direta equivalente é:
`npx depcruise --config .dependency-cruiser.cjs --ignore-known .dependency-cruiser-known-violations.json --output-type err src server.ts worker*.ts`

## Observações

- A regra `not-to-bootstrap-from-outside` já previa `^worker.*\.ts$` no `pathNot` — os
  workers são entrypoints legítimos de `src/bootstrap/`; nenhuma violação nova surgiu.
- Não foi necessário ts-morph/madge/script próprio: depcruise 18.7.2 cobre TS 6.0.3.
