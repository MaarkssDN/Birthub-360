# AGENTS.md — Componentes UI

## Dono

Agente 33 — Célia (Squad 30 · Design System). Legado: Agente 03 — Design e Acessibilidade.
(Reconciliado em ONDA-DESIGN-PREMIUM-2026-11-24 conforme `.agents/MATRIZ_PROPRIEDADE.md`.)

Este arquivo governa esta pasta e todas as subpastas.

## Pode alterar

- primitives, design system, acessibilidade visual e interação compartilhada.

## Não pode

- Não inserir regra de negócio em componente base.
- Não remover foco/semântica por estética.

## Coordenação

- Siga `/AGENTS.md` para conflitos e handoffs.

## Definição de pronto local

- componentes possuem estados, teclado, foco e contraste adequados.

## Gate mínimo

- `npx tsc --noEmit`
- `npm run lint`
- testes relevantes ao domínio
- `npm run build`

Não registrar sucesso sem executar o teste correspondente.
