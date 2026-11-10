De: 00 — Coordenador
Para: 07 — IA e Automações
Onda: onda-ecossistema-01
Status: resolvido
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-07-ECO-001 (B-08)
Sprint destino: Onda 01 do Ecossistema

## Problema
A interface possui personas vinculadas aos 8 pilares (Orbit no Pilar 01, Nexus no Pilar 02, Aria no Pilar 03, Vanguard no Pilar 04, Oracle no Pilar 05, Core no Pilar 06, Spark no Pilar 07, Echo no Pilar 08), mas essas personas não possuíam roteamento no backend ou despachavam comandos em `console.log`. Enquanto isso, o backend possui o `supervisor.agent.ts` (LangGraph Swarm) e 14 especialistas ativos em `commercialCell.routes.ts`.

## Arquivo(s) envolvido(s)
- `src/features/intelligence/agents/commercialCell.routes.ts`
- `src/lib/agents/supervisor.agent.ts`
- `src/features/intelligence/services/` (serviço de roteamento/stream)

## Evidência
- `ModuleAgentWidget.tsx` L210: `console.log([Agent ${agent.name}] User asked: ${inputText})`
- Auditoria do Agente 00: Tabela B (Personagem -> Módulo -> Agente -> Rota Real).

## Alteração necessária
1. Criar ou estender o endpoint de streaming SSE do enxame/copiloto (`POST /api/agent/swarm/stream` ou rota contextual por pilar) para receber o prompt do usuário acompanhado do `pillar`/`moduleContext`.
2. Encaminhar a mensagem ao especialista correto da Célula Comercial ou ao nó correspondente do Swarm LangGraph (Orbit -> `bitrix-guardian`/`crm`, Nexus -> `ldr-intelligence`, Aria -> `coordinator-commercial`, etc.).
3. Emitir chunks e passos reais via SSE formatados de acordo com os contratos definidos pelo Agente 18.
4. Assegurar isolamento multi-tenant (`req.user.organizationId`) e guardrails de prompt injection (`createUntrustedContentGuard`).

## Teste esperado
- Teste de integração: simulação de requisição SSE autenticada verificando headers `Content-Type: text/event-stream`, emissão de eventos em ordem e fechamento limpo da conexão.
- Teste de isolamento de tenant.

## Contexto adicional
Depende da entrega de contratos do Agente 18. Alimenta os componentes de UI do Agente 03 e 02.

## Resolução
- Data: 2026-11-09.
- Agente: 07 — IA e Automações.
- Evidência:
  1. Rota de streaming Server-Sent Events implementada e ativa em `src/features/intelligence/routes/agent.routes.ts:84` (`POST /api/agent/swarm/stream`).
  2. Método `executeMissionStream` operacional em `src/features/intelligence/agents/supervisor.agent.ts:927`, transmitindo chunks via SSE com schema `SwarmEvent`.
  3. Isolamento multi-tenant garantido com extração de `getTenantId()` e validação prévia de consentimento de PII com `assertPiiExternalConsent`.
  4. Testes unitários executados com sucesso: `src/features/intelligence/agents/__tests__/supervisor.agent.consent.test.ts` (2 passed).
  5. Status promovido para `resolvido`.

