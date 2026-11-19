# MATRIZ DE PROPRIEDADE — 100 AGENTES (BIRTH HUB 360)

## Squad 00 — QA, LGPD e Auditoria
| ID | Diretórios e Ficheiros OBRIGATÓRIOS |
|:---|:---|
| `00` | `server.ts`, `package.json`, `.agents/ESTADO_ATUAL.md` |
| `01` | `.agents/templates/**` |
| `02` | `tests/setup/**`, `jest.config.js`, `vitest.config.ts` |
| `03` | `tests/unit/**`, `tests/architecture/**` |
| `04` | `tests/integration/**` |
| `05` | `tests/e2e/**`, `cypress/**`, `playwright.config.ts` |
| `06` | Acesso de leitura global (Auditoria de persistência) |
| `07` | `docs/lgpd/**` |
| `08` | `src/features/privacy/**` |
| `09` | `.agents/reviews/**` |

## Squad 10 — Dados e Multi-Tenancy
| ID | Diretórios e Ficheiros OBRIGATÓRIOS |
|:---|:---|
| `10` | `src/lib/db/index.ts` |
| `11` | `prisma/schema.prisma` |
| `12` | `prisma/migrations/**` |
| `13` | `src/lib/db/rls/**`, `supabase/migrations/**` (se aplicável) |
| `14` | `prisma/seed.ts`, `tests/fixtures/**` |
| `15` | `src/lib/db/retention/**` |
| `16` | `src/lib/db/queries/**` |
| `17` | `src/lib/cache/**`, `redis.config.ts` |
| `18` | `src/features/audit-logs/**` |
| `19` | `scripts/backup/**`, `scripts/verify-integrity.ts` |

## Squad 20 — Core Backend, APIs e Billing
| ID | Diretórios e Ficheiros OBRIGATÓRIOS |
|:---|:---|
| `20` | `src/api/index.ts`, `src/api/router.ts` |
| `21` | `src/api/schemas/**`, `openapi.yaml` |
| `22` | `src/api/controllers/**`, `src/api/middlewares/**` |
| `23` | `src/lib/queue/**`, `src/workers/**` |
| `24` | `src/lib/resilience/**`, `src/lib/queue/dlq/**` |
| `25` | `src/api/middlewares/rate-limit.ts` |
| `26` | `src/features/billing/payments/**`, `src/features/billing/webhooks/**` |
| `27` | `src/features/billing/entitlements/**` |
| `28` | `src/features/onboarding/import/**` |
| `29` | `src/features/webhooks/outbound/**` |

## Squad 30 — Produto, UX e UI
| ID | Diretórios e Ficheiros OBRIGATÓRIOS |
|:---|:---|
| `30` | `src/components/index.ts` |
| `31` | `src/App.tsx`, `src/components/layout/**` |
| `32` | `src/components/feedback/**` (Loading, Empty, Error) |
| `33` | `src/components/ui/**`, `tailwind.config.js` |
| `34` | `src/components/a11y/**` |
| `35` | `src/components/motion/**` |
| `36` | `src/features/landing/**` |
| `37` | `src/features/onboarding/ui/**` |
| `38` | `src/features/analytics/ui/**`, `src/components/charts/**` |
| `39` | `identidade-visual/**`, `documentacao-aplicacao/**` |

## Squad 40 — CRM e Receita
| ID | Diretórios e Ficheiros OBRIGATÓRIOS |
|:---|:---|
| `40` | `src/features/crm/index.ts`, `src/features/crm/types.ts` |
| `41` | `src/features/crm/leads/**`, `src/features/crm/contacts/**` |
| `42` | `src/features/crm/deals/**`, `src/features/crm/pipelines/**` |
| `43` | `src/features/crm/scoring/**` |
| `44` | `src/features/crm/cadences/**` |
| `45` | `src/features/crm/tasks/**` |
| `46` | `src/features/crm/forecast/**` |
| `47` | `src/features/crm/routing/**` |
| `48` | `src/features/crm/deduplication/**` |
| `49` | `src/features/crm/analytics/**` |

## Squad 50 — Integrações Externas e Bitrix24
| ID | Diretórios e Ficheiros OBRIGATÓRIOS |
|:---|:---|
| `50` | `src/lib/integrations/index.ts` |
| `51` | `src/lib/integrations/bitrix/auth/**` |
| `52` | `src/lib/integrations/bitrix/batch/**` |
| `53` | `src/lib/integrations/bitrix/webhooks/**` |
| `54` | `src/lib/integrations/bitrix/mapping/**` |
| `55` | `src/lib/integrations/email/**` |
| `56` | `src/lib/integrations/whatsapp/**` |
| `57` | `src/lib/integrations/calendar/**` |
| `58` | `src/lib/integrations/erp/**` |
| `59` | `src/lib/integrations/monitoring/**` |

## Squad 60 — Voz e Omnichannel
| ID | Diretórios e Ficheiros OBRIGATÓRIOS |
|:---|:---|
| `60` | `src/features/voice-hub/index.ts` |
| `61` | `src/features/voice-hub/voip/**`, `src/features/voice-hub/sip/**` |
| `62` | `src/features/voice-hub/recording/**` |
| `63` | `src/features/voice-hub/transcription/**` |
| `64` | `src/features/voice-hub/commands/**` |
| `65` | `src/features/voice-hub/ui/**` |
| `66` | `src/features/notifications/inbox/**` |
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
| `80` | `src/mobile/index.ts` |
| `81` | `capacitor.config.ts`, `src/mobile/plugins/**` |
| `82` | `android/**` |
| `83` | `ios/**` |
| `84` | `src/mobile/push/**`, `src/mobile/deeplinks/**` |
| `85` | `src/mobile/offline/**` |
| `86` | `src/mobile/ui/**` |
| `87` | `src/mobile/native-audio/**` |
| `88` | `src/mobile/security/**` |
| `89` | `src/mobile/telemetry/**` |

## Squad 90 — Infraestrutura e SecOps
| ID | Diretórios e Ficheiros OBRIGATÓRIOS |
|:---|:---|
| `90` | `infrastructure/README.md` |
| `91` | `infrastructure/terraform/**`, `infrastructure/aws/**` |
| `92` | `charts/**`, `infrastructure/k8s/**` |
| `93` | `Dockerfile`, `docker-compose.yml`, `infrastructure/docker/**` |
| `94` | `.github/workflows/**`, `scripts/deploy/**` |
| `95` | `infrastructure/observability/**` |
| `96` | `src/lib/auth/**` |
| `97` | `src/lib/auth/rbac/**` |
| `98` | `infrastructure/secrets/**` |
| `99` | `scripts/security/**`, `.semgrep.yml` (e similares) |
