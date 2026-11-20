De: 00 (Astra)
Para: 00 / decisão humana (AGENTS.md é regra global)
Onda: Checklist 2026-11-19 · Onda 1
Status: aberto
Prioridade: alto
Bloqueador-ref: B-10
Sprint destino: próximo

## Problema
AGENTS.md §15 atribui `src/lib/db/rls/**` ao Agente 13 (Nilo), mas o diretório não existe. O gate
`verify:ownership-coverage` (e `tests/unit/architecture/ownership-coverage.test.ts`, caso "repositório
real") falha com 1 violação por isso.

## Arquivo(s) envolvido(s)
`AGENTS.md` (§15 e roster do Squad 10) — regra global, fora do escopo de edição por agentes.

## Evidência
`npx tsx scripts/governance/check-ownership-coverage.ts` →
`Escopo "src/lib/db/rls/**": path não existe no repositório`.
As políticas de RLS vivem em `prisma/migrations/**` (Agente 12), `src/lib/tenant-prisma.ts`,
`src/lib/prisma.ts` e `scripts/security/rls-coverage.ts`.

## Alteração necessária
Decisão humana: (a) apontar o escopo do Agente 13 para os caminhos reais acima no AGENTS.md §15 (e
atualizar o manifesto `scripts/governance/ownership-coverage.manifest.json` na mesma alteração), ou
(b) criar de fato o módulo `src/lib/db/rls/` se essa for a arquitetura pretendida.

## Teste esperado
`npm run verify:ownership-coverage` sem violações.

## Contexto adicional
O manifesto e o teste do parser já foram sincronizados com a matriz de 100 agentes (antes usavam a
numeração antiga de 24 agentes); só esta violação permanece.
