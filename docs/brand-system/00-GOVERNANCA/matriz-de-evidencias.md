# Matriz de Evidências

| # | Descoberta | Estado | Onde | Evidência |
|---|---|---|---|---|
| E1 | Tokens canônicos vivem em `identidade-visual/birthhub360/tokens/` e são importados por `src/styles/official-identity.css` | CONFIRMADO | `official-identity.css:1-2` | `@import` |
| E2 | Paleta escura: fundo `#0D0D0D`, card `#14141A`, ciano `#00D4FF`, rosa `#FF2D9B`, ouro `#FFC107`, íris `#8B7DFF` | CONFIRMADO | `birthhub360.css` | valores literais |
| E3 | Tema claro tem valores distintos e parcialmente divergentes de `DESIGN.md` | CONFLITANTE | C-01..C-03 | comparação de arquivos |
| E4 | Trinca tipográfica Sora/Inter/IBM Plex Mono com `font-feature-settings: "cv05","cv11","ss01"` e tracking −0.012em | CONFIRMADO | `birthhub360.css` | `--font-*`, `--font-features-rounded` |
| E5 | Raios 12/16/20/9999 px | CONFIRMADO (tokens) / PARCIAL (uso) | tokens × `Button.tsx` | C-05 |
| E6 | 4 estados obrigatórios (loading/empty/error/stale) via `OperationalStateContainer` | DOCUMENTADO (`DESIGN.md`) e componente existe; adoção por módulo NÃO VERIFICADO | `src/components/ui/OperationalStateContainer.tsx` | arquivo existe |
| E7 | 11 módulos + Hub registrados | CONFIRMADO | `src/components/layout/moduleRegistry.ts` | `ModuleId` |
| E8 | 73 atributos `path=` em `AppLayout.tsx` (rotas `/app/*`, incl. redirects) + 13 `<Route>` em `App.tsx` | CONFIRMADO | [rotas.csv](../_inventarios/rotas.csv) | script |
| E9 | Motion: framer-motion em 124 arquivos; `useReducedMotion` em 40; `prefers-reduced-motion` em 17 CSS; `MotionConfig` na raiz | CONFIRMADO | [motion-metricas.csv](../_inventarios/motion-metricas.csv), `App.tsx` | script |
| E10 | Das 130 peças de componentes visuais: 29 com hex hardcoded, 39 com framer-motion, 18 com tratamento de reduced-motion, 4 stories, 7 com teste adjacente | CONFIRMADO | [componentes.csv](../_inventarios/componentes.csv) | script (heurística de nome) |
| E11 | 29 personagens SVG + tokens de personagens | CONFIRMADO | `identidade-visual/birthhub360/characters/` | listagem |
| E12 | Conteúdo dos HTML/MD do Desktop e protótipos | NÃO VERIFICADO | — | não lidos |
| E13 | Comportamento em runtime / capturas visuais | NÃO VERIFICADO | — | app não executada |
