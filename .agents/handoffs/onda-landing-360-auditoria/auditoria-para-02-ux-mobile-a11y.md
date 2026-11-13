- De: Auditoria ad-hoc (Devin CLI) — promover a 00 se virar missão formal
- Para: 02 — Produto e UX (com consulta a 03 — Design e Acessibilidade)
- Onda: landing-360-auditoria
- Status: resolvido
- Prioridade: normal

## Problema

UX mobile, ícones e footer:

1. **Mobile sem navegação**: abaixo de 720px `.b360-topnav` é
   `display:none` (LandingAdaptive.css ~L1131-1137) e não existe hamburger
   ou menu alternativo — o visitante mobile perde todos os links de seção.
2. **Glifos unicode como ícones**: `COMMAND_MODULES` usa `▦ ◎ ⌘ ✦ ◔ ✧ ⇄ ◈ ⚙ ▣ ✺`
   (~L425-503) — renderização depende da fonte do sistema; risco de "tofu"
   (□) em Windows/Android. Trocar por ícones lucide (já usados no resto da
   página) ou SVG próprio.
3. **Footer incompleto**: rota `/terms` existe mas não há link para Termos de
   Uso; colunas "Conectividade" e "Governança" usam `<span>` de texto morto
   em vez de links/ações (~L2533-2569).
4. **Emojis em UI premium**: 🔥 no badge de urgência, 🧪 no dock A/B (que
   também é ferramenta interna exposta ao cliente), ✓ nos bullets do form,
   🔒 no rodapé — inconsistente com a estética institucional e com a marca.

## Arquivo(s) envolvido(s)

- `src/features/landing/pages/Landing360.tsx` — topbar (~L1039-1052),
  COMMAND_MODULES (~L425-503), footer (~L2461-2638)
- `src/features/landing/pages/LandingAdaptive.css` — media query ~L1131
- Possível novo componente de menu mobile (patrimônio do 02; validar com 03)

## Alteração necessária

1. Criar navegação mobile mínima (drawer ou barra de âncoras horizontal)
   cobrindo as mesmas seções do topnav desktop.
2. Substituir glifos unicode por ícones consistentes com o design system.
3. Footer: linkar `/terms`, transformar itens mortos em links âncora
   (`#destaques`, `#ecossistema`) ou remover.
4. Remover emojis de UI ou substituí-los pelo sistema de ícones; o dock A/B
   deve ser ocultado em produção (depende de decisão sobre o experimento —
   se o A/B for interno, considerar `import.meta.env.DEV` ou feature flag).

## Teste esperado

- Viewport 375px: todos os links de seção acessíveis.
- Command Center renderiza ícones corretos em Windows e Android.
- Footer tem links funcionais para `/privacy` e `/terms`.
- Nenhum emoji em texto de UI (verificar com grep por range unicode).

## Contexto adicional

- Itens 17 e 22 têm componente de design — consultar o 03 antes de implementar
  o padrão de navegação mobile e a política de ícones/emoji.
- WCAG: alvo de toque 44px nos novos controles mobile.

## Resolução (Agente 02 — 2026-11-12, commit `510bce4bd`)

- Navegação mobile implementada: botão hambúrguer + painel `b360-mobile-nav` visível <720px, alvos ≥44px, `aria-expanded`/`aria-controls`.
- Glifos Unicode de `COMMAND_MODULES` substituídos por ícones Lucide estáveis (LayoutGrid, Radar, Repeat, TrendingUp, Gauge, Bot, Workflow, Headset, Settings, Smartphone, Share2).
- Footer: link funcional `/terms` adicionado; itens de Conectividade viraram anchors `#ecossistema`; "Direitos do Titular" → `/privacy`.
- Emojis removidos do chrome de UI (🔥❌✓🔒🧪⚡ → Lucide/texto).
- Gates: tsc ✅, Biome ✅, testes landing ✅. Verificação visual 375px recomendada no PR (dev server).
