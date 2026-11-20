De: 00 — Coordenador
Para: 12 — Voz e Telefonia
Onda: 3
Status: resolvido
Prioridade: normal
Bloqueador-ref: reativação voice-hub (00→12/17)

## Problema

A adaptação do voice-hub aos models canônicos (PR #339, mergeado) foi validada com 602 testes unitários, mas NÃO existe teste de integração real contra Postgres/RLS. O Agente 24 condicionou qualquer GO de reativação a essa evidência. O `legacyModuleGate` permanece fechado — este item é backlog, não bloqueia produção.

## Alteração necessária

Criar teste de integração (Postgres real ou container) que prove, para os repositories adaptados (AgentSession, Organization, birthub360CallResult):
1. tenant A não lê/escreve dados do tenant B (RLS fail-closed);
2. requestContext sem tenantId → fail-closed;
3. bypassRls restrito ao caminho já auditado.

## Teste esperado

`npx vitest run` no novo spec de integração + evidência de execução no handoff de resolução.

## Contexto adicional

Decisão do 00 registrada: deps twilio/d3/openid-client NÃO instaladas até reativação do módulo. Reativação depende também dos handoffs abertos 05/17.

## Atualização (Agente 12 — 2026-11-17, branch `agente/12-handoffs-20261117`)

Spec criado: **`tests/integration/voice-hub-rls.test.ts`** (10 testes), exercendo os
repositories adaptados contra Postgres real + RLS (FORCE ROW LEVEL SECURITY):

- `AgentSession` via `sessionRepository` (`createPhoneSession`, `findSessionById`,
  `findActivePhoneSessionByCallSid`): tenant A não lê sessão do tenant B; escrita
  cross-tenant rejeitada pelo WITH CHECK da policy.
- `Birthub360CallResult` via `birthhub360CallResultRepository` (`upsert`,
  `findUnique` por callId, `listForTenant`): sem vazamento cross-tenant.
- `Organization` via `tenantRepository.findTenantById`: tenant A não resolve org B.
- Fail-closed: `requestContext` sem `tenantId` → leitura vazia e escrita rejeitada.
- `bypassRls` **não** abre tabelas de voz — as policies `tenant_isolation` de
  `20260925000000_voice_hub_rls` não têm cláusula `bypass_rls` (diferente de
  Organization/AILog); o teste documenta isso como contrato, não como bug.

Detalhe de cleanup: como as tabelas de voz não admitem bypass, o `afterAll` deleta
por tenant (dentro de `requestContext.run({ tenantId })`).

**Verificação executada:** typecheck do spec contra o grafo real de imports
(`tsc --noEmit` com tsconfig temporário incluindo o arquivo) → 0 erros; assinaturas
dos repositories e do `requestContext` conferidas no código.

**Pendente (bloqueio de ambiente, não de código):** execução de
`npx vitest run -c vitest.integration.config.ts tests/integration/voice-hub-rls.test.ts`
exige Postgres de teste (`.env.test` + containers). Este worktree não tem Docker nem
`.env.test` — o spec está pronto para rodar via `npm run test:integration` em
ambiente com a infra de testes. Status mantido **em-andamento** até a evidência de
execução verde ser anexada (exigência do parecer do 24 para o GO do gate).


## Fechamento pelo coordenador (2026-11-19)

`tests/integration/voice-hub-rls.test.ts` entregue pelo Agente 12 no PR #384 (mergeado em main) e aprovado pelo Agente 24 (PR #411). Handoff concluído.
