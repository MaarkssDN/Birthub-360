import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SipWebRtcBridgeService } from '../../../../src/features/voice/sip-webrtc-bridge.service.js';
import { prisma } from '../../../../src/lib/prisma.js';
import type { BridgeHandshakeRequest, AudioPacket } from '../../../../src/features/voice/types.js';

vi.mock('../../../../src/lib/prisma.js', () => ({
  prisma: {
    activity: {
      create: vi.fn(),
    },
    lead: {
      updateMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('../../../../src/lib/audit/audit.service.js', () => ({
  AuditService: {
    log: vi.fn().mockResolvedValue({ id: 'audit-1' }),
  },
}));

describe('SipWebRtcBridgeService', () => {
  let bridgeService: SipWebRtcBridgeService;
  const sessionId = 'bridge-session-1';
  const organizationId = 'org-abc';
  const leadId = 'lead-xyz';

  beforeEach(() => {
    vi.clearAllMocks();
    bridgeService = new SipWebRtcBridgeService();
  });

  it('should establish handshake successfully', async () => {
    const request: BridgeHandshakeRequest = {
      sessionId,
      sipInfo: {
        callId: 'sip-call-999',
        extension: '101',
        pbxUrl: 'https://pbx.birthub.local',
        destinationNumber: '+5511988887777',
        organizationId,
        leadId,
      },
      audioCodec: 'opus',
    };

    const response = await bridgeService.handshake(request);

    expect(response.success).toBe(true);
    expect(response.state).toBe('connected');
    expect(response.sipCallId).toBe('sip-call-999');
    expect(response.audioCodec).toBe('opus');
    expect(bridgeService.getActiveSessionsCount()).toBe(1);
  });

  it('should route inbound and outbound audio packets', async () => {
    await bridgeService.handshake({
      sessionId,
      sipInfo: {
        callId: 'sip-call-999',
        extension: '101',
        pbxUrl: 'https://pbx.birthub.local',
        destinationNumber: '+5511988887777',
        organizationId,
        leadId,
      },
    });

    const inboundPacket: AudioPacket = {
      id: 'in-1',
      sessionId,
      direction: 'inbound_lead',
      sequenceNumber: 1,
      timestamp: Date.now(),
      payload: Buffer.from([1, 2, 3]),
      durationMs: 20,
    };

    const outboundPacket: AudioPacket = {
      id: 'out-1',
      sessionId,
      direction: 'outbound_agent',
      sequenceNumber: 1,
      timestamp: Date.now(),
      payload: Buffer.from([4, 5, 6]),
      durationMs: 20,
    };

    await bridgeService.handleInboundAudio(sessionId, inboundPacket);
    const pushedOut = await bridgeService.handleOutboundAudio(sessionId, outboundPacket);

    expect(pushedOut).toBe(true);
    const session = bridgeService.getSession(sessionId);
    expect(session?.state).toBe('streaming');
  });

  it('should terminate session and persist Activity and audit record', async () => {
    vi.mocked(prisma.activity.create).mockResolvedValue({ id: 'act-call-end' } as any);

    await bridgeService.handshake({
      sessionId,
      sipInfo: {
        callId: 'sip-call-999',
        extension: '101',
        pbxUrl: 'https://pbx.birthub.local',
        destinationNumber: '+5511988887777',
        organizationId,
        leadId,
      },
    });

    bridgeService.appendTranscription(sessionId, 'agent', 'Olá, sou o assistente.');
    bridgeService.appendTranscription(sessionId, 'lead', 'Olá, tudo bem?');

    const result = await bridgeService.terminateSession(sessionId, 'completed', 'completed');

    expect(result.state).toBe('completed');
    expect(result.outcome).toBe('completed');
    expect(result.recordingUrl).toContain(sessionId);
    expect(bridgeService.getActiveSessionsCount()).toBe(0);
    expect(prisma.activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId,
          leadId,
          type: 'Ligacao',
          status: 'Concluida',
        }),
      }),
    );
  });
});
