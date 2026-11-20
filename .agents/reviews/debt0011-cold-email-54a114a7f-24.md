# Parecer 24 — Revisão Independente

- **Missão**: DEBT-0011 — `sendColdEmail` sem persistência/idempotência/legalBasis gravada
- **Autor**: Agente 05 (Prospecção) — `agente/05-cold-email-persistencia`
- **Auditor**: Agente 24 (Revisão Independente)
- **PR**: #437 — commit revisado `54a114a7fdaf08beb13d1f27bfc0aff8c8b9e891` (worktree `C:\Github\Birthub-360-worktrees\agente-05-cold-email`)
- **Data**: 2026-11-19

## Arquivos da entrega

- `src/features/prospecting/services/cold-email.service.ts` (+~160)
- `src/features/prospecting/services/__tests__/cold-email.service.test.ts` (+~140)
- `tests/integration/cold-email-optout.test.ts` (+~40)
- `.agents/handoffs/onda-liquidacao-debitos/05-para-01-emailmessage-cold-email-schema.md` (novo)

`prospecting.routes.ts` **não** foi tocado — confirmado no diff e coerente com a restrição do PR #401 em voo. Escopo respeitado; nenhum arquivo de outro proprietário alterado (`prisma/schema.prisma` é do 01 e não foi editado).

## Verificações executadas por mim (não apenas lidas)

| Verificação | Resultado |
|---|---|
| `npx vitest run -c vitest.unit.config.ts .../cold-email.service.test.ts` (worktree, commit exato) | **15/15 passam** |
| `npx tsc --noEmit` (worktree) | **limpo (exit 0)** |
| `npx vitest run -c vitest.integration.config.ts tests/integration/cold-email-optout.test.ts` (Postgres real, `birthhub_postgres:5434`) | **6/6 passam**, incl. o novo teste de dedupe ponta a ponta |
| `@@unique([organizationId, providerMessageId])` em `EmailMessage` | confirmado em `prisma/schema.prisma:3705` — a trava usada existe de fato |
| `sendEmail` retorna `{ messageId: string \| null }` | confirmado em `src/lib/email/mailer.ts:53` |
| Colunas `Activity` (`type`/`status`/`owner`/`date`/`observations`, `organizationId` NOT NULL) e `TimelineEvent` (`leadId` NOT NULL, sem org) | conferidos no schema; o código só grava Activity/TimelineEvent quando `leadId` presente — condizente com as FKs |
| Padrão de escrita `TimelineEvent` sem `organizationId` | idêntico aos writes existentes (`PrismaActivityRepository.ts:141`, `activity.service.ts:135`) — RLS da tabela filtra via tabela pai, sem regressão |

## Análise dos pontos críticos pedidos

1. **Dedupe key correta e não colide com envios reais** — `cold-email:{campaignId}:{targetEmail.trim().toLowerCase()}`. Message-Ids SMTP reais têm formato `<...@...>` e chegam via webhook em `providerMessageId` de linhas inbound; o prefixo `cold-email:` não colide. O unique é por `(organizationId, providerMessageId)` — escopo de tenant correto, sem colisão cross-org.
2. **Persistência só pós-SMTP** — `persistColdEmailDispatch` é chamada somente após `sendEmail` resolver; o `catch` de envio retorna `false` antes de qualquer escrita. Teste unitário "falha no envio não persiste nada" e o caminho de código confirmam.
3. **P2002 benigno** — `findUnique` prévio + `create` dentro de `try/catch` que trata `PrismaClientKnownRequestError` code `P2002` como corrida benigna (e-mail já saiu → `true` + warn); demais erros → `logger.error` + `true` (honestidade: o e-mail saiu de verdade). Correto.
4. **Tenancy/RLS** — `organizationId` vem do usuário autenticado na rota (`prospecting.routes.ts:348`), nunca do body; todas as escritas passam `organizationId` explícito e rodam sob `requestContext` do tenant. Integração prova com `asOrg`/`withRlsBypass`.
5. **LGPD** — `legalBasis`/`dataSource` gravados em `Activity.observations` e `TimelineEvent.description` (texto livre — limitação documentada); sem `leadId` fica só `EmailMessage` (FKs exigem lead). Handoff ao 01 pede colunas estruturadas — aberto e correto, pois schema é dele.
6. **Honestidade de falha** — falha SMTP → `false` sem persistir; dedupe → `false` sem tocar SMTP; persistência falha pós-envio → `true` + log de erro (não induz reenvio cego — na verdade induziria, mas a linha de dedupe ausente é o risco real e está logado como erro, não warn). Decisão defensável e documentada.

## Achados

- **Baixa** — `sendColdEmailBatch` mapeia `sendColdEmail === false` para `outcome: 'failed'`; um disparo bloqueado por dedupe aparece como "failed" no resumo do lote, indistinguível de falha SMTP. Cosmético; o log interno distingue (`reason: 'duplicate'`). Proprietário: 05. Não bloqueia.
- **Baixa** — `EmailMessage.toEmail` grava `campaign.targetEmail` cru (sem trim/lowercase) enquanto a dedupe key normaliza. Inócuo para o dedupe (que usa `providerMessageId`), mas pode gerar linhas duplicadas visualmente diferentes para o mesmo alvo. 05.
- **Info** — `providerMessageId` outbound passa a carregar chave sintética em vez do Message-Id SMTP (que vai para log/`Activity.observations`). Nenhum consumidor atual depende do join — verificado `emailReply.webhook.ts` usa `direction`+`body`. Documentado no handoff ao 01.
- **Info** — DEBT-0044 residual (rota `/cold-email` colapsa dedupe/opt-out/falha em 500) permanece aberto e corretamente bloqueado pelo PR #401; registrado no handoff `05-para-01-...` e no comentário do serviço.

## Veredito

**APROVADO** — para o escopo do DEBT-0011 conforme implementado (persistência + dedupe durável + trilha mínima de base legal). Os débitos de modelagem (colunas `campaignId`/`legalBasis`/`dataSource`/`smtpMessageId` em `EmailMessage` e o residual DEBT-0044 de rotas) estão formalmente transferidos via handoff aberto ao 01/05 e não são regressão desta entrega. Evidência executável: unit 15/15, integração 6/6 contra Postgres real, `tsc --noEmit` limpo.
