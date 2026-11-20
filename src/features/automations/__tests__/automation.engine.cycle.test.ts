import { beforeEach, describe, expect, it, vi } from 'vitest';

// Dex (Onda 1): gatilho cíclico A→B→A deve ser abortado na 2ª iteração com alerta no log.
// A ação da automação reentra em `handle()` (como faria um efeito colateral real que emite
// outro evento), dentro do mesmo fluxo assíncrono.

const mocks = vi.hoisted(() => ({
  automationFindMany: vi.fn(),
  automationUpdate: vi.fn(),
  notificationCreate: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { automation: { findMany: mocks.automationFindMany, update: mocks.automationUpdate } },
}));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: mocks.loggerError },
}));
vi.mock('@/features/notifications/notification.service', () => ({
  notificationService: { create: mocks.notificationCreate },
}));
vi.mock('@/features/automations/automation-history.service', () => ({
  automationHistoryService: { record: vi.fn() },
}));
vi.mock('@/features/automations/automation-idempotency.service', () => ({
  buildTriggerIdempotencyKey: vi.fn(() => 'k'),
  claimAutomationTrigger: vi.fn(async () => 'claimed'),
}));

import { type AutomationEvent, automationEngine } from '../automation.engine.js';

const event: AutomationEvent = {
  organizationId: 'org-1',
  trigger: 'Lead criado',
  entity: 'Lead',
  entityId: 'lead-1',
  data: {},
};

const automation = (id: string) => ({
  id,
  organizationId: 'org-1',
  name: id,
  enabled: true,
  trigger: 'Lead_Criado',
  conditions: null,
  action: 'Notificar_Equipe',
  actionConfig: { channel: 'in_app' },
});

describe('AutomationEngine — detecção de ciclos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.notificationCreate.mockReset();
  });

  it('aborta a reentrada da mesma automação (A→B→A) na 2ª iteração e registra alerta', async () => {
    mocks.automationFindMany.mockResolvedValue([automation('A'), automation('B')]);
    let depth = 0;
    mocks.notificationCreate.mockImplementation(async () => {
      // Cada ação "emite" um novo evento, realimentando o motor.
      if (depth++ < 10) await automationEngine.handle(event);
    });

    await automationEngine.handle(event);

    // Fluxo esperado: A→(B aninhado), depois B→(A aninhado) = 4 execuções; toda reentrada na própria
    // cadeia é abortada. Valor exato detecta tanto recursão sem guarda quanto bloqueio excessivo.
    expect(mocks.notificationCreate.mock.calls.length).toBe(4);
    expect(mocks.loggerError).toHaveBeenCalledWith(
      expect.objectContaining({ automationId: 'A', chain: ['A', 'B', 'A'] }),
      expect.stringContaining('Ciclo de automação detectado'),
    );
  });

  it('não confunde execuções independentes em sequência com ciclo', async () => {
    mocks.automationFindMany.mockResolvedValue([automation('A')]);
    await automationEngine.handle(event);
    await automationEngine.handle(event);
    expect(mocks.notificationCreate).toHaveBeenCalledTimes(2);
    expect(mocks.loggerError).not.toHaveBeenCalled();
  });
});
