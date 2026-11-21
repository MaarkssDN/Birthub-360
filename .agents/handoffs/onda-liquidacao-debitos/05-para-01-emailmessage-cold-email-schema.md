De: 05 — Prospecção
Para: 01 — Plataforma, Segurança e Dados
Onda: liquidação de débitos (DEBT-0011)
Status: aberto
Prioridade: normal
Bloqueador-ref: DEBT-0011 (parcialmente mitigado), DEBT-0044 (nota do parecer 24 — handoff conjunto)
Sprint destino: próxima onda de schema

## Problema

`sendColdEmail` (`src/features/prospecting/services/cold-email.service.ts`) passou a persistir o
disparo em `EmailMessage` (direction 'outbound') com dedupe por `campaignId+target`, mas o modelo
`EmailMessage` não tem colunas para os dados que a LGPD/trilha de auditoria exigem gravar:

1. **`legalBasis` e `dataSource`** — obrigatórios por `ColdEmailCampaign` e validados antes do
   envio, mas sem coluna em `EmailMessage` (nem em `Activity`). Hoje ficam apenas em texto livre
   (`Activity.observations` / `TimelineEvent.description`), o que é frágil para consulta/auditoria
   (DEBT-0011 pedia "gravar legalBasis/dataSource" de forma estruturada).
2. **`campaignId` / chave de idempotência dedicada** — o dedupe usa `providerMessageId` com valor
   sintético `cold-email:{campaignId}:{targetEmail}` porque é a única coluna UNIQUE por
   organização. Isso sobrescreve a semântica documentada da coluna ("Header Message-Id") para
   linhas outbound: o Message-Id real do SMTP vai só para log/`Activity.observations`. Funciona
   hoje porque nenhum consumidor faz join `inReplyTo → providerMessageId` de outbound
   (`emailReply.webhook.ts` usa `direction`+`body`), mas é débito de modelagem.
3. **`leadId` opcional vs. Activity obrigatória** — campanhas sem `leadId` persistem só
   `EmailMessage` (sem Activity/TimelineEvent, pois ambos exigem `leadId` NOT NULL). Se o produto
   quiser trilha CRM completa para prospecção sem lead, é decisão de schema (ex.: Activity com
   leadId opcional ou entidade Campaign própria).

## Arquivo(s) envolvido(s)

- `prisma/schema.prisma` — model `EmailMessage` (~L3685).
- Implementação de referência: `src/features/prospecting/services/cold-email.service.ts`
  (`coldEmailDedupeKey`, `persistColdEmailDispatch`).

## Evidência

- Missão DEBT-0011 (`.agents/runs/00-reconciliacao-release-readiness-20261119.md`): "Persistir
  disparo (Activity+EmailMessage), dedupe por campaignId+target, gravar legalBasis/dataSource".
- Parecer 24 (`.agents/reviews/24-revisao-release-readiness-audit-2026-11-18.md`): "DEBT-0011+0044
  = um único handoff" — a parte de rotas/idempotência do endpoint (`prospecting.routes.ts`)
  continua aberta e é bloqueada pelo PR #401 em voo (SSRF guard + RBAC /enrich, dono 05/15);
  quando aquele PR mergear, o 05 deve tratar o restante do DEBT-0044 na rota `/cold-email`
  (idempotency key do request, distinguir dedupe/opt-out de falha real no status HTTP — hoje tudo
  vira 500).

## Alteração necessária (proposta — decisão do 01)

Em `EmailMessage`, avaliar adicionar (todas nullable, aditivas):

```prisma
campaignId    String?   // id da campanha de prospecção, quando houver
legalBasis    String?   // 'legitimate_interest' | 'consent' | ...
dataSource    String?   // provider de origem do contato (apollo, hunter, ...)
smtpMessageId String?   // Message-Id real devolvido pelo transporte, separado da chave de dedupe
```

E, idealmente, um índice/unique dedicado para dedupe de disparo (ex.: partial unique em
`(organizationId, campaignId, toEmail)` quando `direction='outbound'` e `campaignId IS NOT NULL`),
liberando `providerMessageId` para voltar a carregar o Message-Id real — mantendo compatibilidade
com as linhas já gravadas com a chave `cold-email:*` (migração de dados ou aceitar as duas formas
na leitura).

## Teste esperado

- `npx tsc --noEmit`, `npm run lint`, `npm run test:unit` (cold-email.service.test.ts),
  `npm run test:integration -- tests/integration/cold-email-optout.test.ts`.
- Após colunas novas: ajustar `persistColdEmailDispatch` para gravar os campos estruturados e
  manter `Activity.observations` como redundância legível.

## Contexto adicional

- Tenancy: todas as escritas já passam `organizationId` explícito e respeitam RLS via
  `requestContext` (padrão `CadenceDispatchers.ts`); nenhuma mudança de tenancy é necessária.
- LGPD (agente 21): a trilha de base legal hoje é texto livre; colunas estruturadas facilitam
  inventário de tratamento e resposta a titulares — alinhar com 21 ao modelar.
- Não é bloqueador para o merge do DEBT-0011: a implementação atual já entrega persistência,
  dedupe e trilha mínima de legalBasis/dataSource.
