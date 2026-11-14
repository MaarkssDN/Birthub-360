# RESULTADOS-RECONCILIAÇÃO-20261114

Verificação read-only (5 subagentes, clusters por destinatário) dos 50 itens SEM-EVIDENCIA/DUVIDA dos handoffs "RESOLVIDO", executada em 2026-11-14 sob DEM-20261114-002 / PLAN-MESTRE-EXECUCAO-20261114 Fase 0. Método: inspeção estática de código/docs; nenhum teste executado. Complementa `RESULTADOS-20261114.md` (verificação original).

## Resumo por destinatário

| Agente | Itens | CONFIRMADO | DEFEITO-REAL | ADIADO | SEM-EVIDENCIA |
|---|---|---|---|---|---|
| 00 | 18 | 9 | 7 | 2 | 0 |
| 01 | 4 | 2 | 1 | 1 | 0 |
| 02 | 4 | 0 | 1 | 3 | 0 |
| 03 | 2 | 2 | 0 | 0 | 0 |
| 04 | 2 | 1 | 1 | 0 | 0 |
| 05 | 2 | 0 | 1 | 1 | 0 |
| 06 | 2 | 1 | 1 | 0 | 0 |
| 08 | 5 | 1 (trivy) | 1 (zap) | 3 | 0 |
| 09 | 1 | 0 | 1 | 0 | 0 |
| 10 | 1 | 0 | 0 | 1 | 0 |
| 12 | 3 | 0 | 3 | 0 | 0 |
| 14 | 1 | 0 | 1 | 0 | 0 |
| 15 | 1 | 0 | 1 | 0 | 0 |
| 17 | 4 | 2 | 2 | 0 | 0 |
| 24 | 1 | 1 | 0 | 0 | 0 |
| **Total** | **50** | **19** | **22** | **8** | **1** |

## Padrão transversal identificado

1. **Serviços órfãos**: a onda-saneamento-20261105 criou serviços corretos porém sem consumidor produtivo — `telephony/billing.service.ts`, `transcription.service.ts`, `stepScheduler.service.ts`, `templateRenderer.service.ts`, `src/lib/agents/agentBus.ts`. Teste unitário verde, zero integração.
2. **Render desativado → Local-First**: vários handoffs resolveram premissas de deploy Render que não existem mais (`render.yaml` arquivado em `infrastructure/archive/`). Itens de deploy/worker/deep-link/observabilidade ficaram obsoletos sem atualização de status.
3. **Simulações remanescentes**: `continuousSecurityAudit.service.ts` (fixtures hardcoded), `autonomousSdr.service.ts`, `bimodalLiveVoice.service.ts`, `conversationalIntelligence.service.ts`, `proposalAutomation.service.ts`, `promiseGuardian.agent.ts` — dados fabricados apresentados como reais.
4. **Resoluções-redirecionamento**: handoffs marcados resolvidos cuja "resolução" apenas aponta para outro handoff ou descreve trabalho diferente do pedido.

## DEFEITO-REAL — fila de correção (por prioridade)

### Segurança / tenancy (prioridade alta)
- **15**: `continuousSecurityAudit.service.ts` — scanner simulado (CVE hardcoded, waivers fixture, SBOM sintético). Exige decisão: implementar scanner real OU rebaixar contrato para "simulador de homologação". **Decisão do usuário necessária.**
- **17**: `selfDrivingCrm.service.ts:205` — filtro `!lead.organizationId ||` admite leads sem tenant; `:389` seedLead colide entre tenants; fonte `mockLeadsStore` em memória.
- **06**: `bitrixEventMeshBridge.service.ts:95,299` — `as unknown as` sem validação de contrato (double-cast forense GATE-02 persiste).
- **09**: `AuthContext.logout()` não chama `offlineSyncService.clearQueue()` — fila offline persiste entre usuários/tenants no mesmo dispositivo (EXP-03).
- **12**: 3 itens — métricas/dados fabricados em ai-voice/proposals/promiseGuardian; `telephonyBillingService` e `maskPii` órfãos (sem consumidor).

### Funcionais
- **02**: badges `CONFIRMADO/INFERIDO/HUNTER` não existem em `CandidateCard.tsx` — resolução descreve implementação inexistente.
- **05**: `integracao-crawlee` — workflow existe mas `scrapeProspect` não persiste/deduplica; sem robots.txt/rate-limit.
- **14**: avaliação PII — cobertura parcial real (3 de 5 itens não cobertos: AILog logging, prompt injection, encoding bypass); Resolução superestima.
- **08**: item ZAP do `zap-trivy-gate` sem passo real — `RELEASE_CHECKLIST.md` removido, `producao.md` §7 não contém ZAP; citações incorretas em `SECURITY_GUIDE.md:98` e `12-REQUISITOS-ARQUITETURA.md:316`.
- **00**: `public/tools/social-selling/` permanece servido em `/tools` (resolução omitiu); `supervisor.agent.ts` ~900L não decomposto; `templateRenderer` e `agentBus` real sem hopCount; `agentUsageHeatmap.service.ts` findMany sem take + custo fabricado + NaN; `.claude/skills/impeccable/scripts/live-browser.js` duplicata regressão.

### Documentais (sem código)
- **01**: agendamento-transporte → ADIADO (decisão arquitetural pendente); commercial-v3 security → CONFIRMADO mas path errado no handoff (`tests/security/` não `src/.../__tests__/`); dialer tenancy → risco eliminado por remoção do módulo (reescrever Resolução com commits 32c97ad1e/18b3114f).
- **04**: agendamento idem ADIADO; commercial-intelligence tsc → CONFIRMADO, anexar saída do tsc.
- **03**: brand-2 → CONFIRMADO, corrigir hex na Resolução (#f0d77b → #7C3AED).
- **08**: deploy-worker, deep-link, ci-migrate-drift → ADIADO (premissas obsoletas); unit-failures → SEM-EVIDENCIA (anexar run de CI).
- **10**: observabilidade worker → ADIADO (reescopar p/ Local-First).
- **17**: opt-out → CONFIRMADO (atualizar Resolução com evidências); dialer-sql → CONFIRMADO (anexar nota do corte).
- **24**: typecheck-integrations → CONFIRMADO (preencher Resolução com parecer APROVADO COM RESERVA).

## Itens ADIADO confirmados (já reclassificados ou a reclassificar)
- `onda-38/00-para-02-03-redesign-plataforma` — ADIADO correto, reagendar pós-RC1 (`elegance.css` é CSS morto, sem importador).
- `onda-8/09-para-02-downloads-blob` — ADIADO correto; problema persiste em 6 componentes + `UniversalEcosystemPanel`; sem `@capacitor/filesystem`/`share`; zero `isNativePlatform`.
- `onda-8/09-para-02-voice-command` — ADIADO correto; Web Speech API only em 5+ consumidores.
- `audit-ach/09-para-05-ocr-camera` — manifest ok; validação em device pendente → ADIADO.
- `techdebt-2026-09-29/00-para-00-typescript-quality` — ADIADO (filtragem pendente).
- `onda-liquidacao-debitos/10-para-08A-deploy-ec2` — ADIADO (migrações/rollback pendentes).

## Bloqueios que dependem de decisão do usuário
1. **Agente 15 EXP-06**: implementar scanner real de segurança ou admitir simulador? (recomendação: renomear contrato para "simulador de homologação" até haver scanner real — mais honesto e barato).
2. **Agente 01 agendamento-transporte**: caminho (a) schema-âncora vs (b) ponte booking público — decisão arquitetural pendente.
3. **A-01..A-03**: deploy staging + smoke — depende de autorização na hora.
