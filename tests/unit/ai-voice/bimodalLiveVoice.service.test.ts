import { beforeEach, describe, expect, it, vi } from 'vitest';
import { domainEventMesh } from '../../../src/lib/queue/domainEventMesh.service.js';
import { bimodalLiveVoiceService } from '../../../src/features/ai-voice/server/bimodalLiveVoice.service.js';

vi.mock('../../../src/lib/queue/domainEventMesh.service.js', () => ({
  domainEventMesh: { publish: vi.fn(async () => undefined) },
}));

describe('Eixo 5: Bimodal Live Voice Service (Agente 12 & 07)', () => {
  const orgA = 'org-birthub-tenant-alpha';
  const orgB = 'org-birthub-tenant-beta';
  const publishMock = vi.mocked(domainEventMesh.publish);

  beforeEach(() => {
    bimodalLiveVoiceService.clear();
    publishMock.mockClear();
  });

  it('deve iniciar sessão Live com WebRTC e estado LISTENING', async () => {
    const session = await bimodalLiveVoiceService.createSession({
      organizationId: orgA,
      sessionId: 'sess-live-01',
      sellerId: 'seller-lucas',
      contextMode: 'roleplay_simulation',
      enableBargeIn: true,
      sampleRate: 24000,
    });

    expect(session.sessionId).toBe('sess-live-01');
    expect(session.state).toBe('LISTENING');
    expect(session.transport).toBe('webrtc');
    expect(session.metrics.timeToFirstAudioMs).toBeLessThan(300);
  });

  it('deve bloquear início de sessão sem organizationId (tenancy)', async () => {
    await expect(
      bimodalLiveVoiceService.createSession({
        organizationId: '',
        sessionId: 'sess-live-bad',
        sellerId: 'seller-lucas',
        contextMode: 'voicehub_copilot',
      }),
    ).rejects.toThrow(/Tenancy violation/);
  });

  it('deve transmitir stream de áudio e sintetizar resposta ao finalizar turno', async () => {
    await bimodalLiveVoiceService.createSession({
      organizationId: orgA,
      sessionId: 'sess-live-02',
      sellerId: 'seller-lucas',
      contextMode: 'roleplay_simulation',
    });

    const chunkResult = await bimodalLiveVoiceService.sendAudioStream({
      sessionId: 'sess-live-02',
      organizationId: orgA,
      audioChunkBase64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      isFinalChunk: true,
    });

    expect(chunkResult.accepted).toBe(true);
    expect(chunkResult.state).toBe('SPEAKING');

    const session = bimodalLiveVoiceService.getSession(orgA, 'sess-live-02');
    expect(session?.turns.length).toBe(2);
    expect(session?.turns[0].speaker).toBe('user');
    expect(session?.turns[1].speaker).toBe('assistant');
  });

  it('deve acionar barge-in imediatamente quando o usuário interrompe a fala da IA', async () => {
    await bimodalLiveVoiceService.createSession({
      organizationId: orgA,
      sessionId: 'sess-live-03',
      sellerId: 'seller-lucas',
      contextMode: 'roleplay_simulation',
    });

    // Finalizar turno para assistente falar
    await bimodalLiveVoiceService.sendAudioStream({
      sessionId: 'sess-live-03',
      organizationId: orgA,
      audioChunkBase64: 'chunk',
      isFinalChunk: true,
    });

    // Interrupção natural (barge-in)
    const bargeIn = await bimodalLiveVoiceService.triggerBargeIn({
      sessionId: 'sess-live-03',
      organizationId: orgA,
      interruptionReason: 'Usuário interrompeu com nova pergunta',
    });

    expect(bargeIn.interrupted).toBe(true);
    expect(bargeIn.latencyMs).toBeLessThan(200);

    const session = bimodalLiveVoiceService.getSession(orgA, 'sess-live-03');
    expect(session?.state).toBe('LISTENING');
    expect(session?.turns[1].interrupted).toBe(true);
  });

  it('deve ativar fallback gracioso para STT/TTS tradicional sem perder histórico de turnos', async () => {
    await bimodalLiveVoiceService.createSession({
      organizationId: orgA,
      sessionId: 'sess-live-04',
      sellerId: 'seller-lucas',
      contextMode: 'voicehub_copilot',
    });

    await bimodalLiveVoiceService.sendAudioStream({
      sessionId: 'sess-live-04',
      organizationId: orgA,
      audioChunkBase64: 'chunk',
      isFinalChunk: true,
    });

    const fallback = await bimodalLiveVoiceService.fallbackToAsync({
      sessionId: 'sess-live-04',
      organizationId: orgA,
      reason: 'Degradação severa de jitter na conexão WebRTC',
    });

    expect(fallback.success).toBe(true);
    expect(fallback.fallbackMode).toBe('traditional_stt_tts');

    const session = bimodalLiveVoiceService.getSession(orgA, 'sess-live-04');
    expect(session?.isFallback).toBe(true);
    expect(session?.state).toBe('FALLBACK');
    expect(session?.turns.length).toBe(2);
  });

  it('deve publicar LIVE_VOICE_SESSION_STARTED com idempotencyKey determinística por sessionId', async () => {
    await bimodalLiveVoiceService.createSession({
      organizationId: orgA,
      sessionId: 'sess-live-idem-01',
      sellerId: 'seller-lucas',
      contextMode: 'roleplay_simulation',
    });

    expect(publishMock).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'LIVE_VOICE_SESSION_STARTED' }),
      { idempotencyKey: 'live-voice-session:sess-live-idem-01' },
    );
  });

  it('deve publicar LIVE_VOICE_BARGE_IN_TRIGGERED com chave estável por turno — retry repete a chave, novo turno gera chave nova', async () => {
    await bimodalLiveVoiceService.createSession({
      organizationId: orgA,
      sessionId: 'sess-live-idem-02',
      sellerId: 'seller-lucas',
      contextMode: 'roleplay_simulation',
    });

    await bimodalLiveVoiceService.sendAudioStream({
      sessionId: 'sess-live-idem-02',
      organizationId: orgA,
      audioChunkBase64: 'chunk',
      isFinalChunk: true,
    });

    // 2 turnos (user + assistant) → chave inclui contagem de turnos
    await bimodalLiveVoiceService.triggerBargeIn({
      sessionId: 'sess-live-idem-02',
      organizationId: orgA,
    });
    await bimodalLiveVoiceService.triggerBargeIn({
      sessionId: 'sess-live-idem-02',
      organizationId: orgA,
    });

    const bargeInCalls = publishMock.mock.calls.filter(
      ([event]) => (event as { eventType?: string }).eventType === 'LIVE_VOICE_BARGE_IN_TRIGGERED',
    );
    expect(bargeInCalls).toHaveLength(2);
    // Retry do mesmo fato (sem novo turno) reutiliza a mesma chave → dedup na outbox
    expect(bargeInCalls[0][1]).toEqual({ idempotencyKey: 'live-voice-barge-in:sess-live-idem-02:2' });
    expect(bargeInCalls[1][1]).toEqual(bargeInCalls[0][1]);

    // Novo turno de fala → barge-in seguinte é um fato novo, chave distinta
    await bimodalLiveVoiceService.sendAudioStream({
      sessionId: 'sess-live-idem-02',
      organizationId: orgA,
      audioChunkBase64: 'chunk',
      isFinalChunk: true,
    });
    await bimodalLiveVoiceService.triggerBargeIn({
      sessionId: 'sess-live-idem-02',
      organizationId: orgA,
    });

    const lastCall = publishMock.mock.calls[publishMock.mock.calls.length - 1];
    expect(lastCall[1]).toEqual({ idempotencyKey: 'live-voice-barge-in:sess-live-idem-02:4' });
  });

  it('deve publicar LIVE_VOICE_FALLBACK_ENGAGED com idempotencyKey determinística por sessionId', async () => {
    await bimodalLiveVoiceService.createSession({
      organizationId: orgA,
      sessionId: 'sess-live-idem-03',
      sellerId: 'seller-lucas',
      contextMode: 'voicehub_copilot',
    });

    await bimodalLiveVoiceService.fallbackToAsync({
      sessionId: 'sess-live-idem-03',
      organizationId: orgA,
      reason: 'Degradação de jitter',
    });

    expect(publishMock).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'LIVE_VOICE_FALLBACK_ENGAGED' }),
      { idempotencyKey: 'live-voice-fallback:sess-live-idem-03' },
    );
  });

  it('deve garantir isolamento multi-tenant entre sessões de voz', async () => {
    await bimodalLiveVoiceService.createSession({
      organizationId: orgA,
      sessionId: 'sess-live-alpha',
      sellerId: 'seller-lucas',
      contextMode: 'roleplay_simulation',
    });

    // Tenant B tentando interagir com a sessão do Tenant A deve falhar
    await expect(
      bimodalLiveVoiceService.triggerBargeIn({
        sessionId: 'sess-live-alpha',
        organizationId: orgB,
      }),
    ).rejects.toThrow(/não encontrada/);
  });
});
