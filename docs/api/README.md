# API Contracts — Birth Hub 360 (Agente 18)

Documentação viva dos contratos de API. Fonte canônica do schema: [`docs/openapi.yaml`](../openapi.yaml)
(OpenAPI 3.0.3, servido em `/api-docs` fora de produção ou com `EXPOSE_API_DOCS=true`).

## Componentes

| Artefato | O que é | Gate |
|---|---|---|
| `docs/openapi.yaml` | Spec OpenAPI manual (não gerada de código), cobrindo paths/métodos de todas as rotas montadas | `npm run verify:openapi-drift` (CI) |
| `scripts/verify-openapi-drift.ts` | Drift gate estático: cruza `app.use('/api/...', router)` do composition root (`server.ts` + `src/bootstrap/*.ts`) e os `router.get/post/...` literais dos arquivos de feature contra o YAML — Passe 1 (prefixo) + Passe 2 (path+método, recursivo em sub-routers) | roda no `ci.yml` |
| `src/shared/contracts/apiEnvelope.contract.ts` | Contrato Zod dos envelopes de resposta (`ApiSuccessEnvelopeSchema`, `ApiErrorEnvelopeSchema`, `ApiEnvelopeSchema`) e taxonomia `API_ERROR_CODES` | testes em `src/shared/middlewares/__tests__/` |
| `src/shared/middlewares/errorHandler.ts` | Middleware global de erro (último da cadeia, montado em `server.ts`) + `AppError` + helper `sendApiError` | idem |
| `scripts/api/schemathesis.mjs` | Runner portátil do Schemathesis (resolve venv Windows, PATH ou `uvx`) | manual / report-first |

## Envelope de erro padronizado (MEL-40)

Contrato único emitido pelo `errorHandler` global e por `sendApiError`:

```json
{
  "success": false,
  "error": "mensagem legível para o usuário",
  "code": "NOT_FOUND",
  "retryable": false,
  "requestId": "<mesmo id do header x-request-id>",
  "details": {}
}
```

- `error` = mensagem; `code` = código estável da taxonomia `API_ERROR_CODES`
  (`VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `METHOD_NOT_ALLOWED`,
  `CONFLICT`, `GONE`, `UNSUPPORTED_MEDIA_TYPE`, `UNPROCESSABLE_ENTITY`, `RATE_LIMITED`,
  `INTERNAL_ERROR`, `BAD_GATEWAY`, `SERVICE_UNAVAILABLE`, `TIMEOUT`, `BAD_REQUEST`).
- `code` é derivado do status HTTP quando o erro não é `AppError`/`ZodError`/Prisma conhecido;
  `AppError(message, statusCode, details?)` permite status+details explícitos.
- `retryable`: `true` para 5xx, 408, 504 e 429; `false` para os demais 4xx.
- `requestId` reaproveita `x-request-id` do `observabilityMiddleware` — ausente quando o erro
  ocorre antes dele na cadeia.
- Em `NODE_ENV=production`, erros 500 têm a mensagem mascarada para `"Erro Interno do Servidor"`.
- Schema OpenAPI `ErrorResponse` em `docs/openapi.yaml` espelha este contrato — manter em sincronia
  com `apiEnvelope.contract.ts`.

**Migração (estado atual)**: erros de domínio lançados como `AppError`/`ZodError`/Prisma já caem
no envelope completo. Rotas que respondem `{ success:false, error }` inline (sem `code`/
`retryable`/`requestId`) são legado gradual — consumidores não devem exigir os campos novos em
endpoints antigos. Migração recomendada por domínio: trocar `res.status(n).json({success:false,
error})` por `sendApiError(req, res, n, msg)` ou `throw new AppError(msg, n)` (cai no mesmo
envelope). Isso é trabalho dos donos de cada feature — registrado como pendência, não bloqueia.

## Schemathesis (MEL-39)

```bash
# requer a API rodando (ex.: npm run dev em :3000, ou apontar --url para staging)
node scripts/api/schemathesis.mjs --url http://127.0.0.1:3000
```

- Checks default cobrem "not_a_server_error" (5xx inesperado) e conformidade de resposta.
- O script resolve o binário via `SCHEMATHESIS_BIN`, `.venv-opensource`, PATH ou `uvx`;
  argumentos extras após `--` são repassados (ex.: `-- --report`, `-- --hypothesis-max-examples=50`).
- **Modo report-first**: sem CI dedicado ainda, rodar sob demanda contra staging e anexar o
  relatório à demanda. Wiring em `.github/workflows/` é propriedade do Agente 08 — ver handoff
  `.agents/handoffs/onda-5/18-para-08-schemathesis-ci.md`.

## Limitações conhecidas (registradas, não ocultas)

1. **Drift gate cobre path+método, não schemas de request/response.** Um endpoint pode estar
   documentado com shape de resposta divergente do código sem o gate falhar. Evolução futura:
   validar responses declaradas contra os envelopes/schemas Zod das rotas.
2. **Spec é manual.** Não é gerada de anotações/Zod — a sincronização depende do gate de drift +
   disciplina de atualizar o YAML junto com a rota (ver `.agents/skills/openapi-contract-keeper`).
3. **Erros inline legados** (item "Migração" acima) fogem do envelope enriquecido.
4. **`/api/intelligence` legado** usa `{ result: ... }` em vez do envelope `{ success, data }` —
   anotado endpoint a endpoint no YAML; fora do escopo desta onda.
