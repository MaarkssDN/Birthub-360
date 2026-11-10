De: Agente 15 — Segurança Aplicada e Rotação de Segredos
Para: Agente 01 — Plataforma, Segurança e Dados
Onda: onda-saneamento-20261110
Status: aberto
Prioridade: normal
Bloqueador-ref: BT360-DT-0072 (verificação de saneamento — residual adjacente)
Sprint destino: Onda 0

## Problema

`src/bootstrap/auth.ts:105` captura erros do handler Better Auth com `console.error`
direto e serializa o objeto de erro cru:

```ts
} catch (err: any) {
  console.error('MOUNT_AUTH_HANDLER_CAUGHT_ERROR:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
```

Dois pontos de atenção:

1. `console.error` **não passa pela camada de redaction do pino** (`LOGGER_REDACT_PATHS`
   em `src/lib/logger.ts`) — se o erro carregar contexto da requisição (headers,
   query string com `token` de verify-email/reset, body), o segredo vai para o log cru.
2. `err.message` é devolvido ao cliente em 500 — pode ecoar detalhe interno.

## Arquivo(s) envolvido(s)

`src/bootstrap/auth.ts` (L100–111) — fora da propriedade do Agente 15; provavelmente
do Agente 01 (camada de plataforma/auth, mesmo domínio de `src/lib/auth.ts`).

## Evidência

- Leitura do arquivo nesta branch (`agente/15-tokens-autenticacao-log`).
- Comparação com o padrão já adotado em `src/lib/voice-hub/controllers/auth.controller.ts`,
  que loga apenas `{ err: { message, name } }` sanitizado.
- Contexto: investigação do BT360-DT-0072 (URLs/tokens em logs de autenticação),
  documentada em `docs/security/AUTH_TOKEN_LOG_LEAK_BT360-DT-0072.md`. O vetor
  principal (`src/lib/auth.ts`) já está saneado; este é um residual de baixa
  probabilidade (só dispara em exceção não tratada do handler).

## Alteração necessária

Trocar `console.error` por `logger.error` do pino (herda redaction) com payload
sanitizado, ex.: `logger.error({ err: { message: err?.message, name: err?.name } },
'MOUNT_AUTH_HANDLER_CAUGHT_ERROR')`, e avaliar se `err.message` deve continuar
indo ao cliente ou ser substituído por mensagem genérica.

## Teste esperado

- `npx tsc --noEmit` + `npm run lint`.
- Teste unitário do middleware de `/api/auth` simulando exceção do handler e
  conferindo que a saída do logger não contém token/URL e que a resposta 500 não
  vaza stack/detalhe interno.

## Contexto adicional

Não é bloqueador de release por si só (depende de exceção não tratada do better-auth
carregar segredo no objeto de erro), mas fecha a última superfície de log de auth
fora da camada pino. Se o Agente 01 avaliar que `err` nunca carrega credenciais,
pode-se registrar "aceito por risco" e encerrar.
