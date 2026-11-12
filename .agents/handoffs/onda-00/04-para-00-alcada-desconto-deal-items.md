# Handoff — Alçada de desconto em `addDealItem` (itens de negócio)

```
De: Agente 04 — CRM e BI
Para: Agente 00 (Coordenador) — triagem de escopo
Onda: coordenador-20261112 (pós-auditoria supervisor Onda 00, MOD-01/JOR-08)
Status: aberto
Prioridade: normal
Bloqueador-ref: MOD-01 / RN-CRM-02
Sprint destino: a definir pelo 00
```

## Problema

A trava transacional de alçada de desconto (RN-CRM-02) foi aplicada nos caminhos de
escrita de **documentos comerciais** (`PrismaCrm360Repository.createDocument` e
`updateDocumentContent`, via `src/features/crm360/infra/PrismaDiscountAuthorityGuard.ts`
+ `domain/discountAuthority.ts`).

`addDealItem` (itens de um negócio/lead — `CrmDealItem`, não `CrmCommercialDocument`)
permanece **sem** verificação de alçada: um CLOSER/SDR pode adicionar item de negócio
com `discountPercent` arbitrário. Decisão de escopo da missão MOD-01: a auditoria falava
de "propostas comerciais" e a tabela versionada/documento era o alvo; itens de negócio
são uma superfície adjacente que usa cálculo próprio (`calculateItem`/`computeDocumentTotals`
são compartilhados, mas a persistência é em outra tabela sem snapshot/versionamento).

## Arquivo(s) envolvido(s)

- `src/features/crm360/infra/PrismaCrm360Repository.ts` — método `addDealItem` (~linha 730).
- `src/features/crm360/domain/discountAuthority.ts` — guarda reusável
  (`evaluateDiscountAuthority`, `assertDiscountAuthorityWithinTransaction` em
  `infra/PrismaDiscountAuthorityGuard.ts` já aceita qualquer lista de line items).

## Evidência

- Comentário no cabeçalho de `src/features/crm360/domain/discountAuthority.ts` registra
  explicitamente: "`addDealItem` (itens de negócio, não documento comercial) segue sem
  trava de alçada — pendência registrada em handoff" (este arquivo).
- `addDealItem` chama `calculateItem(input)` e persiste via `prisma.crmDealItem.create`
  fora de `runInTransaction` e sem `assertDiscountAuthorityWithinTransaction`.

## Alteração necessária

Decisão do 00: (a) estender a mesma guarda ao `addDealItem` (provavelmente trivial —
reusar `assertDiscountAuthorityWithinTransaction` dentro de um `runInTransaction`,
avaliando o item isolado via `computeMaxItemDiscountPercent`), ou (b) registrar como
débito aceito se itens de negócio não forem considerados "proposta comercial" sob
RN-CRM-02. Se (a), lembrar que `addDealItem` hoje não recebe `actorUserId` na assinatura
do `ICrm360Repository` — seria preciso propagar o ator do controller (mesmo padrão já
usado em `createDocument`/`updateDocumentContent`).

## Teste esperado

Estender `tests/unit/features/crm360/infra/discountAuthorityLock.test.ts` (ou novo
arquivo irmão) provando que `addDealItem` com desconto acima da alçada do papel é
rejeitado com 403 e nada persiste.

## Contexto adicional

Implementação de referência da trava transacional (padrão a copiar):
`PrismaCrm360Repository.updateDocumentContent` — `SELECT ... FOR UPDATE` na linha +
`assertDiscountAuthorityWithinTransaction` dentro de `runInTransaction`, com papel do
ator lido de `User.role` e thresholds de `Setting.key='approval_thresholds'`
(fallback: Closer 10% / Gestor 20% / ADMIN irrestrito).
