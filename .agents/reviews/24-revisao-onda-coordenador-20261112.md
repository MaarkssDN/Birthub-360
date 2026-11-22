# Parecer de Revisão Independente — Agente 24

- **Missão/Onda:** Revisão dos 6 merges da onda do Coordenador (`integracao/coordenador-20261112`)
- **Autor das entregas:** Agentes 17, 04, 07, 05, 12, 09 (via merges do 00)
- **Auditor:** Agente 24 — Revisão Independente
- **Base/Branch:** worktree `C:\Github\Birthub-360-worktrees\agente-00-coordenador`, branch `integracao/coodenador-20261112` (revisão no HEAD `bfd966ed3`)
- **Data:** 2026-11-12

## Verificações executadas

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | exit 0, zero erros |
| `npx vitest run -c vitest.unit.config.ts` (7 arquivos de teste tocados) | 114/114 testes verdes |
| `npx vitest run tests/unit/features/crm360/infra/discountAuthorityLock.test.ts` | 8/8 verdes |
| `npx vitest run tests/unit/features/prospecting/services/providerCostMetrics.test.ts` | 5/5 verdes |
| `npx vitest run` (config default) para `providerCostMetrics.test.ts` | 5/5 verdes |

Nota de ambiente: a config default `vitest.config.ts` só cobre `tests/**`; os testes em `src/**/__tests__` exigem `vitest.unit.config.ts` (`npm run test:unit`). Ambos os caminhos foram executados.

---

## Parecer por merge

### 1. `54062bbff` — Agente 17: re-verificação pré-envio no auto-stop de cadência — **APROVADO**

- **Escopo:** cirúrgico — 42 linhas em `cadenceService.ts` + 118 de teste. Nenhum arquivo fora do domínio cadence.
- **Correção real:** verificado em `src/features/cadence/application/cadenceService.ts` (~L272-313). Antes de `dispatcher.dispatch`, o código re-lê o run via `deps.runRepo.findById(organizationId, runId)` e re-checa `deps.hasLeadReplied`. Run ausente → `wait/locked`; `paused` → `wait/paused`; terminal → `stop` com `stopReason`; respondido → `applyStopDecision(run, 'lead-reply')` + save + log estruturado. Cobre exatamente a janela descrita (leituras de opt-out/rate-limit entre a checagem inicial e o envio, e rotas manuais de pause/stop que não passam por `deps.lock`). Razões `locked`/`paused` existem no tipo `CadenceDecision` (`domain/cadence.ts:215,224`). Janela residual dentro de `dispatcher.dispatch` honestamente documentada no comentário.
- **Tenancy/LGPD:** `findById` recebe `organizationId`; log usa apenas IDs (orgId, runId, leadId) — sem PII.
- **Testes:** fortes e não tautológicos — provam que `dispatcher.calls` tem length 0 quando reply chega entre as duas leituras (`repliedCalls` instrumentado = 2), que stop manual mid-cycle impede dispatch, e que o fluxo normal despacha. 11/11 verdes.
- **P1–P4:** sem refatoração oportunista, sem código morto, erro observável (log warn/error existentes preservados).

### 2. `a9e36966f` — Agente 04: trava transacional de alçada de desconto — **APROVADO**

- **Escopo:** 3 arquivos novos/alterados em `src/features/crm360/**` + teste em `tests/unit/features/crm360/infra/` + handoff. `PrismaCrm360Repository.ts` teve 259 linhas alteradas, mas são a conversão para `runInTransaction` dos dois métodos — dentro do escopo declarado. Handoff `04-para-00-alcada-desconto-deal-items.md` documenta honestamente que `addDealItem` segue sem trava (pendência fora do escopo desta correção).
- **Correção real:** verificado linha a linha.
  - `domain/discountAuthority.ts`: avaliação pura, fail-closed (papel desconhecido → menor alçada), ADMIN irrestrito, avalia desconto efetivo ponderado **e** maior item isolado (cobre diluição), thresholds por org via `Setting.approval_thresholds` com parse defensivo.
  - `PrismaDiscountAuthorityGuard.ts`: lê `User.role` do `actorUserId` **dentro do tx** com filtro `organizationId` (o cliente nunca escolhe a própria alçada) e thresholds dentro do mesmo tx.
  - `createDocument`: validação + create + versão 1 em um único `runInTransaction` com `{ organizationId }`.
  - `updateDocumentContent`: `SELECT id FROM "CrmCommercialDocument" WHERE id AND "organizationId" FOR UPDATE` antes de ler versões — serializa edições concorrentes; `versionNumber` derivado do histórico pós-lock; update atômico. O `biome-ignore` de tx-escape foi removido (migração para `runInTransaction`, alinhado ao parecer 15).
  - `actorUserId` já estava plugado do controller (`Crm360Controller.ts:224-239`) — sem mudança de contrato.
- **Tenancy/LGPD:** `FOR UPDATE` filtra `organizationId` no WHERE (teste cross-tenant prova 404); `loadActorRole` filtra org; erro 403 não vaza dados além de percentuais.
- **Testes:** harness in-memory emula fielmente o contrato Postgres (mutex por documento no `FOR UPDATE`, `@@unique(documentId, versionNumber)`). 8 testes com assertions fortes: rejeição 403 sem persistência (docs e versions = 0), serialização de edições concorrentes (versões [1,2,3], sem update perdido), fail-closed sem usuário, thresholds por org, cross-tenant 404. 8/8 verdes.
- **Ressalva (não bloqueante):** o harness é emulação, não Postgres real — a semântica `FOR UPDATE`/`@@unique` é fiel, mas a prova definitiva seria integração; aceitável para gate unitário.

### 3. `c8ff790b0` — Agente 07: dry-run sandbox das 7 ações — **APROVADO**

- **Escopo:** 4 arquivos em `src/features/automations/**` + teste + handoff `07-para-00`. Alargamento do tipo `action` em `automations.api.ts` é necessário (regras legadas no banco podem ter ações fora do catálogo da UI) e está justificado em comentário.
- **Correção real:** verificado contra `automation.engine.ts` (L537-660). As 4 novas funções `preview*` espelham as MESMAS validações do `runAction` real: webhook exige `url` (PermanentAutomationError → blockedReason), custom field exige `field` e replica a regra "só Lead tem efeito", enrich replica a resolução de leadId, cadência exige `cadenceId`+leadId. `runAction` nunca é chamado; `fetch`, `prisma.*.update`, `domainEventMesh.publish` e `executeCadenceAction` não aparecem no arquivo — sandbox por construção, não por rollback. Decisão arquitetural (interceptar antes vs. tx com rollback) está correta: efeitos externos pagos não são revertíveis por rollback.
- **Tenancy/LGPD:** dry-run lê leads/atividades da org já autorizada a vê-los (documentado); amostra usa `organizationId` nos `findMany`. Sem PII em logs novos.
- **Testes:** 10 testes com spies globais provando zero efeitos (`fetchSpy`, `leadUpdate`, `publishMock`, `executeCadenceActionMock`, `callLeadMock` todos `not.toHaveBeenCalled()`), paridade de validações (url/cadenceId ausentes → wouldFire=false), e detalhes renderizados corretos. Fortes, não tautológicos. 10/10 verdes.
- **P1–P4:** código novo é proporcional; `METHODOLOGY_NOTE` atualizada para declarar o contrato sandbox explicitamente; UI (`describeOutcome`) cobre as 4 ações novas.

### 4. `b3ef53e56` — Agente 05: débito atômico de créditos + social→timeline CRM — **APROVADO COM RESSALVAS**

- **Escopo:** 15 arquivos, mas todos dentro de `prospecting/services/**` e `social-selling/**` + testes + handoffs. Move de `getCostPerCallUsd`/`DEFAULT_PROVIDER_COST_PER_CALL_USD` de `providerCostMetrics.ts` para `providerBudget.ts` é justificado (quebra de ciclo de import, documentado) e mantém reexports — sem quebra de consumidores.
- **Correção real (MOD-02):** verificado. `consumeProspectingProviderCredit` (`providerBudget.ts`) debita o custo estimado ANTES da rede: script Lua `INCRBYFLOAT` + `DECRBYFLOAT` condicional na mesma execução atômica no Redis; fallback em memória usa seção síncrona sem `await` entre leitura e escrita (atomicidade single-thread). Os 7 call sites faturáveis migraram de `assertProspectingBudgetNotExceeded` para `consumeProspectingProviderCredit`; `recordProviderCallCost` agora alimenta só o Counter Prometheus — sem dupla contagem. Trade-off "debita mesmo se a rede falhar" é documentado e correto (fail-safe para o orçamento).
- **Correção real (MOD-11):** `socialInteraction.service.ts` valida `leadId` contra `organizationId` antes de gravar `TimelineEvent` (que não tem orgId próprio — trava de tenancy correta e necessária), rate limit por org (20/h) antes de qualquer I/O, summary truncado. Rota montada sob `authenticateToken` + `requireTenant` (`bootstrap/routes.ts:257`). Sem envio real a plataforma — consistente com RN-SOC-01.
- **Tenancy/LGPD:** tenancy explícita nos dois caminhos; rate limiter em memória é limitação documentada (aceitável, mesmo padrão de `providerRateLimit.ts`); summary do usuário vai para TimelineEvent — dado de CRM esperado, não PII indevida.
- **Testes:** `providerBudget.test.ts` (19 testes, incl. provas de concorrência memória+Redis) e `socialInteraction.service.test.ts` (7 testes). Ambos verdes. Verifiquei assertions nos arquivos — cobrem bloqueio, atomicidade e tenancy.
- **Ressalvas (não bloqueantes):**
  1. `assertProspectingBudgetNotExceeded` e `recordProspectingProviderSpend` seguem exportados mas sem uso em caminho de produção (só testes) — documentado como API manual/reconciliação; aceitável, mas candidato a marcação de legado.
  2. No script Lua, quando o débito é bloqueado a chave não recebe `EXPIRE` — se a chave já existia sem TTL (criada por `recordProspectingProviderSpend` antigo), persiste; impacto cosmético (chave mensal já expira pela convenção de buildKey).
  3. Rate limit social é por processo — rajada distribuída entre réplicas não é coberta (documentado; Redis seria o caminho se virar requisito).

### 5. `9cd898683` — Agente 12: auditoria tenancy voice-hub + testes — **APROVADO**

- **Escopo:** somente testes (`src/lib/voice-hub/__tests__/tenant-isolation.test.ts`, 317 linhas) + 5 handoffs. Nenhum código de produção alterado — correto para uma missão de auditoria.
- **Correção real:** o handoff `12-para-00-voicehub-tenancy-auditoria.md` conclui **NO-GO** fundamentado: schema incompatível com `prisma/schema.prisma` (models `tenant`/`membership`/`role` inexistentes, `Session` é Better Auth, `AgentSession` é o correto), identidade JWT paralela com `POST /auth/register` que criaria tenants fora do Better Auth, e `features/voice-hub/routes/index.js` inexistente. Verifiquei que o gate `legacyModuleGate` permanece — coerente com o NO-GO.
- **Testes:** 36 testes verdes. Cobrem isolamento cross-tenant nos services (callLog, session, agent, apiKey, user/LGPD anonymize, webhookEndpoint) com mocks que provam "não toca o repositório" no caminho cross-tenant, mais garantia estrutural (leitura de arquivo) de que todo router de voz aplica `requireTenant`, com exceções documentadas (telephony por assinatura Twilio, health não montado). Assertions fortes (`rejects.toBeInstanceOf(NotFoundError)`, `not.toHaveBeenCalled()`).
- **Tenancy/LGPD:** o próprio objeto da auditoria; sem PII nos artefatos.
- **Observação:** o teste estrutural que lê arquivos-fonte é uma heurística — mas é complementar aos testes de comportamento, não substituto. Aceitável.

### 6. `40ffa4328` — Agente 09: EncryptedOfflineStorage AES-GCM — **APROVADO COM RESSALVAS**

- **Escopo:** 1 serviço novo (291 linhas), alterações em `offlineSync.service.ts` (async storage + `ready`), teste (169 linhas), handoff. Módulo `src/features/mobile/**` — propriedade do Agente 09. Correto.
- **Correção real:** verificado. AES-GCM-256 via WebCrypto, `CryptoKey` **non-extractable** persistida em IndexedDB (structured clone); formato `bh360enc:v1:<iv>:<ct>`; decrypt com tag inválida/chave errada → `null` seguro (sem throw); legado plaintext lido transparentemente e reescrito cifrado na próxima escrita; sem IndexedDB → chave só em memória (degradação documentada, sem fallback para claro silencioso — warning explícito); sem WebCrypto → `LocalStorageAdapter` com warning (último recurso documentado).
- **Correção real (integração):** `StorageAdapter` virou união sync|async; `loadFromStorage`/`persistQueue`/`persistIdMap` agora async; `ready` promise pública aguardada em `enqueue`, `enqueueCreateLead/Note/FieldMeetingAudio`, `syncQueue`, `retryFailed`, `clearQueue`. `sync()` delega a `syncQueue` (herda o await).
- **Tenancy/LGPD:** resolve diretamente o risco LGPD apontado (PII de campo em localStorage claro). Sem segredos commitados; chave não é exportável.
- **Testes:** 10 testes novos — cifrado em repouso, roundtrip, detecção de adulteração, chave diferente → null, legado plaintext, migração, reload sobrevivendo, factory default. 10/10 + suite offlineSync 21/21 verdes.
- **Ressalvas (não bloqueantes):**
  1. `getQueue()`, `getPendingCount()`, `getStats()` são síncronos e podem ser chamados antes de `ready` resolver — consumidores que lerem imediatamente após construir o service verão fila vazia. `ready` é público para isso, mas nenhum caller existente foi auditado nesta revisão; recomendo o 02/09 confirmarem que a UI aguarda `ready` antes de renderizar contadores.
  2. `persistQueue`/`persistIdMap` agora são awaited internamente mas chamados com `void` pelos métodos públicos — falha de escrita é logada (`console.error`) e não propaga; aceitável (fila em memória continua funcional), mas é perda silenciosa de durabilidade offline — já era o comportamento anterior, mantido.
  3. `console.warn`/`console.error` em vez do logger estruturado do projeto — consistente com o estilo pré-existente do arquivo mobile, mas foge do padrão `lib/logger`.

---

## Parecer geral

**APROVADO COM RESSALVAS** — os 6 merges estão dentro do escopo, com correções reais verificadas no código (não apenas nos relatórios), testes fortes e verdes, `tsc --noEmit` limpo e sem violações de tenancy/LGPD ou segredos. Nenhum achado bloqueante.

Pendências registradas para ciência do Coordenador (nenhuma bloqueia integração):
- Agente 04: `addDealItem` segue sem trava de alçada (handoff já aberto `04-para-00`).
- Agente 05: `assertProspectingBudgetNotExceeded`/`recordProspectingProviderSpend` sem uso produtivo (legado documentado); rate limit social por processo.
- Agente 09: consumidores de `getQueue`/`getStats` devem aguardar `OfflineSyncService.ready` (verificar na UI do 02).
- Agente 12: NO-GO do voice-hub mantido — gate `legacyModuleGate` corretamente fechado; handoffs de identidade/schema abertos para 01 e 05.

**Escopo desta aprovação:** apenas os 6 commits listados no HEAD `bfd966ed3` da branch `integracao/coordenador-20261112`. Não aprova release/deploy nem trabalho fora desses diffs. Qualquer modificação posterior nesses arquivos requer novo parecer.
