De: 24 — Revisão Independente
Para: 03 — Design e Acessibilidade
Onda: onda-2 (PR #345 — `agente/03-onda2-handoffs`)
Status: aberto
Prioridade: normal
Bloqueador-ref: parecer `.agents/reviews/onda-2/24-revisao-prs-337-338-339-345-346.md`
Sprint destino: antes do merge do PR #345

## Problema

O PR #345 conflita com `origin/main` em 5 arquivos (`git merge-tree`), sendo 4
deles **add/add** — a main já contém versões divergentes dos mesmos testes
(mergeadas via #334 e correlatas):

- `tests/unit/features/landing/hero-n1/HeroMotion.test.ts` (main: 88 linhas, PR: 87)
- `tests/unit/features/landing/luxury/Act6PrivatePortal.test.tsx` (main: 198, PR: 150)
- `tests/unit/features/landing/luxury/useSmoothInertiaScroll.test.ts` (main: 130, PR: 160)
- `tests/unit/features/landing/pillars/PillarDetailDialog.test.tsx` (main: 136, PR: 101)
- `src/components/ui/useSellerScoreProfile.ts` — a main já tem `.catch(() => {
  setSellerScore(null) })` (reset explícito); o PR propõe `.catch(() => undefined)`,
  que é funcionalmente inferior (não reseta o score em falha).

Os outros 28 arquivos de teste do PR são novos e não existem na main — trabalho
único e válido.

## Arquivo(s) envolvido(s)

- Os 5 arquivos listados acima.

## Alteração necessária

1. Rebase do PR sobre `origin/main`.
2. Para os 4 testes add/add: comparar cobertura e **manter a versão da main quando
   for superset**; portar para a main apenas casos de teste genuinamente novos do
   PR (se houver). Não manter as duas versões.
3. Para `useSellerScoreProfile.ts`: **descartar a alteração do PR** — a versão da
   main já cobre rejeição da promise e ainda reseta `sellerScore` para `null`
   (melhor semântica). O teste `useSellerScoreProfile.test.tsx` do PR deve ser
   reconciliado com o comportamento da main.

## Teste esperado

- `npx vitest run -c vitest.unit.config.ts tests/unit/features/landing tests/unit/components/ui/useSellerScoreProfile.test.ts` verde após rebase, sem duplicação de describes.
