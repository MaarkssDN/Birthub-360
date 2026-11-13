# Relatório — Agente 15 — Onda 2 — MEL-13: Proteção SSRF em integrações

Branch: `agente/15-onda2-ssrf` | Worktree: `Birthub-360-worktrees/agente-15-onda2-ssrf` | Base: `integracao/onda-2`
Demanda: DEM-20261113-003

## Resumo

O repositório já possuía dois guards SSRF parciais: `src/shared/security/urlGuard.ts`
(`assertSafeExternalUrl`/`safeFetch`, com DNS + pinning — usado por Bitrix, 3CX, Slack e
`universalMessagingTool`) e `isPrivateOrReservedHost`/`isSafePublicUrl` em
`src/lib/voice-hub/validators/index.ts` (checagem literal, usada por schemas zod de callbackUrl/
webhookEndpoint e re-checada em `webhook.worker.ts` e `HttpToolExecutor.ts`).

O gap real estava em `src/lib/security/url-validator.ts` (`validateWebhookUrl`), consumido por 4
pontos de `src/features/intelligence/` (dono: Agente 07): bypass total em `NODE_ENV=development|
test`, sem resolução DNS, faixas incompletas (sem CGNAT 100.64/10, IPv6 ULA/link-local, 0.0.0.0,
. localhost/ .internal) e `http:` sempre permitido.

## Alterações

1. **`src/lib/security/ssrfGuard.ts` (novo)** — guard central de validação:
   - `isPrivateOrInternalHost(hostname)`: checagem síncrona de host literal — localhost e sufixos,
     0.0.0.0, RFC1918 (10/8, 172.16/12, 192.168/16), loopback 127/8, link-local 169.254/16
     (metadata cloud), CGNAT 100.64/10, IETF 192.0.0/24 e benchmarking 198.18/15, multicast/reservado
     ≥224, IPv6 ULA fc00::/7 e link-local fe80::/10, IPv4-mapeado-em-IPv6, sufixos .local/.internal/
     .lan. IPv4 decimal/octal/hex já chega normalizado pelo parser WHATWG de `URL`.
   - `assertSafeOutboundUrl(rawUrl, opts)`: parse + esquema (`https:` sempre; `http:` apenas fora de
     produção, mesma convenção de `isSafePublicUrl`/`isSafeWebhookUrl`) + host literal + `dns.lookup
     {all:true}` validando TODOS os IPs resolvidos. Lança `AppError(400)`.
2. **`src/lib/security/url-validator.ts`** — `validateWebhookUrl` agora delega a
   `assertSafeOutboundUrl` (assinatura preservada; call sites do Agente 07 intocados). Removido o
   bypass de ambiente.
3. **`tests/unit/lib/security/ssrfGuard.test.ts` (novo)** — 72 testes: faixas internas, IPv6,
   IPv4-mapeado, IP decimal/hex/octal, file:///ftp:///gopher:///javascript:, DNS mockado (público,
   privado, resolução mista, falha de resolução), política http/https por NODE_ENV.

## Não alterado (decisão de escopo)

- `src/features/integrations/**` (Agente 06): já coberto por `safeFetch`/`assertSafeExternalUrl`
  com pinning de DNS em bitrix, threecx, slack, birth-voice — nada a fazer.
- `src/features/intelligence/**` (Agente 07): validação reforçada via `url-validator` sem tocar
  arquivos do dono; a migração dos `fetch` crus para `safeFetch` virou handoff
  `15-para-07-webhook-fetch-safeFetch.md` (janela de DNS rebinding + redirects).
- `src/lib/voice-hub/**` e `src/lib/voice-runtime/HttpToolExecutor.ts`: checagem literal existente
  mantida; gap de DNS documentado no código e citado no handoff.
- `N8nWebhookDispatcher`: URL vem de env do operador (não tenant) — fora do escopo SSRF.

## Gates

- `npx tsc --noEmit` — exit 0.
- `npm run lint` (biome) — exit 0 (warnings pré-existentes, nenhum nos arquivos novos).
- `npx vitest run -c vitest.unit.config.ts tests/unit/lib/security/ssrfGuard.test.ts` — 72/72.
- Testes relacionados: `tests/unit/intelligence/universalConnectors.*`,
  `universalTools.integrationSecrets`, `tests/unit/shared/security/urlGuard.test.ts` — 61/61.

## Limitações conhecidas

- `validateWebhookUrl` valida sem fetch: janela residual de DNS rebinding entre validação e `fetch`
  cru nos call sites do Agente 07 (ver handoff). Caminho crítico já usa `safeFetch` com pinning.
- Sem pinning de DNS no `assertSafeOutboundUrl` isolado — proposital: é a camada de validação;
  fetch real deve usar `safeFetch`.
