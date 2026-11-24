# DESPACHO 05 — RELATÓRIO DO AGENTE 98 (SAFIRA): SEGREDOS E CREDENCIAIS
**Sessão:** devin-subagent-despacho05-20261124 · **Início:** 2026-11-24 (manhã) · **Fim:** 2026-11-24 18:52 · **Runtime:** Devin subagent (somente leitura nos fontes; nenhum commit, nenhuma rotação, nenhum valor secreto reproduzido)
**Base:** continuação da auditoria P0 em `.agents/runs/auditoria-saneamento-local-20261124/` (RELATORIOS 1–3 + manifests). Inventário sanitizado completo em `manifests/despacho05-inventario-segredos.md`.

## 1. Sumário executivo
O material sensível local concentra-se em **um único conjunto canônico** (`.env` devstack, sha256 `b16a0652…`) replicado em 27 localizações e **um vazamento real já exposto em repositório GitHub**: a Firebase `apiKey` (sha16 `eb0bad1ec7eb82c2`) commitada no histórico do Birthub-360 (`30385d46d`, remediada em `dac26ae32`) e **ainda viva** em `D:\Github\Agente-de-Codigo-Local\firebase-applet-config.json`, arquivo rastreado e presente em `origin/main` do repo `MaarkssDN/Agente-de-Codigo-Local`. Adicionalmente, `.env.codespace` commitado em `f0b25e3c3` (removido em `3362f8bfc`, ambos ∈ `origin/main`) expôs ~15 segredos — 15 chaves dão MATCH com o `.env` atual (provavelmente ativas) e 7 divergem (status desconhecido). Backups, patches e tarballs de órfãos estão **limpos de segredos literais** (único achado: `.env.test`, que é byte-a-byte o template `.env.test.example`).

## 2. Achados por severidade

### ALTO
- **A1 — Firebase apiKey real exposta no GitHub (repo irmão).** `D:\Github\Agente-de-Codigo-Local\firebase-applet-config.json` contém apiKey real (padrão `AIza…`, len 39), commit `42a9d24` ∈ `origin/main` de `github.com/MaarkssDN/Agente-de-Codigo-Local`. A mesma chave estava no histórico do Birthub-360. **Ação requerida (humano):** verificar/restringir a chave no Firebase Console (HTTP referrers/API restrictions) e substituir por env var no repo irmão, como já feito no Birthub-360.
- **A2 — `.env.codespace` histórico com segredos que MATCH com `.env` atual.** 15 chaves do commit `f0b25e3c3` são idênticas às vigentes (MEILI_MASTER_KEY, MINIO_*, STORAGE_*, DIRECT_URL etc.) → segredos de devstack ativos expostos em `origin/main`. Embora sejam devstack local, o precedente exige rotação se algum valor for reutilizado em staging/produção (DESCONHECIDO — não verificável sem acesso a Render).

### MÉDIO
- **M1 — `.env` canônico replicado em 27 locais** (2 clones + 25 sub-worktrees `dem-20261123-onda3` em C: e D:). Superfície de vazamento acidental; qualquer `git add -f` ou cópia descuidada vaza ~30 segredos de uma vez. Não há diversificação entre C: e D: (mesmo SHA256).
- **M2 — Senha default literal em arquivo rastreado:** `docker-compose.services.yml` ~L245 contém fallback `password=${APP_DB_PASSWORD:-<default-dev>}` (serviço casdoor). Dev-only, mas é credencial literal no Git.

### BAIXO / INFORMATIVO
- **B1 — `firebase-applet-config.json` placeholder** (`AIza_PLACEHOLDER`, sha `d34d31…`) presente em ~60 worktrees/clones — não sensível, mas ruído; candidato a remoção futura do repo.
- **B2 — `.env.test`** (~36 locais) é byte-a-byte igual a `.env.test.example` → fixtures públicas, não segredos reais.
- **B3 — Patches e backups limpos:** verificação de `D:\Github\_backups`, `C:/D:\Github\Birthub-360-backups`, `pres005-20261122`, `fase-zero-20261123`, `saneamento-20261124` → nenhum `.env` copiado; patches inspecionados contêm apenas referências/placeholder; 18 tarballs de órfãos contêm apenas `.env.test` (template).

## 3. Classificação de credenciais (sem teste contra serviços externos)
- **EXPIRADA:** 0 confirmadas.
- **PROVAVELMENTE-ATIVA:** conjunto `.env` devstack (S1); 15 chaves de `.env.codespace` histórico que dão MATCH com `.env` atual; Firebase apiKey (não expira; exposição confirmada em 2 repos); dev default do compose.
- **DESCONHECIDA:** BETTER_AUTH_SECRET, CREDENTIALS_ENCRYPTION_KEY, PII_BLIND_INDEX_KEY, DATABASE_URL, ALLOWED_ORIGINS, LITELLM_KEY, LITELLM_MASTER_KEY do `.env.codespace` histórico (valores divergentes do `.env` atual — podem ser fixtures antigas de dev ou ter sido produção; len 44/67/87 sugere entropia real).

## 4. Plano de migração para cofre (NÃO executado)
O projeto já possui decisão arquitetural: **Infisical** (`docs/security/SECRETS_MANAGER_MIGRATION.md`), com sync nativo → Render e `src/config/env.ts` como fonte de validação. Sequência proposta:
1. **Curto prazo (humano):** criar projeto Infisical (ou cofre local criptografado, ex.: `sops`+age ou Vault) e importar o `.env` canônico como ambiente `development`; produzir `.env.local` efêmero via `infisical run`/`export` em vez de arquivo replicado por worktree. Eliminar as 25 cópias em `dem-20261123-onda3` após confirmar que os worktrees estão congelados.
2. **CI:** GitHub Secrets para workflows (`.github/workflows/**`); o repo já tem `scripts/security/scan-secrets.sh`, `secret-scan-diff.sh`, `.gitleaks.toml` e gate de secret scan no CI.
3. **Produção:** seguir o runbook SECRETS_MANAGER_MIGRATION.md — migrar sem rotacionar `BETTER_AUTH_SECRET`, `CREDENTIALS_ENCRYPTION_KEY`, `PII_BLIND_INDEX_KEY` (sequenciamento crítico documentado: rotação exige re-cifra de credenciais no banco / reindexação de PII).
4. **Rotação real (requer decisão humana + responsável):** Firebase apiKey (console Firebase), segredos `.env.codespace` que ainda forem válidos em qualquer ambiente, e o dev default do compose (trocar por `${VAR:?obrigatório}` como já feito em MINIO_ROOT_PASSWORD).
5. **Higiene:** remover `firebase-applet-config.json` do repo `Agente-de-Codigo-Local` (substituir por env var) e purgar do histórico se o repo for público; avaliar `git filter-repo`/BFG apenas com autorização — reescrita de histórico é irreversível.

## 5. Coordenação com Agente 99 (histórico git) — referências cruzadas
- **Commits a incluir na varredura:** `f0b25e3c3` (add `.env.codespace`), `3362f8bfc` (del), `30385d46d` (add firebase config c/ key real), `dac26ae32` (placeholder), `42a9d24` do repo `Agente-de-Codigo-Local` (fora do escopo Birthub-360 — repo irmão).
- **Já verificado por mim:** `git log --all --diff-filter=A` no clone D: lista como únicos paths sensíveis históricos: `.env.codespace`, `agente-codigo-local/firebase-applet-config.json` (+ templates `.example`). Nenhum `.env`/`*.pem`/`*.key` jamais commitado.
- **Bundles:** `pres005-20261122`, `fase-zero-20261123`, `saneamento-20261124` (C:/D:), `wt-handoff-00-consolidacao-preserved.bundle` (C:/D:) podem conter os commits acima — recomendo `git bundle list-heads` + `git log` nos refs para confirmar cobertura.
- **Repo irmão:** `MaarkssDN/Agente-de-Codigo-Local` — histórico completo deve ser varrido (gitleaks) pois contém a key real em HEAD.

## 6. Bloqueadores / decisões pendentes (humanas)
1. **Rotação/revogação real** de qualquer credencial — exige responsável autorizado (runbooks em `docs/security/runbooks/ROTATE_*` prontos).
2. **Firebase Console** — restringir/rotacionar a apiKey exposta (console é acesso humano).
3. **Visibilidade do repo** `Agente-de-Codigo-Local` no GitHub (público/privado) — determina severidade real do A1.
4. **Reescrita de histórico** (`.env.codespace`, firebase config) — irreversível, requer decisão expressa; alternativa: aceitar exposição e rotacionar tudo que ainda for válido.
5. Escopo do `.env` (devstack local vs. reúso em staging/prod) — não determinável localmente; assumir pior caso até confirmação no Render/Infisical.

## 7. Evidências
- Inventário sanitizado: `manifests/despacho05-inventario-segredos.md` (caminhos + SHA256 + tipos, zero valores).
- Comparações feitas por hash (SHA256/SHA16), nunca por exposição de valor: `.env` C:=D:; `.env.test` = `.env.test.example`; apiKey histórica Birthub = apiKey `Agente-de-Codigo-Local`; 15 chaves `.env.codespace` MATCH `.env` atual.
- Comandos: `find`/`rg --files` por padrão de nome em todos os clones/worktrees/repos; `tar -tzf` nos 18 orphans; inspeção estrutural de patches (somente nomes de variável e classes de valor); `git log/show/ls-files/merge-base` somente leitura.

## 8. Status
**CONCLUÍDO** — inventário, classificação, verificação de backups/patches e plano de migração entregues. Pendências são bloqueadores de decisão humana (rotação, Firebase Console, reescrita de histórico), não de execução técnica.
