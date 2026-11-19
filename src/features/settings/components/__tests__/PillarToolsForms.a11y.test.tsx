// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PillarToolsForms, type PillarToolsFormsProps } from '../PillarToolsForms.js';

/**
 * Regressão Onda 1 (A1): controles sem nome acessível geravam violações axe críticas
 * `label` / `select-name` em /app/settings/pillars/*. Cada controle deve expor nome acessível.
 */
const noop = vi.fn();
const props = {
  hubStagnationDays: 7, setHubStagnationDays: noop,
  hubRequireLossReason: true, setHubRequireLossReason: noop,
  hubDedupCnpj: true, setHubDedupCnpj: noop,
  marketMinRevenue: '1000000', setMarketMinRevenue: noop,
  marketAutoEnrich: true, setMarketAutoEnrich: noop,
  marketSignalAlerts: true, setMarketSignalAlerts: noop,
  salesSpeedToLead: 5, setSalesSpeedToLead: noop,
  salesRequireBant: true, setSalesRequireBant: noop,
  salesDailyTouchesLimit: 40, setSalesDailyTouchesLimit: noop,
  perfBenchmarkRate: 10, setPerfBenchmarkRate: noop,
  perfRepScoreActive: true, setPerfRepScoreActive: noop,
  perfAnomalyAlerts: true, setPerfAnomalyAlerts: noop,
  predModelType: 'historico', setPredModelType: noop,
  predFreezeDay: 25, setPredFreezeDay: noop,
  predConfidenceFactor: 80, setPredConfidenceFactor: noop,
  aiModel: 'GPT-4o', setAiModel: noop,
  aiTemperature: 0.3, setAiTemperature: noop,
  aiPiiMasking: true, setAiPiiMasking: noop,
  autoBiDirectional: true, setAutoBiDirectional: noop,
  autoSyncInterval: 5, setAutoSyncInterval: noop,
  autoRetryCount: 3, setAutoRetryCount: noop,
  engClickToCall: true, setEngClickToCall: noop,
  engRecordCalls: true, setEngRecordCalls: noop,
  engWorkingHoursOnly: true, setEngWorkingHoursOnly: noop,
} satisfies Omit<PillarToolsFormsProps, 'pillarName'>;

const PILLARS = [
  'Hub Comercial',
  'Inteligência de Mercado',
  'Orquestração de Vendas',
  'Performance Comercial',
  'Previsibilidade Comercial',
  'Inteligência Artificial',
  'Automação & Conectividade',
  'Engajamento Comercial',
];

describe('PillarToolsForms — nome acessível dos controles', () => {
  afterEach(cleanup);

  it.each(PILLARS)('%s: todo input/select tem nome acessível', (pillarName) => {
    const { container } = render(<PillarToolsForms pillarName={pillarName} {...props} />);
    const controls = Array.from(container.querySelectorAll('input, select'));
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expect(control.getAttribute('aria-label')?.trim(), control.outerHTML.slice(0, 80)).toBeTruthy();
    }
  });

  it('expõe os controles pelo papel e nome acessível', () => {
    render(<PillarToolsForms pillarName="Inteligência Artificial" {...props} />);
    expect(screen.getByRole('combobox', { name: 'Modelo de IA Ativo para Vendas' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Temperatura de Inferência' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Mascaramento de PII/ })).toBeInTheDocument();
  });
});
