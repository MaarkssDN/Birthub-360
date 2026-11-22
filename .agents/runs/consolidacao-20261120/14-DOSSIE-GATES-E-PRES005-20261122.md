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

Concluiu com **FAILURE nos 4 PRs** (~19:05–19:18 UTC): #534, #535, #536, #537.
**Fingerprint:** falha na etapa "Run Tests with Coverage" — a suíte vitest quebra antes da análise Sonar:
- **5 arquivos de teste / 32 testes falhos** (981 arquivos passam, 7901 testes passam, 1 skip) — contagem idêntica nos 4 PRs e em `main`.
- Arquivos com falha (idênticos em #534/#535/#536/#537 e `main` run `44856026577`):
  - `tests/unit/bootstrap/frontend.test.ts` — guarda anti-bypass `/tools` (`/foo/tools/bar.html` retorna 200, esperado 404)
  - `tests/unit/shared/middlewares/errorHandler.test.ts` e `errorHandler.production.test.ts` — `TypeError: req.header is not a function` (mock de req incompleto) + assertions de mascaramento
  - `src/shared/services/__tests__/dataSubjectErasure.unit.test.ts` — anonimização LGPD
  - `tests/unit/features/market-intelligence/server/accountIntelligence.routes.contract.test.ts` — contrato cross-tenant 404
**Classificação:** **CONFIRMADO herdado de main** — fingerprint bit-a-bit idêntico (mesmos 5 arquivos, mesmos 32 testes, mesmos totais) no run de `main` `44856026577` (HEAD `0d790443d`) e no PR #528 (`44869048899`). Os diffs docs-only não tocam `src/`, `tests/` ou workflows. Não é indisponibilidade do serviço nem quality gate Sonar reprovado — é a suíte de testes que falha no step de cobertura.

### Semgrep SAST — os 2 findings identificados (corrigido em §6)

| Arquivo | Linha | Regra |
|---|---|---|
| `scripts/security/reencrypt-credentials.ts` | ~565 | `problem-based-packs.insecure-transport.js-node.bypass-tls-verification` — `rejectUnauthorized: false` |
| `src/features/integrations/bitrix/bitrix.routes.ts` | ~837 | `javascript.express.security.audit.xss.direct-response-write` — `res.send(buffer)` |

Ambos em código-fonte pré-existente, fora do escopo docs-only. **CONFIRMADO herdado de main**: run `44856026622` em `main` (`0d790443d`) reporta os mesmos 2 findings, mesmas regras, mesmas linhas ("Findings: 2 (2 blocking)", 111 rules, 2792 arquivos).

### application gate/Biome — conciliação da contagem (corrigido em §6)

O "Found 6 errors" vem do step **`biome format` (`format:check`)**, não do lint: são **6 arquivos com formatação divergente** — `src/features/copiloto-ia/application/CopilotoIaUseCases.ts`, `src/features/copiloto-ia/application/__tests__/nextBestAction.unit.test.ts`, `src/features/copiloto-ia/domain/CopilotoIa.ts`, `src/features/crm/application/LeadUseCases.ts`, `src/features/crm/routing/__tests__/round-robin.unit.test.ts`, `src/features/voice-hub/services/callRecord.service.ts`. Os diagnósticos `lint/*` listados no log são warnings que não bloqueiam. **CONFIRMADO herdado de main**: run `44856026585` em `main` falha com os mesmos 6 arquivos de formato. Nenhum arquivo é tocado pelos diffs.

### Gates — quadro final consolidado

| Gate | #534–#537 | Origem |
|---|---|---|
| validate-agent-rules | ✅ PASS | resolvido por nomenclatura |
| secret scan / trivy / dep-review / CodeQL | ✅ PASS | — |
| build (agregador) | ❌ | cascata de application gate |
| application gate (Biome) | ❌ | herdado de main — `src/` não tocado |
| Semgrep SAST | ❌ | herdado de main — 2 findings conhecidos |
| SonarQube | ❌ | herdado de main — testes unitários `errorHandler.test.ts` falham |

**Todos os diffs são 100% documentais** (`.agents/`, `docs/orchestration/`). Nenhuma falha toca arquivo alterado pelo PR. Classificação global: **CONFIRMADO herdado de main** para SonarQube, Semgrep e application gate — fingerprints idênticos verificados em runs de `main` (`0d790443d`) e PR #528; resta ao revisor independente homologar a classificação.

---

## 6. ADENDO DE VERIFICAÇÃO — REVALIDAÇÃO PRES-005 E DECISÕES (Devin, 2026-11-22 ~19:30 UTC)

### 6.1 Errata da §1.5

- Tabela Semgrep da §1.5 atribuía a regra errada aos arquivos — corrigida acima (TLS-bypass ↔ `reencrypt-credentials.ts`; XSS direct-write ↔ `bitrix.routes.ts`).
- §1.5 atribuía "Found 6 errors" a diagnósticos de lint — na verdade é `biome format` (`format:check`) com 6 arquivos não formatados; lista corrigida acima.
- Classificação elevada de "PROVÁVELMENTE" para **CONFIRMADO** onde a comparação de baseline foi executada (SonarQube, Semgrep, application gate) — runs e fingerprints citados em §1.5.

### 6.2 PRES-005 — mapa de risco revalidado (read-only)

- `integracao/consolidacao-20261121`: **permanece SEM-REMOTO**, worktree `C:/Github/Birthub-360-worktrees/integracao-consolidacao-20261121`, HEAD **`d2059c594`** — inalterado desde o inventário; segue ativa (Genesis). Risco 🔴 mantido.
- `chore/handoff-devin-consolidacao-global-20261120`: worktree HEAD `86288f30b`.
- Checkout principal `C:/Github/Birthub-360`: branch `chore/handoff-00-despacho-wave-a-b-20261120` AHEAD-2, working tree sujo (modificações + handoffs não rastreados) — inalterado.
- PR #537 HEAD: `7ea57a37` → `f0cf2323` (errata) → este adendo. Demais PRs conferidos: #534 `5d6a61c1`, #535 `4d01e6b0`, #536 `f80aca2b` — todos OPEN, SHAs conforme dossiê.
- Nenhuma branch/worktree/stash tocada. Nenhum push de backup executado (aguarda decisão C).

### 6.3 Pacote de decisão ao Orquestrador Humano (3 decisões separadas)

| # | Decisão | Evidência | Bloqueio atual |
|---|---|---|---|
| A | Designar revisor independente (humano ou instância separada) para ratificar #534–#537 | §2, §4 — executor=auditor no mesmo runtime não configura independência | Sem revisor, ratificação permanece BLOQUEADA |
| B | Exceções gate-a-gate para os 4 gates herdados | §1.5 — fingerprints idênticos em main/#528; diffs 100% docs | Exige ratificação (A) + autorização explícita; nada implementado |
| C | Preservação não-destrutiva de commits locais (Genesis `d2059c594`, `agente/03-telas-brand-system` AHEAD-107) | §3 | Requer rechecagem de atividade Genesis + scan de segredos/arquivos grandes antes de propor backup |

**Dossie encerrado em modo documental. Aguardando Orquestrador Humano.**

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

- A) Dossiê por gate: ✅ (§1 + errata §1.5 + adendo §6 — SonarQube FAILURE confirmado, fingerprints corrigidos)
- B) Pacote ratificação: ✅ preparado (§2/§4) — ratificação real BLOQUEADA
- C) PRES-005: ✅ (§3)
- D) Tabela homologação: ✅ (§2)
- E) Desfecho no canal: registrado em `Chatgpt Responder.txt`

---

## 7. MISSÃO MESTRE — FOTOGRAFIA FORENSE E PACOTE FINAL (2026-11-22 ~20:00 UTC)

### 7.1 Fotografia forense revalidada

| Item | Estado verificado |
|---|---|
| `origin/main` | `0d790443d10fed5c9da20394b29e43188a07b467` — **inalterado** |
| #534 | OPEN, HEAD `5d6a61c19ede9a1746faec1ceee415f18c90f814`, MERGEABLE |
| #535 | OPEN, HEAD `4d01e6b077405812efcf418c4f14e375424d4568`, MERGEABLE |
| #536 | OPEN, HEAD `f80aca2be2b3be3b3b4e2d91f805b4c2f50eb688`, MERGEABLE |
| #537 | OPEN, HEAD `a37f8e97b` (este commit adicionará novo HEAD) |
| #531/#532/#533 | OPEN, SHAs idênticos aos substitutos, MERGEABLE — mantidos até autorização de fechamento |

Nenhuma divergência de SHA detectada. Sem alterações concorrentes nos arquivos dos PRs.

### 7.2 Dossiê de CI — estado consolidado

Classificação final dos gates vermelhos nos 4 PRs (todos com diffs 100% documentais):

| Gate | Fingerprint | Em main? | Classe |
|---|---|---|---|
| build | agregador `APPLICATION_GATE_RESULT=failure` | sim (cascata) | CONFIRMADO herdado |
| application gate | `biome format` — 6 arquivos não formatados | run 44856026585, mesmos 6 arquivos | CONFIRMADO herdado |
| Semgrep | 2 findings: `reencrypt-credentials.ts:565` (bypass-tls-verification), `bitrix.routes.ts:837` (xss.direct-response-write) | run 44856026622, idênticos | CONFIRMADO herdado |
| SonarQube | "Run Tests with Coverage" — 5 arquivos/32 testes falhos (errorHandler.test.ts etc.) | run 44856026577, fingerprint bit-a-bit idêntico | CONFIRMADO herdado |
| validate-agent-rules | — | — | RESOLVIDO por conformidade de branch |

### 7.3 Pacote para auditoria independente (Missão B)

Despacho preparado para instância separada designada pelo Orquestrador. Escopo read-only:
- Diffs completos: `gh pr diff 534|535|536|537`
- SHAs exatos (§7.1), ownership (§15 AGENTS.md), checks (§7.2)
- Parecer Silas em #536 = evidência técnica, **não** ratificação
- Veredito esperado: APROVADO / APROVADO COM RESSALVAS / REPROVADO / BLOQUEADO POR FALTA DE EVIDÊNCIA
- **Status: aguardando designação humana do revisor**

### 7.4 PRES-005 — matriz de risco prioritária

| Worktree/Branch | HEAD | Upstream | Estado | Criticidade | Estratégia proposta |
|---|---|---|---|---|---|
| `integracao/consolidacao-20261121` | `d2059c594` (revalidar — Genesis ativa) | SEM-REMOTO | commits locais não publicados | 🔴 ALTA — sessão ativa | backup/push de preservação após autorização |
| `agente/03-telas-brand-system` | — | AHEAD-107 | commits não alcançáveis em remoto | 🟠 MÉDIA | verificar equivalência em PRs antes de backup |
| `update_agents_documentation` | — | AHEAD-40 | idem | 🟠 MÉDIA | idem |
| checkout principal | `0d790443d` | sujo (28 entradas) | alterações não commitadas | 🟠 MÉDIA | inventário + commit de preservação ou stash documentado |
| `handoff-devin-consolidacao` | `86288f30b` | sujo (7) | idem | 🟠 MÉDIA | idem |
| stash `stash@{0}` | WIP onda-2 `6b84a7f96` | — | 1 stash | 🟡 BAIXA | registrar referência; não aplicar |

**Nenhuma operação executada** — sem push, reset, clean, prune, rebase ou stash pop.

### 7.5 Triagem de credenciais — encaminhamento Agente 98 (Safira)

Solicitação documental registrada: o handoff `11-para-15-env-identidade-visual.md` (preservado em #535) lista nomes de chaves e comprimentos de um `.env` externo populado (DATABASE_URL, BETTER_AUTH_SECRET, CREDENTIALS_ENCRYPTION_KEY, PII_BLIND_INDEX_KEY, STORAGE_ACCESS_KEY_ID). **Sem valores expostos.** Safira deve: classificar criticidade, identificar serviços afetados, propor plano de mitigação/rotação. Nenhuma rotação unilateral executada.

### 7.6 Decisões pendentes do Orquestrador

- **A)** Designar revisor independente para #534/#535/#536/#537 → pacote pronto em §7.3
- **B)** Exceções gate a gate — evidência comparativa completa em §7.2; exige A + autorização explícita
- **C)** Preservação remota dos commits locais críticos — requer autorização operacional específica
- **D)** Encerramento como SUPERSEDED de #531/#532/#533 — somente após homologação dos substitutos

**Ordem de integração candidata:** #536 → #534 → #535, com #537 avaliado por utilidade documental (pode ser mergeado junto ou mantido como evidência).
