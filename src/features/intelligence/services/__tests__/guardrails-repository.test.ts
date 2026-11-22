import { describe, expect, it } from 'vitest';
import type {
  CreateGuardrailEventData,
  GuardrailEventEntity,
  GuardrailRepository,
} from '../../domain/Guardrail';
import { GuardrailsService } from '../guardrails.service';

class FakeGuardrailRepository implements GuardrailRepository {
  public recordedEvents: CreateGuardrailEventData[] = [];
  public shouldFail = false;

  async recordEvent(data: CreateGuardrailEventData): Promise<GuardrailEventEntity | null> {
    if (this.shouldFail) {
      return null;
    }
    this.recordedEvents.push(data);
    return {
      id: `ev-${this.recordedEvents.length}`,
      ...data,
      createdAt: new Date(),
    };
  }
}

describe('GuardrailsService (Clean Architecture)', () => {
  const ORG = 'org-tenant-1';

  it('redige texto com CPF e registra telemetria via repositório', async () => {
    const repo = new FakeGuardrailRepository();
    const service = new GuardrailsService(repo);

    const input = 'O CPF do cliente é 123.456.789-00 no contrato.';
    const result = await service.redactAndTrackPiiLeak(input, 'crm:lead-summary', ORG);

    expect(result).toBe('O CPF do cliente é [CPF OCULTADO] no contrato.');
    expect(repo.recordedEvents).toHaveLength(1);
    expect(repo.recordedEvents[0]).toEqual({
      type: 'pii_redacted',
      source: 'crm:lead-summary',
      organizationId: ORG,
    });
  });

  it('não aciona o repositório quando não há dados sensíveis', async () => {
    const repo = new FakeGuardrailRepository();
    const service = new GuardrailsService(repo);

    const input = 'Texto sem nenhuma informação pessoal.';
    const result = await service.redactAndTrackPiiLeak(input, 'crm:lead-summary', ORG);

    expect(result).toBe(input);
    expect(repo.recordedEvents).toHaveLength(0);
  });

  it('permanece resiliente e entrega a resposta redigida mesmo se a telemetria falhar', async () => {
    const repo = new FakeGuardrailRepository();
    repo.shouldFail = true;
    const service = new GuardrailsService(repo);

    const input = 'Telefone para contato: (11) 98765-4321.';
    const result = await service.redactAndTrackPiiLeak(input, 'chat:copilot', ORG);

    expect(result).toBe('Telefone para contato: [TELEFONE OCULTADO].');
  });
});
