# Runbook — Rotação de segredos do dev stack expostos via Docker API 192.168.0.116:2375

**ID:** RB-SEC-DEVSTACK-2375
**Criticidade:** Alta (incidente de exposição) — execução **humana obrigatória**
**Propriedade:** Agente 15 (Segurança Aplicada) — procedimento; rotação em si é ação do operador
**Status:** Operacional (pendente de execução pelo operador)

---

## 1. Contexto e Motivação

Em 2026-11-10 o daemon Docker do host `192.168.0.116` foi encontrado expondo a
Engine API em `tcp://192.168.0.116:2375` **sem TLS e sem autenticação** na LAN
`192.168.0.0/24`. Qualquer host da rede podia listar containers, inspecionar
`Config.Env`/`Config.Labels` e ler volumes — ou seja, **todas as credenciais
passadas como variável de ambiente aos containers do dev stack estavam
potencialmente comprometidas** durante a janela de exposição.

- Evidência e diagnóstico: `.agents/runs/2026-11-10-ordem01-docker-2375-contencao.md`
- Handoff original (00→10): `.agents/handoffs/00-para-10-docker-2375-sem-autenticacao.md`
- Contenção entregue no PR #240 (firewall/ssh:// no host — **a contenção não
  invalida credenciais já lidas**).

### Segredos efetivamente expostos (variáveis de ambiente dos containers)

Confirmados nos `docker-compose*.yml` do repositório — presença real em cada
container deve ser confirmada no Passo 0.

**Atenção — canal de exposição não é só `Config.Env`:** o compose interpola os
`${VAR:-default}` **antes** de criar o container, então o valor resolvido também
fica visível em `Config.Cmd` (ex.: `redis-server --requirepass <senha>`),
`Config.Entrypoint`/`Config.Args` (ex.: `superset-init --password <senha>`,
`minio-init ./mc alias set ... <senha>`), `Config.Healthcheck.Test`
(`redis-cli -a <senha> ping`) e em strings de conexão embutidas
(`DATABASE_URL`, `REDIS_URL`, `DB_CONNECTION_URI`, `dataSourceName`). O Passo 0
deve inspecionar todos esses campos, não apenas `Config.Env`.

#### Inventário completo (auditoria dos 4 composes — 2026-11-15)

| Segredo | Variável(is) / local | Serviço(s) / canal |
|---|---|---|
| Senha do Postgres (superuser) | `POSTGRES_PASSWORD`/`POSTGRES_PWD` | postgres, temporal (ambos os composes), langfuse (DATABASE_URL **hardcoded** `prospector:prospector_pass`) |
| Senha do papel da aplicação | `APP_DB_PASSWORD` | flowise, n8n, superset, casdoor (`dataSourceName`), infisical (`DB_CONNECTION_URI`), chatwoot, plane (`DATABASE_URL`) |
| Senha do migrator | `MIGRATOR_DB_PASSWORD` | postgres (bootstrap) |
| Senha do Redis | `REDIS_PASSWORD` | redis (`--requirepass` em Cmd + healthcheck), superset, infisical (`REDIS_URL`), chatwoot, plane, langfuse (`REDIS_CONNECTION_STRING` **hardcoded** `prospector_redis_pass`) |
| Chave do Meilisearch | `MEILI_MASTER_KEY` | meilisearch |
| Credenciais do MinIO principal | `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` | minio, minio-init (entrypoint) |
| Credenciais do MinIO do Langfuse | `LANGFUSE_MINIO_USER`, `LANGFUSE_MINIO_PASSWORD` | langfuse-minio, langfuse-minio-init, langfuse (`LANGFUSE_S3_EVENT_UPLOAD_*`) |
| Chave do ClickHouse | `CLICKHOUSE_PASSWORD` | clickhouse, langfuse |
| Segredos do Langfuse | `LANGFUSE_NEXTAUTH_SECRET`, `LANGFUSE_SALT`, `LANGFUSE_ENCRYPTION_KEY` | langfuse-web, langfuse-worker |
| Chaves do LiteLLM→Langfuse | `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY` | litellm (overlay opensource) |
| Chave do LiteLLM p/ clientes | `LITELLM_MASTER_KEY` | **não é env do container litellm** — aparece como `OPENAI_API_KEY` do open-webui e no `.env` do host |
| Chave de API OpenRouter | `OPENROUTER_API_KEY` | referenciada em `litellm-config.yaml` via `os.environ/` — só exposta se presente no env do container (verificar no Passo 0) |
| Credenciais Flowise | `FLOWISE_USERNAME`, `FLOWISE_PASSWORD`, `FLOWISE_SECRET_KEY` | flowise |
| Segredo do Open WebUI | `OPENWEBUI_SECRET` | open-webui (`WEBUI_SECRET_KEY`) |
| Credenciais n8n | `N8N_ENCRYPTION_KEY`, `N8N_USER`, `N8N_PASSWORD` | n8n |
| Segredos do Superset | `SUPERSET_SECRET_KEY`, `SUPERSET_ADMIN_USERNAME`, `SUPERSET_ADMIN_PASSWORD` | superset, superset-init (**senha do admin no Entrypoint resolvido**) |
| Segredo do Casdoor | `CASDOOR_CLIENT_SECRET`; admin default `admin/123456` (comentário do compose, `runmode: dev`) | casdoor |
| Segredos do Infisical | `INFISICAL_ENCRYPTION_KEY` (default **todos os zeros**), `INFISICAL_AUTH_SECRET` | infisical |
| Chaves do LiveKit | `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` (`LIVEKIT_KEYS`) | livekit |
| Segredo do Chatwoot | `CHATWOOT_SECRET_KEY` (`SECRET_KEY_BASE`) | chatwoot |
| Segredo do Plane | `PLANE_SECRET_KEY` | plane-api |
| Senha do Grafana | `GRAFANA_ADMIN_USER`, `GRAFANA_ADMIN_PASSWORD` | grafana |
| Webhook do Alertmanager | `SLACK_WEBHOOK_URL` | alertmanager |
| Segredos da aplicação | `BETTER_AUTH_SECRET`, `CREDENTIALS_ENCRYPTION_KEY`, `PII_BLIND_INDEX_KEY` | somente se presentes em env/volume de container no host 116 |

> **Nota honesta de escopo:** os defaults dos composes (`prospector_pass`,
> `prospector_app_pass`, `prospector_redis_pass`, `birthhub_meili_master_key`,
> `birthhub_minio_dev_only`, `sk-birthhub-master`, `clickhouse-local-password`,
> `change-this-*`, `0000...0000` do Infisical) são documentados como dev-only e
> não devem existir fora da máquina local — ver
> `docs/security/incidents/SEC-2026-001-historical-tag-exposure.md`. Se o host
> 116 usa esses defaults, a rotação é trivial (basta trocar para valores
> fortes); se usa valores reais compartilhados com homologação/produção,
> aplicar a rotação completa abaixo **e** verificar se os mesmos valores estão
> em produção antes de prosseguir — nesse caso trate como incidente de
> credencial de produção, não de dev.
>
> **Defaults especialmente críticos mesmo em dev:** `INFISICAL_ENCRYPTION_KEY`
> all-zeros e `LANGFUSE_ENCRYPTION_KEY`/`DATABASE_URL`/`REDIS_CONNECTION_STRING`
> com credenciais literais no compose — se o host 116 não sobrescreveu via
> `.env`, esses valores são os que estiveram expostos.

---

## 2. Pré-requisitos

- Acesso **local** ao host `192.168.0.116` (PowerShell admin ou shell no
  Docker Desktop/WSL) — a contenção pode ter fechado o 2375; usar o host
  diretamente.
- Acesso aos `.env`/`.env.test` de **todas** as estações de trabalho e agentes
  que consomem o dev stack (workstation `192.168.0.179`, demais estações de
  agentes na LAN).
- Janela de manutenção combinada: a rotação reinicia postgres/redis/meili/
  minio/litellm e **derruba conexões ativas** (sessões de teste, filas,
  integrações locais em voo).
- Backup/snapshot do volume do Postgres antes de rotacionar senhas de banco
  (`docker run --rm -v <volume>:/data -v $PWD:/backup alpine tar czf /backup/pg-pre-rotation.tgz /data`).

---

## 3. Procedimento de Execução

### Passo 0 — Inventário do que está realmente exposto

No host 116 (ou via `ssh://` já provisionado):

```bash
# Env + todos os campos onde o compose interpola segredos resolvidos
docker ps -aq | xargs -I{} docker inspect {} --format \
  '{{.Name}}|ENV:{{range .Config.Env}}{{println .}}{{end}}|CMD:{{json .Config.Cmd}}|ENTRYPOINT:{{json .Config.Entrypoint}}|ARGS:{{json .Args}}|HEALTHCHECK:{{json .Config.Healthcheck.Test}}|MOUNTS:{{range .Mounts}}{{.Source}}->{{.Destination}};{{end}}'
```

Cruzar a saída com a tabela da seção 1 — procurar segredos em **todos** os
campos, não só em `ENV` (ver nota sobre interpolação do compose acima).
Registrar também os mounts: `litellm-config.yaml` é bind-mounted no container
litellm (`:ro`) e referencia segredos via `os.environ/<VAR>` — confirmar se as
chaves referenciadas estavam no env do container. **Não copiar valores para
tickets, logs ou relatórios** — registrar apenas nomes de variáveis e campos.

### Passo 1 — Contenção confirmada antes de rotacionar

Verificar que 2375 não aceita mais conexões de estações não autorizadas
(ver `.agents/runs/2026-11-10-ordem01-docker-2375-contencao.md` §5). Rotacionar
com a porta ainda aberta apenas valida a rotação para o atacante.

### Passo 2 — Rotação por serviço

Para cada segredo, gerar valor novo forte e aplicar:

```bash
# Postgres (senha do superuser e do role da aplicação)
openssl rand -base64 32   # → novo POSTGRES_PASSWORD / APP_DB_PASSWORD
# Redis
openssl rand -base64 24   # → novo REDIS_PASSWORD
# Meilisearch
openssl rand -hex 32      # → novo MEILI_MASTER_KEY
# MinIO (principal e langfuse-minio — credenciais independentes)
openssl rand -base64 24   # → MINIO_ROOT_USER (alfanumérico) e MINIO_ROOT_PASSWORD
openssl rand -base64 24   # → LANGFUSE_MINIO_USER / LANGFUSE_MINIO_PASSWORD
# LiteLLM (chave usada pelos clientes, ex.: OPENAI_API_KEY do open-webui)
openssl rand -hex 32      # → novo LITELLM_MASTER_KEY
# Demais serviços do inventário (mesmo padrão openssl rand -base64 24/32)
# FLOWISE_*, OPENWEBUI_SECRET, N8N_ENCRYPTION_KEY/N8N_PASSWORD,
# SUPERSET_SECRET_KEY/SUPERSET_ADMIN_PASSWORD, INFISICAL_ENCRYPTION_KEY/
# INFISICAL_AUTH_SECRET, LIVEKIT_API_SECRET, CHATWOOT_SECRET_KEY,
# PLANE_SECRET_KEY, GRAFANA_ADMIN_PASSWORD, CLICKHOUSE_PASSWORD,
# LANGFUSE_NEXTAUTH_SECRET/LANGFUSE_SALT/LANGFUSE_ENCRYPTION_KEY,
# LANGFUSE_PUBLIC_KEY/LANGFUSE_SECRET_KEY, CASDOOR_CLIENT_SECRET,
# SLACK_WEBHOOK_URL, OPENROUTER_API_KEY (se presente no container)
```

Atualização do Postgres (senha muda dentro do banco, não só no env):

```bash
docker exec -it birthhub_postgres psql -U <POSTGRES_USER> -d <POSTGRES_DB> \
  -c "ALTER USER <role> WITH PASSWORD '<novo>';"
```

Atualização do Redis sem downtime de auth: `CONFIG SET requirepass` é volátil;
para persistir, atualizar o env e recriar o container (`docker compose up -d
--force-recreate redis`). Atenção: todos os clientes (chatwoot, plane,
infisical) precisam do novo `REDIS_PASSWORD` **antes** do recreate.

Ordem segura sugerida: gerar todos os valores novos → atualizar `.env` de
todas as estações → recreate dos serviços na ordem postgres → redis →
meilisearch → minio (+ langfuse-minio) → clickhouse → langfuse → litellm →
demais overlays (flowise, open-webui, n8n, superset, casdoor, infisical,
livekit, chatwoot, plane-api, grafana, temporal, alertmanager).

Notas por serviço:

- **postgres**: `APP_DB_PASSWORD`/`MIGRATOR_DB_PASSWORD` são senhas de roles
  criados no bootstrap (`scripts/db/create-app-role.sql`) — além do
  `ALTER USER`, se a senha estiver gravada em `pg_authid` de roles
  secundários, aplicar `ALTER ROLE` para cada uma. O `POSTGRES_PASSWORD`
  (superuser) só é relido no primeiro init do volume — para trocá-lo de
  verdade use `ALTER USER <POSTGRES_USER> WITH PASSWORD` dentro do banco.
- **langfuse**: `DATABASE_URL` e `REDIS_CONNECTION_STRING` têm credenciais
  **literais no compose** (`prospector:prospector_pass`,
  `prospector_redis_pass`) — não são parametrizadas por `.env`. Para rotacionar
  de fato é preciso editar `docker-compose.opensource.yml` (arquivo do
  repositório — mudança coordenada com o 00) ou aceitar que o valor real é o
  default e tratá-lo como tal.
- **superset-init**: a senha do admin vai no Entrypoint resolvido — recriar o
  container após atualizar `.env`; se o admin já existe, `create-admin` falha
  silenciosamente (`|| true`) e é preciso trocar a senha pelo Superset ou
  recriar o volume `birthhub_superset_data`.
- **casdoor**: admin default `admin/123456` em `runmode: dev` — se o serviço
  estiver no ar, trocar a senha pela UI do Casdoor, não só no `.env`.
- **infisical**: `ENCRYPTION_KEY` all-zeros é o default — se nunca foi
  sobrescrita, os secrets guardados no Infisical estão cifrados com chave
  conhecida; rotacionar a chave exige re-cifrar o vault (procedimento do
  próprio Infisical) — avaliar se o vault tem conteúdo antes de recriar.
- **livekit**: `--dev` mode com `LIVEKIT_KEYS` — em dev, basta trocar o par
  chave/segredo e atualizar quem consome (app de voz, `.env` das estações).
- **chatwoot/plane/n8n/flowise/superset/grafana**: segredos de framework —
  trocar no `.env` e `docker compose up -d --force-recreate <serviço>`;
  dados persistidos cifrados com a chave antiga (ex.: `N8N_ENCRYPTION_KEY`)
  podem precisar de re-cifragem ou reset do credential store do serviço.

### Passo 3 — Segredos da aplicação (somente se confirmados no inventário)

- `BETTER_AUTH_SECRET` → runbook `ROTATE_BETTER_AUTH_SECRET.md`.
- `CREDENTIALS_ENCRYPTION_KEY` → runbook `ROTATE_CREDENTIALS_ENCRYPTION_KEY.md`
  (envelope `enc:v1:<keyId>:...` com grace period via
  `CREDENTIALS_ENCRYPTION_KEY_PREVIOUS`).
- `PII_BLIND_INDEX_KEY` → runbook `ROTATE_PII_BLIND_INDEX_KEY.md`.
- `BETTER_AUTH_SECRET`/`CREDENTIALS_ENCRYPTION_KEY`/`PII_BLIND_INDEX_KEY` em
  ambiente que compartilha dados com produção: rotacionar conforme os
  runbooks individuais — **nunca** gerar chave nova e descartar a antiga sem
  o procedimento de recriptografia.

---

## 4. Validação Positiva (confirmação da nova credencial)

```bash
# Postgres
PGPASSWORD='<novo>' psql -h 192.168.0.116 -p 5434 -U <user> -d <db> -c 'select 1'
# Redis
redis-cli -h 192.168.0.116 -p 6379 -a '<novo>' ping   # → PONG
# Meilisearch
curl -H "Authorization: Bearer <novo>" http://192.168.0.116:7700/health
# MinIO
mc alias set local http://192.168.0.116:9000 <user> <senha> && mc ls local
# LiteLLM
curl -H "Authorization: Bearer <novo>" http://192.168.0.116:4000/health/liveliness
```

E o caminho de aplicação: `npm run test:integration` no workstation autorizado
(pretest sobe/valida Postgres+Redis via `prepare-integration-env.js`).

## 5. Validação Negativa (comprovação de invalidação da antiga)

```bash
PGPASSWORD='<antiga>' psql ... -c 'select 1'        # → password authentication failed
redis-cli -h 192.168.0.116 -p 6379 -a '<antiga>' ping  # → NOAUTH/WRONGPASS
curl -H "Authorization: Bearer <antiga>" http://192.168.0.116:7700/health  # → 401
```

**Critério de aceite:** nova credencial autentica em todos os serviços; antiga
rejeitada em todos.

---

## 6. Registro de Conclusão

- Registrar no handoff `15-para-00-rotacao-segredos-devstack-2375.md` a data,
  quais segredos foram rotacionados e o resultado das validações ±.
- Atualizar `docs/security/incidents/` se houver indício de acesso não
  autorizado durante a janela (ver run report §3 — resposta a incidente).
- Nunca registrar valores de segredo neste runbook, em handoffs ou em relatórios.
