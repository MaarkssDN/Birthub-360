De: 00 — Coordenador
Para: 13 — Enxame Autônomo e Governança de Agentes de Runtime
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-13-002
Sprint destino: Onda 4 — IA, Enxames e Otimização de Custos

## Problema
Arquivo supervisor.agent.ts concentra 740 linhas de código com lógica mista de roteamento, prompts hardcoded e execução de ferramentas, tornando-se hotspot de manutenção.

## Arquivo(s) envolvido(s)
- src/lib/agents/supervisor.agent.ts:1-740

## Evidência
Base de auditoria: DIVIDAS-AGENTE-13.md.
- supervisor.agent.ts viola princípio de responsabilidade única. Mistura orquestração de subagentes, schemas de tools Zod, prompts de sistema e lógica de fallback.

## Alteração necessária
1. Decompor supervisor.agent.ts em: prompts/, tools/ e routers/.
2. Manter a classe SupervisorAgent enxuta (< 200 linhas) focada apenas na coordenação.

## Teste esperado
- Critério de Aceite: Todos os testes existentes do supervisor passam sem alteração de comportamento externo.
- Teste: npx jest src/lib/agents/supervisor.spec.ts.

## Contexto adicional
Refatoração essencial para manutenibilidade do motor de IA.
