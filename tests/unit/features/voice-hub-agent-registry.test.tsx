// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DashboardAgentRegistry from '@/features/voice-hub/pages/Dashboard/AgentRegistry.js';

const agent = {
  id: 'agent-1',
  name: 'Agente Piloto',
  model: 'groq',
  configuration: { description: 'Agente de teste' },
  updatedAt: '2026-10-09T12:00:00Z',
};

function response(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

function show(Page: typeof DashboardAgentRegistry) {
  return render(
    <MemoryRouter>
      <Page />
    </MemoryRouter>,
  );
}

// A cópia em pages/ foi removida (código morto, nunca roteada); fica a de pages/Dashboard/.
describe.each([
  ['Dashboard', DashboardAgentRegistry],
] as const)('%s AgentRegistry', (_label, Page) => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('shows a retryable error, not a fabricated empty list, when loading fails', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(await response({ error: 'unavailable' }, 503))
      .mockResolvedValueOnce(await response({ agents: [agent] }));

    const user = userEvent.setup();
    show(Page);

    expect(await screen.findByText('Não foi possível carregar os agentes de voz.')).toBeTruthy();
    expect(screen.queryByText('Você ainda não criou nenhum agente de voz.')).not.toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('Agente Piloto')).toBeTruthy();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('rejects an unexpected response shape instead of treating it as no agents', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(await response({ message: 'unexpected' }));
    show(Page);

    expect(await screen.findByText('Não foi possível carregar os agentes de voz.')).toBeTruthy();
    expect(screen.queryByText('Nenhum agente encontrado')).not.toBeTruthy();
  });

  it('only shows the real empty state when the API explicitly returns an empty list', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(await response({ agents: [] }));
    show(Page);

    expect(await screen.findByText('Você ainda não criou nenhum agente de voz.')).toBeTruthy();
  });

  it('preserves the agent and explains the error on a failed deletion', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(await response({ agents: [agent] }))
      .mockResolvedValueOnce(await response({ error: 'forbidden' }, 403));
    const user = userEvent.setup();
    show(Page);

    await screen.findByText('Agente Piloto');
    await user.click(screen.getByRole('button', { name: 'Excluir agente Agente Piloto' }));

    expect(await screen.findByText('Não foi possível excluir o agente. Tente novamente.')).toBeTruthy();
    expect(screen.getByText('Agente Piloto')).toBeTruthy();
    expect(fetch).toHaveBeenLastCalledWith('/api/agents/agent-1', { method: 'DELETE' });
  });

  it('does not remove an agent when the server fails to confirm success', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(await response({ agents: [agent] }))
      .mockResolvedValueOnce(await response({ success: false }));
    const user = userEvent.setup();
    show(Page);

    await screen.findByText('Agente Piloto');
    await user.click(screen.getByRole('button', { name: 'Excluir agente Agente Piloto' }));

    expect(await screen.findByText('Não foi possível excluir o agente. Tente novamente.')).toBeTruthy();
    expect(screen.getByText('Agente Piloto')).toBeTruthy();
  });

  it('removes the agent only after the server confirms successful deletion', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(await response({ agents: [agent] }))
      .mockResolvedValueOnce(await response({ success: true }));
    const user = userEvent.setup();
    show(Page);

    await screen.findByText('Agente Piloto');
    await user.click(screen.getByRole('button', { name: 'Excluir agente Agente Piloto' }));

    expect(await screen.findByText('Você ainda não criou nenhum agente de voz.')).toBeTruthy();
    expect(screen.queryByText('Agente Piloto')).not.toBeTruthy();
  });

  it('distinguishes an unmatched search from an empty organization', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(await response({ agents: [agent] }));
    const user = userEvent.setup();
    show(Page);

    await screen.findByText('Agente Piloto');
    await user.type(screen.getByPlaceholderText('Pesquisar por nome ou modelo do agente...'), 'inexistente');

    expect(screen.getByText('Nenhum agente corresponde à pesquisa.')).toBeTruthy();
    expect(screen.queryByText('Você ainda não criou nenhum agente de voz.')).not.toBeTruthy();
  });
});
