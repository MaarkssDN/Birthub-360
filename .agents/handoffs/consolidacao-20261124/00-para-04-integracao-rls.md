De: 00 — Astra
Para: 04 — Téo (Testes de Integração e Contratos)
Onda: Consolidação DEM-20261123-001 (pós-Onda 3)
Status: aberto
Prioridade: bloqueador para RELEASE_APPROVED (não para integração local)
Bloqueador-ref: gates de integração/RLS não executados na Onda 2 e Onda 3
Sprint destino: ciclo imediato

## Problema

Os gates `npm run test:integration` (suíte vitest.integration com Postgres real + RLS) e verificações de tenancy não foram executados sobre os SHAs combinados `a81c63ccc` (Onda 2) nem sobre o candidato de consolidação Onda 3. Causa: ambiente local sem Docker utilizável (daemon remoto TCP 2375 indisponível/proibido) e Postgres 127.0.0.1:5432 recusando conexão.

As alterações do Agente 04 na Onda 2 (timeouts 120s, ordem de deleção FK, `prospecting-rls`) e as entregas da Onda 3 que tocam tenancy/RLS (10, 13, 21, 43, 44, 50, 96, 97) **não têm evidência de integração** — apenas unitários e typecheck.

## Arquivo(s) envolvido(s)

- `tests/integration/**` (propriedade Agente 04)
- `vitest.integration.config.ts`, `scripts/test/prepare-integration-env.js`
- Candidato: `integracao/consolidacao-dem20261123-candidato` @ `c6433d089` (ou SHA mais recente da linha global)

## Evidência

- Onda 2: `test:integration` não executado — Postgres indisponível; unit/build/typecheck/lint/architecture verdes.
- Onda 3 (registro `.agents/runs/REGISTRO_GLOBAL_100_AGENTES_20261124.md`): testes de integração `cadenceRun.worker`/`cadence-*.routes` não executáveis por ausência de Postgres (`:5434`) e Redis (`:6379`) — limitação de ambiente já registrada.

## Alteração necessária

1. Provisionar ambiente autorizado com Docker (daemon local ou remoto autorizado — NUNCA TCP 2375) e Postgres/Redis/Meilisearch de teste.
2. Executar `npm run test:integration` completo sobre o SHA candidato consolidado; capturar falhas reais vs flakes.
3. Executar verificações RLS/tenancy (`scripts/security/*rls-coverage.ts` ou equivalente) e `npm run setup:db:check`.
4. Se falhas aparecerem: reproduzir isoladamente, classificar (regressão vs ambiente vs pré-existente com evidência de baseline), e abrir handoffs por domínio.
5. Registrar resultados em `.agents/runs/` com SHAs e comandos exatos.

## Teste esperado

- `npm run test:integration` com resultado explícito (pass/fail por arquivo) sobre o SHA candidato.
- Zero falhas atribuíveis às entregas das Ondas 2 e 3, ou handoffs corretivos abertos por achado.

## Contexto adicional

- Procedimento completo documentado em `tests/AGENTS.md` §"Procedimento reproduzível" — inclui trava `assertTestDatabaseSafety` (sufixo `_test` obrigatório) e containers compartilhados `birthhub_postgres/redis/meilisearch`.
- Se o ambiente Docker não estiver disponível neste host, coordenar com Agente 10 (Infra/SRE) ou executar via CI — não declarar gate verde sem execução real.
