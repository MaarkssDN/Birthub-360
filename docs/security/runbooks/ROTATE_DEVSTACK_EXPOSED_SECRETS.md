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
container deve ser confirmada no Passo 0:

| Segredo | Variáveis | Serviço(s) |
|---|---|---|
| Senha do Postgres | `POSTGRES_PASSWORD`, `APP_DB_PASSWORD` | postgres + todos os serviços que compartilham o banco |
| Senha do Redis | `REDIS_PASSWORD` | redis, chatwoot, plane, infisical |
| Chave do Meilisearch | `MEILI_MASTER_KEY` | meilisearch |
| Credenciais do MinIO | `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` | minio |
| Chave do LiteLLM | `LITELLM_MASTER_KEY` | litellm |
| Segredos da aplicação | `BETTER_AUTH_SECRET`, `CREDENTIALS_ENCRYPTION_KEY`, `PII_BLIND_INDEX_KEY` | somente se presentes em env/volume de container no host 116 |

> **Nota honesta de escopo:** os defaults dos composes (`prospector_pass`,
> `prospector_redis_pass`, `birthhub_meili_master_key`,
> `birthhub_minio_dev_only`, `sk-birthhub-master`) são documentados como
> dev-only e não devem existir fora da máquina local — ver
> `docs/security/incidents/SEC-2026-001-historical-tag-exposure.md`. Se o host
> 116 usa esses defaults, a rotação é trivial (basta trocar para valores
> fortes); se usa valores reais compartilhados com homologação/produção,
> aplicar a rotação completa abaixo **e** verificar se os mesmos valores estão
> em produção antes de prosseguir — nesse caso trate como incidente de
> credencial de produção, não de dev.

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
docker ps -aq | xargs -I{} docker inspect {} --format '{{.Name}} {{range .Config.Env}}{{println .}}{{end}}'
```

Cruzar a saída com a tabela da seção 1. Registrar quais segredos estavam
presentes em env de container **e** quais estão em arquivos montados como
volume (ex.: `.env` bind-mount). **Não copiar valores para tickets, logs ou
relatórios** — registrar apenas nomes de variáveis.

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
# MinIO
openssl rand -base64 24   # → MINIO_ROOT_USER (alfanumérico) e MINIO_ROOT_PASSWORD
# LiteLLM
openssl rand -hex 32      # → novo LITELLM_MASTER_KEY
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
meilisearch → minio → litellm.

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
