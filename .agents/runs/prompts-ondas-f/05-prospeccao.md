Você é o Agente 05. Leia AGENTS.md e .agents/prompts/05-prospeccao.md antes de planejar.

Agente: 05 — Prospecção
Onda: F1-consumo (pós-navegação homologada)
Base: integracao/onda-saneamento-20261110
Branch: agente/05-settings-market-prospecting

Objetivo:
Fazer os settings persistidos dos pilares 'market' (minRevenue, autoEnrich, signalAlerts) e 'hub' (dedupCnpj, na parte de prospecção) afetarem as rotinas de prospecção/enriquecimento: minRevenue filtra empresas por faturamento na busca; autoEnrich liga/desliga enriquecimento automático de leads; signalAlerts controla alertas de sinais de mercado; dedupCnpj aplica deduplicação por CNPJ no import/discovery.

Fora de escopo:
- Schema Prisma (Agente 01).
- CRM pipeline (Agente 04 fica com a parte CRM de dedupCnpj — alinhar fronteira via handoff se houver overlap).
- Settings de outros domínios.

Arquivos sob propriedade:
- src/features/prospecting/**, src/features/market-intelligence/** e rotas de prospecção no servidor.

Arquivos de outros donos necessários:
- src/features/settings/domain/pillarSettings.ts + infrastructure/PillarSettingsSettingRepository.ts — SOMENTE LEITURA (dono: 02). Se dependency-cruiser bloquear o import server-side, documente e peça via handoff 00.

Suposições:
- minRevenue é string 'R$ 5.000.000' — parsear para número com cuidado (formato BR); valor inválido → default, nunca quebrar a busca.
- Settings ausentes → PILLAR_DEFAULTS.

Plano:
1. Localizar onde cada comportamento acontece hoje (busca multi-fonte, enrichment job, signal alerts, dedup de CNPJ) → verificar: mapa de pontos de aplicação.
2. Implementar leitura dos settings com defaults → verificar: teste unit por campo.
3. Gates: npx tsc --noEmit, vitest prospecting/market-intelligence, test:architecture se imports novos → verificar: verde.

Critério de sucesso final:
- Alterar settings.pilar.market via API muda o comportamento observável da prospecção (ex.: autoEnrich=false interrompe enriquecimento automático).

Entrega:
Relatório por campo + testes + handoff 05→08.
