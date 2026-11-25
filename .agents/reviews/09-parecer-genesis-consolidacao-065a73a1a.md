# Parecer de Revisão Independente — Agente 09 (Silas)

**Objeto:** branch `integracao/consolidacao-20261121` — Operação Genesis (Ondas I–III)
**SHA auditado:** `065a73a1ad7d4827f1909beaad9d115c0aba7ce3`
**SHA pós-correção de higiene:** `00e7f8e7d` (remoção de resíduo `.schemathesis/` — ver §6)
**Baseline:** `main@0d790443d10fed5c9da20394b29e43188a07b467`
**Data:** 2026-11-21
**Método:** auditoria independente por subagente em modo leitura + verificação mecânica do agente executor. Relatórios `.agents/runs/genesis-consolidacao-20261121/` tratados como alegações, não como evidência.

---

## Veredito: ⛔ REPROVADO — CORREÇÕES OBRIGATÓRIAS (porção de código/CI)

A consolidação **documental** (`.agents/**`) e o teste unitário são integráveis. O workflow `.github/workflows/schemathesis-fuzzing.yml` **não deve ser promovido no estado atual**: falhará no primeiro PR disparador por infraestrutura (403 do `csrfGuard` sem `Origin`; 429 dos rate limiters) e, mesmo passando, exercitaria apenas GETs — gate verde sem cobertura de mutações.

---

## 1. Integridade Git — ✅ aprovado

- Reflog confirma 16 entradas coerentes com o escopo declarado.
- `git diff 0d790443..HEAD -- src/ prisma/` = **vazio** (verificado mecanicamente pós-auditoria).
- Diff total vs main: somente `.agents/**`, `.github/workflows/schemathesis-fuzzing.yml`, `tests/unit/lib/voice-hub/voicehub-persistence-runid.test.ts`, `.gitignore`.
- Controles B-01..B-14 do PR #485 presentes e intocados.
- **Achado do próprio auditor corrigido:** resíduo `.schemathesis/` (cache de crashes da sonda local do executor, ~510 arquivos) havia sido varrido para o commit `065a73a1a` por `git add -A`. Removido em `00e7f8e7d` + `.gitignore`. Registrado como erro do executor, não do conteúdo auditado.

## 2. Segurança — ⚠️ 1 achado MAJOR

- Credenciais do workflow são efêmeras de CI descartável; `permissions: contents: read`; actions pinadas por SHA; `pip install schemathesis==4.32.7` pinado. ✅
- **MAJOR — cookie de sessão impresso em log:** step "Provisionar sessao" executa `echo "$SIGNUP" | head -20` sobre a resposta `curl -i`, que inclui `Set-Cookie: better-auth.session_token=...` — contradiz o próprio comentário "Não logar o valor do cookie". Credencial efêmera de banco descartável → impacto real baixo, mas o controle declarado é violado. Correção: remover o echo ou filtrar `set-cookie`.

## 3. Schemathesis — análise estática

**Verificado correto:** `--url .../api` é base completa (sem risco de `/api/api`); sign-up resolve para `/api/auth/sign-up/email` (better-auth montado em `/api/auth`); `ALLOW_DEV_AUTH_BYPASS` → sessão imediata + Organization automática; flags do CLI 4.32.7 conferem; `dist/server.cjs` é o output do build; `bootstrap-app-role.sh` existe.

**Defeitos:**

1. **BLOCKER — `csrfGuard` bloqueia mutações.** `src/bootstrap/security.ts` monta `csrfGuard` global; métodos não-GET com cookie e sem `Origin`/`Referer` → 403. O step de fuzzing envia só `Cookie`, nenhum `Origin`. Todo POST/PUT/PATCH/DELETE → 403 antes do controller. Agravante: 403 é indocumentado em `/auth/sign-up|sign-in` → `status_code_conformance` reprova; nos demais endpoints 403 costuma ser documentado → gate verde sem exercitar mutações. O workflow irmão `api-schema-fuzz.yml` já envia `Origin` — o novo regrediu. **Correção:** `-H "Origin: http://127.0.0.1:3000"` (e `Referer`) no `schemathesis run` e no controle negativo.
2. **BLOCKER — rate limiters não sobrescritos.** Defaults: `API_RATE_LIMIT_MAX=600`, `AI_RATE_LIMIT_MAX=30`, `PUBLIC_LEAD=5`, `EXPORT=30` etc. Fuzzing gera milhares de requests → 429 em massa; 429 indocumentado na maioria → `status_code_conformance` reprova. `api-schema-fuzz.yml` já resolve com `API_RATE_LIMIT_MAX=100000`/`AUTH_RATE_LIMIT_MAX=5000` — não replicado. **Correção:** replicar overrides.
3. **MAJOR — duplicação de pipeline.** Já existe `.github/workflows/api-schema-fuzz.yml` (Schemathesis 4.33.4, schedule+dispatch, não-bloqueante, captura todos os cookies, sign-in separado, `Origin`). O novo cria segunda fonte de verdade para MEL-39 com versão divergente e gate bloqueante em PR. **Decisão de governança necessária:** consolidar ou descartar um.
4. **MAJOR — aprovação de governança pendente.** `.agents/handoffs/08-para-08A-schemathesis-workflow-aprovacao.md` (status aberto) exige aprovação de 08A/00 para `.github/workflows/**` antes do merge — não registrada.
5. **MINOR — verificação de cobertura fraca.** Heurística soma `operations.total` (~500) mesmo com `tested=0` → não detecta o vazio que diz detectar. Report JSON tem estrutura previsível (`operations.tested`, `test_cases.generated`) — parsear diretamente.
6. **MINOR — sanity `/organization-modules`:** 404 também passa (falso negativo assumido); insuficiente como prova de cobertura.
7. **INFO — controle negativo funcional mas indireto:** depende de existirem mutações que falhem sem `/api`; GETs documentando 200 poderiam passar vacuamente.

## 4. Teste unitário — ⚠️ parcialmente teatro

- `it` 1: guarda textual real contra a regressão RUN_ID (frágil a reformatação, mas válido como regressão de conteúdo).
- `it` 2: define `generateRunId` localmente e testa a si mesmo — **tautologia, não testa produto**. Recomendado remover ou substituir por teste real.

## 5. Governança

- Ownership: `.github/workflows/**` → Agente 08 ✅; `.agents/**` compartilhado ✅; convenções de handoff respeitadas.
- Discrepância de numeração registrada (AGENTS.md global 08=Dora vs `.github/AGENTS.md` local "08 — QA e Release") — herança do roster antigo, não defeito desta branch.

## 6. Correções obrigatórias antes de propor PR

1. `Origin`/`Referer` nos requests do Schemathesis (run + controle negativo).
2. Overrides de rate limit no `env:` do job (replicar `api-schema-fuzz.yml` e estender).
3. Remover/filtrar echo da resposta de sign-up (não vazar Set-Cookie).
4. Resolver duplicação com `api-schema-fuzz.yml` (decisão: consolidar ou remover um).
5. Registrar aprovação do handoff `08-para-08A` ou obter deliberação humana.
6. Parsear `operations.tested`/`test_cases.generated` diretamente no step de cobertura.
7. Remover o `it` tautológico do teste unitário.
8. ~~Higiene `.schemathesis/`~~ — **já corrigido** em `00e7f8e7d`.

## 7. Itens que o auditor não pôde executar

- Execução real do workflow em GitHub Actions (serviços indisponíveis localmente) — primeira execução ocorrerá no CI; os BLOCKERs acima tornam essa execução propensa a falha.
- `npm run build`/`vitest` completo da base (executor executou gates parciais: typecheck ✅, lint:ci ✅, openapi-drift ✅, rls ✅, ownership ✅; format:check e test:architecture com falhas **preexistentes** idênticas à main).

---

**Recomendação ao Orquestrador:** corrigir os itens 1–7 (escopo restrito ao workflow + 1 teste) e submeter nova revisão do delta antes de propor PR. A parte documental pode seguir para o pacote de consolidação independentemente.
