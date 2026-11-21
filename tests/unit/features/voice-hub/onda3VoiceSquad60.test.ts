import { describe, expect, it, vi } from 'vitest';
import { WebRtcTelemetryCollector } from '../../../../src/features/voice-hub/index.js';
import { SipVoipDialer } from '../../../../src/features/voice-hub/voip/dialer.js';
import {
  diarizeStereoAudioChannels,
  splitInterleavedStereoPcm,
} from '../../../../src/features/voice-hub/transcription/whisper.worker.js';
import { sanitizeWhatsAppTemplatePayload } from '../../../../src/features/notifications/templates/sanitizer.js';
import {
  DEFAULT_HEARTBEAT_INTERVAL_MS,
  RealtimeWebSocketHeartbeatManager,
  type HeartbeatClientSocket,
} from '../../../../src/features/notifications/realtime/websocket.server.js';

describe('[Squad 60 · Voz & Omnichannel] Onda 3 — Aurora (60), Nando (61), Lira (63), Teca (67), Paco (68)', () => {
  describe('[60 · Aurora] Telemetria WebRTC de jitter e perda de pacotes', () => {
    it('calcula jitterMs, packetLossPct e sinaliza degradação de chamada em tempo real', () => {
      const collector = new WebRtcTelemetryCollector();
      const events: unknown[] = [];
      collector.onSnapshot((snap) => events.push(snap));

      const healthy = collector.recordSample({
        sessionId: 'call-1',
        tenantId: 'tenant-1',
        packetsReceived: 990,
        packetsLost: 5, // 0.5%
        jitterSeconds: 0.012, // 12ms
        roundTripTimeSeconds: 0.08, // 80ms
      });
      expect(healthy.degraded).toBe(false);
      expect(healthy.jitterMs).toBe(12);

      const degraded = collector.recordSample({
        sessionId: 'call-1',
        tenantId: 'tenant-1',
        packetsReceived: 900,
        packetsLost: 100, // 10%
        jitterSeconds: 0.055, // 55ms
        roundTripTimeSeconds: 0.32, // 320ms
      });
      expect(degraded.degraded).toBe(true);
      expect(degraded.reasons).toEqual(['HIGH_JITTER', 'HIGH_PACKET_LOSS', 'HIGH_RTT']);
      expect(events).toHaveLength(2);
    });
  });

  describe('[61 · Nando] Sinalização SIP com ICE restart automático na alternância de redes', () => {
    it('executa restartIce e re-INVITE SIP quando o estado ICE cai para disconnected ou muda de Wi-Fi para 4G', async () => {
      const dialer = new SipVoipDialer({ maxIceRestartAttempts: 2 });
      const restartIce = vi.fn();
      const sendReInviteWithIceRestart = vi.fn().mockResolvedValue({ sdpAccepted: true });

      const session = {
        callId: 'sip-call-99',
        restartIce,
        sendReInviteWithIceRestart,
      };

      const res = await dialer.handleNetworkOrIceTransition({
        session,
        iceState: 'disconnected',
        networkType: 'cellular',
      });

      expect(res.restarted).toBe(true);
      expect(res.attempt).toBe(1);
      expect(restartIce).toHaveBeenCalledTimes(1);
      expect(sendReInviteWithIceRestart).toHaveBeenCalledWith('sip-call-99');
    });
  });

  describe('[63 · Lira] Pipeline Whisper com separação estéreo de canais', () => {
    it('separa canais L/R e diariza falas de AGENT (canal 0) e CUSTOMER (canal 1) sem sobreposição', async () => {
      const interleaved = new Float32Array([0.1, -0.1, 0.2, -0.2, 0.3, -0.3]);
      const { agentChannel, customerChannel } = splitInterleavedStereoPcm(interleaved);
      expect(Array.from(agentChannel)).toEqual([
        expect.closeTo(0.1, 4),
        expect.closeTo(0.2, 4),
        expect.closeTo(0.3, 4),
      ]);
      expect(Array.from(customerChannel)).toEqual([
        expect.closeTo(-0.1, 4),
        expect.closeTo(-0.2, 4),
        expect.closeTo(-0.3, 4),
      ]);

      const utterances = await diarizeStereoAudioChannels(
        {
          callId: 'call-stereo-1',
          tenantId: 'tenant-1',
          sampleRate: 16000,
          agentChannelSamples: agentChannel,
          customerChannelSamples: customerChannel,
        },
        {
          async transcribeMonoChannel({ channelIndex }) {
            if (channelIndex === 0) {
              return [{ startSec: 0.5, endSec: 2.0, text: 'Olá, aqui é da clínica.' }];
            }
            return [{ startSec: 2.2, endSec: 4.1, text: 'Bom dia, gostaria de agendar.' }];
          },
        },
      );

      expect(utterances).toEqual([
        {
          speaker: 'AGENT',
          channelIndex: 0,
          startSec: 0.5,
          endSec: 2.0,
          text: 'Olá, aqui é da clínica.',
          confidence: 0.95,
        },
        {
          speaker: 'CUSTOMER',
          channelIndex: 1,
          startSec: 2.2,
          endSec: 4.1,
          text: 'Bom dia, gostaria de agendar.',
          confidence: 0.95,
        },
      ]);
    });
  });

  describe('[67 · Teca] Sanitização de templates de WhatsApp contra vazamento de PII', () => {
    it('redige CPF, tokens e prontuários infiltrados em variáveis livres e bloqueia variáveis fora da whitelist', () => {
      const sanitized = sanitizeWhatsAppTemplatePayload({
        templateBody: 'Olá {{firstName}}, confirmamos seu atendimento. Obs: {{notes}}',
        allowedVariables: ['firstName', 'notes'],
        variables: {
          firstName: 'Mariana',
          notes: 'Paciente CPF 123.456.789-01 e prontuario: 998812, <script>alert(1)</script>',
        },
      });

      expect(sanitized.renderedText).toBe(
        'Olá Mariana, confirmamos seu atendimento. Obs: Paciente CPF [CPF_REDACTED] e [DADO_CLINICO_REDACTED], alert(1)',
      );
      expect(sanitized.redactedVariables).toEqual(['notes']);

      expect(() =>
        sanitizeWhatsAppTemplatePayload({
          templateBody: 'Olá {{firstName}}',
          allowedVariables: ['firstName'],
          variables: {
            firstName: 'João',
            internalMedicalHistory: 'Sigiloso',
          },
        }),
      ).toThrow(/Variáveis não autorizadas/);
    });
  });

  describe('[68 · Paco] Heartbeat periódico (ping/pong a cada 30s) no servidor WebSocket', () => {
    it('usa intervalo padrão de 30s, envia ping para clientes vivos e encerra conexões zumbis sem pong', () => {
      expect(DEFAULT_HEARTBEAT_INTERVAL_MS).toBe(30_000);
      const manager = new RealtimeWebSocketHeartbeatManager();

      const aliveClient: HeartbeatClientSocket = {
        id: 'ws-alive',
        isAlive: true,
        ping: vi.fn(),
        terminate: vi.fn(),
      };
      const zombieClient: HeartbeatClientSocket = {
        id: 'ws-zombie',
        isAlive: true,
        ping: vi.fn(),
        terminate: vi.fn(),
      };

      manager.registerClient(aliveClient);
      manager.registerClient(zombieClient);

      // 1º sweep: ambos recebem ping e ficam aguardando pong (isAlive=false)
      const sweep1 = manager.runHeartbeatSweep();
      expect(sweep1.pingedCount).toBe(2);
      expect(sweep1.terminatedClientIds).toEqual([]);

      // Apenas aliveClient responde com pong
      manager.recordPong('ws-alive');

      // 2º sweep: zombieClient é encerrado (terminate) e removido; aliveClient recebe novo ping
      const sweep2 = manager.runHeartbeatSweep();
      expect(sweep2.terminatedClientIds).toEqual(['ws-zombie']);
      expect(zombieClient.terminate).toHaveBeenCalledTimes(1);
      expect(manager.getActiveClientCount()).toBe(1);
    });
  });
});
