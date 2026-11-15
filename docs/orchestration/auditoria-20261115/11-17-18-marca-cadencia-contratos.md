# Auditoria — Cluster 11/17/18: Marca e Ativos Institucionais, Cadência Multicanal e Contratos/API

- **Demanda:** DEM-20261115-001
- **Data:** 2026-11-15
- **Método:** leitura estática do repositório + execução de `npm run verify:openapi-drift` (resultado: ✅ sem deriva estrutural — ver achado F-01 sobre o que esse gate NÃO cobre). Nenhum arquivo de produto foi modificado; este relatório é a única escrita.

---

## 1. Escopo auditado

| Área | Caminhos examinados |
|---|---|
| Marca / identidade visual | `identidade-visual/` (README, brandbook/manuals HTML, `birthhub360/tokens/*`, `logos/`, `characters/`), `src/config/brand.ts`, `src/styles/official-identity.css`, `src/styles/luxury-tokens.css`, `src/components/brand/BirthHubLogo.tsx` |
| Documentação de aplicação | `documentacao-aplicacao/` (AGENTS.md, `briefing/`, `inventario/mapa-de-navegacao.md`, `roteiros/`, `imagens/`) |
| Cadência multicanal / opt-out / execuções | `src/features/cadence/**` (domain, application, infra, jobs, services, components), `src/shared/domain/optOut.ts`, `src/shared/services/optOutService.ts`, `src/shared/services/optOutCheck.service.ts`, `src/features/lgpd/lgpd.routes.ts`, `src/features/automations/cadenceIntegration.service.ts`, `prisma/schema.prisma` (modelos OptOutRecord/CadenceRun/CadenceSequence/MultichannelCadenceEnrollment) |
| Contratos e OpenAPI | `docs/openapi.yaml` (seções `/cadence/*`, `/lgpd/opt-out*`, schemas `CadenceOptOut*`), `scripts/verify-openapi-drift.ts`, `src/shared/contracts/openapiRouteInventory.ts`, `src/shared/contracts/multichannelCadence.contract.ts`, `src/shared/contracts/selfDrivingCrm.contract.ts`, `src/features/cadence/cadence.api.ts`, `src/bootstrap/routes.ts` |

---

## 2. Elogios (com evidência)

1. **Opt-out unificado é o ponto mais maduro do repositório.** `src/shared/domain/optOut.ts` é lógica pura e exaustivamente semântica: normalização de e-mail/telefone E.164 (`normalizeOptOutSubject`, linhas 89-95), casamento por qualquer identificador (`subjectsMatch`, 108-116), escopo `global` vs por canal (`scopeBlocksChannel`, 119-121). A camada de aplicação (`src/shared/services/optOutService.ts:34-103`) nunca loga PII em claro (comentário e código nas linhas 59-70) e `recordOptOut` recusa sujeito sem identificador válido em vez de gravar registro inerte (linhas 39-45).
2. **Gate de opt-out em três camadas no início da cadência.** `POST /api/cadence/runs` (`cadence.routes.ts:384-417`) aplica `checkOptOutStatus` por canal para leads com `contactId` E `checkCadenceStartEligibility` para todos — cobrindo leads sem contato, caso que antes passava sem trava nenhuma (comentário TAREFA-SANEAMENTO-035, BT360-DT-0080). A elegibilidade consulta o `OptOutRecord` para CADA canal distinto da sequência (`cadenceEligibility.ts:49-57`).
3. **Worker de cadência com disciplina operacional rara.** `jobs/cadenceRun.worker.ts`: bypass de RLS restrito à descoberta cross-tenant e explicitamente comentado (linhas 130-133); cada run processado com `requestContext.run({ tenantId })` real (linha 167, 187); run com sequência inválida é encerrado como `failed`/`policy-guardrail` em vez de ficar pulado para sempre (linhas 162-184); trava Redis por runId (`advanceCadenceRun`, `cadenceService.ts:170-177`); re-verificação pré-envio de resposta do lead e de mudança de status (linhas 283-312); persistência pós-dispatch com retry e log de severidade crítica para risco de duplicidade (linhas 320-341); deduplicação de skip de rate-limit por episódio (`isRedundantRateLimitSkip`, 137-145, 244-267).
4. **Rate limit multicanal documentado e testado.** `application/rateLimitService.ts`/`rateLimitConfig.ts` cruzam qualquer cadência/run do mesmo contato — não só o run atual — com política lida de env a cada tick (`cadenceRun.worker.ts:113-118`).
5. **OpenAPI honesto onde reconhece limitação.** `docs/openapi.yaml:7274-7286` declara explicitamente que a criação do evento no Google Calendar é stub de transporte e que o `googleEventId` é sintético — documentação que não esconde dívida.
6. **Documentação de aplicação autoconsciente.** `documentacao-aplicacao/inventario/mapa-de-navegacao.md` registra divergências conhecidas ("Dojo de Vendas" → "Roleplay", grupo "Ferramentas" removido, correção de "Cockpit CRM sem rota") em vez de escondê-las.
7. **Identidade visual tem precedência e fonte de verdade declaradas.** `identidade-visual/README.md:5-10` ordena brandbook → manual visual → manual de produto → catálogo; `src/config/brand.ts:4-6` declara espelhamento e proíbe texto solto de marca.
8. **Gate de drift OpenAPI existe e roda.** `npm run verify:openapi-drift` executado nesta auditoria: 80 prefixos montados, 506 paths documentados, 78 routers resolvidos — passou (mas ver F-01/F-02 sobre a cegueira do gate).

---

## 3. Propostas de melhoria

1. **Estender o Passe 2 do verificador de drift para o sentido inverso** (path/método documentado sem rota real), ou ao menos um check de "path documentado cujo último segmento não casa nenhum `router.<method>` resolvido". Isso pegaria F-01/F-02 automaticamente. Dono sugerido: Agente 18 (contratos) com revisão do 08 para CI.
2. **Unificar os três sistemas de tokens de marca em uso simultâneo** (`luxury-tokens.css` neon `#00D4FF/#0D0D0D`, `official-identity.css`/`birthhub360.css` gold/iris `#D4AF37/#1677FF`, e os mirrors `.json`/`.ts` neon): declarar um canônico, deprecar os demais com handoff, e adicionar teste de paridade JSON↔TS↔CSS (hoje `.ts` diz "espelho de birthhub360.json e birthhub360.css" mas diverge dos dois).
3. **Atualizar `mapa-de-navegacao.md`** para a navegação real de `tabMeta.ts` (hoje lista ~20 itens; o código tem ~45 tabs, incluindo Cadências, Jornadas Comerciais, Processos de Vendas, Roteiros de Abordagem, Plano Diário, Forecast, Mesa de Tratamento, Acesso a Módulos etc.) e corrigir "conferida em 26/08/2026".
4. **Decidir o destino dos serviços "simulados" de cadência** (`adaptiveMultichannelCadence.service.ts`, `multichannelDispatcher.service.ts`, `selfDrivingCrm.service.ts`): ou ligar ao runtime real (worker `cadenceRun.worker.ts` + `CadenceDispatchers.ts`), ou remover/marcar como não-produção — hoje coexistem dois "motores" de cadência com semânticas incompatíveis.
5. **Alinhar o body documentado de `POST /cadence/opt-outs`** ao schema real da rota (ver F-04) e adicionar validação zod em `POST /lgpd/opt-out` (`lgpd.routes.ts:134-155` lê `req.body` cru).
6. **Re-verificar opt-out na janela residual pré-dispatch**: `advanceCadenceRun` re-checa `hasLeadReplied` antes de despachar (`cadenceService.ts:298`) mas não re-checa `isOptedOut` — um opt-out registrado entre a checagem (linha 190) e o envio (linha 314) passa. Re-checar opt-out junto à re-verificação de resposta reduziria a janela LGPD residual.
7. **Corrigir comentários defasados** que dizem que o adaptador Prisma de opt-out "ainda não existe" (`src/shared/domain/optOut.ts:12-15`, `src/shared/services/optOutService.ts:15-17`) — `PrismaOptOutRepository` existe e a tabela `OptOutRecord` está em produção (`prisma/schema.prisma:3143`).

---

## 4. Erros, falhas e dívidas técnicas

### P0 — nenhum encontrado

Nenhum vazamento de dados cross-tenant explorável ou envio real a opt-out confirmado nos caminhos auditados. O worker e as rotas de cadência aplicam tenant corretamente.

### P1

- **F-01 — Dois endpoints documentados em `docs/openapi.yaml` não existem no código (drift fantasma não detectado pelo gate).**
  - `GET /cadence/opt-outs/check` — `docs/openapi.yaml:6954-6979`. Não existe `router.get('/opt-outs/check')` em `src/features/cadence/cadence.routes.ts` (rotas reais: `/opt-outs` GET/POST nas linhas 114 e 135). `grep -rn "opt-outs/check" src` → zero ocorrências.
  - `POST /cadence/runs/{id}/events` — `docs/openapi.yaml:7246-7271`. Não existe rota equivalente; `cadence.routes.ts` só tem `/runs/:id/pause|resume|stop` (linhas 462, 478, 494). A descrição cita "handoff 13-para-17" e `CadenceExecutionPort`, mas nenhum handler foi implementado.
  - **Causa raiz do gate cego:** `computeOpenApiDrift` (`src/shared/contracts/openapiRouteInventory.ts:176-180`) só marca path documentado como fantasma se NENHUM prefixo de servidor o cobrir — `/cadence/opt-outs/check` é "coberto" pelo mount `/api/cadence`. O Passe 2 (`scripts/verify-openapi-drift.ts:316-362`) só reporta endpoints reais sem doc (`undocumented-path`/`undocumented-method`), nunca doc sem endpoint real. Verificado empiricamente: o verificador passou com esses dois paths fantasmas presentes.
  - Impacto: consumidores da API (agentes, integrações, futuras UIs) implementarão chamadas que retornam 404.

- **F-02 — Três sistemas de tokens/cores de marca divergentes em produção.**
  - `identidade-visual/birthhub360/tokens/birthhub360.json` e `.ts` ("espelho", `.ts:1`) usam paleta **Neon** (`#00D4FF`, `#FF2D9B`, `#FFC107`, fundo `#0D0D0D` — `.ts` linhas 36-56; json `colors.dark`).
  - `identidade-visual/birthhub360/tokens/birthhub360.css` (importado pela app via `src/styles/official-identity.css:1`) usa paleta **Gold/Iris/Orbit** (`#D4AF37`, `#1677FF`, `#7C3AED`, fundo `#061A3A` — css linhas 11-97).
  - `src/styles/luxury-tokens.css` (importado por `src/index.css:2`) usa a paleta Neon antiga (`--lux-neon-blue: #00d4ff`, `--lux-obsidian: #0d0d0d`, linhas 18-51) — ~10 arquivos `src/` ainda consomem variáveis `lux-*`, enquanto ~75 consomem os tokens oficiais. `src/config/brand.ts:38-58` segue a paleta gold/iris.
  - O próprio README admite a divergência para SVGs (`identidade-visual/README.md:25`), mas não para os tokens — e o `.ts` afirma ser espelho do `.css`, o que é falso. Três "verdades" de marca coexistem; qualquer tela que use `lux-*` renderiza uma marca diferente da oficial.

- **F-03 — `mapa-de-navegacao.md` desatualizado em relação à Sidebar real (drift de documentação viva).**
  - O mapa ("conferida em 26/08/2026", linha ~3) lista ~20 itens; `src/components/layout/tabMeta.ts:167-251` define ~45 tabs, incluindo itens ausentes do mapa: Cadências (plural; mapa diz "Cadência"), Jornadas Comerciais, Processos de Vendas, Roteiros de Abordagem, Plano Diário, Tarefas & Atividades, Pesquisa de Mercado, Playbooks Comerciais, Command Center, Relatórios Avançados, Forecast, Metas e Projeções, Pipeline Ponderado, Inteligência de Vendas, Copiloto IA, Sinais & Riscos, Diagnóstico SDR, Mesa de Tratamento, Acesso a Módulos, Ajustes de Hub/Orquestração/Performance/Previsibilidade/Vendas/IA/Automação/Engajamento — e itens do mapa com rótulo divergente ("Cockpit CRM" → "Gestão de Negócios" `tabMeta.ts:171`; "Guia Bitrix24" → "Guia Prático Bitrix24" `:233`). O próprio AGENTS.md da pasta manda atualizar o arquivo a cada mudança de menu — a regra foi violada.

### P2

- **F-04 — Schema documentado de `POST /cadence/opt-outs` diverge do contrato real.** `docs/openapi.yaml:13774-13785` (`CadenceOptOutCreateRequest`) exige `contactId` + `channel` (enum `email|whatsapp|voice|all`); a rota real (`cadence.routes.ts:124-133`) aceita `scope` (enum `email|whatsapp|voice|global`), `leadId`, `contactId` (opcional), `email`, `phone`, `originChannel`, `reason`, `evidence` — `contactId` é opcional e `'all'` não existe. Cliente gerado do YAML quebraria contra a API real. O gate não pega divergência de schema (escopo declarado em `openapiRouteInventory.ts:10-16`).

- **F-05 — Dois "motores" de cadência paralelos com semântica incompatível; o secundário é código morto/enganoso.**
  - `src/features/cadence/services/adaptiveMultichannelCadence.service.ts` implementa `IMultichannelCadencePort` mas `executeNextStep` faz **"execução simulada"**: avança `currentStep`, gera `messageId: msg-<uuid>` fake e retorna `success: true` **sem despachar nada** (linhas 159-177) — viola a regra do próprio `src/features/cadence/AGENTS.md` ("nenhuma escrita otimista: 'enviado' só depois de confirmação real"). `cadenceStepsStore` é `Map` em memória com apenas `'default-b2b-cadence'` hardcoded (linhas 22-52): qualquer outro `cadenceId` é marcado `completed` imediatamente (linhas 104-116).
  - `src/features/cadence/services/multichannelDispatcher.service.ts:13-28` loga "Disparo de cadência realizado com sucesso" e retorna `success: true` sem enviar nada.
  - `executeNextStep`/`enrollLead`/`registerOptOutAndHalt` não têm nenhum caller de produção (verificado por grep); apenas `isLeadOptedOut` é usado (`services/selfDrivingCrm.service.ts:224`). O motor real é `cadenceRun.worker.ts` + `CadenceDispatchers.ts`. Risco: alguém "ligar" o caminho simulado achando que envia de verdade.

- **F-06 — `isLeadOptedOut` tem semântica de opt-out mais fraca e divergente do resto do sistema.** `adaptiveMultichannelCadence.service.ts:251-257` retorna `true` se existir QUALQUER `OptOutRecord` do lead — ignora `scope` (um opt-out só de e-mail bloqueia tudo) e só passa `{leadId}` como sujeito (opt-outs registrados por e-mail/telefone sem leadId não casam). Diverge de `isOptedOut`/`anyRecordBlocksChannel`, que respeitam escopo e cruzam os três identificadores.

- **F-07 — `selfDrivingCrm.service.ts` é um serviço "produtivo" baseado em mocks.** `services/selfDrivingCrm.service.ts:18-37`: `optOutRepo` default é `InMemoryOptOutRepository` (opt-outs reais em Postgres invisíveis se `setOptOutRepository` não for chamado — e nenhum caller de produção chama), `mockLeadsStore` é `Map` em memória, e o filtro de tenant aceita leads sem `organizationId` para qualquer tenant (linha 205: `!lead.organizationId || ...`) — vazamento cross-tenant latente. O singleton `selfDrivingCrmService` (linha 401) não tem consumidores fora de testes: código morto com armadilhas LGPD/tenancy embutidas.

- **F-08 — Comentários defasados afirmam que adaptadores Prisma de opt-out "ainda não existem".** `src/shared/domain/optOut.ts:12-15` e `src/shared/services/optOutService.ts:14-17` dizem que o schema "ainda não foi aplicado" e que `InMemoryOptOutRepository` é "a única implementação" — mas `src/shared/infra/PrismaOptOutRepository.ts` existe, é usado pelas rotas (`cadence.routes.ts:5`) e pelo worker (`cadenceRun.worker.ts:27`), e `OptOutRecord` está em produção (`schema.prisma:3143`, comentário na linha 980 "já estava em produção"). Documentação interna enganosa para o próximo agente.

### P3

- **F-09 — Janela residual de opt-out entre checagem e despacho.** `advanceCadenceRun` re-verifica resposta do lead e status do run imediatamente antes de `dispatcher.dispatch` (`cadenceService.ts:283-314`) mas não re-verifica `isOptedOut`. Um opt-out registrado nesse intervalo ainda resulta em um envio. Janela pequena, mas o requisito "opt-out é a trava mais forte" justificaria re-checagem barata no mesmo ponto.
- **F-10 — `POST /lgpd/opt-out` sem validação de entrada.** `src/features/lgpd/lgpd.routes.ts:134-155` lê `req.body` cru (sem zod), repassando `channel`/`scope`/`originChannel` arbitrários a `lgpdService.recordOptOut` — inconsistente com o padrão `validateRequest` usado em `cadence.routes.ts`.
- **F-11 — Duplicação cosmética em `cadence.routes.ts`.** `import` no meio do arquivo (linha 188) e dois mounts idênticos (`POST /templates/seed-defaults` e `POST /playbooks/load-defaults`, linhas 250-251) para o mesmo handler — dívida de higiene, não de comportamento.
- **F-12 — `documentacao-aplicacao/briefing/resumo-executivo.md:11` cita "Copilot Global"**, nome que não corresponde a nenhum item atual do menu ("Copiloto IA", `tabMeta.ts:223`). Drift menor de nomenclatura.
- **F-13 — `AGENTS.md` de `src/features/cadence/` desatualizado quanto à arquitetura.** Descreve `domain/` com `replyTracking.ts`, `proposal.ts`, `dealClosure.ts` e `infra/` como "implementações em memória usadas nos testes" — a pasta real tem `rateLimit.ts`, `cadenceTemplates.ts`, re-exports em `domain/optOut.ts`, e ~10 adaptadores Prisma de produção em `infra/`. A regra de governança está correta; a descrição do layout não.

---

## 5. Resumo executivo

O núcleo de cadência multicanal madurou bem: opt-out unificado com domínio puro, persistência Prisma, verificação em lote no início do run, trava por run, rate limit cross-cadência e worker com disciplina de tenant/RLS exemplares — LGPD está bem servida nos caminhos reais. As dívidas concentram-se na **borda**: (1) `docs/openapi.yaml` documenta dois endpoints de cadência que não existem (`/opt-outs/check`, `/runs/{id}/events`) e o verificador de drift é estruturalmente cego a "doc sem rota" — P1; (2) três paletas de marca divergentes (Neon vs Gold/Iris) coexistem entre tokens oficiais, mirrors `.ts/.json` e `luxury-tokens.css` ainda consumido por ~10 arquivos — P1; (3) `mapa-de-navegacao.md` está ~3 meses e ~25 itens atrás da Sidebar real — P1 de documentação viva. No lado do código, dois serviços de cadência "simulados" (execução fake com `success:true`, opt-out check mais fraco e tenant filter permissivo em `selfDrivingCrm.service.ts`) são código morto hoje mas armadilhas prontas — recomendo removê-los ou marcá-los inequivocamente como não-produção antes que alguém os conecte a uma rota. Nenhum P0 encontrado.
