De: 24 — Revisão Independente
Para: 12 — Voz e Telefonia
Onda: onda-2 (PR #339 — `agente/12-onda2-handoffs`)
Status: aberto
Prioridade: normal
Bloqueador-ref: parecer `.agents/reviews/onda-2/24-revisao-prs-337-338-339-345-346.md`
Sprint destino: antes do merge do PR #339

## Problema

Em `src/lib/voice-hub/middlewares/index.ts` (`attachAuthIfPresent`), a linha

```ts
(req as express.Request & { user?: TokenPayload }).user = session;
```

**sobrescreve incondicionalmente `req.user`** com o `TokenPayload` do voice-hub
(`role` = voice-role `'admin'|'user'|'supervisor'`), contradizendo o comentário
imediatamente acima ("req.user canônico ... NÃO é sobrescrito").

Quando `authenticateToken` rodou upstream, `req.user` é o `AuthUser` canônico
(`role` = `UserRole`: `ADMIN`/`GESTOR`/...). Após `attachAuthIfPresent`, qualquer
middleware/handler downstream que leia `req.user.role` passa a ver o voice-role.

Impacto avaliado: **latente, não explorável hoje** — `legacyModuleGate` mantém
`/api/voice-hub`, `/api/outbound` e `/api/dialer-3cx` em 503
(`src/bootstrap/routes.ts:210-216`, arquivo não tocado pelo PR). A direção da
divergência é majoritariamente fail-closed (`requireRole(['ADMIN'])` canônico
não casa `'admin'`), mas é uma violação de contrato que pode gerar negações
indevidas ou comportamentos inesperados quando o gate for reaberto.

## Arquivo(s) envolvido(s)

- `src/lib/voice-hub/middlewares/index.ts` — `attachAuthIfPresent` (~L168-172)

## Evidência

- Diff do PR #339, hunk de `middlewares/index.ts`.
- `src/shared/middlewares/authenticateToken.ts:83` popula `req.user` canônico.
- `src/lib/voice-hub/middlewares/rbac.ts` `voiceHubSessionOf` já resolve a sessão
  a partir de `req.user` canônico — ou seja, o overwrite não é necessário para o
  fluxo do voice-hub.

## Alteração necessária (sugestão mínima)

Só atribuir `req.user` quando ainda não houver usuário canônico, ex.:

```ts
const existing = (req as { user?: { id?: string } }).user;
if (!existing?.id) {
  (req as express.Request & { user?: TokenPayload }).user = session;
}
```

ou simplesmente remover a atribuição e manter apenas `req.voiceHubUser` +
`req.organizationId` (o `express.d.ts` do voice-hub já declara `voiceHubUser`).
Em qualquer caso, alinhar o comentário ao comportamento real.

## Teste esperado

- Teste unitário em `middlewares/index.ts` (ou `apiKeyAuth.test.ts`): request com
  `req.user` canônico (`role: 'ADMIN'`) + sessão voice-hub ⇒ `req.user.role`
  permanece `'ADMIN'` após `attachAuthIfPresent`.
