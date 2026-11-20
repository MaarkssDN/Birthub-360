# AGENTS.md — Gamificação

## Dono

Agente 02 — Produto e UX

Decisão do usuário em 2026-11-18 (resolve pendência da auditoria WB-1 —
antes sem AGENTS.md local).

Este arquivo governa esta pasta e todas as subpastas.

## Pode alterar

- experiência de gamificação (rankings, War Room Arena, coaching, badges),
  estados de erro/vazio honestos, copy de métricas.

## Não pode

- inventar métricas, rankings ou atividade — dados vêm da API; erro de API
  deve ter estado de erro próprio, nunca virar "sem atividade" (UX-03);
- alterar regra de negócio de pontuação/engine sem missão explícita;
- alterar schema — Agente 01; contrato de API — Agente 18.

## Coordenação

- Backend/contrato de gamificação → handoff ao dono do módulo backend.
- IA real no War Room depende de DEBT-0012/0015 (NO-GO) — não propor
  workaround; heurística local deve permanecer divulgada como "modo treino".

## Definição de pronto local

- erro de API ≠ empty state (UX-03 sanado);
- heurística nunca apresentada como IA;
- estados Loading/Empty/Error cobertos.

## Gate mínimo

- `npx tsc --noEmit`
- `npm run lint`
- testes relevantes ao domínio
- `npm run build`

Não registrar sucesso sem executar o teste correspondente.
