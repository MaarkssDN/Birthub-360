# MATRIZ DE PROPRIEDADE — 100 AGENTES (BIRTH HUB 360)

**Revisão 2026-11-24 (pós-Onda 3):** reconciliação de caminhos órfãos/divergentes conforme `.agents/runs/matriz-reconciliacao-proposta-20261124.md` e deliberações do Orquestrador Humano: `src/features/cadence/**`→44 (formalizado), `src/features/integrations/**` distribuído por subdiretório entre 50–59 e donos de domínio (stripe→26, chatwoot→66, threecx/birth-voice→61), `src/lib/voice-hub/**`→60 até decisão de decommission (preservação temporária ordenada), `src/lib/auth{,-client}.ts`→96, `src/config/env.ts`→98, `src/bootstrap/routes.ts`→22, `src/features/crm360/**`→42, `src/features/mobile/**`→80/85/87/88/45. Itens `src/api/**` marcados como reservado (não implementado).

## Squad 00 — QA, LGPD e Auditoria
| ID | Diretórios e Ficheiros OBRIGATÓRIOS |
|:---|:---|
| `00` | `server.ts`, `package.json`, `.agents/ESTADO_ATUAL.md` |
| `01` | `.agents/templates/**` |
| `02` | `tests/setup/**`, `jest.config.js`, `vitest.config.ts` |
| `03` | `tests/unit/**` (co-propriedade governada: cada especialista 01–99 pode criar/editar o arquivo `*.test.ts(x)` dedicado exclusivamente ao seu módulo sob revisão do Agente 09; suítes transversais e `tests/architecture/**` são exclusivas do 03), `tests/architecture/**` |
| `04` | `tests/integration/**` |
| `05` | `tests/e2e/**`, `cypress/**`, `playwright.config.ts` |
| `06` | Acesso de leitura global (Auditoria de persistência) |
| `07` | `docs/lgpd/**` |
| `08` | `src/features/privacy/**`, `src/shared/services/dataSubject*.ts` |
| `09` | `.agents/reviews/**` |

## Squad 10 — Dados e Multi-Tenancy
| ID | Diretórios e Ficheiros OBRIGATÓRIOS |
|:---|:---|
| `10` | `src/lib/db/index.ts`, `src/lib/prisma.ts`, `src/lib/prisma-interceptors.ts`, `src/lib/__tests__/prisma-interceptors.unit.test.ts` |
| `11` | `prisma/schema.prisma` |
| `12` | `prisma/migrations/**` |
| `13` | `src/lib/tenant-prisma.ts`, `scripts/security/rls-coverage.ts`, `scripts/security/check-rls-coverage.ts`, `supabase/migrations/**` (se aplicável) |
| `14` | `prisma/seed.ts`, `tests/fixtures/**` |
| `15` | `src/lib/db/retention/**` |
| `16` | `src/lib/db/queries/**` |
| `17` | `src/lib/cache/**`, `redis.config.ts` |
| `18` | `src/features/audit-logs/**` |
| `19` | `scripts/backup/**`, `scripts/verify-integrity.ts` |

## Squad 20 — Core Backend, APIs e Billing
| ID | Diretórios e Ficheiros OBRIGATÓRIOS |
|:---|:---|
| `20` | `src/bootstrap/**` (exceto `observability.ts` do 95, `auth.ts` do 96 e `routes.ts` do 22); `src/api/index.ts`, `src/api/router.ts`, `src/api/controllers/**`, `src/api/schemas/**`, `src/api/middlewares/**` = **reservado — não implementado** (superfície HTTP real vive em `src/bootstrap/routes.ts` e `src/features/*/routes/**`) |
| `21` | `src/api/schemas/**`, `openapi.yaml`, `docs/openapi.yaml`, `postman/specs/**` |
| `22` | `src/bootstrap/routes.ts`, `src/api/controllers/**`, `src/api/middlewares/**` (exceto `rate-limit.ts` do 25), `src/shared/middlewares/**` (exceto `authenticateToken.ts` e `authorization.ts` do 96/97), `src/middleware/**`, `src/features/integrations/routes/**` |
| `23` | `src/lib/queue/**`, `src/workers/**` |
| `24` | `src/lib/resilience/**`, `src/lib/queue/dlq/**` |
| `25` | `src/api/middlewares/rate-limit.ts` |
| `26` | `src/features/billing/payments/**`, `src/features/billing/webhooks/**`, `src/features/integrations/stripe/**` |
| `27` | `src/features/billing/entitlements/**`, `src/config/{module-catalog,capability-catalog,product-modules,access-policy,job-role-catalog}.ts` |
| `28` | `src/features/onboarding/import/**` |
| `29` | `src/features/webhooks/outbound/**` |

## Squad 30 — Produto, UX e UI
| ID | Diretórios e Ficheiros OBRIGATÓRIOS |
|:---|:---|
| `30` | `src/components/index.ts` |
| `31` | `src/App.tsx`, `src/components/layout/**` |
| `32` | `src/components/feedback/**` (Loading, Empty, Error) |
| `33` | `src/components/ui/**`, `tailwind.config.js`, `src/styles/**` |
| `34` | `src/components/a11y/**` |
| `35` | `src/components/motion/**` |
| `36` | `src/features/landing/**` |
| `37` | `src/features/onboarding/ui/**` |
| `38` | `src/features/analytics/ui/**`, `src/components/charts/**` |
| `39` | `identidade-visual/**`, `documentacao-aplicacao/**`, `src/config/brand.ts` |

## Squad 40 — CRM e Receita
| ID | Diretórios e Ficheiros OBRIGATÓRIOS |
|:---|:---|
| `40` | `src/features/crm/index.ts`, `src/features/crm/types.ts`, `src/features/crm/components/**` |
| `41` | `src/features/crm/leads/**`, `src/features/crm/contacts/**`, `src/features/activities/**` |
| `42` | `src/features/crm/deals/**`, `src/features/crm/pipelines/**`, `src/features/crm360/**` |
| `43` | `src/features/crm/scoring/**`, `src/features/prospecting/**`, `src/config/prospecting-integrations.ts` |
| `44` | `src/features/crm/cadences/**`, `src/features/cadence/**` |
| `45` | `src/features/crm/tasks/**`, `src/features/calendar/**`, `src/features/mobile/server/**` |
| `46` | `src/features/crm/forecast/**` |
| `47` | `src/features/crm/routing/**`, `src/config/playbooks.ts` |
| `48` | `src/features/crm/deduplication/**` |
| `49` | `src/features/crm/analytics/**`, `src/features/commercial-intelligence/**` |

## Squad 50 — Integrações Externas e Bitrix24
| ID | Diretórios e Ficheiros OBRIGATÓRIOS |
|:---|:---|
| `50` | `src/lib/integrations/index.ts`, `src/lib/integrations/integrationSettings.repository.ts`, `src/features/integrations/bitrix/**` (demais arquivos não listados em 51–54/59 — coordenação, rotas `hubTasks`/`dailyPlan*`/`leads`/`deals`/`ownershipGuard`, `service/{dailyPlan*,deals,hubTasks,leads,ownershipGuard,syncRules}.ts`, `infra/**`), `src/features/integrations/components/**` (exceto `externalCrm/**` do 54) |
| `51` | `src/lib/integrations/bitrix/client.ts`, `src/features/integrations/bitrix/client.ts`, `src/features/integrations/bitrix/bitrix.service.ts`, `src/features/integrations/bitrix/service/{client,connections,settings,tokenRefreshLock}.ts` |
| `52` | `src/lib/integrations/bitrix/batch/**`, `src/features/integrations/bitrix/service/extraction*.ts`, `src/features/integrations/bitrix/jobs/**` |
| `53` | `src/features/integrations/bitrix/{bitrix.webhook.ts,bitrixWebhook.queue.ts}`, `src/features/integrations/bitrix/service/{outboundSync,idempotentSync}.ts`, `src/lib/integrations/webhookIdempotency.ts` |
| `54` | `src/lib/integrations/bitrix/mapping/**`, `src/features/integrations/bitrix/bitrixFieldMap.ts`, `src/features/integrations/bitrix/service/{userMapping,customFields}.ts`, `src/features/integrations/{hubspot,monday,pipedrive,rdstation,shared}/**`, `src/features/integrations/components/externalCrm/**` |
| `55` | `src/lib/integrations/email/**`, `src/features/integrations/email/**` |
| `56` | `src/lib/integrations/whatsapp/**`, `src/features/integrations/whatsapp/**` |
| `57` | `src/lib/integrations/calendar/**`, `src/features/integrations/google/**` |
| `58` | `src/lib/integrations/erp/**`, `src/features/integrations/{omie,signature,slack}/**` |
| `59` | `src/lib/integrations/monitoring/**`, `src/features/integrations/bitrix/service/{driftMonitor,syncLogs,metrics}.ts`, `src/features/integrations/bitrix/services/**` |

## Squad 60 — Voz e Omnichannel
| ID | Diretórios e Ficheiros OBRIGATÓRIOS |
|:---|:---|
| `60` | `src/features/voice-hub/{index.ts,types.ts}`, `src/lib/voice-hub/**` (módulo legado — dono único até deliberação de decommission; ordem humana 2026-11-24: preservar temporariamente) |
| `61` | `src/features/voice-hub/{voip,sip}/**`, `src/features/voice-hub/services/{telephonyProvider.service.ts,vadBargeIn.service.ts}`, `src/features/integrations/{threecx,birth-voice}/**` (preservar "ABERTURA OBRIGATÓRIA" do birth-voice — consentimento LGPD) |
| `62` | `src/features/voice-hub/recording/**`, `src/features/voice-hub/infra/**`, `src/features/voice-hub/services/callRecord.service.ts` |
| `63` | `src/features/voice-hub/transcription/**`, `src/features/voice-hub/services/realtimeTranscription.service.ts` |
| `64` | `src/features/voice-hub/commands/**` |
| `65` | `src/features/voice-hub/{ui,components,pages,store,hooks,lib,api}/**` |
| `66` | `src/features/notifications/inbox/**`, `src/features/integrations/chatwoot/**` |
| `67` | `src/features/notifications/templates/**` |
| `68` | `src/features/notifications/realtime/**` |
| `69` | `src/features/notifications/opt-out/**` |

## Squad 70 — IA e Enxame
| ID | Diretórios e Ficheiros OBRIGATÓRIOS |
|:---|:---|
| `70` | `src/lib/ai/index.ts` |
| `71` | `src/lib/ai/agents/**` |
| `72` | `src/lib/ai/tools/**` |
| `73` | `src/lib/ai/rag/**`, `src/lib/ai/vector-db/**` |
| `74` | `src/features/ai-copilot/**` |
| `75` | `src/lib/ai/nlp/**` |
| `76` | `src/features/automations/**` |
| `77` | `src/lib/ai/guardrails/**` |
| `78` | `src/lib/ai/finops/**` |
| `79` | `tests/evals/**` |

## Squad 80 — Mobile
| ID | Diretórios e Ficheiros OBRIGATÓRIOS |
|:---|:---|
| `80` | `src/mobile/index.ts`, `src/features/mobile/index.ts` |
| `81` | `capacitor.config.ts`, `src/mobile/plugins/**` |
| `82` | `android/**` |
| `83` | `ios/**` |
| `84` | `src/mobile/push/**`, `src/mobile/deeplinks/**` |
| `85` | `src/mobile/offline/**`, `src/features/mobile/offlineSync.service.ts`, `src/features/mobile/services/offlineSyncQueue.service.ts`, `src/features/mobile/services/offlineStorageAdapter.ts` |
| `86` | `src/mobile/ui/**` |
| `87` | `src/mobile/native-audio/**`, `src/features/mobile/audioRecording.service.ts`, `src/features/mobile/components/FieldMeetingRecorder.tsx`, `src/features/mobile/mobileEdgeAi.service.ts` (revisão obrigatória do 72) |
| `88` | `src/mobile/security/**`, `src/features/mobile/services/encryptedOfflineStorage.service.ts` |
| `89` | `src/mobile/telemetry/**` |

## Squad 90 — Infraestrutura e SecOps
| ID | Diretórios e Ficheiros OBRIGATÓRIOS |
|:---|:---|
| `90` | `infrastructure/README.md`, `src/config/network.ts` |
| `91` | `infrastructure/terraform/**`, `infrastructure/aws/**` |
| `92` | `charts/**`, `infrastructure/k8s/**` |
| `93` | `Dockerfile`, `docker-compose.yml`, `infrastructure/docker/**` |
| `94` | `.github/workflows/**`, `scripts/deploy/**` |
| `95` | `infrastructure/observability/**` |
| `96` | `src/lib/auth/**`, `src/lib/auth.ts`, `src/lib/auth-client.ts` |
| `97` | `src/lib/auth/rbac/**` (precedência sobre o guarda-chuva do 96) |
| `98` | `infrastructure/secrets/**`, `src/config/env.ts` |
| `99` | `scripts/security/**` (exceto `rls-coverage.ts` e `check-rls-coverage.ts`, do Agente 13), `.semgrep.yml` (e similares), `.trivyignore.yaml`, `docs/security/**` |
