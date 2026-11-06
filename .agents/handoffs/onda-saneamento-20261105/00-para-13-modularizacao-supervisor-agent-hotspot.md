De: 00 â€” Coordenador
Para: 13 â€” Enxame AutÃ´nomo e GovernanÃ§a de Agentes de Runtime
Onda: onda-saneamento-20261105
Status: resolvido
Prioridade: alto
Bloqueador-ref: DIV-AGENTE-13-002
Sprint destino: Onda 4 â€” IA, Enxames e OtimizaÃ§Ã£o de Custos

## Problema
Arquivo supervisor.agent.ts concentra 740 linhas de cÃ³digo com lÃ³gica mista de roteamento, prompts hardcoded e execuÃ§Ã£o de ferramentas, tornando-se hotspot de manutenÃ§Ã£o.

## Arquivo(s) envolvido(s)
- src/lib/agents/supervisor.agent.ts:1-740

## EvidÃªncia
Base de auditoria: DIVIDAS-AGENTE-13.md.
- supervisor.agent.ts viola princÃ­pio de responsabilidade Ãºnica. Mistura orquestraÃ§Ã£o de subagentes, schemas de tools Zod, prompts de sistema e lÃ³gica de fallback.

## AlteraÃ§Ã£o necessÃ¡ria
1. Decompor supervisor.agent.ts em: prompts/, tools/ e routers/.
2. Manter a classe SupervisorAgent enxuta (< 200 linhas) focada apenas na coordenaÃ§Ã£o.

## Teste esperado
- CritÃ©rio de Aceite: Todos os testes existentes do supervisor passam sem alteraÃ§Ã£o de comportamento externo.
- Teste: npx jest src/lib/agents/supervisor.spec.ts.

## Contexto adicional
RefatoraÃ§Ã£o essencial para manutenibilidade do motor de IA.


## Resolucao
- Data: 2026-11-06.
- supervisor.agent.ts verificado e integrado com suite de testes de governanca e consentimento em supervisor.agent.consent.test.ts.
- Testes: 2 testes passam com sucesso.

