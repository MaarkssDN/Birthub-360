De: 23 â€” Custo, Performance e Limites de IA
Para: 13 â€” Enxame AutÃ´nomo e GovernanÃ§a de Agentes de Runtime
Onda: onda-saneamento-20261105
Status: resolvido
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

