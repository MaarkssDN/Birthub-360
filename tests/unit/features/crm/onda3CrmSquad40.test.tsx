// @vitest-environment jsdom
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  DealsService,
  OptimisticLockConflictError,
  type DealRecord,
  type DealRepositoryPort,
} from '../../../../src/features/crm/deals/deals.service.js';
import {
  LeadTimelineService,
  type LeadTimelineEvent,
} from '../../../../src/features/crm/leads/timeline.service.js';
import { KanbanBoard } from '../../../../src/features/crm/pipelines/KanbanBoard.js';
import { evaluateCadenceBusinessWindow } from '../../../../src/features/crm/cadences/cadence.worker.js';
import { calculateWeightedForecast } from '../../../../src/features/crm/forecast/forecast.service.js';

describe('[Squad 40 · CRM & Receita] Onda 3 — Ravi (40), Cadu (41), Lívia (42), Lola (44), Sofia (46)', () => {
  describe('[40 · Ravi] Lock otimista com versionamento em Deals', () => {
    it('incrementa a versão do deal em atualização válida e lança OptimisticLockConflictError em versão obsoleta', async () => {
      const store = new Map<string, DealRecord>([
        [
          'deal-1',
          {
            id: 'deal-1',
            tenantId: 'tenant-a',
            title: 'Implante Enterprise',
            stageId: 'stage-qual',
            valueCents: 500_000,
            version: 1,
            updatedAt: new Date('2026-11-20T10:00:00Z'),
          },
        ],
      ]);

      const repo: DealRepositoryPort = {
        async findById(tenantId, dealId) {
          const item = store.get(dealId);
          return item && item.tenantId === tenantId ? item : null;
        },
        async updateIfVersionMatches({ tenantId, dealId, expectedVersion, patch }) {
          const current = store.get(dealId);
          if (!current || current.tenantId !== tenantId || current.version !== expectedVersion) {
            return null;
          }
          const updated: DealRecord = {
            ...current,
            ...patch,
            version: current.version + 1,
            updatedAt: new Date(),
          };
          store.set(dealId, updated);
          return updated;
        },
        async runInTransaction(fn) {
          const snapshot = new Map(store);
          try {
            return await fn(repo);
          } catch (err) {
            store.clear();
            for (const [k, v] of snapshot) store.set(k, v);
            throw err;
          }
        },
      };

      const service = new DealsService(repo);

      const firstUpdate = await service.updateDealWithOptimisticLock({
        tenantId: 'tenant-a',
        dealId: 'deal-1',
        expectedVersion: 1,
        patch: { stageId: 'stage-prop' },
      });
      expect(firstUpdate.version).toBe(2);
      expect(firstUpdate.stageId).toBe('stage-prop');

      // Tentativa concorrente com expectedVersion=1 falha com OptimisticLockConflictError
      await expect(
        service.updateDealWithOptimisticLock({
          tenantId: 'tenant-a',
          dealId: 'deal-1',
          expectedVersion: 1,
          patch: { stageId: 'stage-won' },
        }),
      ).rejects.toBeInstanceOf(OptimisticLockConflictError);
    });
  });

  describe('[41 · Cadu] Paginação por cursor na timeline do lead', () => {
    it('pagina eventos com limit=20 default e retorna nextCursor e hasMore determinísticos', async () => {
      const allEvents: LeadTimelineEvent[] = Array.from({ length: 25 }, (_, i) => ({
        id: `evt-${i + 1}`,
        tenantId: 'tenant-a',
        leadId: 'lead-100',
        type: 'CALL',
        summary: `Interação #${i + 1}`,
        createdAt: new Date(Date.now() - i * 60_000),
      }));

      const service = new LeadTimelineService({
        async findManyByCursor({ take, cursorId }) {
          let startIdx = 0;
          if (cursorId) {
            const idx = allEvents.findIndex((e) => e.id === cursorId);
            startIdx = idx >= 0 ? idx + 1 : allEvents.length;
          }
          return allEvents.slice(startIdx, startIdx + take);
        },
      });

      const page1 = await service.getLeadTimelinePage({
        tenantId: 'tenant-a',
        leadId: 'lead-100',
      });
      expect(page1.pageSize).toBe(20);
      expect(page1.items).toHaveLength(20);
      expect(page1.hasMore).toBe(true);
      expect(page1.nextCursor).toBe('evt-20');

      const page2 = await service.getLeadTimelinePage({
        tenantId: 'tenant-a',
        leadId: 'lead-100',
        cursor: page1.nextCursor,
      });
      expect(page2.items).toHaveLength(5);
      expect(page2.hasMore).toBe(false);
      expect(page2.nextCursor).toBeNull();
    });
  });

  describe('[42 · Lívia] Rollback automático da UI no Kanban comercial', () => {
    it('reverte o card para o estágio original e exibe alerta caso a API falhe', async () => {
      const onPersistStageMove = vi.fn().mockRejectedValueOnce(new Error('Erro 500 ao salvar etapa'));

      render(
        <KanbanBoard
          initialCards={[
            { id: 'c-1', title: 'Clínica São Lucas', stageId: 'qualificacao', valueCents: 120_000 },
          ]}
          stages={[
            { id: 'qualificacao', name: 'Qualificação' },
            { id: 'proposta', name: 'Proposta' },
          ]}
          onPersistStageMove={onPersistStageMove}
        />,
      );

      const moveBtn = screen.getByRole('button', { name: 'Mover para Proposta' });
      fireEvent.click(moveBtn);

      await waitFor(() => {
        expect(screen.getByTestId('kanban-rollback-alert').textContent).toContain(
          'Erro 500 ao salvar etapa',
        );
      });

      const card = screen.getByTestId('kanban-card-c-1');
      expect(card.getAttribute('data-stage-id')).toBe('qualificacao');
    });
  });

  describe('[44 · Lola] Validação de janela comercial (08:00 às 19:00 no timezone do lead)', () => {
    it('bloqueia disparos na madrugada (03:00 BRT) e permite dentro do horário comercial (14:00 BRT)', () => {
      // 2026-11-20 é Sexta-feira. 06:00 UTC = 03:00 America/Sao_Paulo
      const at3amBrt = new Date('2026-11-20T06:00:00Z');
      const blocked = evaluateCadenceBusinessWindow(at3amBrt, 'America/Sao_Paulo');
      expect(blocked.allowed).toBe(false);
      expect(blocked.localHour).toBe(3);
      expect(blocked.reason).toBe('OUTSIDE_BUSINESS_HOURS');
      expect(blocked.delayMsUntilNextWindow).toBe(5 * 60 * 60 * 1000); // 5 horas até 08:00

      // 17:00 UTC = 14:00 America/Sao_Paulo
      const at2pmBrt = new Date('2026-11-20T17:00:00Z');
      const allowed = evaluateCadenceBusinessWindow(at2pmBrt, 'America/Sao_Paulo');
      expect(allowed.allowed).toBe(true);
      expect(allowed.delayMsUntilNextWindow).toBe(0);
    });
  });

  describe('[46 · Sofia] Forecast preditivo ponderado por probabilidade histórica da etapa', () => {
    it('pondera o pipeline aberto pela taxa real histórica de conversão e soma ao fechado/ganho', () => {
      const forecast = calculateWeightedForecast(
        [
          { id: 'd1', stageId: 'discovery', valueCents: 100_000, status: 'OPEN' },
          { id: 'd2', stageId: 'negotiation', valueCents: 200_000, status: 'OPEN' },
          { id: 'd3', stageId: 'closed', valueCents: 150_000, status: 'WON' },
          { id: 'd4', stageId: 'discovery', valueCents: 90_000, status: 'LOST' },
        ],
        [
          {
            stageId: 'discovery',
            defaultProbability: 0.2,
            historicalEnteredCount: 20,
            historicalWonCount: 5, // 25% real
          },
          {
            stageId: 'negotiation',
            defaultProbability: 0.6,
            historicalEnteredCount: 20,
            historicalWonCount: 15, // 75% real
          },
        ],
      );

      expect(forecast.totalOpenDeals).toBe(2);
      expect(forecast.grossPipelineCents).toBe(300_000);
      // 100_000 * 0.25 + 200_000 * 0.75 = 25_000 + 150_000 = 175_000
      expect(forecast.weightedForecastCents).toBe(175_000);
      expect(forecast.closedWonCents).toBe(150_000);
      expect(forecast.projectedTotalRevenueCents).toBe(325_000);
    });
  });
});
