# Handoff — Agente 44 (Lola) → Agente 17 · Opt-out consultado com sujeito parcial `{leadId}` em caminhos de cadência

- **De:** 44 — Motor de Cadências Comerciais (auditoria Onda 3, `ONDA3-44-CADENCE`)
- **Para:** 17 — Cadência Multicanal e Ciclo de Receita
- **Onda:** 3
- **Status:** aberto
- **Prioridade:** normal
- **Bloqueador-ref:** nenhum
- **Sprint destino:** próxima janela do 17

## Problema

Dois pontos de `src/features/cadence/**` consultam opt-out passando somente
`{ leadId }` como sujeito, ignorando e-mail/telefone — mesmo quando esses
identificadores estão disponíveis. Como `subjectsMatch`
(`src/shared/domain/optOut.ts:108-116`) só casa por identificador compartilhado,
um `OptOutRecord` gravado por e-mail ou telefone **sem** `leadId` (ex.: resposta
automática de e-mail "SAIR" registrada pelo webhook do Agente 05) **não** é
detectado por essas consultas.

O caminho principal de disparo (`advanceCadenceRun` via
`prismaLeadSubjectResolver`) resolve leadId + e-mail + telefone e está correto —
o gap é nos caminhos secundários:

1. `src/features/cadence/services/adaptiveMultichannelCadence.service.ts`
   `executeNextStep` (~linhas 119-126): `isOptedOut(..., { leadId: enrollment.leadId }, step.channel)`.
   O `enrollment` já carrega `contactEmail`/`contactPhone` (gravados em
   `enrollLead`) e eles não são usados no sujeito. Hoje `executeNextStep` é
   simulado (não envia de fato), mas é o contrato `IMultichannelCadencePort`
   que qualquer consumidor futuro usará.

2. `src/features/cadence/services/selfDrivingCrm.service.ts`
   `detectStagnatedLeads` (~linhas 309-318): três `isOptedOut` com
   `{ leadId }` apenas + `isLeadOptedOut` (que também usa só `leadId` via
   `normalizeOptOutSubject({ leadId })`). Leads com opt-out por e-mail/telefone
   podem ser marcados `eligibleForReactivation: true` indevidamente — a
   recomendação humana seguinte ainda passaria pela trava real no disparo, mas
   o relatório/alerta já estaria errado (e LGPD Art. 18 pede supressão na
   origem da decisão).

## Arquivo(s) envolvido(s)

- `src/features/cadence/services/adaptiveMultichannelCadence.service.ts` (~L119-126)
- `src/features/cadence/services/selfDrivingCrm.service.ts` (~L309-318, L257-263)

## Evidência

- `src/shared/domain/optOut.ts:108-116` — casamento exige identificador comum.
- `src/features/cadence/infra/PrismaLeadSubjectResolver.ts` — mostra o padrão
  correto (resolve email + whatsapp/phone) já usado no caminho principal.
- Auditoria estática do Agente 44 na baseline `32d07c375` (Onda 3); sem edição
  por não ser proprietário da pasta.

## Alteração necessária

Incluir e-mail/telefone no sujeito das consultas: em `executeNextStep`, usar
`{ leadId, email: enrollment.contactEmail, phoneE164: enrollment.contactPhone }`
(após `normalizeOptOutSubject`); em `detectStagnatedLeads`, resolver o contato
do lead (mesmo padrão de `PrismaLeadSubjectResolver`) antes de checar opt-out.
`isLeadOptedOut` do adaptive service tem a mesma limitação — avaliar incluir
contato na assinatura ou deprecar.

## Teste esperado

Teste unitário: opt-out gravado apenas por e-mail (sem leadId) bloqueia
`executeNextStep`/`detectStagnatedLeads` para o lead correspondente.

## Contexto adicional

- Sem envio real hoje nesses caminhos → prioridade normal, não bloqueador.
- Se a decisão for "sujeito parcial é aceitável porque o dispatch final
  revalida", registrar a decisão aqui e fechar o handoff.
