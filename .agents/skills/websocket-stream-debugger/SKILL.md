---
name: websocket-stream-debugger
description: Diagnóstico e estabilidade de conexões WebSockets, Socket.io e streaming de áudio/WebRTC/SIP para o Agente 12 (Voz e Telefonia). Garante reconexão automática com backoff, heartbeat (ping/pong) e tratamento de backpressure.
---

# WebSocket & Stream Debugger — Birth Hub 360

## Objetivo
Manter estabilidade nas comunicações bidirecionais em tempo real (painel de atendimento ao vivo, status de ramais telefônicos, transcrição de áudio em streaming de IA e notificações em tempo real).

## Melhores Práticas de Arquitetura

### 1. Heartbeat e Detecção de Queda de Rede
- Nunca confie apenas no evento `close` do socket para detectar desconexões silenciosas (ex: cabo desconectado, rede móvel instável).
- Implemente ping/pong periódico no cliente e no servidor a cada 25 segundos. Se 2 pings consecutivos não forem respondidos, a conexão é descartada e reiniciada.

### 2. Reconexão Exponencial com Jitter
- Quando a conexão cair, o cliente nunca deve tentar reconectar em loop de 0ms (evita avalanche no servidor).
- Use intervalo com backoff exponencial + ruído aleatório (*jitter*):
  `delay = min(maxDelay, baseDelay * (2 ** retryCount)) + randomJitter`

### 3. Fila Offline e Reconciliação de Estado
- Eventos disparados enquanto offline devem ser enfileirados ou o cliente deve solicitar um *sync snapshot* completo logo após o handshake bem-sucedido.
- Utilize números de sequência ou IDs crescentes de mensagens para evitar mensagens duplicadas ou perdidas.

### 4. Gestão de Salas, Tenancy e Autenticação (`better-auth`)
- A sessão do `better-auth` (`auth.api.getSession`) ou credencial assinada do canal deve ser validada logo no handshake da conexão.
- Desconecte sockets quando o usuário fizer logout ou quando a sessão expirar.
- Garanta que o socket pertença exclusivamente às salas de sua organização (`room: org_${organizationId}`), impedindo vazamento de eventos cross-tenant (**B-10**).

## Checklist de Verificação
- [ ] O cliente trata adequadamente o fechamento inesperado sem travar a interface React?
- [ ] Há indicador visual de estado da conexão (Conectado / Reconectando / Offline) na interface?
- [ ] Ações de comando de voz confirmam persistência real antes de sinalizar sucesso na UI (**B-07**)?
