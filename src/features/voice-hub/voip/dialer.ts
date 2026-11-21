export type IceConnectionState =
  | 'new'
  | 'checking'
  | 'connected'
  | 'completed'
  | 'disconnected'
  | 'failed'
  | 'closed';

export interface SipPeerSessionPort {
  callId: string;
  restartIce(): void;
  sendReInviteWithIceRestart(callId: string): Promise<{ sdpAccepted: boolean }>;
}

export interface IceRestartResult {
  callId: string;
  restarted: boolean;
  attempt: number;
  networkType: string;
}

export class SipVoipDialer {
  private restartAttemptsByCall = new Map<string, number>();
  private readonly maxIceRestartAttempts: number;

  constructor(options?: { maxIceRestartAttempts?: number }) {
    this.maxIceRestartAttempts = options?.maxIceRestartAttempts ?? 3;
  }

  async handleNetworkOrIceTransition(params: {
    session: SipPeerSessionPort;
    iceState: IceConnectionState;
    networkType?: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
    forceNetworkSwitch?: boolean;
  }): Promise<IceRestartResult> {
    const { session, iceState, networkType = 'unknown', forceNetworkSwitch = false } = params;
    const shouldRestart =
      forceNetworkSwitch || iceState === 'disconnected' || iceState === 'failed';

    if (!shouldRestart) {
      if (iceState === 'connected' || iceState === 'completed') {
        this.restartAttemptsByCall.set(session.callId, 0);
      }
      return {
        callId: session.callId,
        restarted: false,
        attempt: this.restartAttemptsByCall.get(session.callId) ?? 0,
        networkType,
      };
    }

    const currentAttempt = (this.restartAttemptsByCall.get(session.callId) ?? 0) + 1;
    if (currentAttempt > this.maxIceRestartAttempts) {
      throw new Error(
        `Limite máximo de tentativas de ICE restart (${this.maxIceRestartAttempts}) excedido para a chamada "${session.callId}".`,
      );
    }
    this.restartAttemptsByCall.set(session.callId, currentAttempt);

    session.restartIce();
    const { sdpAccepted } = await session.sendReInviteWithIceRestart(session.callId);

    return {
      callId: session.callId,
      restarted: sdpAccepted,
      attempt: currentAttempt,
      networkType,
    };
  }
}
