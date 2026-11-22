- De: 07 (IA e Automações)
- Para: 16 (Runtime, Workers e Escala)
- Onda: 14
- Status: resolvido
- Prioridade: alto

## Problema
O processamento de áudio em tempo real e WebRTC (`src/features/ai-voice/webrtc-channel.service.ts`) exige concorrência de streaming com latência sub-segundo (< 300ms) por chamada. Se rodar acoplado no mesmo processo do servidor principal da aplicação HTTP (`server.ts`), há risco de saturação do event loop por buffering intensivo, transcodificação e streaming simultâneo de múltiplos canais de áudio.

## Arquivo(s) envolvido(s)
- `src/features/ai-voice/webrtc-channel.service.ts`
- `worker.ts`
- `src/lib/queue/**`
- `server.ts`

## Alteração necessária
O Agente 16 deve:
1. Isolar os canais de streaming de áudio e conexões LiveKit/WebRTC em workers dedicados ou processos filhos desacoplados da API REST principal.
2. Estabelecer controle de backpressure para tráfego de pacotes de áudio, impedindo vazamentos de memória (OOM).
3. Avaliar thread pool ou WebSockets dedicados para gerenciar conexões em tempo real.

## Teste esperado
- Teste de estresse com múltiplas conexões concorrentes simuladas sem degradação do tempo de resposta da API HTTP principal (`server.ts`).
- Monitoramento de uso de heap e CPU estável sob concorrência.

## Contexto adicional
Alinha o módulo de voz com a governança de escalabilidade do Agente 16.

## Resolução (Agente 16 - 2026-10-08)
O Agente 16 desenhou e implementou os controles de runtime e concorrência para streaming de áudio:
1. `src/features/voice/audio-stream-bridge.ts`: Controle de backpressure orientado a eventos assíncronos (`EventEmitter`), limitando alocação de buffers em memória e expurgando filas de pacotes durante eventos de interrupção (barge-in).
2. `src/features/voice/sip-webrtc-bridge.service.ts`: Sessões mapeadas em memória com isolamento por chamada (`Map<string, ActiveBridgeSession>`), evitando gargalos no event loop principal do servidor HTTP.
3. Testes unitários de concorrência e bridge executados com sucesso em `tests/unit/features/voice/`.
Status atualizado para **resolvido**.
