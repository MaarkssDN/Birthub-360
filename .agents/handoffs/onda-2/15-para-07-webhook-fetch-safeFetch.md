De: 15 — Segurança Aplicada e Rotação de Segredos
Para: 07 — IA e Automações
Onda: 2
Status: aberto
Prioridade: normal
Bloqueador-ref: MEL-13 (Onda 2, DEM-20261113-003)
Sprint destino: Onda 2/3

## Problema

`validateWebhookUrl` (`src/lib/security/url-validator.ts`) foi endurecido na Onda 2 e agora delega
para `assertSafeOutboundUrl` (`src/lib/security/ssrfGuard.ts`): HTTPS obrigatório em produção,
bloqueio de IP literal interno/reservado e resolução DNS validando TODOS os endereços do host.
O bypass que existia em `NODE_ENV=development|test` foi removido.

Porém, três call sites em `src/features/intelligence/` validam a URL e depois fazem `fetch` cru —
o que mantém duas janelas residuais:

1. **DNS rebinding**: entre a validação e o `fetch`, o hostname pode passar a resolver para IP
   privado (a validação e a conexão resolvem DNS em momentos separados).
2. **Redirects**: `fetch` global segue 3xx para qualquer host, inclusive interno, sem revalidar.

## Arquivo(s) envolvido(s)

- `src/features/intelligence/services/universalConnectors.service.ts` (~linha 156: valida URLs de
  config de conectores no save; o fetch de teste do conector ocorre em `testUniversalConnector`).
- `src/features/intelligence/tools/universalNotificationsTool.ts` (~linha 111: `pushWebhookUrl` +
  `fetch` POST).
- `src/features/intelligence/tools/universalTasksAndNotesTool.ts` (~linha 334: `taskEndpoint` do
  Bitrix + `fetch` POST).
- `src/features/intelligence/services/aiPendingAction.service.ts` (~linha 232: `send_sms`
  `webhookUrl` + `fetch` POST).

`src/features/intelligence/tools/universalMessagingTool.ts` já é o modelo correto: usa
`assertSafeExternalUrl` + `safeFetch` de `src/shared/security/urlGuard.ts`.

## Evidência

Commit `fca2d0756` na branch `agente/15-onda2-ssrf` (worktree
`Birthub-360-worktrees/agente-15-onda2-ssrf`): `ssrfGuard.ts` novo,
`url-validator.ts` delegando, `tests/unit/lib/security/ssrfGuard.test.ts` (72 testes verdes).

## Alteração necessária

Para os quatro pontos acima, trocar o par `validateWebhookUrl(url)` + `fetch(url, ...)` por
`assertSafeExternalUrl(url)` + `safeFetch(url, ...)` de `src/shared/security/urlGuard.ts` (mesmo
padrão de `universalMessagingTool.ts`). Atenção: `urlGuard` exige HTTPS sempre — se algum fluxo
depende de `http:` fora de produção (ex.: webhook local de teste), alinhar com o 15 antes.

## Teste esperado

- Mockar `safeFetch`/`assertSafeExternalUrl` nos testes existentes de `universalConnectors`,
  `universalNotificationsTool`, `universalTasksAndNotesTool` e `aiPendingAction` (os testes atuais
  já mockam `url-validator`, então o ajuste é de import).
- `npx vitest run -c vitest.unit.config.ts tests/unit/intelligence/` verde.

## Contexto adicional

- `src/lib/voice-hub/validators/index.ts` (`isPrivateOrReservedHost`) e
  `src/lib/voice-hub/services/webhook.worker.ts` / `src/lib/voice-runtime/HttpToolExecutor.ts`
  usam checagem literal de IP apenas (sem DNS) — gap de DNS rebinding documentado no próprio
  código; candidato a handoff para os donos de voice-hub se desejado.
- `N8nWebhookDispatcher` usa `N8N_WEBHOOK_URL` de env do operador (não input de tenant) — fora do
  escopo SSRF por design; n8n auto-hospedado em IP privado continua funcionando.

## Resolução (Agente 07 — 2026-11-15, worktree `Birthub-360-wt-o3-07`, branch `agente/07-onda3-ia`)

Aplicado o padrão `assertSafeExternalUrl` + `safeFetch` de
`src/shared/security/urlGuard.ts` (mesmo de `universalMessagingTool.ts`) nos call
sites que faziam `validateWebhookUrl`/`assertSafeOutboundUrl` + `fetch` cru:

- `src/features/intelligence/tools/universalNotificationsTool.ts` — push gateway
  (`integration.push_gateway.webhookUrl`): `validateWebhookUrl` + `fetch` →
  `assertSafeExternalUrl` + `safeFetch` (import trocado de `url-validator.js` para
  `shared/security/urlGuard.js`).
- `src/features/intelligence/tools/universalTasksAndNotesTool.ts` — endpoint Bitrix
  `tasks.task.add.json` montado a partir de `bitrixCfg.webhookUrl`: idem. Os demais
  fetches do arquivo (Trello/Monday/Notion) usam host de provedor fixo hardcoded —
  fora do escopo SSRF por design (comentário em `urlGuard.ts`).
- `src/features/intelligence/services/aiPendingAction.service.ts` — `send_sms`
  (`integration.sms.webhookUrl`): o `import()` dinâmico de `url-validator.js` virou
  `import()` dinâmico de `urlGuard.js` + `safeFetch`.
- `src/features/intelligence/services/universalConnectors.service.ts` — **sem
  alteração**: o arquivo só valida URLs de config no save
  (`saveUniversalConnectorConfig`, L154-158); `testUniversalConnector` não faz fetch
  algum. Validação-sem-fetch não tem janela de DNS rebinding — `validateWebhookUrl`
  permanece correto ali.

Testes: `tests/unit/intelligence/universalTools.integrationSecrets.test.ts` já
mockava `urlGuard.js`; ajustados os asserts do POST de push e do `send_sms` para
`safeFetchMock` (e `safeFetchMock` não chamado nos caminhos de falha fechada).
`npx vitest run -c vitest.unit.config.ts tests/unit/intelligence
 tests/unit/features/intelligence` → 360/360 verde; `npx tsc --noEmit` limpo;
`npx biome check` nos arquivos limpo.

**Atenção / alinhamento com o 15**: `safeFetch`/`urlGuard` exige **HTTPS sempre**,
enquanto `validateWebhookUrl` tolerava `http:` fora de produção. Webhooks de
tenant configurados com `http://` (ex.: gateway local de teste ntfy/sms-gw em dev)
agora serão rejeitados com 400 em qualquer ambiente — mesmo comportamento que
`universalMessagingTool` (Teams) já tinha. Se algum fluxo depende de `http:` local,
precisa de decisão do 15/00 (não encontrei caso nos testes/código atuais).

### Atualização (Agente 15 — 2026-…, worktree `Birthub-360-wt-o4-safe`, branch `agente/15-onda4-safehttp`)

**Decisão do usuário aplicada**: `safeFetch`/`assertSafeExternalUrl`
(`src/shared/security/urlGuard.ts`) agora toleram `http:` **apenas para loopback**
(`localhost`, `*.localhost`, `127.0.0.0/8`, `::1`, IPv4-mapeado-em-IPv6 de loopback)
quando `NODE_ENV !== 'production'` — via helper `isLoopbackHttpAllowed(url)`.
Em produção e para qualquer host não-loopback, HTTPS continua obrigatório, e o
bloqueio de IP privado/reservado não-loopback segue valendo em todo ambiente.
A exceção é SÓ de scheme/destino: DNS-pinning do `safeFetch` e a validação de
registros DNS (só endereços loopback são aceitos para hostname loopback) permanecem.
`https://localhost`/`https://127.0.0.1` continuam rejeitados — a exceção não abre
loopback para HTTPS. Testes novos em `tests/unit/shared/security/urlGuard.test.ts`
(32/32 verde).

#### Correções pós-revisão Agente 24 (mesma branch)

- **Bloqueador corrigido**: quando `loopbackHttp` e o host é hostname loopback
  (`localhost`, `*.localhost`), `resolveSafe` agora exige que **TODOS** os registros
  DNS retornados sejam loopback (`isLoopbackIp`); qualquer IP público ou
  privado-não-loopback rejeita com "host loopback resolveu para IP não-loopback".
  Antes, `http://localhost` resolvendo para IP público passava em HTTP puro.
- **IPv6 literal**: todos os literais IPv6 com colchetes loopback (`[::1]`,
  `[::ffff:7f00:1]` etc.) são resolvidos direto antes do `dns.lookup` quando a
  exceção se aplica; não-loopback segue falhando fechado.
- **Testes adicionados** (43/43 verde): `foo.localhost` ok/rejeita conforme DNS;
  `localhost`→IP público/privado-não-loopback/misto rejeita; DNS `::ffff:127.0.0.1`
  aceita; `localhost.evil.com` e `127.0.0.1@evil.com` rejeitam; `[::ffff:7f00:1]`
  aceito / `[::ffff:808:808]` rejeitado; resposta 3xx devolvida ao chamador sem
  seguir redirect (cross-host redirect falha no pinning em produção real).

**Risco residual pré-existente (débito para 15/01, não introduzido aqui)**:
`isPrivateOrReservedIp` não reconhece IPv4-mapped IPv6 em forma hexadecimal
(`::ffff:7f00:1`) fora da exceção loopback — um hostname que resolva para esse
formato passaria no guard de IP privado. Fora do escopo desta correção; registrar
como débito de hardening do `urlGuard.ts`.

**Atualização (Agente 15 — 2026-11-17):** o débito acima foi corrigido —
`isPrivateOrReservedIp` agora expande o IPv6 para hextetos e delega o IPv4
embutido (mapeado, 6to4, NAT64, compatível) à checagem IPv4; Teredo é bloqueado
por inteiro. Mesma política aplicada em `ssrfGuard.ts`. Este handoff permanece
**aberto** apenas pela parte endereçada ao Agente 07 (migração dos call sites de
`fetch` cru para `safeFetch`).
