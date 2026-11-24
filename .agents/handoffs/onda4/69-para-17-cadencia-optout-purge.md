# Handoff 69 → 17 — Cadência: opt-out não purga jobs WhatsApp já enfileirados

De: 69 — Eli (Opt-Out e Conformidade de Canal)
Para: 17 — Cadência Multicanal e Ciclo de Receita (`src/features/cadence/**`; a missão citou o
Agente 44, mas o AGENTS.md local da pasta designa o Agente 17 como dono — confirmar destinatário)
Onda: 4 (ONDA4-69-OPTOUT)
Status: aberto
Prioridade: normal
Bloqueador-ref: LGPD / supressão comercial

## Problema

`src/features/cadence/cadence.routes.ts` (~linhas 135-172, `POST /opt-outs`) registra o opt-out
via `recordContactOptOut` (quando `contactId`) ou `recordOptOut` (quando leadId/email/phone), mas
**não invoca** `recordOptOutAndPurgePendingJobs`/`cancelPendingJobsForOptOut`
(`src/features/notifications/opt-out/optout.service.ts`, propriedade do Agente 69).

Mitigação existente (verificada): os dispatchers de cadência chamam `checkOptOutStatus` por
canal antes de cada disparo (`infra/dispatchers/CadenceDispatchers.ts` ~linhas 199, 323, 435), e
`sendWhatsAppMessage` consulta `isOptedOut` imediatamente antes do envio — então envios futuros
estão suprimidos. O que falta é a **purga proativa** de jobs `send` já enfileirados na fila
`whatsapp-command` (ex.: mensagem de cadência agendada para daqui a X horas) e, se houver,
agendamentos futuros dentro de runs de cadência ainda não despachados.

## Alteração necessária

Após registrar o opt-out em `POST /opt-outs`, chamar o ponto de entrada unificado do Agente 69
com a fila `whatsappCommandQueue` (aceita `null`). Para runs de cadência pendentes, avaliar se
`cadenceEligibility`/executor já cancelam steps futuros do titular — se não, propor mecanismo
próprio (o opt-out por canal já bloqueia no dispatch, então o impacto é higiene de fila, não
vazamento).

Sujeito para a purga: derivar de `contactId` → contact (email/whatsapp/phone) + leads
vinculados, ou usar diretamente `leadId`/`email`/`phone` do payload — o matcher do serviço
aceita qualquer combinação.

## Evidência

- `cadence.routes.ts:144-165` — dois caminhos de registro, nenhum chama a purga.
- `CadenceDispatchers.ts:199,323,435` — `checkOptOutStatus` por canal antes do envio (gate real).
- `whatsapp.service.ts:435-455` — `isOptedOut` antes do `sendMessage` (segunda camada).

## Teste esperado

- `POST /opt-outs` com telefone de um lead → `OptOutRecord` + jobs matching removidos de
  `whatsapp-command`; cadência do titular não dispara nos steps seguintes.

## Contexto adicional

`recordContactOptOut` (shared/services/optOutCheck.service.ts, dono Agente 01) também grava
`customFields.optOut*` em contato/lead — essa flag legada JÁ é lida por `checkOptOutStatus`,
então cadências por `contactId` estão cobertas no dispatch; a lacuna é só a fila WhatsApp.
