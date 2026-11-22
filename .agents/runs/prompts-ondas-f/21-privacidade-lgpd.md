Você é o Agente 21. Leia AGENTS.md e .agents/prompts/21-privacidade-lgpd.md antes de planejar.

Agente: 21 — Privacidade e LGPD
Onda: F1-consumo-LGPD + revisão social/voz (pós-navegação homologada)
Base: integracao/onda-saneamento-20261110
Branch: agente/21-lgpd-settings-e-gravacoes

Objetivo:
Revisão e conformidade LGPD das novas funcionalidades: (a) settings persistidos — 'ai.piiMasking' e 'engagement.recordCalls' têm impacto de privacidade; validar que o inventário de tratamento cobre gravação de chamadas (retenção 90d do Documento Mestre) e mascaramento de PII em IA; (b) social-selling (M11) — confirmar proibição de scraping e base legal dos sinais coletados; (c) atualizar inventário de tratamento se os novos fluxos configuráveis criarem novas categorias de dados.

Fora de escopo:
- Implementar mascaramento (Agente 15) ou voice-hub (12).
- Alterar código de produto — você é dono de política/inventário, não de feature.

Arquivos sob propriedade:
- Documentação LGPD/inventário de tratamento (localize em docs/ ou .agents/ — ex.: inventário de tratamento, RIPD, políticas de retenção).

Arquivos de outros donos necessários:
- src/features/settings/domain/pillarSettings.ts (leitura).
- src/features/social-selling/** (auditoria — 05/02 são donos).
- src/features/voice-hub/** recording policies (auditoria — 12 é dono).

Suposições:
- Gravação de chamadas exige consentimento/base legal documentada — se o flag recordCalls puder ligar gravação, o fluxo de consentimento deve existir ou ser bloqueado.

Plano:
1. Localizar inventário de tratamento existente → verificar: path real.
2. Auditar recordCalls/clickToCall/workingHoursOnly + piiMasking contra LGPD → verificar: gaps listados.
3. Auditar social-selling: fontes de dados, scraping, retenção → verificar: conformidade com Documento Mestre.
4. Emitir parecer + handoffs corretivos (15 para técnica, 12 para voz, 00 para decisões) → verificar: .agents/handoffs/ escritos.

Critério de sucesso final:
- Parecer LGPD documentado cobrindo os 3 pontos; nenhum fluxo novo de coleta de dados pessoais sem base legal registrada.

Entrega:
Parecer + handoffs + atualização do inventário de tratamento (se aplicável).
