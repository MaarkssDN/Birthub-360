# Relatório — Agente 96 · Nera (Autenticação, Sessões e OAuth) · Onda 3

Data: 2026-11-24 · Demanda: DEM-20261123-001 · Missão: ONDA3-96-AUTH
Branch: `agente/96-auth-onda3` · Baseline: `32d07c375`
Worktree: `C:\Github\Birthub-360-worktrees\dem-20261123-onda3\wt-96-auth`
SHA inicial: `32d07c375` · SHA atual: `f40af8ed7`

## Escopo auditado

`src/lib/auth/**` (ownership exclusivo): `session.service.ts`, `password-hash.ts`,
`authorization.ts`, `rbac/enforcer.ts`, `__tests__/`. Auditoria de contexto (somente leitura,
fora do ownership de escrita): `src/lib/auth.ts` (Better Auth — fluxo real de login/sessão),
`src/config/env.ts` (validação de segredos/origens em produção), consumidores
(`src/lib/voice-hub/**`, `tests/unit/lib/auth/**`).

Descoberta estrutural: **não há JWT próprio nem OAuth implementado em `src/lib/auth/**`** —
sessões/JWT/cookies/OAuth social são todos Better Auth em `src/lib/auth.ts` (DB-persisted).
`authorization.ts` e `rbac/enforcer.ts` são RBAC → domínio do Agente 97 (auditados, não alterados).

## Achados classificados

| Sev | Achado | Status |
|-----|--------|--------|
| Médio | `password-hash.ts`: parâmetros Argon2id (m/t/p/v) lidos do hash persistido **sem teto** — hash adulterado no banco podia exigir memória ilimitada (DoS/OOM) na verificação de senha | **CORRIGIDO** `7632f3a93` |
| Médio | `password-hash.ts`: exceção do `argon2idAsync` em hash malformado **propagava** para o login (500) em vez de negar a senha | **CORRIGIDO** `7632f3a93` (try/catch → `false`) |
| Médio | `session.service.ts`: Maps in-memory cresciam sem limite — tokens expirados/`used` nunca eram removidos (memory leak em processo longevo) | **CORRIGIDO** `f8a1763ab` (`sweepExpired()` throttled 60s) |
| Baixo | `session.service.ts`: `createSession` aceitava `userId`/`organizationId`/`fingerprint` vazios e `ttlSeconds` inválido | **CORRIGIDO** `f8a1763ab` |
| Alto (latente) | `session.service.ts` é **código morto**: nenhum consumidor de produção (só teste unitário); se um dia for ligado, Maps in-memory não sobrevivem a restart/multi-instância e `accessToken act_<uuid>` não tem validação | **HANDOFF** `96-para-00-session-service-morta.md` (decisão do 00: remover/integrar/manter) + comentário de alerta no cabeçalho do arquivo |
| Médio | `src/lib/auth.ts` + `env.ts`: cookie de sessão só ganha `Secure` se `SECURE_COOKIES=true` ou `BETTER_AUTH_URL` https — validação de prod não exige scheme https | **HANDOFF** `96-para-00-cookie-secure-producao.md` (fora do ownership de escrita) |
| Baixo | `authorization.ts`/`enforcer.ts`: 403 ecoa `userRole`; `enforceRole` não checa tenant (depende de `authenticateToken` upstream) | **HANDOFF informativo** `96-para-97-rbac-observations.md` |

## Verificações positivas (sem ação necessária)

- Cookies: `httpOnly: true`, `sameSite: 'lax'`, `secure` condicional — correto.
- `revokeSessionsOnPasswordReset: true`; lockout por conta (5 falhas/15min) + rate limit por IP.
- `requireEmailVerification` com bypass restrito a não-produção (`ALLOW_DEV_AUTH_BYPASS` aborta boot em prod).
- `role`/`organizationId`/`lockedUntil`/`failedLoginAttempts` com `input: false` (anti self-promoção).
- `BETTER_AUTH_SECRET` fail-closed em produção (min 32 chars, placeholders bloqueados) — `env.ts:482-503`.
- OAuth: `accountLinking.allowDifferentEmails: false`, `trustedProviders` explícitos.
- RTR do SessionService: ordem correta de checagens (expiração → revogação → **reuso antes de fingerprint** → fingerprint), revogação de família em reuso — coberto por testes.
- `hasRequiredRole` fail-closed (papel desconhecido/lista vazia → nega).
- Nada relacionado a certificados (PGSSLROOTCERT) encontrado no domínio de auth → sem handoff para 98/99.

## Gates executados

- `npm run typecheck` (`tsc --noEmit`) → **exit 0**
- `npx biome lint src/lib/auth` → 0 erros, 1 warning pré-existente em `rbac/enforcer.ts:63` (sugestão de optional chain — arquivo do Agente 97, não alterado)
- `vitest run -c vitest.unit.config.ts --no-file-parallelism src/lib/auth tests/unit/lib/auth tests/unit/auth` → **45/45 testes passam** (6 arquivos)
  - Inclui novos: `password-hash.unit.test.ts` (5), `session.service.unit.test.ts` (7)
  - Nota: sem `--no-file-parallelism`, testes Argon2id estouram o timeout de 15s por contenção de CPU com outros arquivos — flake de ambiente, mitigado com `timeout: 60_000` explícito nos testes pesados.

## Arquivos alterados

- `src/lib/auth/password-hash.ts` — limites Argon2 + try/catch na verificação
- `src/lib/auth/session.service.ts` — sweep de expirados, validação de entrada, doc de não-produção
- `src/lib/auth/__tests__/password-hash.unit.test.ts` — novo
- `src/lib/auth/__tests__/session.service.unit.test.ts` — novo
- `.agents/handoffs/onda-3/96-para-00-session-service-morta.md` — criado/atualizado
- `.agents/handoffs/onda-3/96-para-00-cookie-secure-producao.md` — novo
- `.agents/handoffs/onda-3/96-para-97-rbac-observations.md` — novo
- `.agents/runs/onda-3/96-relatorio.md` — este arquivo

## Commits

- `7632f3a93` fix(auth): limitar parametros Argon2id + conter excecao de hash malformado
- `f8a1763ab` fix(auth): sweep de tokens expirados + validacao de createSession
- `29279e07e` docs(handoffs): achados da auditoria (commit automático do worktree)
- `f40af8ed7` test(auth): timeout explicito nos testes Argon2id pesados

## Dependências / bloqueios

- Nenhum bloqueio. Não executei `test:integration`/`test:e2e` (sem impacto de schema/rotas; escopo unitário).
- Handoffs abertos aguardam decisão do Agente 00 (remoção/integração do SessionService morto; endurecimento de `Secure` cookie em `env.ts` — provável dono: quem detém `src/lib/auth.ts`/`env.ts`).
