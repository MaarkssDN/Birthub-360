# Manifesto de Handoffs — Onda de Saneamento 2026-11-05
**Orquestrador:** Agente 00 — Coordenador  
**Data:** 2026-11-05  
**Diretório:** `.agents/handoffs/onda-saneamento-20261105/`  
**Referência Mestre:** `docs/auditorias/dividas-tecnicas/DIVIDAS-TECNICAS-RELATORIO-MESTRE.md`  
**Total de Handoffs Gerados:** 35 arquivos rastreáveis  
**Conformidade de Governança:** `AGENTS.md` §11, §15, §18 e §22  

---

## 1. Visão Geral
Este conjunto de handoffs formaliza a transferência de responsabilidade técnica entre os 26 agentes especializados do Birth Hub 360 para a resolução das **96 dívidas técnicas** identificadas na auditoria mestre.

Cada handoff segue rigorosamente os requisitos do **`AGENTS.md` §18**, contendo:
- Metadados formais (`De`, `Para`, `Onda`, `Status`, `Prioridade`, `Bloqueador-ref`, `Sprint destino`).
- Seções estruturadas: `## Problema`, `## Arquivo(s) envolvido(s)`, `## Evidência`, `## Alteração necessária`, `## Teste esperado` e `## Contexto adicional`.

---

## 2. Matriz de Handoffs por Onda de Execução

### Onda 0: Bloqueadores de Integridade, Gates e Segurança Crítica (P0)
| Handoff | De | Para | Prioridade | Bloqueador Ref | Arquivo Principal |
|---|---|---|---|---|---|
| [`00-para-15-mascaramento-tokens-auth.md`](./00-para-15-mascaramento-tokens-auth.md) | 00 | 15 | `resolvido` (bloqueador) | DIV-AGENTE-15-001 (B-04) | `src/services/auth.service.ts` |
| [`00-para-08-blindagem-release-gate.md`](./00-para-08-blindagem-release-gate.md) | 00 | 08 | `resolvido` (bloqueador) | DIV-AGENTE-08-001 (B-05) | `scripts/release-gate.js` |
| [`00-para-08a-gatilho-ghcr-docker-publish.md`](./00-para-08a-gatilho-ghcr-docker-publish.md) | 00 | 08A | `resolvido` (normal) | DIV-AGENTE-08A-001 | `.github/workflows/docker-publish.yml` |
| [`00-para-24-reconciliacao-handoffs-historicos.md`](./00-para-24-reconciliacao-handoffs-historicos.md) | 00 | 24 | `resolvido` (normal) | DIV-AGENTE-00-001 | `.agents/handoffs/` |
| [`24-para-08a-trava-ci-aprovacao-revisao.md`](./24-para-08a-trava-ci-aprovacao-revisao.md) | 24 | 08A | `resolvido` (alto) | DIV-AGENTE-24-001 | `.github/workflows/ci.yml` |

---

### Onda 1: Segurança, Schema, Tenancy e LGPD (P1)
| Handoff | De | Para | Prioridade | Bloqueador Ref | Arquivo Principal |
|---|---|---|---|---|---|
| [`00-para-01-filtro-tenant-repositorios-discador.md`](./00-para-01-filtro-tenant-repositorios-discador.md) | 00 | 01 | `resolvido` (bloqueador) | DIV-AGENTE-01-001 (B-10) | `src/infrastructure/repositories/dialer/` |
| [`21-para-01-expurgo-transacional-optout.md`](./21-para-01-expurgo-transacional-optout.md) | 21 | 01 | `resolvido` (bloqueador) | DIV-AGENTE-21-001 (B-13) | `src/shared/services/dataSubjectErasure.service.ts` |
| [`01a-para-01-schema-agentmemory-titular-lgpd.md`](./01a-para-01-schema-agentmemory-titular-lgpd.md) | 01A | 01 | `resolvido` (alto) | DIV-AGENTE-01A-001 (B-13) | `prisma/schema.prisma` |
| [`02-para-01-concorrencia-cas-organizacao-modulos.md`](./02-para-01-concorrencia-cas-organizacao-modulos.md) | 02 | 01 | `resolvido` (normal) | DIV-AGENTE-02-001 | `src/features/organization-modules/organizationModules.service.ts` |
| [`21-para-01-dossie-portabilidade-titular.md`](./21-para-01-dossie-portabilidade-titular.md) | 21 | 01 | `resolvido` (alto) | DIV-AGENTE-21-002 | `src/shared/services/dataSubjectPortability.service.ts` |
| [`00-para-01a-particionamento-retencao-logs.md`](./00-para-01a-particionamento-retencao-logs.md) | 00 | 01A | `resolvido` (normal) | DIV-AGENTE-01A-002 | `src/shared/services/retentionPurge.service.ts` |

---

### Onda 2: Runtime, Workers, Filas e Infraestrutura (P1)
| Handoff | De | Para | Prioridade | Bloqueador Ref | Arquivo Principal |
|---|---|---|---|---|---|
| [`00-para-16-dead-letter-queue-whatsapp.md`](./00-para-16-dead-letter-queue-whatsapp.md) | 00 | 16 | `resolvido` (bloqueador) | DIV-AGENTE-16-001 (B-11) | `src/lib/queue/whatsappCommand.worker.ts` |
| [`00-para-14-trava-seguranca-banco-test-harness.md`](./00-para-14-trava-seguranca-banco-test-harness.md) | 00 | 14 | `resolvido` (alto) | DIV-AGENTE-14-001 | `scripts/test/prepare-integration-env.js` |
| [`00-para-10-assercoes-rto-restore-drill.md`](./00-para-10-assercoes-rto-restore-drill.md) | 00 | 10 | `resolvido` (alto) | DIV-AGENTE-10-001 | `scripts/sre/run-backup-restore-drill.ts` |
| [`10-para-16-shutdown-coordenado-sse-server.md`](./10-para-16-shutdown-coordenado-sse-server.md) | 10 | 16 | `resolvido` (normal) | DIV-AGENTE-10-002 | `src/features/notifications/sse.service.ts` |
| [`16-para-10-circuit-guard-redis-especifico.md`](./16-para-10-circuit-guard-redis-especifico.md) | 16 | 10 | `resolvido` (alto) | DIV-AGENTE-16-002 | `src/lib/circuitGuard.ts` |

---

### Onda 3: Integrações, Extrações, Telefonia e Comunicação (P1/P2)
| Handoff | De | Para | Prioridade | Bloqueador Ref | Arquivo Principal |
|---|---|---|---|---|---|
| [`00-para-06a-sanitizacao-csv-injection-bitrix.md`](./00-para-06a-sanitizacao-csv-injection-bitrix.md) | 00 | 06A | `bloqueador` | DIV-AGENTE-06A-001 (B-04) | `src/services/bitrix/exportFormatter.service.ts` |
| [`06-para-06a-streaming-extracao-memoria-oom.md`](./06-para-06a-streaming-extracao-memoria-oom.md) | 06 | 06A | `alto` | DIV-AGENTE-06-001 | `src/services/bitrix/extraction.ts` |
| [`12-para-06-buffer-assincrono-webhooks-3cx.md`](./12-para-06-buffer-assincrono-webhooks-3cx.md) | 12 | 06 | `bloqueador` | DIV-AGENTE-12-001 (B-07) | `src/services/telephony/webhookHandler.service.ts` |
| [`04-para-12-correcao-faturamento-meses-31-dias.md`](./04-para-12-correcao-faturamento-meses-31-dias.md) | 04 | 12 | `alto` | DIV-AGENTE-04-001 | `src/services/telephony/billing.service.ts` |
| [`15-para-12-mascaramento-pii-transcricoes-voz.md`](./15-para-12-mascaramento-pii-transcricoes-voz.md) | 15 | 12 | `bloqueador` | DIV-AGENTE-12-002 (B-13) | `src/services/telephony/transcription.service.ts` |
| [`05-para-17-trava-templates-cadencia-placeholders.md`](./05-para-17-trava-templates-cadencia-placeholders.md) | 05 | 17 | `alto` | DIV-AGENTE-05-001 | `src/services/cadence/templateRenderer.service.ts` |
| [`06-para-17-janela-horario-comercial-whatsapp.md`](./06-para-17-janela-horario-comercial-whatsapp.md) | 06 | 17 | `alto` | DIV-AGENTE-17-001 | `src/services/cadence/stepScheduler.service.ts` |

---

### Onda 4: IA, Enxames e Otimização de Custos (P1/P2)
| Handoff | De | Para | Prioridade | Bloqueador Ref | Arquivo Principal |
|---|---|---|---|---|---|
| [`00-para-07-remocao-dados-fabricados-copiloto.md`](./00-para-07-remocao-dados-fabricados-copiloto.md) | 00 | 07 | `bloqueador` | DIV-AGENTE-07-001 (B-06) | `src/pages/EliteCommercialAgentWorkspace.tsx` |
| [`22-para-07-persistencia-real-next-best-action.md`](./22-para-07-persistencia-real-next-best-action.md) | 22 | 07 | `bloqueador` | DIV-AGENTE-22-001 (B-08) | `src/components/commercial/NextBestActionCard.tsx` |
| [`23-para-13-limite-recursao-agent-bus-loops.md`](./23-para-13-limite-recursao-agent-bus-loops.md) | 23 | 13 | `alto` | DIV-AGENTE-13-001 | `src/lib/agents/agentBus.ts` |
| [`07-para-23-corte-tempo-real-streaming-sse.md`](./07-para-23-corte-tempo-real-streaming-sse.md) | 07 | 23 | `alto` | DIV-AGENTE-23-001 | `src/services/ai/aiStream.service.ts` |
| [`00-para-05-circuit-breaker-enriquecimento-leads.md`](./00-para-05-circuit-breaker-enriquecimento-leads.md) | 00 | 05 | `alto` | DIV-AGENTE-05-002 | `src/services/prospecting/enrichment.service.ts` |
| [`00-para-13-modularizacao-supervisor-agent-hotspot.md`](./00-para-13-modularizacao-supervisor-agent-hotspot.md) | 00 | 13 | `alto` | DIV-AGENTE-13-002 | `src/lib/agents/supervisor.agent.ts` |

---

### Onda 5: Frontend, UX, Design System, Mobile e Contratos (P2/P3)
| Handoff | De | Para | Prioridade | Bloqueador Ref | Arquivo Principal |
|---|---|---|---|---|---|
| [`00-para-18-restauracao-contratos-openapi-modulos.md`](./00-para-18-restauracao-contratos-openapi-modulos.md) | 00 | 18 | `bloqueador` | DIV-AGENTE-18-001 (B-09) | `docs/openapi.yaml` |
| [`00-para-02-modularizacao-crmboard-kanban.md`](./00-para-02-modularizacao-crmboard-kanban.md) | 00 | 02 | `alto` | DIV-AGENTE-02-002 | `src/pages/CrmBoard.tsx` |
| [`00-para-03-remocao-important-css-globals.md`](./00-para-03-remocao-important-css-globals.md) | 00 | 03 | `alto` | DIV-AGENTE-03-001 | `src/index.css` |
| [`15-para-09-particionamento-cache-pwa-logout.md`](./15-para-09-particionamento-cache-pwa-logout.md) | 15 | 09 | `bloqueador` | DIV-AGENTE-09-001 (B-10) | `src/serviceWorkerRegistration.ts` |
| [`00-para-04-observabilidade-erros-analytics-sem-zeros.md`](./00-para-04-observabilidade-erros-analytics-sem-zeros.md) | 00 | 04 | `bloqueador` | DIV-AGENTE-04-002 (B-06) | `src/services/analytics.service.ts` |
| [`22-para-02-persistencia-settings-placeholder.md`](./22-para-02-persistencia-settings-placeholder.md) | 22 | 02 | `bloqueador` | DIV-AGENTE-02-003 (B-06) | `src/pages/PillarSettingsPlaceholder.tsx` |

---

## 3. Instruções de Execução para os Agentes Especialistas
1. Antes de iniciar qualquer codificação, o agente deve ler atentamente seu respectivo arquivo de handoff.
2. Cada agente deve trabalhar na branch isolada correspondente: `agente/<numero>-<slug>`.
3. Ao finalizar a implementação e os testes requeridos no handoff, atualizar o campo `Status:` para `resolvido` adicionando a seção de resolução sem apagar o texto original (`AGENTS.md` §18).
4. O Agente 24 deve auditar independentemente o diff antes da integração na branch base (`AGENTS.md` §21).
