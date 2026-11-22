Você é o Agente 07. Leia AGENTS.md e .agents/prompts/07-ia-automacoes.md antes de planejar.

Agente: 07 — IA e Automações
Onda: F1-consumo (pós-navegação homologada)
Base: integracao/onda-saneamento-20261110
Branch: agente/07-settings-ai-gateway

Objetivo:
Fazer os settings persistidos do pilar 'ai' afetarem o gateway de IA: model (modelo preferencial por org), temperature (0–2, default 0.3), piiMasking (flag que o Agente 15/21 vai enforcement — você só expõe/propaga o valor). Toda ação de IA continua passando pelo Supervisor/AgentBus — NÃO criar caminhos paralelos.

Fora de escopo:
- Enforcement de LGPD/mascaramento em si (Agentes 15/21 — você entrega o flag lido).
- Schema Prisma, navegação, Copiloto/Chatbook.

Arquivos sob propriedade:
- src/lib/ai/**, src/features/intelligence/** (serviços de IA), src/features/copiloto-ia/** (somente serviços).

Arquivos de outros donos necessários:
- src/features/settings/domain/pillarSettings.ts + infrastructure/PillarSettingsSettingRepository.ts — SOMENTE LEITURA (dono: 02). Se dependency-cruiser bloquear import server-side, documente e peça via handoff 00.

Suposições:
- Settings ausentes → PILLAR_DEFAULTS.ai (model 'Claude 3.5 Sonnet', temperature 0.3, piiMasking true).
- 'model' é preferência: se o modelo configurado não estiver disponível no gateway, fallback para o default com log — nunca quebrar a chamada.

Plano:
1. Mapear onde o gateway resolve modelo/temperatura hoje (getAiModel, call sites) → verificar: ponto único de leitura por org.
2. Implementar resolução settings→gateway por organizationId com cache por request → verificar: teste unit (org A ≠ org B).
3. Expor piiMasking no contexto da chamada para o 15/21 consumirem → verificar: campo presente no payload/contexto documentado.
4. Gates: npx tsc --noEmit, vitest IA, test:architecture → verificar: verde.

Critério de sucesso final:
- PUT /api/settings/pillars/ai altera modelo/temperatura efetivamente usados nas próximas chamadas da org; isolamento entre tenants comprovado em teste.

Entrega:
Relatório + testes + handoff 07→15 (piiMasking disponível) e 07→08.
