# Parecer 24 — PR #170 (WF6, a11y teclado, auth/NewLoginScreen)

- **SHA revisado:** 79f9c2574f0261dd54793fbdc2c0755c1ec5cf8f (head confirmado via gh no início e antes da escrita)
- **Parecer anterior:** BLOQUEADO em 9e2a63f1
- **Veredito: APROVADO**

## Diff incremental 9e2a63f1..79f9c257
- `src/features/auth/components/NewLoginScreen.tsx`: `if (event.repeat) return;` depois do `preventDefault()` nos 3 cards, em `:1220`, `:1254` e `:1304` (+6 linhas).
  - É só apresentação. O diff em src não toca auth, token, sessão nem redirect.
  - Os handlers de onClick (mailto e navegação para /privacy) não mudaram.
- Novo `tests/unit/features/auth/NewLoginScreen.contactCards.test.tsx` (104 linhas, 8/8 local). Ele exercita o comportamento:
  - `fireEvent.keyDown` com Enter e Espaço em Ajuda e Contato verifica o `href` mailto e o `SoundFX.play('click')` (`:67-75`).
  - O retorno `false` do keyDown prova o preventDefault (`:72`).
  - Em Segurança, verifica que a rota /privacy é renderizada (`:78-83`).
  - Com repeat=true nos 3 cards, nada dispara (`:86-96`).
  - A tecla 'a' não aciona nada (`:98-103`).

## Escopo
Só NewLoginScreen.tsx e o teste novo, sem package.json nem lockfile.

## CI no 79f9c257
- Release **41443741982: success**. Unit 5545 passed / 1 skipped, Integration 738 passed / 2 skipped, Build, smoke /health e E2E 108 passed / 1 skipped.
- SonarCloud QG do PR 170: OK. Ratings A, 0 issues, cobertura nova 93,3%.
- Visual Regression 41443741976 passou, assim como CodeQL, Trivy, Dependency Review, secret scan e Bundle Budget (41443741983).

## Biome
- `biome lint src` dá 0 erros, com 575 warnings (a main tem 578; o PR remove 3).
- O único erro do `biome check` no arquivo é o `organizeImports` em `NewLoginScreen.tsx:1:1`, que já existe na main 6a4e7b96. A reivindicação do WF6 procede.

APROVADO preso ao SHA 79f9c2574f0261dd54793fbdc2c0755c1ec5cf8f. Se o head mudar, o parecer cai.
