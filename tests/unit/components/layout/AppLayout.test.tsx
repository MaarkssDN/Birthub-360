// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppLayout, PageFallback } from '@/components/layout/AppLayout.js';

/**
 * AppLayout.tsx concentra o router do shell autenticado (/app/*) extraído de
 * App.tsx (TAREFA-SANEAMENTO-016). Todos os ~60 módulos de feature são
 * React.lazy: aqui eles são mockados com marcadores de texto para que cada
 * rota possa ser exercitada sem carregar a feature real (que faria fetch,
 * SSE, Three.js etc.). O que se valida é o CONTRATO de roteamento: qual
 * elemento cada path resolve, os redirects (dialer, outbound e catch-all) e os
 * gates de RequireRole — nunca o conteúdo interno dos módulos.
 */

// --- Estado de auth controlável por teste ---------------------------------
const authState = vi.hoisted(() => ({ role: 'ADMIN' as string }));

vi.mock('@/contexts/AuthContext.js', () => ({
  useAuth: () => ({
    currentUser: { id: 'u1', role: authState.role, name: 'Admin' },
    isPending: false,
    isAdmin: authState.role === 'ADMIN',
    signOut: vi.fn(),
  }),
}));

// --- Shell: MainLayout/OnboardingGate são wrappers de navegação; o contrato
// testado aqui é a árvore de rotas, não o chrome (coberto por Sidebar.test etc.)
vi.mock('@/components/layout/MainLayout.js', () => ({
  MainLayout: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@/components/layout/OnboardingGate.js', () => ({
  OnboardingGate: ({ children }: { children: ReactNode }) => children,
}));

// Captura do callback de navegação do CrmOverview (cards de atalho do KPI).
const crmNav = vi.hoisted(() => ({ onNavigate: undefined as undefined | ((t: string) => void) }));

// --- Mocks dos módulos lazy ------------------------------------------------
// Cada factory devolve o named export que o `.then(m => ({default: m.X}))`
// do React.lazy espera. O componente retorna uma string marcador.
vi.mock('@/features/copilot/components/LiveCopilotHUD.js', () => ({
  LiveCopilotHUD: () => <div>MOD_LIVE_COPILOT</div>,
}));
vi.mock('@/features/characters/CharacterGalleryView.js', () => ({
  CharacterGalleryView: () => <div>MOD_CHARACTERS</div>,
}));
vi.mock('@/features/dashboard/components/AdaptiveDashboard.js', () => ({
  AdaptiveDashboard: () => <div>MOD_DASHBOARD</div>,
}));
vi.mock('@/features/home/CentralModulesHome.js', () => ({
  CentralModulesHome: () => <div>MOD_CENTRAL_HOME</div>,
}));
vi.mock('@/features/workspace/components/WorkspaceHome.js', () => ({
  WorkspaceHome: () => <div>MOD_WORKSPACE</div>,
}));
vi.mock('@/features/prospecting/components/ProspectingHub.js', () => ({
  ProspectingHub: () => <div>MOD_PROSPECT</div>,
}));
vi.mock('@/components/CrmBoard.js', () => ({ CrmBoard: () => <div>MOD_CRM</div> }));
vi.mock('@/features/crm360/components/CrmOverview.js', () => ({
  CrmOverview: (props: { onNavigate: (t: string) => void }) => {
    crmNav.onNavigate = props.onNavigate;
    return <div>MOD_CRM360</div>;
  },
}));
vi.mock('@/features/intelligence/components/IntelligenceHub.js', () => ({
  IntelligenceHub: () => <div>MOD_INTELLIGENCE</div>,
}));
vi.mock('@/features/intelligence/components/AIPendingActionsInbox.js', () => ({
  AIPendingActionsInbox: () => <div>MOD_PENDING_ACTIONS</div>,
}));
vi.mock('@/features/intelligence/components/EliteCommercialAgentWorkspace.js', () => ({
  EliteCommercialAgentWorkspace: () => <div>MOD_ELITE_AGENT</div>,
}));
vi.mock('@/features/copiloto-ia/components/CopilotoIaHub.js', () => ({
  CopilotoIaHub: () => <div>MOD_COPILOTO_IA</div>,
}));
vi.mock('@/features/companies/components/CompanyList.js', () => ({
  CompanyList: () => <div>MOD_COMPANIES</div>,
}));
vi.mock('@/features/contacts/components/ContactList.js', () => ({
  ContactList: () => <div>MOD_CONTACTS</div>,
}));
vi.mock('@/features/activities/components/ActivityList.js', () => ({
  ActivityList: () => <div>MOD_ACTIVITIES</div>,
}));
vi.mock('@/features/cadence/components/CadenceHub.js', () => ({
  CadenceHub: () => <div>MOD_CADENCE</div>,
}));
vi.mock('@/features/roleplay/components/RoleplayHub.js', () => ({
  RoleplayHub: () => <div>MOD_ROLEPLAY</div>,
}));
vi.mock('@/features/playbook/components/QualificationMatrixPage.js', () => ({
  QualificationMatrixPage: () => <div>MOD_QUALIFICATION</div>,
}));
vi.mock('@/features/playbook/components/ObjectionsMatrixPage.js', () => ({
  ObjectionsMatrixPage: () => <div>MOD_OBJECTIONS</div>,
}));
vi.mock('@/features/intelligence/components/TopicTrainingAcademy.js', () => ({
  TopicTrainingAcademy: () => <div>MOD_TOPIC_TRAINING</div>,
}));
vi.mock('@/features/intelligence/components/BitrixGuideHub.js', () => ({
  BitrixGuideHub: () => <div>MOD_BITRIX</div>,
}));
vi.mock('@/features/intelligence/components/ReportsHub.js', () => ({
  ReportsHub: () => <div>MOD_REPORTS</div>,
}));
vi.mock('@/features/chatbook/components/ChatbookHub.js', () => ({
  ChatbookHub: () => <div>MOD_CHATBOOK</div>,
}));
vi.mock('@/features/integrations/components/Integrations.js', () => ({
  Integrations: () => <div>MOD_INTEGRATIONS</div>,
}));
vi.mock('@/features/knowledge/components/Base.js', () => ({ Base: () => <div>MOD_KNOWLEDGE</div> }));
vi.mock('@/features/analytics/components/Analytics.js', () => ({
  Analytics: () => <div>MOD_ANALYTICS</div>,
}));
vi.mock('@/features/analytics/components/WinLossAnalysis.js', () => ({
  WinLossAnalysis: () => <div>MOD_WINLOSS</div>,
}));
vi.mock('@/features/commercial-intelligence/components/CommercialIntelligenceHub.js', () => ({
  CommercialIntelligenceHub: () => <div>MOD_COMM_INTEL</div>,
}));
vi.mock('@/features/signals-risks/components/SignalsAndRisksHub.js', () => ({
  SignalsAndRisksHub: ({ initialView }: { initialView?: string }) => (
    <div>{`MOD_SIGNALS_RISKS:${initialView ?? 'default'}`}</div>
  ),
}));
vi.mock('@/features/predictability/components/ForecastHub.js', () => ({
  ForecastHub: () => <div>MOD_FORECAST</div>,
}));
vi.mock('@/features/predictability/components/MetasHub.js', () => ({
  MetasHub: () => <div>MOD_METAS</div>,
}));
vi.mock('@/features/predictability/components/PipelinePonderadoHub.js', () => ({
  PipelinePonderadoHub: () => <div>MOD_PIPELINE_POND</div>,
}));
vi.mock('@/features/settings/components/PillarSettingsPlaceholder.js', () => ({
  PillarSettingsPlaceholder: ({ pillarName }: { pillarName: string }) => (
    <div>{`MOD_PILLAR_SETTINGS:${pillarName}`}</div>
  ),
}));
vi.mock('@/features/sales-orchestration/components/PlaybooksHub.js', () => ({
  PlaybooksHub: () => <div>MOD_PLAYBOOKS</div>,
}));
vi.mock('@/features/sales-orchestration/components/JornadasComerciaisHub.js', () => ({
  JornadasComerciaisHub: () => <div>MOD_JORNADAS</div>,
}));
vi.mock('@/features/sales-orchestration/components/ProcessosVendasHub.js', () => ({
  ProcessosVendasHub: () => <div>MOD_PROCESSOS</div>,
}));
vi.mock('@/features/sales-orchestration/components/RoteirosHub.js', () => ({
  RoteirosHub: () => <div>MOD_ROTEIROS</div>,
}));
vi.mock('@/features/market-intelligence/components/InteligenciaMercadoHub.js', () => ({
  InteligenciaMercadoHub: () => <div>MOD_MERCADO</div>,
}));
vi.mock('@/features/market-intelligence/components/ProspeccaoInteligenteHub.js', () => ({
  ProspeccaoInteligenteHub: () => <div>MOD_PROSPECCAO_INTEL</div>,
}));
vi.mock('@/features/market-intelligence/components/Account360.js', () => ({
  Account360: () => <div>MOD_ACCOUNT360</div>,
}));
vi.mock('@/features/market-intelligence/components/LeadApprovalDeck.js', () => ({
  LeadApprovalDeck: () => <div>MOD_DECK</div>,
}));
vi.mock('@/features/commercial-intelligence/components/DailyPlanHub.js', () => ({
  DailyPlanHub: () => <div>MOD_DAILY_PLAN</div>,
}));
vi.mock('@/features/commercial-intelligence/components/JoaoReisDiagnosticHub.js', () => ({
  JoaoReisDiagnosticHub: () => <div>MOD_JOAO_REIS</div>,
}));
vi.mock('@/features/calendar/components/Calendar.js', () => ({
  Calendar: () => <div>MOD_CALENDAR</div>,
}));
vi.mock('@/features/mesa-tratamento/components/MesaTratamento.js', () => ({
  MesaTratamento: () => <div>MOD_MESA</div>,
}));
vi.mock('@/features/notifications/components/Notifications.js', () => ({
  Notifications: () => <div>MOD_NOTIFICATIONS</div>,
}));
vi.mock('@/features/automations/components/Automations.js', () => ({
  Automations: () => <div>MOD_AUTOMATIONS</div>,
}));
vi.mock('@/features/billing/components/Billing.js', () => ({ Billing: () => <div>MOD_USAGE</div> }));
vi.mock('@/features/document-editor/components/Editor.js', () => ({
  Editor: () => <div>MOD_EDITOR</div>,
}));
vi.mock('@/features/team/components/Team.js', () => ({ Team: () => <div>MOD_TEAM</div> }));
vi.mock('@/features/gamification/components/GamificationView.js', () => ({
  GamificationView: () => <div>MOD_GAMIFICATION</div>,
}));
vi.mock('@/features/gamification/components/WarRoomArenaView.js', () => ({
  WarRoomArenaView: () => <div>MOD_WAR_ROOM</div>,
}));
vi.mock('@/features/settings/components/MultiRegionFailoverPanel.js', () => ({
  MultiRegionFailoverPanel: () => <div>MOD_FAILOVER</div>,
}));
vi.mock('@/features/module-access/components/ModuleAccessAdmin.js', () => ({
  ModuleAccessAdmin: () => <div>MOD_MODULE_ACCESS</div>,
}));
vi.mock('@/features/settings/components/Settings.js', () => ({
  Settings: () => <div>MOD_SETTINGS</div>,
}));
vi.mock('@/features/onboarding/components/OnboardingTour.js', () => ({
  OnboardingTour: () => <div>MOD_ONBOARDING_TOUR</div>,
}));
vi.mock('@/features/voice-hub/components/VoiceHubView.js', () => ({
  VoiceHubView: () => <div>MOD_VOICE_HUB</div>,
}));
vi.mock('@/pages/Ldr.js', () => ({ Ldr: () => <div>MOD_LDR</div> }));
vi.mock('@/features/crm360/components/PropostasList.js', () => ({
  PropostasList: () => <div>MOD_PROPOSTAS</div>,
}));

// localStorage limpo → showOnboardingTour=false; um teste dedicado cobre o ramo true.

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/app/*" element={<AppLayout />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** Tabela path → marcador esperado. Cobre TODAS as rotas declaradas em AppLayout. */
const ROUTE_CASES: Array<[string, string]> = [
  ['/app', 'MOD_CENTRAL_HOME'],
  ['/app/home', 'MOD_CENTRAL_HOME'],
  ['/app/dashboard', 'MOD_DASHBOARD'],
  ['/app/workspace', 'MOD_WORKSPACE'],
  ['/app/prospect', 'MOD_PROSPECT'],
  ['/app/crm', 'MOD_CRM'],
  ['/app/crm360', 'MOD_CRM360'],
  ['/app/mesa-tratamento', 'MOD_MESA'],
  ['/app/signals-risks', 'MOD_SIGNALS_RISKS:default'],
  ['/app/signals-risks/radar', 'MOD_SIGNALS_RISKS:radar'],
  ['/app/signals-risks/deal-risks', 'MOD_SIGNALS_RISKS:deal-risks'],
  ['/app/intelligence', 'MOD_INTELLIGENCE'],
  ['/app/intelligence/elite-agent', 'MOD_ELITE_AGENT'],
  ['/app/intelligence/pending-actions', 'MOD_PENDING_ACTIONS'],
  ['/app/pending-actions', 'MOD_PENDING_ACTIONS'],
  ['/app/copiloto_ia', 'MOD_COPILOTO_IA'],
  ['/app/companies', 'MOD_COMPANIES'],
  ['/app/contacts', 'MOD_CONTACTS'],
  ['/app/activities', 'MOD_ACTIVITIES'],
  ['/app/dialer', 'MOD_CADENCE'], // redirect legado → /app/cadence
  ['/app/voice-hub', 'MOD_VOICE_HUB'],
  ['/app/voice-hub/inbox', 'MOD_VOICE_HUB'],
  ['/app/outbound/campaigns', 'MOD_DASHBOARD'], // redirect → /app/dashboard
  ['/app/cadence', 'MOD_CADENCE'],
  ['/app/playbooks', 'MOD_PLAYBOOKS'],
  ['/app/jornadas', 'MOD_JORNADAS'],
  ['/app/processos', 'MOD_PROCESSOS'],
  ['/app/roteiros', 'MOD_ROTEIROS'],
  ['/app/chatbook', 'MOD_CHATBOOK'],
  ['/app/roleplay', 'MOD_ROLEPLAY'],
  ['/app/gamification', 'MOD_GAMIFICATION'],
  ['/app/qualification_matrix', 'MOD_QUALIFICATION'],
  ['/app/objections_matrix', 'MOD_OBJECTIONS'],
  ['/app/topic_training', 'MOD_TOPIC_TRAINING'],
  ['/app/bitrix', 'MOD_BITRIX'],
  ['/app/reports', 'MOD_REPORTS'],
  ['/app/integrations', 'MOD_INTEGRATIONS'],
  ['/app/knowledge', 'MOD_KNOWLEDGE'],
  ['/app/analytics', 'MOD_ANALYTICS'],
  ['/app/winloss', 'MOD_WINLOSS'],
  ['/app/war-room', 'MOD_WAR_ROOM'],
  ['/app/market-intelligence', 'MOD_LDR'],
  ['/app/market-intelligence/hub', 'MOD_MERCADO'],
  ['/app/market-intelligence/accounts/acc-1', 'MOD_ACCOUNT360'],
  ['/app/market-intelligence/deck', 'MOD_DECK'],
  ['/app/prospect/inteligente', 'MOD_PROSPECCAO_INTEL'],
  ['/app/propostas', 'MOD_PROPOSTAS'],
  ['/app/commercial_intelligence', 'MOD_COMM_INTEL'],
  ['/app/daily-plan', 'MOD_DAILY_PLAN'],
  ['/app/sdr-diagnostic', 'MOD_JOAO_REIS'],
  ['/app/calendar', 'MOD_CALENDAR'],
  ['/app/notifications', 'MOD_NOTIFICATIONS'],
  ['/app/automations', 'MOD_AUTOMATIONS'],
  ['/app/usage', 'MOD_USAGE'],
  ['/app/editor', 'MOD_EDITOR'],
  ['/app/team', 'MOD_TEAM'],
  ['/app/module-access', 'MOD_MODULE_ACCESS'],
  ['/app/settings', 'MOD_SETTINGS'],
  ['/app/failover', 'MOD_FAILOVER'],
  ['/app/resilience', 'MOD_FAILOVER'],
  ['/app/forecast', 'MOD_FORECAST'],
  ['/app/metas', 'MOD_METAS'],
  ['/app/pipeline_ponderado', 'MOD_PIPELINE_POND'],
  ['/app/settings_hub', 'MOD_PILLAR_SETTINGS:Hub Comercial'],
  ['/app/settings_market', 'MOD_PILLAR_SETTINGS:Inteligência de Mercado'],
  ['/app/settings_sales', 'MOD_PILLAR_SETTINGS:Orquestração de Vendas'],
  ['/app/settings_performance', 'MOD_PILLAR_SETTINGS:Performance Comercial'],
  ['/app/settings_predictability', 'MOD_PILLAR_SETTINGS:Previsibilidade Comercial'],
  ['/app/settings_ai', 'MOD_PILLAR_SETTINGS:Inteligência Artificial'],
  ['/app/settings_automation', 'MOD_PILLAR_SETTINGS:Automação & Conectividade'],
  ['/app/settings_engagement', 'MOD_PILLAR_SETTINGS:Engajamento Comercial'],
  ['/app/characters', 'MOD_CHARACTERS'],
  ['/app/rota-inexistente', 'MOD_CENTRAL_HOME'], // catch-all → /app
];

describe('AppLayout — router /app/*', () => {
  beforeEach(() => {
    authState.role = 'ADMIN';
    window.localStorage.clear();
    crmNav.onNavigate = undefined;
  });

  it.each(ROUTE_CASES)('resolve %s → %s', async (path, marker) => {
    const { unmount } = renderAt(path);
    expect(await screen.findByText(marker)).toBeInTheDocument();
    unmount();
  });

  it('CrmOverview recebe onNavigate que navega para /app/<tab>', async () => {
    const { unmount } = renderAt('/app/crm360');
    await screen.findByText('MOD_CRM360');
    expect(crmNav.onNavigate).toBeTypeOf('function');
    // Simula o clique num card de atalho do CrmOverview (ex.: KPI -> board).
    act(() => crmNav.onNavigate?.('crm'));
    expect(await screen.findByText('MOD_CRM')).toBeInTheDocument();
    unmount();
  });

  it('exibe PageFallback (data-testid) enquanto módulo lazy carrega', () => {
    render(<PageFallback />);
    expect(screen.getByTestId('page-fallback')).toBeInTheDocument();
  });

  it('monta OnboardingTour quando o usuário ainda não viu o tour', async () => {
    // localStorage vazio → showOnboardingTour=true → lazy OnboardingTour resolve.
    renderAt('/app');
    expect(await screen.findByText('MOD_ONBOARDING_TOUR')).toBeInTheDocument();
    expect(await screen.findByText('MOD_CENTRAL_HOME')).toBeInTheDocument();
    expect(await screen.findByText('MOD_LIVE_COPILOT')).toBeInTheDocument();
  });

  it('não monta OnboardingTour quando has_seen_tour já está gravado', async () => {
    window.localStorage.setItem('@prospector:has_seen_tour', '1');
    renderAt('/app');
    await screen.findByText('MOD_CENTRAL_HOME');
    expect(screen.queryByText('MOD_ONBOARDING_TOUR')).not.toBeInTheDocument();
  });

  it.each([
    '/app/usage',
    '/app/team',
    '/app/module-access',
    '/app/forecast',
    '/app/metas',
    '/app/pipeline_ponderado',
    '/app/commercial_intelligence',
    '/app/copiloto_ia',
    '/app/mesa-tratamento',
  ])('nega %s para role sem permissão (RequireRole → Acesso restrito)', async (path) => {
    authState.role = 'VISUALIZADOR';
    const { unmount } = renderAt(path);
    expect(await screen.findByText('Acesso restrito')).toBeInTheDocument();
    unmount();
  });

  it('permite /app/usage para ADMIN', async () => {
    const { unmount } = renderAt('/app/usage');
    expect(await screen.findByText('MOD_USAGE')).toBeInTheDocument();
    unmount();
  });
});
