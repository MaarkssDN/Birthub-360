# DOSSIÊ DE GATES + PRES-005 — Operação Preservação Controlada
**Agente 00 — Astra · 2026-11-22 · Escopo: documentação/evidência apenas**

Missão recebida via Orquestrador (canal Devin↔ChatGPT): MISSÃO 1 (dossiê de gates), MISSÃO 3 (PRES-005 read-only), MISSÃO 4 (pacote de homologação). MISSÃO 2 (ratificação) depende de instância separada — ver §4.

---

## 1. DOSSIÊ DE GATES — PRs #534/#535/#536

### 1.1 Sumário de checks (runs frescos pós-migração, 2026-11-22 ~18:43–18:47 UTC)

| Gate | #534 | #535 | #536 | Diagnóstico |
|---|---|---|---|---|
| `validate-agent-rules` | ✅ pass | ✅ pass | ✅ pass | Resolvido por nomenclatura `agente/NN-*` |
| secret scan / trivy / dep-review / CodeQL / CodeRabbit | ✅ | ✅ | ✅ | — |
| `build` (agregador) | ❌ 3s | ❌ 2s | ❌ 2s | Falha em cascata: `APPLICATION_GATE_RESULT=failure` |
| `application gate` | ❌ ~2m | ❌ ~2m | ❌ ~2m | Biome lint — **6 erros em arquivos `src/` pré-existentes** |
| `Semgrep SAST` | ❌ ~1m | ❌ ~1m | ❌ ~1m | **2 findings bloqueantes** em `src/` |
| `SonarQube` | ⏳ pending | ⏳ pending | ⏳ pending | Runs antigos falharam (~15–21min); resultado novo pendente |

### 1.2 Fingerprints de falha (evidência direta dos logs)

**`build`** — não é falha própria: step "Consolidar veredito do repositório" testa `APPLICATION_GATE_RESULT=success`; valor real = `failure` → exit 1 em ~2s. Job-run: `45056696013/job/137314393428` (#534).

**`application gate`** — Biome (`lint/correctness`, `lint/a11y`, `lint/style`) reporta "Found 6 errors" em arquivos **não tocados pelos PRs**:
`src/components/charts/RevenueChart.tsx` (useSemanticElements ×2, useImportType, useExhaustiveDependencies ×2), `src/components/feedback/EmptyState.tsx`, `src/components/motion/MotionWrapper.tsx`, `src/components/brand/title-icons/flowIcons.tsx`, `src/contexts/__tests__/AuthContext.logoutOfflinePurge.test.tsx`, `src/features/ai-voice/flowise-router.service.ts`, `src/features/analytics/application/AnalyticsUseCases.ts`, `src/features/billing/application/UsageUseCases.ts`. Job-run: `45056696013/job/137313613510`.

**`Semgrep SAST`** — `semgrep scan --config p/typescript --config p/nodejs --config p/secrets --error` → "Findings: 2 (2 blocking)". Os 2 findings são os mesmos débitos conhecidos de main, cobertos pelo PR #507 (aguarda DEC-H02). Job-run: `45056696049/job/137313398992`.

### 1.3 Comparação com baseline

- **PR #528** (`agente/00-plano-mestre-operacional-100-agentes`, docs-only, branch já conforme): `validate-agent-rules` PASS, mas **mesmas falhas** em application gate, Semgrep, SonarQube, build — runs `44869048906`/`44869048937`/`44869048899`.
- **Runs de `main`**: `Central Birth Hub 360 Release` e `API Schema Fuzz (Schemathesis)` já falham em main.
- **Conclusão:** application gate (Biome em `src/`), Semgrep (2 findings) e o agregador `build` são **falhas herdadas de main**, não introduzidas pelos PRs documentais — os diffs não tocam `src/`, `scripts/` de gate ou workflows. SonarQube: runs antigos falharam; novos pendentes — marcar **NÃO DETERMINADO** até conclusão.

### 1.4 Pedidos de exceção (SEPARADOS — não concedidos)

| Gate | Pedido | Fundamento | Controles compensatórios | Aprovação requerida |
|---|---|---|---|---|
| application gate | Dispensa para PRs docs-only #534–#536 | Falha = Biome lint em `src/` não tocado; diff 100% `.agents/`,`docs/` | secret scan/CodeQL/dep-review verdes; diff auditado | Orquestrador Humano + ratificação |
| Semgrep SAST | Idem | 2 findings = débitos conhecidos de main (#507) | scan roda e reporta; findings não introduzidos pelo diff | Orquestrador Humano |
| SonarQube | Idem (quando concluir) | Se falhar por issues pré-existentes de main | — | Orquestrador Humano |
| `build` | Não requer exceção própria | É agregador — resolve-se com os acima | — | — |

**Nenhuma exceção foi implementada ou concedida.** `validate-agent-rules` foi resolvido por conformidade, não por dispensa.

---

## 1.5 ERRATA/EVIDÊNCIAS COMPLEMENTARES (2026-11-22, resposta do revisor externo)

### SonarQube — resultado real (substitui "PENDENTE")

Concluiu com **FAILURE nos 4 PRs** (~19:06–19:18 UTC): #534, #535, #536, #537.
**Fingerprint:** falha na etapa "Run Tests with Coverage" — testes unitários pré-existentes quebram antes da análise Sonar:
- `tests/unit/shared/middlewares/errorHandler.test.ts:193` — `TypeError: req.header is not a function` (`sendError src/shared/middlewares/errorHandler.ts:207`)
- `tests/unit/shared/middlewares/errorHandler.test.ts:212` — `AssertionError` (vazamento de `org-b` em resposta de erro)
**Classificação:** falha de teste unitário em `src/`/`tests/` **não tocados pelos diffs docs-only** → herdada de main (PROVÁVEL; os diffs não alteram código). Não é indisponibilidade do serviço nem quality gate reprovado — é a suíte de testes que falha no step de cobertura.

### Semgrep SAST — os 2 findings identificados

| Arquivo | Regra |
|---|---|
| `scripts/security/reencrypt-credentials.ts` | `javascript.express.security.audit.xss.direct-response-write.direct-response-write` |
| `src/features/integrations/bitrix/bitrix.routes.ts` | mesma regra (XSS direct-response-write) |

Ambos em código-fonte pré-existente, fora do escopo docs-only. Cobertos pelo trabalho de AppSec em andamento (#507/DEC-H02). Classificação: **PROVÁVELMENTE herdado de main** (indício forte: PR #528 idêntico + arquivos não tocados; prova formal por comparação de baseline fica para o revisor).

### application gate/Biome — conciliação da contagem

O log reporta "Found 6 errors" mas lista mais de 6 ocorrências porque várias são do **mesmo arquivo** (RevenueChart.tsx concentra 5) e há warnings FIXABLE misturados. Contagem exata de erros bloqueantes = 6 diagnósticos `error`-level; o restante são warnings. Arquivos afetados: `RevenueChart.tsx`, `EmptyState.tsx`, `MotionWrapper.tsx`, `flowIcons.tsx`, `AuthContext.logoutOfflinePurge.test.tsx`, `flowise-router.service.ts`, `AnalyticsUseCases.ts`, `UsageUseCases.ts` — **nenhum tocado pelos diffs**.

### Gates — quadro final consolidado

| Gate | #534–#537 | Origem |
|---|---|---|
| validate-agent-rules | ✅ PASS | resolvido por nomenclatura |
| secret scan / trivy / dep-review / CodeQL | ✅ PASS | — |
| build (agregador) | ❌ | cascata de application gate |
| application gate (Biome) | ❌ | herdado de main — `src/` não tocado |
| Semgrep SAST | ❌ | herdado de main — 2 findings conhecidos |
| SonarQube | ❌ | herdado de main — testes unitários `errorHandler.test.ts` falham |

**Todos os diffs são 100% documentais** (`.agents/`, `docs/orchestration/`). Nenhuma falha toca arquivo alterado pelo PR. Classificação global: **PROVÁVELMENTE herdado** — prova final cabe ao revisor independente.

---

## 2. PACOTE DE HOMOLOGAÇÃO (MISSÃO 4)

| PR | Conteúdo | HEAD | Ownership | Checks obrigatórios | Falhas remanescentes | Auditoria |
|---|---|---|---|---|---|---|
| #534 | Etapa 0 (DEM+matriz+INDEX/journal+doc13) | `5d6a61c19` | `.agents/runs`,`docs/orchestration` → 00 | validate-agent-rules ✅; demais herdados | app-gate/Semgrep/build/Sonar* | Silas (mesmo runtime — ver §4) |
| #535 | 5 handoffs históricos | `4d01e6b07` | `.agents/handoffs` → autores originais | idem | idem | idem |
| #536 | Parecer Silas + reauditoria | `f80aca2be` | `.agents/reviews` → 09 | idem | idem | — (é o próprio parecer) |

**Ordem recomendada:** #536 primeiro (evidência de auditoria) → #534 → #535, todos após ratificação + decisão sobre exceção de gates. Antigos #531/#532/#533 permanecem OPEN até fechamento SUPERSEDED autorizado.

**Encaminhamento Agente 98 (Safira):** triagem da exposição de credenciais documentada em `11-para-15-env-identidade-visual.md` (~120 variáveis populadas em `.env` externo `C:\DOCUMENTOS\IDENTIDADE-VISUAL`). Sem valores copiados; sem rotação unilateral.

---

## 3. PRES-005 — INVENTÁRIO DE WORKTREES (read-only, 2026-11-22)

**40 worktrees registrados.** Working tree sujo: apenas 2 — checkout principal (28 entradas, modificações de sessões anteriores conhecidas) e `handoff-devin-consolidacao` (7). Demais 38 limpos.

### 3.1 Commits NÃO publicados (branch local sem remoto ou ahead)

| Branch | Situação | Risco |
|---|---|---|
| `integracao/consolidacao-20261121` | **SEM-REMOTO**, HEAD `d2059c594` (ativo — Genesis commitando) | 🔴 Alto — integração inteira só local |
| `agente/03-telas-brand-system` | AHEAD-107 | 🔴 Alto — 107 commits não publicados |
| `update_agents_documentation` | AHEAD-40 | 🟠 Médio |
| `chore/handoff-devin-consolidacao-global-20261120` | AHEAD-4 | 🟡 Baixo (PR #481 mergeado cobre conteúdo) |
| `chore/handoff-00-despacho-wave-a-b-20261120` | AHEAD-2 | 🟡 Baixo |
| `agente/00-plano-mestre-operacional-100-agentes` | AHEAD-1 | 🟡 PR #528 aberto |
| `agente/16-workers-filqs-temp`, `consolidacao_backlog_birthub360`, `execute_setup_script`, `pr471-resolve`, `pr486-resolve`, `reconcile_handoffs_birthub`, `wE-02/07/09/10` | SEM-REMOTO (locais de resolução de PR) | 🟡 a avaliar — maioria já mergeada via outros caminhos |
| stash@{0} | WIP em `integracao/onda-2` | 🟡 preservar |

### 3.2 Proposta de preservação (NÃO executada)

1. **Genesis (`integracao/consolidacao-20261121`):** aguardar sessão Genesis encerrar OU push para branch de preservação `backup/genesis-consolidacao-20261122` — requer autorização separada (branch está ativa).
2. **`agente/03-telas-brand-system` (107 commits):** verificar se conteúdo já entrou via #471/outras branches antes de propor push.
3. Demais: classificação caso a caso pelo Orquestrador.

---

## 4. RATIFICAÇÃO INDEPENDENTE — STATUS: BLOQUEADO POR INSTÂNCIA

O mesmo runtime Devin atuou como executor (Astra, PRs #534–#536) e auditor (Silas, parecer em #536). Isso fornece verificação técnica, **não independência organizacional**. Não foi emitida nova ratificação — registro honesto de limitação. Necessário: revisor humano ou instância realmente separada, com parecer referenciando os SHAs exatos. PRs #531/#532/#533 mantidos abertos até homologação dos substitutos.

---

## 5. CRITÉRIOS DE ENCERRAMENTO — STATUS

- A) Dossiê por gate: ✅ (§1, SonarQube = pendente de conclusão)
- B) Pacote ratificação: ✅ preparado (§2/§4) — ratificação real BLOQUEADA
- C) PRES-005: ✅ (§3)
- D) Tabela homologação: ✅ (§2)
- E) Desfecho no canal: registrado em `Chatgpt Responder.txt`
