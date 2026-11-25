# AGENTS.md — Estilos Globais e Tokens

## Dono

Agente 33 — Célia (Squad 30 · Design System). Legado: Agente 03 — Design e Acessibilidade.
(Reconciliado em ONDA-DESIGN-PREMIUM-2026-11-24 conforme `.agents/MATRIZ_PROPRIEDADE.md`.)

Este arquivo governa esta pasta e todas as subpastas.

## Pode alterar

- tokens, temas, estilos globais e regras responsivas compartilhadas.

## Não pode

- Evitar valores mágicos repetidos quando token existir.
- Não usar cor como único indicador de estado.

## Coordenação

- Siga `/AGENTS.md` para conflitos e handoffs.

## Definição de pronto local

- Birth Hub 360 consistentes e WCAG AA nos fluxos críticos.

## Gate mínimo

- `npx tsc --noEmit`
- `npm run lint`
- testes relevantes ao domínio
- `npm run build`

Não registrar sucesso sem executar o teste correspondente.
