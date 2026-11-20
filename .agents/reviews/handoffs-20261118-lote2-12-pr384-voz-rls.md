# Parecer Agente 24 — PR #384 (Agente 12 — status handoffs voz + teste RLS voice-hub)

- Missão: onda saneamento-handoffs-20261118, lote 2
- Autor: Agente 12 | Auditor: Agente 24
- Branch: `agente/12-handoffs-20261117` | Estado: **MERGED** em main (2026-11-18T15:13Z)
- Arquivos: 8 handoffs + `tests/integration/voice-hub-rls.test.ts` (novo, 182 linhas)

## Verificações

- **Teste RLS novo**: cobre `AgentSession`, `Birthub360CallResult` e `Organization` (tenantRepository) com Postgres real — cross-tenant read/write negado, fail-closed sem tenantId, e `bypassRls` **não** abre tabelas de voz.
- **Claims de schema conferidos**: policies `tenant_isolation` em `20260925000000_voice_hub_rls/migration.sql` (AgentSession L47-49) e herdada por `Birthub360CallResult` via rename `20260928125100` (policies acompanham RENAME TABLE) — **nenhuma tem cláusula `app.bypass_rls`**, confirmando o comportamento fail-closed documentado no teste.
- **Assinaturas batem**: `createPhoneSession(orgId, agentId, metadata)`, `findSessionById`, `findActivePhoneSessionByCallSid`, `upsertBirthub360CallResult({callId, organizationId, status, completed, callLength})`, `findTenantById`, `listBirthub360CallResultsForTenant` — todas existem com os shapes usados.
- **Execução**: teste de integração requer Postgres+RLS — não executável neste worktree; depende do job de integração do CI (não verificável localmente). `npx biome check` no arquivo → ignorado pelo biome (tests/integration fora do escopo do lint, padrão do repo).

## Achados

- **Observação (não bloqueante)**: `tests/**` é domínio nominal do Agente 08, mas o handoff `00-para-12-voicehub-teste-integracao-rls.md` pedia explicitamente o teste ao 12 — autorização registrada, conforme §15/§16.
- **Observação**: o teste usa `requestContext.run({ bypassRls: true })` para cleanup de `Organization` — correto, pois policies de voz não admitem bypass; a limpeza por tenant está bem pensada (comentário no `cleanup()`).

## Veredito

**APROVADO** — evidência de execução cabe ao CI de integração; código do teste é correto e as afirmações sobre RLS foram verificadas contra as migrations.
