# Relatório de execução — ONDA3-97-RBAC (Agente 97 · Rocco)

- Runtime: Devin (subagente)
- Branch: `agente/97-rbac-onda3` (baseline `32d07c375`)
- Worktree: `C:\Github\Birthub-360-worktrees\dem-20261123-onda3\wt-97-rbac`
- Escopo de escrita: `src/lib/auth/rbac/**` + teste direcionado `tests/unit/lib/auth/rbacEnforcer.test.ts`
- Handoff de entrada: `agente/96-auth-onda3:.agents/handoffs/onda-3/96-para-97-rbac-observations.md`

## Diagnóstico por item

### 1. `userRole` ecoado em respostas 403 — APROVADO (risco baixo, sem alteração)

`sendForbiddenResponse` (`src/lib/auth/rbac/enforcer.ts`) devolve `userRole` no payload e na
mensagem de erro. Avaliação: o papel ecoado é o do **próprio solicitante**, já conhecido pelo
cliente (frontend usa o mesmo `role` para esconder UI) e `req.user` é populado server-side por
`authenticateToken` a partir da sessão Better Auth — não é controlável pelo cliente. Não há
vazamento de dado de terceiros nem enumeração de hierarquia além do que o usuário já possui.
Além disso, `requireRole` (`src/shared/middlewares/requireRole.ts:32`, fora da minha
propriedade) ecoa o papel da mesma forma — remover só do enforcer criaria divergência de
contrato sem ganho de segurança. Decisão: manter paridade; registrado como risco aceito.

### 2. `enforceRole` sem validação de tenant — CORRIGIDO (defesa em profundidade)

Varredura de consumidores: o único uso de `enforceRole`/`enforceAdminOnly`/
`enforceGestorOrAbove`/`enforceCommercialIntelligence`/`enforceCopilotoIa` em `src/**` é
`src/features/feature-flags/routes/featureFlags.routes.ts` (PUT/DELETE `/:key`), montado em
`src/bootstrap/routes.ts:181` atrás de `authenticateToken` + `requireTenant`. Ou seja, **não
havia caminho explorável hoje** — mas `enforceRole` é export público e confiava
exclusivamente no mount para o vínculo de tenant.

Correção aplicada em `src/lib/auth/rbac/enforcer.ts`: após o check de autenticação, o
middleware agora exige `req.user.organizationId` preenchido e responde 403 (mesmo envelope
`FORBIDDEN`) caso ausente — antes de avaliar o papel. Fail-closed reforçado, sem enfraquecer
nenhum caminho existente (o mount atual sempre popula `organizationId`).

### 3. `hasRequiredRole` fail-closed — APROVADO (re-verificado + testes de borda)

Re-verificação de `src/lib/auth/authorization.ts` (fora da minha propriedade — apenas leitura):
- papel desconhecido do usuário → nível 0 → nega;
- papel requerido desconhecido → nível 999 → nega (mesmo para ADMIN=100);
- `allowedRoles` vazio → `Math.min()` = `Infinity` → nega;
- `allowedRoles` só com desconhecidos → 999 → nega;
- chaves herdadas (`constructor`, `__proto__`, `toString`) resolvem para funções/objetos →
  comparação numérica falsa → nega;
- role case-variante/espaços (`admin`, `ADMIN `, `ADMIN\n`) → fora da hierarquia → nega;
- role vazia → `enforceRole` responde 401 antes mesmo da checagem de papel.

Novos testes de borda adicionados em `tests/unit/lib/auth/rbacEnforcer.test.ts` cobrem todos
esses casos via `enforceRole`/`enforceAdminOnly`.

### 4. Auditoria de `src/lib/auth/rbac/**`

`src/lib/auth/rbac/` contém apenas `enforcer.ts`. Sem matriz de permissões duplicada, sem roles
default hardcoded, sem bypass. Papéis canônicos (`ROLE_HIERARCHY`, `UNVERIFIED_ROLE`,
`COMMERCIAL_INTELLIGENCE_ROLES`, `MESA_TRATAMENTO_ROLES`, `COPILOTO_IA_ROLES`,
`COPILOTO_IA_MANAGEMENT_ROLES`) vivem em `src/lib/auth/authorization.ts` e são consumidos por
frontend e backend pela mesma função — consistência garantida por construção. Default de
`User.role` = `VISUALIZADOR` (prisma/schema.prisma:905; better-auth `input: false` impede
self-service de role em `src/lib/auth.ts:319-323`).

## Arquivos alterados

- `src/lib/auth/rbac/enforcer.ts` — check de `organizationId` no `enforceRole` (403 fail-closed).
- `tests/unit/lib/auth/rbacEnforcer.test.ts` — +11 testes (tenant ausente, roles forjadas,
  allowedRoles vazio/desconhecido, role vazia → 401).

## Testes executados

- `npx vitest run -c vitest.unit.config.ts tests/unit/lib/auth/rbacEnforcer.test.ts src/lib/auth/__tests__/authorization.unit.test.ts` → 28/28 verde (antes da correção: 3 falhas reproduzindo o gap de tenant).
- `npx vitest run -c vitest.unit.config.ts tests/unit/features/feature-flags tests/unit/auth` → 25/25 verde.
- `npx tsc --noEmit` → exit 0.
- `tests/integration/rbac-e2e-feature-flags.test.ts` não executado (exige Postgres; outros
  agentes em paralelo — fora do escopo de testes direcionados da missão).

## Handoffs

Nenhum aberto — nenhum defeito fora da propriedade do Agente 97 foi encontrado. A observação
1 do Agente 96 foi avaliada e aprovada com justificativa acima; se o 00/24 preferirem remover
o eco de `userRole`, a mudança equivalente existe também em `requireRole.ts`
(`src/shared/middlewares/`, ownership indefinido) e precisaria de decisão coordenada.
