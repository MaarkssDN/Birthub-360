- De: 17 (Cadência Multicanal e Ciclo de Receita)
- Para: 01 (Plataforma, Segurança e Dados)
- Onda: Trilha C (pacote DEBT-0008/0009/0010, branch `agente/17-cadence-debts-0008-0010`)
- Status: aberto
- Prioridade: alto (não bloqueador da Trilha C — o domínio já trata a forma persistida; o enum só remove o downgrade)
- Bloqueador-ref: DEBT-0009 (`.agents/runs/00-reconciliacao-release-readiness-20261119.md`)

## Problema

O domínio de cadência tem o estado de tentativa `pending` (`CadenceTouchResult` em
`src/features/cadence/domain/cadence.ts`) para toques de voz cuja confirmação chega de forma
assíncrona via webhook do provedor. Porém o enum Postgres `CadenceTouchResult`
(`prisma/schema.prisma` ~L3574) só declara `Sent | Failed | Skipped` — **não existe `Pending`**.

Consequência em produção (verificada no código):

1. `PrismaCadenceRunRepository.TOUCH_RESULT_TO_DB` mapeia `pending → 'Skipped'`
   (`src/features/cadence/infra/PrismaCadenceRunRepository.ts` ~L92, stopgap do commit
   `a0faa1a07`). Na releitura (`findById`), a tentativa volta como `skipped` — o `pending` se
   perde.
2. Sem o `pending` visível, `decideCadenceAction` não retornava `wait/locked` e o run
   **re-despachava o toque de voz a cada ciclo elegível** — `callLead` repetido ao mesmo lead
   enquanto o webhook não chegava (ou para sempre, se o webhook se perdesse).

## O que o Agente 17 já fez (sem tocar schema)

- `domain/cadence.ts`: novo helper `isPendingConfirmation(attempt)` que reconhece as DUAS
  formas: `result === 'pending'` (memória/testes) e `result === 'skipped' &&
  providerMessageId != null` (forma persistida — `skipped` legítimos de janela comercial/rate
  limit nunca têm `providerMessageId`). `decideCadenceAction`, `resolvePendingTouchAttempt` e a
  nova `expireStalePendingTouchAttempts` (sweeper de TTL, DEBT-0009) usam o helper — o run
  agora aguarda o webhook e, se ele não chegar em 24h (`PENDING_TOUCH_CONFIRMATION_TTL_MS`), a
  tentativa vira `failed` e a sequência segue a política normal de retry/avanço.
- `infra/cadenceWebhookResolver.ts`: corrigido `select: { attempts: true }` (campo inexistente
  em `CadenceRun` — a query lançava erro de validação do Prisma em TODA chamada) para
  `touchAttempts { result, providerMessageId }`, com matcher tolerante a `Pending`/`Skipped`.

## Alteração necessária (schema — propriedade do 01)

1. Adicionar `Pending` ao enum `CadenceTouchResult` em `prisma/schema.prisma` + migration
   (`ALTER TYPE "CadenceTouchResult" ADD VALUE 'Pending'`). Classificação: aditiva.
2. Depois do deploy da migration, atualizar
   `PrismaCadenceRunRepository.TOUCH_RESULT_TO_DB`/`TOUCH_RESULT_FROM_DB` para mapear
   `pending ↔ 'Pending'` (o domínio já está pronto; o helper `isPendingConfirmation` continua
   funcionando — `pending` literal passa a ser a forma persistida também).
3. Opcional/recomendado: índice não é necessário (busca é por `cadenceRunId` + `providerMessageId`,
   volumes baixos).

## Teste esperado

- Após a migration: teste de repositório provando round-trip `pending → Pending → pending`.
- Comportamento de domínio já coberto em `src/features/cadence/__tests__/cadence.test.ts`
  (describe "DEBT-0009") e `cadenceService.test.ts` — nenhum deve quebrar com o enum novo.

## Contexto adicional

- Enquanto o enum não existir, o downgrade `pending → Skipped` + `providerMessageId` é a
  representação durável oficial — não remover `providerMessageId` de tentativas `skipped` nem
  gravar `skipped` com `providerMessageId` em novos caminhos sem revisar
  `isPendingConfirmation`.
- `advanceCadenceRunPendingTouch` (resolução via webhook) já funciona com a forma persistida
  graças ao matcher atualizado — nenhum outro consumidor depende do formato.
