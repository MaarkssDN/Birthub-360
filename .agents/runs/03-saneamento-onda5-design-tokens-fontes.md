# Run — Agente 03 — Handoffs de saneamento (Onda 5 / onda-saneamento-20261110)

- Data: 2026-11-12
- Agente: 03 — Design e Acessibilidade
- Branch: `agente/03-design-saneamento` (worktree `C:\Github\Birthub-360-worktrees\agente-03-design`, base `origin/main` @ bd292b3be)

## Handoffs tratados

| Handoff | Status | Commit |
|---|---|---|
| `00-para-03-instabilidade-...-regressao-visual` (TAREFA-SANEAMENTO-017 / BT360-DT-0020) | resolvido | `c3eaefd34` |
| `00-para-03-proliferacao-de-...-important` (TAREFA-SANEAMENTO-003 / BT360-DT-0017) | resolvido | `0a6015a9f` |
| `11-para-03-divergencias-residuais-de-tokens` (BT360-DT-0060) | resolvido | `c3eaefd34` |

Handoffs "Para: 03" em aberto não encontrados fora desta pasta. O arquivo
`onda-landing-360-auditoria/auditoria-para-02-ux-mobile-a11y.md` é endereçado ao
Agente 02 (com consulta ao 03) — fora da titularidade desta execução; fica
registrado para o 02/00.

## Mudanças

### Commit `c3eaefd34` — fontes self-hosted + tokens canônicos
- `src/styles/globals.css`: removido `@import` do Google Fonts; IBM Plex Mono
  migrado de TTF para WOFF2 (latin + latin-ext, unicode-range, `font-display:
  swap`, fallback TTF); pilhas `--font-brand-sans`/`--font-brand-display`
  alinhadas a Inter/Sora; literais `:root`/`@theme` alinhados ao canônico
  (`#F8F9FF`, `#D91B7C`, `#0284C7`); `#70D6FF` preservado como `--neon-text`.
- `src/styles/official-identity.css`: `--font-brand-sans`/`--font-brand-display`
  viraram aliases dos tokens canônicos (`--font-interface`/`--font-heading`).
- `src/styles/luxury-tokens.css`: removido "Plus Jakarta Sans" das pilhas.
- `public/fonts/`: 10 WOFF2 novos do IBM Plex Mono (fontsource, licença OFL já
  presente em `OFL-IBM-Plex-Mono.txt`).

### Commit `0a6015a9f` — remoção de `!important` do policing de títulos
- `src/styles/globals.css`: as 8 declarações `!important` de cor/fonte de
  títulos e subtítulos saíram de `@layer base` para o fim do arquivo, fora de
  `@layer`, com prefixo `html body` para preservar a dominância sobre
  `official-identity.css`. Restam apenas os 4 `!important` de
  `prefers-reduced-motion` (load-bearing, WCAG 2.3.3).

## Gates executados
- `npx tsc --noEmit` — OK
- `npm run lint` (biome lint src) — OK (warnings pré-existentes não relacionados)
- `npx biome check src/styles/` — OK
- `npm run build` (vite + esbuild + verify:pwa-precache) — OK
- `vitest`: `tests/unit/design-system/theme-accessibility.test.ts`,
  `OfficialIdentity.test.ts`, `A11yPrimitives.test.ts` — verdes
- Verificação do CSS buildado: WOFF2 referenciado, zero `fonts.googleapis`,
  regras de policing presentes fora de layer.

## Pendências / riscos para o Agente 24
1. Baselines de regressão visual são win32-only; snapshots Linux não existem —
   recomendo validar na CI antes do RELEASE_APPROVED.
2. A migração `!important` → unlayered preserva computed style por construção,
   mas merece confirmação visual (headers/subtitles em platform cards).
3. `src/bootstrap/security.ts` ainda allowlista `fonts.googleapis.com` no CSP
   (arquivo do Agente 01/15) — inócuo, mas pode ser revisado em handoff futuro.
4. Encontro das fontes: `src/index.css`, `elegance.css` e `luxury-tokens.css`
   não têm importador ativo em `main.tsx` — manutenção de stacks nelas foi feita
   por consistência; remoção de arquivos mortos fica fora de escopo (P3).
