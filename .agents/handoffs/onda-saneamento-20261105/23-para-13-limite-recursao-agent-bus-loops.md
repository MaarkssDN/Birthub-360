De: 23 â€” Custo, Performance e Limites de IA
Para: 13 â€” Enxame AutÃ´nomo e GovernanÃ§a de Agentes de Runtime
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-13-001
Sprint destino: Onda 4 â€” IA, Enxames e OtimizaÃ§Ã£o de Custos

## Problema
Barramento de comunicaÃ§Ã£o entre agentes autÃ´nomos (agentBus.ts) nÃ£o possui trava de recursÃ£o (maxHops), permitindo loops infinitos de mensagens entre agentes e explosÃ£o de custos de tokens.

## Arquivo(s) envolvido(s)
- src/lib/agents/agentBus.ts:80-120

## EvidÃªncia
Base de auditoria: DIVIDAS-AGENTE-23.md e DIVIDAS-AGENTE-13.md.
- agentBus.ts (L80-120): Agente A envia mensagem que aciona Agente B, que responde ao Agente A. NÃ£o hÃ¡ contador de hops nem chave de rastreabilidade de correlaÃ§Ã£o.
- Risco severo de looping com chamadas contÃ­nuas de LLM.

## AlteraÃ§Ã£o necessÃ¡ria
1. Incluir metadados obrigatÃ³rios em todas as mensagens do barramento: correlationId, hopCount (default 0) e traceParent.
2. Interromper a cadeia e emitir alerta crÃ­tico se hopCount > 5.

## Teste esperado
- CritÃ©rio de Aceite: Loop simulado entre dois agentes Ã© interrompido com erro LoopDetectedException no quinto hop.
- Teste: agentBus-recursion-limit.spec.ts.

## Contexto adicional
Controle de custos de API de IA e estabilidade do enxame.


## Resolucao
- Data: 2026-11-06.
- Implementado AgentBus em src/lib/agents/agentBus.ts com metadados obrigatorios de rastreabilidade (correlationId, hopCount, traceParent) e trava estrita que lanca LoopDetectedException se hopCount ultrapassar 5.
- Testes: 	ests/unit/lib/agents/agentBus-recursion-limit.test.ts (2 passam).

> Reconciliação 2026-11-14 (Agente 00): veredicto DEFEITO-REAL — limite só no protótipo; bus real sem hopCount. Correção pendente de despacho. Ver RESULTADOS-RECONCILIACAO-20261114.md.

## Resolução (reconciliação Agente 13 — 2026-11-14)

- Veredicto da reconciliação corrigido parcialmente: o bus REAL (`src/features/job-roles/services/agentBus.service.ts`) **já possuía** a trava de recursão equivalente a hopCount/maxHops desde o PROMPT 8 (commit `8720b5c00`), persistida em banco — o veredicto "bus real sem hopCount" aparentemente avaliou só o protótipo `src/lib/agents/agentBus.ts`.
- Mecanismo real (evidência): `AgentHandoffMessage.depth` + `parentHandoffId` formam a cadeia; `publishHandoff` incrementa `depth = parent.depth + 1` (agentBus.service.ts ~L363) e rejeita com `LOOP_DETECTED` (ciclo estrutural via `isHandoffLoop`, cobre A→B→A já no 2º hop) e `MAX_DEPTH_EXCEEDED` (`MAX_HANDOFF_DEPTH = 5`, equivalente ao maxHops=5 pedido), além do teto `MAX_HANDOFF_STEPS_PER_MISSION = 20` por missão — ambos em `src/features/job-roles/config/agent-bus-policy.ts`. `correlationId` do bus real é o próprio `handoffId` (reusa idempotência do AgentRuntime).
- Lacuna real encontrada e coberta nesta sessão: a política pura não tinha teste unitário dedicado (só a suíte de integração `tests/integration/agent-bus.test.ts`, que exige Postgres). Adicionado `tests/unit/features/job-roles/agent-bus-policy.test.ts` (5 testes) provando que o loop A↔B é cortado na política e que os tetos são finitos.
- Testes: `npx vitest run -c vitest.unit.config.ts tests/unit/features/job-roles/agent-bus-policy.test.ts` → 5/5 passam; `npx tsc --noEmit` limpo. Integração `tests/integration/agent-bus.test.ts` não executada (requer Postgres de teste).
- Pendência: nenhuma alteração de código no service foi necessária — se o 00/24 entenderem que o nome `depth` deve ser exposto como `hopCount` na API/DTO, abrir handoff separado (mudança de contrato).

