De: 00 — Coordenador
Para: 12 — Voz e Telefonia
Onda: 3
Status: aberto
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
