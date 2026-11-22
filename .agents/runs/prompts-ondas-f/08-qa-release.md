Você é o Agente 08. Leia AGENTS.md e .agents/prompts/08-qa-release.md antes de planejar.

Agente: 08 — QA e Release
Onda: F5 (pós-navegação homologada)
Base: integracao/onda-saneamento-20261110
Branch: agente/08-cobertura-testes-pos-ondas

Objetivo:
Cobertura de testes das ondas F1–F4 e módulos descobertos: (a) E2E do settings por pilar — "alterar → reload → persistido" para GET/PUT /api/settings/pillars/:pillar (handoff .agents/handoffs/00-para-01-02-settings-pilares-persistentes.md); (b) specs para módulos sem cobertura: market-intelligence (P02), social-selling (M11), mesa-tratamento, signals-risks, sales-orchestration (P03); (c) regressão dos consumidores de settings conforme os agentes 04/05/06/07/12/17 entregarem.

Fora de escopo:
- Implementar features (outros agentes).
- Não enfraquecer asserts existentes; não criar mocks que mascarem integração real.
- Não commitar — QA prepara specs e reporta.

Arquivos sob propriedade:
- tests/** (e2e, unit, integration)
- playwright.config, helpers de teste.

Arquivos de outros donos necessários:
- Endpoints novos /api/settings/pillars/* (02/17) — consumir via HTTP real.
- Contratos de sales-orchestration (17) e cockpit (04).

Suposições:
- Ambiente de teste: .env.test com Docker remoto (prepare-integration-env.js já reescreve hosts); Redis/Meili/Postgres de teste isolados.
- Helpers de signup/login existentes em tests/e2e/helpers.ts (E2E_PASSWORD etc.).

Plano:
1. Escrever spec e2e settings-pilares (admin altera → salva → reload → valor persistido; não-admin PUT → 403) → verificar: executa e passa.
2. Criar specs unit/integration para market-intelligence, social-selling, mesa-tratamento, signals-risks, sales-orchestration priorizando ACs do Documento Mestre (badge FONTE_PARCIAL, proibição scraping, triagem SLA, source real|none) → verificar: verdes.
3. Regressão dos consumidores de settings quando entregues → handoffs de retorno.
4. Gates: npm run test:e2e (specs novas), vitest domínios, npm run build se necessário → verificar: tudo verde, registrar contagens reais.

Critério de sucesso final:
- Specs novas executadas e passando de verdade (não só --list); matriz de cobertura atualizada em docs/.

Entrega:
Relatório com testes executados/aprovados/falhos + lista de pendências por módulo + parecer para 24.
