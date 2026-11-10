---
name: baileys-whatsapp-resilience
description: Governança e estabilidade para a integração WhatsApp via @whiskeysockets/baileys. Documenta riscos de conformidade da biblioteca não-oficial, reconexão de sessão, delays anti-ban e aderência ao model WhatsAppMessage.
---

# Baileys WhatsApp Resilience — Birth Hub 360

## Objetivo
Operar com resiliência a integração WhatsApp baseada em `@whiskeysockets/baileys`, registrando explicitamente suas restrições operacionais e respeitando o schema atual (`WhatsAppMessage` em `prisma/schema.prisma`).

## Risco Operacional e de Conformidade (Importante)
- `@whiskeysockets/baileys` **não é uma API oficial da Meta**; opera via engenharia reversa do protocolo WebSocket do WhatsApp Web.
- Antes de qualquer ativação comercial em escala, avalie o risco de bloqueio/banimento de números e quebras de protocolo, mantendo os serviços desacoplados atrás de interface de provedor para facilitar uso da WhatsApp Business Cloud API oficial.

## Diretrizes Técnicas

### 1. Persistência de Sessão e Reconexão
- Credenciais de sessão nunca devem ficar em texto puro sem proteção (bloqueador **B-04**).
- No evento `connection.update`:
  - `DisconnectReason.loggedOut` (401) exige invalidação da sessão e novo pareamento QR Code.
  - Desconexões transitórias devem acionar reconexão com backoff exponencial e jitter.

### 2. Políticas de Cadência e Opt-Out (LGPD)
- Adicione intervalos humanizados (2 a 5 segundos) e atualização de presença (`sendPresenceUpdate('composing')`) antes do envio.
- Comandos de opt-out do titular devem registrar revogação de consentimento imediatamente (bloqueador **B-13**).

### 3. Aderência ao Schema (`WhatsAppMessage` em `prisma/schema.prisma`)
- O model `WhatsAppMessage` atual possui as colunas: `id`, `organizationId`, `waMessageId`, `direction`, `phoneE164`, `body`, `contactId`, `leadId`, `receivedAt`.
- **Não assuma** colunas inexistentes de status de recibo (`status`) ou metadados de mídia (`mediaUrl`, `mimeType`) sem antes abrir handoff formal ao **Agente 01** para evolução de `prisma/schema.prisma`.

## Checklist de Saúde do WhatsApp
- [ ] Números são normalizados em formato `phoneE164` antes de persistir em `WhatsAppMessage`?
- [ ] Toda leitura e escrita em `WhatsAppMessage` respeita o isolamento por `organizationId` (testado em `tests/integration/whatsapp-message-tenant-isolation.test.ts`)?
