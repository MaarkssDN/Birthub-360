# Handoff 56 → 00 — Auditoria WhatsApp / Meta Cloud API (Onda 4)

- **De:** Agente 56 — Luna (Conectores WhatsApp e Meta Cloud API)
- **Para:** Agente 00 — Coordenador
- **Onda:** 4 (missão ONDA4-56-WHATSAPP)
- **Status:** resolvido (escopo próprio) / achados externos escalados abaixo
- **Prioridade:** normal (1 achado alto fora do ownership — ver F2/F4)
- **Branch:** `agente/56-whatsapp-onda4` · **Base SHA:** `32d07c3750c370b63da8b720019413c9a40e0e68`
- **SHA de entrega:** `0135b31f4bf4d3466219bdc62b36b75c54eb0435`

## Escopo e ownership

Ownership exclusivo da missão: `src/lib/integrations/whatsapp/**` — contém apenas
`baileys.client.ts` (anti-ban throttler). Todo o restante da integração vive fora do
meu ownership e foi auditado sem edição:

- `src/features/integrations/whatsapp/**` → dono **Agente 06** (AGENTS.md local)
- `src/lib/queue/whatsapp*.ts` → dono **Agente 16**
- `src/features/notifications/opt-out/optout.service.ts` → dono **Agente 69** (referência de contrato, não editado)
- `tests/**` → dono **Agente 08** (meu teste novo ficou colocalizado em
  `src/lib/integrations/whatsapp/__tests__/`, dentro do meu path)

## O que existe de fato (auditoria)

1. **Driver real: apenas Baileys** (`@whiskeysockets/baileys`, WhatsApp Web multi-device).
   Sessão por tenant em Redis com AES-256-GCM (`useRedisAuthState.ts`, SEC-014 já resolvido),
   trava distribuída por organização com heartbeat/failover (RUN-011), reconexão com
   backoff exponencial + jitter (máx. 5 tentativas), invalidação de credenciais em
   `DisconnectReason.loggedOut`.
2. **Meta Cloud API: NÃO existe.** `conectorManager.ts` (Agente 06) tem driver
   `'CLOUD_API'` que retorna `sent: true` com `messageId` fabricado
   (`waba-msg-${Date.now()}`) sem chamar nenhum provedor — é stub, não integração.
   Não há webhook de status de entrega/leitura nem janela de 24h implementada.
3. **Envio:** `sendWhatsAppMessage` → fila BullMQ `whatsapp-command` (attempts:3,
   backoff exponencial, DLQ `whatsapp-messages-dlq` + `recordDeadLetter`),
   idempotência por `jobId` (`whatsapp-command:{org}:{key}`), classificação
   permanente/transiente (`isPermanentWhatsAppError`).
4. **Recebimento:** `messages.upsert` → `persistWhatsAppMessage` idempotente por
   `(organizationId, waMessageId)` (unique no schema), eventos `WHATSAPP_MESSAGE_*`
   e `ENGAGEMENT_SIGNAL_RECEIVED` no domainEventMesh com idempotencyKey própria,
   falha de persistência → dead-letter `whatsapp-inbound`.
5. **Opt-out:** inbound STOP/SAIR → `isOptOutKeyword` → flag legado
   `customFields.optOutWhatsApp` + `recordOptOut` unificado; outbound →
   `isOptedOut` antes de enviar (bloqueio com AppError 409 → DLQ permanente).
6. **Tenancy:** `organizationId` em todas as queries, `withRlsContext`/RLS,
   `requestContext.run({ tenantId })`, chave Redis `wa-auth:{org}:*`,
   jobId de signal com org. Teste de isolamento existe:
   `tests/integration/whatsapp-message-tenant-isolation.test.ts`.

## Corrigido dentro do ownership (SHA `0135b31f4`)

**F1 — Race no throttler anti-ban (corrigido + testado).**
`WhatsAppAntiBanThrottler.throttle()` não serializava chamadas concorrentes da mesma
organização: duas chamadas paralelas liam o mesmo `lastDispatchedAt` e nenhuma dormia
— o delay humanizado de 3–8s era contornado exatamente no cenário de rajada que ele
existe para prevenir (o worker `whatsapp-command` roda com `concurrency: 4`).
Correção: cadeia de promises por `organizationId` (`throttleSerialized` privado);
orgs diferentes continuam paralelas; falha de uma chamada não trava a cadeia.
Evidência: `src/lib/integrations/whatsapp/__tests__/baileys.client.test.ts`
(3 casos: serialização same-org, não-bloqueio cross-org, primeiro disparo sem sleep) +
`tests/unit/lib/integrations/whatsappAntiBan.test.ts` existente — **6/6 verde**.

## Achados fora do ownership — precisam de handoff ao dono

**F2 → Agente 06 (alto): throttler/presença anti-ban não está plugado no envio real.**
`whatsapp.service.ts` `sendWhatsAppMessage` (linhas ~481–489) chama `sock.sendMessage`
diretamente — nenhum import de `whatsAppAntiBanThrottler` nem
`sock.sendPresenceUpdate('composing')`. Ou seja, o governança anti-ban documentada na
skill `baileys-whatsapp-resilience` é dead code no caminho de produção. Sugestão:
chamar `await whatsAppAntiBanThrottler.throttle(organizationId)` antes do
`sendMessage` e opcionalmente `sendPresenceUpdate`.

**F3 → Agente 06 (alto): opt-out inbound só é registrado se existir Lead aberto.**
`whatsappMessage.service.ts:177` — `if (lead && input.direction === 'inbound')` envolve
todo o bloco de opt-out. Contato cadastrado SEM lead aberto (ou número desconhecido)
que responde "SAIR"/"STOP" não gera `OptOutRecord` → envios futuros por esse número
não são bloqueados por `isOptedOut`. Além disso usa `recordOptOut` direto em vez de
`recordOptOutAndPurgePendingJobs` (contrato do Agente 69): jobs já enfileirados em
`whatsapp-command` não são purgados na hora — eles falham depois no check de envio e
caem na DLQ como "permanentes" (ruído, não vazamento). Sugestão: mover o check de
keyword para fora do `if (lead)` e usar o wrapper de purge do 69.

**F4 → Agente 06 (médio): corrida em `initWhatsApp`.**
Sem guarda para `status === 'connecting'`: `scheduleLockRetry` (setTimeout), o timer de
reconexão e um `/connect` manual podem chamar `initWhatsApp` concorrentemente; todos
passam pelo check `session.status === 'connected'` (false) e `session.lock?.acquired`
(true após o primeiro) → dois `makeWASocket` na mesma org/mesmo auth state no Redis.
Adicional: no handler `connection === 'close'` (linha ~261) `session.sock` não é
anulado. Sugestão: guarda `if (session.status === 'connecting') return` ou mutex por org.

**F5 → Agente 06/00 (médio): Meta Cloud API é stub.**
`conectorManager.ts` `CLOUD_API` retorna sucesso fabricado. Se a missão espera Cloud
API real (webhooks de status, janela 24h, múltiplos números/tenant), é feature nova —
precisa de credenciais WABA/phone_number_id por tenant (schema → handoff ao 01) e
dono de implementação. **Não implementado nesta onda** (sem credenciais sandbox,
regra dura proíbe chamada real).

**F6 → Agente 16 (baixo): status pode ficar stale.**
`getWhatsAppStatus` lê Redis com TTL 24h — réplica que não detém a trava pode reportar
'connected' espelhado por outra. Cosmético; considerar incluir posse da trava no payload.

## Verificações executadas

- `npx vitest run -c vitest.unit.config.ts src/lib/integrations/whatsapp/__tests__/baileys.client.test.ts tests/unit/lib/integrations/whatsappAntiBan.test.ts` → **6/6 pass**
- `npx tsc --noEmit` → **0 erros**
- `npx biome lint src/lib/integrations/whatsapp/` → **limpo**
- Nenhuma mensagem real disparada; nenhum número/credencial de produção usado; todos os
  testes com timers/delays pequenos e mocks locais.

## Bloqueios

Nenhum bloqueio para o escopo próprio. F2–F5 dependem dos donos indicados — recomendo
ao 00 abrir handoffs formais 56→06 (F2, F3, F4) e decidir sobre Cloud API (F5).
