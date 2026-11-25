# DESPACHO 06 — AUDITORIA DE SEGURANÇA DO HISTÓRICO GIT (publicação local → nuvem)

**Agente:** 99 — Vito (AppSec, SAST e Secret Scanning) · Squad 90
**Sessão:** `devin-subagent-despacho06-20261124`
**Início:** 2026-11-24 ~20:20 UTC · **Fim:** 2026-11-24 ~21:10 UTC
**Escopo:** somente leitura. Nenhum push, fetch destrutivo, rewrite ou remoção executado por este agente. (Um `git fetch origin --prune` foi executado no clone D: para obter o estado real do remote — operação de leitura.)
**Ferramenta:** `gitleaks` **indisponível** no host → varredura manual via `git show`/`diff-tree -p`, `rg`-style grep de padrões de segredo, auditoria de paths e `cat-file --batch-check` para blobs. Nenhum valor secreto foi reproduzido neste relatório.

---

## 0. FATO CRÍTICO DE CONTEXTO — o remote é um alvo móvel

Durante esta auditoria (~50 min), o **Despacho 08 publicou ativamente** o trabalho pendente:

- `origin` passou de 657 refs conhecidas (snapshot da auditoria P0) para **740–776 refs**.
- `origin/main` recebeu pushes (`reflog`: "update by push").
- `origin/integracao/consolidacao-dem20261123-candidato` = `2f4617cd0` — **mesmo SHA do clone C:**.
- Todas as branches `agente/*-pos4`, `integracao/pos4-dem20261124`, `integracao/onda-*`, `coord/squad-*` etc. foram publicadas.
- Duas refs de consolidação **novas e ainda não publicadas** surgiram no fim da janela: `integration/saneamento-20261124` (C:) e `main` local (D:).

**Consequência:** o delta auditado aqui é o que **efetivamente foi/seria enviado** — 239 commits únicos (reconstruídos como `rev-list` das tips atuais de `origin/*` menos as tips de `origin/*` do snapshot `remoterefs__*.txt` da auditoria P0). A varredura cobre também os commits POS4 que ainda estavam pendentes no início da sessão e as duas refs novas.

## 1. Método

1. Inventário de refs: `for-each-ref refs/heads` × `refs/remotes/origin` nos dois clones; contagem `git rev-list --count <ref> --not --remotes=origin` por branch.
2. Delta publicado: `git rev-list --stdin` = tips atuais de `origin/*` (clone D:, fetch mais recente) `^` tips antigas (união `remoterefs__c/d`) → **239 commits**.
3. Conteúdo: `git show -p` dos 239 commits + diffs líquidos das 2 refs novas → ~385 mil linhas varridas.
4. Paths: `diff-tree --name-status` agregado (498 entradas) + varredura de nomes sensíveis.
5. Blobs: todos os blobs novos dos deltas via `cat-file --batch-check` (todos presentes localmente).
6. Tags: `git ls-remote --tags origin` × tags locais.

## 2. Vereditos por referência

| Referência | Clone | SHA atual | Commits não publicados | Veredito | Evidência |
|---|---|---|---|---|---|
| `integracao/consolidacao-dem20261123-candidato` | C: | `2f4617cd0194` | 0 — já em `origin` @ `2f4617cd0` (+8 vs `origin/main`) | **PUBLICÁVEL** (já publicada) | diff do delta varrido; +8 commits são docs/lint |
| `integracao/pos4-dem20261124` | D: | `727d303bd81c` | 0 — já em `origin` | **PUBLICÁVEL** (já publicada) | merges POS4 limpos |
| `agente/06-idor-whatsapp-pos4` | D: | `687ed8d7f066` | 0 — já em `origin` | **PUBLICÁVEL** | 3 commits varridos individualmente |
| `agente/69-optout-pos4` | D: | `506f8cdcd7db` | 0 — já em `origin` | **PUBLICÁVEL** | 1 commit varrido |
| `integration/saneamento-20261124` | C: | `d0b429614921` | **32 merges** (118 commits vs `origin/main`) | **PUBLICÁVEL** ⚠️ ver R-1 | diff líquido varrido: 0 segredos |
| `main` (local) | D: | `86b471fcf63a` | **4 merges** | **PUBLICÁVEL** ⚠️ ver R-3 | diff líquido varrido: 0 segredos |
| branches `preservacao/*` / `preserve/*` | ambos | — | — | **NÃO EXISTEM** | propostas no Relatório 5, nunca criadas |
| demais ~270 branches locais | C:+D: | — | 0 | **PUBLICÁVEL / N/A** | todas com counterpart `origin/*`; 0 commits fora de `origin/*` |
| tags locais (152 × `archive/*`) | ambos | — | 0 local-only | **NÃO APLICÁVEL** | remoto já contém todas as tags locais |

## 3. Achados de segurança

### 3.1 Segredos — NENHUM encontrado ✅

Varredura de conteúdo (chaves privadas, tokens GitHub/Slack/Stripe/OpenAI/Google, JWT, URIs com credencial, atribuições `SECRET|TOKEN|PASSWORD|API_KEY`, chaves SSH, CPF/CNPJ) sobre **239 commits do delta publicado + 15 commits POS4 tardios + diffs líquidos das 2 refs novas**:

- **0 segredos reais.** Únicos hits = fixtures de teste benignos: `E2E_PASSWORD='E2eTestPassword123!'` (constante E2E), senhas em testes de `verifyPasswordHash`, telefones fictícios (`1199999xxxx`, `+551199999xxxx`), webhook Bitrix com placeholder `.../token/` em teste.
- **0 ocorrências** de CPF/CNPJ em diffs.
- Nenhum `.env`, dump `.sql` de dados, `node_modules`, build, sessão WhatsApp (`creds.json`/`auth_info`), keystore ou `service-account` em paths ou conteúdo.

### 3.2 Arquivos grandes — NENHUM indevido ✅

- 488 blobs novos no delta principal + 210 nos commits tardios: **máximo ~1,43 MB**, todos abaixo do limite de 5 MB.
- Os maiores blobs são `manifests/*.manifest` de worktrees dentro de `.agents/runs/auditoria-saneamento-local-20261124/manifests/` (listagens de arquivos; contêm paths locais `C:\...` — **observação de baixa severidade**: expõe topologia/username local, sem credenciais).
- `visual-regression-report/data/*.md` (46 arquivos) e inventários HTML/JSON de handoffs em `.agents/` são volumosos em linhas, mas texto benigno.

### 3.3 Mudanças sensíveis de configuração — BENIGNAS ✅

- `.trivyignore.yaml` e `allow-ghsas` em `ci.yml`/`dependency-review.yml`: **endurecimento** (37–40 waivers obsoletos removidos; `allow-ghsas` reduzido). Coerente com trabalho do próprio Agente 99.
- `prisma/migrations/20261124120000_.../migration.sql`: DDL expand-only, **0 INSERT/COPY/VALUES** — sem dump.
- `.github/workflows/schemathesis-fuzzing.yml` (novo, na branch `integration/saneamento-20261124`): usa **apenas credenciais efêmeras de CI** (`ci_app_test_pass`, `prospector_test_pass`, `ci-test-meili-key`, `ci-test-operator-token-not-for-production`, `Bearer ci-test-token`) em serviços localhost — prática aceitável; `ALLOW_DEV_AUTH_BYPASS: true` restrito ao job efêmero. **Sem `secrets.*` do repositório, sem exfiltração.**
- `postman/.../openapi.yaml`: sem URLs internas com tokens ou credenciais.

## 4. Bloqueadores

**Nenhum bloqueador de segurança para publicação.** Não há segredo, PII, dump ou arquivo grande nos commits auditados.

## 5. Recomendações à coordenação (não bloqueantes)

- **R-1 (baixa):** `integration/saneamento-20261124` e `main` (D:) foram criadas durante a auditoria e seguem **não publicadas** — se forem enviadas, o conteúdo já foi varrido e está limpo; ainda assim recomendo rodar o gate de secret scanning (GitHub/`gitleaks`) como confirmação final antes do push, pois o remote é um alvo móvel.
- **R-2 (média, pré-existente):** o remoto possui tags `audit/`, `backup/` e `checkpoint/` (ex.: `backup/genesis-20261121-wt-handoff-00-snapshot`, `checkpoint/genesis-fase4-pre-correcao`) que preservam snapshots de histórico. O incidente **SEC-2026-001** (exposição histórica via tag `v1.0.0-rc.1`, documentado em `.agents/handoffs/onda-10.1-p0-seguranca/`) foi marcado como "remoção remota não executada". **Recomendo ao Agente 09/Silas e ao humano verificar se essas tags remotas ainda expõem o conteúdo do incidente** — é condição pré-existente do remote, fora do delta auditado, mas diretamente relevante à higiene do histórico publicado.
- **R-3 (processual):** o push de `main` local (D:) é uma decisão de merge do Coordenador — conteúdo limpo, mas altera `main` diretamente.
- **R-4 (observação):** `gitleaks` não está instalado no host; sugiro adicioná-lo ao toolchain de QA para gates futuros.

## 6. Limitações declaradas

- A reconstrução do delta usa tips de `origin/*` do clone D: (~21:00 UTC) menos tips do snapshot P0. Pushes ocorridos **após** ~21:00 UTC não estão cobertos — a coordenação deve revalidar se novos pushes acontecerem.
- Varredura baseada em padrões regex (não é gitleaks); segredos ofuscados/exóticos podem escapar — mitigar com GitHub Secret Scanning no remote.
- Clone C: tem `origin` possivelmente mais antigo que o real (último fetch 16:17 local); vereditos baseiam-se no estado do clone D: (mais fresco).

## 7. Evidências

Em `manifests/`:
- `despacho06-refs-veredito.tsv` — tabela ref→SHA→veredito
- `despacho06-published-delta-commits.txt` — 239 SHAs do delta publicado
- `despacho06-published-delta-paths.txt` — 498 entradas name-status
- `despacho06-pos4-late-commits.txt` / `despacho06-pos4-diffs-scan.txt` — commits POS4 pendentes e diffs brutos
- `despacho06-secret-scan-evidence.txt` — padrões varridos e resumo
- `despacho06-saneamento-branch-diff.txt` — diff líquido de `integration/saneamento-20261124` vs merge-base
- `despacho06-dclone-main-diff.txt` — diff líquido de `main` (D:) vs `origin/main`
