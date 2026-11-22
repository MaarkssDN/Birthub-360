import { describe, it, expect, vi, beforeEach } from 'vitest';
import { voiceCommandExecutorService } from '../../../../src/features/voice/voice-command-executor.service.js';
import { prisma } from '../../../../src/lib/prisma.js';
import { recordOptOut } from '../../../../src/features/integrations/birth-voice/callSuppression.service.js';
import type { VoiceCommandRequest } from '../../../../src/features/voice/types.js';

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

vi.mock('../../../../src/features/integrations/birth-voice/callSuppression.service.js', () => ({
  recordOptOut: vi.fn().mockResolvedValue({ id: 'optout-1' }),
}));

describe('VoiceCommandExecutorService (B-07 Elimination)', () => {
  const organizationId = 'org-123';
  const leadId = 'lead-456';
  const sessionId = 'session-789';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute SCHEDULE_MEETING command with real Activity and audit log', async () => {
    vi.mocked(prisma.activity.create).mockResolvedValue({
      id: 'act-meeting-1',
      organizationId,
      leadId,
      type: 'Reuniao' as never,
      status: 'Agendada' as never,
    } as any);

    const command: VoiceCommandRequest = {
      id: 'cmd-1',
      sessionId,
      organizationId,
      leadId,
      type: 'SCHEDULE_MEETING',
      parameters: {
        scheduledAt: '2026-10-15T14:00:00.000Z',
        title: 'Demonstração do Produto',
        notes: 'Lead demonstrou interesse em plano enterprise.',
      },
      timestamp: new Date(),
    };

    const result = await voiceCommandExecutorService.executeCommand(command);

    expect(result.executed).toBe(true);
    expect(result.verified).toBe(true);
    expect(result.type).toBe('SCHEDULE_MEETING');
    expect(prisma.activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId,
          leadId,
          type: 'Reuniao',
          status: 'Agendada',
          owner: 'SDR de Voz com IA',
        }),
      }),
    );
  });

  it('should reject SCHEDULE_MEETING if leadId is missing without claiming false success', async () => {
    const command: VoiceCommandRequest = {
      id: 'cmd-2',
      sessionId,
      organizationId,
      type: 'SCHEDULE_MEETING',
      parameters: {
        scheduledAt: '2026-10-15T14:00:00.000Z',
      },
      timestamp: new Date(),
    };

    const result = await voiceCommandExecutorService.executeCommand(command);

    expect(result.executed).toBe(false);
    expect(result.verified).toBe(false);
    expect(result.error).toBe('MISSING_LEAD_ID');
    expect(prisma.activity.create).not.toHaveBeenCalled();
  });

  it('should execute QUALIFY_LEAD command and update score in database', async () => {
    vi.mocked(prisma.lead.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.activity.create).mockResolvedValue({ id: 'act-qual-1' } as any);

    const command: VoiceCommandRequest = {
      id: 'cmd-3',
      sessionId,
      organizationId,
      leadId,
      type: 'QUALIFY_LEAD',
      parameters: {
        score: 95,
        reason: 'Decisor com orçamento aprovado',
      },
      timestamp: new Date(),
    };

    const result = await voiceCommandExecutorService.executeCommand(command);

    expect(result.executed).toBe(true);
    expect(result.verified).toBe(true);
    expect(prisma.lead.updateMany).toHaveBeenCalledWith({
      where: { id: leadId, organizationId },
      data: expect.objectContaining({ score: 95 }),
    });
  });

  it('should execute OPT_OUT command and suppress phone number', async () => {
    const command: VoiceCommandRequest = {
      id: 'cmd-4',
      sessionId,
      organizationId,
      leadId,
      type: 'OPT_OUT',
      parameters: {
        phone: '+5511999998888',
        reason: 'Contato pediu para não ligar mais',
      },
      timestamp: new Date(),
    };

    const result = await voiceCommandExecutorService.executeCommand(command);

    expect(result.executed).toBe(true);
    expect(result.verified).toBe(true);
    expect(recordOptOut).toHaveBeenCalledWith({
      organizationId,
      phone: '+5511999998888',
      source: 'call-opt-out',
      reason: 'Contato pediu para não ligar mais',
      leadId,
    });
  });

  it('should execute SEND_PROPOSAL command and record email activity', async () => {
    vi.mocked(prisma.activity.create).mockResolvedValue({ id: 'act-prop-1' } as any);

    const command: VoiceCommandRequest = {
      id: 'cmd-5',
      sessionId,
      organizationId,
      leadId,
      type: 'SEND_PROPOSAL',
      parameters: {
        title: 'Proposta Birthub 360 Enterprise',
      },
      timestamp: new Date(),
    };

    const result = await voiceCommandExecutorService.executeCommand(command);

    expect(result.executed).toBe(true);
    expect(result.verified).toBe(true);
    expect(prisma.activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'Email',
          status: 'Concluida',
        }),
      }),
    );
  });
});
