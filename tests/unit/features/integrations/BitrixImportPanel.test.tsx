// @vitest-environment jsdom

/**
 * Cobre `BitrixImportPanel.tsx` após a decomposição da TAREFA-SANEAMENTO-004
 * (BT360-DT-0030): container + componentes em `components/bitrixImport/`.
 * Garante não-regressão do fluxo principal — listagem de negócios, seleção,
 * importação em lote (sucesso e falha) e erro de carga.
 */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getMock = vi.fn();
const postMock = vi.fn();
const putMock = vi.fn();

vi.mock('../../../../src/lib/api.js', () => ({
  api: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args),
    put: (...args: unknown[]) => putMock(...args),
  },
  invalidateInFlightGetCache: vi.fn(),
}));

vi.mock('../../../../src/contexts/AuthContext.js', () => ({
  useAuth: () => ({ currentUser: { role: 'ADMIN' } }),
}));

import { BitrixImportPanel } from '../../../../src/features/integrations/components/BitrixImportPanel.js';

const CONNECTION_ID = 'conn-1';

const DEAL = {
  id: 'deal-1',
  title: 'Oportunidade Atlas',
  stageLabel: 'Proposta',
  assignedById: null,
  dateCreate: '2026-11-01T10:00:00.000Z',
  opportunity: '15000',
  alreadyImported: false,
};

function mockGetRoutes(overrides: Record<string, unknown> = {}) {
  getMock.mockImplementation((url: string) => {
    if (url.includes('/api/bitrix/deal-pipelines')) return Promise.resolve([]);
    if (url.includes('/api/bitrix/users')) return Promise.resolve([]);
    if (url.includes('/api/bitrix/fields')) return Promise.resolve([]);
    if (url.includes('/api/bitrix/deals')) {
      return Promise.resolve({
        data: { deals: [DEAL], next: null, total: 1 },
        meta: { restricted: false },
      });
    }
    if (url in overrides) return Promise.resolve(overrides[url]);
    return Promise.reject(new Error(`rota não mockada: ${url}`));
  });
}

beforeEach(() => {
  getMock.mockReset();
  postMock.mockReset();
  putMock.mockReset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('BitrixImportPanel (pós-decomposição TAREFA-SANEAMENTO-004)', () => {
  it('lista negócios do Bitrix e permite selecionar para importação', async () => {
    mockGetRoutes();
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);

    expect(await screen.findByText('Oportunidade Atlas')).toBeTruthy();
    expect(screen.getByText('Importador Inteligente Bitrix24')).toBeTruthy();

    fireEvent.click(screen.getByRole('checkbox'));
    expect(await screen.findByText('1 selecionado(s)')).toBeTruthy();
    expect(screen.getByText(/Total Selecionado: R\$ 15\.000/)).toBeTruthy();
  });

  it('importa selecionados com sucesso e exibe o resultado', async () => {
    mockGetRoutes();
    postMock.mockResolvedValue({
      imported: 1,
      skipped: 0,
      skippedConflicts: 0,
      skippedNotOwned: 0,
      failed: 0,
      importedLeadIds: [],
    });
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);

    fireEvent.click(await screen.findByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Importar \(1\)/ }));

    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith(
        '/api/bitrix/deals/import',
        { connectionId: CONNECTION_ID, bitrixDealIds: ['deal-1'] },
        { timeoutMs: 90_000 },
      ),
    );
    expect(await screen.findByText(/1 registro\(s\) importado\(s\) com sucesso/)).toBeTruthy();
  });

  it('exibe erro explícito quando a importação falha', async () => {
    mockGetRoutes();
    postMock.mockRejectedValue(new Error('Bitrix indisponível'));
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);

    fireEvent.click(await screen.findByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Importar \(1\)/ }));

    expect(await screen.findByText('Bitrix indisponível')).toBeTruthy();
  });

  it('exibe erro quando a carga inicial falha', async () => {
    getMock.mockImplementation((url: string) => {
      if (url.includes('/api/bitrix/deals')) return Promise.reject(new Error('HTTP 500'));
      if (url.includes('/api/bitrix/deal-pipelines')) return Promise.resolve([]);
      if (url.includes('/api/bitrix/users')) return Promise.resolve([]);
      if (url.includes('/api/bitrix/fields')) return Promise.resolve([]);
      return Promise.resolve([]);
    });
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);

    expect(await screen.findByText('HTTP 500')).toBeTruthy();
  });
});
