# Parecer Agente 09 — Silas · Agente 93 (Max) · Docker/Containers Hardening (Squad 90) · DEM-20261123-001

- **Auditor:** Agente 09 — Silas (Auditoria Independente, Squad 00)
- **Entregador:** Agente 93 — Max (Squad 90, Infra/SRE/Segurança)
- **Branch auditada:** `agente/93-docker-hardening-s90`
- **SHA congelado (tip = HEAD do worktree):** `c14faef15c0589b8529ad6656e2843c6816d1aa0`
- **Base:** `5422d99c3e` (`integracao/onda-3-dem20261123`)
- **Worktree auditado:** `C:/Github/Birthub-360-worktrees/squads/squad-90/wt-93` (HEAD confirmado = SHA congelado)
- **Run doc:** `.agents/runs/squads/squad-90-run-93.md` · **Handoff:** `.agents/handoffs/squad-90/93-para-90-docker-hardening-e-gaps-20261124.md`
- **Data:** 2026-11-24
- **Veredito: APROVADO** — todas as claims verificadas de forma independente; pendências são de roteamento/governança (ownership de overlays, docs defasados, runbook inexistente), não de correção de código.

---

## 1. Escopo do diff (verificado, não confiado)

`git diff 5422d99c3e..c14faef15c --stat`: **6 arquivos, +227/−14** — Dockerfile, docker-compose.yml, 1 teste novo, run doc, handoff, lease. Nenhum arquivo fora do escopo.

| Arquivo | Natureza | Ownership |
|---|---|---|
| `Dockerfile` | EDITADO (pin digest nos 2 estágios) | Agente 93 — `Dockerfile` na `MATRIZ_PROPRIEDADE.md:137` — **confirmado** |
| `docker-compose.yml` | EDITADO (bind 127.0.0.1 + pins) | Agente 93 — `docker-compose.yml` na mesma linha — **confirmado** |
| `tests/unit/ci/docker-hardening.test.ts` | NOVO (77 linhas, 8 testes) | Co-propriedade governada `tests/unit/**` (matriz linha 11): especialista pode criar teste dedicado ao próprio módulo sob revisão do 09 — **confirmado** |
| `.agents/handoffs/...`, `.agents/runs/...`, `.agents/runs/leases/...` | NOVO | Artefatos de execução permitidos |

**P3 (cirúrgico): OK.** Diff cirúrgico: comentários explicativos + `@sha256:` + prefixo `127.0.0.1:`. Nenhuma refatoração adjacente.

## 2. Verificação das claims (evidência primária do auditor)

| Claim | Verificação independente | Resultado |
|---|---|---|
| Pin `node:22-slim` por digest nos 2 estágios | Diff confirma `@sha256:be979e55…` idêntico em builder e runner + comentário de atualização | **CONFIRMADO** |
| 7 portas com bind `127.0.0.1` | `docker compose config` renderizado por mim: `host_ip: 127.0.0.1` em **todas** as 7 portas (6379, 7700, 9000, 9001, 4000, 11434); grep confirma 6 linhas de porta, todas `127.0.0.1:` | **CONFIRMADO** |
| Digests verificados no Hub/GHCR | Consultei Docker Hub API **nesta auditoria**: `redis:7-alpine` tag digest = `sha256:7f7d30b7…` **idêntico ao pinado**; `getmeili/meilisearch:v1.6` manifest digest = `sha256:634e83ff…` **idêntico**; `elestio/minio:latest` tag digest = `sha256:25348a25…` **idêntico**. Formato `sha256:`+64hex válido em todos | **CONFIRMADO** |
| `ollama/ollama:0.40.18`, `alpine:3.21` | Presentes no compose; semver em vez de `latest` — melhoria real | **CONFIRMADO** |
| `docker compose config` OK | Executei com vars dummy: exit 0, render confirma pins e `host_ip` | **CONFIRMADO** |
| `verify-docker-context.mjs` PASS | Executei: `PASS: contexto Docker exclui .worktrees/.tmp/tmp/temp/*.tmp e preserva migrations e fontes` | **CONFIRMADO** |
| vitest 14/14 | Executei `npx vitest run tests/unit/ci/docker-hardening.test.ts tests/unit/ci/dockerfile-prisma-pin.test.ts` no wt-93: **14/14 PASS** (2 arquivos, 8+6 testes) | **CONFIRMADO** |
| Runbook P0-07 não existe | `ls docs/security/runbooks/` (12 runbooks, nenhum P0-07) + `git log --all -- '**/P0-07*'` vazio; artefatos reais são `docs/security/AUDITORIA_DOCKER_P007_ONDA2_20261123.md` + gate no Dockerfile + `nginx/birthhub360.conf`. O agente **reportou corretamente** a inexistência em vez de fabricar evidência | **CONFIRMADO** |
| Credencial literal `prospector:prospector_pass` | Verificado: `docker-compose.opensource.yml:15` (`DATABASE_URL` do langfuse) e `:21` — literal versionada, dev-only, mas real. Handoff §3.2 reporta corretamente | **CONFIRMADO** |

## 3. Análise de risco das decisões

1. **Bind `127.0.0.1` não quebra uso legítimo:** a stack é explicitamente dev-local (comentários no compose: "uso local/dev", "não reusar para produção"). Containers do próprio compose comunicam-se pela rede interna por nome de serviço — não passam pelas portas publicadas. Dev que precise acessar de outra máquina da LAN precisará de SSH tunnel ou override de compose — trade-off correto de segurança (antes: Redis/MinIO/LiteLLM/Ollama/Meili expostos a `0.0.0.0` com senhas default fracas). **Decisão correta.**
2. **Pin de digest em `latest` (minio):** `elestio/minio` só publica `latest` (verificado: tags do repo). O pin por digest é a **única** forma de reproduzir a imagem — estritamente melhor que `:latest` solto. Risco residual: quando o upstream mover `latest`, o pin congela a versão antiga — isso é o comportamento desejado para supply-chain; a "atualização" passa a ser deliberada via bump do digest (instrução documentada nos comentários). Aceitável e documentado no run doc §Riscos.
3. **Teste estático como gate:** transformou as decisões de hardening em regressão executável (sem daemon Docker). O teste de portas usa heurística de regex sobre linhas `host:container` — cobre o formato atual do arquivo; se alguém publicar porta sem bind no futuro, o teste falha. Adequado.
4. **P0-07:** o gate de build (`test ! -e dist/tools…` + asserção SW precache) já existia no Dockerfile — o agente auditou e confirmou, não duplicou trabalho (regra §34). Correto.

## 4. Achados fora do ownership — roteamento ao Agente 00 (não bloqueiam o parecer)

O handoff §3 é **legítimo e preciso** — verifiquei cada item:

1. **Overlays compose sem dono na matriz** — CONFIRMADO. `MATRIZ_PROPRIEDADE.md:137` lista para o 93 apenas `Dockerfile`, `docker-compose.yml`, `infrastructure/docker/**`. Os 4 overlays (`services`, `opensource`, `postgres-local`, `qdrant`) + `docker/postgres/Dockerfile` não têm dono registrado. Achados de segurança reais nos overlays: `qdrant/qdrant:latest`, `pgvector/pgvector:pg17` (tag móvel), `grafana/k6:latest`, `aquasec/trivy:latest`, `alpine:latest`, dezenas de `:latest` no services, defaults de senha (`change-this-*`, `prospector_app_pass`, `devkey`), credencial literal `prospector:prospector_pass` em `DATABASE_URL` do langfuse (opensource.yml:15), LiveKit `--dev`. **Ação requerida do coordenador:** registrar dono (sugestão do agente: 93 para compose*, 10 para `docker/postgres/**`) e despachar hardening.
2. **`docker/AGENTS.md` defasado** — CONFIRMADO: texto local refere "Agente 08"/"Agente 10" (numeração legada) vs. matriz vigente (93). Reconciliar.
3. **Runbook P0-07 citado na missão não existe** — CONFIRMADO. Se a missão esperava runbook formal de rollout, precisa ser criado (docs/ é domínio do Agente 08/Dora) ou o nome do arquivo estava errado na missão. Nenhum gap de P0-07 restante nos arquivos do 93.
4. **Decisão de não endurecer defaults `:-`→`:?`** (redis/meilisearch) — correta e justificada: `.env.example` deixa `MEILI_MASTER_KEY=` vazio; `:?` quebraria workflow de dev. Mantido `:?` apenas onde já existia (minio/litellm). Cirúrgico.

## 5. Conformidade AGENTS.md

- **P1:** descoberta antes de implementar — auditoria prévia documentada, comparação com P0-07, gaps roteados em vez de editados fora do ownership.
- **P2/P3:** mínimo código necessário; diff cirúrgico.
- **P4:** critérios verificáveis — compose config, verify script, vitest, YAML parse. `docker build`/`run` corretamente não executados (daemon indisponível; proibido pela missão).
- **§33/§34:** não houve "auditoria sem correção" — gaps reais corrigidos dentro do ownership; gaps fora viraram handoff formal.
- **§36/§40:** entrega auditada por mim (Silas) antes do gate de integração.

## 6. Decisão de gate

**STATUS: APROVADO.**

A entrega cumpre a missão: Dockerfile e docker-compose.yml endurecidos com evidência reproduzível (pins verificados por mim na Docker Hub API nesta data), regressão em teste unitário, handoff honesto sobre gaps fora do escopo e inexistência do runbook citado. Pendências de roteamento (§4) ficam registradas para decisão do Agente 00 — **nenhuma é defeito de código do Agente 93**.

*Assinado digitalmente por: Agente 09 — Silas (Auditor Independente)*
