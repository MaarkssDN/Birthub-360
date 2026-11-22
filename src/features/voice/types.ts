/**
 * Types and Contracts for SIP/3CX <-> LiveKit/WebRTC Voice Bridge
 * Governed by Agent 12 (Voz e Telefonia).
 */

export type BridgeSessionState =
  | 'idle'
  | 'handshaking'
  | 'connected'
  | 'streaming'
  | 'interrupted'
  | 'terminating'
  | 'completed'
  | 'failed';

export type AudioCodec = 'opus' | 'pcmu' | 'pcma' | 'g711' | 'pcm16';

export type AudioDirection = 'inbound_lead' | 'outbound_agent';

export interface SIPConnectionInfo {
  callId: string;
  extension: string;
  pbxUrl: string;
  destinationNumber: string;
  organizationId: string;
  leadId?: string;
  callerNumber?: string;
}

export interface WebRTCSessionInfo {
  roomName: string;
  token: string;
  participantId: string;
  serverUrl?: string;
}

export interface BridgeHandshakeRequest {
  sessionId: string;
  sipInfo: SIPConnectionInfo;
  webrtcInfo?: Partial<WebRTCSessionInfo>;
  audioCodec?: AudioCodec;
  sampleRate?: number;
  channels?: number;
}

export interface BridgeHandshakeResponse {
  success: boolean;
  sessionId: string;
  state: BridgeSessionState;
  sipCallId: string;
  webrtcRoomName: string;
  webrtcToken: string;
  participantId: string;
  audioCodec: AudioCodec;
  sampleRate: number;
  channels: number;
  connectedAt: Date;
  errorMessage?: string;
}

export interface AudioPacket {
  id: string;
  sessionId: string;
  direction: AudioDirection;
  sequenceNumber: number;
  timestamp: number;
  payload: Buffer | Uint8Array | string;
  durationMs: number;
  isSilent?: boolean;
  energyLevel?: number;
}

export interface BargeInConfig {
  /** Voice Activity Detection energy threshold (0.0 to 1.0) */
  vadThreshold: number;
  /** Minimum speech duration in ms to trigger barge-in */
  minSpeechDurationMs: number;
  /** Cooldown time after barge-in before accepting new triggers */
  cooldownMs: number;
  /** Whether to immediately cancel and purge TTS audio queue */
  interruptTtsPlayback: boolean;
}

export interface BargeInEvent {
  sessionId: string;
  timestamp: number;
  triggerEnergy: number;
  interruptedPacketSeq?: number;
  message: string;
}

export type VoiceCommandType =
  | 'SCHEDULE_MEETING'
  | 'QUALIFY_LEAD'
  | 'UPDATE_STATUS'
  | 'OPT_OUT'
  | 'SEND_PROPOSAL'
  | 'TRANSFER_CALL'
  | 'HANGUP';

export interface VoiceCommandRequest {
  id: string;
  sessionId: string;
  organizationId: string;
  leadId?: string;
  type: VoiceCommandType;
  parameters: Record<string, unknown>;
  timestamp: Date;
}

export interface VoiceCommandExecutionResult {
  commandId: string;
  type: VoiceCommandType;
  executed: boolean;
  verified: boolean;
  message: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface BridgeCallResult {
  sessionId: string;
  sipCallId: string;
  organizationId: string;
  leadId?: string | null;
  state: BridgeSessionState;
  outcome: string;
  durationSeconds: number;
  recordingUrl?: string | null;
  transcriptionSummary?: string | null;
  commandsExecuted: VoiceCommandExecutionResult[];
  bargeInCount: number;
  startedAt: Date;
  endedAt: Date;
}
