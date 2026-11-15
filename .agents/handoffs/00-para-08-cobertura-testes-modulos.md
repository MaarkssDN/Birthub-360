# Handoff — Cobertura de testes dos módulos restantes (Onda F5)

De: 00 — Coordenador
Para: 08 (QA) + 24 (revisão)
Onda: F5
Status: em-andamento (mesa-tratamento fechada na Onda 4 — ver Resolução abaixo; demais módulos seguem abertos)
Prioridade: normal
Referência: `docs/architecture/MATRIZ-FUNCIONAL-MODULOS.md` §5 item 5, §7

## Problema

Módulos sem cobertura de teste dedicada identificados no inventário:

| Módulo | Test files hoje |
|---|---|
| market-intelligence (P02) | 0 |
| mesa-tratamento (P08) | 0 (só service unit) |
| social-selling (M11) | 0 |
| signals-risks (P06) | 0 |
| sales-orchestration (P03) | 0 |
| predictability (P05) | 1 |

## Alteração necessária

1. 08: criar specs unit/integração/E2E priorizando: LGPD/social-selling
   (proibição de scraping), mesa-tratamento (triagem + SLA),
   market-intelligence (fallback de provedores, badge FONTE_PARCIAL,
   ledger de créditos — AC-MKT-001/002/003 do Documento Mestre).
2. 24: revisar conformidade dos novos testes com os critérios de aceite
   do Documento Mestre.

## Teste esperado

- `npm run test:e2e`/`test:unit`/`test:integration` verdes com as novas
  specs; matriz de cobertura atualizada.

## Fora de escopo

- Não enfraquecer asserts existentes; não criar mocks que mascarem
  integração real.

## Resolução parcial (Agente 08, 2026-11-12, branch `agente/08-e2e-cobertura-modulos`)

### Inventário real de cobertura (rotas `/app/*` vs specs em `tests/e2e/`)

Já cobertos por E2E funcional real (não só render/mock): CRM board/kanban
(`crm-kanban.spec.ts`, drag mouse+teclado, rollback, drawer, deep-link),
propostas (`crm360-proposta.spec.ts`, criação com itens + reload),
cadência (`cadence.spec.ts`, criar sequência + iniciar/pausar/retomar/parar run),
leads/companies/contacts CRUD, commercial-intelligence RBAC, integrations.

### Gaps fechados nesta entrega (specs novas, backend real sem mocks)

1. `tests/e2e/mesa-tratamento.spec.ts` — EmptyState "Bitrix24 não conectado"
   (contrato real de `/api/mesa-tratamento/queue` com `connectionId: null`),
   aba Dashboard com KPIs zerados + troca de período (`?period=30d`),
   contrato de validação do `/register` (400 sem outcome, 404 lead inexistente)
   e RBAC VISUALIZADOR → "Acesso restrito" + 403 na API.
2. `tests/e2e/signals-risks.spec.ts` — hub Sinais & Riscos: métricas de
   cobertura reais, troca Radar ↔ Riscos de Deals com navegação de URL,
   deep-link `/deal-risks`, botão "Atualizar Dados" disparando
   `/api/commercial-intelligence/health-score`.
3. `tests/e2e/gamification.spec.ts` — cockpit de gamificação: ranking vazio
   real, perfil "Nível 1 / Consultor Trainee", troca de período
   (`?period=week`), aba War Room Arena.

### Limitação documentada

A jornada completa da mesa de tratamento (triagem lead-a-lead, registrar
resultado, reatribuir, comentar, decidir) exige `BitrixConnection` real +
HTTP de saída para o portal Bitrix24 — indisponível no ambiente de teste e
impossível de mockar no processo Express do `start:e2e`. Ficou pendente:
cobrir esse fluxo quando houver um Bitrix fake/stub de integração ou
seed de `BitrixConnection` apontando para um mock HTTP controlado pelo
teste. Idem para social-selling/scraping e market-intelligence com
provedores reais.

### Execução

- `npx tsc --noEmit`: PASS (exit 0).
- `npx playwright test <specs>`: NÃO executável neste ambiente —
  Postgres (`localhost:5434`), Redis (`localhost:6379`), Meilisearch e
  Docker CLI indisponíveis, e browsers do Playwright não instalados
  (`chromium_headless_shell-1243` ausente). O `webServer` do Playwright
  chegou a subir o Express (`/login` → 200) mas os testes falham no
  `browserType.launch` e o `signUp` falharia no banco. Rodar no CI ou em
  ambiente com `docker compose up` + `npx playwright install chromium`.

### Ainda sem cobertura E2E funcional (para próximas ondas)

market-intelligence hub/deck/accounts, social-selling, sales-orchestration,
predictability, voice-hub, playbooks/jornadas/processos/roteiros/chatbook/
roleplay (só varredura), war-room standalone, automations, team, settings,
forecast/metas, copiloto_ia, pending-actions, failover/resilience.

## Resolução Onda 4 (Agente 08, 2026-11-15, branch `agente/08-onda4-qa`)

### Fechado nesta onda

1. **mesa-tratamento** — o maior gap do inventário agora tem cobertura real nos
   dois níveis:
   - Unit: `src/features/mesa-tratamento/__tests__/mesaTratamento.dashboard.test.ts`
     e `mesaTratamento.priority.test.ts` — 16 testes das funções puras de
     agregação de dashboard e ordenação/score da fila (antes: só
     `mesa-triage.service.test.ts`).
   - E2E jornada completa: `tests/e2e/mesa-tratamento-jornada.spec.ts` com o
     portal Bitrix falso de `tests/e2e/bitrix-mock/` (detalhes e evidências no
     handoff `00-para-08-mesa-tratamento-e2e-jornada.md`, marcado resolvido).
     Cobre importação, registro com escrita de volta, gestão e erros.

### Inventário revisado (o quadro original estava desatualizado)

Verificação na branch pós-Onda 3 mostra cobertura parcial já existente onde o
handoff dizia "0": market-intelligence tem `domain/__tests__/
accountSignalTaxonomy.test.ts`, `components/__tests__/honestHubs.b06.test.ts`,
`server/__tests__/actionExecutor.tenancy.test.ts`; social-selling tem
`server/__tests__/socialInteraction.service.test.ts`. signals-risks ganhou spec
E2E na entrega parcial anterior (`signals-risks.spec.ts`).

### Ainda sem cobertura dedicada (próximas ondas, honesto)

- market-intelligence: cenários de fallback de provedores, badge
  FONTE_PARCIAL e ledger de créditos (AC-MKT-001/002/003) — têm testes de
  taxonomia/tenancy, não dos fluxos de provider.
- social-selling: jornada E2E e a proibição de scraping/LGPD como critério de
  aceite executável (o service tem spec unitária, mas não o gate de scraping).
- sales-orchestration, predictability (só 1 spec antiga), voice-hub,
  playbooks/jornadas/processos/roteiros/chatbook/roleplay, war-room standalone,
  automations, team, settings, forecast/metas, copiloto_ia, pending-actions,
  failover/resilience — sem spec dedicada.
- Execução local de Playwright segue indisponível neste ambiente (sem
  Postgres/Redis/Meilisearch/Docker/browsers) — as specs novas precisam do CI.
