import { logger } from '../../lib/logger.js';
import { sipWebRtcBridgeService } from '../voice/sip-webrtc-bridge.service.js';
import type { AudioPacket, BridgeHandshakeResponse } from '../voice/types.js';

/**
 * WebRTCChannelService
 *
 * Manages real-time WebRTC audio media streams and connects them to the SIP bridge.
 */
export class WebRTCChannelService {
  /**
   * Initializes a WebRTC connection and handshake for a given session.
   */
  async connectSession(
    sessionId: string,
    targetNumber: string,
    sipOptions?: {
      callId?: string;
      extension?: string;
      pbxUrl?: string;
      organizationId?: string;
      leadId?: string;
    },
  ): Promise<BridgeHandshakeResponse> {
    logger.info({ sessionId, targetNumber }, 'Connecting WebRTC channel (LiveKit)...');

    const callId = sipOptions?.callId || `sip-call-${sessionId}`;
    const organizationId = sipOptions?.organizationId || 'default-org';

    const handshakeRes = await sipWebRtcBridgeService.handshake({
      sessionId,
      sipInfo: {
        callId,
        extension: sipOptions?.extension || '100',
        pbxUrl: sipOptions?.pbxUrl || 'https://pbx.internal.birthub.local',
        destinationNumber: targetNumber,
        organizationId,
        leadId: sipOptions?.leadId,
      },
    });

    return handshakeRes;
  }

  /**
   * Sends audio packet to the bridge session.
   */
  async pushAudio(sessionId: string, packet: AudioPacket): Promise<void> {
    if (packet.direction === 'inbound_lead') {
      await sipWebRtcBridgeService.handleInboundAudio(sessionId, packet);
    } else {
      await sipWebRtcBridgeService.handleOutboundAudio(sessionId, packet);
    }
  }

  /**
   * Terminates the WebRTC connection and persists call metrics.
   */
  async disconnectSession(sessionId: string, reason = 'client_disconnected'): Promise<void> {
    logger.info({ sessionId }, 'Disconnecting WebRTC channel (LiveKit)...');
    if (sipWebRtcBridgeService.getSession(sessionId)) {
      await sipWebRtcBridgeService.terminateSession(sessionId, reason);
    }
  }
}

export const webRTCChannelService = new WebRTCChannelService();
