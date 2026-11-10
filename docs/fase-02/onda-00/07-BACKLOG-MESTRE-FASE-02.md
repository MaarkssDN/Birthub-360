# BACKLOG MESTRE DE ENGENHARIA — FASE 02 (ONDA 00)
**Produto:** Birthub 360° — Sistema Operacional de Revenue Intelligence  
**Data:** 10 de Novembro de 2026  
**Autoridade:** Agente 00 (Supervisor Geral de Engenharia)  
**Em conformidade com:** `AGENTS.md` e `BIRTHUB360_DOCUMENTO_MESTRE_OFICIAL_V4.html`  
**Status:** HOMOLOGADO — 52 TAREFAS TÉCNICAS ESTRUTURADAS E PRIORIZADAS

---

## 1. Critérios de Priorização do Backlog

A ordenação das tarefas no backlog obedece rigorosamente às 8 prioridades do `AGENTS.md`:
1. **P0 — Segurança, Isolamento de Dados e LGPD:** Bloqueadores que impedem conformidade legal ou geram vazamento.
2. **P1 — Integridade de Persistência e Hotspots Críticos:** Modularização dos arquivos que ultrapassam limites arquiteturais antes da expiração da exceção em 2026-11-30.
3. **P1 — Infraestrutura Compartilhada e Event Mesh:** Filas BullMQ, locks de concorrência e barramento de eventos.
4. **P2 — Supervisor Central e Contratos Transversais:** Despacho semântico, aprovação humana e orçamentos de IA.
5. **P2 — Funcionalidades Comerciais Centrais (MOD-01 a MOD-05):** Deals, propostas com alçada, enriquecimento, cadências e forecast.
6. **P2 — Conectores e Integrações (MOD-07 e MOD-08):** Bitrix24 leaky bucket, webhooks seguros e VoiceHub WebRTC.
7. **P3 — Mobilidade e Social Selling (MOD-10 e MOD-11):** Sincronização offline nativa e gerador de abordagens.
8. **P3 — Hardening de Acessibilidade e Quality Gates Finais:** WCAG 2.2 AA, testes de mutação e auditoria do Agente 24.

---

## 2. Catálogo das 52 Tarefas Técnicas de Reconstrução

| ID Tarefa | Módulo | Descrição Resumida | Classificação | Prioridade | Agente | Dependências | Critério de Aceite | Gate de Homologação |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- | :--- |
| **TAREFA-RECONST-001** | MOD-09 | Redação compulsória de tokens em logs de auth | CORRIGIR | P0 | 15 | Nenhuma | Zero tokens em logs de console | `verify-auth-log-redaction.mjs` |
| **TAREFA-RECONST-002** | MOD-09 | Políticas RLS nativas no PostgreSQL | CORRIGIR | P0 | 01 | RECONST-001 | 100% tabelas de domínio com RLS ativo | `test:integration -- rls` |
| **TAREFA-RECONST-003** | MOD-01 | Modularização do CrmBoard.tsx (1.258L) | CORRIGIR | P1 | 02 | Nenhuma | Arquivo < 700 linhas sem quebra de UX | `npm run check:hotspots` |
| **TAREFA-RECONST-004** | MOD-01 | Modularização do App.tsx (716L) | CORRIGIR | P1 | 02 | Nenhuma | Lazy loading de rotas e arquivo < 500L | `npm run check:hotspots` |
| **TAREFA-RECONST-005** | MOD-07 | Modularização BitrixImportPanel.tsx (1.252L) | CORRIGIR | P1 | 06 | Nenhuma | Decomposição em etapas de importação | `npm run check:hotspots` |
| **TAREFA-RECONST-006** | MOD-06 | Modularização supervisor.agent.ts (1.000L) | CORRIGIR | P1 | 13 | Nenhuma | Isolamento de despacho e alçadas | `npm run check:hotspots` |
| **TAREFA-RECONST-007** | MOD-09 | Hardening de headers CSP e proteção XSS | CORRIGIR | P1 | 15 | RECONST-001 | Nonce estrito em scripts inline | `test:integration -- security` |
| **TAREFA-RECONST-008** | Global | Eliminação de 14 regras CSS !important | CORRIGIR | P1 | 03 | Nenhuma | Zero violações de especificidade CSS | `npm run lint` |
| **TAREFA-RECONST-009** | MOD-07 | DLQ dedicada para filas Redis BullMQ | CORRIGIR | P1 | 16 | Nenhuma | Fila com retenção de poison messages | `test:integration -- bullmq` |
| **TAREFA-RECONST-010** | MOD-07 | Renovação segura de locks no Redlock | CORRIGIR | P1 | 16 | RECONST-009 | Heartbeat de renovação de lock ativo | `test:unit -- redlock` |
| **TAREFA-RECONST-011** | MOD-01 | Validação de travas de desconto em propostas| CORRIGIR | P1 | 02 / 18 | RECONST-003 | Alçadas 10%/20%/Diretoria validadas | `test:integration -- proposals` |
| **TAREFA-RECONST-012** | MOD-02 | Débito atômico de créditos de enriquecimento| CORRIGIR | P1 | 05 / 01 | RECONST-002 | SELECT FOR UPDATE no ledger de quotas | `test:integration -- enrichment` |
| **TAREFA-RECONST-013** | MOD-03 | Mecanismo Auto-Stop compulsório em cadência | CORRIGIR | P1 | 17 | RECONST-009 | Pausa imediata de fila pós-resposta | `test:integration -- cadence` |
| **TAREFA-RECONST-014** | MOD-04 | Otimização de queries N+1 em funis de BI | CORRIGIR | P2 | 04 | RECONST-002 | SLA < 800ms em relatórios agregados | `test:integration -- analytics` |
| **TAREFA-RECONST-015** | MOD-04 | Implementação de cache L2 Redis para KPIs | CORRIGIR | P2 | 23 / 16 | RECONST-014 | Invalidação por tag e TTL inteligente | `test:integration -- cache-l2` |
| **TAREFA-RECONST-016** | MOD-05 | Estabilização de canal SSE no War Room | CORRIGIR | P2 | 04 / 10 | RECONST-014 | Reconexão automática com buffer | `test:unit -- sse` |
| **TAREFA-RECONST-017** | MOD-06 | Integração compulsória de quota de IA | CORRIGIR | P2 | 23 / 07 | RECONST-006 | Bloqueio a 100% de cota nos 15 agentes | `test:unit -- ai-budget` |
| **TAREFA-RECONST-018** | MOD-06 | Paginação server-side na AIPendingAction | CORRIGIR | P2 | 07 / 02 | RECONST-006 | Carregamento sob demanda de ações | `test:unit -- pending-actions` |
| **TAREFA-RECONST-019** | MOD-07 | Leaky bucket rate limiter no conector Bitrix | CORRIGIR | P2 | 06 | RECONST-005 | Máximo 2 requisições por segundo | `test:unit -- bitrix-rate` |
| **TAREFA-RECONST-020** | MOD-07 | Engine de simulação Dry-Run em automações | RECONSTRUIR| P2 | 07 / 18 | RECONST-009 | Execução em memória sem escrita em DB | `test:integration -- dry-run` |
| **TAREFA-RECONST-021** | MOD-08 | Limpeza de stubs de rotas legadas Voice-Hub| DESCARTAR | P2 | 12 / 18 | Nenhuma | Zero rotas com unavailableLegacyModule| `verify:openapi-drift` |
| **TAREFA-RECONST-022** | MOD-08 | Consulta síncrona a listas de Não Perturbe | CORRIGIR | P2 | 12 | RECONST-021 | Bloqueio compulsório pré-discagem | `test:unit -- cold-call-check` |
| **TAREFA-RECONST-023** | MOD-09 | Gate de concessão modular HTTP 403 na API | CORRIGIR | P2 | 01 / 18 | RECONST-002 | Retorno 403 para rotas não contratadas | `test:integration -- module-gate`|
| **TAREFA-RECONST-024** | MOD-09 | Expurgador periódico de dados LGPD | CORRIGIR | P2 | 21 / 01 | RECONST-002 | Cron job de expurgo conforme retenção | `test:unit -- lgpd-retention` |
| **TAREFA-RECONST-025** | MOD-10 | Motor nativo SQLite criptografado no Mobile | RECONSTRUIR| P2 | 09 | RECONST-002 | Persistência atômica offline com AES | `test:unit -- mobile-sqlite` |
| **TAREFA-RECONST-026** | MOD-10 | Fila de sincronização transacional com DLQ | RECONSTRUIR| P2 | 09 | RECONST-025 | Falha de 1 item não trava fila | `test:integration -- mobile-sync`|
| **TAREFA-RECONST-027** | MOD-11 | Amarração de interações sociais à timeline | CORRIGIR | P2 | 05 / 02 | RECONST-003 | Inserção na timeline com 1 clique | `test:integration -- social-crm` |
| **TAREFA-RECONST-028** | MOD-11 | Rate limiter de abordagens consultivas | CORRIGIR | P2 | 05 / 16 | RECONST-009 | Bloqueio de disparos predatórios | `test:unit -- social-limiter` |
| **TAREFA-RECONST-029** | Global | Auditoria de contraste e conformidade WCAG | CORRIGIR | P3 | 03 | RECONST-008 | Relação de contraste >= 4.5:1 em temas | `npm run test:e2e -- a11y` |
| **TAREFA-RECONST-030** | Global | Prevenção de focus trap em modais Radix | CORRIGIR | P3 | 03 | RECONST-029 | Navegação por teclado 100% acessível | `npm run test:e2e -- focus` |
| **TAREFA-RECONST-031** | Global | Isolamento de testes flaky em CI | CORRIGIR | P3 | 08 | Nenhuma | Zero falhas intermitentes em esteira | `npm run test:e2e` |
| **TAREFA-RECONST-032** | Global | Setup de suíte de testes de mutação | CORRIGIR | P3 | 08 | RECONST-031 | Score de mutação > 70% em domínio | `npm run test:mutation` |
| **TAREFA-RECONST-033** | MOD-01 | Dossiê de Conta pré-reunião em 10 seções | CORRIGIR | P2 | 05 / 07 | RECONST-012 | Geração em PDF/Web em < 3 segundos | `test:unit -- account-dossier` |
| **TAREFA-RECONST-034** | MOD-01 | Assinatura digital integrada com Gov.br | CORRIGIR | P2 | 18 / 06 | RECONST-011 | Validação de assinatura ICP-Brasil | `test:integration -- signature` |
| **TAREFA-RECONST-035** | MOD-02 | Pipeline em cascata de enriquecimento (7) | CORRIGIR | P2 | 05 / 06 | RECONST-012 | Fallback transparente entre fontes | `test:integration -- providers` |
| **TAREFA-RECONST-036** | MOD-03 | Mesa de tratamento com distribuição round-robin| PRESERVAR | P2 | 17 | RECONST-013 | Roteamento balanceado em < 5 minutos | `test:unit -- lead-router` |
| **TAREFA-RECONST-037** | MOD-03 | Roleplay interativo de playbook de vendas | PRESERVAR | P3 | 07 / 02 | RECONST-017 | Simulação com áudio e feedback SPIN | `test:unit -- roleplay` |
| **TAREFA-RECONST-038** | MOD-04 | Motor de autópsia sistemática Win/Loss | CORRIGIR | P2 | 04 / 07 | RECONST-014 | Formulário estruturado com análise IA | `test:unit -- winloss-autopsy` |
| **TAREFA-RECONST-039** | MOD-04 | Trilha de conquistas e badges comerciais | PRESERVAR | P3 | 04 / 02 | Nenhuma | Notificações em tempo real de medalhas | `test:unit -- gamification` |
| **TAREFA-RECONST-040** | MOD-05 | Calibração de metas com intervalo de confiança| CORRIGIR | P2 | 04 / 23 | RECONST-014 | MAPE histórico < 8% em previsões | `test:unit -- forecast-mape` |
| **TAREFA-RECONST-041** | MOD-06 | Busca vetorial HNSW em pgvector | PRESERVAR | P2 | 07 / 01 | RECONST-002 | Latência de busca < 50ms para 100k docs| `test:integration -- pgvector` |
| **TAREFA-RECONST-042** | MOD-06 | Sandbox isolado para execução de código de agentes| CORRIGIR | P2 | 13 / 15 | RECONST-006 | Execução em Firecracker / Node VM | `test:integration -- sandbox` |
| **TAREFA-RECONST-043** | MOD-07 | Sincronização delta incremental Bitrix24 | CORRIGIR | P2 | 06A | RECONST-019 | Atualização apenas de modificados | `test:integration -- bitrix-sync`|
| **TAREFA-RECONST-044** | MOD-08 | Transcrição em tempo real via WebSocket | PRESERVAR | P2 | 12 | RECONST-021 | Streaming de áudio com delay < 300ms | `test:unit -- audio-stream` |
| **TAREFA-RECONST-045** | MOD-08 | Detecção de promessas verbais em reuniões | CORRIGIR | P2 | 12 / 07 | RECONST-044 | Criação automática de rascunho de task | `test:unit -- promise-detector` |
| **TAREFA-RECONST-046** | MOD-09 | Wizard de onboarding de novo tenant | PRESERVAR | P2 | 02 / 01 | RECONST-002 | Setup completo em menos de 3 minutos | `npm run test:e2e -- onboarding`|
| **TAREFA-RECONST-047** | MOD-09 | Exportação segura de dados em formato JSON/CSV| PRESERVAR | P2 | 21 | RECONST-024 | Geração assíncrona com link assinado | `test:unit -- data-export` |
| **TAREFA-RECONST-048** | MOD-10 | Gravação de reuniões de campo sem conectividade| RECONSTRUIR| P2 | 09 | RECONST-025 | Buffer contínuo de áudio sem perda | `test:unit -- field-audio` |
| **TAREFA-RECONST-049** | MOD-11 | Sugestão de conexões estratégicas no LinkedIn | PRESERVAR | P3 | 05 / 07 | RECONST-028 | Análise de organograma e tomadores | `test:unit -- social-graph` |
| **TAREFA-RECONST-050** | Global | Verificação de conformidade OpenAPI viva | PRESERVAR | P3 | 18 | Nenhuma | Zero deriva entre spec e implementação | `verify:openapi-drift` |
| **TAREFA-RECONST-051** | Global | Varredura de segredos em commits e histórico | CORRIGIR | P0 | 15 / 08A | RECONST-001 | Zero chaves em claro detectadas | `gitleaks detect` |
| **TAREFA-RECONST-052** | Global | Auditoria final independente de release | CORRIGIR | P0 | 24 | Todas anteriores | Parecer APROVADO emitido pelo Agente 24| Parecer formal em `.agents/reviews/`|
