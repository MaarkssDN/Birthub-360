# Governança WhatsApp — Driver Baileys (API não-oficial) vs WhatsApp Cloud API (oficial)

**Status:** ATIVA
**Data:** 2026-11-14
**Autor:** Agente 06 (Integrações e Bitrix)
**Demanda:** DEM-20261114-003 (MEL-12 — follow-up Onda 2)
**Complementa:** ADR-008 (`docs/architecture/ADR-008-WHATSAPP-CONECTOR.md`), que registra a decisão de coexistência dos dois drivers.

Este documento governa o uso do driver **Baileys** (`@whiskeysockets/baileys`), que opera sobre o
protocolo WhatsApp Web — **API não-oficial**, sem SLA e fora dos Termos de Serviço da Meta. Ele
existe porque o ADR-008 decidiu pela convivência dos drivers, mas não detalhou os riscos operacionais
nem as mitigações implementadas. Todas as afirmações abaixo citam o código real do repositório; onde
o código não cobre um risco, está marcado explicitamente como **lacuna**.

---

## 1. Riscos do driver Baileys (API não-oficial)

| Risco | Severidade | Evidência no código |
|---|---|---|
| **Banimento do número** pelo WhatsApp/Meta (detecção de automação, volume anômalo, denúncia de destinatários) | Alto | O próprio código reconhece o risco: comentário RUN-011 em `src/features/integrations/whatsapp/whatsapp.service.ts:40-46` cita "em casos extremos banimento do número" como motivo da trava distribuída de sessão. Não há hoje telemetria dedicada de banimento/ban-check. |
| **Violação dos Termos de Serviço da Meta** — Baileys não é API licenciada; uso comercial automatizado em número pessoal/corporativo vinculado via WhatsApp Web está fora do contrato oficial. Risco jurídico e de perda do número. | Alto | Decisão registrada no ADR-008 §2.1: Baileys é destinado a "atendimento humanizado" e "espelhamento no CRM" por vendedores — **não** a disparos automatizados em massa. |
| **Quebra por mudança de protocolo** — o WhatsApp pode alterar o protocolo a qualquer momento; `fetchLatestBaileysVersion()` (`whatsapp.service.ts:231`) mitiga versões, mas uma mudança incompatível derruba a sessão até atualização da biblioteca. | Médio | Dependência direta de `@whiskeysockets/baileys` em `package.json`. |
| **Sessão única por número** — duas conexões simultâneas do mesmo dispositivo causam desconexões, perda/duplicação de mensagens e aumentam risco de ban. | Alto | Mitigado pela trava distribuída `whatsapp:session-lock:{organizationId}` (`whatsapp.service.ts:53-55, 187-213`). |
| **Perda de credenciais de sessão = sequestro de sessão** — quem lê o estado de auth no Redis assume a sessão sem escanear QR. | Alto | Mitigado por cifragem AES-256-GCM em repouso em `useRedisAuthState.ts:17-22` (SEC-014). |

## 2. Mitigações anti-ban implementadas no código

As mitigações existentes são de **confiabilidade de sessão e anti-spam de cadência**, não de
"anti-ban" explícito. Inventário real:

### 2.1 Trava de sessão única por organização (anti-conexão-duplicada)
- `src/features/integrations/whatsapp/whatsapp.service.ts:47-51` — TTL 30s, heartbeat a cada 10s,
  até 5 tentativas de aquisição com backoff exponencial (3s → teto 30s).
- Fail-closed: perda de posse da trava encerra o socket local imediatamente
  (`whatsapp.service.ts:99-127`) — nunca opera como "dono" duvidoso.
- Comentário explícito ligando duplicidade de conexão a banimento (linhas 40-46).

### 2.2 Reconexão com backoff exponencial limitado
- `whatsapp.service.ts:36-38` — máx. 5 tentativas, base 2s, teto 60s
  (`RECONNECT_BASE_DELAY_MS`, `RECONNECT_MAX_DELAY_MS`, `MAX_RECONNECT_ATTEMPTS`).
- Logout definitivo (`DisconnectReason.loggedOut`) **não** reconecta e apaga as credenciais Redis
  `wa-auth:{org}:*` (`whatsapp.service.ts:283-286`) — evita loop de reconexão em sessão morta,
  padrão que o WhatsApp pune.

### 2.3 Rate limit de cadência (anti-spam transversal — Agente 17)
- `src/features/cadence/domain/rateLimit.ts:65-70` — defaults: **3 toques/24h por contato**
  (`maxTouchesPerContactWindow`), **30 min mínimo entre canais diferentes**
  (`minMinutesBetweenChannelTouches`), 20 destinatários/dia/domínio para e-mail.
- Aplique-se a toques 'sent' em **qualquer canal e qualquer cadência** — é o freio anti-volume
  mais relevante contra denúncia/ban por spam no canal WhatsApp.
- Configurável por env var via `application/rateLimitConfig.ts` (ver comentário em
  `rateLimit.ts:62-63`).

### 2.4 Opt-out obrigatório (LGPD)
- Dupla verificação: `checkOptOutStatus` no dispatcher de cadência
  (`src/features/cadence/infra/dispatchers/CadenceDispatchers.ts:75-85`) **e**
  `isOptedOut` dentro de `sendWhatsAppMessage` (`whatsapp.service.ts:435-455`) — bloqueio duplo,
  falha fechada (409).
- `WhatsAppConnectorManager.sendMessage` rejeita antes de rotear quando `isOptedOut`
  (`src/features/integrations/whatsapp/conectorManager.ts:37-48`).
- ADR-008 §3: "SAIR"/"STOP"/"CANCELAR" ativam expurgo do canal.

### 2.5 Fila com retry limitado e DLQ (anti-tempestade de reenvio)
- `src/lib/queue/whatsappCommand.queue.ts:55-60` — `attempts: 3`, backoff exponencial 1s,
  `removeOnFail` com retenção 7 dias.
- `src/lib/queue/whatsappCommand.worker.ts:17-26` — erros permanentes (número inválido, opt-out,
  HTTP 400/401/403/404/410/422) viram `UnrecoverableError` → DLQ imediata, **sem retry** —
  evita martelar o WhatsApp com destinatários mortos.
- DLQ própria `whatsapp-messages-dlq` + `recordDeadLetter` (AuditLog) em
  `whatsappCommand.worker.ts:92-134`.
- Concurrency do worker limitada a 4 (`whatsappCommand.worker.ts:140`).

### 2.6 Broker web↔worker (topologia anti-sessão-dupla)
- `sendWhatsAppMessage` só fala direto com o WASocket no processo dedicado
  (`isDedicatedWorkerProcess`); réplicas web enfileiram via `whatsapp-command`
  (`whatsapp.service.ts:415-429`). Isso concentra todas as conexões Baileys no worker,
  reduzindo a superfície de sessões duplicadas entre réplicas.

## 3. Lacunas conhecidas (registradas, não corrigidas nesta missão)

1. **`WhatsAppConnectorManager` é stub**: `conectorManager.ts:56-72` retorna `messageId` sintético
   (`baileys-msg-${Date.now()}` / `waba-msg-${Date.now()}`) sem chamar Baileys nem a Cloud API.
   O roteamento por driver existe, mas não há implementação real de envio por ele — o envio real
   passa por `sendWhatsAppMessage` (Baileys) e cadência. **Achado: fallback CLOUD_API do ADR-008
   não está implementado.**
2. **Sem delay/jitter anti-ban por destinatário**: não existe throttle de envio por número
   (ex.: N msgs/hora por destinatário) — o rate limit existente é por contato **global** (todos os
   canais), não específico de cadência de mensagens no mesmo chat.
3. **Sem detecção de ban/restrição**: não há handler para respostas de bloqueio do WhatsApp nem
   métrica de "número restrito" — um ban só aparece como falhas de envio genéricas.
4. **Inbound sem retry**: mensagens recebidas (`messages.upsert`) que falham na persistência vão
   para DLQ manual (`whatsapp.service.ts:311-329`), sem reprocessamento automático.

## 4. Fallback para API oficial (WhatsApp Cloud API / Meta)

- **Decisão arquitetural já tomada** (ADR-008 §2.2): a Cloud API é o driver para cadências
  automatizadas e templates HSM em escala — "risco zero de bloqueio de número".
- **Estado real da implementação**: apenas o *contrato* existe — `driver: 'CLOUD_API'` em
  `conectorManager.ts` (stub, ver §3.1). Não há cliente Graph API, webhook de status de entrega
  nem gestão de templates HSM implementados.
- **Pré-requisitos para ativar o fallback** (quando priorizado): número WABA + token de sistema
  permanente, templates aprovados pela Meta, opt-in verificável, e implementação real do branch
  `CLOUD_API` em `WhatsAppConnectorManager.sendMessage`.
- **Recomendação operacional**: enquanto a Cloud API não existir, manter o uso Baileys restrito a
  volumes compatíveis com a política de 3 toques/24h e a números que tolerem o risco (§1).

## 5. Plano de contingência

| Cenário | Sinal | Ação imediata | Ação estrutural |
|---|---|---|---|
| Número banido/restrito | Falhas em massa de `sendMessage`, `loggedOut` recorrente, sumiço do status | `POST /disconnect` + `logoutWhatsApp` para liberar a trava (`whatsapp.routes.ts:95-112`); pausar cadências com canal whatsapp; acionar suporte Meta/operadora | Migrar o tenant para Cloud API (quando implementada) ou para número novo com onboarding assistido |
| Sessão travada em "connecting" | `GET /status` retorna `connecting`/`disconnected` persistente | Verificar lock `whatsapp:session-lock:{org}` no Redis e logs do worker | Restart do worker; TTL da trava garante failover em ≤30s |
| Perda/duplicação de mensagens | Gaps em `whatsAppMessage`, DLQ `whatsapp-inbound`/`whatsapp-command` crescendo | Consultar `whatsapp-messages-dlq` e AuditLog `QUEUE_DEAD_LETTER` | Reprocessar manualmente; abrir handoff se recorrente |
| Quebra de protocolo Baileys | Erros de decrypt/version em massa após deploy | `fetchLatestBaileysVersion` falha ou `connection.update` nunca emite `open` | Fix de versão do `@whiskeysockets/baileys` (handoff 06) ou contingência §4 |

**Runbooks relacionados:** DLQ consultável via filas BullMQ `whatsapp-command` /
`whatsapp-messages-dlq` e AuditLog (`recordDeadLetter`); status por tenant em
`GET /api/whatsapp/status`; desconexão emergencial em `POST /api/whatsapp/disconnect`.

## 6. Responsáveis e governança

- **Dono do código do canal:** Agente 06 (Integrações e Bitrix) — `src/features/integrations/whatsapp/**`.
- **Consumidores de fila:** Agente 16 — `src/lib/queue/whatsappCommand.*`, `whatsappSignal.*`.
- **Voz/telefonia:** Agente 12 — `src/lib/voice-hub/**` (webhooks de saída; não é WhatsApp).
- **Cadência/rate limit/opt-out de envio:** Agente 17 — `src/features/cadence/**`.
- **Revisão:** qualquer mudança de driver, política de volume ou fallback exige revisão do
  Agente 24 e, quando envolver tenancy/LGPD, dos Agentes 21 e 15.
