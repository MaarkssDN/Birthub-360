// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

const getMock = vi.fn();
const updateMock = vi.fn();

vi.mock('../../../../src/features/settings/pillarSettings.api.js', () => ({
  pillarSettingsApi: {
    get: (...args: unknown[]) => getMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
  },
}));

import { PillarSettingsPlaceholder } from '../../../../src/features/settings/components/PillarSettingsPlaceholder.js';

const SAVED_VIEW = {
  pillar: 'hub',
  values: { stagnationDays: 30, requireLossReason: false, dedupCnpj: true },
  configured: true,
  updatedAt: '2026-11-11T12:00:00.000Z',
};

describe('PillarSettingsPlaceholder — persistência real (Onda F1)', () => {
  beforeEach(() => {
    getMock.mockReset();
    updateMock.mockReset();
    getMock.mockResolvedValue(SAVED_VIEW);
    updateMock.mockResolvedValue({ ...SAVED_VIEW, updatedAt: '2026-11-11T13:00:00.000Z' });
  });

  it('carrega configurações persistidas do endpoint e habilita Salvar', async () => {
    render(<PillarSettingsPlaceholder pillarName="Hub Comercial" />);

    await waitFor(() => expect(getMock).toHaveBeenCalledWith('hub'));

    const stagnationInput = await screen.findByDisplayValue('30');
    expect(stagnationInput).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /Salvar/i });
    await waitFor(() => expect(saveBtn).toBeEnabled());
  });

  it('PUT envia os valores do pilar para /api/settings/pillars/hub', async () => {
    render(<PillarSettingsPlaceholder pillarName="Hub Comercial" />);

    const saveBtn = await screen.findByRole('button', { name: /Salvar/i });
    await waitFor(() => expect(saveBtn).toBeEnabled());

    fireEvent.click(saveBtn);

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith('hub', {
        stagnationDays: 30,
        requireLossReason: false,
        dedupCnpj: true,
      }),
    );
  });

  it('exibe erro honesto quando o carregamento falha e mantém Salvar desabilitado', async () => {
    getMock.mockRejectedValue(new Error('API request failed with status 500'));
    render(<PillarSettingsPlaceholder pillarName="Hub Comercial" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/carregar/i);
    expect(screen.getByRole('button', { name: /Salvar/i })).toBeDisabled();
  });
});
