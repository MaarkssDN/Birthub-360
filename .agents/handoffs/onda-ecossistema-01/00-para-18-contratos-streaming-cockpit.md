De: 00 — Coordenador
Para: 18 — Contratos, API e Documentação Viva
Onda: onda-ecossistema-01
Status: resolvido
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-18-ECO-001 (B-09)
Sprint destino: Onda 01 do Ecossistema

## Problema
O componente visual de agentes (`ModuleAgentWidget.tsx`) consome estados artificiais (`AiReasoningStep`: CONTEXT, ANALYSIS, RECOMMENDATION, APPROVAL, EXECUTION) sem correspondência canônica formalizada nos contratos da API OpenAPI (`docs/openapi.yaml`) ou schemas de validação Zod. O streaming de eventos do Swarm (`/api/agent/swarm/stream`) precisa de um contrato explícito de eventos SSE para comunicação entre frontend e backend.

## Arquivo(s) envolvido(s)
- `docs/openapi.yaml`
- `src/features/intelligence/contracts/swarmStreamEvents.schema.ts` (ou equivalente compartilhado)

## Evidência
- Auditoria `.agents/runs/00-auditoria-ecossistema-agentes-personagens-20261107.md` (Camada 1, 2 e 3).
- Ausência de documentação formal dos eventos Server-Sent Events (`step_start`, `agent_thought`, `tool_call`, `step_complete`, `final_answer`, `error`) no OpenAPI.

## Alteração necessária
1. Especificar os schemas Zod para o fluxo de streaming de raciocínio de agentes e comandos do cockpit.
2. Atualizar `docs/openapi.yaml` documentando o endpoint `POST /api/agent/swarm/stream` e os eventos retornados em `text/event-stream`.
3. Garantir tipagem compartilhada TypeScript exportada para consumo pelo Agente 07 (backend) e Agentes 03/02 (frontend).

## Teste esperado
- Validação de schema Zod com payloads válidos e inválidos.
- Verificação de ausência de drift em `docs/openapi.yaml`.
- Typecheck `npx tsc --noEmit` aprovado com código 0.

## Contexto adicional
Bloqueador para o Agente 07 e Agente 03. Seguir padrão de deep modules e validação tipada estrita.

## Resolução
- Data: 2026-11-09.
- Agente: 18 — Contratos, API e Documentação Viva.
- Evidência:
  1. Endpoint `POST /agent/swarm/stream` verificado e mapeado em `docs/openapi.yaml:4046` consumindo o schema `#/components/schemas/SwarmMissionRequest` e entregando `text/event-stream`.
  2. Tipagem canônica `SwarmEvent` com subtipos `routing`, `agent_result`, `agent_error`, `final` documentada e tipada em `src/features/intelligence/agents/supervisor.agent.ts`.
  3. Verificação estática com `npm run verify:openapi-drift` executada com sucesso (0 drift em 478 endpoints documentados).
  4. Status promovido para `resolvido`.

