# 11 — Execução Real do Schemathesis no GitHub Actions (Fase 5)

> Data: 2026-11-22 · Executor: Devin (Agente 00/Astra — sessão Genesis)
> Autorização: deliberação do Orquestrador "GO CONTROLADO" (push + workflow_dispatch).

## 1. Publicação da branch

- Branch: `integracao/consolidacao-20261121`
- HEAD publicado: `d65d0cd22c6a879d6074117f28449f898df270da` (== HEAD local, worktree limpa)
- Referência remota: `refs/heads/integracao/consolidacao-20261121` — **nova branch, sem sobrescrita**
- Verificações pré-push: bundle PRES-005 `okay` (tip = HEAD), scan de segredos no diff = 0 credenciais reais, nenhum arquivo >500KB, diff vs main restrito a `.agents/**` + `api-schema-fuzz.yml` + `.gitignore` + 1 teste unitário. `src/` e `prisma/` com diff vazio.
- Tags/checkpoints preservados localmente (`audit/genesis-fase3-submissao`, `audit/genesis-fase4-submissao`, `audit/genesis-fase4-final`, `checkpoint/*`).

## 2. Execução do workflow

- Workflow: `.github/workflows/api-schema-fuzz.yml` @ `d65d0cd22`
- Trigger: `workflow_dispatch` na branch publicada
- Inputs: `max_examples=15`, `max_time=900` (escala smoke)
- Run: https://github.com/MaarkssDN/Birthub-360/actions/runs/45083747478
- Resultado do job: **FAILURE** — por findings reais do fuzzing, não por defeito de infraestrutura.

### Steps (resultado real)

| Step | Resultado |
|---|---|
| Containers (Postgres/Redis/Meilisearch) | success |
| npm ci / Prisma generate / migrations | success |
| App de teste (tsx server.ts) | success |
| Sanity anti-SPA (`/api` responde JSON) | success |
| Provisionamento de sessão Better Auth | success |
| Instalação schemathesis==4.33.4 (venv) | success — versão existe no PyPI |
| Schemathesis run | **failure — exit=1, 900.01s** |
| Verificação de cobertura (`operations.tested>0`) | **success** |
| Controle negativo (sem `/api`) | skipped — `if: pull_request` (esperado em dispatch) |
| Upload relatório (JUnit+JSON) | success — artifact `schemathesis-report-45083747478` |

## 3. Resultado do fuzzing (evidência do relatório JSON)

- `operations.tested`: **571/571** · `test_cases.generated`: **58.025** · `unique_failures`: **571**
- `exit_code`: 1 · `complete`: true · `running_time`: 900.0s
- Distribuição das falhas: UndefinedStatusCode 531 · ServerError 12 · UnsupportedMethodResponse 12 · IgnoredAuth/Auth 2 · JsonSchema 3 · RejectedPositiveData 5 · AcceptedNegativeData 6
- Warnings: 549 operações retornaram apenas 401/403 (usuário de teste sem organização/permissões — esperado); 4 rate-limited (limiters hardcoded `lead-capture`/`data-subject-requests` — limitação conhecida); 5 operações com 404 por falta de dados semeados.

## 4. Interpretação honesta

- **O gate funcionou como projetado**: detectou deriva real entre `docs/openapi.yaml` e o comportamento da API (predominância de ST103 "status code não documentado" — a API responde códigos não declarados no spec, ex.: 429/404/500 em endpoints cujo spec não os lista).
- **NÃO é evidência de workflow quebrado**: auth, CSRF (Origin/Referer), rate-limit isolation, cobertura efetiva e relatórios funcionaram de ponta a ponta.
- **NÃO declarar fuzzing E2E aprovado**: a execução real produziu 571 findings que exigem triagem dos owners (Agentes 21/22 — contratos/OpenAPI e rotas). Candidato natural a handoff formal.
- **Controle negativo não exercitado E2E**: step é `pull_request`-only; será validado no primeiro PR que tocar os paths do trigger, ou via dispatch forçado se o Orquestrador autorizar ajuste do `if:`.
- Achado do auditor independente (ver §5): o step de cobertura tem `if: always()` e passou — `operations.tested>0` confirmado mecanicamente no CI.

## 5. Auditoria independente do delta final

- Reauditoria por subagente em instância separada (read-only): **APROVADO COM RESSALVAS** — 0 BLOCKER/MAJOR, 5 MINOR.
- Confirmado: `NEG_EXIT=$?` capturado antes de restaurar `set -e`; `exit 1` somente se `NEG_EXIT==0`; sem `|| true` no step; cookie só em `GITHUB_ENV`; overrides de rate limit restritos a `NODE_ENV=test`; actions pinadas por SHA; `permissions: contents: read`; zero `${{ secrets.* }}`.
- MINORs registrados: path `schemathesis-report/` no artifact provavelmente vazio (cosmético); credenciais de teste em `--data` do curl (descartáveis, risco desprezível); `pull_request.paths` não cobre `package.json`/`package-lock.json`; dump de `server.log` em falha pode conter dados de request (ambiente efêmero); flake teórico residual no controle negativo.
- **Ressalva de independência**: o subagente roda no mesmo runtime Devin — evidência técnica preliminar, NÃO homologação organizacional. Ratificação por revisor humano/instância separada permanece **PENDENTE** (registrado conforme §3 da deliberação).

## 6. Pendências registradas

- Parecer formal Agente 08A sobre `.github/workflows/api-schema-fuzz.yml`: **PENDENTE** (handoff `08-para-08A` permanece aberto; este run fornece a "execução real" que o handoff exigia como teste esperado).
- Validação de ownership Agente 00: registrada (escopo do diff conforme; `.github/workflows/**` é território 08A/00 — aprovação formal ainda necessária antes de merge).
- Draft PR: documentação preparada; **abertura NÃO executada** — smoke falhou (findings reais) e aprovação 08A pendente → retorna à deliberação conforme §4.
