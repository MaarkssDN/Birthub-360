import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mesma estrutura de mocks de telephonyService.transfer.test.ts.
vi.mock('../repositories/agentRepository.js', () => ({
  findAgentByPhoneNumber: vi.fn(),
  findAgentById: vi.fn(),
}));

vi.mock('../repositories/sessionRepository.js', () => ({
  createInboundPhoneSessionIfNoneForCallSid: vi.fn(),
  findSessionById: vi.fn(),
  updateSession: vi.fn(),
  findActivePhoneSessionByCallSid: vi.fn(),
}));

vi.mock('./callLogService.js', () => ({
  createCallLog: vi.fn(),
}));

vi.mock('./webhook.service.js', () => ({
  webhookService: { dispatch: vi.fn() },
}));

vi.mock('@/lib/voice-runtime/providers/LLMGateway.js', () => ({
  llmProviderGateway: { processRequest: vi.fn() },
}));

vi.mock('./workflowRuntimeService.js', () => ({
  initializeWorkflowRuntime: vi.fn(),
  getWorkflowOpeningQuestion: vi.fn(),
  prepareWorkflowTurn: vi.fn(),
  resumeAfterTool: vi.fn(),
}));

import { findAgentById } from '../repositories/agentRepository.js';
import { findSessionById, updateSession } from '../repositories/sessionRepository.js';
import { llmProviderGateway } from '@/lib/voice-runtime/providers/LLMGateway.js';
import { handleTurn } from './telephonyService.js';

const mockFindById = vi.mocked(findAgentById);
const mockFindSessionById = vi.mocked(findSessionById);
const mockUpdateSession = vi.mocked(updateSession);
const mockProcessRequest = vi.mocked(llmProviderGateway.processRequest);

beforeEach(() => {
  vi.clearAllMocks();
});

// Reconciliação forense — handoff 15-para-12 (B-13/LGPD): turnos de voz
// persistidos em session.metadata (e retransmitidos como transcript no webhook
// agent.call.ended) devem passar pela máscara de PII antes da gravação.
describe('telephonyService.handleTurn — mascaramento de PII no transcript', () => {
  it('mascara CPF do turno do usuário antes de persistir em session.metadata', async () => {
    mockFindSessionById.mockResolvedValue({
      id: 'sess-1',
      organizationId: 'tenant-1',
      agentId: 'agent-1',
      channel: 'phone',
      status: 'active',
      metadata: {
        callSid: 'CA123',
        from: '+1000',
        to: '+15551234567',
        turns: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as never);
    mockFindById.mockResolvedValue({
      id: 'agent-1',
      organizationId: 'tenant-1',
      configuration: {},
    } as never);
    mockProcessRequest.mockResolvedValue({
      text: 'Anotado, obrigado!',
      blockedByConsent: false,
    } as never);

    await handleTurn({
      sessionId: 'sess-1',
      speechResult: 'Meu CPF é 123.456.789-00, pode verificar?',
    });

    expect(mockUpdateSession).toHaveBeenCalledTimes(1);
    const persistedMetadata = mockUpdateSession.mock.calls[0][1]?.metadata as {
      turns: Array<{ role: string; content: string }>;
    };
    const userTurn = persistedMetadata.turns.find((t) => t.role === 'user');
    const assistantTurn = persistedMetadata.turns.find((t) => t.role === 'assistant');

    expect(userTurn?.content).toContain('[REDACTED_CPF]');
    expect(userTurn?.content).not.toContain('123.456.789-00');
    expect(assistantTurn?.content).toBe('Anotado, obrigado!');
  });

  it('mascara PII ecoada pelo LLM no turno do assistente persistido', async () => {
    mockFindSessionById.mockResolvedValue({
      id: 'sess-2',
      organizationId: 'tenant-1',
      agentId: 'agent-1',
      channel: 'phone',
      status: 'active',
      metadata: {
        callSid: 'CA124',
        from: '+1000',
        to: '+15551234567',
        turns: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as never);
    mockFindById.mockResolvedValue({
      id: 'agent-1',
      organizationId: 'tenant-1',
      configuration: {},
    } as never);
    mockProcessRequest.mockResolvedValue({
      text: 'Seu e-mail teste@empresa.com foi registrado.',
      blockedByConsent: false,
    } as never);

    await handleTurn({ sessionId: 'sess-2', speechResult: 'meu email é teste@empresa.com' });

    const persistedMetadata = mockUpdateSession.mock.calls[0][1]?.metadata as {
      turns: Array<{ role: string; content: string }>;
    };
    const assistantTurn = persistedMetadata.turns.find((t) => t.role === 'assistant');

    expect(assistantTurn?.content).toContain('[REDACTED_EMAIL]');
    expect(assistantTurn?.content).not.toContain('teste@empresa.com');
  });
});
