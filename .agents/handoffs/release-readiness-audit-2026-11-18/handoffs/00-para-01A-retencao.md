- De: 00
- Para: 01A (Confiabilidade de dados/RLS/retenção)
- Status: ABERTO — depende de decisão humana (janelas de retenção)
- Prioridade: P1

## Achado principal

### DEBT-0021 — retentionPurge.service.ts dead code + incompatível com RLS — P1
`src/shared/services/retentionPurge.service.ts:46-209`: nunca chamado, sem scheduler; usa prisma global fora de `requestContext.run({tenantId})` → RLS esconde linhas → deleteMany falha silencioso; `auditLogDays` calculado e não usado.
**Correção:** worker dedicado no padrão `bitrixExtractionPurge` (descobrir orgs → requestContext por org); decidir política de AuditLog (append-only c/ triggers — não purgável por DELETE simples).
**Bloqueio:** aguardar janelas oficiais de retenção (decisão humana pendente — ver INDEX.md). Não ligar purge sem elas.

## Achados relacionados (contexto)
- VOZ-01/02: voz (VoiceCallLog, Note, Activity, ThreeCXCallEvent.rawPayload) fora do inventário de expurgo — incluir no desenho de retenção junto com 12/21.
- DB-05/06/08: soft-delete opt-in, pontos cegos do gate RLS, lacunas FK — handoff separado para 01.

## Aceite
Worker agendado purga por org com tenant context; janelas documentadas; teste prova que linhas de tenant são efetivamente removidas e de outros tenants intactas.
