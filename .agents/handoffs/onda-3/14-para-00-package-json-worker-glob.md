De: Agente 14 — Ambiente de Execução e Test Harness
Para: Agente 00 — Coordenador
Onda: 3
Status: aberto
Prioridade: alto
Bloqueador-ref: MEL-24 (DEM-20261113-004)
Sprint destino: Onda 3

## Problema

`package.json` exige aprovação do Agente 00 para edição. Os scripts de arquitetura
apontam o depcruise apenas para `src server.ts worker.ts`, deixando de fora os 6
entrypoints `worker-<dominio>.ts` (`worker-core`, `worker-crm`, `worker-extracoes`,
`worker-ia`, `worker-mercado`, `worker-prospecting`), que são processos separados e nunca
eram cruzados por nenhuma regra de arquitetura.

Correção já aplicada no meu domínio (scripts internos + baseline + docs de config):
`verify-cruise-coverage.ts`, `check-hotspots.ts`,
`generate-known-violations-baseline.mjs` e `.dependency-cruiser.cjs` agora usam
`worker*.ts` (glob resolvido pelo próprio depcruise — portável cmd.exe/bash).

## Alteração necessária (package.json — dono: 00)

Em `scripts`:

- `"lint:architecture"`: trocar `src server.ts worker.ts` por `src server.ts worker*.ts`.
- `test:architecture` herda automaticamente via `lint:architecture`.

Nenhuma outra mudança necessária. Sem isso, `npm run lint:architecture` continuará sem
cruzar os workers (o gate `verify:architecture-coverage` já está correto).

## Evidência

- Antes: 1956 módulos / 1905 esperados; `worker-*.ts` ausentes do grafo.
- Depois: 1962 módulos / 1911 esperados; diff de conjuntos confirma 0 arquivos
  fonte não cruzados.
- Relatório completo: `.agents/runs/onda-3/14-relatorio.md`.

## Teste esperado

`npm run lint:architecture` → "no dependency violations found (1962 modules, ...)" e
`npm run verify:architecture-coverage` → ✅ 1962/1911.
