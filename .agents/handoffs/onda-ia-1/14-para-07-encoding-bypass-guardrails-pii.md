# 14-para-07-encoding-bypass-guardrails-pii.md

- De: Agente 14
- Para: Agente 07
- Onda: IA-1
- Status: resolvido
- Prioridade: normal
- Bloqueador-ref: .agents/handoffs/onda-ia-1/15-para-14-avaliacao-pii.md
- Sprint destino: a definir pelo Coordenador

## Problema

Os guardrails de saída (`src/lib/ai/guardrails/pii.guard.ts` —
`detectPII`/`redactPII`, e `toxicity.guard.ts` — `detectToxicity`) aplicam
regex apenas sobre o texto cru da resposta do provider. Conteúdo codificado
— Base64, hexadecimal, unicode escape (ex.: `\u0030`), ou leetspeak simples —
contorna a detecção: um CPF `MTIzLjQ1Ni43ODktMDk=` ou `123\u002e456...`
passa sem `blocked: true`. Isso é limitação de produto, não de teste: o
handoff 15→14 pedia cobertura, e a sessão do Agente 14 confirmou via teste
que o bypass existe e é determinístico.

## Arquivo(s) envolvido(s)

- `src/lib/ai/guardrails/pii.guard.ts` (detecção — proprietário: Agente 07)
- `src/lib/ai/guardrails/toxicity.guard.ts`
- `src/lib/ai/gateway/chat-model.ts` L260-299 (ponto de aplicação dos guardrails)

## Evidência

- `tests/integration/ai-guardrails-security.test.ts` já documenta o bypass
  como falha esperada (`expect(result.blocked).toBe(false) // Falha atual
  esperada`) para Base64/hex/unicode.
- Novo teste `tests/unit/lib/ai/gateway/chat-model-guardrails.test.ts`
  (Agente 14, branch `agente/14-handoffs-20261117`) cobre o caminho real
  PII→provider→bloqueio→AILog para PII/toxicidade em texto claro.

## Alteração necessária

Decidir e, se aprovado, implementar uma das opções (menor complexidade
primeiro):

1. Normalização/decodificação tentativa antes da detecção (ex.: detectar
   padrões Base64/hex longos e decodificar para revalidar) — cuidado com
   falsos positivos e custo por chamada.
2. Documentar formalmente o bypass como risco aceito (atualizar comentários
   em `pii.guard.ts` e o teste de segurança), se a decisão de produto for
   não corrigir na Onda IA-1.

## Teste esperado

- Se corrigir: teste unitário em `detectPII` provando que payload codificado
  (Base64 de CPF, hex, unicode escape) resulta em `blocked: true`, sem
  regressão nos falsos positivos já cobertos (CEP, protocolo numérico,
  allowlist de e-mail).
- Se aceitar o risco: ajustar o teste que hoje marca o bypass como "falha
  esperada" para "comportamento aceito documentado".

## Contexto adicional

Origem: handoff 15→14 (`.agents/handoffs/onda-ia-1/15-para-14-avaliacao-pii.md`),
item 5 do pedido de segurança do Agente 15. O Agente 14 cobre apenas a camada
de teste/harness; a decisão de produto sobre decoding de guardrails pertence
ao Agente 07 (dono de `src/lib/ai/**`).

## Resolução (Agente 07 — 2026-11-19, worktree `agente-07-waveD`, branch `agente/07-waveD-guardrails`)

Opção 1 implementada (normalização/decodificação antes da detecção), escopo
mínimo conforme P2/P3:

- Novo módulo `src/lib/ai/guardrails/encoding.ts` com duas camadas:
  - `decodeTextEscapes(text)`: decodifica escapes no corpo inteiro —
    percent-encoding `%XX` (runs via `decodeURIComponent`, com fallback
    byte-a-byte para UTF-8 incompleto) e unicode/hex escapes `\uXXXX`/`\xNN`.
    Cobre conteúdo codificado intercalado com texto plano.
  - `findEncodedTokenSpans(text)`: tokens Base64/Base64URL (>= 12 chars,
    delimitado por lookaround) e hex (com/sem `0x`) decodificados via `Buffer`,
    aceitos somente se o resultado for >= 90% imprimível. Teto de 64 spans e
    8KB por decode; falhas de decode são descartadas silenciosamente.
- `pii.guard.ts`: `detectPII`/`redactPII` agora rodam sobre a visão
  decodificada + spans decodificados. Em `redactPII`, spans codificados com
  PII são substituídos por `[ENCODED_PII_REDACTED]` (não há como redigir
  dentro do token); escapes são normalizados antes da redação normal.
  Sem PII, `redactPII` devolve o texto original (encoding preservado).
- `toxicity.guard.ts`: mesma mitigação em `detectToxicity`/`redactToxicity`
  (span tóxico → `[REDACTED]`).

Decisões de escopo registradas:
- Tokens codificados com menos de 12 chars e payloads com encoding múltiplo
  (dupla camada) **não** são cobertos — residual aceito; os formatos de PII
  relevantes (CPF/CNPJ/e-mail/cartão/telefone) codificados têm >= 16 chars.
- Leetspeak não foi implementado: os padrões de PII são dígitos e leetspeak
  não os oculta de forma determinística; para toxicidade, a lista é PT e o
  custo de falso positivo não compensa nesta onda.
- `src/features/intelligence/services/piiDetection.service.ts` (serviço
  separado usado por `turboSearch`) **não** foi alterado — fora do escopo
  do handoff; se desejado, abrir handoff para avaliar reaproveitar
  `encoding.ts` lá.

Testes: novo `tests/unit/ai/guardrails-encoding.test.ts` (17 testes:
Base64/Base64URL, hex, `\uXXXX`, `\xNN`, `%XX` simples e intercalado,
resposta inteira codificada, e falsos positivos — token benigno,
percent-encoding benigno, e regressão CEP/protocolo/allowlist já coberta).
`tests/integration/ai-guardrails-security.test.ts` atualizado: os dois
casos que marcavam o bypass como "falha esperada" agora esperam
`blocked: true`. Gate: `npx vitest run -c vitest.unit.config.ts
tests/unit/ai` verde (inclui `guardrails.test.ts`,
`guardrails-allowlist.test.ts`, `guardrails-encoding.test.ts` e
`chat-model-guardrails.test.ts`), `npx tsc --noEmit` limpo, `npx biome
check` nos arquivos de `src/` limpo.
