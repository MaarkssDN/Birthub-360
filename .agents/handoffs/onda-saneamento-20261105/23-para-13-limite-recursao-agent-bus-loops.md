De: 23 — Custo, Performance e Limites de IA
Para: 13 — Enxame Autônomo e Governança de Agentes de Runtime
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-13-001
Sprint destino: Onda 4 — IA, Enxames e Otimização de Custos

## Problema
Barramento de comunicação entre agentes autônomos (agentBus.ts) não possui trava de recursão (maxHops), permitindo loops infinitos de mensagens entre agentes e explosão de custos de tokens.

## Arquivo(s) envolvido(s)
- src/lib/agents/agentBus.ts:80-120

## Evidência
Base de auditoria: DIVIDAS-AGENTE-23.md e DIVIDAS-AGENTE-13.md.
- agentBus.ts (L80-120): Agente A envia mensagem que aciona Agente B, que responde ao Agente A. Não há contador de hops nem chave de rastreabilidade de correlação.
- Risco severo de looping com chamadas contínuas de LLM.

## Alteração necessária
1. Incluir metadados obrigatórios em todas as mensagens do barramento: correlationId, hopCount (default 0) e traceParent.
2. Interromper a cadeia e emitir alerta crítico se hopCount > 5.

## Teste esperado
- Critério de Aceite: Loop simulado entre dois agentes é interrompido com erro LoopDetectedException no quinto hop.
- Teste: agentBus-recursion-limit.spec.ts.

## Contexto adicional
Controle de custos de API de IA e estabilidade do enxame.
