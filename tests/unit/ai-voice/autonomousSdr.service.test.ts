import { beforeEach, describe, expect, it, vi } from 'vitest';
import { domainEventMesh } from '../../../src/lib/queue/domainEventMesh.service.js';
import { AutonomousSdrService } from '../../../src/features/ai-voice/server/autonomousSdr.service.js';

vi.mock('../../../src/lib/queue/domainEventMesh.service.js', () => ({
  domainEventMesh: { publish: vi.fn(async () => undefined) },
}));

describe('AutonomousSdrService — Evolução 09 (SDR Autônomo e Agendamento)', () => {
  const service = new AutonomousSdrService();
  const orgId = 'org-sdr-autonomo-001';
  const publishMock = vi.mocked(domainEventMesh.publish);

  beforeEach(() => {
    publishMock.mockClear();
  });

  it('deve realizar discagem ativa e agendar reunião no Google Calendar quando qualificado dentro do horário comercial', async () => {
    const result = await service.initiateOutboundCall({
      organizationId: orgId,
      leadId: 'lead-agro-99',
      leadName: 'Marcos Vinícius',
      companyName: 'AgroFrotas Brasil',
      phoneNumber: '+5511987654321',
      sellerId: 'user-closer-10',
      sellerEmail: 'closer.roberto@birthhub.com',
      callGoal: 'Qualificação de telemetria para 120 caminhões',
      referenceTimestamp: new Date('2026-10-21T17:00:00Z'), // Quarta-feira 14:00 BRT
    });

    expect(result.callId).toBeDefined();
    expect(result.disposition).toBe('meeting_scheduled');
    expect(result.qualification).toBe('qualified');
    expect(result.meetingScheduled).toBeDefined();
    expect(result.meetingScheduled?.googleMeetLink).toContain('https://meet.google.com/');
    expect(result.meetingScheduled?.status).toBe('confirmed');
    expect(result.wasWithinAllowedHours).toBe(true);
  });

  it('deve bloquear discagem fora do horário comercial permitido (CallingHoursPolicy)', async () => {
    const result = await service.initiateOutboundCall({
      organizationId: orgId,
      leadId: 'lead-agro-99',
      leadName: 'Marcos Vinícius',
      companyName: 'AgroFrotas Brasil',
      phoneNumber: '+5511987654321',
      sellerId: 'user-closer-10',
      sellerEmail: 'closer.roberto@birthhub.com',
      callGoal: 'Qualificação de telemetria para 120 caminhões',
      referenceTimestamp: new Date('2026-10-18T23:00:00Z'), // Domingo 20:00 BRT
    });

    expect(result.callId).toBeDefined();
    expect(result.disposition).toBe('call_failed_hours_restriction');
    expect(result.wasWithinAllowedHours).toBe(false);
    expect(result.meetingScheduled).toBeUndefined();
  });

  it('deve agendar reunião diretamente com geração de link Meet e data de término', async () => {
    const meeting = await service.scheduleCalendarMeeting({
      organizationId: orgId,
      leadId: 'lead-trans-55',
      sellerId: 'user-closer-10',
      sellerEmail: 'closer.roberto@birthhub.com',
      preferredSlotIso: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      title: 'Apresentação Comercial Birth Hub 360',
    });

    expect(meeting.meetingId).toBeDefined();
    expect(meeting.googleMeetLink).toBeDefined();
    expect(meeting.endTime).toBeDefined();
  });

  it('deve publicar SDR_CALL_COMPLETED com idempotencyKey determinística por callId (handoff 16→00)', async () => {
    const result = await service.initiateOutboundCall({
      organizationId: orgId,
      leadId: 'lead-agro-99',
      leadName: 'Marcos Vinícius',
      companyName: 'AgroFrotas Brasil',
      phoneNumber: '+5511987654321',
      sellerId: 'user-closer-10',
      sellerEmail: 'closer.roberto@birthhub.com',
      callGoal: 'Qualificação de telemetria para 120 caminhões',
      referenceTimestamp: new Date('2026-10-21T17:00:00Z'),
    });

    expect(publishMock).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'SDR_CALL_COMPLETED' }),
      { idempotencyKey: `sdr-call:${result.callId}` },
    );
  });

  it('deve publicar MEETING_SCHEDULED_CALENDAR com idempotencyKey determinística por meetingId', async () => {
    const meeting = await service.scheduleCalendarMeeting({
      organizationId: orgId,
      leadId: 'lead-trans-55',
      sellerId: 'user-closer-10',
      sellerEmail: 'closer.roberto@birthhub.com',
      preferredSlotIso: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      title: 'Apresentação Comercial Birth Hub 360',
    });

    expect(publishMock).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'MEETING_SCHEDULED_CALENDAR' }),
      { idempotencyKey: `sdr-meeting:${meeting.meetingId}` },
    );
  });

  it('deve rejeitar chamada sem organizationId (Tenancy Guard)', async () => {
    await expect(
      service.initiateOutboundCall({
        organizationId: '',
        leadId: 'lead-invalid',
        leadName: 'Teste',
        companyName: 'Empresa',
        phoneNumber: '+5511999999999',
        sellerId: 'seller-1',
        sellerEmail: 'seller@test.com',
      }),
    ).rejects.toThrow(/Tenancy violation/);
  });
});
