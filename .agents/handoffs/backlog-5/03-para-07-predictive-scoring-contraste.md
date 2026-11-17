De: Agente 03 — Design e Acessibilidade
Para: Agente 07 — IA e Automações
Onda: Backlog Onda 5 / DEM-20261116-001
Status: aberto
Prioridade: normal
Bloqueador-ref: MEL-37
Sprint destino: backlog-5

## Problema

`src/features/intelligence/components/PredictiveScoringNbaCard.tsx` é um card de superfície sempre escura (`bg-[#1C1D24]`, `bg-[#13151A]`, `border-white/5`) sem variante de tema — mesmo padrão "dark cockpit" de Analytics. A maioria dos textos passa, mas:

- `text-slate-500` (#64748B) sobre `#1C1D24`/`#13151A` = **~3.5:1** — usado em texto de 10–11px ("/100" nas linhas 213, 239, 252). Abaixo de WCAG AA 4.5:1.
- Demais pares verificados OK: `text-slate-400` (6.55:1), `text-slate-300` (~11:1), `text-[#8B7DFF]` (5.18:1), `text-white`.

## Arquivo(s) envolvido(s)

- `src/features/intelligence/components/PredictiveScoringNbaCard.tsx` (linhas 213, 239, 252)

## Evidência

Contraste calculado pela fórmula de luminância relativa do WCAG. O componente é embedado em `src/features/crm/components/LeadDetailDrawer.tsx` — em tema claro, o card escuro permanece escuro (decisão visual existente, não mexi), então hex fixo é apropriado; NÃO trocar por token de tema.

## Alteração necessária

`text-slate-500` → `text-slate-400` nas 3 ocorrências ("/100"). Cirúrgico, 3 classes.

## Teste esperado

Lint + smoke visual do drawer de lead em tema claro e escuro; contraste do "/100" ≥ 4.5:1 (~6.5:1 após troca).

## Contexto adicional

Se a decisão de produto for tornar o card theme-aware no futuro, aí sim valeria migrar para tokens `bg-surface`/`text-ink` — mas isso é redesign, fora do escopo MEL-37.
