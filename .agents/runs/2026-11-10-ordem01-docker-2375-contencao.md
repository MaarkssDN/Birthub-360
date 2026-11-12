# ORDEM 01 — Contenção da exposição Docker 192.168.0.116:2375

**Data:** 2026-11-10 · **Executor:** Agente 00 (coordenação) · **Status:** 🔴 BLOQUEADO — requer operador no host

## 1. Diagnóstico executado (evidências reais)

### Superfície exposta na LAN (port scan executado)

| Porta | Serviço | Bind | Risco |
|---|---|---|---|
| **2375** | **Docker Engine API** | 0.0.0.0 | 🔴 **CRÍTICO — sem auth/TLS** |
| 5434 | Postgres (`birthhub_postgres`) | 0.0.0.0 | 🟡 auth por senha |
| 6379 | Redis (`birthhub_redis`) | 0.0.0.0 | 🟡 requirepass configurado |
| 7700 | Meilisearch | 0.0.0.0 | 🟡 master key |
| 9000/9001 | MinIO | 0.0.0.0 | 🟡 credenciais |
| 4000 | LiteLLM | 0.0.0.0 | 🟡 master key |
| 11434 | Ollama | 0.0.0.0 | 🟡 sem auth nativo |
| 5435/6380 | Stack `birthub_social_*` | 0.0.0.0 | 🟡 auth por senha |
| 22 | SSH | — | ⛔ filtrado (sem admin remoto) |
| 2376 | Docker TLS | — | ⛔ não responde |

`docker ps` (via API não autenticada) mostra apenas containers esperados do
stack dev (postgres, redis, meilisearch, minio, litellm, ollama,
birthub_social_*). Nenhum container estranho observado — **mas isso não
prova ausência de acesso anterior**: a API não mantém audit log de por si.

### Caminho de publicação (hipótese técnica)

Docker Desktop 4.96.3 (Windows/WSL2) **não expõe 2375 em TCP por padrão**.
A exposição na LAN indica um destes mecanismos no host:

1. `netsh interface portproxy` encaminhando `0.0.0.0:2375` →
   `localhost:2375`/WSL — **mais provável**;
2. Docker Desktop → Settings → Resources → "Expose daemon on
   `tcp://localhost:2375` without TLS" combinado com portproxy ou
   WSL mirrored networking;
3. Regra de firewall/NAT manual.

### Acesso administrativo alternativo — VERIFICADO

- `ssh` porta 22 em 192.168.0.116 → **timeout** (filtrado) para todos os
  usuários testados. Não há OpenSSH Server acessível.
- `~/.ssh/Birthub360.pem` existe mas `known_hosts` só contém
  `3.143.251.44` (host AWS) — a chave é da infra cloud, não deste host LAN.
- Não há winrm/PSRemoting evidenciado; credenciais do host não estão no
  repositório (correto).

**Conclusão:** não existe caminho de administração remota a partir deste
workstation. A contenção exige execução **no próprio host 192.168.0.116**
ou liberação de um canal admin (OpenSSH Server, RDP, ou acesso físico).

## 2. Runbook de contenção — executar NO HOST 192.168.0.116

Executar em PowerShell **como Administrador** no host:

### Passo 1 — Identificar a publicação (diagnóstico)

```powershell
netsh interface portproxy show all
Get-NetTCPConnection -LocalPort 2375 -State Listen | Select LocalAddress,LocalPort,OwningProcess
Get-Process -Id (Get-NetTCPConnection -LocalPort 2375 -State Listen).OwningProcess
```

Se `portproxy` mostrar regra `0.0.0.0:2375`, é ela a exposição.

### Passo 2 — Contenção imediata (menor mudança, sem derrubar serviços)

Opção A — remover o portproxy (se existir):

```powershell
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=2375
```

Opção B — firewall: permitir 2375 somente do workstation autorizado:

```powershell
# remove regras conflitantes e cria allowlist
New-NetFirewallRule -DisplayName "Docker2375-Allow-DevOnly" -Direction Inbound `
  -Protocol TCP -LocalPort 2375 -RemoteAddress 192.168.0.179 -Action Allow
New-NetFirewallRule -DisplayName "Docker2375-Block-Others" -Direction Inbound `
  -Protocol TCP -LocalPort 2375 -Action Block
```

> Se o objetivo final é `ssh://`, o passo 2B é a ponte: mantém dev
> funcionando enquanto o SSH não é provisionado.

### Passo 3 — Migração para ssh:// (preferencial, definitivo)

1. No host: instalar/ativar **OpenSSH Server** (recurso Windows opcional)
   ou usar o engine Linux subjacente via WSL.
2. No workstation: `docker context` apontando para
   `ssh://usuario@192.168.0.116` com chave dedicada
   (não reutilizar `Birthub360.pem` da AWS — gerar par novo).
3. Após validar `docker -H ssh://... ps`, remover qualquer exposição
   TCP 2375 (portproxy + regras Docker Desktop).

### Passo 4 — Tratar os demais serviços expostos (mesma lógica)

5434/6379/7700/9000/4000/11434/5435/6380 também estão `0.0.0.0`. Se a LAN
for compartilhada, aplicar o mesmo padrão de firewall allowlist
(`192.168.0.179` + estações de agentes autorizadas). Se a LAN for
confiável/fechada, documentar a decisão de risco aceita.

### Passo 5 — Verificação

Do workstation **após** contenção:

```bash
curl -m 5 http://192.168.0.116:2375/version   # deve falhar (timeout/recusado)
docker ps                                      # deve falhar SE ssh:// ainda não ativo
docker -H ssh://usuario@192.168.0.116 ps       # deve listar containers
npm run test:integration                       # services acessíveis
```

De um host **não autorizado** da LAN: `curl http://192.168.0.116:2375/version`
→ recusado.

## 3. Resposta a incidente — avaliação

- **Registros disponíveis:** Docker Desktop não mantém audit log de API;
  o host Windows pode ter logs de firewall (`Get-NetFirewallRule` +
  auditoria) e Security event log. **Recomendo ao operador:** revisar
  `Windows Security` event logs por logins inesperados e conexões
  inbound na janela de exposição.
- **Sem evidência de comprometimento** nos containers atuais — mas
  ausência de log ≠ ausência de acesso.
- **Rotação de credenciais (decisão do operador/Agente 15):** dado que a
  API Docker esteve aberta, recomenda-se avaliar rotação de:
  `POSTGRES_*`, `REDIS` requirepass, `MEILI_MASTER_KEY`, `LITELLM` master
  key, `BETTER_AUTH_SECRET`, `CREDENTIALS_ENCRYPTION_KEY`,
  `PII_BLIND_INDEX_KEY` — especialmente os que também aparecem em
  `.env`/`.env.test` de workstations. Não executar sem janela planejada
  (quebra sessões/sincronização).

## 4. Estado atual das estações

- Nenhuma alteração feita no host (sem acesso admin — correto não
  presumir).
- Workstation continua com `DOCKER_HOST=tcp://192.168.0.116:2375`
  funcional — dev não foi interrompido, conforme exigido.
- `prepare-integration-env.js` já trata host remoto corretamente.

## 5. Riscos residuais

- Enquanto 2375 seguir aberto: risco máximo na LAN.
- Se portproxy existir e for removido sem substituto ssh://: dev para até
  provisionamento — planejar janela.
- Serviços de dados (PG/Redis/Meili) seguem expostos mesmo após fechar
  2375 — tratar no Passo 4.
