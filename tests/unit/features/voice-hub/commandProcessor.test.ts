import { describe, expect, it, vi } from 'vitest';
import {
  executeVoiceCommandWithCommit,
  type DatabaseMutationRunner,
  type VoiceCommandPayload,
} from '../../../../src/features/voice-hub/commands/command.processor.js';

describe('Voice Command Execution & Atomic Post-Commit Confirmation (B-07 Tito)', () => {
  const baseCommand: VoiceCommandPayload = {
    commandId: 'cmd-voice-001',
    type: 'create_lead',
    organizationId: 'tenant-voice-hub',
    userId: 'user-voice-sdr',
    parameters: {
      leadName: 'Acme Health Corp',
      contactPhone: '+5511999998888',
    },
  };

  it('returns positive confirmation ONLY after database commit succeeds', async () => {
    const mockDbRunner: DatabaseMutationRunner = {
      mutate: vi.fn().mockResolvedValue({ id: 'lead-persisted-123', status: 'Created' }),
    };

    const result = await executeVoiceCommandWithCommit(baseCommand, mockDbRunner);

    expect(result.success).toBe(true);
    expect(result.confirmed).toBe(true);
    expect(result.committedAt).toBeDefined();
    expect(result.data).toEqual({ id: 'lead-persisted-123', status: 'Created' });
    expect(mockDbRunner.mutate).toHaveBeenCalledWith('tenant-voice-hub', baseCommand);
  });

  it('guarantees UI never receives positive confirmation when database mutation fails or is aborted', async () => {
    const mockDbRunner: DatabaseMutationRunner = {
      mutate: vi.fn().mockRejectedValue(new Error('Postgres connection pool exhausted or deadlock')),
    };

    const result = await executeVoiceCommandWithCommit(baseCommand, mockDbRunner);

    expect(result.success).toBe(false);
    expect(result.confirmed).toBe(false);
    expect(result.committedAt).toBeUndefined();
    expect(result.error).toContain('Postgres connection pool exhausted or deadlock');
  });

  it('preserves commandId and organizationId context across both success and failure paths', async () => {
    const mockDbSuccess: DatabaseMutationRunner = {
      mutate: vi.fn().mockResolvedValue({ status: 'ok' }),
    };
    const mockDbFail: DatabaseMutationRunner = {
      mutate: vi.fn().mockRejectedValue(new Error('Validation error')),
    };

    const resSuccess = await executeVoiceCommandWithCommit(baseCommand, mockDbSuccess);
    const resFail = await executeVoiceCommandWithCommit(baseCommand, mockDbFail);

    expect(resSuccess.commandId).toBe('cmd-voice-001');
    expect(resSuccess.organizationId).toBe('tenant-voice-hub');
    expect(resFail.commandId).toBe('cmd-voice-001');
    expect(resFail.organizationId).toBe('tenant-voice-hub');
  });
});
