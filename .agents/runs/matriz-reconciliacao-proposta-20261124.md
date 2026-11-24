# Proposta de Reconciliação — MATRIZ_PROPRIEDADE.md

- **Missão**: DEM-20261123-001 (executor de governança a serviço do Agente 00 — Astra)
- **Data**: 2026-11-24
- **Base**: commit `93e82c22024ccc9ca48abad6b29e855cbd4157f9` (branch `docs/matriz-reconciliacao-20261124`, worktree `wt-matriz`)
- **Escopo**: inventário verificado read-only de caminhos órfãos/divergentes. **Nenhum arquivo de `src/**` foi alterado.** Esta proposta NÃO edita `.agents/MATRIZ_PROPRIEDADE.md` — aplicação cabe ao Astra após revisão humana.

## 1. Inventário verificado

| Caminho | Existe? | Arquivos | AGENTS.md local? | Dono atual na MATRIZ |
|---|---|---|---|---|
| `src/bootstrap/routes.ts` | sim | 1 | não | `20` (via `src/bootstrap/**`, exceto `observability.ts`→95 e `auth.ts`→96) |
| `src/api/**` | parcial | **1** (`middlewares/rate-limit.ts`) | não | `20`/`21`/`22`/`25` — mas `index.ts`, `router.ts`, `controllers/**`, `schemas/**`, `middlewares/**` **não existem** |
| `src/features/voice-hub/**` | sim | **133** | sim (legado: "Agente 12") | `60` (`index.ts`), `61` (`voip/`, `sip/`), `62` (`recording/`), `63` (`transcription/`), `64` (`commands/`), `65` (`ui/`) — **~120 arquivos sem dono** |
| `src/lib/voice-hub/**` | sim | **162** | não | **NENHUM** — backend legado inteiro fora da matriz (desconhecido do orquestrador) |
| `src/features/mobile/**` | sim | **14** | não | **NENHUM** (matriz cobre `src/mobile/**`, diretório diferente, 9 arquivos) |
| `src/features/integrations/**` | sim | **148** | sim (legado: "Agente 06") | só `bitrix/**`→`50` (parcial) |
| `src/lib/integrations/**` | sim | **8** | não | `50`–`59` por subpaths, mas vários inexistem lá |
| `src/lib/auth.ts` | sim | 1 | — | **NENHUM** (matriz cobre `src/lib/auth/**` e `src/lib/auth/rbac/**`, não o arquivo solto) |
| `src/lib/auth-client.ts` | sim | 1 | — | **NENHUM** (achado adicional) |
| `src/lib/env.ts` | **NÃO EXISTE** | 0 | — | n/a — o env real é `src/config/env.ts` (**também sem dono**) |
| `.trivyignore.yaml` | sim | 1 | — | **NENHUM** |
| `src/features/calendar/**` | sim | 9 | sim (legado: "Agente 04") | `45` (Otto) — já coberto; AGENTS.md local desatualizado |
| `src/features/crm360/**` | sim | 22 | não | **NENHUM** |
| `src/config/**` | sim | 11 | não | **NENHUM** (achado adicional; contém `env.ts`) |

## 2. Divergências estruturais detectadas

1. **`src/api/**` é quase vazio.** A superfície HTTP real vive em `src/bootstrap/routes.ts` (monta ~60 routers de `src/features/*/routes`) e `src/bootstrap/webhooks.ts`. As entradas da matriz para `src/api/index.ts`, `router.ts`, `controllers/**`, `schemas/**`, `middlewares/**` referem-se a caminhos inexistentes — ou são reserva de design, ou a matriz pressupõe uma arquitetura que não é a implementada.
2. **Bitrix está dividido em dois mundos.** `src/lib/integrations/bitrix/` tem só 4 arquivos (`client.ts`, `batch/extractor.ts`, `mapping/mapper.ts`) + 2 soltos; a implementação real (58 arquivos: `service/`, `jobs/`, `infra/`, rotas, webhooks) está em `src/features/integrations/bitrix/`. A matriz aponta `51`/`52`/`53`/`54` para subpaths de `src/lib/integrations/bitrix/{auth,batch,webhooks,mapping}` dos quais **`auth/` e `webhooks/` não existem** — auth de fato está em `features/.../service/connections.ts`+`tokenRefreshLock.ts`, webhooks em `bitrix.webhook.ts`/`bitrixWebhook.queue.ts`.
3. **`src/features/integrations/AGENTS.md` e `src/features/calendar/AGENTS.md` e `src/features/voice-hub/AGENTS.md` usam numeração legada** ("Agente 06", "Agente 04", "Agente 12") incompatível com os IDs 00–99 da matriz. Devem ser atualizados quando a matriz for aplicada (fora do meu escopo — read-only).
4. **`src/features/voice-hub/AGENTS.md` reivindica "Agente 12 — dono exclusivo de todo `src/features/voice-hub/**`"**, o que colidiria com a divisão 61–65 da matriz. O AGENTS.md local é legado e precisa de reconciliação explícita.
5. **`/api/voice-hub` está gated como módulo legado indisponível** (`src/bootstrap/routes.ts:211` → `legacyModuleGate.ts`, `module: 'voice-hub'`). O backend `src/lib/voice-hub/**` (162 arquivos) ainda é referenciado por `src/bootstrap/workers.ts:110` (`webhook.worker.js`). É código legado vivo, não morto.
6. **`src/config/env.ts` é o schema fail-fast de ambiente** importado por 7 arquivos de `src/bootstrap/*` — o "`src/lib/env.ts`" citado na missão não existe; o equivalente real é este.

## 3. Proposta de owners (caminho → owner → justificativa → evidência)

### 3.1 Backend HTTP e bootstrap

| Caminho | Owner proposto | Justificativa | Evidência |
|---|---|---|---|
| `src/bootstrap/routes.ts` | **22 — Hugo** (dono único designado, Squad 20) | É o registro central de rotas HTTP — especialidade literal do 22 ("Camada HTTP, Middlewares e Rotas"). Manter em `20` (coordenador) viola "dono único" pedido pelo orquestrador. Demais `src/bootstrap/**` permanecem com `20` (exceções já existentes: `observability.ts`→95, `auth.ts`→96). | `routes.ts` importa/monta ~60 routers; nenhum controller/middleware próprio |
| `src/api/**` | **Manter como está + registrar divergência** | Só existe `middlewares/rate-limit.ts` (já do `25`). Recomendo a matriz marcar `src/api/index.ts|router.ts|controllers/**|schemas/**|middlewares/**` como **"reservado — não implementado"** ou remapeá-los para os caminhos reais (`src/bootstrap/routes.ts`→22, `src/features/*/routes/**`→dono da feature, `src/shared/middlewares/**`→22/96/97). Alternativa: se a intenção é migrar controllers para `src/api/`, isso é decisão de arquitetura do `20`/`21`, não de reconciliação. | `find src/api -type f` = 1 arquivo |
| `src/bootstrap/webhooks.ts` | **20 — Ciro** (inalterado) | Monta webhooks de entrada (signature etc.); coordenador de backend/webhooks de saída é o 29, mas este arquivo é wiring HTTP de entrada → permanece no guarda-chuva `src/bootstrap/**` do 20. | `webhooks.ts:8,34` monta `signatureStatusWebhookRoutes` |

### 3.2 Voice Hub

| Caminho | Owner proposto | Justificativa | Evidência |
|---|---|---|---|
| `src/features/voice-hub/index.ts`, `types.ts` | **60 — Aurora** | Coordenação do domínio voz/omnichannel | já na matriz |
| `src/features/voice-hub/voip/**`, `sip/**` | **61 — Nando** | Discador/SIP — já na matriz | `voip/dialer.ts` (1 arq) |
| `src/features/voice-hub/recording/**` | **62 — Sol** | Já na matriz | `recording/storage.ts` |
| `src/features/voice-hub/transcription/**` | **63 — Lira** | Já na matriz | `transcription/whisper.worker.ts` |
| `src/features/voice-hub/commands/**` | **64 — Tito** | Já na matriz | `commands/command.processor.ts` |
| `src/features/voice-hub/ui/**` | **65 — Lena** | Já na matriz | `ui/Visualizer.tsx` |
| `src/features/voice-hub/api/voiceHub.api.ts` | **65 — Lena** | Cliente API do frontend do Voice Hub (não é contrato público OpenAPI do 21) | 1 arquivo |
| `src/features/voice-hub/hooks/**` | **65 — Lena** | Hooks de UI do Voice Hub | 2 arquivos |
| `src/features/voice-hub/components/**` (63 arqs, incl. `design-system/`, `landing/`, `studio/`) | **65 — Lena** | Roster do 65: "Voice Hub UI e Landing Inovadora". `components/landing/` (13 arqs) e `pages/Landing*` são literalmente a landing inovadora do 65; `components/studio/` é UI do workflow builder. Co-propriedade pontual com 35 (Mia, motion) e 33 (Célia, DS) via review, sem transferência de dono. | `find components -type f` = 63 |
| `src/features/voice-hub/pages/**` (37 arqs: `Dashboard/*`, `Landing*`, `Login`, `Register`, `Playground`, `Results`) | **65 — Lena** | Telas do Voice Hub = interface do domínio do 65. Exceções de conteúdo: `pages/Dashboard/Billing.tsx`→revisão com 26/27; `pages/Dashboard/Telephony.tsx`→revisão com 61. Proponho dono único 65 com revisões obrigatórias (mais simples que fragmentar 37 arquivos). | listagem completa em §1 |
| `src/features/voice-hub/store/**` (14 arqs: `useStudioStore`, `simulationGraph`, `workflowPersistence`, `nodeRegistry`) | **65 — Lena** | Estado do studio/workflow builder do Voice Hub — parte da UI do 65. Alternativa `76` (Dex, workflows) foi descartada: o grafo é do Voice Studio, não do motor de automações. | 14 arquivos |
| `src/features/voice-hub/services/**` (4 arqs) | **dividido**: `callRecord.service.ts`→**62**, `realtimeTranscription.service.ts`→**63**, `telephonyProvider.service.ts`+`vadBargeIn.service.ts`→**61** | Serviços por domínio (gravação/transcrição/telefonia) | nomes e imports |
| `src/features/voice-hub/infra/PrismaCallRecordRepository.ts` | **62 — Sol** (com revisão de schema pelo 11) | Persistência de call records = domínio de gravação/armazenamento de áudio | nome do arquivo |
| `src/features/voice-hub/lib/**` (`moduleNotReady.ts`, `studio/types.ts`) | **65 — Lena** | Utilitários do frontend/studio | 2 arquivos |
| `src/lib/voice-hub/**` (162 arqs: `routes/`, `controllers/`, `services/`, `repositories/`, `middlewares/`, `features/prospecting/`) | **60 — Aurora** como dono único do módulo legado, **pendente deliberação** (§4-C1) | Backend completo do Voice Hub legado, gated por `legacyModuleGate` (`/api/voice-hub` → unavailable). Opções: (a) dono único 60 até decisão de decommission; (b) decomissionar. Subdivisão 61–64 só faria sentido se o módulo for reativado — hoje seria propriedade sobre código morto-vivo. Mínimo: registrar dono para destravar a matriz. | `legacyModuleGate.ts:5`, `routes.ts:211`, `workers.ts:110` |

### 3.3 Mobile

| Caminho | Owner proposto | Justificativa | Evidência |
|---|---|---|---|
| `src/features/mobile/index.ts` | **80 — Navi** | Índice do módulo mobile | 1 arquivo |
| `src/features/mobile/offlineSync.service.ts`, `services/offlineSyncQueue.service.ts`, `services/offlineStorageAdapter.ts` | **85 — Bóris** | Offline-first e sincronização local — especialidade literal | 3 arquivos |
| `src/features/mobile/services/encryptedOfflineStorage.service.ts` | **88 — Sasha** | Armazenamento criptografado local = segurança mobile | 1 arquivo |
| `src/features/mobile/audioRecording.service.ts`, `components/FieldMeetingRecorder.tsx` | **87 — Tomás** | Áudio/voz nativo mobile | 2 arquivos |
| `src/features/mobile/mobileEdgeAi.service.ts` | **87 — Tomás** (com revisão 70/72) | Edge AI on-device — fronteira móvel/IA; Tomás cobre "áudio nativo" mas edge AI pende para 72 (Ada, tool calling) — **deliberação §4-C2** | 1 arquivo |
| `src/features/mobile/server/mobileFieldMeeting.routes.ts` + `.service.ts` | **45 — Otto** | Reuniões/atividades de campo — é backend de agenda/atividades disfarçado de mobile (montado em `/api/mobile`, ver `routes.ts`) | `routes.ts` import linha ~59 |
| `src/features/mobile/__tests__/**` (4 arqs) | co-propriedade governada do 03 conforme matriz | testes do módulo | 4 arquivos |

### 3.4 Integrações — `src/features/integrations/**` (148 arqs)

| Caminho | Owner proposto | Justificativa | Evidência |
|---|---|---|---|
| `bitrix/` — `service/connections.ts`, `service/tokenRefreshLock.ts`, `service/settings.ts`, `client.ts`, `bitrix.service.ts` | **51 — Bela** | Auth/OAuth/conexões Bitrix24 | nomes |
| `bitrix/` — `service/extraction*.ts` (5 arqs), `paginatedExtractor.ts`, `jobs/` | **52 — Lino** | Extrações batch/paginação | nomes |
| `bitrix/` — `bitrix.webhook.ts`, `bitrixWebhook.queue.ts`, `service/outboundSync.ts`, `service/idempotentSync.ts` | **53 — Vega** | Sync bidirecional/webhooks | nomes |
| `bitrix/` — `bitrixFieldMap.ts`, `service/userMapping.ts`, `service/customFields.ts` | **54 — Rita** | De-para de campos/entidades | nomes |
| `bitrix/` — `service/driftMonitor.ts`, `service/syncLogs.ts`, `service/metrics.ts`, `services/bitrix-data-hygiene.service.ts`, `services/bitrixEventMeshBridge.service.ts` | **59 — Ruy** | Observabilidade/reconciliação de sync (B-11/B-12) | nomes |
| `bitrix/` — `bitrix.api.ts`, `bitrix.routes.ts`, `hubTasks.routes.ts`, `dailyPlanRoutes.ts`, `service/dailyPlan*.ts` (4), `service/hubTasks.service.ts`, `service/ownershipGuard.ts`, `service/leads.ts`, `service/deals.ts`, `infra/BitrixLeadWritebackAdapter.ts`, `syncActivityToBitrix.ts` | **50 — Atlas** | Coordenação/rotas gerais do ecossistema Bitrix (matriz já dá `hub-tasks` e "coordenação" ao 50). `dailyPlan*` e `leads/deals` são serviços de negócio Bitrix — **deliberação §4-C3** (podem ir a 41/42) | rotas montadas em `routes.ts` |
| `bitrix/components` via `components/bitrixImport/*` (6 arqs) + `BitrixExtractionPanel`, `BitrixSyncRulesPanel` | **50 — Atlas** | UI de gestão Bitrix do domínio do 50 | paths |
| `whatsapp/**` (14 arqs: rotas, service, Baileys `useRedisAuthState`, hooks, components) | **56 — Luna** | Conector WhatsApp/Meta — Baileys é literalmente o escopo do 56. Overlap com `src/lib/integrations/whatsapp/baileys.client.ts` (mesmo dono 56 — reconciliar duplicação, §4-C4) | `useRedisAuthState.ts` = Baileys |
| `email/**` (5 arqs) | **55 — Ícaro** | Conectores de e-mail, parsing, reply webhook | paths |
| `google/**` (4 arqs: OAuth Gmail+Calendar) | **57 — Nico** | Integrações de calendário/reuniões; Gmail overlap com 55 — **deliberação §4-C5** | `google.routes.ts` comenta "Gmail + Calendar" |
| `threecx/**` (4 arqs) | **61 — Nando** | 3CX é PBX/telefonia — discador/SIP do 61 | nome do conector |
| `birth-voice/**` (21 arqs: `coldCall.*`, `voiceScript`, `callSuppression`, webhook, rotas, components) | **61 — Nando** (com revisões) | Discador voz outbound; `coldCall.policy/scoring/service` tangencia prospecção (43 Amon) e `callSuppression` tangencia opt-out (69 Eli) — **deliberação §4-C6**. Restrição do AGENTS.md legado ("ABERTURA OBRIGATÓRIA" p/ consentimento LGPD) deve ser preservada na reconciliação | AGENTS.md local §"Não pode" |
| `stripe/**` (6 arqs: service, webhook, `infra/StripeChargeAdapter`, panel) | **26 — Dália** | Gateway de pagamento/faturas/webhooks financeiros = especialidade literal do 26. **Atenção**: fica dentro de `features/integrations`, mas natureza é billing — Squad 20. Sobreposição com `src/features/billing/**` (26/27) deve ser explicitada | `stripe.webhook.ts`, `StripeChargeAdapter.ts` |
| `omie/**` (3 arqs) | **58 — Elisa** | ERP/conector de enriquecimento | nome |
| `signature/**` (1 arq: `signatureStatus.webhook.ts`) | **58 — Elisa** (provisório) — **deliberação §4-C7** | Webhook de status de assinatura digital; natureza documental/ERP adjacente. Alternativas: 29 Lia (webhooks de saída — não, é entrada), 20 Ciro. Sem dono natural claro no roster | montado em `webhooks.ts:34` |
| `slack/**` (3 arqs) | **50 — Atlas**? — **deliberação §4-C8** | Conector Slack não tem dono natural no roster. Candidatos: 50 (coordenação integrações — mas pedido foi dono específico), 68 Paco (canais/notificações), 58 Elisa ("conectores"). Proponho **58 — Elisa** por analogia a "conectores externos genéricos", com ressalva | `slack.routes.ts`, `slack.service.ts` |
| `chatwoot/**` (3 arqs: webhook + helpers) | **66 — Kiko** | Chatwoot é helpdesk/inbox — "Inbox Unificado e Roteamento" do 66 | webhook de conversa |
| `hubspot/`, `monday/`, `pipedrive/`, `rdstation/` (1 arq cada: `*Provider.ts`) | **54 — Rita** | São providers do `ExternalCrmService` (de-para de entidades CRM externas). Alternativa **53 Vega** (sync) — ver §4-C9 | `shared/externalCrm.routes.ts` cita "HubSpot, Pipedrive, RD, Monday" |
| `shared/` (`CrmProvider.ts`, `ExternalCrmService.ts`, `externalCrm.routes.ts`) | **54 — Rita** | Camada de-para/provedor de CRMs externos — mesma natureza do 54 | paths |
| `components/` genéricos (`Integrations.tsx`, `ExternalCrmPanel.tsx`, `IntegrationStatusBadge.tsx`, `integrationUi.tsx`, `WebhookMonitor.tsx`, `ThreeCxConnectionCard.tsx`, `externalCrm/ExternalCrmConnectModal.tsx`) | **50 — Atlas** | UI de gestão do ecossistema de integrações; `externalCrm/*` acompanha o dono do shared (54) — **refinar §4-C10** | paths |
| `components/bitrixImport/*` | **50 — Atlas** (com 52 na revisão de import) | UI de importação Bitrix | paths |
| `routes/integrationsPing.routes.ts` | **22 — Hugo** | Router HTTP puro de health/ping | path |
| `src/features/integrations/AGENTS.md` | atualizar dono declarado | legado "Agente 06" → novo mapeamento por subdir acima | arquivo |

### 3.5 `src/lib/integrations/**` (8 arqs) — reconciliação Bitrix

| Caminho | Owner proposto | Justificativa |
|---|---|---|
| `bitrix/client.ts` | **51 — Bela** | client/auth Bitrix |
| `bitrix/batch/extractor.ts` | **52 — Lino** | batch/paginação |
| `bitrix/mapping/mapper.ts` | **54 — Rita** | mapeamento |
| `calendar/google.sync.ts` | **57 — Nico** | sync Google Calendar |
| `erp/cnpj.service.ts` | **58 — Elisa** | ERP/enriquecimento CNPJ |
| `whatsapp/baileys.client.ts` | **56 — Luna** | Baileys — mesmo dono do `features/integrations/whatsapp` |
| `integrationSettings.repository.ts` | **50 — Atlas** | settings cross-integrações |
| `webhookIdempotency.ts` | **53 — Vega** (revisão 24 Ivo) | idempotência de webhook — 24 é dono de "idempotência" no Squad 20, mas o arquivo vive no domínio de webhooks de integração; **deliberação §4-C11** |

### 3.6 Auth, env, segurança

| Caminho | Owner proposto | Justificativa | Evidência |
|---|---|---|---|
| `src/lib/auth.ts` (arquivo solto) | **96 — Nera** | Instancia `betterAuth`, lockout de conta, JWT/sessão — especialidade literal do 96. Deve ser absorvido por `src/lib/auth/**` ou declarado explicitamente | imports `auth/password-hash.js`, `audit.service.js` |
| `src/lib/auth-client.ts` | **96 — Nera** | Client de auth — mesmo domínio | arquivo solto |
| `src/config/env.ts` (o "env.ts" real) | **98 — Safira** | Schema Zod fail-fast de variáveis de ambiente/segredos (`DATABASE_URL`, chaves). Dono único infra/segurança. Alternativa **96 Nera** — **deliberação §4-C12**. O restante de `src/config/**` (`module-catalog`, `capability-catalog`, `product-modules`, `access-policy`, `job-role-catalog`) → **27 — Vic** (entitlements/feature flags); `brand.ts`→39 Tina; `network.ts`→90 Hélio; `playbooks.ts`/`prospecting-integrations.ts`→47 Dante/43 Amon — **achado adicional §4-C13** | `env.ts` importado por 7 arquivos de `src/bootstrap/*` |
| `.trivyignore.yaml` | **99 — Vito** (sob Squad 90) | Waivers de SAST/dependências — especialidade literal do 99 ("SAST e Secret Scanning"). Já referencia `docs/security/AUDIT_WAIVERS.md` (sugiro declarar `docs/security/**`→99 também) | cabeçalho do arquivo |

### 3.7 CRM adjacentes

| Caminho | Owner proposto | Justificativa | Evidência |
|---|---|---|---|
| `src/features/calendar/**` (9 arqs) | **45 — Otto** (inalterado) | Já está na matriz. AGENTS.md local diz "Agente 04" (legado) — atualizar texto, não o dono | AGENTS.md local |
| `src/features/crm360/**` (22 arqs: rotas públicas+privadas, controller, schema Zod, repositórios Prisma, propostas/deals/discount authority) | **42 — Lívia** | Domínio de propostas/deals/pipeline — "Pipelines, Deals e Estágios". Subdivisão possível (`crm360.schema.ts`→21, `infra/`→10) rejeitada por fragmentar 22 arquivos de um bounded context coeso; regra de ouro: 1 dono, revisões cruzadas | `crm360.routes.ts`, `Crm360Controller.ts`, `PrismaCrm360Repository.ts` |

## 4. Conflitos e itens que exigem deliberação do Astra/Orquestrador

- **C1 — `src/lib/voice-hub/**` (162 arqs, maior órfão do repo)**: módulo legado gated como indisponível mas com worker ativo. Decisão necessária: (a) dono único 60 até decommission; (b) missão de remoção; (c) reativação com split 61–64. **Bloqueia reconciliação completa da matriz.**
- **C2 — `mobileEdgeAi.service.ts`**: fronteira 87 (Tomás, nativo) vs 72 (Ada, tool calling IA). Proposta: 87 com revisão obrigatória do 72.
- **C3 — `bitrix/service/dailyPlan*` e `leads/deals/ownershipGuard`**: propus 50 (Atlas), mas daily plan/leads/deals são lógica de negócio CRM — podem pertencer a 41/42/45. Precisa deliberação Squad 40 × Squad 50.
- **C4 — Duplicação WhatsApp**: `features/integrations/whatsapp/**` (14 arqs, Baileys completo) vs `lib/integrations/whatsapp/baileys.client.ts` (1 arq). Mesmo dono 56, mas a duplicação em si é dívida a registrar (regra de não duplicação §34).
- **C5 — `google/**`**: OAuth cobre Gmail + Calendar; propus 57 (Nico) mas o componente Gmail tangencia 55 (Ícaro). Manter 57 com nota ou split por arquivo?
- **C6 — `birth-voice/coldCall.*` e `callSuppression.service.ts`**: cold call = prospecção (43 Amon) e supressão = opt-out/compliance (69 Eli). Manter 61 com revisões ou split?
- **C7 — `signature/**`**: sem dono natural. Provisório 58 Elisa; alternativa 29 Lia ou criar exceção para 20.
- **C8 — `slack/**`**: mesmo problema. Provisório 58; alternativa 68 Paco.
- **C9 — Providers de CRM externo** (`hubspot/monday/pipedrive/rdstation` + `shared/`): propus 54 Rita (de-para), mas a natureza é "sync de CRM externo" que pode ser 53 Vega ou domínio Squad 40. Deliberação necessária.
- **C10 — `components/` genéricos de integrations**: propus 50 Atlas; `externalCrm/*` deveria acompanhar 54 se C9 mudar.
- **C11 — `webhookIdempotency.ts`**: 53 Vega vs 24 Ivo (idempotência é especialidade do 24). Arquivo único em lib de integrações — sugiro 53 por coesão de domínio.
- **C12 — `src/config/env.ts`**: 98 Safira (segredos) vs 96 Nera (auth/security adjacente) vs 90 Hélio (infra). Propus 98.
- **C13 — `src/config/**` restante** (catálogos de módulo/capability/job-role/access-policy, brand, network, playbooks): fora do escopo estrito da missão, mas é órfão real. Proposta preliminar na §3.6; recomendo incluir na matriz para zerar órfãos.
- **C14 — `src/api/**` fantasma**: entradas da matriz apontam para arquivos inexistentes. Decidir: marcar como reservado ou remapear para caminhos reais.
- **C15 — AGENTS.md locais legados** (`features/integrations`, `features/calendar`, `features/voice-hub`, `lib/auth`): declaram donos por numeração antiga (Agente 04/06/12/01). Precisam ser reescritos na aplicação da matriz — incluir na missão do Astra.

## 5. Resumo executivo

- **17 caminhos verificados**, ~490 arquivos órfãos ou parcialmente cobertos.
- **3 achados não previstos na missão**: `src/lib/voice-hub/**` (162 arqs — o maior órfão), `src/config/**` (inclui o `env.ts` real), `src/lib/auth-client.ts`.
- **1 caminho inexistente**: `src/lib/env.ts` (real: `src/config/env.ts`).
- **1 módulo legado vivo**: voice-hub backend gated — requer decisão de decommission.
- Nenhuma edição em `src/**` ou na MATRIZ foi feita. Somente este documento foi criado.
