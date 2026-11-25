# DESPACHO 05 — INVENTÁRIO SANITIZADO DE SEGREDOS (Agente 98 — Safira)
Sessão: devin-subagent-despacho05-20261124 · Data: 2026-11-24 · Escopo: C:\Github, D:\Github, worktrees, backups, histórico git (somente leitura; nenhum valor secreto reproduzido — apenas caminho + SHA256 + tipo + status).

## Legenda de status
- PROVAVELMENTE-ATIVA: evidência de uso atual (match com .env vigente, arquivo live, ou push recente).
- DESCONHECIDA: sem metadados suficientes para afirmar expiração/ativação; não testado contra serviço externo.
- EXPIRADA: nenhuma confirmada nesta sessão.
- NAO-SECRETO: conteúdo verificado como placeholder/template.

## 1. Segredos em disco (não commitados — gitignored)

| # | Arquivo representativo | SHA256 | Ocorrências | Tipo de segredo | Status |
|---|---|---|---|---|---|
| S1 | `.env` (raiz de clone/worktree) | `b16a0652ac4714bd601e1f7870abd2db04b5f3525d67c90b7ea2e83efec69a67` | 27 locais, todos idênticos | ~30 segredos devstack: senha DB (POSTGRES/APP/MIGRATOR), DATABASE_URL/DIRECT_URL, BETTER_AUTH_SECRET, CREDENTIALS_ENCRYPTION_KEY, PII_BLIND_INDEX_KEY, PUBLIC_LEAD_IP_HASH_SECRET, STORAGE_SECRET_ACCESS_KEY, REDIS_PASSWORD, MEILI_MASTER_KEY, QDRANT_API_KEY, MINIO_ROOT_PASSWORD/SECRET_KEY, LITELLM_KEY/MASTER_KEY, N8N_ENCRYPTION_KEY/N8N_PASSWORD, SUPERSET_SECRET_KEY/ADMIN_PASSWORD, CHATWOOT_SECRET_KEY, PLANE_SECRET_KEY, LIVEKIT_API_SECRET, INFISICAL_ENCRYPTION_KEY/AUTH_SECRET, LANGFUSE_*, CLICKHOUSE_PASSWORD, OPENWEBUI_SECRET, FLOWISE_* | PROVAVELMENTE-ATIVA (devstack local; não é conjunto de produção — produção vive no Render/Infisical conforme docs/security/SECRETS_MANAGER_MIGRATION.md) |
| S2 | `.env.test` | `1b010f0bca2baff9aaf2535b4dfa024313943c80d1053433d332f3a554459d67` | ~36 locais, todos idênticos | 11 vars sensíveis (BETTER_AUTH_SECRET, PLATFORM_OPERATOR_TOKEN, CREDENTIALS_ENCRYPTION_KEY, PII_BLIND_INDEX_KEY, DATABASE_URL etc.) | NAO-SECRETO — SHA256 idêntico a `.env.test.example` (template publicado); valores são fixtures de teste |

### Locais de S1 (`.env`, sha b16a…, 27 ocorrências)
- `C:\Github\Birthub-360\.env`, `D:\Github\Birthub-360\.env`
- `C:\Github\Birthub-360-worktrees\dem-20261123-onda3\wt-*` (16 sub-worktrees: wt-00-integracao, wt-09-audit-onda3, wt-20-core-backend, wt-21-api-contracts, wt-22-controllers, wt-23-queue, wt-31-app-shell, wt-34-accessibility, wt-41-activities, wt-42-crm-kanban, wt-43-prospecting-authz, wt-44-cadence, wt-45-crm-agenda, wt-50-bitrix-authz, wt-96-auth, wt-97-rbac)
- `D:\Github\Birthub-360-worktrees\dem-20261123-onda3\wt-*` (9 sub-worktrees: wt-00-integracao, wt-09-audit-onda3, wt-20-core-backend, wt-21-api-contracts, wt-34-accessibility, wt-42-crm-kanban, wt-45-crm-agenda, wt-65-voice-hub, wt-96-auth)

### Locais de S2 (`.env.test`, sha 1b01…, ~36 ocorrências — todas = template)
- Mesmos 27 locais de S1 (par `.env`+`.env.test`)
- `C:\Github\Birthub-360-worktrees\agente-05-cold-email\.env.test`, `agente-08-waveF-orch-e2e\.env.test` (e espelhos em D:)
- `C:\Github\wt-08-dsr\.env.test`, `D:\Github\wt-08-dsr\.env.test`
- `C:\Users\Marcelo\.gemini\antigravity\worktrees\Birthub-360\parallel_task_force_worktrees\.env.test`
- Dentro dos tarballs de órfãos: `agente-05-cold-email-C-20261124.tar.gz`, `wt-08-dsr-C-20261124.tar.gz` (D:\Github\_backups\saneamento-20261124\orphans\)

## 2. Firebase — config de applet

| Arquivo | SHA256 | Status |
|---|---|---|
| `D:\Github\Agente-de-Codigo-Local\firebase-applet-config.json` | `0c5dd3309615609806097521ca0edca5e3dfc76f6c04cab886c050649fcc1284` | **apiKey REAL (len 39, padrão AIza…, sha16 `eb0bad1ec7eb82c2`)** — arquivo RASTREADO, commit `42a9d24` ∈ `origin/main` de `github.com/MaarkssDN/Agente-de-Codigo-Local` → EXPOSIÇÃO EM REPOSITÓRIO GIT REMOTO. PROVAVELMENTE-ATIVA (Firebase API key não expira; sensibilidade baixa-moderada — é identificador público por design, mas combinada a oAuthClientId/Firestore config deve ser restrita/revisada no Firebase Console — requer humano) |
| `*/agente-codigo-local/firebase-applet-config.json` em ~60 worktrees/clones Birthub-360 | `d34d31025e5ccd508f998b91a75e9cda5ef7b68b727c5b33ace3d5812c39d2dc` | NAO-SECRETO — apiKey = `AIza_PLACEHOLDER` (remediado no commit `dac26ae32`) |

## 3. Histórico git Birthub-360 (todos os commits ∈ origin/main — já no remoto)

| Item | Commits | Conteúdo | Status |
|---|---|---|---|
| `.env.codespace` | add `f0b25e3c3` → del `3362f8bfc` | ~15 segredos reais: DATABASE_URL, DIRECT_URL, BETTER_AUTH_SECRET, CREDENTIALS_ENCRYPTION_KEY, PII_BLIND_INDEX_KEY, MEILI_MASTER_KEY, MINIO_*, STORAGE_*, LITELLM_*, ALLOWED_ORIGINS, NODE_OPTIONS | **Match com .env atual (PROVAVELMENTE-ATIVA e expostas no remoto):** DIRECT_URL, HOST, LITELLM_URL, MEILI_MASTER_KEY, MINIO_ACCESS_KEY, MINIO_ENDPOINT, MINIO_SECRET_KEY, NODE_ENV, PORT, SECURE_COOKIES, STORAGE_ACCESS_KEY_ID, STORAGE_BUCKET, STORAGE_ENDPOINT, STORAGE_REGION, STORAGE_SECRET_ACCESS_KEY. **Divergentes (DESCONHECIDA):** BETTER_AUTH_SECRET, CREDENTIALS_ENCRYPTION_KEY, PII_BLIND_INDEX_KEY, DATABASE_URL, ALLOWED_ORIGINS, LITELLM_KEY, LITELLM_MASTER_KEY (len 44/67/87 — valores antigos; podem ser fixtures de dev da época ou ter sido produção) |
| `agente-codigo-local/firebase-applet-config.json` | `30385d46d` (key real) → `dac26ae32` (placeholder) | apiKey Firebase real sha16 `eb0bad1ec7eb82c2` | PROVAVELMENTE-ATIVA — **é a MESMA chave** hoje viva em `Agente-de-Codigo-Local` (§2). Exposta duas vezes no histórico remoto |

`git log --all --diff-filter=A` (Birthub-360): nenhum `.env`/`.env.local`/`.env.production`/`*.pem`/`*.key`/`credentials.json` jamais commitado — apenas `.env.codespace`, `.env.example`, `.env.test.example`, `agente-codigo-local/.env.example`, `agente-codigo-local/firebase-applet-config.json`, `landing/.env.example`.

## 4. Rastreado atualmente (sem literal sensível, exceto 1 default)

| Arquivo | SHA256 | Observação |
|---|---|---|
| `docker-compose.services.yml` | `52f83735f199589d80510dfaeb1b75cbf686acb0ce4ef48e7629ef987326180f` | linha ~245: fallback literal `password=${APP_DB_PASSWORD:-<dev-default>}` — senha default dev embutida (casdoor). Risco baixo (dev-only), mas é credencial literal em arquivo rastreado |
| `charts/birthhub-360/templates/secret.yaml` | `6651d8d85e652f4cef6c1c89f67ad3326a6ca3ff4d78eefb7964feabad0a5c8e` | template genérico iterando `.Values.secrets` — sem literal |
| `.env.example` / `.env.test.example` / `agente-codigo-local/.env.example` / `landing/.env.example` | — | templates; `.env.test.example` = `.env.test` (ver S2) |

## 5. Backups e patches preservados — verificação de segredos

| Local | Resultado |
|---|---|
| `D:\Github\_backups\saneamento-20261124\`, `C:\Github\Birthub-360-backups\`, `D:\Github\Birthub-360-backups\` | **Nenhum `.env` copiado** (find exaustivo). `uncommitted/` e `repos-dirty/` contêm patches + cópias de código sem segredos de ambiente |
| Patches inspecionados (`repos-dirty\Central_de_Handoff_de_IA.patch`, `pres005-20261122\stash-wip-onda2-*.patch`, `worktrees-dirty\*.patch`, `uncommitted\*.patch`) | **LIMPOS**: ocorrências de SECRET/PASSWORD/TOKEN são nomes de variável, `process.env`, placeholders ou defaults dev (`LIKELY-PLACEHOLDER`); `.env.example` adicionado tem valores vazios; `server.ts` usa identificadores/env-refs — nenhum literal de chave |
| Orphan tarballs (18, `D:\Github\_backups\saneamento-20261124\orphans\`) | listagem tar varrida: somente `.env.test` (template, S2) em `agente-05-cold-email` e `wt-08-dsr`; nenhum `.env`, `*.pem`, `*.key`, `credentials.json`, `creds.json`, `auth_info` |
| Bundles git (`pres005-20261122`, `fase-zero-20261123`, `saneamento-20261124`, `wt-handoff-00-consolidacao-preserved.bundle` em C: e D:) | contêm histórico completo → **podem conter** os commits `f0b25e3c3`/`30385d46d` (ver §3). Varredura de conteúdo = escopo do Agente 99 |

## 6. Ausências verificadas (por nome de arquivo, não por conteúdo)
Nenhum `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.keystore`, `id_rsa*`, `credentials.json`, `creds.json`, diretório Baileys `auth_info*`/`session-*`, ou dump de config com segredo encontrado nos clones, worktrees, `wt-*`, `Birthub-360-wt`, gemini worktrees e repos irmãos de `D:\Github`. Credenciais Bitrix24/Stripe/Google OAuth de produção **não existem em arquivo local** — vivem no Render/Infisical/banco criptografado (`src/lib/crypto/secretFields.ts`).

## 7. Contagens
- Arquivos `.env` reais (S1): **27** (1 conjunto canônico de ~30 segredos replicado)
- Arquivos `.env.test` (S2, = template): **~36**
- `firebase-applet-config.json` placeholder: **~60**; com apiKey real: **1** (repo irmão, pushed)
- Segredos únicos reais em disco: **1 conjunto `.env` devstack** + **1 firebase config real**
- Segredos históricos expostos em origin/main: **~15** (`.env.codespace`) + **1** (firebase apiKey, mesma do repo irmão)
- Credenciais EXPIRADA confirmadas: **0** · PROVAVELMENTE-ATIVA: **~16 conjuntos/itens** · DESCONHECIDA: **~7 chaves históricas divergentes**
