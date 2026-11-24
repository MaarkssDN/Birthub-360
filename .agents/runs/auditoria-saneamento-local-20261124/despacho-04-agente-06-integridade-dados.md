# DESPACHO 04 — AGENTE 06 (Gael): Integridade de Dados e Preservação de Conteúdo Não Recuperável

- **Sessão:** `devin-subagent-despacho04-20261124`
- **Início:** 2026-11-24 (auditoria P0 prévia já concluída — não repeti medições de arquivos/commits)
- **Fim:** 2026-11-24
- **Escopo executado:** somente leitura; nenhum banco aberto, nenhum serviço iniciado, nada deletado, nenhum valor de segredo ou PII reproduzido.
- **Matriz detalhada:** `manifests/despacho04-integridade-dados-matriz.tsv`

## 1. Resumo executivo

**Não há bancos de dados, dumps, gravações de áudio, uploads ou credenciais de sessão Baileys em arquivos dentro de nenhum worktree órfão, checkout `wt-*`, worktree Gemini ou clone.** Toda a persistência real de dados deste projeto vive em **volumes Docker** (Postgres, Redis, MinIO/S3, Qdrant, Chatwoot, n8n etc.) — e o **daemon Docker está indisponível** (`Cannot connect to the Docker daemon at tcp://192.168.0.116:2375`), portanto **nenhum volume pôde ser inspecionado, dumpado ou verificado**. Este é o maior risco de perda de dados identificado neste despacho.

## 2. Achados por tarefa

### T1 — Arquivos de dados em worktrees órfãos

Varredura exaustiva (find sem `node_modules`/`.git`) sobre `C:\Github\Birthub-360-worktrees\` (42 diretórios, incluindo `squads\*` com ~40 worktrees) procurando `*.db`, `*.sqlite*`, `*.dump`, `*.pgdump`, `*.backup`, `creds.json`, áudio (`*.mp3/*.wav/*.ogg/*.m4a/*.webm` de conteúdo real) e diretórios `data/storage/uploads/recordings/baileys/auth_info`:

- **Única ocorrência:** `.env.test.backup` em `squads\squad-00\wt-02-harness` — ambiente de **teste** (`prospectordb_test`, Redis DB 1, Meili 7701). Não é dado de produção.
- `migrate.sql` (1 linha, `ALTER TABLE`) na raiz dos clones e de `wt-*` — **tracked no Git**, reproduzível.
- `public/landing/prospeccao/prospect-radar-demo.webm` replicado nos worktrees de squads — asset de demonstração versionado, reproduzível.
- Worktrees `wt-*` / `Birthub-360-wt` / Gemini: scans de profundidade 2–4 + varredura de diretórios de dados típicos → **zero ocorrências** de bancos/dumps/sessões. Apenas `.env.test` (teste) em `wt-08-dsr` e `parallel_task_force_worktrees`.

### T2 — Bancos locais ativos e Docker

- **`.env` / `.env.test`** presentes e **idênticos** (SHA-256 `b16a0652…` / `1b010f0b…`) em `C:\Github\Birthub-360` e `D:\Github\Birthub-360`. `DATABASE_URL`/`DIRECT_URL` → `postgresql://<cred>@localhost:5434/prospectordb` (e `prospectordb_test` no `.env.test`). Demais serviços locais: Redis 6379, Meili 7700/7701, Qdrant 6333, MinIO 9000, LiteLLM 4000. **Nenhum valor de segredo reproduzido.**
- ⚠️ **Inconsistência registrada:** `docker-compose.postgres-local.yml` (linhas 1–15) documenta que desde 2026-09-08 (ADR-004) o `DATABASE_URL` deveria apontar para o **Postgres Oracle Cloud**, não para container local. Os `.env` atuais apontam `localhost:5434` — ou seja, o banco local Docker pode conter a **única cópia do banco de desenvolvimento**, ou estar defasado em relação à decisão de arquitetura. **Decisão humana necessária** (qual é a fonte de verdade do banco dev/prod).
- **Docker:** CLI presente, **daemon indisponível** → `docker ps`/`docker volume ls` **não executáveis**. Volume(s) e containers não verificados.
- **Volumes nomeados com dados exclusivos potenciais** (de `docker-compose.yml`, `.services.yml`, `.opensource.yml`, `.postgres-local.yml`):
  - `birthhub_pgdata` — PostgreSQL `prospectordb`/`prospectordb_test` (**EXCLUSIVO** se houver dados reais de dev);
  - `birthhub_redisdata` — Redis; **credenciais de sessão Baileys/WhatsApp residem aqui** (`useRedisAuthState.ts`, `src/features/integrations/whatsapp/`) (**EXCLUSIVO — não publicável**);
  - `birthhub_miniodata` — MinIO/S3 `STORAGE_ENDPOINT` → **uploads, anexos de leads, gravações de áudio** (**EXCLUSIVO — provável PII**);
  - `birthhub_qdrant_data` — embeddings/RAG (reconstruível, custoso);
  - `birthhub_chatwoot_data`, `birthhub_n8n_data`, `birthhub_flowise_data`, `birthhub_openwebui_data`, `birthhub_superset_data`, `birthhub_casdoor_data`, `birthhub_infisical_data`, `birthhub_uptime_kuma_data`, `birthhub_pocketbase_data`, `birthhub_whisper_cache`, `langfuse_minio_data` — dados operacionais de serviços auxiliares (**EXCLUSIVOS/operacionais**);
  - `birthhub_meilidata`, `birthhub_ollamadata` — **reproduzíveis** (índice de busca e modelos).
- Nenhum diretório `pgdata`/dados MinIO solto em `C:\Github`/`D:\Github` (profundidade ≤3) — dados estão confinados aos volumes Docker nomeados.

### T3 — Central de Comando / handoffs

- `D:\Github\Central-de-Auditoria-e-Handoffs`, `Central-de-Handoff-de-IA`, `Central de Handoff de IA`, `DEFININDO OS AGENTES`, `RETOMADA GLOBAL E AJUSTES DO BIRTHUB 360`, `CENTRAL-DE-INTELIG-NCIA-COMERCIAL`: **`git status` limpo (0 alterações)**; commits de preservação `…preservacao saneamento 20261124` presentes. O trabalho sujo histórico (Relatório 2 §2.2) foi commitado.
- `Central de Handoff de IA\data\board.json`: **gitignored**, 33 bytes, conteúdo `{"version":1,"tasks":[]}` (SHA-256 `5603b036…`) → **vazio/reproduzível**, sem risco.
- `docs/handoffs` não existe como diretório; handoffs vivem em `.agents/handoffs/`: **C: = 682 arquivos, D: = 821 arquivos**, ambos commitados e limpos. D: está ~139 arquivos à frente — coberto pelo bundle `birthub360-cloneD-unpushed-20261124.bundle` (Relatório 2 §2.1), **mas commits seguem sem push** → risco residual já mapeado.

### T4 — PII / LGPD

- **Nenhum artefato de arquivo** com PII foi encontrado nos worktrees/clones (sem CSVs de leads, sem dumps, sem gravações).
- `bitrix_fields.json` / `parsed_fields.json` (raiz de `CENTRAL-DE-INTELIG-NCIA-COMERCIAL` e `wt-*`): **metadados de schema de campos Bitrix24** (títulos/tipos), sem valores de registros → sem PII.
- **PII provável concentra-se nos volumes Docker não inspecionados**: `prospectordb` (CRM: leads, contatos, telefones), `birthhub_miniodata` (anexos/gravações), `birthhub_chatwoot_data` (conversas), `birthhub_redisdata` (sessões WhatsApp ativas). **Classificação: NÃO-PUBLICÁVEL até inspeção autorizada.** Nenhum valor foi aberto ou reproduzido.

### T5 — Exclusivo vs. reproduzível

| Classe | Itens |
|---|---|
| **EXCLUSIVO (não recuperável se perdido)** | Volumes Docker `birthhub_pgdata`, `birthhub_redisdata` (sessões Baileys), `birthhub_miniodata` (uploads/áudio), `birthhub_qdrant_data`, `chatwoot/n8n/flowise/openwebui/superset/casdoor/infisical/uptime_kuma/pocketbase/whisper_cache`, `langfuse_minio_data` — **todos não verificados (daemon down) e sem backup identificado** |
| **SEGREDO LOCAL (classe H)** | `.env`/`.env.test` dos dois clones (idênticos) — fora dos backups de código por decisão do Relatório 2 §10 |
| **REPRODUZÍVEL** | migrations `.sql`, seeds/fixtures, `node_modules`, `migrate.sql`, `board.json` (vazio), `meilidata`, `ollamadata`, webm de demo |

### T6 — Evidências de recuperação geradas

- SHA-256 (prefixo): `.env` clones `b16a0652ac4714bd`; `.env.test` `1b010f0bca2baff9`; `board.json` `5603b036c4b41e03`; `bitrix_fields.json` `6f5c224a83e76986`; `parsed_fields.json` `21dace5fa156df6b`.
- Contagens: `.agents/handoffs` C=682 / D=821 arquivos; 42 dirs em `Birthub-360-worktrees`; 14 `wt-*` por drive; 7 worktrees Gemini.
- Nenhum dump de banco foi criado (proibido iniciar serviços / abrir bancos).

## 3. Riscos de perda (ordenados)

1. 🔴 **Volumes Docker com dados reais/PII/sessões WhatsApp sem backup verificado** — daemon indisponível impede até inventário. Se a máquina/ Docker Desktop for resetado, `birthhub_pgdata`, `birthhub_miniodata` e `birthhub_redisdata` somem.
2. 🟡 `.env` idênticos nos dois clones mas **não fazem parte de nenhum backup** — perda simultânea de C:+D: elimina segredos de desenvolvimento (recuperáveis se forem os mesmos do cofre/Infisical, mas não verificado).
3. 🟡 Divergência `.env` localhost:5434 vs. ADR-004 (Oracle Cloud) — se o banco dev real está na nuvem, o volume local pode ser descartável; se não, é a única cópia. **Bloqueador de decisão humana.**
4. 🟡 Commits/push pendentes (já mapeados nos Relatórios 2/Despachos 02/06) — docs/handoffs de D: à frente de C: dependem do bundle local em `D:\Github\_backups`.
5. 🟢 Artefatos de arquivo em worktrees órfãos: **nenhum dado exclusivo encontrado** — tar.gz de órfãos em `D:\Github\_backups\saneamento-20261124\orphans\` + espelho físico em `D:\Github\Birthub-360-worktrees\` já cobre o conteúdo.

## 4. ⚠️ Anomalia operacional observada (não causada por este agente)

Os artefatos da auditoria P0 (`RELATORIO-1..7`, `orphans.tsv`, `wtstatus__*.tsv`, `wtlist__*.txt`, etc.) que existiam em `D:\Github\Birthub-360\.agents\runs\auditoria-saneamento-local-20261124\` no início desta sessão **desapareceram durante a execução** — o diretório agora contém apenas os despachos 02/03/06/07 e `manifests\despacho0*`. Não estão no Git (untracked) nem localizei cópia em `_backups`. Este agente leu `orphans.tsv` e `RELATORIO-2` integralmente antes do desaparecimento e usou-os como base. **Recomendo ao coordenador verificar se houve movimentação intencional ou perda dos relatórios forenses P0.**

## 5. Bloqueadores / decisões humanas

1. **Subir o Docker daemon** (ou confirmar indisponibilidade permanente) para inventariar volumes `birthhub_*` — sem isso, o item de maior risco permanece não verificado.
2. **Decidir a fonte de verdade do banco**: `.env` localhost:5434 vs. Postgres Oracle Cloud (ADR-004) — afeta se `birthhub_pgdata` contém dados a preservar.
3. **Backup dos volumes Docker** (pg_dump do `prospectordb`, dump MinIO, dump Redis para sessões Baileys) — requer daemon ativo e autorização; dados contêm PII → tratar como não-publicável.
4. **Política para `.env`/`.env.test`**: estão fora dos backups por serem segredos — confirmar se devem ir para cofre (Infisical/Safira-98) em vez de backup de arquivos.
5. **Esclarecer desaparecimento dos RELATORIO-*/orphans.tsv** da pasta de runs (item 4 acima).

## 6. Conformidade

- Somente leitura; nenhum banco/sessão aberto; nenhum serviço iniciado; nada deletado ou modificado fora dos arquivos `despacho04-*` autorizados.
- Nenhum valor de senha, token, CPF, telefone ou dado pessoal reproduzido — apenas caminhos, contagens, tamanhos e prefixos de hash.
