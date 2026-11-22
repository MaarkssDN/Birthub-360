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

function renderPaletteAt(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
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
    renderPaletteAt();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    openWithCtrlK();
    const dialog = screen.getByRole('dialog', { name: 'Command palette' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByPlaceholderText(/Buscar empresa/)).toBeInTheDocument();
  });

  it('também abre via evento OPEN_COMMAND_PALETTE_EVENT e fecha com Escape', () => {
    renderPaletteAt();
    act(() => {
      window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT));
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Ctrl+K alterna (abre e fecha)', () => {
    renderPaletteAt();
    openWithCtrlK();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    openWithCtrlK();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('filtra ações rápidas por texto e navega ao confirmar com Enter', async () => {
    renderPaletteAt();
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
    renderPaletteAt();
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

    renderPaletteAt();
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
    renderPaletteAt();
    openWithCtrlK();
    const input = screen.getByPlaceholderText(/Buscar empresa/);
    fireEvent.change(input, { target: { value: 'zzzz' } });

    // Ações rápidas são filtradas por similaridade de texto — 'zzzz' não casa nada.
    await waitFor(() => expect(screen.getByText(/Nenhum resultado/)).toBeInTheDocument(), {
      timeout: 2000,
    });
  });

  describe('grupo "Nesta página" (MEL-35)', () => {
    it('em /app/crm oferece ações da página e navegação para empresas/contatos', () => {
      renderPaletteAt('/app/crm');
      openWithCtrlK();

      expect(screen.getByText('Nesta página')).toBeInTheDocument();
      // "Nova oportunidade" foi removida de propósito (commit 3356c2e6): /app/crm (CrmBoard) não
      // consome o intent open-create, então a ação era um no-op silencioso. Não deve reaparecer
      // antes de existir um fluxo real de criação.
      expect(screen.queryByText('Nova oportunidade')).not.toBeInTheDocument();
      expect(screen.getByText('Ir para empresas')).toBeInTheDocument();
      expect(screen.getByText('Ir para contatos')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Ir para empresas'));
      expect(navigateMock).toHaveBeenCalledWith('/app/companies', undefined);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('em /app/companies oferece "Nova empresa" contextual e ir para contatos', () => {
      renderPaletteAt('/app/companies');
      openWithCtrlK();

      expect(screen.getByText('Nesta página')).toBeInTheDocument();
      expect(screen.getAllByText('Nova empresa').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Ir para contatos')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Ir para contatos'));
      expect(navigateMock).toHaveBeenCalledWith('/app/contacts', undefined);
    });

    it('em /app/activities oferece "Criar nova atividade" contextual', () => {
      renderPaletteAt('/app/activities');
      openWithCtrlK();

      expect(screen.getByText('Nesta página')).toBeInTheDocument();
      expect(screen.getAllByText('Criar nova atividade').length).toBeGreaterThanOrEqual(2);
    });

    it('em /app/settings oferece voltar ao dashboard e abrir integrações', () => {
      renderPaletteAt('/app/settings');
      openWithCtrlK();

      expect(screen.getByText('Nesta página')).toBeInTheDocument();
      expect(screen.getByText('Voltar ao dashboard')).toBeInTheDocument();
      expect(screen.getByText('Abrir integrações')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Abrir integrações'));
      expect(navigateMock).toHaveBeenCalledWith('/app/integrations', undefined);
    });

    it('em /app/usage (ADMIN-only) só oferece "Voltar ao dashboard", sem ação de módulo', () => {
      renderPaletteAt('/app/usage');
      openWithCtrlK();

      expect(screen.getByText('Nesta página')).toBeInTheDocument();
      expect(screen.getByText('Voltar ao dashboard')).toBeInTheDocument();
      // Nenhuma ação de módulo/contextual além da navegação segura.
      expect(screen.queryByText('Ir para empresas')).not.toBeInTheDocument();
      expect(screen.queryByText('Ir para contatos')).not.toBeInTheDocument();
      expect(screen.queryByText('Abrir integrações')).not.toBeInTheDocument();
    });

    it('em rota sem mapeamento (/app/knowledge) o grupo "Nesta página" não aparece', () => {
      renderPaletteAt('/app/knowledge');
      openWithCtrlK();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.queryByText('Nesta página')).not.toBeInTheDocument();
    });

    it('o filtro por texto continua valendo para itens contextuais', async () => {
      renderPaletteAt('/app/crm');
      openWithCtrlK();
      const input = screen.getByPlaceholderText(/Buscar empresa/);

      fireEvent.change(input, { target: { value: 'contatos' } });
      await waitFor(() => expect(screen.getByText('Ir para contatos')).toBeInTheDocument());
      expect(screen.queryByText('Ir para empresas')).not.toBeInTheDocument();
    });
  });
});
