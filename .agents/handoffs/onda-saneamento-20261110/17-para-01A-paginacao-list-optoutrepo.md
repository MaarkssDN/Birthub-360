De: Agente 17 — Cadência Multicanal e Ciclo de Receita
Para: Agente 01A — Confiabilidade de Dados, RLS e Retenção
Onda: onda-saneamento-20261110
Status: aberto
Prioridade: alto
Bloqueador-ref: achado do Agente 24 na revisão wave 2 (`.agents/reviews/24-revisao-onda-saneamento-wave2-20261111.md`)
Sprint destino: próxima onda de saneamento

## Problema

`prismaOptOutRepository.list(organizationId)` (implementação em `src/shared/infra/PrismaOptOutRepository.ts`) retorna no máximo **200 registros** ordenados por `createdAt desc`. O novo filtro de elegibilidade de cadência (`evaluateLeadCadenceEligibility` + `POST /runs`) e o `sendColdEmailBatch` consomem essa lista para decidir supressão em lote — um opt-out **antigo** (além dos 200 mais recentes da org) fica fora da janela e o lead é tratado como elegível (**fail-open residual**).

## Arquivo(s) envolvido(s)

`src/shared/infra/PrismaOptOutRepository.ts` (dono Agente 01/01A — shared contracts/infra)

## Evidência

- `list()` tem `limit` default 200 e ordenação `createdAt desc` — registros mais velhos são truncados.
- Consumidores novos: `cadence.routes.ts` (`prismaOptOutRepository.list(organizationId)` no POST /runs) e `cold-email.service.ts` (`sendColdEmailBatch`, via `isOptedOut`/`findMatches` — este último NÃO sofre do limite, verificar).
- Opt-out é trava LGPD: fail-open aqui significa contato suprimido recebendo cadência/e-mail.

## Alteração necessária

Escolher uma das abordagens (decisão do dono):
1. Paginação real em `list()` ou novo método `listAll`/`findMatchesBatch` para os consumidores em lote; ou
2. Trocar os consumidores em lote por `findMatches(organizationId, subject)` por lead (N queries, mas exato e já existente) ou uma query `OR` única por lista de sujeitos; ou
3. Índice/consulta direta por identificadores (leadId/email/phoneE164) em vez de listar a org inteira.

Manter compatibilidade da interface `OptOutRepository` (`src/shared/domain/optOut.ts`).

## Teste esperado

Teste provando que um opt-out antigo (>200 registros mais recentes) ainda bloqueia o lead — hoje falharia.

## Contexto adicional

- O Agente 17 já mitigou parcialmente: leads COM `contactId` ainda passam por `checkOptOutStatus` (consulta por sujeito, não afetada pelo limite de 200). O fail-open residual afeta leads SEM `contactId`.
- `findMatches` não tem o limite — verificar se serve para os casos de uso em lote.
