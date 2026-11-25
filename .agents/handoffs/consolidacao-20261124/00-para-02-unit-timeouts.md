De: 00 — Astra
Para: 02 — Bento (Test Harness)
Onda: Consolidação DEM-20261123-001 (pós-Onda 3)
Status: aberto
Prioridade: alto
Bloqueador-ref: flakes unitários observados na suíte completa Onda 2
Sprint destino: ciclo imediato

## Problema

Na execução completa de `npm run test:unit` sobre `a81c63ccc` (988 arquivos, 8111 testes, ~87 min em Windows com `--no-file-parallelism`), 6 testes falharam em 3 arquivos — todos por timeout de 15s ou elemento não encontrado sob contenção:

- `tests/unit/features/landing/Landing360.test.tsx` — 4 timeouts de 15s
- `tests/unit/components/layout/AppLayout.test.tsx` — 1 falha (`findByText` não encontrou marcador de rota)
- `tests/unit/queue/outbox.remed05-boot.test.ts` — 1 timeout de 15s no boot DI

Na rerodada isolada dos 3 arquivos no mesmo SHA: **120/120 verdes em ~100s**. Ou seja, há indício forte de flake por contenção de recursos, mas a causa raiz NÃO está comprovada — não classificar como "ambiental" sem evidência reproduzível.

## Arquivo(s) envolvido(s)

- `tests/unit/features/landing/Landing360.test.tsx`
- `tests/unit/components/layout/AppLayout.test.tsx`
- `tests/unit/queue/outbox.remed05-boot.test.ts`
- Harness: `vitest.unit.config.ts`, `tests/setup/**` (propriedade Agente 02/03)

## Evidência

- Suíte completa: `Test Files 3 failed | 985 passed (988)`, `Tests 6 failed | 8104 passed | 1 skipped (8111)`, duração 5214s.
- Isolado: `Test Files 3 passed (3)`, `Tests 120 passed (120)`, duração 99,89s.
- `git diff 815a09305..a81c63ccc -- src/` = apenas `dataSubjectErasure.service.ts` — nenhum dos 3 arquivos de teste nem seus caminhos de dependência foram alterados pela Onda 2.

## Alteração necessária

1. Reproduzir o flake: rodar a suíte completa (ou subconjunto representativo) em ambiente controlado e registrar se a falha é determinística por ordem/concorrência ou probabilística por carga.
2. Se for contenção: avaliar `testTimeout`/`hookTimeout` por arquivo pesado, `pool`/`isolate` options do vitest, ou sharding — SEM mascarar falhas reais (AGENTS.md tests/AGENTS.md §7: não aumentar timeout sem reproduzir flake no CI primeiro).
3. Se houver dependência de ordem entre arquivos (estado global, DI container, mocks não restaurados), identificar e isolar.
4. Documentar causa raiz em `.agents/runs/` e, se for defeito de teste, corrigir na própria suíte.

## Teste esperado

- Duas execuções completas consecutivas de `npm run test:unit` com 0 falhas não-explicadas, ou causa raiz documentada com reprodução mínima.
- Nenhum teste enfraquecido para "ficar verde".

## Contexto adicional

- Onda 3 está em integração sobre a mesma base — coordenar para não duplicar investigação com o Agente 03 (Nina, testes unitários).
- Registrar SHA congelado e submeter ao Agente 09 antes de integrar.
