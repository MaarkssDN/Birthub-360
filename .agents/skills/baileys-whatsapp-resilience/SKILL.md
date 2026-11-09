---
name: baileys-whatsapp-resilience
description: Padrões de estabilidade e segurança para a integração do WhatsApp via biblioteca Baileys (@whiskeysockets/baileys). Gestão do estado de autenticação (AuthCreds), reconexão de sessão QR Code, limitação de taxa anti-ban e confirmação de entrega.
---

# Baileys WhatsApp Resilience — Birth Hub 360

## Objetivo
Garantir alta disponibilidade e minimizar risco de banimento de números na conexão com WhatsApp, mantendo credenciais de autenticação persistentes e seguras.

## Diretrizes de Operação

### 1. Persistência de Autenticação (`useMultiFileAuthState`)
- As chaves de sessão e tokens de criptografia devem ser sincronizados em armazenamento seguro (PostgreSQL ou diretório criptografado com permissões restritas).
- Trate o evento `connection.update`:
  - Se `connection === 'close'`, verifique o status code no `lastDisconnect.error`.
  - Códigos como `DisconnectReason.loggedOut` (401) exigem reset completo da sessão e exibição de novo QR Code.
  - Códigos transitórios (`connectionLost`, `timedOut`, `restartRequired`) devem acionar reconexão automática com delay mínimo de 3 segundos.

### 2. Políticas Anti-Banimento e Delays Humanizados
- **Intervalo Mínimo:** Mensagens não devem ser disparadas com 0ms de diferença. Adicione atrasos aleatórios entre 2 e 5 segundos entre disparos.
- **Status de Presença:** Antes de enviar mensagens de texto longas ou mídias, envie evento de presença (`sendPresenceUpdate('composing')`) por 1 a 2 segundos para simular digitação real.
- **Respeito a Opt-Out:** Se o destinatário responder comandos como "PARAR", "SAIR" ou denunciar incômodo, registre a revogação de consentimento imediatamente no CRM (LGPD).

### 3. Recebimento de Mídias e Webhooks
- Ao receber imagens, áudios e documentos, faça o download do buffer cifrado, descriptografe, envie para bucket de armazenamento (S3) e salve apenas a URL e o mime-type no banco. Nunca armazene buffers pesados em base64 diretamente na tabela de mensagens.

## Checklist de Saúde do WhatsApp
- [ ] O status da conexão (QR Code pendente / Conectado / Desconectado) é refletido em tempo real no frontend?
- [ ] Mensagens enviadas registram status de entrega (`PENDENTE`, `ENVIADO`, `ENTREGUE`, `LIDO`) via eventos de recibo (`messages.update`)?
- [ ] O número de telefone passa por normalização E.164 (ex: `5511999999999@s.whatsapp.net`) antes do disparo?
