import { logger } from '../../lib/logger.js';
import type {
  OutboundCallResult,
  VoiceAgentType,
} from '../integrations/birth-voice/birthVoice.service.js';
import { sipWebRtcBridgeService } from '../voice/sip-webrtc-bridge.service.js';
import type { VoiceCommandExecutionResult, VoiceCommandRequest } from '../voice/types.js';
import { flowiseRouterService } from './flowise-router.service.js';
import {
  type DetectionOptions,
  type ObjectionDetectionResult,
  objectionDetectionService,
  type StreamingTranscriptionChunk,
} from './objectionDetection.service.js';
import { webRTCChannelService } from './webrtc-channel.service.js';

/**
 * AiVoiceOrchestratorService
 *
 * Connects the real-time AI intelligence engine (WebRTC + Flowise)
 * with the underlying SIP/3CX telephony bridge and voice command executor.
 */
export class AiVoiceOrchestratorService {
  /**
   * Initializes a new AI voice session connected to SIP telephony and LiveKit.
   */
  async initializeCallSession(
    organizationId: string,
    leadId: string,
    targetNumber: string,
    agentType: VoiceAgentType,
    sipOptions?: {
      callId?: string;
      extension?: string;
      pbxUrl?: string;
    },
  ): Promise<OutboundCallResult> {
    const sessionId = `livekit-sess-${leadId}-${Date.now()}`;
    const callSid = sipOptions?.callId || `livekit-call-${leadId}`;

    logger.info(
      { organizationId, leadId, targetNumber, agentType, sessionId },
      'Initializing Real-time AI Voice session with SIP WebRTC Bridge...',
    );

    // 1. Establish WebRTC + SIP channel bridge
    await webRTCChannelService.connectSession(sessionId, targetNumber, {
      callId: callSid,
      extension: sipOptions?.extension,
      pbxUrl: sipOptions?.pbxUrl,
      organizationId,
      leadId,
    });

    // 2. Prepare context for LLM routing (Flowise)
    const initialContext = {
      leadId,
      organizationId,
      agentType,
      sessionId,
    };

    // Initial system prompt routing
    await flowiseRouterService.routePrompt(sessionId, 'SYSTEM_INIT', initialContext);

    return {
      sessionId,
      callSid,
      status: 'in-progress',
    };
  }

  /**
   * Executes a business action command emitted by the voice assistant during the call.
   */
  async executeCommand(
    sessionId: string,
    command: Omit<VoiceCommandRequest, 'sessionId' | 'organizationId' | 'leadId'>,
  ): Promise<VoiceCommandExecutionResult> {
    return sipWebRtcBridgeService.executeVoiceCommand(sessionId, command);
  }

  /**
   * Analyzes live streaming transcription for objections and recommends real-time rebuttals.
   */
  async detectStreamingObjections(
    chunk: StreamingTranscriptionChunk,
    options?: DetectionOptions,
  ): Promise<ObjectionDetectionResult | null> {
    return objectionDetectionService.processChunk(chunk, options);
  }

  /**
   * Ends the real-time AI Voice session and persists call activities.
   */
  async endCallSession(sessionId: string, reason = 'normal_completion'): Promise<void> {
    logger.info({ sessionId, reason }, 'Ending Real-time AI Voice session...');
    objectionDetectionService.clearSession(sessionId);
    await webRTCChannelService.disconnectSession(sessionId, reason);
  }
}

export const aiVoiceOrchestratorService = new AiVoiceOrchestratorService();
