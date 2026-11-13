De: 17 — Cadência Multicanal e Ciclo de Receita
Para: 05 — Prospecção (dono provável de `src/features/market-intelligence/**`; confirmar com 00 se a propriedade for de outro agente)
Onda: Onda 3 (Plano Mestre de Saneamento — continuação de TAREFA-SANEAMENTO-035 / BT360-DT-0080)
Status: aberto
Prioridade: alto (LGPD — opt-out pode ser contornado por este caminho)
Bloqueador-ref: `.agents/handoffs/onda-saneamento-20261110/00-para-17-ausencia-de-verificacao-em-lote-de-opt-out-no-momento-do-inicio-da-cad.md`

## Problema

`src/features/market-intelligence/server/actionExecutor.service.ts`, ação `START_SDR_CADENCE`
(linhas ~77–123), cria um `CadenceRun` via `startCadenceRun` + `prismaCadenceRunRepository.save`
**sem nenhuma verificação de opt-out** — nem `checkOptOutStatus`, nem o `OptOutRecord` unificado.
Um lead que pediu opt-out pode ser recolocado em cadência por este caminho, contornando a trava
que a Onda 7 e que acabei de reforçar em `POST /api/cadence/runs` (TAREFA-SANEAMENTO-035).

## Arquivo(s) envolvido(s)

- `src/features/market-intelligence/server/actionExecutor.service.ts` (fora da minha propriedade)

## Evidência

- O bloco `START_SDR_CADENCE` resolve lead e sequência e chama `startCadenceRun` diretamente;
  não há chamada a `checkOptOutStatus`, `isOptedOut` ou `checkCadenceStartEligibility`.
- O run criado entra no scan do `cadence-run-scanner` (BullMQ) e o primeiro toque só é barrado por
  opt-out quando `advanceCadenceRun` avalia o canal do toque — ou seja, o lead inelegível ainda
  consome fila e aparece nos relatórios de cadência (exatamente o impacto da dívida BT360-DT-0080).

## Alteração necessária

Antes de `prismaCadenceRunRepository.save(run)`, aplicar o mesmo filtro prévio usado em
`POST /api/cadence/runs`:

```ts
import { checkCadenceStartEligibility } from '../../cadence/application/cadenceEligibility.js';
import { prismaOptOutRepository } from '../../../shared/infra/PrismaOptOutRepository.js';
import { prismaLeadSubjectResolver } from '../../cadence/infra/PrismaLeadSubjectResolver.js';

const eligibility = await checkCadenceStartEligibility(
  { optOutRepo: prismaOptOutRepository, subjectResolver: prismaLeadSubjectResolver },
  organizationId,
  lead.id,
  [...new Set(sequenceRow.touches /* canais */)],
);
if (!eligibility.eligible) {
  throw new AppError(`Lead em opt-out (...): ${eligibility.reason}`, 409);
}
```

Atenção: `sequenceRow.touches` é `Json` — usar `parseCadenceSequenceDefinition(sequenceRow)` de
`src/features/cadence/jobs/cadenceRun.worker.ts` (ou `validateSequence`) para obter os canais com
tipo seguro, mesmo padrão já usado em `cadence.routes.ts`. Se o lead tiver `contactId`, também é
recomendável `checkOptOutStatus(contactId, channel, organizationId)` por canal (flags de
`customFields` e contato anonimizado não estão no `OptOutRecord`).

`checkCadenceStartEligibility` está exportada por `src/features/cadence/index.ts` e não faz
escrita — é segura para consumo cross-feature via import dinâmico (mesmo padrão já usado neste
arquivo para `startCadenceRun`/`prismaCadenceRunRepository`).

## Teste esperado

- Recomendação `START_SDR_CADENCE` para lead com opt-out (global ou do canal da sequência) →
  erro 409 e `AccountRecommendation` NÃO marcada como `Executed`.
- Lead elegível → comportamento atual preservado (run criado, status `Executed`).

## Contexto adicional

- Se a propriedade de `market-intelligence` não for do Agente 05, favor rotear ao dono correto
  via Agente 00 — o ponto é que TODO caminho que cria `CadenceRun` precisa passar pelo filtro de
  opt-out antes do save.
