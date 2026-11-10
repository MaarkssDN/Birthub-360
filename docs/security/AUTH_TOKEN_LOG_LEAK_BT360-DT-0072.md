# BT360-DT-0072 — URLs de autenticação com tokens em logs: verificação de saneamento

- **Dívida:** BT360-DT-0072 (`DIV-15-001`, DEBT-SEC-001) — P0
- **Handoff de origem:** `.agents/handoffs/onda-saneamento-20261110/00-para-15-urls-de-autenticacao-com-tokens-magicos-e-links-de-redefinicao-de-senh.md`
- **Arquivo auditado:** `src/lib/auth.ts` (propriedade do Agente 01/01A — este documento é evidência, não alteração de código)
- **Verificação executada por:** Agente 15 — worktree `agente-15-tokens-autenticacao-log`, branch `agente/15-tokens-autenticacao-log`
- **Data:** 2026-11-10 (onda-saneamento-20261110)

## Conclusão

A correção **já existe no HEAD** e não deve ser duplicada. O último vetor de vazamento
(`resetUrl` com token em claro, emitido em `logger.warn` de `sendResetPassword` fora de
produção) foi removido pelo commit `b00a4618f` ("feat(security,skills): token redaction em
auth…", 2026-11-10 12:50 -0300), que eliminou a chave `resetUrl` do objeto logado.

Estado atual de `src/lib/auth.ts` (verificado por leitura integral do arquivo):

- `sendResetPassword` (L128–170): os dois `logger.*` (`MAILER_NOT_CONFIGURED`,
  `RESET_EMAIL_FAILED`) logam apenas `{ userId, reason }` — sem `url`, `token` ou `user.email`.
- `sendVerificationEmail` (L180–215): idem (`MAILER_NOT_CONFIGURED`, `VERIFICATION_EMAIL_FAILED`).
- A URL com token continua sendo enviada **somente por e-mail** via `sendEmail` — nunca em log.
- Não há `console.*` nem outro caminho de log de URL/token no arquivo.

Vetores adjacentes também já cobertos:

- `src/lib/logger.ts` — `LOGGER_REDACT_PATHS` inclui `url`, `*.url`, `resetUrl`,
  `*.resetUrl`, `verificationUrl`, `*.verificationUrl`, `token`, `*.token`, `email`,
  `*.email`, `authorization`, `cookie`, etc. (defesa em profundidade caso algum caller
  futuro logue o campo).
- `src/shared/middlewares/observability.ts` — `redactSensitiveQueryParams` mascara
  `token`, `access_token`, `refresh_token`, `code`, `state`, `secret`, `password` na query
  string antes de logar `req.url`. Cobre o clique do usuário no link
  (`GET /api/auth/verify-email?token=…`, `/api/auth/reset-password?token=…`).
- `src/lib/email/mailer.ts` — sem nenhum `logger`/`console`.
- Cobertura de teste existente: `tests/unit/lib/loggerRedaction.authCredentials.test.ts`
  (paths de redaction + não-vazamento de credenciais) e
  `tests/unit/lib/loggerRedaction.test.ts`.

## Linha do tempo (git log)

| Commit | Data | Efeito |
|---|---|---|
| `34717c176` | 2026-10-21 | `fix(sec): redigir logs de smtp e verificacao de email em auth.ts` — introduziu `emailVerification.sendVerificationEmail` com logs `{ userId, reason }`; reset logava `resetUrl` cru fora de produção |
| `b1bb0e9dc` | 2026-11-06 | `fix(onda-0)` — mascaramento parcial: `url.replace(/(token=)[^&]+/, '$1***')` — ainda logava a URL (estado "PARCIALMENTE IMPLEMENTADO" apontado pela reconciliação) |
| `b00a4618f` | 2026-11-10 | **Remoção completa da chave `resetUrl` do log** — fecha BT360-DT-0072 |

## Verificação formal exigida

O critério de saída registrado em `BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md` é:

```bash
node scripts/verify-auth-log-redaction.mjs
```

O script (`scripts/verify-auth-log-redaction.mjs`) é uma asserção textual determinística
sobre `src/lib/auth.ts`: extrai o bloco `sendResetPassword:` → `socialProviders,`,
coleta as chamadas `logger.(warn|error)(…);` e exige (a) ≥4 chamadas, (b) nenhuma
contendo `url`, `user.email` ou `token`, (c) presença de `MAILER_NOT_CONFIGURED` e de
`throw new APIError`.

**Traçado manual das asserções sobre o arquivo atual:**

- `loggerCalls` encontradas: 4 (L146–152 warn, L162–165 error, L204–207 warn, L210–213 error) → `>= 4` ✓
- `logged` não contém `url`, `user.email` nem `token` (somente `userId`, `reason` e literais de mensagem) ✓
- `MAILER_NOT_CONFIGURED` presente (L151, L206) ✓
- `throw new APIError` presente (L166) ✓

**Limitação de evidência:** a execução de `node`/`npx` foi negada neste ambiente de
execução (background, sem aprovação de ferramenta). O resultado acima é derivado de
leitura integral e traçado determinístico do script, não de execução. O gate do Agente
24/08 deve executar o comando acima antes de aceitar o encerramento formal — o script é
barato e idempotente.

## Risco residual registrado (fora do escopo desta dívida)

`src/bootstrap/auth.ts:105` faz `console.error('MOUNT_AUTH_HANDLER_CAUGHT_ERROR:', err)`
com o erro cru do handler Better Auth e devolve `err.message` ao cliente em 500. O
`err` de `toNodeHandler` pode carregar contexto da requisição; recomenda-se avaliar
sanitização (mesmo padrão `{ err: { message, name } }` já usado em
`src/lib/voice-hub/controllers/auth.controller.ts`). Arquivo sob propriedade do Agente
01 — handoff aberto em
`.agents/handoffs/onda-saneamento-20261110/15-para-01-consoleerror-cru-em-mount-auth-handler.md`.
Prioridade: normal (não é o vetor BT360-DT-0072; pino `logger.*` não é usado aqui e o
`console.error` não passa pela camada de redaction do pino).
