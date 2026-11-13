De: 15 — Segurança Aplicada e Rotação de Segredos
Para: 24 — Revisão Independente
Onda: 1
Status: aberto
Prioridade: alto
Bloqueador-ref: DEM-20261113-002
Sprint destino: onda-1

## Problema

Onda 1 do backlog de plataforma (segurança e fundação) implementada pelo
Agente 15. Precisa de revisão independente antes de qualquer marcação de
"Aprovado" no checklist e antes de integração.

## Arquivo(s) envolvido(s)

Branch `agente/15-onda1-seguranca` (worktree
`C:\Github\Birthub-360-worktrees\agente-15-onda1-seguranca`):

- `.env.example` — novas vars EXPORT_RATE_LIMIT_MAX, PUBLIC_BOOKING_RATE_LIMIT_MAX
- `package.json` — script `verify:rls-coverage` (atenção: exige aprovação do 00?)
- `src/bootstrap/rateLimiters.ts` — exportLimiter (por tenant) + publicBookingLimiter (por IP)
- `src/bootstrap/routes.ts` — mount `/api/api-keys` com requireRole(['ADMIN'])
- `src/config/env.ts` — schema das novas vars
- `src/features/api-keys/` — NOVO: service (SHA-256 hash, escopos, expiração,
  revogação, lastUsedAt throttle 5min), routes (CRUD admin), middleware
  `apiKeyAuth(scope?)` exportado p/ consumo futuro
- `src/features/auth/routes/auth-extra.routes.ts` — GET/DELETE/revoke-others
  de sessões próprias (bypassRls pois Session tem FORCE RLS)
- `src/lib/logger.ts` — hook pino `logMethod` + `sanitizeLogValue` (PII em
  strings livres, err.message/stack, profundidade máx 6)
- `src/lib/security/piiMask.ts` — NOVO: máscara irreversível CPF/CNPJ/email/fone
- `src/lib/security/piiTokenizer.service.ts` — regexes movidas p/ piiMask
- `src/lib/zod.ts` — allowlist MIME para anexos (sem HTML/SVG/executáveis)
- `scripts/security/check-rls-coverage.ts` — NOVO gate: 133 tabelas
  tenant-bearing com RLS+policy (4 allowlist = tabelas Better Auth)
- `tests/unit/lib/loggerPiiMask.test.ts` — NOVO
- `.agents/handoffs/onda-1/15-para-08-rls-coverage-ci.md` — handoff CI

## Evidência

- `npx tsc --noEmit` → 0 erros
- `npm run lint` → exit 0 (warnings pré-existentes)
- `npx vitest run -c vitest.unit.config.ts` (6 arquivos relacionados) → 18/18
- `npm run verify:rls-coverage` → OK, 133 tabelas
- `npm run build` → OK
- Diário: `docs/orchestration/journal/15.md` (repo principal)
- Demanda: `docs/orchestration/demands/DEM-20261113-002.md`

## Pontos para o revisor verificar

1. PII hook no logger: `sanitizeLogValue` muta `Error.message/stack` —
   aceitável? Custo de regex só em strings com '@' ou dígito.
2. `apiKeyAuth` popula `req.user` sintético com role 'API' — confirmar que
   não vaza para rotas que confiam só em authenticateToken.
3. `prisma.aPIKey` (case do client gerado) — uso correto.
4. Session FORCE RLS: queries usam `requestContext.run({bypassRls:true})` —
   mesmo padrão de authenticateToken; escopo sempre `userId` do token.
5. zod MIME allowlist pode quebrar uploads legítimos existentes
   (ex.: .doc legado, .svg em uso) — verificar consumidores.
6. package.json alterado (1 script) — AGENTS.md exige aprovação do 00;
   escalar se necessário.

## Alteração necessária

Revisar diff completo da branch e emitir parecer em `.agents/reviews/`.

## Teste esperado

Diff review + reexecução dos gates listados acima.

## Contexto adicional

- MEL-01/02: nenhum segredo real encontrado; achado histórico
  SEC-2026-001 já documentado (rotação fora do repo).
- Itens MEL-08 (webhooks outbound HMAC) e MEL-10 (audit log) NÃO estão na
  Onda 1 — fora de escopo.
- Handoff 15→08 aberto para ligar `verify:rls-coverage` no CI.
