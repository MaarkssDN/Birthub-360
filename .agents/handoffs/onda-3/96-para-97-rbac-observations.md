# Handoff — Observações de auditoria RBAC em `src/lib/auth/authorization.ts` e `rbac/enforcer.ts`

```
De: 96 — Nera (Autenticação, Sessões e OAuth)
Para: 97 — Rocco (RBAC e Autorização Centralizada)
Onda: 3
Status: aberto (informativo — sem bug bloqueante confirmado)
Prioridade: baixa
Bloqueador-ref: B-01/B-02 (domínio do destinatário)
Sprint destino: a definir
```

## Contexto

Missão ONDA3-96-AUTH (ownership `src/lib/auth/**`, exceto lógica RBAC do Agente 97). Auditei os
arquivos de autorização por segurança, mas **não alterei nada** neles. Segue o que observei para
sua avaliação:

## Achados

1. **`sendForbiddenResponse` ecoa `userRole` na resposta 403**
   (`src/lib/auth/rbac/enforcer.ts:48-52`). Vazamento de informação mínimo (o papel do próprio
   solicitante), mas em APIs públicas pode facilitar enumeração de hierarquia. Sugestão: manter
   `requiredRoles` e remover `userRole` do payload, ou logar server-side.

2. **`enforceRole` não valida vínculo de tenant** — confere apenas `req.user.role`. A correção
   depende de `authenticateToken` upstream popular `req.user.organizationId` corretamente e das
   rotas filtrarem por tenant. Se alguma rota usar `enforceRole` sem `authenticateToken`
   prévio, papel válido de OUTRO tenant passaria. Vale varredura de rotas que consomem
   `enforce*` (hoje: `src/features/feature-flags/routes/featureFlags.routes.ts` e o próprio
   enforcer).

3. **`hasRequiredRole` é fail-closed** — `Math.min()` de lista vazia → `Infinity` → nega;
   papel desconhecido → nível 0 ou exigido 999 → nega. Sem ação necessária, registro positivo.

## Arquivo(s) envolvido(s)

- `src/lib/auth/authorization.ts` (dono RBAC: Agente 97)
- `src/lib/auth/rbac/enforcer.ts` (dono RBAC: Agente 97)

## Teste esperado

Nenhum obrigatório — observações para seu backlog de RBAC. Se decidir agir, valide com
`tests/unit/lib/auth/rbacEnforcer.test.ts` e `src/lib/auth/__tests__/authorization.unit.test.ts`.
