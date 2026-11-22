# AGENTS.md — Filas

## Dono

Agente 16 — Runtime, Workers e Escala

(Revisão Agente 00, Onda 3/2026-11: alinhado à missão MEL-21/22 e ao histórico REMED-05,
ambos executados pelo 16. O Agente 07 mantém os consumidores de fila do domínio de IA.)

Este arquivo governa esta pasta e todas as subpastas.

## Pode alterar

- queue runtime, jobs, retries, backoff e observabilidade de execução.

## Não pode

- Não engolir falha.
- Não executar job cross-tenant.
- Não criar retry infinito.

## Coordenação

- Siga `/AGENTS.md` para conflitos e handoffs.

## Definição de pronto local

- idempotência, timeout, retry e failure state são testados.

## Gate mínimo

- `npx tsc --noEmit`
- `npm run lint`
- testes relevantes ao domínio
- `npm run build`

Não registrar sucesso sem executar o teste correspondente.
