# DESPACHO 08 — PUBLICAÇÃO CONTROLADA DAS BRANCHES PRESERVADAS
**Agente:** 94 — Tess (CI/CD e Operações Git/Deploy)
**Sessão:** `devin-subagent-despacho08-20261124`
**Início:** 2026-11-24 ~20:20 UTC · **Fim:** 2026-11-24 ~20:45 UTC
**Natureza:** SOMENTE LEITURA + planejamento. **Nenhum push, PR ou branch remota foi criado.**

---

## 1. Fontes consultadas
- Auditoria prévia (não repetida): `RELATORIO-4`, `RELATORIO-5`, `RELATORIO-6`, `PAINEL-CONSOLIDADO.md`, `unpushed_origin__*.tsv`, `remoterefs__*.txt`, `manifests/`.
- Estado vivo re-verificado: `git remote -v`, `git for-each-ref`, `git rev-parse`, `git merge-base --is-ancestor`, `gh repo view`, `gh api .../branches/main/protection`, `gh pr list`, `.github/workflows/*.yml`.
- Evidência nova gerada: `manifests/despacho08-inventario-branches.tsv` (102 branches × SHA C:/D: × ahead × flag de ref remota × divergência) e `manifests/despacho08-comandos-publicacao.sh` (233 linhas de comandos prontos).

## 2. Destino remoto e proteções (verificado ao vivo)
- Remote único nos dois clones: `origin = https://github.com/MaarkssDN/Birthub-360.git` — **repositório PÚBLICO**, `gh` autenticado como `MaarkssDN` (scopes `repo`, `workflow`).
- `origin/main` = `0d790443d10fed5c9da20394b29e43188a07b467`.
- **Proteção de `main` (API):** required checks `Visual Regression Gate` e `Central Birth Hub 360 / application gate`; `strict=false`; `allow_force_pushes=false`; `allow_deletions=false`; `enforce_admins=false`; **sem `required_pull_request_reviews` explícito** — na prática, pushes diretos a `main` ficam bloqueados pelos required checks (checks só rodam via PR/push para main), logo **todo merge passa por PR**.
- **Nenhuma das branches candidatas existe no remoto** — `git ls-remote origin` com patterns `integracao/*dem2026112*`, `integracao/squad-*`, `integracao/pos4*`, `integracao/consolidacao-dem*`, `preserve/*` retornou vazio. Única exceção no inventário: `agente/03-telas-brand-system` já está sincronizada (SHA local == remoto `29ee11d99508…`, nada a publicar).
- Logo: **todos os pushes propostos são criações de refs novas → fast-forward trivial, zero risco de overwrite, `--force` desnecessário e proibido.**

## 3. Inventário (resumo — detalhe em `manifests/despacho08-inventario-branches.tsv`)
União das branches com commits não publicados: **102** (83 no clone C: + 19 exclusivas do clone D:).

### 3.1 Integrações de onda / consolidação (prioridade máxima)
| Branch | SHA (C:) | SHA (D:) | Canônica | Ahead de `origin/main` | No remoto? |
|---|---|---|---|---|---|
| `integracao/consolidacao-dem20261123-candidato` | `2f4617cd0194fb74689f95e250e2a3ab2caca246` | — | C: | 216 | não |
| `integracao/onda-1-dem20261123` | `815a09305f532153ad8dc07adb9363f1ea694100` | `815a0930…` (idêntico) | igual | 43 | não |
| `integracao/onda-2-dem20261123` | `3b40599d68a97361240dafd3059d4d50bd86f7ea` | `32d07c3750c370b63da8b720019413c9a40e0e68` | **C:** (D é ancestral — verificado) | 62 | não |
| `integracao/onda-3-dem20261123` | `dc43a14d8825a0470a3092db9776f1bd7f601858` | `32d07c375…` | **C:** (D ancestral) | 244 | não |
| `integracao/onda-4-dem20261123` | `9f80c07edc2000712e884febbdd3cd2fb2bee55d` | `9f80c07e…` (idêntico) | igual | 87 | não |
| `integracao/pos4-dem20261124` | — (objeto ausente no C:) | `9d4089f8f961d77e0789436f1f09840acaf73b82` | **D:** | 88 (D:) | não |
| `integracao/squad-00` | `ed54111ac2f89b900006837be93d8cea3cc96c62` | — | C: | 178 | não |
| `integracao/squad-10` | `3d12825fa168363bbafcf2fb73b67257fc278b99` | — | C: | 181 | não |
| `integracao/squad-30` | `d53bb541313d9293db9a050df970f11b1f396cd6` | — | C: | 177 | não |
| `integracao/squad-40` | `abbc4601add3d726d74d9477cc8853cd2d7a8832` | — | C: | 182 | não |
| `integracao/squad-50` | `1960064d818b449a0bceab939a06f9e2172d2277` | — | C: | 176 | não |
| `integracao/squad-60` | `93e82c22024ccc9ca48abad6b29e855cbd4157f9` | — | C: | 175 | não |
| `integracao/squad-70` | `1c5b816c313528ae81a67c844ebda04cfac70160` | — | C: | 177 | não |
| `integracao/squad-80` | `5786d9e7cc5d756fe65fab56b1aa64c8df8745b3` | — | C: | 176 | não |
| `integracao/squad-90` | `e0601014aee09d00738dbef4ef7d9e479fdf4af6` | — | C: | 181 | não |
| `base/dem-20261123-c286185c` | `c286185c13bca42ff70c5c95bd15495ec44e794a` | idêntico | igual | 20 | não |
| `consolidacao_backlog_birthub360` | `51c82aa5eb41412902b6660f4de7c78ef83c45fc` | idêntico | igual | 2 | não |
| `docs/matriz-reconciliacao-20261124` | (C: only) | — | C: | 171 | não |

### 3.2 Divergências C:×D: — RESOLVIDAS por ancestralidade
As 10 homônimas divergentes foram verificadas com `git merge-base --is-ancestor`: **em todos os casos o SHA do clone D: (`32d07c375…`) é ancestral do SHA do clone C:** → o clone C: é estritamente à frente; **publicar somente o SHA do C:**. O clone D: não contribui nada nessas 10.

### 3.3 Branches exclusivas do clone D: (19) — push deve sair do clone D:
`integracao/pos4-dem20261124`, `coord/squad-30`, `agente/09-review-onda4`, `agente/44-cadences-onda4`, `agente/46-forecast-s40`, `agente/51-bitrix-auth-onda4`, `agente/56-whatsapp-onda4`, `agente/72-tool-engine-onda4`, `agente/85-mobile-offline-onda4`, `agente/99-sec-triage-pos4`, e os `*-pos4`/`64-*`: `agente/06-idor-whatsapp-pos4`, `agente/17-cadence-tz-pos4`, `agente/22-api-idem-pos4`, `agente/63-stt-pos4`, `agente/64-stt-cmd-pos4`, `agente/64-voice-commands-onda4`, `agente/69-optout-onda4`, `agente/69-optout-pos4`, `agente/85-mobile-idem-pos4`.
Alternativa: `git -C /c/Github/Birthub-360 fetch /d/Github/Birthub-360 <branch>` para trazer os objetos ao C: antes do push (recomendado para `pos4`, que é branch de integração prioritária).

### 3.4 Demais branches
~60 branches `agente/*-onda*`/`coord/squad-*`/`docs/*` com commits exclusivos, inventariadas linha a linha no TSV. Todas sem ref remota correspondente.

## 4. CI — o que dispara e o que é exigido
Workflows em `.github/workflows/` (26 ativos + 1 disabled):

| Gatilho | Workflows | Efeito para ESTE plano |
|---|---|---|
| `push` em `main/master/develop` ou `pull_request` → `main/master` | `ci.yml` (Central Birth Hub 360 Release — secret scan gitleaks + dependency-review + typecheck/lint/test/build; job agregador `application gate`), `visual-regression.yml`, `security-semgrep.yml`, `security-trivy.yml`, `security-sbom.yml`, `codeql.yml`, `dependency-review.yml`, `migration-safety.yml` (paths), `enforce-governance.yml` (todo PR), `sonarqube.yml`, budgets de frontend/assets/latência (paths) | **Push de branches novas NÃO dispara CI** (nenhum workflow escuta push de branches arbitrárias). Custo de CI = zero até abrir PR. |
| `pull_request` sem filtro de base | `enforce-governance.yml` | **BLOQUEADOR de nomenclatura** — ver §6. |
| `workflow_dispatch` apenas | `qualidade-ci.yml`, `playwright-ci.yml`, `api-schema-fuzz.yml`, `docker-publish.yml`, `android/ios-build`, `cd-homolog`, `production.yaml` | Sob demanda; não bloqueiam. |

**Checks obrigatórios para merge em `main`:** `Visual Regression Gate` + `Central Birth Hub 360 / application gate` (app_id 15368 = GitHub Actions). Sem PR review obrigatório configurado, mas required checks impedem merge sem CI verde. Estimativa de tempo: não medida nesta sessão; `ci.yml` é o pipeline pesado (npm ci + typecheck + lint + unit + arch + build + gitleaks + dep-review) — histórico do repo sugere dezenas de minutos; tratar PRs de integração como longos.

## 5. Gates obrigatórios ANTES de push/PR (checklist de execução humana)
1. **Autorização humana explícita** para push (missão §9 / Relatório 5).
2. **Restore-test dos bundles** ainda pendente (`birthub360-cloneC-unpushed-20261124.bundle` e `…cloneD…`, ~711 MB cada, verify OK, redundantes em `C:\Github\Birthub-360-backups\saneamento-20261124\` e `D:\…`): clonar a partir do bundle em diretório isolado e confirmar que os SHAs do inventário são alcançáveis.Bundles verificados nesta sessão via `git bundle verify` (clone C: OK, "complete history").
3. **Varredura de segredos** nos diffs das 102 branches — repo é **PÚBLICO**: gitleaks local (`.gitleaks.toml` existe) ou aguardar o job `secret-scan` do `ci.yml` no PR. `.env`, dumps, SQLite, bancos: **NUNCA** publicar (Relatório 5 §5.3).
4. **Parecer do Agente 09 (Silas)** para PRs de integração/merge (AGENTS.md §40).
5. **Decisão sobre nomes de branch para PR** (§6) — sem isso, `enforce-governance.yml` falha em todo PR das branches `integracao/*-dem*`, `squad-*`, `preserve/*`, `coord/*`, `base/*`, `docs/*`, `consolidacao_backlog*`.
6. Para `integracao/pos4-dem20261124`: confirmar que seus 88 commits não estão já contidos (por cherry-pick/conteúdo) em `consolidacao-dem20261123-candidato` — hoje o objeto `9d4089f8` **não existe** no clone C:.

## 6. Bloqueadores que impedem PR imediato (push em si NÃO está bloqueado)
- **`enforce-governance.yml` rejeita os nomes de head**: regex aceita apenas `^agente/[0-9]{2}-.+` ou `^integracao/onda-[0-9]+$`. Das branches de integração, **nenhuma passa** (`integracao/onda-1-dem20261123` ≠ `integracao/onda-N`). Decisões humanas possíveis: (a) renomear heads para o padrão (ex.: `integracao/onda-1` já existe no remoto com outro SHA — **colisão**, exigiria nome novo como `agente/94-integracao-onda1-dem20261123` ou afrouxar o workflow); (b) alterar `enforce-governance.yml` para aceitar o sufixo `-dem20261123`/`squad-*`/`preserve/*` antes de abrir PRs.
- **PRs #530–#539 abertos** (preservação/handoffs/pareceres → `main`): convém decidir merge/fechamento antes de empilhar novas PRs de integração, para não confundir revisão.
- **Divergência de linhagem resolvida, mas não publicada**: como D SHA é ancestral de C SHA nas 10 divergentes, basta publicar C:.
- **`integracao/pos4-dem20261124` só existe no clone D:** — push deve ser executado a partir de `D:\Github\Birthub-360` ou após fetch dos objetos para C:.

## 7. Sequência de publicação proposta (ordem de push — tudo FF, sem force)
1. `integracao/consolidacao-dem20261123-candidato` (C:) — base da consolidação, +216.
2. `integracao/onda-1..4-dem20261123` (C:) — ondas.
3. `integracao/pos4-dem20261124` (**D:**).
4. `integracao/squad-00/10/30/40/50/60/70/80/90` (C:).
5. `base/dem-20261123-c286185c`, `docs/matriz-reconciliacao-20261124`, `consolidacao_backlog_birthub360` (C:).
6. `agente/*` com commits exclusivos (~55 no C:, 17 no D:) — por squad.
7. `coord/squad-*` remanescentes.

**Ordem dos PRs (depois dos gates):** primeiro PRs documentais já abertos (#530–#539) → depois `consolidacao-dem20261123-candidato` → `pos4` → ondas → squads. Bases corretas: `main` para todos (nenhuma branch remota de release existe; `origin/integracao/onda-*` antigas NÃO são base adequada — são linhagens de out/2026).

## 8. Comandos exatos
Arquivo pronto para execução humana: **`manifests/despacho08-comandos-publicacao.sh`** — Fase 0 (fetch + ls-remote), Fase 1 (`push --dry-run` de todas as 101), Fase 2 (82 pushes do clone C: em ordem), Fase 3 (19 pushes do clone D:), Fase 4 (verificação `ls-remote` + comparação de SHA), Fase 5 (template de `gh pr create`). Resumo:
```bash
git -C /c/Github/Birthub-360 push --dry-run origin integracao/consolidacao-dem20261123-candidato:integracao/consolidacao-dem20261123-candidato
git -C /c/Github/Birthub-360 push origin integracao/consolidacao-dem20261123-candidato:integracao/consolidacao-dem20261123-candidato
git -C /d/Github/Birthub-360 push origin integracao/pos4-dem20261124:integracao/pos4-dem20261124
# …demais conforme manifests/despacho08-comandos-publicacao.sh
```
**Proibido:** `--force`, `--force-with-lease`, `--delete`, push para `main`, push de `.env`/dumps.

## 9. Verificação de integridade pós-publicação
1. `git ls-remote origin` completo → comparar cada SHA com `despacho08-inventario-branches.tsv` (colunas `sha_C`/`sha_D`); esperado: 101 refs novas + `agente/03-telas-brand-system` já igual.
2. `git fetch origin` nos dois clones e `git branch -r --contains <SHA>` para confirmar reachability.
3. CI: pushes de branches novas não disparam workflows — status CI só passa a existir ao abrir PR (checks `Visual Regression Gate` + `application gate` + `enforce-governance` + Semgrep/Trivy/SBOM/CodeQL se base=main).
4. Re-contar: `git rev-list --count origin/main..<branch>` pós-fetch deve bater com os "ahead" da tabela.

## 10. Recuperação em caso de falha
- **Antes do push:** nada a reverter (somente leitura foi feita). Bundles `birthub360-cloneC/D-unpushed-20261124.bundle` (verify OK, cópias em C: e D:) são a última linha de restauração: `git clone <bundle> restore-test`.
- **Push parcial:** refs remotas criadas são inofensivas (não tocam `main`). Reverter = `git push origin --delete <branch>` — operação em branch própria, permitida pela proteção (só `main` tem `allow_deletions=false`). Se a política proibir delete, basta abandonar a ref remota e republicar corrigida — como são criações novas e FF, um push subsequente com SHA descendente também é FF.
- **Push de SHA errado:** impossível reescrever sem force — em vez disso, publicar branch corretiva `…-v2` e abrir PR dela; nunca force em hipótese alguma.
- **Perda do clone D:** os 19 branches exclusivos do D: estão no bundle cloneD e na cópia física; após push bem-sucedido e `ls-remote` conferido, o D: torna-se aposentável.

## 11. Decisões humanas pendentes
1. Autorizar (ou não) a execução do script de pushes.
2. Política para `enforce-governance.yml` × nomes de branch (§6) — bloqueia PRs, não pushes.
3. Destino de `integracao/pos4-dem20261124` quanto à sobreposição com `consolidacao-candidato`.
4. Fechamento/merge dos PRs #530–#539.
5. Confirmação de que repo **público** pode receber branches `agente/*`/`integracao/*` com eventuais resquícios de WIP — varredura gitleaks prévia recomendada.

## 12. Parecer Tess
**Publicação dos SHAs está pronta e é de baixo risco** (todas as refs são criações novas, FF trivial, sem force, sem custo de CI até os PRs). **O gargalo real é a governança de nomes de branch no `enforce-governance.yml` e os gates de revisão (Silas/Silas-like parecer, segredos, restore-test)** — nenhum push deve ocorrer antes da autorização humana e da varredura de segredos, pois o repositório é público.
