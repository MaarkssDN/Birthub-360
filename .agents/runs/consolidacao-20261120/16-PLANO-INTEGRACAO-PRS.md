# 12 — PLANO DE INTEGRAÇÃO DOS PULL REQUESTS ABERTOS
**Birthub 360° — Central de Inteligência e Comando Operacional**  
**Autor:** Agente 00 — Astra (Coordenador Global)  
**Data:** 2026-11-21 · **Base Canônica:** `origin/main @ 0d790443d`  
**Governança Oficial:** AGENTS.md (Arquitetura 100 Agentes) | **Auditoria Independente:** Agente 09 — Silas  

---

## 1. Visão Geral da Fila de Pull Requests

Atualmente constam **31 Pull Requests abertos** no repositório. Para evitar conflitos de merge, degradação de CI e sobreposição de domínios, a esteira de integração é dividida em **4 Levas Sequenciais**, com congelamento temporário a cada leva para execução de gates e obtenção de parecer do **Agente 09 (Silas)**.

A regra fundamental de merge é: **somente squash merge**, **proibido force push** e **proibido merge com checks vermelhos**.

---

## 2. Levas de Integração Assistida

### LEVA 1 — Estabilização de CI, Governança e Encerramento Documental
- **Objetivo:** Destravar o check de formatação da `main` e consolidar todo o acervo documental das sessões finalizadas sem alterar código produtivo.
- **PRs Envolvidos:**
  1. **PR #511:** `style: biome format em LeadUseCases.ts` (Destrava Prettier check na `main`).
  2. **PR #528:** `docs(governance): plano mestre operacional e ondas (100 agentes)` (Parecer APROVADO emitido por Silas em `.agents/reviews/09-pr528-*.md`).
  3. **PR #529:** `docs(handoff): encerramento de sessão e continuidade 100 agentes ao Agente 00`.
  4. **PR #527 / #526:** `docs(handoff): continuidade Devin operação central e UX master`.
  5. **PR #525 / #524 / #521:** `docs(handoff): restauração de governança, etapa 0 e conflito 434`.
  6. **PR #523 / #522 / #517 / #513:** `docs(handoff): encerramento waves D/E/F e ondas 6/02`.
- **Procedimento:**
  - Merge do PR #511 via squash.
  - Sincronização dos PRs documentais e merge em lote.
- **Gate de Saída:** Step `Run Prettier check` 100% verde em `main` e documentação centralizada.

---

### LEVA 2 — Segurança, Hardening e Schema de Auditoria (Após Decisões DEC-H)
- **Objetivo:** Sanar achados de Semgrep, reforçar segurança de TLS e ativar o log de agentes autônomos.
- **PRs Envolvidos:**
  1. **PR #507:** `fix(security): zera achados pré-existentes de Semgrep/CodeQL em main` (Depende de DEC-H02).
  2. **PR #487:** `fix(schema): SwarmAuditLog + migração com RLS por tenant` (Depende de DEC-H01).
  3. **PR #505:** `test(security): cobre /api/google/disconnect e relatório B-02`.
  4. **PR #401:** `fix(05): AUD-1 SSRF guard + RBAC na rota /enrich`.
  5. **PR #397:** `fix(15): AUD-1 segurança — SECURE_COOKIES secure-by-default`.
  6. **PR #396:** `fix(06): AUD-1 — sanitização de erros e RBAC WhatsApp`.
- **Procedimento:**
  - Sincronizar branches via `git merge origin/main`.
  - Marcar PRs #507 e #487 como prontos (`gh pr ready`).
  - Submeter diffs ao Agente 09 (Silas) para emissão de parecer formal.
  - Squash merge ordenado: #507 &rarr; #487 &rarr; #505 &rarr; #401/#397/#396.
- **Gate de Saída:** Semgrep SAST 100% verde; migração `SwarmAuditLog` aplicada sem erro.

---

### LEVA 3 — Funcionalidades de CRM, Prospecção e Contratos de API
- **Objetivo:** Integrar as dívidas de negócio saneadas de contatos, empresas, cold-email e envelope RFC 7807.
- **PRs Envolvidos:**
  1. **PR #434:** `fix(crm): Trilha E — DEBT-0017/0018/0019 (status canônico e soft delete de Company)`.  
     *Nota:* Conflito em `PrismaContactRepository.ts` já foi 100% resolvido; aguarda apenas Leva 1 e 2.
  2. **PR #437:** `feat(prospecting): persistência + dedupe + trilha LGPD no sendColdEmail (DEBT-0011)`.
  3. **PR #399:** `feat(18): MEL-39/40 — envelope de erro unificado e runner Schemathesis`.
  4. **PR #386:** `test(08): saneamento handoffs QA`.
- **Procedimento:**
  - Sincronizar com a `main` pós-Leva 2.
  - Rodar suítes unitárias de contatos e CRM.
  - Obter parecer de Silas para #434 e #437.
  - Squash merge sequencial.
- **Gate de Saída:** Zero regressão nas APIs de CRM; Schemathesis operando sem 5xx.

---

### LEVA 4 — Estabilização de Testes Flaky e Dependabot
- **Objetivo:** Eliminar intermitências de E2E e atualizar dependências seguras.
- **PRs Envolvidos:**
  1. **PR #403:** `test(14): Onda 6 — correções de testes flaky e2e/integração (MEL-44/45)`.
  2. **PR #366:** `feat(onda-6): resiliência, idempotência e versionamento de APIs` (Reconciliar Wave E já mergeada e fechar ou integrar residual).
  3. **PR #353:** `docs(handoff): diagnóstico Postman sync HTTP 400` (Arquivar/fechar como superado).
  4. **PRs Dependabot (#497 a #501):** Atualizações de `@hookform/resolvers`, `@biomejs/biome`, `google-auth-library`, `dependency-cruiser` e `framer-motion`.
- **Procedimento:**
  - Validar build e suíte unitária para cada bump de dependência.
  - Integrar fixes de testes do PR #403.
- **Gate de Saída:** Fila de PRs zerada ou reduzida estritamente a novas features; CI totalmente estável.

---

## 3. Matriz de Rastreabilidade e Destino dos PRs

| PR # | Branch | Domínio | Status Atual | Destino Planejado | Ação do Coordenador |
|---|---|---|---|:---:|---|
| **#529** | `chore/handoff-antigravity-encerramento-100-agentes-20261121` | Governança | Aberto | Merge (Leva 1) | Incorporar handoff de encerramento |
| **#528** | `agente/00-plano-mestre-operacional-100-agentes` | Governança | Aberto (Auditado) | Merge (Leva 1) | Incorporar plano mestre operacional |
| **#527** | `chore/handoff-devin-central-operacao-20261121` | Governança | Aberto | Merge (Leva 1) | Incorporar memória operacional |
| **#526** | `chore/handoff-devin-encerramento-20261121` | Governança | Aberto | Merge (Leva 1) | Incorporar encerramento UX |
| **#525** | `chore/handoff-00-conflito434-deliberacao487-20261121` | Governança | Aberto | Merge (Leva 1) | Incorporar resolução de conflito |
| **#524** | `chore/handoff-antigravity-restauracao-governanca-20261121` | Governança | Aberto | Merge (Leva 1) | Incorporar acervo restaurado |
| **#523** | `devin/handoff-continuidade-merge-20261120` | Governança | Aberto | Merge (Leva 1) | Incorporar histórico de merges |
| **#522** | `agente/00-handoff-continuidade-20261121` | Governança | Aberto | Merge (Leva 1) | Incorporar trilhas C.1/C.2/C.3 |
| **#521** | `chore/handoff-00-reconciliacao-etapa-0-20261121` | Governança | Aberto | Merge (Leva 1) | Incorporar matriz etapa 0 |
| **#517** | `chore/handoff-00-governanca-ux-ui-pr471-20261120` | Governança | Aberto | Merge (Leva 1) | Incorporar governança brand system |
| **#513** | `docs/00-handoff-onda-02-20261120` | Governança | Aberto | Merge (Leva 1) | Incorporar transição onda 02 |
| **#511** | `agente/94-biome-format-leaduse` | Qualidade / CI | Aberto | Merge Prioritário | Destravar Prettier check |
| **#507** | `agente/99-semgrep-codeql-main` | Segurança | DRAFT | Merge (Leva 2) | Ready pós-decisão DEC-H02 e merge |
| **#505** | `agente/97-b02-testes-servico` | Segurança | DRAFT | Merge (Leva 2) | Ready e merge assistido |
| **#487** | `agente/11-12-swarm-audit-log` | Dados / Schema | DRAFT (Auditado) | Merge (Leva 2) | Ready pós-decisão DEC-H01 e merge |
| **#434** | `agente/04-crm-debts-0017-0019` | CRM / Backend | Aberto (Clean) | Merge (Leva 3) | Submeter a Silas e mergear |
| **#437** | `agente/05-cold-email-persistencia` | Prospecção | Aberto | Merge (Leva 3) | Submeter a Silas e mergear |
| **#401** | `agente/05-aud1-ssrf` | Segurança | Aberto | Merge (Leva 2) | Rebase e merge assistido |
| **#399** | `agente/18-onda5-api` | Contratos / API | Aberto | Merge (Leva 3) | Rebase e merge assistido |
| **#397** | `agente/15-aud1-seguranca-config` | Segurança | Aberto | Merge (Leva 2) | Rebase e merge assistido |
| **#396** | `agente/06-aud1-crm-honesto` | CRM / Segurança | Aberto | Merge (Leva 2) | Rebase e merge assistido |
| **#403** | `agente/14-onda6-testes-flaky-e2e` | QA / E2E | Aberto | Merge (Leva 4) | Triagem de testes flaky |
| **#386** | `agente/08-handoffs-20261117` | QA | Aberto | Merge (Leva 3) | Rebase e merge |
| **#366** | `integracao/onda-6` | Integração | Aberto | Fechar / Arquivar | Superado pelas Waves E e F mergeadas |
| **#353** | `docs/postman-sync-handoff` | Governança | Aberto | Fechar / Arquivar | Diagnóstico resolvido |
