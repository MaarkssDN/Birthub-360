# Handoff 69 → 56 — WhatsApp: purga de fila no opt-out e race residual no envio

De: 69 — Eli (Opt-Out e Conformidade de Canal)
Para: 56 — WhatsApp (`src/features/integrations/whatsapp/**`)
Onda: 4 (ONDA4-69-OPTOUT)
Status: aberto
Prioridade: alto
Bloqueador-ref: LGPD / supressão comercial

## Problema

A missão do Agente 69 exige supressão de envios comerciais após revogação (opt-out), incluindo
jobs já enfileirados/em andamento. Na auditoria do caminho WhatsApp encontrei dois pontos que
pertencem à sua propriedade e não posso editar:

### 1. Opt-out inbound (STOP) não purga jobs pendentes da fila `whatsapp-command`

`src/features/integrations/whatsapp/whatsappMessage.service.ts` (~linhas 177-212): ao detectar
`isOptOutKeyword(input.body)`, o código atualiza `lead.customFields.optOutWhatsApp` e chama
`recordOptOut(prismaOptOutRepository, ...)`. Ele **não** chama
`recordOptOutAndPurgePendingJobs` / `cancelPendingJobsForOptOut` de
`src/features/notifications/opt-out/optout.service.ts` (minha propriedade).

Consequência: jobs `send` já enfileirados/em espera na fila `whatsapp-command` não são removidos
no momento do STOP. Hoje eles ainda são suprimidos na prática porque `sendWhatsAppMessage`
(`whatsapp.service.ts` ~linhas 435-455) consulta `isOptedOut` antes de enviar — mas a purga é o
mecanismo projetado (aceite da especialidade: "supressão no envio E em jobs já agendados") e evita
que o job fique pendente/retryando à toa.

### Alteração necessária

No bloco `isOptOutKeyword` de `whatsappMessage.service.ts`, trocar/adicionar a chamada para o
ponto de entrada unificado:

```ts
import { recordOptOutAndPurgePendingJobs } from '../../notifications/opt-out/optout.service.js';
import { whatsappCommandQueue } from '../../../lib/queue/whatsappCommand.queue.js';

await recordOptOutAndPurgePendingJobs(
  prismaOptOutRepository,
  {
    organizationId: input.organizationId,
    scope: 'global',
    subject: { leadId: lead.id, email: contact?.email ?? null, phoneE164 },
    originChannel: 'whatsapp',
    reason: 'Lead pediu para parar de receber mensagens via WhatsApp',
    evidence: input.body,
  },
  whatsappCommandQueue ?? undefined,
);
```

Mantendo o `catch` de log já existente (não pode apagar a evidência do flag legado). Atenção:
`whatsappCommandQueue` é `Queue | null` quando `queuesEnabled=false` — a versão corrigida do meu
serviço aceita `null`/`undefined` e retorna purga vazia com WARN (não lança).

### 2. Race residual: check-then-send não é atômico

`sendWhatsAppMessage` verifica `isOptedOut` (~linha 437) e depois envia. Um opt-out gravado entre
a consulta e o `sendMessage` real ainda passa. A janela é pequena, mas para LGPD vale registrar:
não há como fechar 100% sem lock/versão no registro — recomendo aceitar como risco residual
documentado ou avaliar re-check imediatamente antes do `sock.sendMessage` se o custo for baixo.

## Evidência

- `whatsappMessage.service.ts:178-211` — grava flags + `recordOptOut`, sem purga de fila.
- `whatsapp.service.ts:435-455` — gate `isOptedOut` existe e funciona (mitigação real).
- `optout.service.ts` corrigido nesta onda cobre estados `waiting`, `delayed`, `prioritized`,
  `waiting-children` e isola falhas por job.
- Testes novos: `src/features/notifications/opt-out/__tests__/optout.service.test.ts` (6 casos).

## Teste esperado

- STOP inbound → `OptOutRecord` criado + jobs matching removidos de `whatsapp-command`
  (waiting/delayed/prioritized/waiting-children) + `sendWhatsAppMessage` continua bloqueando.

## Contexto adicional

Também afeta cadências que enfileiram `send` na mesma fila — ver handoff 69→17.
