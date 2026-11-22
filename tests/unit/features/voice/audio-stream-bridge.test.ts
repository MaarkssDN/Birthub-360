import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioStreamBridge } from '../../../../src/features/voice/audio-stream-bridge.js';
import type { AudioPacket } from '../../../../src/features/voice/types.js';

describe('AudioStreamBridge', () => {
  let bridge: AudioStreamBridge;
  const sessionId = 'test-session-123';

  beforeEach(() => {
    bridge = new AudioStreamBridge(sessionId, {
      vadThreshold: 0.1,
      minSpeechDurationMs: 100,
      cooldownMs: 500,
      interruptTtsPlayback: true,
    });
  });

  it('should push inbound audio packets and compute stats', () => {
    const inboundListener = vi.fn();
    bridge.on('inbound_audio', inboundListener);

    const packet: AudioPacket = {
      id: 'pkt-1',
      sessionId,
      direction: 'inbound_lead',
      sequenceNumber: 1,
      timestamp: Date.now(),
      payload: Buffer.from([0, 10, 20, 30]),
      durationMs: 20,
      energyLevel: 0.05, // Below VAD
    };

    bridge.pushInboundPacket(packet);

    expect(inboundListener).toHaveBeenCalledWith(packet);
    const stats = bridge.getStats();
    expect(stats.inboundPackets).toBe(1);
    expect(stats.inboundBytes).toBe(4);
    expect(stats.bargeInCount).toBe(0);
  });

  it('should trigger barge-in when lead speaks while agent is speaking', () => {
    const bargeInListener = vi.fn();
    bridge.on('barge_in', bargeInListener);

    // Agent starts speaking (outbound packet)
    const outboundPacket: AudioPacket = {
      id: 'out-1',
      sessionId,
      direction: 'outbound_agent',
      sequenceNumber: 1,
      timestamp: Date.now(),
      payload: Buffer.from([100, 200, 100, 200]),
      durationMs: 50,
    };
    bridge.pushOutboundPacket(outboundPacket);

    // Lead speaks loudly above VAD threshold
    const leadSpeechPacket: AudioPacket = {
      id: 'lead-1',
      sessionId,
      direction: 'inbound_lead',
      sequenceNumber: 2,
      timestamp: Date.now(),
      payload: Buffer.from([255, 255, 255, 255]),
      durationMs: 150, // Exceeds minSpeechDurationMs (100)
      energyLevel: 0.8,
    };
    bridge.pushInboundPacket(leadSpeechPacket);

    expect(bargeInListener).toHaveBeenCalledTimes(1);
    expect(bargeInListener).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId,
        triggerEnergy: 0.8,
        interruptedPacketSeq: 2,
      }),
    );

    const stats = bridge.getStats();
    expect(stats.bargeInCount).toBe(1);
  });

  it('should not trigger barge-in if agent is not speaking', () => {
    const bargeInListener = vi.fn();
    bridge.on('barge_in', bargeInListener);

    const leadSpeechPacket: AudioPacket = {
      id: 'lead-1',
      sessionId,
      direction: 'inbound_lead',
      sequenceNumber: 1,
      timestamp: Date.now(),
      payload: Buffer.from([255, 255, 255, 255]),
      durationMs: 150,
      energyLevel: 0.8,
    };
    bridge.pushInboundPacket(leadSpeechPacket);

    expect(bargeInListener).not.toHaveBeenCalled();
    expect(bridge.getStats().bargeInCount).toBe(0);
  });

  it('should calculate packet energy correctly for PCM buffers', () => {
    const buffer = Buffer.alloc(100);
    for (let i = 0; i < 100; i++) {
      buffer[i] = i % 2 === 0 ? 0x7f : 0x00;
    }

    const packet: AudioPacket = {
      id: 'pcm-1',
      sessionId,
      direction: 'inbound_lead',
      sequenceNumber: 1,
      timestamp: Date.now(),
      payload: buffer,
      durationMs: 20,
    };

    bridge.pushInboundPacket(packet);
    expect(bridge.getStats().inboundPackets).toBe(1);
  });
});
