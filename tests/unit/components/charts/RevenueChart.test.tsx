// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  areRevenueChartPropsEqual,
  computeNormalizedRevenueDataset,
  RevenueChart,
  type RevenueDataPoint,
} from '../../../../src/components/charts/RevenueChart.js';

describe('[38 · Nara] RevenueChart — Memoização com React.memo e dataset normalizado', () => {
  const sampleData: RevenueDataPoint[] = [
    { period: '2026-09', revenue: 100000, target: 90000 },
    { period: '2026-10', revenue: 150000, target: 120000 },
    { period: '2026-11', revenue: 200000, target: 180000 },
  ];

  it('normaliza e agrega corretamente o dataset de receita', () => {
    const summary = computeNormalizedRevenueDataset(sampleData);
    expect(summary.totalRevenue).toBe(450000);
    expect(summary.totalTarget).toBe(390000);
    expect(summary.maxRevenue).toBe(200000);
    expect(summary.points.map((p) => p.percentOfMax)).toEqual([50, 75, 100]);
  });

  it('areRevenueChartPropsEqual evita re-render quando ticks de WebSocket enviam array clonado com mesmos valores', () => {
    const clonedData = sampleData.map((item) => ({ ...item }));
    expect(
      areRevenueChartPropsEqual(
        { data: sampleData, title: 'Receita' },
        { data: clonedData, title: 'Receita' },
      ),
    ).toBe(true);

    const changedData = [
      ...sampleData.slice(0, 2),
      { period: '2026-11', revenue: 250000, target: 180000 },
    ];
    expect(
      areRevenueChartPropsEqual(
        { data: sampleData, title: 'Receita' },
        { data: changedData, title: 'Receita' },
      ),
    ).toBe(false);
  });

  it('não re-renderiza o componente em re-renders do pai quando os pontos de dados permanecem idênticos', () => {
    const onRenderTick = vi.fn();
    const { rerender } = render(
      <RevenueChart data={sampleData} title="Receita Mensal" onRenderTick={onRenderTick} />,
    );
    expect(onRenderTick).toHaveBeenCalledTimes(1);

    // Simula tick de WebSocket criando nova referência de array com o mesmo conteúdo
    const clonedTickData = sampleData.map((d) => ({ ...d }));
    rerender(
      <RevenueChart data={clonedTickData} title="Receita Mensal" onRenderTick={onRenderTick} />,
    );
    expect(onRenderTick).toHaveBeenCalledTimes(1);

    // Mudança real de valor dispara novo render
    const updatedTickData = [
      ...sampleData.slice(0, 2),
      { period: '2026-11', revenue: 220000, target: 180000 },
    ];
    rerender(
      <RevenueChart data={updatedTickData} title="Receita Mensal" onRenderTick={onRenderTick} />,
    );
    expect(onRenderTick).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('revenue-chart')).toBeDefined();
  });
});
