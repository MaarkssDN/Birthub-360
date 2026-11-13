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
