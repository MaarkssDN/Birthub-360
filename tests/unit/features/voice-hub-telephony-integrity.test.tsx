// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import DashboardTelephony from '@/features/voice-hub/pages/Dashboard/Telephony.js';

describe.each([
  ['Dashboard', DashboardTelephony],
] as const)('%s telephony data integrity', (_label, Page) => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('never presents invented DID prices, active numbers or provider connections as tenant data', () => {
    render(<Page />);

    expect(screen.getByText(/Nenhuma disponibilidade ou tarifa foi consultada/)).toBeTruthy();
    expect(screen.getByText(/Inventário de números ainda não integrado/)).toBeTruthy();
    expect(screen.getByText(/Esta tela não consulta nem altera essas políticas/)).toBeTruthy();
    expect(screen.getByText(/Nenhuma conexão será criada aqui/)).toBeTruthy();

    expect(screen.queryByText('R$ 15,00/mês')).not.toBeTruthy();
    expect(screen.queryByText('+55 11 4004-9999')).not.toBeTruthy();
    expect(screen.queryByText('+55 11 99999-0000')).not.toBeTruthy();
    expect(screen.queryByText('Ativo')).not.toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Buscar' })).not.toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Configurar Tronco' })).not.toBeTruthy();
  });

  it('keeps music generation available and shows provider failures without fabricating audio', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Consentimento necessário' }),
    } as Response);

    render(<Page />);
    fireEvent.click(screen.getByRole('button', { name: /Gerar Música \(30s\)/ }));

    expect(await screen.findByText('Consentimento necessário')).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith(
      '/api/generate-music',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(screen.queryByRole('audio')).not.toBeTruthy();
  });
});
