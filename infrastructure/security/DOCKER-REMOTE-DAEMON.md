# Docker daemon remoto sem autenticação — 192.168.0.116:2375

**Status:** 🔴 exposição ativa — contenção versionada pronta, **aplicação pendente do operador no host**.
**Handoff:** `.agents/handoffs/00-para-10-docker-2375-sem-autenticacao.md`
**Diagnóstico:** `.agents/runs/2026-11-10-ordem01-docker-2375-contencao.md`
**Decisão (Agente 10, 2026-11-12):** Opção 2 (`ssh://`) como alvo definitivo; Opção 1 (firewall allowlist) como mitigação imediata.

## Contexto

O Docker Desktop do host `192.168.0.116` (Windows/WSL2) expõe a Engine API em
TCP 2375 **sem TLS e sem autenticação** na LAN `192.168.0.0/24`. Qualquer host
da rede pode criar containers privilegiados e ler volumes (Postgres, Redis,
Meilisearch de dev/teste). Não há canal administrativo remoto (SSH/WinRM
filtrados) — **toda ação no host exige execução local ou acesso físico**.

## O que já está versionado (este diretório)

| Arquivo | Função |
|---|---|
| `apply-docker-2375-allowlist.ps1` | Mitigação imediata: regras de firewall Windows permitindo TCP 2375 somente dos IPs autorizados (default `192.168.0.179`). Idempotente, roda no host como Administrador. |
| `verify-docker-2375-restriction.sh` | Verificação pós-mitigação: roda de qualquer host da LAN e confirma se a porta 2375 está bloqueada ou respondendo (`--expect blocked` / `--expect allowed`). |

## Runbook para o operador (no host 192.168.0.116)

### Passo 0 — Diagnóstico (PowerShell admin)

```powershell
netsh interface portproxy show all
Get-NetTCPConnection -LocalPort 2375 -State Listen | Select LocalAddress,OwningProcess
```

Identifica se a exposição vem de `portproxy` (hipótese mais provável) ou de
configuração do Docker Desktop.

### Passo 1 — Mitigação imediata (faixa de minutos, sem derrubar dev)

```powershell
.\infrastructure\security\apply-docker-2375-allowlist.ps1
# ou com estações adicionais autorizadas:
.\apply-docker-2375-allowlist.ps1 -AllowedIPs 192.168.0.179,192.168.0.50
```

O script só cria regras **Allow** — o inbound default do Windows já bloqueia o
resto (regra Block genérica teria precedência sobre Allow e quebraria o acesso
autorizado).

Verificação (script versionado, roda de qualquer host da LAN):

```bash
# de um IP NÃO autorizado — deve reportar BLOQUEADO (exit 0):
./infrastructure/security/verify-docker-2375-restriction.sh --expect blocked

# do workstation autorizado — deve reportar EXPOSTO/acesso OK (exit 0):
./infrastructure/security/verify-docker-2375-restriction.sh --expect allowed
```

Equivalente manual:

```powershell
# de IP não autorizado (outro host da LAN):
curl http://192.168.0.116:2375/version        # deve dar timeout/recusado
# do workstation autorizado:
docker -H tcp://192.168.0.116:2375 ps          # deve listar containers
```

### Passo 2 — Migração definitiva para ssh:// (preferencial)

1. Instalar/ativar **OpenSSH Server** no host (recurso Windows opcional).
2. Gerar par de chaves dedicado no workstation (não reutilizar
   `~/.ssh/Birthub360.pem` — é da infra AWS).
3. No workstation: `docker context` apontando para
   `ssh://usuario@192.168.0.116`.
4. Validar `docker -H ssh://usuario@192.168.0.116 ps`, depois **remover** a
   exposição TCP 2375 (portproxy + eventuais regras do Docker Desktop).

### Passo 3 — Demais portas expostas na LAN

`5434` (Postgres), `6379` (Redis), `7700` (Meilisearch), `9000/9001` (MinIO),
`4000` (LiteLLM), `11434` (Ollama), `5435/6380` (birthub_social_*) também
escutam em `0.0.0.0`. Mesmo padrão de allowlist se a LAN for compartilhada;
se for fechada/confiável, registrar decisão de risco aceita.

### Passo 4 — Resposta a incidente

- Revisar Security event log / auditoria de firewall do host na janela de
  exposição (Docker Engine API não mantém audit log próprio).
- **Avaliar rotação de credenciais** (handoff para Agente 15 — Privacidade/
  Segurança): `POSTGRES_*`, `REDIS` requirepass, `MEILI_MASTER_KEY`,
  `LITELLM` master key, `BETTER_AUTH_SECRET`,
  `CREDENTIALS_ENCRYPTION_KEY`, `PII_BLIND_INDEX_KEY` — todos legíveis por
  quem acessasse a API. Janela planejada (quebra sessões/sincronização).

## O que NÃO depende do host (já OK)

- `scripts/test/prepare-integration-env.js` já reescreve hosts de serviço
  para o host do `DOCKER_HOST` — funciona igual com `tcp://` ou `ssh://`.
- `.env`/`.env.test` são gitignored; ao migrar para `ssh://`, basta trocar
  `DOCKER_HOST` localmente (o host remoto continua o mesmo).
