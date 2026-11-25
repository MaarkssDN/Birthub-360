# POS3-44-CONTRACTS — Contratos dormentes de cadência

- **Agente**: 44 — Lola (Motor de Cadências Comerciais, Squad 40)
- **Missão**: reenvio (worktree anterior perdido) — auditar contratos dormentes em `src/features/cadence/**`
- **Branch**: `agente/44-cadence-contracts-s40` (base `1e1ecb76b`)
- **Worktree**: `C:\Github\Birthub-360-worktrees\squads\squad-40\wt-44-contracts`
- **Data**: 2026-11-25

## Escopo auditado

`cadence.routes.ts` (14 endpoints), `cadence.api.ts` (14 métodos), `hooks/`, `components/hub/**`,
`domain/**`, `application/**`, `infra/**` (15 adaptadores), `services/**` (3 serviços),
`jobs/cadenceRun.worker.ts`, `index.ts` e barrels. Consumidores verificados em `src/`, `tests/`,
`src/bootstrap/{routes,workers,workerServer}.ts`, `worker*.ts` e `src/shared/di/setup.ts`.

## Inventário e classificação

### Corrigido — dead code removido (zero referências, evidência por grep)

| Arquivo | Classificação | Evidência |
|---|---|---|
| `src/features/cadence/hooks/useCadence.ts` | dead-code | 4 hooks (`useOptOuts`, `useCadenceRuns`, `useCadenceSequences`, `useCadenceJourneyTemplates`) sem nenhum importador — todos os componentes de `components/hub/**` chamam `cadenceApi` diretamente. Diretório `hooks/` removido (ficou vazio). |
| `src/features/cadence/services/multichannelDispatcher.service.ts` | dead-code + bug latente | Stub de 29 linhas que retorna `{ success: true }` **sem despachar nada** — se algum dia fosse ligado, reportaria sucesso falso. Zero call-sites, zero testes. Removido. |
| `src/features/cadence/selfDrivingCrm.service.ts` | dead-code | Barrel de 1 linha (`export * from './services/selfDrivingCrm.service.js'`); testes importam `services/selfDrivingCrm.service.js` diretamente. Removido. |
| `src/features/cadence/infra/PrismaSelfDrivingCrmRepository.ts` | dead-code | Barrel de 1 linha para `PrismaCadenceRunRepository.js`; zero importadores. Removido. |

### Bug real corrigido

| Item | Correção |
|---|---|
| `cadence.api.ts` → `ScheduleMeetingResponse.noteId` | Tipado `noteId?: string`, mas `scheduleVerifiedMeeting` devolve `noteId: null` quando a nota não é criada (`application/scheduleMeeting.ts:44,72,97`). DTO agora `noteId?: string \| null`. |

### Intencional-dormente — documentado, não removido

| Contrato | Status | Evidência / decisão |
|---|---|---|
| `application/CadenceExecutionPort.ts` + `CadenceExecutionService.ts` (~570 linhas) | intencional-dormente | Porta entregue na Onda 15 (handoff `onda-15/13-para-17-disparo-cadence-enxame.md`, lado 17 resolvido). Zero call-sites de produção; o Enxame (Squad 70) nunca a consumiu. Cabeçalho do arquivo anotado + handoff `44-para-71-cadence-execution-port-sem-consumidor.md`. |
| `services/selfDrivingCrm.service.ts` + `services/adaptiveMultichannelCadence.service.ts` | intencional-dormente | `ISelfDrivingCrmPort` sem consumidor de produção (só testes). Decisão "manter" já resolvida em `.agents/handoffs/onda-WB1/02a-para-17-selfdrivingcrm-orfao.md` — integração só após desbloqueio do NO-GO de cadência (DEBT-0008…0011). Cabeçalho do serviço anotado com o status. |
| `POST /api/cadence/opt-outs` | intencional-dormente (gap de produto) | Rota funcional e documentada (OpenAPI Onda 15), única que aceita opt-out por lead/e-mail/telefone (complementa `POST /api/lgpd/opt-out`, que exige `contactId`). Sem consumidor de UI. Handoff `44-para-30-ui-registro-optout.md`. |
| `index.ts` (barrel público) | intencional-dormente | Zero importadores diretos, mas é superfície pública explícita da feature — mantido. |
| `CadenceTouchResult 'pending'` (domínio) | intencional | Forma durável de toque de voz aguardando webhook (`domain/cadence.ts:191-202`, TTL em `:423`); emitido e consumido pelo `decideCadenceAction`/`advanceCadenceRun`. |

### Verificado como NÃO dormente (caminho real de execução)

- **Rotas**: todas as 14 montadas em `src/bootstrap/routes.ts:259` (`/api/cadence`, `authenticateToken`+`requireTenant`); cada método de `cadence.api.ts` tem consumidor em `components/hub/**` ou hook interno — exceto `POST /opt-outs` (ver acima).
- **Worker**: `cadenceRun.worker.ts` registrado no processo dedicado (`worker.ts:147,200,224`) **e** no modo embutido (`src/bootstrap/workers.ts:215,284`) — `scheduleCadenceRunJob` chamado nos dois.
- **Ports de infra**: `PrismaCadenceRunRepository`, `PrismaCadenceSequenceRepository`, `PrismaOptOutRepository`, `PrismaLeadSubjectResolver`, `RedisCadenceRunLock`, `PrismaCadenceRateLimitPort`, `PrismaCalendarSchedulerPort`, `PrismaMeetingConfirmationNotePort`, `PrismaConversationSignalPort`, `PrismaSignatureRequestRepository`, `GovBrSignatureProviderPort`, `CadenceDispatchers` — todos com call-sites reais (rotas, worker, threecx, birth-voice, crm360, email webhook, DI `setup.ts:238`).
- **`documentSignature.ts`**: consumido por `src/features/crm360/infra/PrismaCrmDocumentRepository.ts:12-14,570`.
- **`cadence-ai.service.ts`**: consumido por `CentralAISuiteService.ts:30,66` e `prompt-registry.ts`.
- **`emailIntentClassifier`/`hasLeadReplied`/`cadenceWebhookResolver`**: consumidos por webhooks de e-mail/voz/threecx.
- **Estados/eventos**: `failed`/`policy-guardrail` emitidos por `applyPolicyGuardrailFailure` (worker, sequência inválida); `pending` coberto acima; todos os `CadenceSkipReason` e `CadenceStopReason` têm emissores em `domain/cadence.ts`/`cadenceService.ts`.

## Alterações

- **Deletados**: `hooks/useCadence.ts`, `services/multichannelDispatcher.service.ts`,
  `selfDrivingCrm.service.ts` (barrel), `infra/PrismaSelfDrivingCrmRepository.ts` (barrel).
- **Editados**: `cadence.api.ts` (tipo `noteId`), `application/CadenceExecutionPort.ts` e
  `services/selfDrivingCrm.service.ts` (cabeçalhos de status dormente).
- **Criados**: 2 handoffs em `.agents/handoffs/onda-4/` + este relatório.

## Verificação

- `grep` pós-remoção: zero referências aos 4 arquivos deletados (varredura em `src/` e `tests/`).
- ⚠️ **Limitação de ambiente**: `node_modules` do worktree é junction para o checkout principal,
  em reinstalação — `node_modules/.bin` ausente, `typescript/lib` parcial, `vitest` sem
  `package.json`, `biome.exe` bloqueado por outro processo. `npx tsc --noEmit`, `npm run lint` e
  `vitest` **não puderam ser executados**. As alterações são: remoção de arquivos sem
  importadores (verificado por grep), comentário de cabeçalho (sem efeito em compilação) e
  alargamento de tipo em DTO (`string` → `string | null`, estritamente mais permissivo — não
  quebra call-sites). Recomenda-se reexecutar o gate (`tsc --noEmit`, `lint`, `test:unit
  src/features/cadence`) quando o `node_modules` estiver íntegro — as 3 suítes de integração de
  cadência (`tests/integration/cadence-*.test.ts`, `cadenceRun.worker.test.ts`) ficam para o
  Agente 04 conforme orientação da missão (Postgres/Redis indisponíveis).
- Testes unitários novos: **não aplicável** — nenhuma regra de negócio alterada; as remoções não
  têm comportamento testável e o fix de tipo é compile-time.

## Handoffs emitidos

- `.agents/handoffs/onda-4/44-para-71-cadence-execution-port-sem-consumidor.md` — consumidor do
  `CadenceExecutionPort` (Squad 70 / runtime do Enxame).
- `.agents/handoffs/onda-4/44-para-30-ui-registro-optout.md` — UI para `POST /opt-outs` (Squad 30).

Sem handoffs de schema (11/12) nem workers (23): nenhuma alteração de persistência ou de fila.
