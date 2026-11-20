# Handoff — piiDetection.service.ts sem mitigação anti-encoding

De: 00 — Coordenador
Para: 77 — Gaia (Guardrails de IA) / Squad 70
Onda: Wave E (follow-up do parecer 24 sobre PR #441)
Status: resolvido
Prioridade: normal
Referência: `.agents/reviews/pr441-waveD-guardrails-pii-encoding-24.md`
Resolução-ref: `src/features/intelligence/services/piiDetection.service.ts` integrado com `encoding.ts`, coberto por 13 testes em `src/features/intelligence/services/__tests__/piiDetection.service.test.ts` e 17 testes em `tests/unit/ai/guardrails-encoding.test.ts` (30/30 verdes).

## Problema

`src/features/intelligence/services/piiDetection.service.ts` possui
`detectPII`/`redactPII` próprios que **não** usam a mitigação anti-encoding
entregue em `src/lib/ai/guardrails/encoding.ts` (PR #441). PII codificada
(base64, unicode escapes, percent-encoding) passa despercebida nesse serviço
(turboSearch e correlatos).

## Evidência

- `src/lib/ai/guardrails/encoding.ts` — `decodeTextEscapes`, `findEncodedTokenSpans` (mergeado via PR #441).
- `src/lib/ai/guardrails/pii.guard.ts` — implementação de referência da mitigação.
- `src/features/intelligence/services/piiDetection.service.ts` — serviço separado, sem decodificação.

## Alteração necessária

Reutilizar `decodeTextEscapes`/`findEncodedTokenSpans` (ou extrair helper
compartilhado se o shape dos dados exigir) para que `piiDetection.service.ts`
detecte/redija PII em texto codificado, com a mesma semântica fail-safe do guard.
Avaliar deduplicação: se os dois `detectPII` divergirem em regras, registrar a
decisão (manter contratos separados vs. unificar) — PII/LGPD exige cautela.

## Teste esperado

- CPF/email em base64 e `\uXXXX` detectados e redigidos pelo serviço.
- Token sem PII preserva encoding original.
- `npx vitest run -c vitest.unit.config.ts` nos testes do serviço; `tsc` limpo.

## Contexto adicional

Origem: ressalva (b) do parecer do Agente 24 no PR #441 — lacuna real fora do
escopo daquele PR, confirmada como existente.
