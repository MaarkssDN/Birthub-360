# Handoff — Agente 01 → Agente 24 (Revisão Independente)

- **De:** 01 — Plataforma, Segurança e Dados
- **Para:** 24 — Revisão Independente
- **Onda:** 3 (demanda DEM-20261113-004)
- **Status:** em-andamento (aguardando revisão)
- **Prioridade:** normal
- **Branch:** `agente/01-onda3-banco` (worktree `agente-01-onda3-banco`)
- **Sprint destino:** Onda 3 / integração `integracao/onda-3`

## Problema

Revisar a entrega do Agente 01 na Onda 3: índices em queries quentes (MEL-17),
decisão sobre split do schema.prisma (MEL-18) e teste de isolamento tenant-prisma
(MEL-20).

## Arquivo(s) envolvido(s)

- `prisma/schema.prisma` — 7 novos `@@index` (Lead ×2, Activity ×2, Note, Company, Contact)
- `prisma/migrations/20261113120000_wave3_hot_path_indexes/migration.sql` — migration ADITIVA nova
- `.agents/runs/onda-3/01-mel18-decisao-split-schema.md` — documento de decisão (somente decisão, sem split executado)
- `.agents/runs/onda-3/01-relatorio.md` — relatório completo
- `tests/unit/lib/tenant-isolation-guard.test.ts` — 13 testes novos de isolamento tenant

## Evidência

- `npx prisma validate` ✅ / `npx prisma generate` ✅
- `npx tsc --noEmit` ✅ exit 0
- `npm run lint` ✅ exit 0 (warnings pré-existentes apenas)
- `vitest` arquivos relevantes: 38/38 + 33/33 ✅
- Migration classificada ADITIVA no cabeçalho conforme runbook; bloco ROLLBACK comentado.
- Análise de índices é ESTÁTICA (padrão where/orderBy dos repositories) — sem EXPLAIN
  ANALYZE real; declarado honestamente no relatório e no migration.sql.
- MEL-18: recomendação "adiar para onda dedicada" com plano de 7 passos; nenhum arquivo
  de schema foi dividido.

## Alteração necessária (para o revisor)

1. Conferir que cada `@@index` corresponde a um `CREATE INDEX` na migration (7 pares) e
   que os nomes seguem a convenção Prisma (`<Model>_<cols>_idx`).
2. Conferir que nenhum índice proposto duplica um existente (ver lista de rejeitados no
   migration.sql).
3. Avaliar se a decisão MEL-18 (não fazer agora) é aceitável ou se o 00 quer antecipar.
4. Avaliar o gap documentado do MEL-20 (`runWithContext` sem validação de tenant —
   contenção depende da RLS) como achado a registrar ou não.

## Teste esperado

- Rodar `npx vitest run -c vitest.unit.config.ts tests/unit/lib/tenant-isolation-guard.test.ts tests/unit/lib/tenant-scoping-parity.test.ts src/lib/__tests__/prisma-interceptors.unit.test.ts`
- `npx prisma validate`
- Revisão de diff: `git diff integracao/onda-3...agente/01-onda3-banco -- prisma/`

## Contexto adicional

- `prisma/**` é propriedade do Agente 01; `tests/**` é do Agente 08 — o teste MEL-20 foi
  criado sob missão explícita do 00 (registrar ciência ao integrar).
- Nenhum migrate foi executado; a migration precisa passar por `migrate deploy` no
  pipeline normal de integração/homologação.
- `node_modules` é junctionado para o repo principal; `prisma generate` rodou com sucesso
  (client 7.10.0).
