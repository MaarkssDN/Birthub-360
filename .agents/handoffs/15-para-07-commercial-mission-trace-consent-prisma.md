# Handoff — `loadConsentTrace` ignora o `db` injetado e lê no `prisma` global

De: 15 — Segurança Aplicada (execução para o dono 07, pedido do Agente 00)
Para: 07 — Inteligência Comercial / Agent Center (dono de `src/features/intelligence/services/commercialMissionTrace.service.ts`)
Onda: cobertura de código novo (mission-trace comercial)
Status: aberto
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

(preenchido pelo Agente 07 ao resolver)
