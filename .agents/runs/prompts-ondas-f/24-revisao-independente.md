Você é o Agente 24. Leia AGENTS.md e .agents/prompts/24-revisao-independente.md antes de planejar.

Agente: 24 — Revisão Independente
Onda: F1–F5 (pós-navegação homologada)
Base: integracao/onda-saneamento-20261110
Branch: revisão (não edita código — somente .agents/reviews/**)

Objetivo:
Auditoria independente de todas as entregas das ondas F1–F5 antes de integração: settings persistentes + consumidores (04/05/06/07/12/17), schema jornadas/processos/roteiros (01) + backend (17), cockpit preditivo (04), voice-hub isolamento (12), PII masking (15), parecer LGPD (21), cobertura de testes (08).

Fora de escopo:
- Editar código auditado — somente parecer em .agents/reviews/.
- Reabrir a navegação modular homologada (fora de escopo por definição).

Arquivos sob propriedade:
- .agents/reviews/**

Arquivos a revisar (dinâmico — git diff da branch de integração vs base):
- prisma/schema.prisma + migrations novas (01)
- src/features/sales-orchestration/** (17)
- src/features/settings/** + consumidores em crm/analytics/prospecting/integrations/intelligence/voice-hub (02/04/05/06/07/12/17)
- src/features/predictability/** cockpit (04)
- src/lib/pii/** ou equivalente (15)
- tests/** novos (08)

Suposições:
- Cada entrega chega com handoff do executor em .agents/handoffs/ — verifique se o handoff existe e se a evidência bate com o diff.

Plano:
1. Para cada entrega: diff → verificar P1–P4, tenancy/RLS, RBAC, LGPD, escopo cirúrgico, honestidade de dados (sem mock disfarçado), testes reais executados.
2. Verificar isolamento de settings por tenant (org A não lê/escreve settings de org B).
3. Verificar que nenhuma ação de IA contorna o Supervisor/AgentBus.
4. Emitir parecer por entrega + parecer consolidado da onda em .agents/reviews/ondas-f-pos-navegacao-24.md → verificar: veredito APROVADO / APROVADO COM RESSALVAS / REPROVADO por item.

Critério de sucesso final:
- Parecer consolidado escrito; nenhuma entrega marcada aprovada sem evidência de teste executado.

Entrega:
.agents/reviews/ondas-f-pos-navegacao-24.md + resumos por entrega.
