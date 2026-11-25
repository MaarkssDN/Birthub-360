De: 04 — CRM e BI
Para: 07 — IA e Automações
Onda: Trilha E CRM (DEBT-0017)
Status: aberto
Prioridade: alto
Bloqueador-ref: DEBT-0017 / CRM-03 (auditoria 2026-11-18)
Sprint destino: Trilha E CRM

## Problema

`src/features/intelligence/services/aiPendingAction.service.ts` (~linha 251, ação
`start_cadence`) executa `prisma.lead.updateMany({ data: { status: 'Cadencia_Iniciada' } })`
direto, fora do fluxo canônico de mudança de etapa do CRM. Isso grava o identificador Prisma
sem `LeadStageHistory`, sem sincronia `pipelineId`/`pipelineStageId`/`probability` (CRM-011),
sem a regra de `closedAt` e sem os eventos de CRM (`DEAL_*`, re-sync Bitrix/CRMs externos) que
`LeadUseCases.updateLeadStatus`/`PrismaLeadRepository.updateStatus` aplicam.

A metade da Mesa de Tratamento do mesmo débito já foi corrigida pelo 04 na branch
`agente/04-crm-debts-0017-0019` (rotas `/register` e `/reassign` de
`mesaTratamento.routes.ts` agora chamam `LeadUseCases.updateLead` via container DI).

## Arquivo(s) envolvido(s)

- `src/features/intelligence/services/aiPendingAction.service.ts` (~linhas 251-272) —
  propriedade do 07 (Intelligence Hub).

## Evidência

- `aiPendingAction.service.ts:260-263`: `prisma.lead.updateMany` com
  `status: 'Cadencia_Iniciada'` (chave do enum Prisma, não o rótulo `'Cadência Iniciada'`).
- Fluxo canônico de referência: `src/features/crm/application/LeadUseCases.ts::updateLeadStatus`
  e `src/features/crm/infra/PrismaLeadRepository.ts::updateStatus` (linhas ~374-461), que
  gravam `LeadStageHistory` via `recordStageTransition`, sincronizam pipeline e `closedAt`.
- O serviço já resolve dependências via `container` (linha 7:
  `import { container } from '../../../shared/di/container.js'`), então a correção é trivial.

## Alteração necessária

Substituir o `prisma.lead.updateMany` por chamada ao caso de uso canônico, por exemplo:

```ts
const leadUseCases = container.resolve<LeadUseCases>('LeadUseCases');
const updated = await leadUseCases.updateLeadStatus(
  action.organizationId,
  payload.leadId,
  'Cadência Iniciada', // rótulo LeadStatus — NUNCA a chave Prisma 'Cadencia_Iniciada'
  // actorUserId: não há usuário humano nesta execução autônoma; updateLeadStatus só exige
  // actor para status 'Negócios Ganhos' (CYC-007), então omitir é seguro aqui.
);
if (!updated) return { sent: false, reason: 'unsupported_action' }; // lead não encontrado no tenant
```

Observações para o 07:

- `updateLeadStatus` lança `Error('Lead not found')` quando o lead não existe no tenant —
  tratar como `{ sent: false, reason: 'unsupported_action' }` ou motivo próprio, para não
  cair no `catch` genérico como `send_failed`.
- `updateLeadStatus` dispara `syncStatusChangeToCrms` (fire-and-forget) e broadcasts —
  comportamento desejado e consistente com qualquer outra mudança de etapa.
- O `prisma.note.create` seguinte pode permanecer como está (não é mudança de status).
- Verificar se há outros `prisma.lead.update*` no mesmo arquivo/domínio de IA que também
  mudem `status` (mesma classe de problema).

## Teste esperado

- Teste unitário do executor `start_cadence` mockando `LeadUseCases` (ou o repository)
  garantindo que o status vai como rótulo `'Cadência Iniciada'` e que lead inexistente/
  cross-tenant retorna `sent:false` sem exceção.
- Regressão: lead em etapa aberta recebe `LeadStageHistory` + `pipelineStageId` coerente
  após aprovação da ação pendente.

## Contexto adicional

- Contrato de tipos: `LeadUseCases.updateLeadStatus(organizationId, id, newStatus: string,
  actorUserId?: string, extraFields?: { owner?; tags? })` — registrado em
  `src/features/job-roles/services/toolExecutors.ts:89` como precedente de consumo fora do
  controller.
- `LeadStatus` label ↔ Prisma key: ver `src/lib/enumMap.ts` (`'Cadência Iniciada'` →
  `'Cadencia_Iniciada'`).
