import { EventEmitter } from 'node:events';
import { logger } from '../../lib/logger.js';
import type { AudioPacket, BargeInConfig, BargeInEvent } from './types.js';

export interface AudioStreamStats {
  inboundPackets: number;
  outboundPackets: number;
  inboundBytes: number;
  outboundBytes: number;
  bargeInCount: number;
  totalLeadSpeechDurationMs: number;
  totalAgentSpeechDurationMs: number;
}

const DEFAULT_BARGE_IN_CONFIG: BargeInConfig = {
  vadThreshold: 0.15,
  minSpeechDurationMs: 120,
  cooldownMs: 800,
  interruptTtsPlayback: true,
};

/**
 * AudioStreamBridge
 *
 * Manages low-latency bidirectional audio streaming between
 * SIP/3CX telephony and WebRTC / LiveKit sessions.
 * Implements real-time Voice Activity Detection (VAD) and Barge-In interruption.
 */
export class AudioStreamBridge extends EventEmitter {
  readonly sessionId: string;
  private config: BargeInConfig;
  private outboundQueue: AudioPacket[] = [];
  private isAgentSpeaking = false;
  private lastBargeInTime = 0;
  private consecutiveSpeechMs = 0;

  private stats: AudioStreamStats = {
    inboundPackets: 0,
    outboundPackets: 0,
    inboundBytes: 0,
    outboundBytes: 0,
    bargeInCount: 0,
    totalLeadSpeechDurationMs: 0,
    totalAgentSpeechDurationMs: 0,
  };

  private recordingChunks: { timestamp: number; direction: string; size: number }[] = [];

  constructor(sessionId: string, config: Partial<BargeInConfig> = {}) {
    super();
    this.sessionId = sessionId;
    this.config = { ...DEFAULT_BARGE_IN_CONFIG, ...config };
  }

  /**
   * Pushes an inbound audio packet from the lead's telephone (via SIP/3CX).
   * Runs VAD to detect speech and trigger instant barge-in if agent is speaking.
   */
  pushInboundPacket(packet: AudioPacket): void {
    this.stats.inboundPackets += 1;
    const packetSize =
      typeof packet.payload === 'string' ? packet.payload.length : packet.payload.byteLength;
    this.stats.inboundBytes += packetSize;

    // Track for recording summary
    this.recordingChunks.push({
      timestamp: packet.timestamp,
      direction: 'inbound_lead',
      size: packetSize,
    });

    const energy = packet.energyLevel ?? this.calculatePacketEnergy(packet.payload);

    if (energy >= this.config.vadThreshold) {
      this.consecutiveSpeechMs += packet.durationMs;
      this.stats.totalLeadSpeechDurationMs += packet.durationMs;

      // Check if lead has spoken enough to trigger barge-in while AI is speaking
      if (
        this.isAgentSpeaking &&
        this.consecutiveSpeechMs >= this.config.minSpeechDurationMs &&
        Date.now() - this.lastBargeInTime >= this.config.cooldownMs
      ) {
        this.triggerBargeIn(energy, packet.sequenceNumber);
      }
    } else {
      this.consecutiveSpeechMs = 0;
    }

    // Emit packet for STT and WebRTC consumer
    this.emit('inbound_audio', packet);
  }

  /**
   * Pushes an outbound audio packet from the AI Agent (TTS via WebRTC/LiveKit).
   */
  pushOutboundPacket(packet: AudioPacket): boolean {
    // If agent was interrupted and queue was purged, check status
    this.stats.outboundPackets += 1;
    const packetSize =
      typeof packet.payload === 'string' ? packet.payload.length : packet.payload.byteLength;
    this.stats.outboundBytes += packetSize;
    this.stats.totalAgentSpeechDurationMs += packet.durationMs;
    this.isAgentSpeaking = true;

    this.recordingChunks.push({
      timestamp: packet.timestamp,
      direction: 'outbound_agent',
      size: packetSize,
    });

    this.outboundQueue.push(packet);
    this.emit('outbound_audio', packet);
    return true;
  }

  /**
   * Instantly interrupts AI playback (Barge-In).
   */
  private triggerBargeIn(energy: number, sequenceNumber: number): void {
    this.lastBargeInTime = Date.now();
    this.isAgentSpeaking = false;
    this.stats.bargeInCount += 1;

    // Flush any pending outbound audio packets
    if (this.config.interruptTtsPlayback) {
      this.outboundQueue = [];
    }

    const event: BargeInEvent = {
      sessionId: this.sessionId,
      timestamp: this.lastBargeInTime,
      triggerEnergy: energy,
      interruptedPacketSeq: sequenceNumber,
      message: 'Lead interrompeu a fala do assistente (Barge-in acionado).',
    };

    logger.info(
      { sessionId: this.sessionId, energy, sequenceNumber },
      '[AudioStreamBridge] Barge-In acionado: cancelando reprodução de áudio da IA',
    );

    this.emit('barge_in', event);
  }

  /**
   * Notifies that the AI Agent has finished speaking its response turn.
   */
  markAgentTurnFinished(): void {
    this.isAgentSpeaking = false;
    this.consecutiveSpeechMs = 0;
    this.emit('agent_turn_end');
  }

  /**
   * Calculates Root Mean Square (RMS) energy of an audio buffer.
   */
  private calculatePacketEnergy(payload: Buffer | Uint8Array | string): number {
    if (typeof payload === 'string') {
      return payload.length > 0 ? 0.3 : 0.0;
    }
    if (!payload || payload.length === 0) return 0.0;

    let sumSquares = 0;
    const len = payload.length;
    for (let i = 0; i < len; i += 2) {
      // Treat as 16-bit PCM if byte length >= 2
      const sample = i + 1 < len ? (payload[i] | (payload[i + 1] << 8)) - 32768 : payload[i] - 128;
      const normalized = sample / 32768;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / (len / 2 || 1));
    return Math.min(1.0, Math.max(0.0, rms * 2.5));
  }

  getStats(): AudioStreamStats {
    return { ...this.stats };
  }

  getRecordingSummary() {
    return {
      totalChunks: this.recordingChunks.length,
      stats: this.getStats(),
    };
  }

  clear(): void {
    this.outboundQueue = [];
    this.recordingChunks = [];
    this.removeAllListeners();
  }
}
