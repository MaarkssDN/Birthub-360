export interface WebRtcRawStatsSample {
  sessionId: string;
  tenantId: string;
  packetsReceived: number;
  packetsLost: number;
  jitterSeconds: number;
  roundTripTimeSeconds?: number;
  timestampMs?: number;
}

export interface WebRtcQualitySnapshot {
  sessionId: string;
  tenantId: string;
  jitterMs: number;
  packetLossPct: number;
  rttMs: number;
  degraded: boolean;
  reasons: ('HIGH_JITTER' | 'HIGH_PACKET_LOSS' | 'HIGH_RTT')[];
  timestampMs: number;
}

export const WEBRTC_MAX_JITTER_MS = 30;
export const WEBRTC_MAX_PACKET_LOSS_PCT = 3;
export const WEBRTC_MAX_RTT_MS = 250;

export class WebRtcTelemetryCollector {
  private readonly snapshots = new Map<string, WebRtcQualitySnapshot>();
  private readonly listeners: ((snapshot: WebRtcQualitySnapshot) => void)[] = [];

  onSnapshot(listener: (snapshot: WebRtcQualitySnapshot) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  recordSample(sample: WebRtcRawStatsSample): WebRtcQualitySnapshot {
    if (!sample.sessionId?.trim() || !sample.tenantId?.trim()) {
      throw new Error('sessionId e tenantId são obrigatórios para telemetria WebRTC.');
    }

    const received = Math.max(0, sample.packetsReceived);
    const lost = Math.max(0, sample.packetsLost);
    const totalPackets = received + lost;
    const packetLossPct =
      totalPackets > 0 ? Number(((lost / totalPackets) * 100).toFixed(2)) : 0;
    const jitterMs = Number((Math.max(0, sample.jitterSeconds) * 1000).toFixed(2));
    const rttMs = Number((Math.max(0, sample.roundTripTimeSeconds ?? 0) * 1000).toFixed(2));

    const reasons: WebRtcQualitySnapshot['reasons'] = [];
    if (jitterMs > WEBRTC_MAX_JITTER_MS) reasons.push('HIGH_JITTER');
    if (packetLossPct > WEBRTC_MAX_PACKET_LOSS_PCT) reasons.push('HIGH_PACKET_LOSS');
    if (rttMs > WEBRTC_MAX_RTT_MS) reasons.push('HIGH_RTT');

    const snapshot: WebRtcQualitySnapshot = {
      sessionId: sample.sessionId,
      tenantId: sample.tenantId,
      jitterMs,
      packetLossPct,
      rttMs,
      degraded: reasons.length > 0,
      reasons,
      timestampMs: sample.timestampMs ?? Date.now(),
    };

    this.snapshots.set(sample.sessionId, snapshot);
    for (const listener of this.listeners) {
      listener(snapshot);
    }
    return snapshot;
  }

  getActiveSessionSnapshot(sessionId: string): WebRtcQualitySnapshot | undefined {
    return this.snapshots.get(sessionId);
  }
}
