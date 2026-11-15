import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { OPEN_COMMAND_PALETTE_EVENT } from '@/lib/paletteIntent';

const apiGet = vi.fn();
const navigateMock = vi.fn();

vi.mock('@/lib/api.js', () => ({
  api: { get: (...args: unknown[]) => apiGet(...args) },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: { play: vi.fn(), isEnabled: vi.fn(() => true) },
}));

function renderPalette() {
  return render(
    <MemoryRouter>
      <CommandPalette />
    </MemoryRouter>,
  );
}

function openWithCtrlK() {
  fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
}

beforeEach(() => {
  apiGet.mockResolvedValue({ data: [] });
});

afterEach(() => {
  cleanup();
  apiGet.mockReset();
  navigateMock.mockReset();
});

describe('CommandPalette', () => {
  it('permanece fechado até Ctrl+K e abre com role=dialog acessível', () => {
    renderPalette();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    openWithCtrlK();
    const dialog = screen.getByRole('dialog', { name: 'Command palette' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByPlaceholderText(/Buscar empresa/)).toBeInTheDocument();
  });

  it('também abre via evento OPEN_COMMAND_PALETTE_EVENT e fecha com Escape', () => {
    renderPalette();
    act(() => {
      window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT));
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Ctrl+K alterna (abre e fecha)', () => {
    renderPalette();
    openWithCtrlK();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    openWithCtrlK();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('filtra ações rápidas por texto e navega ao confirmar com Enter', async () => {
    renderPalette();
    openWithCtrlK();
    const input = screen.getByPlaceholderText(/Buscar empresa/);

    fireEvent.change(input, { target: { value: 'atividade' } });
    await waitFor(() =>
      expect(screen.getByText('Criar nova atividade')).toBeInTheDocument(),
    );

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(navigateMock).toHaveBeenCalledWith(
      '/app/activities',
      expect.objectContaining({ state: { type: 'open-create' } }),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('setas movem a seleção e Enter aciona o item ativo', async () => {
    renderPalette();
    openWithCtrlK();
    const input = screen.getByPlaceholderText(/Buscar empresa/);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    // Dois ArrowDown a partir do índice 0 → índice 2 = "Abrir Relatórios de IA".
    expect(navigateMock).toHaveBeenCalledWith('/app/reports', undefined);
  });

  it('busca empresas/contatos via API após debounce e exibe resultados', async () => {
    apiGet.mockImplementation((url: string) => {
      if (url.includes('/api/companies')) {
        return Promise.resolve({
          data: [{ id: 'c1', tradeName: 'Acme Corp', legalName: 'Acme LTDA', city: 'SP', state: 'SP' }],
        });
      }
      return Promise.resolve({ data: [{ id: 'p1', name: 'João Silva', role: 'CEO' }] });
    });

    renderPalette();
    openWithCtrlK();
    const input = screen.getByPlaceholderText(/Buscar empresa/);
    fireEvent.change(input, { target: { value: 'acme' } });

    await waitFor(() => expect(apiGet).toHaveBeenCalled(), { timeout: 2000 });
    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument(), {
      timeout: 2000,
    });
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(apiGet).toHaveBeenCalledWith(expect.stringContaining('/api/companies?q=acme'));
  });

  it('exibe empty state quando a busca não retorna nada', async () => {
    renderPalette();
    openWithCtrlK();
    const input = screen.getByPlaceholderText(/Buscar empresa/);
    fireEvent.change(input, { target: { value: 'zzzz' } });

    // Ações rápidas são filtradas por similaridade de texto — 'zzzz' não casa nada.
    await waitFor(() => expect(screen.getByText(/Nenhum resultado/)).toBeInTheDocument(), {
      timeout: 2000,
    });
  });
});
