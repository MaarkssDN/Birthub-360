# RUNBOOK — Gates de CI/CD para a branch `recuperacao/onda-consolidacao-20261124`

- **Agente:** 94 — Tess (CI/CD e Operações Git/Deploy, Squad 90)
- **Data:** 2026-11-26
- **SHA alvo:** `a2574dddc1f17c642cf61b150bf32e7423cb5f3f` (HEAD da branch, 8 commits sobre `9a3c2182b2`)
- **Branch remota:** `origin/recuperacao/onda-consolidacao-20261124` **já existe** em `a2574dddc1` (verificado via `gh api` — o contexto "NÃO publicada" está desatualizado; nenhum push adicional é necessário)
- **PR existente:** nenhum (`gh pr list --head` retornou `[]`)
- **Auditoria:** Silas (Agente 09) APROVADO — `.agents/reviews/2026-11-26-silas-auditoria-recuperacao-onda-consolidacao.md` (arquivo **local/não commitado**; o gate `verify:governance-reviews` passa mesmo assim pois há outros pareceres em `.agents/reviews/`)
- **Escopo do diff:** apenas `.agents/`, `docs/`, `src/`, `tests/` — **não toca** `prisma/`, `public/`, `package*.json`, `postman/`, `docs/openapi.yaml`
- **main remota atual:** `9dbb4445c96c4f2a338180ac75942f8e2f0c5e58` — **moveu desde o contexto da missão** (`14656580bf` → `9dbb4445c9`). Antes do PR, confirmar que os arquivos alterados pela branch continuam idênticos entre base e a nova main (diff `9a3c2182b2..a2574dd` vs `origin/main`).

---

## 1. Inventário de workflows

### Workflows que cobrem os gates pendentes

| Workflow | Trigger | Jobs / Cobertura |
|---|---|---|
| `ci.yml` — "Central Birth Hub 360 Release" | push `main/master/develop`; PR `main/master`; `workflow_dispatch` (sem inputs) | `secret-scan` (Gitleaks); `dependency-review` (**só PR**, fail-on-severity high); `trivy-scan` (fs HIGH/CRITICAL, bloqueante); `build-and-test` = **application gate**: `security:audit-waivers` (npm audit), `lint:ci` (biome), `format:check`, `typecheck` (tsc), `verify:governance-reviews`, `test:architecture`, `verify:openapi-drift`, `verify:rls-coverage`, `test:unit --coverage`, `test:integration --coverage` (com Postgres+Redis+Meili services), `verify:integrations`, `verify:ai`, `build`, smoke test, **`test:e2e` Playwright completo** (services Postgres/Redis/Meili); agregador `build` (**pulado em workflow_dispatch**: `if: event != 'workflow_dispatch'`); `visual-baselines` (só dispatch, gera baselines Linux) |
| `visual-regression.yml` | PR `main/master`; `workflow_dispatch` | `changes` (detector de escopo — em dispatch trata como relevante); `Visual Regression` (suíte pixel-a-pixel, 88 snapshots); `Visual Regression Gate` (**check required** que consolida o veredito) |
| `sonarqube.yml` | push `main`; PR (opened/synchronize/reopened); `workflow_dispatch` | `SonarQube`: `test:unit --coverage` + `test:integration --coverage` + scan SonarCloud + quality gate report. Requer `secrets.SONAR_TOKEN` e `vars.SONAR_ORGANIZATION`/`SONAR_PROJECT_KEY` |
| `security-semgrep.yml` | PR `main/master`; push `main/master`; `workflow_dispatch` | `Semgrep SAST` (p/typescript, p/nodejs, p/secrets, `--error` bloqueante) |
| `security-trivy.yml` | PR `main/master`; schedule seg 06:00 UTC; `workflow_dispatch` | `trivy-fs-pr-gate` (**só PR**, bloqueante, SARIF); `trivy-fs-scan` (schedule/dispatch, docker compose, não bloqueante) |
| `security-sbom.yml` | PR `main/master`; schedule qui 06:00 UTC; `workflow_dispatch` | `sbom` (CycloneDX artefato); `rls-coverage-gate` (`verify:rls-coverage`, bloqueante em PR) |
| `codeql.yml` | PR `main/master`; push `main/master`; schedule qua; `workflow_dispatch` | `CodeQL` matrix (js/ts + python) + gate `security:codeql-sarif` |
| `dependency-review.yml` | **somente PR** `main/master` (sem dispatch, sem push) | `Dependency Review` (diff de dependências, fail-on-severity high) |
| `endpoint-latency-budget.yml` | PR `main` **com filtro de paths**; schedule diário; `workflow_dispatch` | k6 latency SLO (`/health/*` + CRM autenticado). **Dispara neste PR**: diff toca `src/features/crm/**` |
| `frontend-bundle-budget.yml` | push `main` e PR `main` com filtro `src/**` etc.; `workflow_dispatch` | budget de bundle Vite. **Dispara neste PR** (`src/**`) |
| `public-assets-budget.yml` | push/PR `main` com filtro `public/**`; `workflow_dispatch` | budget de `public/`. **NÃO dispara** (diff não toca `public/`) |
| `migration-safety.yml` | PR com filtro `prisma/**`; `workflow_dispatch` | gate de migrations não-destrutivas. **NÃO dispara** (sem migrations) |
| `postman-sync.yml` | push `main` com filtro `postman/**`; `workflow_dispatch` | sync Postman workspace. **NÃO dispara** |
| `playwright-ci.yml` | **somente `workflow_dispatch`** | E2E Playwright diagnóstico — **redundante**: `ci.yml` já roda `test:e2e` completo |
| `qualidade-ci.yml` | **somente `workflow_dispatch`** | Só `lint:ci` — diagnóstico; redundante com `ci.yml` |
| `enforce-governance.yml` | PR (opened/synchronize/reopened) | **Valida nome da branch**: exige `agente/NN-slug` ou `integracao/onda-N`. **`recuperacao/onda-consolidacao-20261124` FALHA este check** (não está na lista de required checks da main, mas fica vermelho) |
| `onda-2.5-validation.yml` | PR para `validation/onda-2.5-base` | Gate da onda 2.5 — **não aplicável** |
| `visual-baseline-update.yml` | `workflow_dispatch` (input `dry_run`) | Contingência: regenerar baselines visuais Linux se o Visual Regression falhar por rasterização de plataforma |
| `cd-homolog.yml`, `docker-publish.yml` | push `main` + `workflow_dispatch` (input `sha` obrigatório) | **Pós-merge** — promover SHA aprovado para homologação/publicação. Não fazem parte dos gates de PR |
| `branch-hygiene.yml`, `android-build.yml`, `ios-build.yml`, `api-schema-fuzz.yml`, `schemathesis-fuzzing.yml`, `production.yaml` | schedule/dispatch ou contextos específicos | Fora do escopo dos gates de merge |

### Branch protection de `main` (verificado via API)

Required status checks:
1. `Visual Regression Gate`
2. `Central Birth Hub 360 / application gate`

O agregador `build` do `ci.yml` consolida secret-scan + dependency-review (PR) + trivy-scan + application gate, mas **não consta** na lista de required checks retornada pela API (a lista pode estar paginada/incompleta — tratar `build` como desejável de qualquer forma).

---

## 2. Rota recomendada

### ✅ ROTA B — PR contra `main` (recomendada)

**É a única rota que cobre TODOS os gates pendentes em um único disparo**, incluindo os que não têm `workflow_dispatch` (`dependency-review.yml`) e os checks required da branch protection.

#### Pré-requisitos (bloqueios que dependem de autorização humana)

1. **Nome da branch viola `enforce-governance.yml`.** O workflow rejeita qualquer head_ref fora de `agente/NN-slug` ou `integracao/onda-N`. Opções (decisão humana/coordenador):
   - (a) Renomear/publicar a branch como `integracao/onda-N` (ex.: nova branch a partir do mesmo SHA — **exige push de nova ref**, fora da minha alçada); ou
   - (b) Abrir o PR mesmo assim e aceitar o check `Governance Enforcement / validate-agent-rules` vermelho — **não é required check**, não bloqueia o merge, mas fica como dívida visível.
   - Recomendação: opção (a) se o Coordenador (Astra) definir o número da onda; caso contrário (b) com justificativa registrada.
2. **Confirmar diff vs main atual** (`9dbb4445c9`, que avançou desde a auditoria):
   ```bash
   git fetch origin main
   git diff --name-only origin/main...a2574dddc1f17c642cf61b150bf32e7423cb5f3f
   ```
   Esperado: apenas os 61 arquivos já auditados. Se a main nova tocar os mesmos arquivos, reavaliar com Silas antes do merge.
3. Token `gh` já autenticado (conta `MaarkssDN`, scopes `repo` + `workflow`) — suficiente.

#### Comandos exatos (executar SOMENTE após autorização)

```bash
# 1. (Opcional, recomendado pela opção a) criar ref conforme padrão — SOMENTE se autorizado:
# git push origin a2574dddc1f17c642cf61b150bf32e7423cb5f3f:refs/heads/integracao/onda-XX

# 2. Abrir o PR (base DEVE ser main — ci.yml só dispara PR para main/master):
gh pr create --repo MaarkssDN/Birthub-360 \
  --base main \
  --head recuperacao/onda-consolidacao-20261124 \
  --title "refactor: recuperação onda consolidação 20261124 (agentes 02/30/40/43/50/60/70)" \
  --body "Recupera refatorações de hotspots revertidas. 8 commits sobre 9a3c2182b2, HEAD a2574dddc1.
Auditoria independente: .agents/reviews/2026-11-26-silas-auditoria-recuperacao-onda-consolidacao.md (APROVADO — arquivo local, commit pendente de decisão)."

# 3. Acompanhar checks:
gh pr checks <PR_NUMBER> --repo MaarkssDN/Birthub-360 --watch

# 4. Se o Visual Regression Gate falhar por rasterização de plataforma (não por regressão real):
gh workflow run visual-baseline-update.yml --repo MaarkssDN/Birthub-360 --ref <branch> -f dry_run=true
# Revisão humana dos artefatos; baseline só com dry_run=false + PR separado + parecer Silas.
```

#### Workflows disparados pelo PR (todos em `main`)

`ci.yml` (gate completo ~2h: lint→typecheck→unit→integration→build→E2E) · `visual-regression.yml` (escopo relevante: `src/` alterado → suíte completa) · `sonarqube.yml` · `security-semgrep.yml` · `security-trivy.yml` (job de PR) · `security-sbom.yml` · `codeql.yml` · `dependency-review.yml` · `endpoint-latency-budget.yml` (paths `src/features/crm/**` batem) · `frontend-bundle-budget.yml` (`src/**`) · `enforce-governance.yml` (falha no nome da branch — ver pré-requisito 1). Não disparam: `migration-safety`, `public-assets-budget`, `postman-sync`, `onda-2.5-validation`, `playwright-ci`, `qualidade-ci`.

#### Critérios de aceite (gates verdes)

- [ ] `Central Birth Hub 360 / application gate` = success (cobre lint:ci, format:check, typecheck, test:architecture, verify:openapi-drift, verify:rls-coverage, test:unit, test:integration, build, smoke, test:e2e)
- [ ] `Visual Regression Gate` = success
- [ ] `build` (agregador ci.yml) = success
- [ ] `Dependency Review`, `Semgrep SAST`, `Trivy — gate de PR`, `SBOM — CycloneDX`, `rls-coverage-gate`, `CodeQL` + `security:codeql-sarif`, `SonarQube` (quality gate) = success
- [ ] `Frontend bundle budget`, `Critical endpoint latency (k6)` = success
- [ ] `Governance Enforcement` = success **ou** falha documentada/aceita (pré-requisito 1b)

### ROTA A — `workflow_dispatch` (validação parcial, sem PR)

Só valida; **não satisfaz required checks** (checks de dispatch não são exigidos pela branch protection e o job `build` do ci.yml é explicitamente pulado em dispatch). Útil como pré-voo ou se o PR for adiado.

```bash
gh workflow run ci.yml --repo MaarkssDN/Birthub-360 --ref recuperacao/onda-consolidacao-20261124
gh workflow run visual-regression.yml --repo MaarkssDN/Birthub-360 --ref recuperacao/onda-consolidacao-20261124
gh workflow run sonarqube.yml --repo MaarkssDN/Birthub-360 --ref recuperacao/onda-consolidacao-20261124
gh workflow run security-semgrep.yml --repo MaarkssDN/Birthub-360 --ref recuperacao/onda-consolidacao-20261124
gh workflow run security-sbom.yml --repo MaarkssDN/Birthub-360 --ref recuperacao/onda-consolidacao-20261124
gh workflow run codeql.yml --repo MaarkssDN/Birthub-360 --ref recuperacao/onda-consolidacao-20261124
gh workflow run endpoint-latency-budget.yml --repo MaarkssDN/Birthub-360 --ref recuperacao/onda-consolidacao-20261124
gh workflow run frontend-bundle-budget.yml --repo MaarkssDN/Birthub-360 --ref recuperacao/onda-consolidacao-20261124
```

**Limitações da Rota A:** `dependency-review.yml` e `enforce-governance.yml` não têm dispatch (só PR); `security-trivy.yml` em dispatch roda apenas o scan semanal não-bloqueante (o gate de PR é `if: pull_request`); `ci.yml` pula o agregador `build`. Ou seja: **não é possível cobrir 100% dos gates sem PR**.

---

## 3. Inputs de workflow_dispatch úteis

- `ci.yml`: **nenhum input** — roda a suíte completa no ref escolhido via `--ref`.
- `visual-regression.yml`: sem inputs; dispatch ⇒ escopo sempre "relevante" (roda suíte inteira).
- `sonarqube.yml`: sem inputs.
- `cd-homolog.yml` / `docker-publish.yml`: input `sha` obrigatório — **pós-merge**, promover o SHA aprovado; não usar antes do merge.
- `visual-baseline-update.yml`: input `dry_run` (default `true`) — contingência de baselines.
- `branch-hygiene.yml`: input `dry_run` — higiene de branches, não relacionado.
- `api-schema-fuzz.yml` / `schemathesis-fuzzing.yml`: inputs de fuzzing — fora dos gates de merge.

---

## 4. Riscos e o que NÃO fazer

**NÃO fazer:**
- Não dar push/merge/PR/dispatch sem autorização humana explícita (este runbook é só preparação).
- Não disparar `cd-homolog.yml`/`docker-publish.yml`/`production.yaml` — são pós-merge e publicam artefatos.
- Não commitar o parecer do Silas em `.agents/reviews/` por conta própria sem decisão (arquivo hoje é local; commitá-lo é alteração de escopo — decisão do Coordenador).
- Não usar `visual-baseline-update.yml -f dry_run=false` para "forçar verde" — baselines exigem revisão visual humana + PR + parecer do Agente 09.
- Não abrir PR com base `develop` — `ci.yml` só escuta PR para `main/master`; base errada = zero gates.
- Não tentar rodar lint/build localmente como substituto — `biome.exe` está bloqueado por WDAC e a suíte unitária local é instável (workers Vitest >60s); o CI é o ambiente autoritativo.

**Riscos:**
- **Nome da branch** quebra `enforce-governance.yml` (não-required, mas check vermelho).
- **main avançou** (`14656580bf` → `9dbb4445c9`): revalidar diff antes do PR; se houver sobreposição com os 61 arquivos, reabrir revisão com Silas.
- **SonarQube quality gate** pode reprovar por issues novas no código refatorado — não há garantia prévia; tratar como gate real.
- **Visual Regression** pode falhar por diferença de rasterização Linux (baselines `-linux` são autoritativas; baselines Windows locais não valem) — contingência documentada acima.
- **Custo de runner**: PR dispara ~11 workflows, incluindo suíte E2E completa (~2h no `application gate`). Não combinar Rota A + Rota B para o mesmo SHA sem necessidade.
- **Merge não é automático**: mesmo com checks verdes, merge exige decisão humana (protocolo de merge do AGENTS.md §21) e o parecer do Silas deve acompanhar a entrega.

---

## 5. Resumo executivo

- **Rota recomendada:** Rota B — `gh pr create --base main --head recuperacao/onda-consolidacao-20261124` (após resolver/aceitar o nome da branch e revalidar diff vs main `9dbb4445c9`).
- **Bloqueios dependentes de autorização humana:** (1) push de branch renomeada se optar pelo padrão `integracao/onda-N`; (2) criação do PR; (3) decisão sobre merge pós-gates; (4) eventual commit do parecer do Silas.
- **Nada foi executado**: nenhum push, PR, dispatch ou alteração de código/workflow foi realizado por este agente.
