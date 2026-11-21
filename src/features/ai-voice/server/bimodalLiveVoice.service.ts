import { logger } from '../../../lib/logger.js';
import { domainEventMesh } from '../../../lib/queue/domainEventMesh.service.js';
import type {
  BimodalLiveSession,
  BimodalSessionConfig,
  IBimodalLiveVoicePort,
  LiveLatencyMetrics,
  LiveVoiceSessionState,
} from '../../../shared/contracts/bimodalLiveVoice.contract.js';

export class BimodalLiveVoiceService implements IBimodalLiveVoicePort {
  private sessions = new Map<string, BimodalLiveSession>(); // key: `${orgId}:${sessionId}`

  /**
   * Inicia uma nova sessão de voz em tempo real bimodal (Live).
   */
  async createSession(config: BimodalSessionConfig): Promise<BimodalLiveSession> {
    if (!config.organizationId || config.organizationId.trim() === '') {
      throw new Error('Tenancy violation: organizationId é obrigatório para iniciar sessão Live');
    }

    const key = `${config.organizationId}:${config.sessionId}`;
    const now = new Date().toISOString();

    // Reconciliação forense (2026-11): não existe transporte Live real — estes
    // valores são placeholders ilustrativos, NÃO medições de áudio. isEstimate
    // sinaliza isso a qualquer consumidor.
    const initialMetrics: LiveLatencyMetrics = {
      timeToFirstAudioMs: 240,
      latencyP50Ms: 380,
      latencyP95Ms: 680,
      latencyP99Ms: 890,
      bargeInResponseMs: 120,
      reconnectCount: 0,
      packetsLost: 0,
      isEstimate: true,
    };

    const session: BimodalLiveSession = {
      sessionId: config.sessionId,
      organizationId: config.organizationId,
      sellerId: config.sellerId,
      state: 'CONNECTING',
      transport: 'webrtc',
      turns: [],
      metrics: initialMetrics,
      isFallback: false,
      // Sessão inteiramente simulada: sendAudioStream não transcreve nem
      // sintetiza áudio real. Ver handoff forense 00-para-12 (EXP-01).
      simulated: true,
      createdAt: now,
      updatedAt: now,
    };

    // Transição para LISTENING após handshake
    session.state = 'LISTENING';
    this.sessions.set(key, session);

    await domainEventMesh.publish(
      {
        eventType: 'LIVE_VOICE_SESSION_STARTED',
        eventVersion: '1.0.0',
        organizationId: config.organizationId,
        correlationId: `live-sess-${config.sessionId}`,
        producer: 'bimodal-live-voice-service',
        aggregateId: config.sessionId,
        payload: {
          sessionId: config.sessionId,
          sellerId: config.sellerId,
          contextMode: config.contextMode,
          transport: session.transport,
          sampleRate: config.sampleRate ?? 24000,
          enableBargeIn: config.enableBargeIn ?? true,
          // Sessão simulada localmente — sem transporte Live real.
          simulated: true,
        },
      },
      // Chave estável por sessão (handoff 16→00, onda-3): retry de createSession
      // com o mesmo sessionId deduplica na outbox.
      { idempotencyKey: `live-voice-session:${config.sessionId}` },
    );

    logger.info(
      `[BimodalLiveVoice] Sessão Live ${config.sessionId} iniciada no modo ${config.contextMode} para tenant ${config.organizationId}.`,
    );

    return session;
  }

  /**
   * Envia stream contínuo de áudio e detecta turnos de fala.
   */
  async sendAudioStream(params: {
    sessionId: string;
    organizationId: string;
    audioChunkBase64: string;
    isFinalChunk?: boolean;
  }): Promise<{ accepted: boolean; state: LiveVoiceSessionState }> {
    const key = `${params.organizationId}:${params.sessionId}`;
    const session = this.sessions.get(key);

    if (!session) {
      throw new Error(
        `Sessão Live ${params.sessionId} não encontrada para a organização ${params.organizationId}.`,
      );
    }

    if (session.state === 'DISCONNECTED' || session.state === 'ERROR') {
      return { accepted: false, state: session.state };
    }

    session.state = 'PROCESSING';
    session.updatedAt = new Date().toISOString();

    if (params.isFinalChunk) {
      // Registrar turno do usuário e simular síntese imediata
      session.turns.push({
        speaker: 'user',
        text: 'Áudio do vendedor transmitido via canal streaming.',
        audioDurationMs: 2500,
        interrupted: false,
        timestamp: new Date().toISOString(),
        // Turno fabricado: o áudio real não é transcrito (sem STT).
        simulated: true,
      });

      // Assistente responde (resposta fixa de simulação, sem LLM)
      session.state = 'SPEAKING';
      session.turns.push({
        speaker: 'assistant',
        text: 'Compreendo perfeitamente o seu ponto. Vamos analisar a viabilidade técnica.',
        audioDurationMs: 3200,
        interrupted: false,
        timestamp: new Date().toISOString(),
        simulated: true,
      });
    } else {
      session.state = 'LISTENING';
    }

    return { accepted: true, state: session.state };
  }

  /**
   * Aciona interrupção natural da fala (barge-in): interrompe síntese imediatamente e cancela buffers de áudio.
   */
  async triggerBargeIn(params: {
    sessionId: string;
    organizationId: string;
    interruptionReason?: string;
  }): Promise<{ interrupted: boolean; latencyMs: number }> {
    const key = `${params.organizationId}:${params.sessionId}`;
    const session = this.sessions.get(key);

    if (!session) {
      throw new Error(
        `Sessão Live ${params.sessionId} não encontrada para a organização ${params.organizationId}.`,
      );
    }

    const start = Date.now();
    session.state = 'INTERRUPTED';
    session.updatedAt = new Date().toISOString();

    // Marcar último turno do assistente como interrompido
    const lastTurn = session.turns[session.turns.length - 1];
    if (lastTurn && lastTurn.speaker === 'assistant') {
      lastTurn.interrupted = true;
    }

    // Medição real do tempo local decorrido — sem offset artificial.
    const latencyMs = Math.max(0, Date.now() - start);
    session.metrics.bargeInResponseMs = latencyMs;

    // Retorna imediatamente para escuta ativa
    session.state = 'LISTENING';

    // Identidade estável do fato: barge-in é um evento por turno interrompido.
    // `turns.length` não muda entre retries do mesmo triggerBargeIn (o método
    // só marca interrupted, não adiciona turnos), então retries colidem na
    // UNIQUE parcial; um novo barge-in após novo turno gera chave distinta.
    const bargeInKey = `live-voice-barge-in:${params.sessionId}:${session.turns.length}`;

    await domainEventMesh.publish(
      {
        eventType: 'LIVE_VOICE_BARGE_IN_TRIGGERED',
        eventVersion: '1.0.0',
        organizationId: params.organizationId,
        correlationId: `bargein-${params.sessionId}`,
        producer: 'bimodal-live-voice-service',
        aggregateId: params.sessionId,
        payload: {
          sessionId: params.sessionId,
          interruptionReason:
            params.interruptionReason ?? 'Voz do usuário detectada durante resposta da IA',
          latencyMs,
          // Sessão simulada — barge-in não interrompe áudio real.
          simulated: true,
        },
      },
      { idempotencyKey: bargeInKey },
    );

    logger.info(
      `[BimodalLiveVoice] Barge-in executado na sessão ${params.sessionId} em ${latencyMs}ms. Geração cancelada e canal liberado para fala.`,
    );

    return { interrupted: true, latencyMs };
  }

  /**
   * Fallback gracioso para pipeline assíncrono tradicional (STT/TTS padrão) sem perda de contexto ou histórico.
   */
  async fallbackToAsync(params: {
    sessionId: string;
    organizationId: string;
    reason: string;
  }): Promise<{ success: boolean; fallbackMode: 'traditional_stt_tts' }> {
    const key = `${params.organizationId}:${params.sessionId}`;
    const session = this.sessions.get(key);

    if (!session) {
      throw new Error(
        `Sessão Live ${params.sessionId} não encontrada para a organização ${params.organizationId}.`,
      );
    }

    session.isFallback = true;
    session.state = 'FALLBACK';
    session.updatedAt = new Date().toISOString();

    await domainEventMesh.publish(
      {
        eventType: 'LIVE_VOICE_FALLBACK_ENGAGED',
        eventVersion: '1.0.0',
        organizationId: params.organizationId,
        correlationId: `fallback-${params.sessionId}`,
        producer: 'bimodal-live-voice-service',
        aggregateId: params.sessionId,
        payload: {
          sessionId: params.sessionId,
          reason: params.reason,
          turnsPreservedCount: session.turns.length,
          // Sessão simulada localmente.
          simulated: true,
        },
      },
      // Fallback é um fato único por sessão (handoff 16→00, onda-3).
      { idempotencyKey: `live-voice-fallback:${params.sessionId}` },
    );

    logger.warn(
      `[BimodalLiveVoice] Fallback ativado para sessão ${params.sessionId}: ${params.reason}. Histórico preservado (${session.turns.length} turnos).`,
    );

    return {
      success: true,
      fallbackMode: 'traditional_stt_tts',
    };
  }

  /**
   * Encerra a sessão Live e consolida métricas operacionais e financeiras.
   */
  async closeSession(params: {
    sessionId: string;
    organizationId: string;
  }): Promise<BimodalLiveSession> {
    const key = `${params.organizationId}:${params.sessionId}`;
    const session = this.sessions.get(key);

    if (!session) {
      throw new Error(
        `Sessão Live ${params.sessionId} não encontrada para a organização ${params.organizationId}.`,
      );
    }

    session.state = 'DISCONNECTED';
    session.updatedAt = new Date().toISOString();

    logger.info(
      `[BimodalLiveVoice] Sessão ${params.sessionId} encerrada com sucesso. Total de turnos: ${session.turns.length}.`,
    );

    return session;
  }

  getSession(organizationId: string, sessionId: string): BimodalLiveSession | undefined {
    return this.sessions.get(`${organizationId}:${sessionId}`);
  }

  clear(): void {
    this.sessions.clear();
  }
}

export const bimodalLiveVoiceService = new BimodalLiveVoiceService();
