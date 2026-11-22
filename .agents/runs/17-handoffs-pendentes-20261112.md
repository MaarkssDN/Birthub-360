# Run — Agente 17: execução de handoffs pendentes (2026-11-12)

Branch: `agente/17-cadencia-handoffs` (worktree `C:\Github\Birthub-360-worktrees\agente-17-handoffs`, base `origin/main` @ `0b52894e0`).

## Handoffs localizados ("Para:" contém 17)

Já `resolvido` antes deste run (sem ação):
`onda-15/13-para-17-disparo-cadencia-enxame`, `onda-43/13-para-17-leitura-signature-request`,
`onda-7/12-para-17-optout-unificado-voz`, `techdebt-2026-09-29/00-para-17-arquivo-monolitico-cadence`,
`onda-p0-dialer-503/12-para-17-dialer-sql-seguro`,
`onda-saneamento-20261105/05-para-17-trava-templates-cadencia-placeholders`,
`onda-saneamento-20261105/06-para-17-janela-horario-comercial-whatsapp`,
`onda-forense-20261020/00-para-17-forense`,
`onda-aws-release-2026-10-09/00-para-01-17-06-07-servicos-transversais`.

Pendentes tratados neste run:

### 1. `onda-saneamento-20261110/00-para-17-ausencia-de-verificacao-em-lote-de-opt-out...` (TAREFA-SANEAMENTO-035 / BT360-DT-0080) → **resolvido**

- O arquivo citado (`services/cadenceExecution.service.ts`) não existe; o ponto real de associação
  de leads à régua é `POST /api/cadence/runs` em `cadence.routes.ts`.
- Implementado `checkCadenceStartEligibility` (`application/cadenceEligibility.ts`): consulta o
  `OptOutRecord` unificado para TODOS os canais distintos da sequência, cobrindo leads sem
  `contactId` (antes sem nenhuma trava).
- `POST /runs` agora avalia `checkOptOutStatus` por canal (todos os canais, não só o primeiro)
  + `checkCadenceStartEligibility` — bloqueio → 409 antes de criar `CadenceRun`.
- Novo teste `__tests__/cadenceEligibility.test.ts` (9 casos). Resolução registrada no handoff.
- **Pendência aberta**: `market-intelligence/actionExecutor.service.ts` (`START_SDR_CADENCE`)
  cria `CadenceRun` sem opt-out → handoff `17-para-05-...` aberto.
- Encerramento formal depende de parecer APROVADO do Agente 24 (exigência do handoff).

### 2. `00-para-17-07-orquestracao-sem-demo.md` → mantido **em-andamento** (resolução parcial do item 17)

- Verificado `SalesOrchestrationService.getOverview()`: já retorna `source: 'real'|'none'`,
  `meta.unavailableMetrics` e `meta.emptySections` — sem dados inventados. Decisão do 17:
  escopo reduzido declarado (jornadas/processos/roteiros sem modelo real permanecem vazios e
  honestos). Itens de 07/02/08 seguem pendentes.

### 3. `00-para-12-17-voicehub-reactivacao.md` → **em-andamento** (resolução parcial do 17)

- Item 4 (decisão dialer→cadence): já implementado — `/app/dialer` → `/app/cadence` em `App.tsx`.
- Item 1 (isolamento das rotas de voz): arquivos pertencem ao Agente 12 (`voice-hub/AGENTS.md`);
  17 não edita. Aguardando 12/01/02.

## Arquivos alterados

- `src/features/cadence/application/cadenceEligibility.ts` (novo)
- `src/features/cadence/cadence.routes.ts` (filtro em lote no POST /runs)
- `src/features/cadence/index.ts` (export do novo módulo)
- `src/features/cadence/__tests__/cadenceEligibility.test.ts` (novo, 9 testes)
- `.agents/handoffs/onda-saneamento-20261110/00-para-17-...` (status + resolução)
- `.agents/handoffs/onda-saneamento-20261110/17-para-05-market-intelligence-start-cadence-sem-optout.md` (novo)
- `.agents/handoffs/00-para-12-17-voicehub-reactivacao.md` (status + resolução parcial)
- `.agents/handoffs/00-para-17-07-orquestracao-sem-demo.md` (resolução parcial)
- `.agents/runs/17-handoffs-pendentes-20261112.md` (este relatório)

## Gates

- `npx tsc --noEmit` — limpo.
- `npx biome lint src/features/cadence` — sem erros novos (1 warning pré-existente em
  `cadenceExecutionPort.test.ts`, fora do escopo).
- `npx vitest run -c vitest.unit.config.ts src/features/cadence` — 12 arquivos / 170 testes verdes.
- Integração Postgres real não executada neste ambiente (sem banco) — mudança na rota é aditiva.
