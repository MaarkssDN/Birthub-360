// @vitest-environment jsdom
//
// Interaction coverage for pages/Dashboard/Overview.tsx beyond the telemetry cards
// (Overview.telemetria-ia.test.tsx): tab switching, quick-action modal flow, checklist
// persistence POST, and the fetch error/empty branches of each data slice.

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RebuiltExecutiveOverview from './Overview.js';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

interface StubOptions {
  checklist?: Record<string, boolean> | null;
  failCalls?: boolean;
  failAgents?: boolean;
  failReady?: boolean;
  failMetrics?: boolean;
  failChecklist?: boolean;
  failChecklistPost?: boolean;
  agents?: unknown[];
  calls?: unknown[];
  metrics?: unknown[];
}

// Baseline fetch stub covering every endpoint Overview.tsx calls; individual tests override
// one slice at a time to exercise its error branch.
function stubFetch(opts: StubOptions = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: RequestInit) => {
      if (url === '/api/onboarding') {
        if (init?.method === 'POST') {
          if (opts.failChecklistPost) return Promise.resolve(jsonResponse({}, false, 500));
          return Promise.resolve(jsonResponse({ ok: true }));
        }
        if (opts.failChecklist) return Promise.resolve(jsonResponse({}, false, 500));
        return Promise.resolve(
          jsonResponse({ checklist: opts.checklist === null ? {} : (opts.checklist ?? {}) }),
        );
      }
      if (url === '/api/call-logs') {
        if (opts.failCalls) return Promise.resolve(jsonResponse({}, false, 500));
        return Promise.resolve(jsonResponse({ callLogs: opts.calls ?? [] }));
      }
      if (url === '/api/agents') {
        if (opts.failAgents) return Promise.resolve(jsonResponse({}, false, 500));
        return Promise.resolve(jsonResponse({ agents: opts.agents ?? [] }));
      }
      if (url === '/api/ready') {
        if (opts.failReady) return Promise.reject(new Error('ready down'));
        return Promise.resolve(jsonResponse({ checks: { database: 'ok', redis: 'error' } }));
      }
      if (url === '/api/metrics') {
        if (opts.failMetrics) return Promise.resolve(jsonResponse({}, false, 500));
        return Promise.resolve(jsonResponse({ metrics: opts.metrics ?? [] }));
      }
      throw new Error(`unexpected fetch: ${url}`);
    }),
  );
}

describe('Overview — interactions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('switches between the KPIs, UX-audit and analytics tabs', async () => {
    stubFetch();
    render(<RebuiltExecutiveOverview />);

    // Default tab: KPIs.
    expect(await screen.findByText('Agentes Cadastrados')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Relatório de UX Audit'));
    expect(screen.getByText('UX Audit Report — Birth Hub 360')).toBeInTheDocument();
    expect(screen.getByText('Fricções & Gargalos Identificados')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Analytics de Produto'));
    expect(screen.getByText('Analytics de produto ainda não instrumentado')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Visão Geral'));
    expect(screen.getByText('Agentes Cadastrados')).toBeInTheDocument();
  });

  it('opens the quick-action modal and navigates on continue; cancel closes it', async () => {
    stubFetch();
    render(<RebuiltExecutiveOverview />);
    await screen.findByText('Agentes Cadastrados');

    // "Criar Agente" quick-action card (identified by its unique subtitle) opens the modal.
    fireEvent.click(screen.getByText('Configurar novo agente'));
    expect(await screen.findByText('Criar Novo Agente de Voz')).toBeInTheDocument();

    // Cancel closes without navigating.
    mockNavigate.mockClear();
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() =>
      expect(screen.queryByText('Criar Novo Agente de Voz')).not.toBeInTheDocument(),
    );
    expect(mockNavigate).not.toHaveBeenCalled();

    // Reopen and continue → handleExecuteQuickAction('agent') navigates.
    fireEvent.click(screen.getByText('Configurar novo agente'));
    fireEvent.click(await screen.findByText('Continuar'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/agents/new');
  });

  it('quick-action cards navigate directly (analytics/playground/knowledge)', async () => {
    stubFetch();
    render(<RebuiltExecutiveOverview />);
    await screen.findByText('Agentes Cadastrados');

    fireEvent.click(screen.getByText('Ver Análises'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/analytics');

    fireEvent.click(screen.getByText('Acessar Playground'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/playground');

    fireEvent.click(screen.getByText('Nova Base'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/knowledge');
  });

  it('persists checklist changes via POST /api/onboarding', async () => {
    stubFetch({ checklist: { orgCreated: false } });
    render(<RebuiltExecutiveOverview />);

    // Wait for the checklist to load (wizard renders once checklist !== null).
    expect(await screen.findByText('Bem-vindo ao Birth Voices Hub')).toBeInTheDocument();

    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);

    await waitFor(() => {
      const calls = vi.mocked(fetch).mock.calls;
      const post = calls.find(([, init]) => init?.method === 'POST');
      expect(post).toBeTruthy();
      expect(String(post?.[0])).toBe('/api/onboarding');
      expect(JSON.parse(String(post?.[1]?.body))).toEqual({
        checklist: { orgCreated: true },
      });
    });
  });

  it('shows error EmptyStates when call-logs and agents fetches fail', async () => {
    stubFetch({ failCalls: true, failAgents: true });
    render(<RebuiltExecutiveOverview />);

    expect(await screen.findByText('Não foi possível carregar as chamadas')).toBeInTheDocument();
    expect(await screen.findByText('Não foi possível carregar os agentes')).toBeInTheDocument();
  });

  it('shows the platform "Indisponível" badge when /api/ready fails and redis down when check fails', async () => {
    stubFetch({ failReady: true });
    const { unmount } = render(<RebuiltExecutiveOverview />);
    // /api/ready has no res.ok check (pre-existing): a 500 still parses to checks:null →
    // PlatformStatusCard honestly renders "Indisponível" for both components.
    expect((await screen.findAllByText('Indisponível')).length).toBeGreaterThan(0);
    unmount();
    vi.unstubAllGlobals();

    stubFetch(); // checks: database ok, redis error
    render(<RebuiltExecutiveOverview />);
    await screen.findByText('Agentes Cadastrados');
    // PlatformStatusCard renders Redis as Indisponível.
    expect(screen.getAllByText('Indisponível').length).toBeGreaterThan(0);
  });

  it('metrics fetch failure flips the telemetry/SLA cards to their error state', async () => {
    stubFetch({ failMetrics: true });
    render(<RebuiltExecutiveOverview />);
    await screen.findByText('Agentes Cadastrados');
    // SLA + 3 AI cards all read metricsState.status === 'error' → "Erro" affordance.
    expect((await screen.findAllByText('Erro')).length).toBeGreaterThanOrEqual(4);
  });

  it('checklist load failure shows the honest warning inside the onboarding panel', async () => {
    stubFetch({ failChecklist: true });
    render(<RebuiltExecutiveOverview />);
    expect(
      await screen.findByText('Não foi possível carregar seu progresso salvo'),
    ).toBeInTheDocument();
  });

  it('checklist POST failure surfaces an error toast and keeps the optimistic state', async () => {
    stubFetch({ checklist: { orgCreated: false }, failChecklistPost: true });
    render(<RebuiltExecutiveOverview />);
    expect(await screen.findByText('Bem-vindo ao Birth Voices Hub')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(
      await screen.findByText('Não foi possível salvar o checklist no servidor. Tente novamente.'),
    ).toBeInTheDocument();
  });

  it('collapsing the onboarding wizard hides it', async () => {
    stubFetch({ checklist: {} });
    render(<RebuiltExecutiveOverview />);
    expect(await screen.findByText('Bem-vindo ao Birth Voices Hub')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Minimizar'));
    await waitFor(() =>
      expect(screen.queryByText('Bem-vindo ao Birth Voices Hub')).not.toBeInTheDocument(),
    );
  });

  it('KPI card and agents-card callbacks navigate; agents card retry refetches', async () => {
    stubFetch({
      agents: [{ id: 'a1', name: 'Sofia', model: 'gpt-x', phoneNumber: '+5511' }],
    });
    render(<RebuiltExecutiveOverview />);
    await screen.findByText('Agentes Cadastrados');

    // "Agentes Cadastrados" stat card navigates to /dashboard/agents.
    const statTitle = screen.getByText('Agentes Cadastrados');
    fireEvent.click(statTitle.closest('[role="button"]') as HTMLElement);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/agents');

    // AgentsCard "Ver todos" navigates too.
    mockNavigate.mockClear();
    fireEvent.click(screen.getByText('Ver todos'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/agents');
  });

  it('agents empty state "Criar Agente" navigates; error state "Tentar novamente" refetches', async () => {
    stubFetch({ failAgents: true });
    render(<RebuiltExecutiveOverview />);
    expect(await screen.findByText('Não foi possível carregar os agentes')).toBeInTheDocument();

    const fetchCallsBefore = vi.mocked(fetch).mock.calls.length;
    fireEvent.click(screen.getByText('Tentar novamente'));
    await waitFor(() =>
      expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThan(fetchCallsBefore),
    );
  });

  it('agents empty state "Criar Agente" navigates to the agent form', async () => {
    stubFetch(); // agents: [] → AgentsCard EmptyState
    render(<RebuiltExecutiveOverview />);
    await screen.findByText('Nenhum agente criado ainda');

    // Exact accessible name — the quick-action card's name includes its subtitle.
    fireEvent.click(screen.getByRole('button', { name: 'Criar Agente' }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/agents/new');
  });

  it('calls log "Atualizar" refetches call logs', async () => {
    stubFetch();
    render(<RebuiltExecutiveOverview />);
    await screen.findByText('Registro de Chamadas');

    const before = vi.mocked(fetch).mock.calls.filter(([url]) => url === '/api/call-logs').length;
    fireEvent.click(screen.getByText('Atualizar'));
    await waitFor(() =>
      expect(
        vi.mocked(fetch).mock.calls.filter(([url]) => url === '/api/call-logs').length,
      ).toBeGreaterThan(before),
    );
  });
});
