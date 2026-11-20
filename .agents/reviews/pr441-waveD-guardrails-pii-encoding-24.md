# Parecer 24 — PR #441 (Agente 07): guardrails PII anti-encoding

- **Missão/Onda:** Wave D — revisão independente do PR #441.
- **Autor:** Agente 07 — IA e Automações.
- **Auditor:** Agente 24 — Revisão Independente.
- **Base:** `main` (origin/main @ `ba33e6dc4` no momento da revisão).
- **Revisão exata:** head `agente/07-waveD-guardrails` @ `a919bda222dc471d68e66f2505d7f62ffb8e8b1d`.
- **Worktree auditado:** `C:\Github\Birthub-360-worktrees\agente-07-waveD`.
- **Arquivos:** `src/lib/ai/guardrails/encoding.ts` (novo), `src/lib/ai/guardrails/pii.guard.ts`, `src/lib/ai/guardrails/toxicity.guard.ts`, `src/lib/ai/guardrails/index.ts` (só reordenação de exports), `tests/unit/ai/guardrails-encoding.test.ts` (novo), `tests/integration/ai-guardrails-security.test.ts`, 2 handoffs.

## Critérios e resultados

1. **Fail-safe do decode:** `decodeTextEscapes` usa `decodeURIComponent` dentro de `try/catch` com fallback byte-a-byte; `findEncodedTokenSpans` descarta spans cujo decode falha ou excede `MAX_DECODED_LENGTH` (8KB) / `MAX_TOKEN_SPANS` (64). `Buffer.from(...).toString` não lança para base64/hex malformado (retorna bytes parciais/lixo), e `isMostlyPrintable` (>= 90% imprimível) filtra o lixo — confirmado por inspeção e pelos testes de falso positivo. Nenhum caminho de exceção não tratada encontrado.
2. **PII em base64/unicode-escape bloqueado:** confirmado — `detectPII`/`redactPII` e `detectToxicity`/`redactToxicity` rodam regex sobre `decodeTextEscapes(text)` + cada `span.decoded`. Testes novos cobrem Base64, Base64URL implícito, hex, `\uXXXX`, `\xNN`, `%XX` intercalado e resposta inteira codificada.
3. **Token sem PII preserva encoding:** `redactPII`/`redactToxicity` retornam `text` original quando `matches.length === 0` — não devolvem a visão decodificada. Teste explícito (`'Desconto de 10%25 aplicado'` → `redacted === original`) verde.
4. **Sem bypass residual óbvio introduzido:** residuals são documentados e razoáveis — tokens < 12 chars e encoding de dupla camada não cobertos (o menor PII relevante codificado tem >= 16 chars). `piiDetection.service.ts` (serviço separado usado por `turboSearch`) **não** foi alterado — fora do escopo do handoff, mas é uma lacuna real de cobertura: PII codificada que passe por esse serviço não é revalidada. Registrado como pendência para handoff futuro, não bloqueia este PR.
5. **Refatoração preserva semântica:** `collectPiiMatches`/`collectToxicMatches` extraem a lógica de match sem alteração; `redactToxicity` mantém a mesma ordem de substituição sobre o texto normalizado.
6. **Custo/limites:** tetos de 64 spans e 8KB por decode; dedup por conteúdo decodificado; regex de token exige >= 12 chars e delimitadores — adequado para P2 (custo limitado). Sem dependência nova.
7. **Segundo handoff (safeFetch) — alegação verificada:** inspecionado `origin/main` @ `671b6d72b` e reconfirmado @ `ba33e6dc4`: `universalNotificationsTool.ts` L113-114, `universalTasksAndNotesTool.ts` L336-337 e `aiPendingAction.service.ts` L234-238 usam `assertSafeExternalUrl` + `safeFetch`. Varredura residual de `fetch(` em `src/features/intelligence` e `src/lib/ai`: os demais call sites usam hosts fixos de provider (`googleapis.com`, `api.trello.com`) ou base URL de operador via env (LiteLLM/TEI/Ollama em `http-client.ts`, `embeddings.ts`, `local-embeddings.ts`, `turboSearch.ts`, `streaming-fallback.ts`, `universalMeetingsTool.ts`) — nenhum recebe URL controlada por tenant sem `safeFetch`. Alegação de "já resolvido em main" **confirmada**; encerramento do handoff é legítimo.

## Comandos executados

- `npx vitest run -c vitest.unit.config.ts tests/unit/ai/` (worktree do autor) → **85/85 verde** (8 arquivos, exit 0), confirmando a alegação.
- `npx tsc --noEmit` (worktree do autor) → limpo (exit 0).
- `npx vitest run -c vitest.integration.config.ts tests/integration/ai-guardrails-security.test.ts` → **não executado**: o setup de integração recusa rodar sem `DATABASE_URL` apontando para banco de teste isolado (`tests/helpers/integration-setup.ts` L27). Falha de ambiente, não do código — as mesmas funções são cobertas pelos 85 testes unitários verdes; as alterações no arquivo de integração são apenas virada de expectativa (`blocked: false` → `true`) coerente com o comportamento implementado.

## Achados

- **[normal]** `src/features/intelligence/services/piiDetection.service.ts` mantém `detectPII`/`redactPII` próprios sem a mitigação de encoding — serviço distinto usado por `turboSearch.ts` L197 (`redactPII(params.query)`). Se respostas de IA fluírem por esse caminho, o bypass por encoding permanece ali. O autor declarou fora de escopo corretamente; recomendo handoff para o Agente 07 avaliar reaproveitar `encoding.ts`.
- **[baixa]** `decodeTextEscapes` aplica percent-decode antes de unicode-escape, o que decodifica `\uXXXX` introduzido via `%5CuXXXX` — cobertura ligeiramente melhor que o documentado; sem risco.
- **[baixa]** `HEX_TOKEN_PATTERN` casa dígitos puros >= 12 chars (ex.: sequências numéricas longas); o filtro de imprimibilidade e a exigência de match de PII/toxicidade no decodificado tornam falso positivo improvável — aceito.

## Pendências/riscos

- Integração `ai-guardrails-security.test.ts` não executada neste ambiente (sem banco de teste); evidência unitária equivalente obtida.
- Residual de dupla camada de encoding aceito e documentado — decisão razoável de escopo.

## Veredito

**APROVADO-COM-RESSALVAS** — para o head `a919bda2`. Ressalvas: (a) teste de integração não executado por indisponibilidade de `DATABASE_URL` de teste (não é falha do PR); (b) lacuna residual em `piiDetection.service.ts` fora do escopo, a endereçar via handoff. Qualquer alteração posterior no conteúdo auditado invalida este parecer.
