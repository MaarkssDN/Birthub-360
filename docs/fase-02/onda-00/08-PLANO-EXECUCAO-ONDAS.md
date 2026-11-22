# PLANO MESTRE DE EXECUÇÃO EM 6 ONDAS — FASE 02 (ONDA 00)
**Produto:** Birthub 360° — Sistema Operacional de Revenue Intelligence  
**Data:** 10 de Novembro de 2026  
**Autoridade:** Agente 00 (Supervisor Geral de Engenharia)  
**Em conformidade com:** `AGENTS.md` (Ordem de Integração §19, Concorrência §13 e Gates §28)  
**Status:** PLANEJADO — EXECUÇÃO BLOQUEADA AGUARDANDO AUTORIZAÇÃO

---

## 1. Visão Geral da Estratégia de Execução

A reconstrução do Birthub 360° não será realizada em "big bang", mas sim através de **6 Ondas Sucessivas de Engenharia**, garantindo que a estabilidade do sistema seja mantida a cada etapa e que nenhum merge seja realizado sem validação independente pelo Agente 24.

---

## 2. Detalhamento das 6 Ondas de Engenharia

### ONDA 01 — Fundação, Tenancy e Schema Central
- **Slots Oficiais:** Agente 01 (Plataforma), Agente 01A (RLS), Agente 15 (Segurança).
- **Tarefas de Backlog:** RECONST-001, RECONST-002, RECONST-007, RECONST-051.
- **Entregas Mandatórias:**
  1. Neutralização imediata da vulnerabilidade P0 de logs de token em `src/lib/auth.ts`.
  2. Habilitação de PostgreSQL RLS em 100% das tabelas transacionais de negócio.
  3. Varredura de segredos do repositório com Gitleaks.
- **Quality Gate Obrigatório:** `verify-auth-log-redaction.mjs` aprovado + `test:integration -- rls` verde.

### ONDA 02 — Hub Comercial, Contratos e Hotspots de UI
- **Slots Oficiais:** Agente 02 (Produto/UX), Agente 04 (CRM), Agente 06 (Integrações), Agente 13 (Supervisor), Agente 18 (Contratos).
- **Tarefas de Backlog:** RECONST-003, RECONST-004, RECONST-005, RECONST-006, RECONST-011.
- **Entregas Mandatórias:**
  1. Decomposição modular dos hotspots sob exceção (`CrmBoard.tsx`, `BitrixImportPanel.tsx`, `supervisor.agent.ts`, `App.tsx`).
  2. Implementação das travas de alçada de desconto em propostas (10% Closer / 20% Gestor / Diretoria).
- **Quality Gate Obrigatório:** `npm run check:hotspots` com 0 arquivos acima de 1.000 linhas sem exceção.

### ONDA 03 — Prospecção, Enriquecimento e Orquestração
- **Slots Oficiais:** Agente 05 (Prospecção), Agente 06 (Bitrix), Agente 17 (Cadência).
- **Tarefas de Backlog:** RECONST-012, RECONST-013, RECONST-033, RECONST-035, RECONST-036.
- **Entregas Mandatórias:**
  1. Débito atômico de créditos em APIs pagas com `SELECT FOR UPDATE` no ledger de quotas.
  2. Auto-Stop compulsório de cadências em < 1s após recebimento de resposta do lead.
  3. Mesa de tratamento com distribuição balanceada de leads inbound em < 5 minutos.
- **Quality Gate Obrigatório:** Teste de concorrência de quotas e teste de interrupção imediata de cadência.

### ONDA 04 — Analytics, Previsibilidade e Performance
- **Slots Oficiais:** Agente 04 (BI), Agente 10 (SRE), Agente 16 (Runtime), Agente 23 (Custo/Perf).
- **Tarefas de Backlog:** RECONST-009, RECONST-010, RECONST-014, RECONST-015, RECONST-016, RECONST-038, RECONST-040.
- **Entregas Mandatórias:**
  1. Eliminação de queries N+1 em funis e relatórios executivos (tempo < 800ms).
  2. Implementação de Dead-Letter Queues (DLQ) com alertas para falhas de jobs.
  3. War Room executivo com telemetria estável em tempo real via Server-Sent Events (SSE).
- **Quality Gate Obrigatório:** `load:k6:crm` garantindo p95 < 200ms para endpoints críticos.

### ONDA 05 — Enxame de IA, Supervisor e Conectividade
- **Slots Oficiais:** Agente 06A (Extração Bitrix), Agente 07 (IA), Agente 12 (Voz), Agente 13 (Swarm).
- **Tarefas de Backlog:** RECONST-017, RECONST-018, RECONST-019, RECONST-020, RECONST-021, RECONST-022, RECONST-041, RECONST-044, RECONST-045.
- **Entregas Mandatórias:**
  1. Supervisor semântico com isolamento de despacho e fila de aprovação humana.
  2. Conector Bitrix24 resiliente com controle leaky bucket de 2 req/s.
  3. VoiceHub Studio com transcrição em streaming e bloqueio compulsório de Não Perturbe.
  4. Engine de simulação Dry-Run em automações sem escrita em banco de dados.
- **Quality Gate Obrigatório:** Bloqueio 100% eficaz de ações de risco HIGH sem aprovação humana.

### ONDA 06 — Mobilidade, Social Selling e Certificação de Release
- **Slots Oficiais:** Agente 03 (Design/A11y), Agente 08 / 08A (QA/Deploy), Agente 09 (Mobile), Agente 21 (LGPD), Agente 24 (Revisão Independente).
- **Tarefas de Backlog:** RECONST-008, RECONST-024, RECONST-025, RECONST-026, RECONST-027, RECONST-028, RECONST-029, RECONST-030, RECONST-031, RECONST-032, RECONST-050, RECONST-052.
- **Entregas Mandatórias:**
  1. Motor offline nativo em SQLite criptografado no aplicativo móvel com upload em DLQ.
  2. Módulo de Social Selling integrado à timeline unificada do CRM.
  3. Conformidade estrita de acessibilidade WCAG 2.2 AA em todas as telas e temas.
  4. Parecer formal conclusivo de aprovação de release emitido pelo Agente 24.
- **Quality Gate Obrigatório:** Gate completo de release verde (`tsc --noEmit`, `lint`, `audit`, `verify:prod`).

---

## 3. Protocolo de Integração e Merges (`AGENTS.md` §21)

1. Cada especialista desenvolve em branch própria `agente/<slot>-<slug>` a partir de `integracao/onda-<n>`.
2. A integração ocorre em lotes contínuos de **2 a 3 merges**, seguidos imediatamente de execução do gate.
3. Se um lote quebrar o gate, o merge causador é revertido imediatamente antes de prosseguir.
4. O Agente 24 revisa o diff completo de cada lote em `.agents/reviews/`.
