// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  PillarToolsForms,
  type PillarToolsFormsProps,
} from '../../../../src/features/settings/components/PillarToolsForms.js';

/**
 * PillarToolsForms.tsx é a aba "Ferramentas & Regras" de cada pilar de settings,
 * extraída de PillarSettingsPlaceholder.tsx no saneamento de hotspot (Onda F1).
 * Componente puramente apresentacional: cada `case` do switch por `pillarName`
 * renderiza Inputs/checkboxes/selects que despacham para os setters do pai.
 * Este teste renderiza os 8 pilares + o fallback e dispara TODOS os controles,
 * garantindo que nenhum handler/branch novo fique sem cobertura.
 */

function makeProps(pillarName: string): PillarToolsFormsProps {
  return {
    pillarName,
    // Hub Comercial
    hubStagnationDays: 15,
    setHubStagnationDays: vi.fn(),
    hubRequireLossReason: false,
    setHubRequireLossReason: vi.fn(),
    hubDedupCnpj: true,
    setHubDedupCnpj: vi.fn(),
    // Inteligência de Mercado
    marketMinRevenue: 'R$ 5MM',
    setMarketMinRevenue: vi.fn(),
    marketAutoEnrich: false,
    setMarketAutoEnrich: vi.fn(),
    marketSignalAlerts: true,
    setMarketSignalAlerts: vi.fn(),
    // Orquestração de Vendas
    salesSpeedToLead: 30,
    setSalesSpeedToLead: vi.fn(),
    salesRequireBant: false,
    setSalesRequireBant: vi.fn(),
    salesDailyTouchesLimit: 20,
    setSalesDailyTouchesLimit: vi.fn(),
    // Performance Comercial
    perfBenchmarkRate: 25,
    setPerfBenchmarkRate: vi.fn(),
    perfRepScoreActive: true,
    setPerfRepScoreActive: vi.fn(),
    perfAnomalyAlerts: false,
    setPerfAnomalyAlerts: vi.fn(),
    // Previsibilidade Comercial
    predModelType: 'historico',
    setPredModelType: vi.fn(),
    predFreezeDay: 25,
    setPredFreezeDay: vi.fn(),
    predConfidenceFactor: 60,
    setPredConfidenceFactor: vi.fn(),
    // Inteligência Artificial
    aiModel: 'Claude 3.5 Sonnet',
    setAiModel: vi.fn(),
    aiTemperature: 0.3,
    setAiTemperature: vi.fn(),
    aiPiiMasking: true,
    setAiPiiMasking: vi.fn(),
    // Automação & Conectividade
    autoBiDirectional: false,
    setAutoBiDirectional: vi.fn(),
    autoSyncInterval: 15,
    setAutoSyncInterval: vi.fn(),
    autoRetryCount: 3,
    setAutoRetryCount: vi.fn(),
    // Engajamento Comercial
    engClickToCall: true,
    setEngClickToCall: vi.fn(),
    engRecordCalls: false,
    setEngRecordCalls: vi.fn(),
    engWorkingHoursOnly: true,
    setEngWorkingHoursOnly: vi.fn(),
  };
}

const renderPillar = (pillarName: string) => {
  const props = makeProps(pillarName);
  const utils = render(<PillarToolsForms {...props} />);
  return { props, ...utils };
};

describe('PillarToolsForms', () => {
  it('Hub Comercial: renderiza regras de governança e dispara setters numéricos e de checkbox', () => {
    const { props, container } = renderPillar('Hub Comercial');

    expect(screen.getByText('Regras de Governança do Pipeline (CRM)')).toBeInTheDocument();

    const numberInput = container.querySelector('input[type="number"]') as HTMLInputElement;
    expect(numberInput.value).toBe('15');
    fireEvent.change(numberInput, { target: { value: '30' } });
    expect(props.setHubStagnationDays).toHaveBeenCalledWith(30);

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes).toHaveLength(2);
    fireEvent.click(checkboxes[0]);
    expect(props.setHubRequireLossReason).toHaveBeenCalledWith(true);
    fireEvent.click(checkboxes[1]);
    expect(props.setHubDedupCnpj).toHaveBeenCalledWith(false);
  });

  it('Inteligência de Mercado: renderiza critérios de ICP e dispara setters', () => {
    const { props, container } = renderPillar('Inteligência de Mercado');

    expect(screen.getByText('Critérios e Enriquecimento de ICP')).toBeInTheDocument();

    const textInput = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(textInput.value).toBe('R$ 5MM');
    fireEvent.change(textInput, { target: { value: 'R$ 10MM' } });
    expect(props.setMarketMinRevenue).toHaveBeenCalledWith('R$ 10MM');

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes).toHaveLength(2);
    fireEvent.click(checkboxes[0]);
    expect(props.setMarketAutoEnrich).toHaveBeenCalledWith(true);
    fireEvent.click(checkboxes[1]);
    expect(props.setMarketSignalAlerts).toHaveBeenCalledWith(false);
  });

  it('Orquestração de Vendas: renderiza SLAs de execução e dispara setters', () => {
    const { props, container } = renderPillar('Orquestração de Vendas');

    expect(screen.getByText('SLAs de Execução & Cadência de Vendas')).toBeInTheDocument();

    const numberInputs = container.querySelectorAll('input[type="number"]');
    expect(numberInputs).toHaveLength(2);
    fireEvent.change(numberInputs[0], { target: { value: '45' } });
    expect(props.setSalesSpeedToLead).toHaveBeenCalledWith(45);
    fireEvent.change(numberInputs[1], { target: { value: '10' } });
    expect(props.setSalesDailyTouchesLimit).toHaveBeenCalledWith(10);

    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(props.setSalesRequireBant).toHaveBeenCalledWith(true);
  });

  it('Performance Comercial: renderiza benchmarks de funil e dispara setters', () => {
    const { props, container } = renderPillar('Performance Comercial');

    expect(screen.getByText('Métricas de Eficiência & Benchmarks de Funil')).toBeInTheDocument();

    const numberInput = container.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(numberInput, { target: { value: '40' } });
    expect(props.setPerfBenchmarkRate).toHaveBeenCalledWith(40);

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes).toHaveLength(2);
    fireEvent.click(checkboxes[0]);
    expect(props.setPerfRepScoreActive).toHaveBeenCalledWith(false);
    fireEvent.click(checkboxes[1]);
    expect(props.setPerfAnomalyAlerts).toHaveBeenCalledWith(true);
  });

  it('Previsibilidade Comercial: renderiza modelo preditivo, select de método e números', () => {
    const { props, container } = renderPillar('Previsibilidade Comercial');

    expect(screen.getByText('Modelo Preditivo & Travas de Forecast')).toBeInTheDocument();

    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('historico');
    fireEvent.change(select, { target: { value: 'manual' } });
    expect(props.setPredModelType).toHaveBeenCalledWith('manual');

    const numberInputs = container.querySelectorAll('input[type="number"]');
    expect(numberInputs).toHaveLength(2);
    fireEvent.change(numberInputs[0], { target: { value: '10' } });
    expect(props.setPredFreezeDay).toHaveBeenCalledWith(10);
    fireEvent.change(numberInputs[1], { target: { value: '80' } });
    expect(props.setPredConfidenceFactor).toHaveBeenCalledWith(80);
  });

  it('Inteligência Artificial: renderiza motor cognitivo, select de modelo, slider e PII', () => {
    const { props, container } = renderPillar('Inteligência Artificial');

    expect(screen.getByText('Motor Cognitivo & Guardrails de Segurança')).toBeInTheDocument();
    expect(screen.getByText(/Temperatura de Inferência \(0\.3\)/)).toBeInTheDocument();

    const select = container.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'GPT-4o' } });
    expect(props.setAiModel).toHaveBeenCalledWith('GPT-4o');

    const range = container.querySelector('input[type="range"]') as HTMLInputElement;
    fireEvent.change(range, { target: { value: '0.7' } });
    expect(props.setAiTemperature).toHaveBeenCalledWith(0.7);

    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(props.setAiPiiMasking).toHaveBeenCalledWith(false);
  });

  it('Automação & Conectividade: renderiza sync/webhooks e dispara setters', () => {
    const { props, container } = renderPillar('Automação & Conectividade');

    expect(screen.getByText('Sincronização de Dados & Webhooks')).toBeInTheDocument();

    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(props.setAutoBiDirectional).toHaveBeenCalledWith(true);

    const numberInputs = container.querySelectorAll('input[type="number"]');
    expect(numberInputs).toHaveLength(2);
    fireEvent.change(numberInputs[0], { target: { value: '60' } });
    expect(props.setAutoSyncInterval).toHaveBeenCalledWith(60);
    fireEvent.change(numberInputs[1], { target: { value: '5' } });
    expect(props.setAutoRetryCount).toHaveBeenCalledWith(5);
  });

  it('Engajamento Comercial: renderiza telefonia/WhatsApp e dispara os 3 checkboxes', () => {
    const { props, container } = renderPillar('Engajamento Comercial');

    expect(screen.getByText('Telefonia PABX & Disparo de WhatsApp')).toBeInTheDocument();

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes).toHaveLength(3);
    fireEvent.click(checkboxes[0]);
    expect(props.setEngClickToCall).toHaveBeenCalledWith(false);
    fireEvent.click(checkboxes[1]);
    expect(props.setEngRecordCalls).toHaveBeenCalledWith(true);
    fireEvent.click(checkboxes[2]);
    expect(props.setEngWorkingHoursOnly).toHaveBeenCalledWith(false);
  });

  it('pilar desconhecido cai no card genérico de parâmetros', () => {
    renderPillar('Pilar Inexistente');

    expect(
      screen.getByText('Parâmetros Gerais do Pilar (Pilar Inexistente)'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Módulo configurado de acordo com as diretrizes do Birth Hub 360/),
    ).toBeInTheDocument();
  });
});
