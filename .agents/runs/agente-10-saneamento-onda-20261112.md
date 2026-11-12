# Relatório — Agente 10 (Infra/SRE) — Saneamento Onda 20261112

**Branch:** `agente/10-infra-saneamento` (worktree `agente-10-infra`, base `origin/main`)
**Data:** 2026-11-12

## Handoffs tratados

### 1. `00-para-10-ausencia-de-limitacao-de-taxa-em-nivel-de-ingress-proxy-reverso-contra.md` → **resolvido**

- Descoberta: rate limiting de aplicação já existia e é abrangente
  (`src/bootstrap/rateLimiters.ts`: apiLimiter 600/15min por IP, authLimiter
  dedicado em `/api/auth`, aiLimiter por tenant, RedisStore em produção).
  O gap era a borda — implementado em 3 camadas versionáveis:
  - `nginx/nginx.conf`: `limit_req_zone` (`birthhub_req` 30r/s,
    `birthhub_auth` 5r/s) + `limit_conn_zone` + `limit_req_status 429`.
  - `nginx/birthhub360.conf`: `limit_conn 20` + `limit_req birthhub_req
    burst=60 nodelay` no server; novo `location /api/auth/` com
    `limit_req birthhub_auth burst=10 nodelay`.
  - `k8s/ingress.yaml` e `charts/birthhub-360/values.yaml`: anotações
    `limit-rps: '30'` / `limit-connections: '20'` do nginx-ingress.
- `docker-compose.yml` (citado no handoff) é propriedade do Agente 08 e é
  stack dev sem app/proxy — não alterado; decisão documentada no handoff.

### 2. `00-para-10-docker-2375-sem-autenticacao.md` → **em-andamento** (bloqueado no host)

- Decisão: `ssh://` definitivo; firewall allowlist como mitigação imediata.
- Entregue (versionável):
  - `infrastructure/security/apply-docker-2375-allowlist.ps1` — idempotente,
    só regras Allow (correção: Block no Windows Firewall teria precedência
    sobre Allow e bloquearia o IP autorizado).
  - `infrastructure/security/DOCKER-REMOTE-DAEMON.md` — decisão + runbook
    completo + pendências humanas.
- Pendente do operador no host 192.168.0.116 (sem acesso admin remoto —
  confirmado na ORDEM 01): executar script, provisionar ssh://, avaliar
  rotação de credenciais (sugestão de handoff ao Agente 15).

## Arquivos alterados

- `k8s/ingress.yaml` — anotações de rate limit
- `charts/birthhub-360/values.yaml` — anotações de rate limit
- `nginx/nginx.conf` — zonas de rate/conn limit
- `nginx/birthhub360.conf` — limit_req/limit_conn + location /api/auth/
- `infrastructure/security/apply-docker-2375-allowlist.ps1` — novo
- `infrastructure/security/DOCKER-REMOTE-DAEMON.md` — novo
- `.agents/handoffs/onda-saneamento-20261110/00-para-10-...md` — status+resolução
- `.agents/handoffs/00-para-10-docker-2375-sem-autenticacao.md` — status+resolução

## Gates

- TS: nenhum `.ts` alterado → `tsc`/`lint`/`build` não aplicáveis ao diff.
- YAML: `k8s/ingress.yaml` e `values.yaml` validados com parser YAML.
- `nginx -t`: **não executável** (sem nginx/docker CLI no ambiente do agente;
  daemon remoto). Pendente `nginx -t` no host Ubuntu antes do reload.
- `helm lint`: sem helm no ambiente; mudança restrita a `values.yaml`
  (mapa de annotations), template inalterado.

## Handoffs de saída / bloqueios para outros agentes

- **Agente 08:** `docker-compose.yml` raiz não foi tocado (propriedade dele).
  Se quiser proxy de borda no dev, abrir handoff.
- **Agente 15 (segurança/rotação):** credenciais potencialmente expostas pela
  API Docker 2375 aberta — avaliar rotação após contenção (registrado em
  `DOCKER-REMOTE-DAEMON.md` Passo 4).
- **Operador (humano):** executar contenção no host 192.168.0.116.
- **Agente 24:** revisão obrigatória dos diffs (condição de encerramento do
  handoff de rate limit).
