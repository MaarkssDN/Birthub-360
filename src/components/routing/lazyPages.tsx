import { lazy } from 'react';

// Registro central de páginas lazy (code-splitting). Extraído de App.tsx na
// TAREFA-SANEAMENTO-016 (W4): o arquivo raiz acumulava ~330 linhas de declarações
// lazy que pertencem ao roteamento, não à composição de providers.

export const SetupWizard = lazy(() =>
  import('../../features/onboarding/components/SetupWizard.js').then((m) => ({
    default: m.SetupWizard,
  })),
);

export const LiveCopilotHUD = lazy(() =>
  import('../../features/copilot/components/LiveCopilotHUD.js').then((m) => ({
    default: m.LiveCopilotHUD,
  })),
);

export const DesignLabPage = lazy(() =>
  import('../../features/design-lab/DesignLabPage.js').then((m) => ({ default: m.DesignLabPage })),
);

// Galeria interna de homologação dos 29 personagens digitais (missão de expansão
// visual 9→29). Rota autenticada em /app/characters, propositalmente FORA do
// TabType/navGroups: não aparece na Sidebar, no Command Palette nem no
// ModuleAgentWidget — superfície de validação para QA/Design/Revisão (Agente 24).
export const CharacterGalleryView = lazy(() =>
  import('../../features/characters/CharacterGalleryView.js').then((m) => ({
    default: m.CharacterGalleryView,
  })),
);

// Lazy loaded feature modules
export const SocialSellingHub = lazy(() =>
  import('../../features/social-selling/components/SocialSellingHub.js').then((m) => ({
    default: m.SocialSellingHub,
  })),
);
export const AdaptiveDashboard = lazy(() =>
  import('../../features/dashboard/components/AdaptiveDashboard.js').then((m) => ({
    default: m.AdaptiveDashboard,
  })),
);
export const WorkspaceHome = lazy(() =>
  import('../../features/workspace/components/WorkspaceHome.js').then((m) => ({
    default: m.WorkspaceHome,
  })),
);

export const ResetPasswordScreen = lazy(() =>
  import('../../features/auth/components/ResetPasswordScreen.js').then((m) => ({
    default: m.ResetPasswordScreen,
  })),
);
export const ProspectingHub = lazy(() =>
  import('../../features/prospecting/components/ProspectingHub.js').then((m) => ({
    default: m.ProspectingHub,
  })),
);
export const CrmBoard = lazy(() =>
  import('../../components/CrmBoard.js').then((m) => ({ default: m.CrmBoard })),
);
export const CrmOverview = lazy(() =>
  import('../../features/crm360/components/CrmOverview.js').then((m) => ({
    default: m.CrmOverview,
  })),
);
export const IntelligenceHub = lazy(() =>
  import('../../features/intelligence/components/IntelligenceHub.js').then((m) => ({
    default: m.IntelligenceHub,
  })),
);
// Rota isolada do Agente Comercial de Elite (NBA): removida por engano no commit 2ab1b535 (varredura
// "commit remaining pending changes") e coberta por tests/e2e/elite-commercial-agent-nba.spec.ts.
export const AIPendingActionsInbox = lazy(() =>
  import('../../features/intelligence/components/AIPendingActionsInbox.js').then((m) => ({
    default: m.AIPendingActionsInbox,
  })),
);
export const EliteCommercialAgentWorkspace = lazy(() =>
  import('../../features/intelligence/components/EliteCommercialAgentWorkspace.js').then((m) => ({
    default: m.EliteCommercialAgentWorkspace,
  })),
);
// P0 #693 (Agente 02): a tab `copiloto_ia` ("Copiloto IA") abria o Elite Agent (NBA) — rótulo
// e tela divergentes. A tela canônica do Copiloto Comercial IA é `CopilotoIaHub` (Conversas +
// Configurações; LeadCopilotoPanel já navega para /app/copiloto_ia?tab=conversas&leadId=...).
// O Elite Agent continua na rota própria `intelligence/elite-agent`.
export const CopilotoIaHub = lazy(() =>
  import('../../features/copiloto-ia/components/CopilotoIaHub.js').then((m) => ({
    default: m.CopilotoIaHub,
  })),
);
export const CompanyList = lazy(() =>
  import('../../features/companies/components/CompanyList.js').then((m) => ({
    default: m.CompanyList,
  })),
);
export const ContactList = lazy(() =>
  import('../../features/contacts/components/ContactList.js').then((m) => ({
    default: m.ContactList,
  })),
);
export const ActivityList = lazy(() =>
  import('../../features/activities/components/ActivityList.js').then((m) => ({
    default: m.ActivityList,
  })),
);
export const CadenceHub = lazy(() =>
  import('../../features/cadence/components/CadenceHub.js').then((m) => ({
    default: m.CadenceHub,
  })),
);
export const RoleplayHub = lazy(() =>
  import('../../features/roleplay/components/RoleplayHub.js').then((m) => ({
    default: m.RoleplayHub,
  })),
);
export const QualificationMatrixPage = lazy(() =>
  import('../../features/playbook/components/QualificationMatrixPage.js').then((m) => ({
    default: m.QualificationMatrixPage,
  })),
);
export const ObjectionsMatrixPage = lazy(() =>
  import('../../features/playbook/components/ObjectionsMatrixPage.js').then((m) => ({
    default: m.ObjectionsMatrixPage,
  })),
);
export const TopicTrainingAcademy = lazy(() =>
  import('../../features/intelligence/components/TopicTrainingAcademy.js').then((m) => ({
    default: m.TopicTrainingAcademy,
  })),
);
export const BitrixGuideHub = lazy(() =>
  import('../../features/intelligence/components/BitrixGuideHub.js').then((m) => ({
    default: m.BitrixGuideHub,
  })),
);
export const ReportsHub = lazy(() =>
  import('../../features/intelligence/components/ReportsHub.js').then((m) => ({
    default: m.ReportsHub,
  })),
);
export const ChatbookHub = lazy(() =>
  import('../../features/chatbook/components/ChatbookHub.js').then((m) => ({
    default: m.ChatbookHub,
  })),
);
export const Integrations = lazy(() =>
  import('../../features/integrations/components/Integrations.js').then((m) => ({
    default: m.Integrations,
  })),
);
export const KnowledgeBase = lazy(() =>
  import('../../features/knowledge/components/Base.js').then((m) => ({ default: m.Base })),
);
export const Analytics = lazy(() =>
  import('../../features/analytics/components/Analytics.js').then((m) => ({
    default: m.Analytics,
  })),
);
export const WinLossAnalysis = lazy(() =>
  import('../../features/analytics/components/WinLossAnalysis.js').then((m) => ({
    default: m.WinLossAnalysis,
  })),
);
export const CommercialIntelligenceHub = lazy(() =>
  import('../../features/commercial-intelligence/components/CommercialIntelligenceHub.js').then(
    (m) => ({
      default: m.CommercialIntelligenceHub,
    }),
  ),
);

export const SignalsAndRisksHub = lazy(() =>
  import('../../features/signals-risks/components/SignalsAndRisksHub.js').then((m) => ({
    default: m.SignalsAndRisksHub,
  })),
);

// PILAR 05
export const ForecastHub = lazy(() =>
  import('../../features/predictability/components/ForecastHub.js').then((m) => ({
    default: m.ForecastHub,
  })),
);
export const MetasHub = lazy(() =>
  import('../../features/predictability/components/MetasHub.js').then((m) => ({
    default: m.MetasHub,
  })),
);
export const PipelinePonderadoHub = lazy(() =>
  import('../../features/predictability/components/PipelinePonderadoHub.js').then((m) => ({
    default: m.PipelinePonderadoHub,
  })),
);

// SETTINGS PER PILLAR
export const PillarSettingsPlaceholder = lazy(() =>
  import('../../features/settings/components/PillarSettingsPlaceholder.js').then((m) => ({
    default: m.PillarSettingsPlaceholder,
  })),
);

// PILAR 03 - ORQUESTRAÇÃO DE VENDAS
export const PlaybooksHub = lazy(() =>
  import('../../features/sales-orchestration/components/PlaybooksHub.js').then((m) => ({
    default: m.PlaybooksHub,
  })),
);
export const JornadasComerciaisHub = lazy(() =>
  import('../../features/sales-orchestration/components/JornadasComerciaisHub.js').then((m) => ({
    default: m.JornadasComerciaisHub,
  })),
);
export const ProcessosVendasHub = lazy(() =>
  import('../../features/sales-orchestration/components/ProcessosVendasHub.js').then((m) => ({
    default: m.ProcessosVendasHub,
  })),
);
export const RoteirosHub = lazy(() =>
  import('../../features/sales-orchestration/components/RoteirosHub.js').then((m) => ({
    default: m.RoteirosHub,
  })),
);

// PILAR 02 - INTELIGÊNCIA DE MERCADO
export const InteligenciaMercadoHub = lazy(() =>
  import('../../features/market-intelligence/components/InteligenciaMercadoHub.js').then((m) => ({
    default: m.InteligenciaMercadoHub,
  })),
);
export const ProspeccaoInteligenteHub = lazy(() =>
  import('../../features/market-intelligence/components/ProspeccaoInteligenteHub.js').then((m) => ({
    default: m.ProspeccaoInteligenteHub,
  })),
);

export const DailyPlanHub = lazy(() =>
  import('../../features/commercial-intelligence/components/DailyPlanHub.js').then((m) => ({
    default: m.DailyPlanHub,
  })),
);
export const JoaoReisDiagnosticHub = lazy(() =>
  import('../../features/commercial-intelligence/components/JoaoReisDiagnosticHub.js').then(
    (m) => ({
      default: m.JoaoReisDiagnosticHub,
    }),
  ),
);
export const Calendar = lazy(() =>
  import('../../features/calendar/components/Calendar.js').then((m) => ({ default: m.Calendar })),
);
export const MesaTratamento = lazy(() =>
  import('../../features/mesa-tratamento/components/MesaTratamento.js').then((m) => ({
    default: m.MesaTratamento,
  })),
);
export const Notifications = lazy(() =>
  import('../../features/notifications/components/Notifications.js').then((m) => ({
    default: m.Notifications,
  })),
);
export const Automations = lazy(() =>
  import('../../features/automations/components/Automations.js').then((m) => ({
    default: m.Automations,
  })),
);
export const Usage = lazy(() =>
  import('../../features/billing/components/Billing.js').then((m) => ({ default: m.Billing })),
);
export const DocumentEditor = lazy(() =>
  import('../../features/document-editor/components/Editor.js').then((m) => ({
    default: m.Editor,
  })),
);
export const Team = lazy(() =>
  import('../../features/team/components/Team.js').then((m) => ({ default: m.Team })),
);
export const GamificationView = lazy(() =>
  import('../../features/gamification/components/GamificationView.js').then((m) => ({
    default: m.GamificationView,
  })),
);
export const WarRoomArenaView = lazy(() =>
  import('../../features/gamification/components/WarRoomArenaView.js').then((m) => ({
    default: m.WarRoomArenaView,
  })),
);
export const MultiRegionFailoverPanel = lazy(() =>
  import('../../features/settings/components/MultiRegionFailoverPanel.js').then((m) => ({
    default: m.MultiRegionFailoverPanel,
  })),
);
export const ModuleAccessAdmin = lazy(() =>
  import('../../features/module-access/components/ModuleAccessAdmin.js').then((m) => ({
    default: m.ModuleAccessAdmin,
  })),
);
export const Settings = lazy(() =>
  import('../../features/settings/components/Settings.js').then((m) => ({ default: m.Settings })),
);
export const OnboardingTour = lazy(() =>
  import('../../features/onboarding/components/OnboardingTour.js').then((m) => ({
    default: m.OnboardingTour,
  })),
);
export const PrivacyPolicy = lazy(() => import('../../pages/PrivacyPolicy.js'));
export const TermsOfUse = lazy(() => import('../../pages/TermsOfUse.js'));
export const Landing360 = lazy(() =>
  import('../../features/landing/pages/Landing360.js').then((m) => ({ default: m.Landing360 })),
);

export const LandingInnovative = lazy(() =>
  import('../../features/voice-hub/pages/LandingInnovative.js').then((m) => ({
    default: m.default,
  })),
);
export const VoiceHubView = lazy(() =>
  import('../../features/voice-hub/components/VoiceHubView.js').then((m) => ({
    default: m.VoiceHubView,
  })),
);
export const Ldr = lazy(() => import('../../pages/Ldr.js').then((m) => ({ default: m.Ldr })));
export const Account360 = lazy(() =>
  import('../../features/market-intelligence/components/Account360.js').then((m) => ({
    default: m.Account360,
  })),
);
export const LeadApprovalDeck = lazy(() =>
  import('../../features/market-intelligence/components/LeadApprovalDeck.js').then((m) => ({
    default: m.LeadApprovalDeck,
  })),
);

export const PropostasList = lazy(() =>
  import('../../features/crm360/components/PropostasList.js').then((m) => ({
    default: m.PropostasList,
  })),
);

export const PublicBookingPage = lazy(() =>
  import('../../features/calendar/components/PublicBookingPage.js').then((m) => ({
    default: m.PublicBookingPage,
  })),
);
