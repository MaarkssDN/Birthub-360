# Handoff — `loadConsentTrace` ignora o `db` injetado e lê no `prisma` global

De: 15 — Segurança Aplicada (execução para o dono 07, pedido do Agente 00)
Para: 07 — Inteligência Comercial / Agent Center (dono de `src/features/intelligence/services/commercialMissionTrace.service.ts`)
Onda: cobertura de código novo (mission-trace comercial)
Status: resolvido
Prioridade: médio
Referência: `src/features/intelligence/services/commercialMissionTrace.service.ts` (`loadConsentTrace`, linhas ~381–426); teste `observa que loadConsentTrace usa o prisma do módulo, não o db injetado`.

## Problema

`getCommercialMissionTrace({ db, organizationId, requestedMissionId })` aceita um cliente Prisma injetado e usa esse `db` para handoffs, execuções, definições de agente e leads. A carga da cadeia de consentimento (`loadConsentTrace`) **não recebe esse cliente**: chama `asClient(prisma).organizationAiConsent.findUnique(...)`, onde `prisma` é o import de módulo de `src/lib/prisma.js`.

O teste unitário confirma o acoplamento: um `db` injetado com `organizationAiConsent.findUnique` próprio **não é chamado**; a consulta cai no `prisma` mockado no módulo.

## Impacto atual

A rota `GET /api/commercial-agent/mission/:id/trace` hoje passa `db: prisma` (o mesmo cliente global). **Não há vazamento de tenant em produção neste caminho**, porque as duas referências apontam para o mesmo objeto.

O defeito é de contrato e de isolamento futuro: se um caller passar `getTenantPrisma()` (cliente com RLS / escopo de organização), handoffs e execuções ficam no cliente da requisição, mas o consentimento da org continua sendo lido no cliente global, fora desse escopo. Isso quebra a premissa de que `db` é a única fonte da leitura e pode mascarar falhas de RLS ou divergir em testes/jobs que injeta um client diferente.

## Alteração necessária (não feita neste PR)

Este PR é só de testes (Agente 15 executando para o dono 07). **Não alterei código de produção.**

Sugestão para o dono 07:

- Passar o cliente já resolvido (`asClient(input.db)` ou `input.db`) para `loadConsentTrace`.
- Manter o `where: { organizationId }` e os demais predicados.
- Estender o teste de isolamento para exigir que `organizationAiConsent.findUnique` seja chamado no `db` injetado, não no módulo.

## Critérios de pronto

- `loadConsentTrace` usa o mesmo cliente Prisma que o restante de `getCommercialMissionTrace`.
- O teste de isolamento por tenant passa a falhar se o consentimento for lido no `prisma` de módulo quando um `db` distinto é injetado.
- Sem mudança de limites/exclusions de cobertura ou do quality gate.

## Resolução

Resolvido pelo Agente 07 em 2026-11-15 (worktree `Birthub-360-wt-o3-07`, branch
`agente/07-onda3-ia`), conforme a sugestão do handoff:

- `loadConsentTrace` agora recebe o cliente já resolvido
  (`client: typeof prisma`, o `asClient(input.db)` de `getCommercialMissionTrace`)
  e chama `client.organizationAiConsent.findUnique({ where: { organizationId } })`
  — o `import { prisma }` de módulo virou `import type` (biome `useImportType`),
  restando apenas para os tipos `Db`/`asClient`.
- `hasPiiExternalConsent` é gate por env (sem leitura Prisma) e
  `consentAuditChain` é singleton de fábrica própria — fora do escopo do cliente
  injetado por design; mantidos como estavam.
- Teste de isolamento atualizado
  (`tests/unit/features/intelligence/services/commercialMissionTrace.service.test.ts`,
  describe "isolamento por tenant"): o caso antes intitulado "observa que
  loadConsentTrace usa o prisma do módulo, não o db injetado (acoplamento)" virou
  "usa o db injetado para o consentimento (mesmo cliente do restante do trace)" —
  agora **exige** `injectedConsent` chamado com `{ where: { organizationId: ORG } }`
  e `consentFindUnique` (prisma de módulo) **não** chamado. Falha se o consentimento
  voltar a ser lido no cliente global.

Evidências: `npx vitest run -c vitest.unit.config.ts
tests/unit/features/intelligence/services/commercialMissionTrace.service.test.ts`
→ 57/57 verde; `npx tsc --noEmit` limpo; `npx biome check` nos arquivos limpo.
Nota: `tests/` é propriedade do Agente 08 — edição cirúrgica feita sob instrução
explícita deste handoff (critério de pronto pedia estender o teste de isolamento).

### Reverificação (Agente 07 — 2026-11-17, worktree `agente-07-handoffs`, base `main@414a0ca5f`)

Confirmado em `main`: `loadConsentTrace` recebe o cliente injetado
(`client.organizationAiConsent.findUnique`, L389) e o teste de isolamento
("usa o db injetado para o consentimento", L1049-1068) está presente.
Status → `resolvido`.
