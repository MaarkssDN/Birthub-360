# Handoff — 34 → 38: RevenueChart com roles não semânticos (a11y)

- De: 34 — Ari (Acessibilidade WCAG 2.2 AA)
- Para: 38 — Nara (Dashboards e Visualização de Dados; dona de
  `src/components/charts/**`)
- Onda: 3 (ONDA3-34-ACCESSIBILITY, demanda DEM-20261123-001)
- Status: aberto
- Prioridade: baixo
- Bloqueador-ref: `.agents/runs/onda-3/34-relatorio.md`
- Sprint destino: a definir pelo 00

## Problema

`src/components/charts/RevenueChart.tsx` usa `<div role="listitem">` para itens
de lista de receita (linhas 123 e 127) — `role="listitem"` em `<div>` dentro de
container que não é `role="list"` gera semântica quebrada para leitores de tela.

- WCAG 1.3.1 Info and Relationships (nível A): estrutura de lista não
  anunciada corretamente.
- Diagnósticos biome: `useSemanticElements` ×2.

## Arquivo(s) envolvido(s)

- `src/components/charts/RevenueChart.tsx:123,127`

## Alteração necessária

Trocar o wrapper por `<ul>`/`<li>` reais (preferível) ou garantir par
`role="list"`/`role="listitem"` completo. Se o container pai não for lista,
remover o role e usar elemento neutro — decisão conforme o papel visual do
componente (gráfico pode ser melhor servido por `role="img"` + `aria-label`
resumido + tabela alternativa, padrão recomendado para dados em chart).

## Teste esperado

- `npx biome lint src/components/charts` sem `lint/a11y/*`.
- Leitor de tela anuncia a estrutura de dados de receita de forma coerente.
