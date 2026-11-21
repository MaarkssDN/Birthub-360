# Parecer 24 — Agente 01 (Schema/RLS/Migrations) — 2026-11-20

**Handoff:** 00→01 schema-rls-migrations | **Branch:** `agente/01-schema-rls-migrations` | **Commit:** `150c1686c`

## Veredito: APROVADO (com observações fortes)

## Auditoria P1–P4
- **P1**: escopo parcialmente executado — ver "Pendências" abaixo. Nada de suposição silenciosa: limitações declaradas.
- **P2/P3**: 5 arquivos, 71+/3-, cada mudança mapeada a um débito. `auditLogModels.ts` usa `Object.keys(model.fields)` dinâmico — elimina drift futuro (melhor que lista literal).
- **P4**: `tsc --noEmit` limpo declarado; diff confere com a descrição.

## Verificações do revisor
- Fallback Bitrix agora exige `BITRIX24_WEBHOOK_URL_ENABLED=true` **e** org na allowlist ou `*` — fecha DEBT-0006 no código. **Porém:** como o default é `false`, orgs que dependiam do fallback global param de importar até opt-in — mudança de comportamento intencional e fail-closed; comunicar antes do deploy.
- `companyId` agora valida `organizationId` em `PrismaContactRepository` e `LeadUseCases` — DEBT-0018 mitigado em código (schema fix fica pendente).
- Cobertura soft-delete agora é **derivada do schema** (todos os modelos com `deletedAt`), não mais lista manual — DEBT-0056 estruturalmente resolvido.

## Pendências honestas (não bloqueiam o merge, mas devem gerar handoffs)
1. **RLS não aplicada** (DEBT-0057/0058/DB-08): sem `ALTER TABLE`/`CREATE POLICY`/migrations — executor respeitou ownership de integração. **Crítico para P0**: exige branch `integracao/schema-*` com migrations dedicadas e RLS real.
2. **DEBT-0020** (transação no import Bitrix) é do 06 — handoff deve ir para `00→06`.
3. `prisma/schema.prisma` intocado por design; quando migrations entrarem, revisar FK composta `Contact.companyId`.
4. `env.ts` alterado — config é fronteira com 00/08; diff mínimo (+9), aceitável.

## Conformidade
Sem secrets; sem migration não autorizada; sem destrutivo.
