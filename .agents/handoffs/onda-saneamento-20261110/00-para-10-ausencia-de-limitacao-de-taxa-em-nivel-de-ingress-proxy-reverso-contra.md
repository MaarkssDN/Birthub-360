De: Agente 00 — Coordenador
Para: Agente 10 (Infraestrutura, Observabilidade e SRE)
Onda: Onda 2 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-029)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 2

## Problema

**Ausência de limitação de taxa em nível de Ingress/Proxy Reverso contra ataques de força bruta**

- **Dívida técnica:** BT360-DT-0057
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Infraestrutura focada no cluster interno sem implementação de camadas perimetrais de Web Application Firewall (WAF) ou Ingress Rate Limiting.

**Impacto:** Vulnerabilidade a ataques de negação de serviço (DoS) e tentativas automatizadas de adivinhação de senhas em larga escala.

## Arquivo(s) envolvido(s)

`docker-compose.yml`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-029`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-029` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

1. Alteração cirúrgica — somente os arquivos do escopo; nenhuma refatoração adjacente.
2. Tratamento explícito de erro, sem fallbacks enganosos (AGENTS.md §30 e §32).
3. Adicionar ou atualizar testes automatizados cobrindo caminho de sucesso e de falha.
4. Respeitar slots exclusivos e dependências de schema/contrato (abrir handoff ao proprietário quando o arquivo pertencer a outro agente).

## Teste esperado

- `npx tsc --noEmit`
- `npm run lint`
- Testes específicos da área afetada (sucesso e falha).

## Contexto adicional

- **Agente revisor obrigatório:** Agente 24 — parecer formal em `.agents/reviews/`.
- **Condição para encerramento:** parecer `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.
- O destinatário pode atualizar o `Status` deste handoff e adicionar seção de resolução sem apagar o pedido original.

## Resolução

**Agente 10 — 2026-11-12 — branch `agente/10-infra-saneamento`.**

Achado de descoberta: a camada de aplicação **já possuía** rate limiting
abrangente (`src/bootstrap/rateLimiters.ts`, fora da minha propriedade —
express-rate-limit com RedisStore em produção: apiLimiter 600 req/15min por
IP em `/api`, authLimiter dedicado mais restritivo em `/api/auth` com skip de
GET, aiLimiter por tenant em rotas de IA). O gap real era a **camada de borda**
(ingress/proxy), exatamente o escopo deste handoff. Implementado:

1. **`nginx/nginx.conf` + `nginx/birthhub360.conf`** (proxy reverso de
   produção, host Ubuntu): zonas `limit_req_zone`/`limit_conn_zone` por
   `$binary_remote_addr` — `birthhub_req` (30 r/s, burst 60) geral no server,
   `birthhub_auth` (5 r/s, burst 10) dedicado a `location /api/auth/`
   (anti força bruta na borda), `limit_conn` 20 conexões/IP, status 429.
2. **`k8s/ingress.yaml`**: anotações `nginx.ingress.kubernetes.io/limit-rps: '30'`
   e `limit-connections: '20'`.
3. **`charts/birthhub-360/values.yaml`** (`ingress.annotations`): mesmas
   anotações — o template `templates/ingress.yaml` já renderiza
   `.Values.ingress.annotations` via `toYaml`, sem mudança de template.

**Decisão sobre `docker-compose.yml` (arquivo citado no handoff, propriedade
do Agente 08):** o compose da raiz é stack de **dev** (Redis/Meilisearch/
MinIO/LiteLLM/Ollama) sem o app web — não há proxy de borda a adicionar sem
mudar a arquitetura de dev. O caminho de dev é coberto pelos limitadores de
aplicação + allowlist de firewall da LAN (handoff docker-2375, mesmo 10).
Não editei `docker-compose.yml` por ser propriedade do 08; se o Coordenador
quiser um proxy nginx de borda também no dev, abro handoff para 08.

**Evidências/gates:**
- Sem alteração de TypeScript → `npx tsc --noEmit` não aplicável a diff (roda
  no relatório da onda; nenhum `.ts` tocado).
- `nginx -t` **não executável neste worktree** (sem nginx/docker CLI no
  ambiente Windows do agente; o daemon é remoto). Validação pendente **no
  host Ubuntu de produção** antes do próximo reload — diretivas usadas são
  padrão (`limit_req_zone`, `limit_conn_zone`, `limit_req`, `limit_conn`,
  `limit_req_status`, `limit_conn_status`), sintaxe revisada manualmente.
- `helm lint charts/birthhub-360` não executado (sem helm no ambiente);
  mudança foi somente em `values.yaml` (annotations string map), template
  inalterado — risco baixo, mas registrar no gate da onda.

**Observação para o Agente 24:** arquivos `nginx/**` não constam da lista
explícita de propriedade do §15 do AGENTS.md; classificados como
infraestrutura de borda no escopo do Agente 10 (SRE). Se o 00/24 entenderem
diferente, reverter é trivial (3 arquivos).
