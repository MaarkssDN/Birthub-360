De: 00 — Astra
Para: 02 — Bento (Test Harness)
Onda: Consolidação DEM-20261123-001 (pós-Onda 3)
Status: resolvido (reaplicado na worktree de recuperação em 2026-11-25)
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

## Resolução

### 2026-11-25 — Re-aplicação na worktree de recuperação (Agente 02 — Bento)

**Contexto:** a correção original (documentada abaixo, resolvida em 2026-11-25 na worktree
`D:/Github/Birthub-360`, run `.agents/runs/agente-02-unit-timeouts-flake-20261125.md`) havia
sido revertida e precisava ser reaplicada na worktree
`D:/Github/Birthub-360-wt-recuperacao` (branch `recuperacao/onda-consolidacao-20261124`).

**Verificação prévia:** `tests/mocks/setup.ts` na baseline **não** continha neutralização de
`REDIS_URL` (grep sem ocorrências) — bug presente.

**Alteração aplicada (idêntica à documentada):** `tests/mocks/setup.ts`, logo após o bloco de
`PII_BLIND_INDEX_KEY`, 1 linha de código + comentário explicativo:

```ts
process.env.REDIS_URL = '';
```

- String vazia (não `delete`) porque `src/config/env.ts` (`import 'dotenv/config'`) reidrata
  chaves ausentes a partir de `.env`; `''` é preservada → `redisConfigured=false` →
  `lazyConnect:true` → zero conexões ioredis nos workers do Vitest.
- Causa raiz e evidências completas da resolução original permanecem válidas — ver seção
  "## Resolução" histórica neste handoff e `.agents/runs/agente-02-unit-timeouts-flake-20261125.md`
  (worktree original, somente leitura).

**Arquivos alterados nesta re-aplicação:**
- `tests/mocks/setup.ts` (única alteração de código; não commitado, conforme instruído)
- `.agents/handoffs/consolidacao-20261124/00-para-02-unit-timeouts.md` (este registro)

**Evidências / validação:**
- Leitura do arquivo confirma a linha aplicada na posição correta (linhas 9–16 do arquivo).
- `vitest.unit.config.ts:38` registra `setupFiles: ['./tests/mocks/setup.ts']` — o setup é
  efetivamente carregado pela suíte unitária.
- Nesta worktree **não existem `.env` nem `.env.test`** (apenas `.env.example` e
  `.env.test.example`, este último com `REDIS_URL` na linha 34) — ou seja, o caminho de
  reidratação via dotenv depende de `.env.test` ser gerado por
  `scripts/test/prepare-integration-env.js` ou similar; a neutralização protege contra ambos.

**Bloqueado por ambiente:**
- `node_modules` está em instalação incompleta (sem `node_modules/.bin`, `vitest/dist` contém
  apenas `config.cjs`, `typescript/lib` vazio) → **não foi possível executar** os 3 arquivos
  flaky (`Landing360.test.tsx`, `AppLayout.test.tsx`, `outbox.remed05-boot.test.ts`) nem
  `tsc`/`esbuild` para validação de sintaxe automatizada. A alteração é uma atribuição de
  string trivial e idêntica à já validada na resolução original (120/120 + 567/567 + 134/134
  verdes, zero `Redis reconnect`/`ECONNREFUSED`).
- **Pendente:** rodar `npx vitest run -c vitest.unit.config.ts` nos 3 arquivos flaky assim que
  `npm install` concluir, e observar a próxima suíte completa no CI como gate final (mesma
  ressalva da resolução original).

**Ressalvas herdadas da resolução original (inalteradas):**
1. Leak residual menor em `src/lib/voice-hub/**` (`new Redis` eager em module scope com
   `getRedisUrl()` retornando `localhost:6379`) — fora da propriedade do Agente 02; correção
   exige handoff ao Squad 60/23 via coordenador.
2. Testes de `Landing360.test.tsx` chegam a ~10,8s sob paralelismo — se flakkar só neles,
   próxima alavanca é reduzir custo de render, nunca aumentar timeout sem reproduzir no CI.
3. Submissão ao Agente 09 (Silas) fica a cargo do orquestrador.
