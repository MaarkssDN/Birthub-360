import { lazy, Suspense, useCallback, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import {
  COMMERCIAL_INTELLIGENCE_ROLES,
  COPILOTO_IA_ROLES,
  MESA_TRATAMENTO_ROLES,
} from '../../lib/auth/authorization.js';
import { Skeleton } from '../ui/Skeleton.js';
import { MainLayout } from './MainLayout.js';
import { OnboardingGate } from './OnboardingGate.js';
import { RequireRole } from './RequireRole.js';

// Router dedicado do shell autenticado (/app/*) — extraído de src/App.tsx
// (TAREFA-SANEAMENTO-016 / BT360-DT-0016, handoff 00→02, Onda 5): o arquivo de
// montagem da aplicação fica só com providers e rotas públicas/top-level;
// aqui ficam o code-splitting (React.lazy) e a árvore de rotas do MainLayout.

const LiveCopilotHUD = lazy(() =>
  import('../../features/copilot/components/LiveCopilotHUD.js').then((m) => ({
    default: m.LiveCopilotHUD,
  })),
);

const CharacterGalleryView = lazy(() =>
  import('../../features/characters/CharacterGalleryView.js').then((m) => ({
    default: m.CharacterGalleryView,
  })),
);

const AdaptiveDashboard = lazy(() =>
  import('../../features/dashboard/components/AdaptiveDashboard.js').then((m) => ({
    default: m.AdaptiveDashboard,
  })),
);

const CentralModulesHome = lazy(() =>
  import('../../features/home/CentralModulesHome.js').then((m) => ({
    default: m.CentralModulesHome,
  })),
);

const WorkspaceHome = lazy(() =>
  import('../../features/workspace/components/WorkspaceHome.js').then((m) => ({
    default: m.WorkspaceHome,
  })),
);

const ProspectingHub = lazy(() =>
  import('../../features/prospecting/components/ProspectingHub.js').then((m) => ({
    default: m.ProspectingHub,
  })),
);

const CrmBoard = lazy(() => import('../CrmBoard.js').then((m) => ({ default: m.CrmBoard })));

const CrmOverview = lazy(() =>
  import('../../features/crm360/components/CrmOverview.js').then((m) => ({
    default: m.CrmOverview,
  })),
);

const IntelligenceHub = lazy(() =>
  import('../../features/intelligence/components/IntelligenceHub.js').then((m) => ({
    default: m.IntelligenceHub,
  })),
);

const AIPendingActionsInbox = lazy(() =>
  import('../../features/intelligence/components/AIPendingActionsInbox.js').then((m) => ({
    default: m.AIPendingActionsInbox,
  })),
);

const EliteCommercialAgentWorkspace = lazy(() =>
  import('../../features/intelligence/components/EliteCommercialAgentWorkspace.js').then((m) => ({
    default: m.EliteCommercialAgentWorkspace,
  })),
);

const CopilotoIaHub = lazy(() =>
  import('../../features/copiloto-ia/components/CopilotoIaHub.js').then((m) => ({
    default: m.CopilotoIaHub,
  })),
);

const CompanyList = lazy(() =>
  import('../../features/companies/components/CompanyList.js').then((m) => ({
    default: m.CompanyList,
  })),
);

const ContactList = lazy(() =>
  import('../../features/contacts/components/ContactList.js').then((m) => ({
    default: m.ContactList,
  })),
);

const ActivityList = lazy(() =>
  import('../../features/activities/components/ActivityList.js').then((m) => ({
    default: m.ActivityList,
  })),
);

const CadenceHub = lazy(() =>
  import('../../features/cadence/components/CadenceHub.js').then((m) => ({
    default: m.CadenceHub,
  })),
);

const RoleplayHub = lazy(() =>
  import('../../features/roleplay/components/RoleplayHub.js').then((m) => ({
    default: m.RoleplayHub,
  })),
);

const QualificationMatrixPage = lazy(() =>
  import('../../features/playbook/components/QualificationMatrixPage.js').then((m) => ({
    default: m.QualificationMatrixPage,
  })),
);

const ObjectionsMatrixPage = lazy(() =>
  import('../../features/playbook/components/ObjectionsMatrixPage.js').then((m) => ({
    default: m.ObjectionsMatrixPage,
  })),
);

const TopicTrainingAcademy = lazy(() =>
  import('../../features/intelligence/components/TopicTrainingAcademy.js').then((m) => ({
    default: m.TopicTrainingAcademy,
  })),
);

const BitrixGuideHub = lazy(() =>
  import('../../features/intelligence/components/BitrixGuideHub.js').then((m) => ({
    default: m.BitrixGuideHub,
  })),
);

const ReportsHub = lazy(() =>
  import('../../features/intelligence/components/ReportsHub.js').then((m) => ({
    default: m.ReportsHub,
  })),
);

const ChatbookHub = lazy(() =>
  import('../../features/chatbook/components/ChatbookHub.js').then((m) => ({
    default: m.ChatbookHub,
  })),
);

const Integrations = lazy(() =>
  import('../../features/integrations/components/Integrations.js').then((m) => ({
    default: m.Integrations,
  })),
);

const KnowledgeBase = lazy(() =>
  import('../../features/knowledge/components/Base.js').then((m) => ({ default: m.Base })),
);

const Analytics = lazy(() =>
  import('../../features/analytics/components/Analytics.js').then((m) => ({
    default: m.Analytics,
  })),
);

const WinLossAnalysis = lazy(() =>
  import('../../features/analytics/components/WinLossAnalysis.js').then((m) => ({
    default: m.WinLossAnalysis,
  })),
);

const CommercialIntelligenceHub = lazy(() =>
  import('../../features/commercial-intelligence/components/CommercialIntelligenceHub.js').then(
    (m) => ({
      default: m.CommercialIntelligenceHub,
    }),
  ),
);

const SignalsAndRisksHub = lazy(() =>
  import('../../features/signals-risks/components/SignalsAndRisksHub.js').then((m) => ({
    default: m.SignalsAndRisksHub,
  })),
);

const ForecastHub = lazy(() =>
  import('../../features/predictability/components/ForecastHub.js').then((m) => ({
    default: m.ForecastHub,
  })),
);

const MetasHub = lazy(() =>
  import('../../features/predictability/components/MetasHub.js').then((m) => ({
    default: m.MetasHub,
  })),
);

const PipelinePonderadoHub = lazy(() =>
  import('../../features/predictability/components/PipelinePonderadoHub.js').then((m) => ({
    default: m.PipelinePonderadoHub,
  })),
);

const PillarSettingsPlaceholder = lazy(() =>
  import('../../features/settings/components/PillarSettingsPlaceholder.js').then((m) => ({
    default: m.PillarSettingsPlaceholder,
  })),
);

const PlaybooksHub = lazy(() =>
  import('../../features/sales-orchestration/components/PlaybooksHub.js').then((m) => ({
    default: m.PlaybooksHub,
  })),
);

const JornadasComerciaisHub = lazy(() =>
  import('../../features/sales-orchestration/components/JornadasComerciaisHub.js').then((m) => ({
    default: m.JornadasComerciaisHub,
  })),
);

const ProcessosVendasHub = lazy(() =>
  import('../../features/sales-orchestration/components/ProcessosVendasHub.js').then((m) => ({
    default: m.ProcessosVendasHub,
  })),
);

const RoteirosHub = lazy(() =>
  import('../../features/sales-orchestration/components/RoteirosHub.js').then((m) => ({
    default: m.RoteirosHub,
  })),
);

const InteligenciaMercadoHub = lazy(() =>
  import('../../features/market-intelligence/components/InteligenciaMercadoHub.js').then((m) => ({
    default: m.InteligenciaMercadoHub,
  })),
);

const ProspeccaoInteligenteHub = lazy(() =>
  import('../../features/market-intelligence/components/ProspeccaoInteligenteHub.js').then((m) => ({
    default: m.ProspeccaoInteligenteHub,
  })),
);

const DailyPlanHub = lazy(() =>
  import('../../features/commercial-intelligence/components/DailyPlanHub.js').then((m) => ({
    default: m.DailyPlanHub,
  })),
);

const JoaoReisDiagnosticHub = lazy(() =>
  import('../../features/commercial-intelligence/components/JoaoReisDiagnosticHub.js').then(
    (m) => ({
      default: m.JoaoReisDiagnosticHub,
    }),
  ),
);

const Calendar = lazy(() =>
  import('../../features/calendar/components/Calendar.js').then((m) => ({ default: m.Calendar })),
);

const MesaTratamento = lazy(() =>
  import('../../features/mesa-tratamento/components/MesaTratamento.js').then((m) => ({
    default: m.MesaTratamento,
  })),
);

const Notifications = lazy(() =>
  import('../../features/notifications/components/Notifications.js').then((m) => ({
    default: m.Notifications,
  })),
);

const Automations = lazy(() =>
  import('../../features/automations/components/Automations.js').then((m) => ({
    default: m.Automations,
  })),
);

const Usage = lazy(() =>
  import('../../features/billing/components/Billing.js').then((m) => ({ default: m.Billing })),
);

const DocumentEditor = lazy(() =>
  import('../../features/document-editor/components/Editor.js').then((m) => ({
    default: m.Editor,
  })),
);

const Team = lazy(() =>
  import('../../features/team/components/Team.js').then((m) => ({ default: m.Team })),
);

const GamificationView = lazy(() =>
  import('../../features/gamification/components/GamificationView.js').then((m) => ({
    default: m.GamificationView,
  })),
);

const WarRoomArenaView = lazy(() =>
  import('../../features/gamification/components/WarRoomArenaView.js').then((m) => ({
    default: m.WarRoomArenaView,
  })),
);

const MultiRegionFailoverPanel = lazy(() =>
  import('../../features/settings/components/MultiRegionFailoverPanel.js').then((m) => ({
    default: m.MultiRegionFailoverPanel,
  })),
);

const ModuleAccessAdmin = lazy(() =>
  import('../../features/module-access/components/ModuleAccessAdmin.js').then((m) => ({
    default: m.ModuleAccessAdmin,
  })),
);

const Settings = lazy(() =>
  import('../../features/settings/components/Settings.js').then((m) => ({ default: m.Settings })),
);

const OnboardingTour = lazy(() =>
  import('../../features/onboarding/components/OnboardingTour.js').then((m) => ({
    default: m.OnboardingTour,
  })),
);

const VoiceHubView = lazy(() =>
  import('../../features/voice-hub/components/VoiceHubView.js').then((m) => ({
    default: m.VoiceHubView,
  })),
);

const Ldr = lazy(() => import('../../pages/Ldr.js').then((m) => ({ default: m.Ldr })));
const Account360 = lazy(() =>
  import('../../features/market-intelligence/components/Account360.js').then((m) => ({
    default: m.Account360,
  })),
);

const LeadApprovalDeck = lazy(() =>
  import('../../features/market-intelligence/components/LeadApprovalDeck.js').then((m) => ({
    default: m.LeadApprovalDeck,
  })),
);

const PropostasList = lazy(() =>
  import('../../features/crm360/components/PropostasList.js').then((m) => ({
    default: m.PropostasList,
  })),
);

export function PageFallback() {
  return (
    // data-testid: sinal determinístico de "módulo lazy ainda carregando" para os testes E2E
    // (tests/e2e/helpers.ts → waitForAppReady). Substitui waitForLoadState('networkidle'), que
    // nunca podia funcionar aqui: CrmBoard.tsx mantém um EventSource (SSE) aberto em /app/crm, e
    // uma conexão de longa duração impede a rede de ficar ociosa por definição.
    <div
      data-testid="page-fallback"
      className="p-8 space-y-6 w-full max-w-7xl mx-auto animate-pulse"
    >
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48 bg-white/10" />
        <Skeleton className="h-10 w-32 bg-white/10" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32 bg-white/5 rounded-2xl" />
        <Skeleton className="h-32 bg-white/5 rounded-2xl" />
        <Skeleton className="h-32 bg-white/5 rounded-2xl" />
      </div>
      <Skeleton className="h-96 w-full bg-white/5 rounded-3xl" />
    </div>
  );
}

export function AppLayout() {
  // OnboardingTour importa BrandOrb (@react-three/fiber/three), um chunk de ~900kB — React.lazy
  // só adia QUANDO o import roda, não SE ele roda. Sem esta checagem aqui, <OnboardingTour />
  // sendo renderizado incondicionalmente disparava esse import em toda montagem do MainLayout
  // (ou seja, em toda navegação autenticada), mesmo para quem já viu o tour — a checagem de
  // "já viu?" só existia dentro do próprio componente, tarde demais para evitar o fetch do chunk.
  const [showOnboardingTour] = useState(
    () =>
      typeof window !== 'undefined' && !window.localStorage.getItem('@prospector:has_seen_tour'),
  );
  const navigate = useNavigate();
  // CrmOverview dispara navegação entre tabs a partir de cards de atalho (ex.: KPI -> board de
  // leads); reaproveita a mesma URL de rota usada pelo Sidebar em vez de um mecanismo à parte.
  const handleCrmOverviewNavigate = useCallback(
    (tab: string) => navigate(`/app/${tab}`),
    [navigate],
  );

  return (
    <OnboardingGate>
      <MainLayout>
        {/* Rotas relativas a /app — a wildcard "/app/*" na Route pai (mais abaixo) faz o React
            Router casar estes paths aninhados contra o restante da URL automaticamente. */}{' '}
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Home Central dos 11 Módulos — primeira tela apresentada pós-login */}
            <Route index element={<CentralModulesHome />} />
            <Route path="home" element={<CentralModulesHome />} />
            {/* Dashboard analítico e operacional dos KPIs comerciais */}
            <Route path="dashboard" element={<AdaptiveDashboard />} />
            {/* PROMPT 6 — Workspace do cargo (JobRole) do usuário autenticado. Sem RequireRole:
              qualquer UserRole autenticado pode abrir; o próprio workspace resolve seu estado
              real (READY/NO_JOB_ROLE/NO_WORKSPACE_DEFINITION) a partir da sessão — nunca de
              query/body (ver GET /api/workspace/me). Deep link direto nunca revela mais do que a
              sessão do próprio usuário autoriza: cada módulo/quick action já vem marcado
              `locked` quando o UserRole real não atinge o gate daquela rota. */}
            <Route path="workspace" element={<WorkspaceHome />} />
            <Route path="prospect" element={<ProspectingHub />} />
            <Route path="crm" element={<CrmBoard />} />
            <Route path="crm360" element={<CrmOverview onNavigate={handleCrmOverviewNavigate} />} />
            {/* /api/mesa-tratamento já exige ADMIN/GESTOR/CLOSER/SDR no backend
              (mesaTratamento.routes.ts), mas a rota de frontend não tinha o mesmo gate — VISUALIZADOR
              via o item na Sidebar, navegava direto e só recebia um 403 cru dentro da tela real
              (achado do Piloto 026, mesmo bug de padrão já corrigido em usage/team/
              commercial_intelligence). */}
            <Route
              path="mesa-tratamento"
              element={
                <RequireRole allowedRoles={[...MESA_TRATAMENTO_ROLES]}>
                  <MesaTratamento />
                </RequireRole>
              }
            />
            <Route path="signals-risks" element={<SignalsAndRisksHub />} />
            <Route
              path="signals-risks/radar"
              element={<SignalsAndRisksHub initialView="radar" />}
            />
            <Route
              path="signals-risks/deal-risks"
              element={<SignalsAndRisksHub initialView="deal-risks" />}
            />
            <Route path="intelligence" element={<IntelligenceHub />} />
            <Route path="intelligence/elite-agent" element={<EliteCommercialAgentWorkspace />} />
            <Route path="intelligence/pending-actions" element={<AIPendingActionsInbox />} />
            <Route path="pending-actions" element={<AIPendingActionsInbox />} />
            {/* P0 #693 / residual 07: mesma regra de canAccessCopilotoIa (SDR ou superior) na rota,
              não só no item de navegação — evita 403 cru ao digitar a URL. */}
            <Route
              path="copiloto_ia"
              element={
                <RequireRole allowedRoles={[...COPILOTO_IA_ROLES]}>
                  <CopilotoIaHub />
                </RequireRole>
              }
            />
            <Route path="companies" element={<CompanyList />} />
            <Route path="contacts" element={<ContactList />} />
            <Route path="activities" element={<ActivityList />} />

            {/* P0 #693 item 6 (handoff 17→02): `/api/voice-hub/*`, `/api/outbound/*` e
              `/api/dialer-3cx/*` respondem 503 MODULE_NOT_READY por `legacyModuleGate` (intencional,
              isolamento por org — NÃO reabrir aqui). `/app/dialer` era só CadenceHub com rótulo
              "Discador 3CX": vai direto pra Cadências. Voice Hub/Outbound não têm UI honesta pro
              503 (caíam em erro genérico/404), então deep-link volta pro dashboard até o 12
              reabrir o gate; os módulos saem da navegação via NAV_HIDDEN_TABS (tabMeta.ts). */}
            <Route path="dialer" element={<Navigate to="/app/cadence" replace />} />
            <Route path="voice-hub" element={<VoiceHubView />} />
            <Route path="voice-hub/*" element={<VoiceHubView />} />
            <Route path="outbound/*" element={<Navigate to="/app/dashboard" replace />} />

            <Route path="cadence" element={<CadenceHub />} />
            <Route path="playbooks" element={<PlaybooksHub />} />
            <Route path="jornadas" element={<JornadasComerciaisHub />} />
            <Route path="processos" element={<ProcessosVendasHub />} />
            <Route path="roteiros" element={<RoteirosHub />} />
            <Route path="chatbook" element={<ChatbookHub />} />
            <Route path="roleplay" element={<RoleplayHub />} />
            <Route path="gamification" element={<GamificationView />} />
            <Route path="qualification_matrix" element={<QualificationMatrixPage />} />
            <Route path="objections_matrix" element={<ObjectionsMatrixPage />} />
            <Route path="topic_training" element={<TopicTrainingAcademy />} />
            <Route path="bitrix" element={<BitrixGuideHub />} />
            <Route path="reports" element={<ReportsHub />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="knowledge" element={<KnowledgeBase />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="gamification" element={<GamificationView />} />
            <Route path="winloss" element={<WinLossAnalysis />} />
            <Route path="war-room" element={<WarRoomArenaView />} />
            <Route path="market-intelligence" element={<Ldr />} />
            <Route path="market-intelligence/hub" element={<InteligenciaMercadoHub />} />
            <Route path="market-intelligence/accounts/:id" element={<Account360 />} />
            <Route path="market-intelligence/deck" element={<LeadApprovalDeck />} />
            <Route path="prospect/inteligente" element={<ProspeccaoInteligenteHub />} />
            <Route path="propostas" element={<PropostasList />} />
            {/* Comercial Inteligente — módulo executivo restrito. RequireRole bloqueia acesso
              direto por URL (não só o item de menu); a autorização real (que nunca confia no
              frontend) está em requireRole no backend — ver commercialIntelligence.routes.ts. */}
            <Route
              path="commercial_intelligence"
              element={
                <RequireRole allowedRoles={[...COMMERCIAL_INTELLIGENCE_ROLES]}>
                  <CommercialIntelligenceHub />
                </RequireRole>
              }
            />

            <Route path="daily-plan" element={<DailyPlanHub />} />
            <Route path="sdr-diagnostic" element={<JoaoReisDiagnosticHub />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="automations" element={<Automations />} />
            {/* /api/usage já exige ADMIN no backend (bootstrap/routes.ts), mas a rota de frontend
              nunca tinha o mesmo gate — digitar a URL direto renderizava a casca da tela real, que
              só falhava com um 403 em inglês cru dentro do card de erro (achado do Piloto 022,
              mesmo bug que RequireRole já existe pra prevenir, documentado no próprio componente). */}
            <Route
              path="usage"
              element={
                <RequireRole allowedRoles={['ADMIN']}>
                  <Usage />
                </RequireRole>
              }
            />
            <Route path="editor" element={<DocumentEditor />} />
            <Route
              path="team"
              element={
                <RequireRole allowedRoles={['ADMIN']}>
                  <Team />
                </RequireRole>
              }
            />
            <Route
              path="module-access"
              element={
                <RequireRole allowedRoles={['ADMIN']}>
                  <ModuleAccessAdmin />
                </RequireRole>
              }
            />
            <Route path="settings" element={<Settings />} />
            <Route
              path="failover"
              element={
                <RequireRole allowedRoles={['ADMIN', 'GESTOR']}>
                  <MultiRegionFailoverPanel />
                </RequireRole>
              }
            />
            <Route
              path="resilience"
              element={
                <RequireRole allowedRoles={['ADMIN', 'GESTOR']}>
                  <MultiRegionFailoverPanel />
                </RequireRole>
              }
            />

            {/* PILAR 05 — consomem /api/commercial-intelligence/*, que já exige
              COMMERCIAL_INTELLIGENCE_ROLES no backend; o guard evita renderizar a casca e
              tomar 403 cru em acesso direto por URL (mesmo padrão de commercial_intelligence). */}
            <Route
              path="forecast"
              element={
                <RequireRole allowedRoles={[...COMMERCIAL_INTELLIGENCE_ROLES]}>
                  <ForecastHub />
                </RequireRole>
              }
            />
            <Route
              path="metas"
              element={
                <RequireRole allowedRoles={[...COMMERCIAL_INTELLIGENCE_ROLES]}>
                  <MetasHub />
                </RequireRole>
              }
            />
            <Route
              path="pipeline_ponderado"
              element={
                <RequireRole allowedRoles={[...COMMERCIAL_INTELLIGENCE_ROLES]}>
                  <PipelinePonderadoHub />
                </RequireRole>
              }
            />

            {/* SETTINGS PER PILLAR */}
            <Route
              path="settings_hub"
              element={<PillarSettingsPlaceholder pillarName="Hub Comercial" />}
            />
            <Route
              path="settings_market"
              element={<PillarSettingsPlaceholder pillarName="Inteligência de Mercado" />}
            />
            <Route
              path="settings_sales"
              element={<PillarSettingsPlaceholder pillarName="Orquestração de Vendas" />}
            />
            <Route
              path="settings_performance"
              element={<PillarSettingsPlaceholder pillarName="Performance Comercial" />}
            />
            <Route
              path="settings_predictability"
              element={<PillarSettingsPlaceholder pillarName="Previsibilidade Comercial" />}
            />
            <Route
              path="settings_ai"
              element={<PillarSettingsPlaceholder pillarName="Inteligência Artificial" />}
            />
            <Route
              path="settings_automation"
              element={<PillarSettingsPlaceholder pillarName="Automação & Conectividade" />}
            />
            <Route
              path="settings_engagement"
              element={<PillarSettingsPlaceholder pillarName="Engajamento Comercial" />}
            />

            {/* Galeria interna de personagens — deliberadamente sem entrada em
                TAB_META/Sidebar: acesso direto por URL autenticada apenas. */}
            <Route path="characters" element={<CharacterGalleryView />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </Suspense>
        {/* Gamification and Navigation Global Layers */}
        {showOnboardingTour && (
          <Suspense fallback={null}>
            <OnboardingTour />
          </Suspense>
        )}
      </MainLayout>
      <Suspense fallback={null}>
        <LiveCopilotHUD />
      </Suspense>
    </OnboardingGate>
  );
}
