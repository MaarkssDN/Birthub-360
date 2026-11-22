/**
 * Testes de regressão da reconciliação forense (handoff 00-para-12-forense,
 * F04-04 / EXP-01 / EXP-07): nenhum dado fabricado pode ser apresentado como
 * real sem flag `simulated`/`isEstimate` explícita.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { autonomousSdrService } from '../../../src/features/ai-voice/server/autonomousSdr.service.js';
import { proposalAutomationService } from '../../../src/features/proposals/services/proposalAutomation.service.js';
import { promiseGuardianAgent } from '../../../src/features/intelligence/agents/tactical/promiseGuardian.agent.js';
import { bimodalLiveVoiceService } from '../../../src/features/ai-voice/server/bimodalLiveVoice.service.js';
import { conversationalIntelligenceService } from '../../../src/features/ai-voice/server/conversationalIntelligence.service.js';
import { domainEventMesh } from '../../../src/lib/queue/domainEventMesh.service.js';
import type { DomainEventEnvelope } from '../../../src/shared/contracts/domainEventMesh.contract.js';

const ORG = 'org-reconciliacao-12';

beforeEach(() => {
  autonomousSdrService.clear();
  proposalAutomationService.clear();
  promiseGuardianAgent.clear();
  bimodalLiveVoiceService.clear();
});

describe('F04-04: dados fabricados marcados como simulated', () => {
  it('SDR autônomo marca resultado de chamada e reunião agendada como simulados', async () => {
    // Terça-feira 12:00 em America/Sao_Paulo (UTC-3) — dentro da janela 08-18.
    const result = await autonomousSdrService.initiateOutboundCall({
      organizationId: ORG,
      leadId: 'lead-1',
      leadName: 'Maria',
      companyName: 'ACME',
      phoneNumber: '+5511999999999',
      sellerId: 'seller-1',
      sellerEmail: 'seller@birthhub.com',
      referenceTimestamp: '2026-10-20T15:00:00.000Z',
    });

    expect(result.simulated).toBe(true);
    expect(result.meetingScheduled?.simulated).toBe(true);
    // IDs/URL fabricados continuam existindo, mas agora sinalizados.
    expect(result.meetingScheduled?.googleMeetLink).toBeTruthy();
  });

  it('eventos do domainEventMesh carregam simulated:true nos payloads fabricados (ressalva 24)', async () => {
    const received: DomainEventEnvelope[] = [];
    const capture = async (event: DomainEventEnvelope) => {
      received.push(event);
    };
    domainEventMesh.subscribe('SDR_CALL_COMPLETED', capture, 'test-reconciliacao-12-sdr-call');
    domainEventMesh.subscribe(
      'MEETING_SCHEDULED_CALENDAR',
      capture,
      'test-reconciliacao-12-meeting',
    );

    await autonomousSdrService.initiateOutboundCall({
      organizationId: ORG,
      leadId: 'lead-events',
      leadName: 'Evento Test',
      companyName: 'EvtCo',
      phoneNumber: '+5511777777777',
      sellerId: 'seller-1',
      sellerEmail: 'seller@birthhub.com',
      referenceTimestamp: '2026-10-20T15:00:00.000Z',
    });

    const callEvent = received.find((e) => e.eventType === 'SDR_CALL_COMPLETED');
    const meetingEvent = received.find((e) => e.eventType === 'MEETING_SCHEDULED_CALENDAR');

    expect(callEvent?.payload).toMatchObject({ simulated: true });
    expect(meetingEvent?.payload).toMatchObject({ simulated: true });
  });

  it('SDR bloqueado por horário NÃO é marcado como simulado (política real)', async () => {
    // Domingo — fora da janela de dias úteis.
    const result = await autonomousSdrService.initiateOutboundCall({
      organizationId: ORG,
      leadId: 'lead-2',
      leadName: 'João',
      companyName: 'Beta',
      phoneNumber: '+5511888888888',
      sellerId: 'seller-1',
      sellerEmail: 'seller@birthhub.com',
      referenceTimestamp: '2026-10-18T15:00:00.000Z', // domingo 12:00 BRT
    });

    expect(result.disposition).toBe('call_failed_hours_restriction');
    expect(result.simulated).toBeUndefined();
  });

  it('Proposta enviada para assinatura marca envelope/URL como simulados', async () => {
    const proposal = await proposalAutomationService.generateDraftProposal({
      organizationId: ORG,
      dealId: 'deal-1',
      customerId: 'cust-1',
      customerName: 'Cliente Teste',
      customerDocument: '12345678000199',
      title: 'Proposta teste',
      items: [
        {
          id: 'item-1',
          sku: 'SKU-1',
          name: 'Licença',
          quantity: 1,
          unitPriceCents: 100000,
          totalPriceCents: 100000,
        },
      ],
      paymentTerms: '30 dias',
    });

    const sent = await proposalAutomationService.sendForDigitalSignature({
      organizationId: ORG,
      proposalId: proposal.id,
      signerEmail: 'cliente@teste.com',
    });

    expect(sent.digitalSignatureRef?.envelopeId).toBeTruthy();
    expect(sent.digitalSignatureRef?.signatureUrl).toBeTruthy();
    expect(sent.digitalSignatureRef?.simulated).toBe(true);
  });

  it('PromiseGuardian.approveCommitment sinaliza crmTaskId simulado', async () => {
    const approved = await promiseGuardianAgent.approveCommitment(ORG, 'commitment-inexistente-1');

    expect(approved.success).toBe(true);
    expect(approved.crmTaskId).toBeTruthy();
    expect(approved.simulated).toBe(true);
  });
});

describe('EXP-01: sessão bimodal Live marcada como simulação', () => {
  it('sessão, métricas e turnos fabricados carregam flags honestas', async () => {
    const session = await bimodalLiveVoiceService.createSession({
      organizationId: ORG,
      sessionId: 'sess-rec-1',
      sellerId: 'seller-1',
      contextMode: 'roleplay_simulation',
    });

    expect(session.simulated).toBe(true);
    expect(session.metrics.isEstimate).toBe(true);

    await bimodalLiveVoiceService.sendAudioStream({
      sessionId: 'sess-rec-1',
      organizationId: ORG,
      audioChunkBase64: 'chunk',
      isFinalChunk: true,
    });

    const updated = bimodalLiveVoiceService.getSession(ORG, 'sess-rec-1');
    expect(updated?.turns).toHaveLength(2);
    expect(updated?.turns.every((t) => t.simulated === true)).toBe(true);
  });
});

describe('EXP-07: métricas conversacionais honestas', () => {
  it('calcula overlap real entre turnos sobrepostos e marca isEstimate', () => {
    const metrics = conversationalIntelligenceService.calculateDynamicMetrics([
      {
        turnId: '1',
        speaker: 'seller',
        startTimeSeconds: 0,
        endTimeSeconds: 10,
        durationSeconds: 10,
        text: 'Olá',
      },
      {
        turnId: '2',
        speaker: 'customer',
        startTimeSeconds: 5,
        endTimeSeconds: 15,
        durationSeconds: 10,
        text: 'Oi, tudo bem?',
      },
    ]);

    // Interseção real: [5,10] = 5 segundos de fala simultânea.
    expect(metrics.overlapTimeSeconds).toBe(5);
    expect(metrics.isEstimate).toBe(true);
    // Confiança de diarização desconhecida → valor neutro, nunca 0.95 fabricado.
    expect(metrics.diarizationQualityConfidence).toBe(0.5);
  });

  it('turnos sequenciais sem sobreposição reportam overlap zero', () => {
    const metrics = conversationalIntelligenceService.calculateDynamicMetrics([
      {
        turnId: '1',
        speaker: 'seller',
        startTimeSeconds: 0,
        endTimeSeconds: 10,
        durationSeconds: 10,
        text: 'Pergunta',
      },
      {
        turnId: '2',
        speaker: 'customer',
        startTimeSeconds: 10,
        endTimeSeconds: 20,
        durationSeconds: 10,
        text: 'Resposta',
      },
    ]);

    expect(metrics.overlapTimeSeconds).toBe(0);
  });
});
