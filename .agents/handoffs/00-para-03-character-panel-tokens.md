De: 00 — Coordenador
Para: 03 — Design e Acessibilidade
Onda: pós-Onda 02 (decisão de produto registrada)
Status: aberto
Prioridade: normal
Bloqueador-ref: nenhum
Sprint destino: próxima onda de design

## Problema

`src/features/characters/CharacterDetailPanel.tsx` mantém um painel dark-glass com `bg-[#0B0F1A]` e texto branco fixo — exceção de cor hardcoded identificada na Onda 02. O usuário decidiu (2026-11-15, decisão D3 em `.agents/runs/decisoes-produto-20261115.md`) que o painel deve **migrar para tokens de tema**.

## Arquivo(s) envolvido(s)

- `src/features/characters/CharacterDetailPanel.tsx` (painel)
- Tokens de tema em `src/styles/globals.css` / `official-identity.css`

## Evidência

- Hex `#0B0F1A` hardcoded + textos `text-white`/`white/xx` assumem superfície escura permanente — em light mode o painel quebra a coerência (e gera riscos de contraste axe).
- Decisão completa: `.agents/runs/decisoes-produto-20261115.md` → D3.

## Alteração necessária

Redesenhar o painel para usar tokens (`--surface-elevated`, `--ink`, `--line`, aliases `--color-*`), preservando a estética "glass" via `backdrop-blur` + `color-mix` dos tokens — de modo que funcione em dark e light mode sem hex fixo.

## Teste esperado

- Zero hex cru no painel; contraste axe-core ≥ 4.5:1 em ambos os temas.
- `npx tsc --noEmit` + `npm run lint` limpos; evidência visual light/dark no PR.
