De: 00 — Coordenador
Para: 02 — Produto e UX
Onda: paralela-8
Status: aberto
Prioridade: normal

## Problema
Casts `as any` em código de produção de layout/inteligência, mascarando erros de tipo:
- `src/components/layout/tabMeta.ts` — 6 ocorrências
- `src/features/intelligence/components/UniversalEcosystemPanel.tsx` — 7 ocorrências

## Evidência
`grep -rn "as any" src` — arquivos no topo do ranking de ocorrências. knip também reporta exports/types não usados nesses módulos.

## Alteração necessária
Substituir `as any` por tipos reais, generics ou narrowing mínimo. Não alterar comportamento visual. Não refatorar além do necessário (P3).

## Teste esperado
`npx tsc --noEmit` limpo; `npx biome lint` nos arquivos sem novos warnings; nenhum erro de tipo introduzido.

## Contexto
Worktree: `.claude/worktrees/ag-02`, branch `agente/02-asany-layout`.
