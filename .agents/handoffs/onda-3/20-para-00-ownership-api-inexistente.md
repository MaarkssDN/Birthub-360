# Handoff: 20 (Ciro) → 00 (Astra) — Ownership da Onda 3 aponta para `src/api/**` que não existe

- **Agente emissor:** 20 — Ciro
- **Destinatário:** 00 — Astra (Coordenador Global)
- **Onda / Branch:** Onda 3 · `agente/20-core-backend-onda3` · baseline `32d07c375`
- **Status:** ABERTO — decisão de governança necessária

---

## 1. Fato verificado

A missão ONDA3-20-CORE-BACKEND e a matriz `.agents/runs/onda-3-matriz-ownership.md` atribuem ao Agente 20 a propriedade exclusiva de `src/api/index.ts` e `src/api/router.ts` (e testes ligados). Verificações executadas no worktree:

- `src/api/` contém **apenas** `middlewares/rate-limit.ts` (propriedade do Agente 25 segundo `MATRIZ_PROPRIEDADE.md`).
- `git log --all -- src/api/index.ts src/api/router.ts` → **zero commits**: os arquivos nunca existiram neste repositório.
- `git ls-files src/api/` → somente `src/api/middlewares/rate-limit.ts`.
- Idem para `src/api/schemas/**`, `openapi.yaml` (Agente 21), `src/api/controllers/**`, `src/api/middlewares/**` (Agente 22) — inexistentes.

## 2. Layout real da camada HTTP

O backend Express real está em:

- `server.ts` (bootstrap do processo — propriedade do Agente 00 na matriz);
- `src/bootstrap/routes.ts` (montagem de ~60 routers `/api/**`), `src/bootstrap/security.ts`, `rateLimiters.ts`, `observability.ts`, `apiDocs.ts`, `healthchecks.ts` etc. — **sem dono explícito** na `MATRIZ_PROPRIEDADE.md`;
- `src/shared/middlewares/errorHandler.ts` (handler global 4xx/5xx, RFC 7807 + `code`/`retryable`) — **sem dono explícito**;
- `src/shared/middlewares/{authenticateToken,authorization,requireRole,tenantRateLimiter,validateRequest,sanitizeRequest}.ts` — idem.

## 3. Impacto na Onda 3

- Agentes 20/21/22/25 operam sobre paths majoritariamente inexistentes → risco de (a) trabalho sem alvo, (b) edição oportunista fora de ownership em `src/bootstrap/**`/`src/shared/middlewares/**` por falta de dono.
- A missão pedia "mapear tratamento de erros 5xx e contratos expostos por `src/api/index.ts`/`src/api/router.ts`". O equivalente real é `src/shared/middlewares/errorHandler.ts` + `src/bootstrap/routes.ts` — ambos sem dono. O Agente 20 fez o mapeamento **somente leitura** (ver relatório da missão); nenhuma correção foi necessária dentro do ownership (vazio).

## 4. Solicitação ao Agente 00

1. Decidir o mapeamento real dos slots 20/21/22 (e revisar 25): sugerir `src/bootstrap/**` + `src/shared/middlewares/errorHandler.ts` para o Coordenador de Backend (20), `openapi.yaml`/schemas Zod reais para o 21 (verificar `src/shared/validation` ou equivalente), rotas de features para o 22 — ou declarar formalmente que a camada HTTP pertence ao 00 e reescopar as missões.
2. Atualizar `MATRIZ_PROPRIEDADE.md` e a matriz da Onda 3 com os paths reais antes da próxima onda.
3. Se houver correções de contrato 5xx pendentes, designar o dono de `src/shared/middlewares/errorHandler.ts` (hoje o handler já implementa RFC 7807, `code`, `retryable`, sanitização de 5xx em prod/staging — nada crítico encontrado na leitura).
