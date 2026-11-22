# Handoff — Jornada E2E completa da Mesa de Tratamento

De: 00 — Coordenador
Para: 08 — QA e Release
Onda: W7
Status: resolvido (spec criada; execução pendente de CI/ambiente com DB+browsers)
Prioridade: normal
Sprint destino: próxima onda

## Problema

A spec `tests/e2e/mesa-tratamento.spec.ts` cobre empty-state, dashboard e
RBAC. Falta a jornada completa de triagem inbound: fila → claim/atribuir →
registrar resultado → timeline/CRM. Exige `BitrixConnection` + HTTP de saída
ao Bitrix24.

## Arquivo(s) envolvido(s)

- `tests/e2e/mesa-tratamento.spec.ts`
- Possível stub: MSW handlers ou fixture de BitrixConnection apontando para
  mock local (ver padrão já usado em tests/e2e e tests/mocks).

## Evidência

- Relatório do Agente 08 (specs criados em merge anterior).
- Worktree `agente-08-mesa-e2e` preservada para retomada.

## Alteração necessária

Criar spec cobrindo a jornada feliz + caminhos de erro com Bitrix stubado.
Se inviável sem infra nova, entregar melhor cobertura intermediária e
documentar o gap.

## Teste esperado

- Spec roda no CI (Playwright + Postgres/Redis de teste).

## Contexto adicional

Execução local de Playwright exige browsers + DB — verificar se o ambiente
suporta antes de prometer execução local.

## Resolução (Agente 08, Onda 4, 2026-11-15, branch `agente/08-onda4-qa`)

### O que foi entregue

A limitação documentada na entrega parcial anterior ("impossível mockar HTTP de
saída no processo Express") foi resolvida com uma costura de teste nova, sem
mockar nenhum módulo do produto:

- `tests/e2e/bitrix-mock/portal.ts` — portal Bitrix24 REST falso (node:http)
  com semântica real (`crm.lead.list/get/add/update`, `crm.status.list`,
  `crm.lead.fields`, `user.get`, `crm.timeline.comment.add`,
  `crm.duplicate.findbycomm`, `crm.activity.add`), estado configurável e log
  de chamadas inspecionável via `/__control__/*`.
- `tests/e2e/bitrix-mock/install.ts` — stub de `globalThis.fetch` instalado no
  processo do servidor Express, ativo só com `E2E_BITRIX_MOCK=1`. Desvia chamadas
  para `https://203.0.113.10/...` (TEST-NET-3, passa no guard SSRF por ser IP
  literal não-privado) ao mock local. Usa a costura oficial de teste do
  `safeFetch` (branch `isGlobalFetchMocked` em `urlGuard.ts`). Efeito colateral
  assumido e documentado: com a flag ativa, o pinning de DNS do safeFetch fica
  desligado para TODO o processo de teste — nunca em produção.
- `tests/e2e/e2e-server.ts` — entrypoint do webServer do Playwright (instala o
  stub antes de importar `server.ts`). `npm run start:e2e` permanece idêntico.
- `playwright.config.ts` — webServer agora sobe `e2e-server.ts` com
  `E2E_BITRIX_MOCK=1`, `E2E_BITRIX_MOCK_PORT=4799`, `BITRIX_MIN_INTERVAL_MS=0`.
- `tests/e2e/mesa-tratamento-jornada.spec.ts` — 3 cenários:
  1. **ADMIN jornada feliz**: fila importa leads do Bitrix
     (`crm.lead.list/get`), card renderiza, `register` grava
     `MesaTratamentoTreatment` + `crm.timeline.comment.add` + `crm.lead.update`
     no portal (assertado no log do mock), dashboard reflete KPI, e o painel de
     gestão executa reassign (`ASSIGNED_BY_ID`), comentário e decide.
  2. **SDR escopo**: só o lead com `ASSIGNED_BY_ID` do próprio usuário entra na
     fila (o outro nem é importado), painel de gestão oculto, registro no
     próprio lead → 200.
  3. **Erros**: falha definitiva injetada em `crm.lead.update` → register
     propaga erro, `MesaTratamentoTreatment` NÃO é criado, lead permanece
     `Lead_Recebido` e `bitrixSyncStatus='failed'` (prova de que Atlas e Bitrix
     não divergem — comportamento corrigido no Piloto 026); reassign com
     `bitrixUserId` inexistente → 400.

### Evidências de execução local

- Smoke do portal mock via tsx: `__control__/health` 200, `crm.status.list`
  responde `{result:[...]}`, wrapper de fetch reescreve o host fake e faz
  passthrough de hosts reais (verificado com `example.com`).
- `npx vitest run src/features/mesa-tratamento/` → 20/20 testes (inclui os 16
  novos de dashboard/priority + 4 de mesa-triage já existentes).
- `npx tsc --noEmit` → sem erros nos arquivos novos (únicos erros do repo são
  os 6 pré-existentes de `@capacitor/*` ausentes no node_modules linkado —
  ambiente, não código).
- `npx tsx scripts/security/check-rls-coverage.ts` → OK (136 tabelas).

### Pendência honesta

O spec E2E NÃO foi executado de ponta a ponta localmente: este ambiente não tem
Postgres (5434), Redis, Meilisearch, Docker nem browsers do Playwright — mesma
limitação já documentada na entrega parcial. O smoke testou o portal mock e o
wrapper isoladamente; a execução completa (`npx playwright test
tests/e2e/mesa-tratamento-jornada.spec.ts`) precisa rodar no CI
(`playwright-ci.yml`) ou em ambiente com `docker compose up` +
`npx playwright install chromium`. Risco residual: seletores de UI podem
precisar de ajuste fino na primeira execução real — os testes foram escritos
contra o JSX atual (`#mesa-outcome`, `#mesa-note`, `#mgmt-reassign`,
`#mgmt-comment`, `#mgmt-decide`, botões por nome acessível).
