De: 00 — Coordenador
Para: 02 — Produto e UX
Onda: paralela-8
Status: resolvido
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

## Resolução (Agente 02 — 2026-11-12, branch `agente/02-ux-saneamento`)

- `src/components/layout/tabMeta.ts`: casts `as any` substituídos por contrato real `TabNavIcon`/`TabNavIconProps` (suporta ícones Lucide e ícones custom de pilar com prop `isActive`).
- `src/features/intelligence/components/UniversalEcosystemPanel.tsx`: `as any` substituídos por aliases de resposta tipados e narrowing da união `officeType`.
- `NavLaunchTransition.tsx` e `CommandPalette.tsx` (src/components/ui, dono 03) tiveram apenas o *tipo* de ícone alargado para o contrato compartilhado — sem mudança visual.
- Gates: `npx tsc --noEmit` ✅, Biome ✅, 9 arquivos/45 testes de layout+nav ✅.
- Commit: `6b36e7110`.
