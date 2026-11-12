import { Suspense, useCallback, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import {
  COMMERCIAL_INTELLIGENCE_ROLES,
  COPILOTO_IA_ROLES,
  MESA_TRATAMENTO_ROLES,
} from '../../lib/auth/authorization.js';
import { MainLayout } from '../layout/MainLayout.js';
import { OnboardingGate } from '../layout/OnboardingGate.js';
import { RequireRole } from '../layout/RequireRole.js';
import {
  Account360,
  ActivityList,
  AdaptiveDashboard,
  AIPendingActionsInbox,
  Analytics,
  Automations,
  BitrixGuideHub,
  CadenceHub,
  Calendar,
  CharacterGalleryView,
  ChatbookHub,
  CommercialIntelligenceHub,
  CompanyList,
  ContactList,
  CopilotoIaHub,
  CrmBoard,
  CrmOverview,
  DailyPlanHub,
  DocumentEditor,
  EliteCommercialAgentWorkspace,
  ForecastHub,
  GamificationView,
  Integrations,
  InteligenciaMercadoHub,
  IntelligenceHub,
  JoaoReisDiagnosticHub,
  JornadasComerciaisHub,
  KnowledgeBase,
  Ldr,
  LeadApprovalDeck,
  LiveCopilotHUD,
  MesaTratamento,
  MetasHub,
  ModuleAccessAdmin,
  MultiRegionFailoverPanel,
  Notifications,
  ObjectionsMatrixPage,
  OnboardingTour,
  PillarSettingsPlaceholder,
  PipelinePonderadoHub,
  PlaybooksHub,
  ProcessosVendasHub,
  PropostasList,
  ProspeccaoInteligenteHub,
  ProspectingHub,
  QualificationMatrixPage,
  ReportsHub,
  RoleplayHub,
  RoteirosHub,
  Settings,
  SignalsAndRisksHub,
  Team,
  TopicTrainingAcademy,
  Usage,
  VoiceHubView,
  WarRoomArenaView,
  WinLossAnalysis,
  WorkspaceHome,
} from './lazyPages.js';
import { PageFallback } from './PageFallback.js';

// Layout autenticado (/app/*): OnboardingGate + MainLayout + árvore de rotas.
// Extraído de App.tsx na TAREFA-SANEAMENTO-016 (W4) — o componente raiz
// acumulava a orquestração de ~60 páginas lazy e ~60 rotas aninhadas.

export function AuthenticatedAppLayout() {
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
            <Route index element={<AdaptiveDashboard />} />
            {/* Alias explícito para /app/dashboard: TabType inclui 'dashboard' e Sidebar/
              CommandPalette navegam para `/app/${tab}` para TODO TabType (useNavigationBusBridge é
              a única exceção, com mapeamento especial só ali — ver comentário nesse hook). Sem esta
              rota, "/app/dashboard" batia no catch-all "*" abaixo e re-navegava silenciosamente
              para "/app", um redirect a mais e um histórico de navegação sujo para quem clicou em
              "Painel Central" na Sidebar ou no Command Palette (achado real desta auditoria, não
              coberto pelo teste de useNavigationBusBridge porque aquele hook já tinha o
              contorno certo só para o comando de voz). */}
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
