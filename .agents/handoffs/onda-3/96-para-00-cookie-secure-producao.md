# Handoff — Cookies de sessão podem ficar sem `Secure` em produção se `BETTER_AUTH_URL` for http://

```
De: 96 — Nera (Autenticação, Sessões e OAuth)
Para: 00 — Coordenador (destino provável: dono de src/lib/auth.ts / src/config/env.ts)
Onda: 3
Status: aberto
Prioridade: média
Bloqueador-ref: B-03/B-04 (domínio de referência do emissor)
Sprint destino: a definir pelo 00
```

## Problema

Em `src/lib/auth.ts` (Better Auth — fora do meu ownership de escrita `src/lib/auth/**`):

```ts
advanced: {
  useSecureCookies: Boolean(
    process.env.SECURE_COOKIES === 'true' || process.env.BETTER_AUTH_URL?.startsWith('https://'),
  ),
  defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', secure: <mesma condição> },
}
```

O cookie de sessão só ganha `Secure` se `SECURE_COOKIES=true` **ou** `BETTER_AUTH_URL` começar
com `https://`. A validação de produção em `src/config/env.ts` (linhas ~407-454) garante que
`BETTER_AUTH_URL` não contém `localhost`/`127.0.0.1`, mas **não exige scheme https** — uma
configuração `BETTER_AUTH_URL=http://app.birthhub360.com.br` (domínio público, sem localhost)
passa no boot e emite cookies de sessão sem `Secure` e sem HSTS implícito do browser.

`httpOnly` e `sameSite: 'lax'` estão corretos; `revokeSessionsOnPasswordReset: true`,
`requireEmailVerification` com bypass só fora de prod, lockout por conta e `role`/`organizationId`
com `input: false` estão corretos — este é o único gap encontrado na configuração real.

## Arquivo(s) envolvido(s)

- `src/lib/auth.ts` (~linhas 294-310)
- `src/config/env.ts` (~linhas 407-454, validação de domínio em produção)

## Alteração necessária (sugestão)

Em `env.ts`, quando `NODE_ENV=production` e `BETTER_AUTH_URL` estiver definido, exigir
`startsWith('https://')` (ou exigir `SECURE_COOKIES=true` explicitamente) — fail-closed no boot,
mesmo padrão já usado para `BETTER_AUTH_SECRET` e `ALLOW_DEV_AUTH_BYPASS`.

## Teste esperado

Boot com `NODE_ENV=production` + `BETTER_AUTH_URL=http://...` deve abortar; com `https://` deve
subir. Validar flags do cookie emitido em `Set-Cookie` (Secure; HttpOnly; SameSite=Lax).

## Contexto adicional

Nada encontrado no domínio de auth relacionado a certificados (PGSSLROOTCERT) — sem handoff
adicional para 98/99 por esse tema. OAuth social (Google/Microsoft) usa env vars lidas via
`process.env` direto em `socialProviders` — funciona, mas foge do schema Zod de `env.ts`
(observação menor, sem ação exigida).
