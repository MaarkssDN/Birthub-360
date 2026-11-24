# Handoff 69 → 06 — Contrato de opt-out por sujeito identificável SEM lead (POS4)

De: 69 — Eli (Opt-Out e Conformidade de Canal)
Para: 06 — Verificação de Realidade / consumidor do contrato de opt-out
Missão: POS4-69-OPTOUT2
Onda: POS4
Status: aberto (contrato pronto para consumo)
Prioridade: alto
Bloqueador-ref: LGPD Art. 18 / supressão de envios

## O que mudou (esta missão)

`src/features/notifications/opt-out/optout.service.ts` agora suporta opt-out por
**sujeito identificável sem `leadId`** — telefone e/ou e-mail bastam. Antes, um STOP
de número que só existe como `Contact` (ou ainda não sincronizado como Lead) não
tinha como ser registrado/purgado por este serviço; agora tem.

Ponto de entrada (inalterado no nome, retrocompatível):

```ts
import { recordOptOutAndPurgePendingJobs } from '../../notifications/opt-out/optout.service.js';
import { prismaOptOutRepository } from '../../../shared/infra/PrismaOptOutRepository.js';
```

### Assinatura exata

```ts
recordOptOutAndPurgePendingJobs(
  repo: OptOutRepository,                    // usar prismaOptOutRepository em produção
  input: RecordOptOutInput,                  // de src/shared/domain/optOut.ts
  queueInstance?: Queue<any> | Queue<any>[] | null,  // OPCIONAL — ver abaixo
): Promise<{ record: OptOutRecord | null; purgeResult: { cancelledJobsCount: number; jobIds: string[] } }>
```

### `input` — campos que importam para sujeito sem lead

```ts
{
  organizationId: string;          // OBRIGATÓRIO — isolamento de tenant na persistência E na purga
  scope: 'global' | 'email' | 'whatsapp' | 'voice',
  originChannel: 'email' | 'whatsapp' | 'voice' | 'manual' | 'import',
  subject: {
    leadId?: string | null,        // PODE SER null/omitido — opt-out sem lead é válido
    email?: string | null,         // normalizado internamente (trim + minúsculo + exige '@')
    phoneE164?: string | null,     // normalizado internamente via toE164BR
  },
  reason?: string | null,
  evidence?: string | null,        // trecho real do pedido (ex.: body do STOP) — nunca inferência
  requestedBy?: string | null,
}
```

**Regra de ouro:** pelo menos UM identificador aproveitável (`leadId`, `email` válido ou
`phoneE164` válido após normalização) é obrigatório. Sem nenhum, `record` volta `null`,
nada é gravado e a fila nem é varrida (WARN logado) — não é erro, é no-op intencional.

Não existe campo `subjectId`/`contactId` no contrato: um contato sem lead é identificado
pelos MESMOS `email`/`phoneE164` do `Contact`. O gate de envio
(`checkOptOutStatus`/`isOptedOut` em `src/shared/services/optOutCheck.service.ts` /
`optOutService.ts`) já resolve Contact → leads → OptOutRecord por esses identificadores.

### `queueInstance` — purga de jobs pendentes

- **Omitido (`undefined`)**: default retrocompatível = `whatsappCommandQueue`
  (fila `whatsapp-command`; pode ser `null` com `ENABLE_QUEUES=false` — tratado com WARN).
- **`null` explícito**: "não purgar fila" — registro do opt-out ainda é gravado.
- **`Queue` única** ou **`Queue[]`**: purga agregada em todas (ex.: whatsapp-command +
  futuras filas de envio comercial).

A purga remove jobs nos estados BullMQ `waiting`, `delayed`, `prioritized`,
`waiting-children`, casando por `organizationId` (job.data.organizationId === input)
E por qualquer identificador: `leadId` (job.data.leadId ou job.data.context.leadId),
teléfone (sufixo de 8 dígitos de job.data.number) ou e-mail (job.data.email ou
job.data.context.email, minúsculo). Jobs de outro tenant nunca são tocados.

### Caso de uso alvo (STOP inbound sem lead — lado do Agente 06/WhatsApp)

Hoje `whatsappMessage.service.ts` (~L177) só trata `isOptOutKeyword` dentro de
`if (lead && ...)`. Para cobrir contato sem lead aberto, o chamador deve invocar o
serviço **fora** desse guard, com `subject` montado a partir do que já está em mãos:

```ts
subject: {
  leadId: lead?.id ?? null,
  email: contact?.email ?? null,   // findContactByPhone já retorna email decriptado
  phoneE164,                        // já normalizado E.164 no topo de persistWhatsAppMessage
}
```

`phoneE164` sozinho já basta para registrar e purgar — o casamento por telefone usa
sufixo de dígitos, então o formato do `number` no payload do job não precisa ser idêntico.

## Garantias que NÃO mudaram (não reimplementar do lado do chamador)

- **Anonimizados/excluídos (LGPD Art. 18)**: bloqueio acontece no gate de envio
  (`checkOptOutStatus`, matchedBy `'anonymized'`), não na gravação — registrar opt-out
  para contato anonimizado é inócuo e a supressão de envio continua garantida.
- **Race residual check-then-send**: um job que transita para `active` entre `getJobs`
  e `remove` falha o `remove()` (log ERROR) e não é contado como cancelado — a última
  linha de defesa é o gate `isOptedOut`/`checkOptOutStatus` consultado no momento do
  envio real. Janela residual documentada: opt-out gravado entre o gate e o `sendMessage`
  físico ainda passa; fechar 100% exigiria lock/versão — risco residual aceito e
  registrado (mesma nota do handoff 69→56 da Onda 4).
- **Multi-tenant**: `organizationId` filtra tanto a persistência (`OptOutRecord`) quanto
  cada job avaliado na fila — purga nunca cruza tenants.

## Testes de referência (11/11 verdes)

`src/features/notifications/opt-out/__tests__/optout.service.test.ts` cobre:
opt-out por telefone sem lead (persiste `leadId: null`, purga só o job do mesmo número
no mesmo tenant), opt-out por e-mail sem lead, sujeito sem identificador (no-op sem
varrer fila), array de filas com agregação, fila nula, early-return de
`cancelPendingJobsForOptOut`, isolamento de falhas por job, e retrocompatibilidade por
`leadId`.

## O que falta do lado do Agente 06

1. Chamar `recordOptOutAndPurgePendingJobs` no handler de STOP **inclusive quando
   `lead === null`** (hoje o bloco inteiro está sob `if (lead && ...)` em
   `whatsappMessage.service.ts:177`).
2. Opcional: passar `[whatsappCommandQueue, <outras filas de envio>]` se houver mais de
   uma fila com jobs comerciais pendentes.
3. Manter o gate `isOptedOut` no envio (`whatsapp.service.ts`) — é a mitigação do race
   residual, não substituto da purga.
