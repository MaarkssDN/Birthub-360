import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const getMock = vi.fn();
const updateMock = vi.fn();

vi.mock('../../../../src/features/settings/pillarSettings.api.js', () => ({
  pillarSettingsApi: {
    get: (...args: unknown[]) => getMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
  },
}));

import { PillarSettingsPlaceholder } from '../../../../src/features/settings/components/PillarSettingsPlaceholder.js';

const PILLARS: Array<{
  name: string;
  slug: string;
  values: Record<string, unknown>;
  sampleLabel: RegExp;
}> = [
  {
    name: 'Hub Comercial',
    slug: 'hub',
    values: { stagnationDays: 20, requireLossReason: false, dedupCnpj: false },
    sampleLabel: /Tempo Limite de Estagnação/i,
  },
  {
    name: 'Inteligência de Mercado',
    slug: 'market',
    values: { minRevenue: 'R$ 2.000.000', autoEnrich: false, signalAlerts: false },
    sampleLabel: /Faturamento Mínimo/i,
  },
  {
    name: 'Orquestração de Vendas',
    slug: 'sales',
    values: { speedToLeadMin: 8, requireBant: false, dailyTouchesLimit: 15 },
    sampleLabel: /Speed-to-Lead/i,
  },
  {
    name: 'Performance Comercial',
    slug: 'performance',
    values: { benchmarkRate: 22, repScoreActive: false, anomalyAlerts: false },
    sampleLabel: /Benchmark de Conversão/i,
  },
  {
    name: 'Previsibilidade Comercial',
    slug: 'predictability',
    values: { modelType: 'manual', freezeDay: 10, confidenceFactor: 70 },
    sampleLabel: /Dia de Congelamento do Commit Mensal/i,
  },
  {
    name: 'Inteligência Artificial',
    slug: 'ai',
    values: { model: 'GPT-4o', temperature: 0.5, piiMasking: false },
    sampleLabel: /Modelo de IA Ativo/i,
  },
  {
    name: 'Automação & Conectividade',
    slug: 'automation',
    values: { biDirectional: false, syncIntervalMin: 15, retryCount: 5 },
    sampleLabel: /Tentativas de Reenvio/i,
  },
  {
    name: 'Engajamento Comercial',
    slug: 'engagement',
    values: { clickToCall: false, recordCalls: false, workingHoursOnly: false },
    sampleLabel: /Click-to-Call/i,
  },
];

describe('PillarSettingsPlaceholder — todos os pilares e estados', () => {
  beforeEach(() => {
    getMock.mockReset();
    updateMock.mockReset();
  });

  it('mostra erro honesto para pilar não reconhecido e mantém Salvar desabilitado', async () => {
    render(<PillarSettingsPlaceholder pillarName="Pilar Inventado" />);
    expect(await screen.findByText(/Pilar de configurações não reconhecido/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salvar/i })).toBeDisabled();
    expect(getMock).not.toHaveBeenCalled();
  });

  it.each(PILLARS)(
    'carrega e salva o pilar $name',
    async ({ name, slug, values, sampleLabel }) => {
      getMock.mockResolvedValue({
        pillar: slug,
        values,
        configured: true,
        updatedAt: '2026-11-11T12:00:00.000Z',
      });
      updateMock.mockResolvedValue({
        pillar: slug,
        values,
        configured: true,
        updatedAt: '2026-11-11T13:00:00.000Z',
      });

      render(<PillarSettingsPlaceholder pillarName={name} />);

      await waitFor(() => expect(getMock).toHaveBeenCalledWith(slug));
      expect(await screen.findByText(sampleLabel)).toBeInTheDocument();

      const saveBtn = screen.getByRole('button', { name: /Salvar/i });
      await waitFor(() => expect(saveBtn).toBeEnabled());
      fireEvent.click(saveBtn);

      await waitFor(() => expect(updateMock).toHaveBeenCalledWith(slug, values));
      expect(await screen.findByText(/^Salvo$/i)).toBeInTheDocument();
    },
  );

  it('usa fallbacks quando o payload vem com tipos inesperados e cobre erro de save', async () => {
    getMock.mockResolvedValue({
      pillar: 'hub',
      values: { stagnationDays: 'x', requireLossReason: 'x', dedupCnpj: 1 },
      configured: false,
      updatedAt: null,
    });
    updateMock.mockRejectedValueOnce(new Error('API request failed with status 403'));

    render(<PillarSettingsPlaceholder pillarName="Hub Comercial" />);
    const saveBtn = await screen.findByRole('button', { name: /Salvar/i });
    await waitFor(() => expect(saveBtn).toBeEnabled());
    expect(screen.getByDisplayValue('14')).toBeInTheDocument();

    fireEvent.click(saveBtn);
    expect(await screen.findByText(/status 403/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Falha ao salvar/i).length).toBeGreaterThan(0);
  });

  it('normaliza erro de save que não é Error e erro de load que não é Error', async () => {
    getMock.mockRejectedValueOnce('falha crua');
    render(<PillarSettingsPlaceholder pillarName="Hub Comercial" />);
    expect(await screen.findByText(/Falha ao carregar configurações/i)).toBeInTheDocument();
  });

  it('alterna as abas visuais e desabilita Salvar fora de Ferramentas & Regras', async () => {
    getMock.mockResolvedValue({
      pillar: 'hub',
      values: { stagnationDays: 14, requireLossReason: true, dedupCnpj: true },
      configured: true,
      updatedAt: '2026-11-11T12:00:00.000Z',
    });
    render(<PillarSettingsPlaceholder pillarName="Hub Comercial" />);
    const saveBtn = await screen.findByRole('button', { name: /Salvar/i });
    await waitFor(() => expect(saveBtn).toBeEnabled());

    fireEvent.click(screen.getByRole('button', { name: /Permissões & Acesso/i }));
    expect(screen.getByText(/Controle de Acesso Modular/i)).toBeInTheDocument();
    expect(saveBtn).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Gatilhos & Automações/i }));
    expect(screen.getByText(/Gatilhos & Eventos do Pilar/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Conexões & Dados/i }));
    expect(screen.getByText(/Conexões de Dados & APIs/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Ferramentas & Regras/i }));
    await waitFor(() => expect(saveBtn).toBeEnabled());
  });

  it('permite editar um campo numérico antes de salvar', async () => {
    getMock.mockResolvedValue({
      pillar: 'hub',
      values: { stagnationDays: 14, requireLossReason: true, dedupCnpj: true },
      configured: true,
      updatedAt: null,
    });
    updateMock.mockResolvedValue({
      pillar: 'hub',
      values: { stagnationDays: 40, requireLossReason: true, dedupCnpj: true },
      configured: true,
      updatedAt: '2026-11-11T14:00:00.000Z',
    });
    render(<PillarSettingsPlaceholder pillarName="Hub Comercial" />);
    const input = await screen.findByDisplayValue('14');
    fireEvent.change(input, { target: { value: '40' } });
    fireEvent.click(screen.getByRole('button', { name: /Salvar/i }));
    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith(
        'hub',
        expect.objectContaining({ stagnationDays: 40 }),
      ),
    );
  });
});
