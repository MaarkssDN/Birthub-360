# 02 — DÍVIDAS TÉCNICAS PENDENTES DE EXECUÇÃO — BIRTHUB 360°

**Autoridade:** Agente 00 — Supervisor Geral de Engenharia  
**Auditoria:** Agente 24 — Revisão Independente  
**Commit HEAD:** `08c9734e1bb89a4d4fc552351470a1969f94d64f`  
**Data:** 2026-11-10  
**Total de Itens que Requerem Ação:** **52 Dívidas Técnicas Acionáveis**  

---

## 1. RECONCILIAÇÃO E CORREÇÃO DE IDENTIFICADORES

A investigação forense identificou e corrigiu quatro divergências de identificação que geravam ambiguidades entre os relatórios:

| Problema Identificado | ID Incorreto Anterior | ID Canônico Homologado | Ref. Original | Agente | Justificativa Forense da Correção |
|---|---|---|---|:---:|---|
| **Vazamento de Tokens em Logs** | `BT360-DT-0064` | **`BT360-DT-0072`** | `DIV-15-001` | **15** | O ID 0064 pertencia a PII em voz (Agente 12, homologada). A dívida real de tokens de autenticação é a `DIV-15-001` sob o ID canônico 0072 (P0). |
| **Implementação Sem Validação** | `BT360-DT-0009` | **`BT360-DT-0014`** | `DIV-02-001` | **02** | O ID 0009 refere-se a `user.count` redundante (Agente 01). O item implementado sem validação E2E é a leitura de notificação broadcast (`DIV-02-001`). |
| **Hotspot BitrixImportPanel** | `BT360-DT-0031` | **`BT360-DT-0030`** | `DIV-06-002` | **06** | O ID 0031 refere-se ao buffer 3CX (homologado). O painel monolítico de 1.252 linhas é a `DIV-06-002`, ID canônico 0030. |
| **Hotspot Supervisor Agent** | `BT360-DT-0056` | **`BT360-DT-0065`** | `DIV-13-001` | **13** | O ID 0056 refere-se ao graceful shutdown (homologado). O orquestrador com 1.000 linhas é a `DIV-13-001`, ID canônico 0065. |

---

## 2. DETALHAMENTO DAS 52 DÍVIDAS ACIONÁVEIS

### 2.1 CRÍTICAS E BLOQUEADORAS (1 ITEM - PRIORIDADE P0)
| ID Canônico | Ref. | Agente | Tarefa | Localização | Problema e Ação Exigida |
|---|---|:---:|:---:|---|---|
| **BT360-DT-0072** | `DIV-15-001` | **15** | `TAREFA-SANEAMENTO-001` | `src/lib/auth.ts` | **Vazamento de Tokens e URLs em Logs:** O script `scripts/verify-auth-log-redaction.mjs` falha com AssertionError porque `resetUrl` e `url` continuam sendo emitidos em logs em dev/staging. **Ação:** Sanitizar completamente o logger em `src/lib/auth.ts` eliminando a chave `resetUrl` do objeto logado. |

---

### 2.2 REGRESSÕES CONFIRMADAS (1 ITEM - PRIORIDADE P1)
| ID Canônico | Ref. | Agente | Tarefa | Localização | Problema e Ação Exigida |
|---|---|:---:|:---:|---|---|
| **BT360-DT-0017** | `DIV-03-001` | **03** | `TAREFA-SANEAMENTO-002` | `src/styles/globals.css`, `NewLoginScreen.css` | **Proliferação de !important em Estilos:** Biome lint reporta 14 violações ativas. **Ação:** Substituir declarações forçadas por especificidade de classe semântica e seletores `@layer`. |

---

### 2.3 PARCIALMENTE IMPLEMENTADOS / HOTSPOTS (4 ITENS - PRIORIDADE P1/P2)
| ID Canônico | Ref. | Agente | Tarefa | Localização | Linhas Atuais | Diagnóstico e Ação Exigida |
|---|---|:---:|:---:|---|:---:|---|
| **BT360-DT-0015** | `DIV-02-002` | **02** | `TAREFA-SANEAMENTO-003` | `src/components/CrmBoard.tsx` | 1.258L | Componente central do Kanban ultrapassa limite. Decompor em `CrmKanbanColumn.tsx` e `CrmCardDragDrop.tsx` (< 400L cada). |
| **BT360-DT-0030** | `DIV-06-002` | **06** | `TAREFA-SANEAMENTO-004` | `src/features/integrations/components/BitrixImportPanel.tsx` | 1.252L | Painel monolítico mistura mapeamento, progresso e upload. Decompor em `BitrixFieldMapper.tsx` e `BitrixSyncProgress.tsx`. |
| **BT360-DT-0065** | `DIV-13-001` | **13** | `TAREFA-SANEAMENTO-005` | `src/features/intelligence/agents/supervisor.agent.ts` | 1.000L | Orquestrador no limiar de quebra do CI. Extrair fallback e heurísticas para `supervisorFallbackStrategy.ts` (< 400L). |
| **BT360-DT-0016** | `DIV-02-003` | **02** | `TAREFA-SANEAMENTO-012` | `src/App.tsx` | 716L | Concentração de 45 rotas e listeners mobile. Extrair roteamento para `src/routes/appRoutes.tsx`. |

---

### 2.4 IMPLEMENTADO / NÃO VALIDADO (1 ITEM - PRIORIDADE P2)
| ID Canônico | Ref. | Agente | Tarefa | Localização | Problema e Ação Exigida |
|---|---|:---:|:---:|---|---|
| **BT360-DT-0014** | `DIV-02-001` | **02** | `TAREFA-SANEAMENTO-011` | `src/features/notifications/services/notification.service.ts` | **Recibo de Leitura Broadcast Sem Teste Multi-tenant:** Modelo de leitura global silencia notificações entre colegas. Desenvolver suíte de integração com múltiplos usuários na mesma organização. |

---

### 2.5 NÃO INICIADOS (45 ITENS - PRIORIDADE P1, P2 E P3)
| ID Canônico | Ref. | Agente | Prioridade | Tarefa | Localização | Resumo da Dívida e Critério de Aceite |
|---|---|:---:|:---:|:---:|---|---|
| **BT360-DT-0001** | `DIV-00-001` | **00** | **P3** | `TAREFA-SANEAMENTO-043` | `.agents/prompts/00-coordenador.md` | Leitura obrigatória no prompt de coordenação referencia documento de ondas inexistente |
| **BT360-DT-0004** | `DIV-00-004` | **00** | **P2** | `TAREFA-SANEAMENTO-011` | `AGENTS.md` | Ausência de sincronização automatizada entre a matriz de propriedade de arquivos e o Dependency Cruiser |
| **BT360-DT-0008** | `DIV-01-004` | **01** | **P2** | `TAREFA-SANEAMENTO-012` | `src/features/analytics/infra/PrismaAnalyticsRepository.ts` | Resumo de consumo de inteligência artificial carrega todas as linhas de logs em memória para agregação |
| **BT360-DT-0009** | `DIV-01-005` | **01** | **P3** | `TAREFA-SANEAMENTO-044` | `src/lib/auth.ts` | Lógica de criação de primeiro usuário executa user.count redundante para atribuir role ADMIN |
| **BT360-DT-0010** | `DIV-01-006` | **01** | **P2** | `TAREFA-SANEAMENTO-013` | `src/lib/prisma.ts` | Hotspot arquitetural crítico em src/lib/prisma.ts acumulando múltiplas responsabilidades |
| **BT360-DT-0013** | `DIV-01A-003` | **01A** | **P2** | `TAREFA-SANEAMENTO-014` | `prisma/schema.prisma` | Verificação de integridade referencial: foreign keys com onDelete CASCADE em tabelas mestres de tenant |
| **BT360-DT-0020** | `DIV-03-004` | **03** | **P2** | `TAREFA-SANEAMENTO-017` | `playwright.visual.config.ts` | Instabilidade e tolerância frouxa em testes de regressão visual devido a fontes do sistema operacional |
| **BT360-DT-0024** | `DIV-04-004` | **04** | **P2** | `TAREFA-SANEAMENTO-018` | `src/features/crm360/infra/PrismaCrm360Repository.ts` | Hotspot estrutural e queries com alto custo computacional em PrismaCrm360Repository.ts |
| **BT360-DT-0027** | `DIV-05-003` | **05** | **P2** | `TAREFA-SANEAMENTO-019` | `src/features/prospecting/services/enrichment.service.ts` | Acúmulo de cache de enriquecimento sem expurgo automático em tabelas temporárias |
| **BT360-DT-0028** | `DIV-05-004` | **05** | **P2** | `TAREFA-SANEAMENTO-020` | `src/features/prospecting/services/cold-email.service.ts` | Ausência de validação prévia em lote de listas de supressão (Opt-Out) em importações de prospecção |
| **BT360-DT-0032** | `DIV-06-004` | **06** | **P3** | `TAREFA-SANEAMENTO-045` | `src/features/integrations/components/ExternalCrmPanel.tsx` | Tratamento incompleto de promessas assíncronas em componentes de importação externa (Sonar S9383) |
| **BT360-DT-0035** | `DIV-06A-003` | **06A** | **P2** | `TAREFA-SANEAMENTO-021` | `src/features/integrations/bitrix/service/extraction.ts` | Falta de rotina de purga periódica de arquivos temporários gerados em extrações antigas |
| **BT360-DT-0036** | `DIV-06A-004` | **06A** | **P3** | `TAREFA-SANEAMENTO-046` | `src/features/integrations/bitrix/service/extraction.ts` | Ausência de cancelamento cooperativo via AbortSignal em extrações Bitrix em lote |
| **BT360-DT-0039** | `DIV-07-003` | **07** | **P1** | `TAREFA-SANEAMENTO-005` | `src/features/intelligence/routes/intelligence.routes.ts` | Trace de missões autônomas de IA e consentimento LGPD retornados de forma sintética em rotas de inteligência |
| **BT360-DT-0040** | `DIV-07-004` | **07** | **P2** | `TAREFA-SANEAMENTO-022` | `src/features/intelligence/components/AISuiteHub.tsx` | Falha inicial da API prende o Copiloto Executivo em estado de carregamento infinito permanente |
| **BT360-DT-0041** | `DIV-07-005` | **07** | **P2** | `TAREFA-SANEAMENTO-023` | `src/features/knowledge/services/knowledgeBase.service.ts` | Busca textual na base de conhecimento do Copiloto engole falhas do banco e retorna lista vazia |
| **BT360-DT-0042** | `DIV-07-006` | **07** | **P1** | `TAREFA-SANEAMENTO-006` | `src/features/intelligence/components/IntelligenceHub.tsx` | Hotspots severos em componentes de painel de inteligência (IntelligenceHub e SwarmDashboard) |
| **BT360-DT-0044** | `DIV-08-002` | **08** | **P1** | `TAREFA-SANEAMENTO-007` | `vitest.unit.config.ts` | 62 arquivos de testes unitários co-localizados em src/features permanecem fora da descoberta do Vitest |
| **BT360-DT-0045** | `DIV-08-003` | **08** | **P2** | `TAREFA-SANEAMENTO-024` | `package-lock.json` | Dockerfile reinstala Prisma CLI em etapa sem lock estrito versionado arriscando versão divergente |
| **BT360-DT-0047** | `DIV-08-005` | **08** | **P3** | `TAREFA-SANEAMENTO-047` | `docs/development/LOCAL_FIRST.md` | Instrução de inicialização do stack local omite overlay de PostgreSQL obrigatório para migrations |
| **BT360-DT-0048** | `DIV-08A-001` | **08A** | **P2** | `TAREFA-SANEAMENTO-025` | `.github/workflows/` | Proliferação excessiva de branches remotas órfãs degradando a rastreabilidade e higiene do Git |
| **BT360-DT-0049** | `DIV-08A-002` | **08A** | **P2** | `TAREFA-SANEAMENTO-026` | `.github/workflows/ci.yml` | Ausência de cache compartilhado de dependências (node_modules e Prisma) nos workflows de CI |
| **BT360-DT-0050** | `DIV-08A-003` | **08A** | **P2** | `TAREFA-SANEAMENTO-027` | `.github/workflows/docker-publish.yml` | Falta de validação automatizada de integridade de tags de release e assinatura de commits |
| **BT360-DT-0053** | `DIV-09-003` | **09** | **P2** | `TAREFA-SANEAMENTO-028` | `android/app/src/main/AndroidManifest.xml` | Esquema de deep links nativos no AndroidManifest.xml diverge das rotas SPA da aplicação web |
| **BT360-DT-0054** | `DIV-09-004` | **09** | **P3** | `TAREFA-SANEAMENTO-048` | `.agents/audits/technical-debt/2026-10-14/manifest.json` | Ícones declarados no manifest.json do PWA não existem fisicamente na pasta public |
| **BT360-DT-0057** | `DIV-10-003` | **10** | **P2** | `TAREFA-SANEAMENTO-029` | `docker-compose.yml` | Ausência de limitação de taxa em nível de Ingress/Proxy Reverso contra ataques de força bruta |
| **BT360-DT-0058** | `DIV-11-001` | **11** | **P3** | `TAREFA-SANEAMENTO-049` | `tests/fixtures/` | Ocorrências residuais de menções a marcas legadas em fixtures de testes e documentações internas |
| **BT360-DT-0059** | `DIV-11-002` | **11** | **P3** | `TAREFA-SANEAMENTO-050` | `public/` | Ativos institucionais pesados em public sem compressão moderna lossless (WebP/SVG minificado) |
| **BT360-DT-0060** | `DIV-11-003` | **11** | **P3** | `TAREFA-SANEAMENTO-051` | `docs/BrandConstitution.md` | Divergência de nomenclatura entre tokens de cores na BrandConstitution e variáveis Tailwind |
| **BT360-DT-0063** | `DIV-12-003` | **12** | **P1** | `TAREFA-SANEAMENTO-008` | `src/features/voice-hub/pages/Dashboard/Overview.tsx` | Hotspots severos em componentes de estúdio de voz (Overview.tsx e useStudioStore.ts) |
| **BT360-DT-0067** | `DIV-13-003` | **13** | **P2** | `TAREFA-SANEAMENTO-030` | `src/lib/agents/agentBus.ts` | Histórico de conversas e decisões do Agent Bus mantido apenas em memória volátil |
| **BT360-DT-0068** | `DIV-13-004` | **13** | **P2** | `TAREFA-SANEAMENTO-031` | `src/features/intelligence/agents/tools/` | Ausência de timeout individual por execução de ferramenta de IA travando o runtime do agente |
| **BT360-DT-0070** | `DIV-14-002` | **14** | **P2** | `TAREFA-SANEAMENTO-032` | `scripts/test/prepare-integration-env.js` | Ausência de teardown determinístico para containers efêmeros em caso de cancelamento por SIGINT |
| **BT360-DT-0071** | `DIV-14-003` | **14** | **P2** | `TAREFA-SANEAMENTO-033` | `scripts/test/prepare-integration-env.js` | Falta de seed automático de entidades de compliance e opt-out no provisionamento do banco de teste |
| **BT360-DT-0073** | `DIV-15-002` | **15** | **P1** | `TAREFA-SANEAMENTO-010` | `docs/security/ROTACAO_SEGREDOS.md` | Criptografia de credenciais em repouso sem suporte a envelope encryption e versionamento de chaves |
| **BT360-DT-0074** | `DIV-15-003` | **15** | **P2** | `TAREFA-SANEAMENTO-034` | `server.ts` | Configuração permissiva de CORS em server.ts para clientes externos |
| **BT360-DT-0080** | `DIV-17-003` | **17** | **P2** | `TAREFA-SANEAMENTO-035` | `src/features/cadence/services/cadenceExecution.service.ts` | Ausência de verificação em lote de opt-out no momento do início da cadência |
| **BT360-DT-0082** | `DIV-18-002` | **18** | **P2** | `TAREFA-SANEAMENTO-036` | `src/features/crm/routes/lead.routes.ts` | Divergência de validação entre schemas Zod de backend e definições DTO do OpenAPI para criação de leads |
| **BT360-DT-0083** | `DIV-18-003` | **18** | **P2** | `TAREFA-SANEAMENTO-037` | `scripts/verify-openapi-drift.ts` | Script verify-openapi-drift não cobre rotas criadas recentemente para o Hub de Inteligência e Timeline |
| **BT360-DT-0086** | `DIV-21-003` | **21** | **P2** | `TAREFA-SANEAMENTO-038` | `src/lib/security/consentAuditChain.service.ts` | Hotspot em consentAuditChain.service.ts executando hash-chaining síncrono com impacto em transações |
| **BT360-DT-0087** | `DIV-21-004` | **21** | **P3** | `TAREFA-SANEAMENTO-052` | `docs/lgpd-base-legal.md` | Falta de inventário de tratamento de dados (ROPA) automatizado e exportável para auditoria |
| **BT360-DT-0089** | `DIV-22-002` | **22** | **P2** | `TAREFA-SANEAMENTO-039` | `playwright.config.ts` | Testes E2E do Playwright validam apenas o DOM sem asserções diretas no banco de dados (Database Assertions) |
| **BT360-DT-0090** | `DIV-22-003` | **22** | **P2** | `TAREFA-SANEAMENTO-040` | `scripts/security/` | Ausência de teste contínuo de verificação de vazamento de PII em logs de aplicação |
| **BT360-DT-0093** | `DIV-23-003` | **23** | **P2** | `TAREFA-SANEAMENTO-041` | `src/lib/ai/gateway/semanticCache.ts` | Inexistência de cache semântico ativo para pesquisas e análises de mercado frequentes |
| **BT360-DT-0094** | `DIV-23-004` | **23** | **P2** | `TAREFA-SANEAMENTO-042` | `src/features/intelligence/services/agentCostAnalysis.service.ts` | Consulta N+1 no cálculo de métricas de uso de IA por vendedor no painel gerencial |

---

## 3. IMPACTO DE GOVERNANÇA E PRAZOS

- **Vencimento de Exceções de Hotspot:** 21 arquivos sob exceção temporária em `HOTSPOT_EXCEPTIONS.md` expiram impreterivelmente em **2026-11-30**. A modularização das dívidas `BT360-DT-0015`, `BT360-DT-0030` e `BT360-DT-0065` é mandatória antes desta data.
- **Linter Biome:** O saneamento de `BT360-DT-0017` restaura o padrão de 0 warnings bloqueantes em folhas de estilo.
