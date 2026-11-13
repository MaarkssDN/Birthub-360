// @vitest-environment jsdom
//
// Component coverage for the section components extracted from Dashboard/Overview.tsx
// (TAREFA-SANEAMENTO-008 / BT360-DT-0063): OnboardingPanel (null-checklist skeleton, wizard
// steps, error alert, collapse), CallsLogCard / AgentsCard (loading/error/empty/ready branches),
// PlatformStatusCard and PendingAlertsCard (computed alert branches).

import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AgentRecord, CallLogEntry } from './overviewMetrics.js';
import {
  AgentsCard,
  CallsLogCard,
  OnboardingPanel,
  PendingAlertsCard,
  PlatformStatusCard,
} from './overviewSections.js';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const FULL_CHECKLIST = {
  orgCreated: true,
  agentCreated: true,
  telephonyConnected: false,
  knowledgeAdded: false,
  firstTest: false,
  agentPublished: false,
  firstCallCompleted: false,
};

function renderOnboarding(overrides: Partial<Parameters<typeof OnboardingPanel>[0]> = {}) {
  const props: Parameters<typeof OnboardingPanel>[0] = {
    checklist: FULL_CHECKLIST,
    checklistError: false,
    wizardStep: 0,
    onWizardStep: vi.fn(),
    wizardCollapsed: false,
    onCollapse: vi.fn(),
    progress: 33,
    onUpdateChecklist: vi.fn(),
    ...overrides,
  };
  return { props, ...render(<OnboardingPanel {...props} />) };
}

describe('OnboardingPanel', () => {
  it('renders skeletons (never default "done" state) while checklist is null', () => {
    const { container } = renderOnboarding({ checklist: null });
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    expect(screen.queryByText('Bem-vindo ao Birth Voices Hub')).not.toBeInTheDocument();
  });

  it('renders wizard + permanent checklist and fires step/collapse/checklist handlers', () => {
    const { props } = renderOnboarding();

    expect(screen.getByText('Bem-vindo ao Birth Voices Hub')).toBeInTheDocument();
    expect(screen.getByText('Checklist Permanente')).toBeInTheDocument();
    expect(screen.getByText('33%')).toBeInTheDocument();

    // Wizard step buttons switch steps.
    fireEvent.click(screen.getByText('Telefonia'));
    expect(props.onWizardStep).toHaveBeenCalledWith(2);

    // Collapse button.
    fireEvent.click(screen.getByText('Minimizar'));
    expect(props.onCollapse).toHaveBeenCalledTimes(1);

    // Checklist item toggles (first checkbox = "Organização Configurada").
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(props.onUpdateChecklist).toHaveBeenCalledWith('orgCreated', false);
  });

  it('shows the warning alert when the server checklist failed to load', () => {
    renderOnboarding({ checklistError: true });
    expect(screen.getByText('Não foi possível carregar seu progresso salvo')).toBeInTheDocument();
  });

  it('renders nothing interactive when collapsed', () => {
    renderOnboarding({ wizardCollapsed: true });
    expect(screen.queryByText('Bem-vindo ao Birth Voices Hub')).not.toBeInTheDocument();
  });

  it('renders each wizard step detail (steps 1-3)', () => {
    for (const [step, title] of [
      [1, '2. Criar seu Primeiro Agente de Voz'],
      [2, '3. Conectar Telefonia e SIP Trunk'],
      [3, '4. Executar Primeiro Teste Real de Chamada'],
    ] as const) {
      const { unmount } = renderOnboarding({ wizardStep: step });
      expect(screen.getByText(title)).toBeInTheDocument();
      unmount();
    }
  });

  it.each([
    [0, 'Configurar Organização', 'Marcar como feito', 'orgCreated', '/dashboard/organization'],
    [1, 'Criar Agente', 'Marcar como feito', 'agentCreated', '/dashboard/agents/new'],
    [2, 'Conectar Telefonia', 'Marcar como feito', 'telephonyConnected', '/dashboard/telephony'],
    [3, 'Abrir Playground', 'Concluir Setup!', 'firstCallCompleted', '/dashboard/playground'],
  ] as const)(
    'wizard step %i fires navigate + checklist-mark handlers',
    (step, primaryLabel, markLabel, checklistKey, route) => {
      mockNavigate.mockClear();
      const { props } = renderOnboarding({ wizardStep: step });

      fireEvent.click(screen.getByText(primaryLabel));
      expect(mockNavigate).toHaveBeenCalledWith(route);

      // FULL_CHECKLIST has every wizard key false → "Marcar como feito" sends true.
      fireEvent.click(screen.getByText(markLabel));
      expect(props.onUpdateChecklist).toHaveBeenCalledWith(checklistKey, true);
    },
  );

  it('every permanent-checklist row toggles its own key and navigates on "Ir"', () => {
    mockNavigate.mockClear();
    const { props } = renderOnboarding({
      checklist: {
        orgCreated: false,
        agentCreated: false,
        telephonyConnected: false,
        knowledgeAdded: false,
        firstTest: false,
        agentPublished: false,
        firstCallCompleted: false,
      },
    });

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(6);
    const expectedKeys = [
      'orgCreated',
      'agentCreated',
      'telephonyConnected',
      'knowledgeAdded',
      'firstTest',
      'agentPublished',
    ];
    checkboxes.forEach((cb, i) => {
      fireEvent.click(cb);
      expect(props.onUpdateChecklist).toHaveBeenLastCalledWith(expectedKeys[i], true);
    });

    // Each row's label button and "Ir" shortcut both navigate.
    const irButtons = screen.getAllByText('Ir');
    expect(irButtons).toHaveLength(6);
    irButtons.forEach((btn) => {
      fireEvent.click(btn);
    });
    expect(mockNavigate).toHaveBeenCalled();
  });
});

describe('CallsLogCard', () => {
  const calls: CallLogEntry[] = [
    {
      id: 'c1',
      contactName: 'Lead A',
      duration: '02:30',
      agent: 'Sofia',
      status: 'Concluído',
      time: '10:00',
    },
    { id: 'c2', contactName: 'Lead B', status: 'Não atendida', time: '11:00' },
  ];

  it('shows skeletons while loading', () => {
    const { container } = render(<CallsLogCard status="loading" calls={[]} onRefresh={() => {}} />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows error EmptyState and retries via onRefresh', () => {
    const onRefresh = vi.fn();
    render(<CallsLogCard status="error" calls={[]} onRefresh={onRefresh} />);
    expect(screen.getByText('Não foi possível carregar as chamadas')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Tentar novamente'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('shows honest empty state when there are no calls', () => {
    render(<CallsLogCard status="ready" calls={[]} onRefresh={() => {}} />);
    expect(screen.getByText('Nenhuma chamada registrada ainda')).toBeInTheDocument();
  });

  it('renders call rows (max 5) with status badges', () => {
    render(<CallsLogCard status="ready" calls={calls} onRefresh={() => {}} />);
    expect(screen.getByText('Lead A')).toBeInTheDocument();
    expect(screen.getByText('02:30')).toBeInTheDocument();
    expect(screen.getByText('Não atendida')).toBeInTheDocument();
    // Refresh button also calls onRefresh.
    fireEvent.click(screen.getByText('Atualizar'));
  });
});

describe('AgentsCard', () => {
  const agents: AgentRecord[] = [
    { id: 'a1', name: 'Sofia', model: 'gpt-x', phoneNumber: '+5511' },
    { id: 'a2', name: 'Rex', model: 'gpt-y' },
  ];

  it('shows skeletons while loading', () => {
    const { container } = render(
      <AgentsCard
        status="loading"
        agents={[]}
        onViewAll={() => {}}
        onRetry={() => {}}
        onCreateAgent={() => {}}
      />,
    );
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows error state with retry', () => {
    const onRetry = vi.fn();
    render(
      <AgentsCard
        status="error"
        agents={[]}
        onViewAll={() => {}}
        onRetry={onRetry}
        onCreateAgent={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('Tentar novamente'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows empty state with create-agent action', () => {
    const onCreateAgent = vi.fn();
    render(
      <AgentsCard
        status="ready"
        agents={[]}
        onViewAll={() => {}}
        onRetry={() => {}}
        onCreateAgent={onCreateAgent}
      />,
    );
    fireEvent.click(screen.getByText('Criar Agente'));
    expect(onCreateAgent).toHaveBeenCalledTimes(1);
  });

  it('renders agent rows with telephony badges and fires onViewAll', () => {
    const onViewAll = vi.fn();
    render(
      <AgentsCard
        status="ready"
        agents={agents}
        onViewAll={onViewAll}
        onRetry={() => {}}
        onCreateAgent={() => {}}
      />,
    );
    expect(screen.getByText('Sofia')).toBeInTheDocument();
    expect(screen.getByText('Telefonia conectada')).toBeInTheDocument();
    expect(screen.getByText('Sem telefonia')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Ver todos'));
    expect(onViewAll).toHaveBeenCalledTimes(1);
  });
});

describe('PlatformStatusCard', () => {
  it('shows skeleton while loading', () => {
    const { container } = render(<PlatformStatusCard status="loading" checks={null} />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('renders operational badges for ok checks and danger for failures', () => {
    const { rerender } = render(
      <PlatformStatusCard status="ready" checks={{ database: 'ok', redis: 'ok' }} />,
    );
    expect(screen.getAllByText('Operacional')).toHaveLength(2);

    rerender(<PlatformStatusCard status="ready" checks={{ database: 'error', redis: 'error' }} />);
    expect(screen.getAllByText('Indisponível')).toHaveLength(2);

    // Error status with null checks also renders the danger branch.
    rerender(<PlatformStatusCard status="error" checks={null} />);
    expect(screen.getAllByText('Indisponível')).toHaveLength(2);
  });
});

describe('PendingAlertsCard', () => {
  it('alerts when no agent exists', () => {
    render(
      <PendingAlertsCard
        agentsStatus="ready"
        agentsCount={0}
        agentsWithPhone={0}
        checklist={FULL_CHECKLIST}
      />,
    );
    expect(screen.getByText('Nenhum agente criado')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Criar agente'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/agents/new');
  });

  it('alerts when agents exist but none has telephony', () => {
    render(
      <PendingAlertsCard
        agentsStatus="ready"
        agentsCount={2}
        agentsWithPhone={0}
        checklist={{ ...FULL_CHECKLIST, knowledgeAdded: true }}
      />,
    );
    expect(screen.getByText('Nenhum número de telefonia conectado')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Vincular'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/telephony');
  });

  it('alerts (amber) when knowledge base is empty and checklist loaded', () => {
    render(
      <PendingAlertsCard
        agentsStatus="ready"
        agentsCount={2}
        agentsWithPhone={1}
        checklist={FULL_CHECKLIST}
      />,
    );
    expect(screen.getByText('Base de conhecimento vazia')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Adicionar'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/knowledge');
  });

  it('shows "no pending items" when everything is done, and nothing while agents still load', () => {
    const { rerender } = render(
      <PendingAlertsCard
        agentsStatus="loading"
        agentsCount={0}
        agentsWithPhone={0}
        checklist={null}
      />,
    );
    expect(screen.queryByText('Nenhuma pendência identificada.')).not.toBeInTheDocument();

    rerender(
      <PendingAlertsCard
        agentsStatus="ready"
        agentsCount={2}
        agentsWithPhone={1}
        checklist={{ ...FULL_CHECKLIST, knowledgeAdded: true }}
      />,
    );
    expect(screen.getByText('Nenhuma pendência identificada.')).toBeInTheDocument();
  });
});

afterEach(() => {
  vi.clearAllMocks();
});
