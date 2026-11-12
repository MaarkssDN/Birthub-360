# Run — Agente 11 (Marca e Ativos Institucionais)

- **Data:** 2026-11-10
- **Branch/worktree:** `agente/11-marca-assets` em `Birthub-360-worktrees/agente-11-marca-assets`
- **Onda:** Onda 5 — Plano Mestre de Saneamento (TAREFA-SANEAMENTO-049/050/051)
- **Handoffs recebidos:** 3 (`00-para-11-*` em `.agents/handoffs/onda-saneamento-20261110/`)

## TAREFA-SANEAMENTO-050 — Ativos pesados em `public/` (BT360-DT-0059)

Compressão com Pillow 13.0.0, preservando formato e nome de arquivo
(PNGs via `optimize` = lossless; JPEGs via `quality=82` = lossy controlado):

- `public/landing/assets/*.jpg` (12): JPEG `quality=82, progressive, optimize`.
  Destaques: `pillar-social.jpg` 768K→139K, `pillar-mobile.jpg` 708K→124K,
  `pillar-admin.jpg` 680K→114K.
- PNGs: `public/landing/prospeccao/*.png` (4), `public/icons/icon-192.png`,
  `public/apple-touch-icon.png`, `documentacao-aplicacao/imagens/**/*.png`
  (19) com `optimize=True`. `icon-512.png` revertido (re-encode aumentou).
- **Resultado:** 37 arquivos modificados, ~6,10 MB → ~3,86 MB (**−2,25 MB**).
- Integridade: todos reabertos com `PIL.Image.load()` sem erro.
- SVGs de `public/brand/` já mínimos; vídeos em containers comprimidos;
  `public/data`, `design-lab`, `tools` fora de escopo (não-marca).
- **Escalonado:** `public/q1.png`/`q2.png` (~3 MB, zero referências) → handoff
  `11-para-00-pngs-orfaos-q1-q2-em-public-raiz-3mb-sem-referencia.md`.

## TAREFA-SANEAMENTO-051 — Divergência de tokens na BrandConstitution (BT360-DT-0060)

`docs/BrandConstitution.md` atualizado (cirúrgico):

- Paleta agora mapeia cor → token canônico (`--palette-neon-*`,
  `--color-neon-*` do `@theme`, `--color-text-primary`, `--color-surface`,
  `--color-border`, `--grad-brand`, `--grad-cta`).
- Corrigido: "Branco Neon" `#F8F9FF` ≠ texto corrido — documentado **Azul
  Leitura** `#70D6FF`; Rosa claro `#E6007A`→`#D91B7C` (canônico dos tokens).
- Tipografia alinhada aos tokens canônicos (Sora/Inter/IBM Plex Mono
  self-hosted); removida referência a `preview.html` inexistente.
- §6 lista utilitários neon do Tailwind v4.
- **Escalonado:** divergências reais em `src/styles/globals.css`
  (`--color-neon-white=#70D6FF`, `--light-pink=#E6007A`,
  `--light-blue=#0369A1`) e pilhas de fonte em `official-identity.css`
  (Plus Jakarta Sans/Outfit/Nunito) → handoff
  `11-para-03-divergencias-residuais-de-tokens-de-cor-e-fonte-entre-globals-e-tokens-canonicos.md`.

## TAREFA-SANEAMENTO-049 — Fixtures com marcas legadas (BT360-DT-0058)

- `tests/fixtures/knowledge/sample.{pdf,docx}` extraídos e inspecionados:
  contêm apenas "Birth Hub 360" (marca atual). Zero ocorrências de
  AtlasGR/Total Trac/prospector-atlas. Nenhuma alteração necessária.
- **Escalonado:** guard test de regressão pertence a `tests/**` (Agente 08) →
  handoff `11-para-08-guard-de-fixtures-contra-reintroducao-de-marcas-legadas-em-tests-fixtures.md`.

## Conformidade de propriedade

- Alterados somente: `docs/BrandConstitution.md`, imagens em `public/`
  (ativos de marca/landing), `documentacao-aplicacao/imagens/**`, handoffs e
  este run. Nenhum `src/**` tocado; nenhuma referência quebrada (mesmos
  nomes de arquivo); nenhum histórico reescrito.
- Observação: `docs/AGENTS.md` atribui `docs/` ao Agente 08; a edição foi
  autorizada pelo handoff `00-para-11-*` por se tratar de ativo de governança
  de marca — registrado também na Resolução do handoff.

## Gates

- `npx tsc --noEmit` / `npm run lint` / `npm run build`: **não executados** —
  o diff contém somente Markdown, PNG/JPG e artefatos `.agents/` (0 arquivos
  `.ts`/`.tsx`/`.css`/`.json` alterados), portanto os gates de código não são
  afetados. Gate integral fica a cargo da branch de integração (Agente 00/24).
