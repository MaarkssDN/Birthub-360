import { describe, expect, it } from 'vitest';
import { selectTenantRoundRobinDeterministic, type SalesRepCandidate } from '../round-robin.js';

/**
 * SQUAD40-47-ROUTING — round-robin determinístico escopado por tenant.
 * Função pura: estado (cursor) é injetado e devolvido; nenhum Redis/DB global.
 */
describe('selectTenantRoundRobinDeterministic', () => {
  const rep = (id: string, over: Partial<SalesRepCandidate> = {}): SalesRepCandidate => ({
    id,
    name: `Rep ${id}`,
    active: true,
    onVacation: false,
    ...over,
  });

  const threeReps = [rep('rep-a'), rep('rep-b'), rep('rep-c')];

  it('é determinístico: mesma entrada produz o mesmo candidato', () => {
    const d1 = selectTenantRoundRobinDeterministic({
      tenantId: 'tenant-1',
      candidates: threeReps,
      cursor: 4,
    });
    const d2 = selectTenantRoundRobinDeterministic({
      tenantId: 'tenant-1',
      candidates: threeReps,
      cursor: 4,
    });
    expect(d1.assignedRepId).toBe(d2.assignedRepId);
    expect(d1.tenantOffset).toBe(d2.tenantOffset);
  });

  it('não depende da ordem do array de candidatos (ordenação canônica por id)', () => {
    const shuffled = [rep('rep-c'), rep('rep-a'), rep('rep-b')];
    const d1 = selectTenantRoundRobinDeterministic({
      tenantId: 'tenant-1',
      candidates: threeReps,
      cursor: 2,
    });
    const d2 = selectTenantRoundRobinDeterministic({
      tenantId: 'tenant-1',
      candidates: shuffled,
      cursor: 2,
    });
    expect(d2.assignedRepId).toBe(d1.assignedRepId);
    expect(d2.eligibleRepIds).toEqual(['rep-a', 'rep-b', 'rep-c']);
  });

  it('ignora candidatos inativos ou de férias e distribui só entre elegíveis', () => {
    const candidates = [
      rep('rep-a'),
      rep('rep-b', { onVacation: true }),
      rep('rep-c', { active: false }),
      rep('rep-d'),
    ];
    const counts = new Map<string, number>();
    let cursor = 0;
    for (let i = 0; i < 6; i++) {
      const d = selectTenantRoundRobinDeterministic({
        tenantId: 'tenant-1',
        candidates,
        cursor,
      });
      counts.set(d.assignedRepId, (counts.get(d.assignedRepId) ?? 0) + 1);
      cursor = d.nextCursor;
    }
    expect([...counts.keys()].sort()).toEqual(['rep-a', 'rep-d']);
    expect(counts.get('rep-a')).toBe(3);
    expect(counts.get('rep-d')).toBe(3);
    expect(counts.has('rep-b')).toBe(false);
    expect(counts.has('rep-c')).toBe(false);
  });

  it('distribuição equilibrada: N atribuições sobre M elegíveis → cada um recebe N/M', () => {
    const counts = new Map<string, number>();
    let cursor = 0;
    for (let i = 0; i < 12; i++) {
      const d = selectTenantRoundRobinDeterministic({
        tenantId: 'tenant-1',
        candidates: threeReps,
        cursor,
      });
      counts.set(d.assignedRepId, (counts.get(d.assignedRepId) ?? 0) + 1);
      cursor = d.nextCursor;
      expect(d.nextCursor).toBe(i + 1);
    }
    expect(counts.size).toBe(3);
    for (const c of threeReps) {
      expect(counts.get(c.id)).toBe(4);
    }
  });

  it('redistribuição justa quando disponibilidade muda no meio da sequência', () => {
    // rep-b sai de férias após a 3ª atribuição.
    const counts = new Map<string, number>();
    let cursor = 0;
    for (let i = 0; i < 9; i++) {
      const candidates =
        i < 3
          ? [rep('rep-a'), rep('rep-b'), rep('rep-c')]
          : [rep('rep-a'), rep('rep-b', { onVacation: true }), rep('rep-c')];
      const d = selectTenantRoundRobinDeterministic({
        tenantId: 'tenant-1',
        candidates,
        cursor,
      });
      counts.set(d.assignedRepId, (counts.get(d.assignedRepId) ?? 0) + 1);
      cursor = d.nextCursor;
    }
    // rep-b recebeu no máximo as 3 primeiras atribuições; rep-a/rep-c absorvem o resto
    // com diferença de no máximo 1 entre si.
    const a = counts.get('rep-a') ?? 0;
    const c = counts.get('rep-c') ?? 0;
    const b = counts.get('rep-b') ?? 0;
    expect(Math.abs(a - c)).toBeLessThanOrEqual(1);
    expect(b).toBeLessThanOrEqual(3);
    expect(a + b + c).toBe(9);
  });

  it('tenants distintos têm cursores independentes e offsets próprios', () => {
    const dA0 = selectTenantRoundRobinDeterministic({
      tenantId: 'tenant-A',
      candidates: threeReps,
      cursor: 0,
    });
    const dB0 = selectTenantRoundRobinDeterministic({
      tenantId: 'tenant-B',
      candidates: threeReps,
      cursor: 0,
    });
    // Mesmo cursor, tenants diferentes → decisão independente (offsets podem coincidir,
    // mas a trilha registra o tenant de cada um).
    expect(dA0.nextCursor).toBe(1);
    expect(dB0.nextCursor).toBe(1);
    expect(dA0.reason).toContain('tenant=tenant-A');
    expect(dB0.reason).toContain('tenant=tenant-B');

    // O cursor de um tenant não altera a sequência do outro.
    const dA5 = selectTenantRoundRobinDeterministic({
      tenantId: 'tenant-A',
      candidates: threeReps,
      cursor: 5,
    });
    const dB0again = selectTenantRoundRobinDeterministic({
      tenantId: 'tenant-B',
      candidates: threeReps,
      cursor: 0,
    });
    expect(dB0again.assignedRepId).toBe(dB0.assignedRepId);
    expect(dA5.assignedRepId).toBe(
      selectTenantRoundRobinDeterministic({
        tenantId: 'tenant-A',
        candidates: threeReps,
        cursor: 5,
      }).assignedRepId,
    );
  });

  it('lança erro observável quando não há nenhum elegível', () => {
    expect(() =>
      selectTenantRoundRobinDeterministic({
        tenantId: 'tenant-1',
        candidates: [rep('rep-x', { active: false }), rep('rep-y', { onVacation: true })],
        cursor: 0,
      }),
    ).toThrow('Nenhum vendedor ativo e disponível');
    expect(() =>
      selectTenantRoundRobinDeterministic({ tenantId: 'tenant-1', candidates: [], cursor: 0 }),
    ).toThrow('Nenhum vendedor ativo e disponível');
  });

  it('rejeita entradas inválidas: tenantId vazio e cursor não inteiro', () => {
    expect(() =>
      selectTenantRoundRobinDeterministic({
        tenantId: '   ',
        candidates: threeReps,
        cursor: 0,
      }),
    ).toThrow('tenantId é obrigatório');
    expect(() =>
      selectTenantRoundRobinDeterministic({
        tenantId: 'tenant-1',
        candidates: threeReps,
        cursor: 1.5,
      }),
    ).toThrow('Cursor de roteamento inválido');
  });

  it('retorna trilha de decisão completa para auditoria (sem PII)', () => {
    const d = selectTenantRoundRobinDeterministic({
      tenantId: 'tenant-1',
      candidates: [rep('rep-b'), rep('rep-a', { onVacation: true })],
      cursor: 3,
    });
    expect(d.eligibleRepIds).toEqual(['rep-b']);
    expect(d.assignedRepId).toBe('rep-b');
    expect(d.tenantOffset).toBe(0); // único elegível → offset sempre 0
    expect(d.nextCursor).toBe(4);
    expect(d.reason).toContain('cursor=3');
    expect(JSON.stringify(d)).not.toContain('Rep '); // sem nomes (PII fora da trilha)
  });
});
