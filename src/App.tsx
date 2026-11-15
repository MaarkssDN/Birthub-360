import { MotionConfig } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout, PageFallback } from './components/layout/AppLayout.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { ProtectedRoute } from './components/layout/ProtectedRoute.js';
import { RequireModuleAccess } from './components/layout/RequireModuleAccess.js';
import { RequireRole } from './components/layout/RequireRole.js';
import { ClickSpark } from './components/ui/ClickSpark.js';
import { ActiveRecordProvider } from './contexts/ActiveRecordContext.js';
import { AuthProvider } from './contexts/AuthContext.js';
import { BrandProvider } from './contexts/BrandContext.js';
import { DailyClosingProvider } from './contexts/DailyClosingContext.js';
import { ExperienceModeProvider } from './contexts/ExperienceModeContext.js';
import { ThemeProvider } from './contexts/ThemeContext.js';

const SetupWizard = lazy(() =>
  import('./features/onboarding/components/SetupWizard.js').then((m) => ({
    default: m.SetupWizard,
  })),
);

const DesignLabPage = lazy(() =>
  import('./features/design-lab/DesignLabPage.js').then((m) => ({ default: m.DesignLabPage })),
);

const CentralModulesHome = lazy(() =>
  import('./features/home/CentralModulesHome.js').then((m) => ({
    default: m.CentralModulesHome,
  })),
);

const SocialSellingHub = lazy(() =>
  import('./features/social-selling/components/SocialSellingHub.js').then((m) => ({
    default: m.SocialSellingHub,
  })),
);

const ResetPasswordScreen = lazy(() =>
  import('./features/auth/components/ResetPasswordScreen.js').then((m) => ({
    default: m.ResetPasswordScreen,
  })),
);
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy.js'));
const TermsOfUse = lazy(() => import('./pages/TermsOfUse.js'));
const Landing360 = lazy(() =>
  import('./features/landing/pages/Landing360.js').then((m) => ({ default: m.Landing360 })),
);

const LandingInnovative = lazy(() =>
  import('./features/voice-hub/pages/LandingInnovative.js').then((m) => ({ default: m.default })),
);

const PublicBookingPage = lazy(() =>
  import('./features/calendar/components/PublicBookingPage.js').then((m) => ({
    default: m.PublicBookingPage,
  })),
);

export default function App() {
  return (
    // reducedMotion="user" faz o framer-motion respeitar prefers-reduced-motion do SO/navegador,
    // complementando o @media (prefers-reduced-motion: reduce) já aplicado às animações CSS puras
    // em globals.css (que não cobre transitions/animate props do framer-motion).
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <ExperienceModeProvider>
          <BrandProvider>
            <AuthProvider>
              <DailyClosingProvider>
                <ActiveRecordProvider>
                  <ClickSpark />
                  <Suspense fallback={<PageFallback />}>
                    <Routes>
                      {/* Porta de entrada do produto — revisado (11/09/2026) por pedido explícito
                        do usuário: a tentativa anterior (LoginScreen com linguagem visual do Hub,
                        formulário já visível) misturava o gate institucional com o formulário na
                        mesma tela, e não era "a tela do Hub" que o usuário pedia (referência
                        visual fornecida: hero + emblema + CTA único "Explorar Hub", SEM campos de
                        login à vista). "/" volta a mostrar `WelcomeScreen` (mesmo componente de
                        "/welcome") — o formulário de fato continua só em "/login" (ver
                        tests/e2e/helpers.ts::signUp e outros specs que navegam direto pra lá). Um
                        usuário já autenticado que caia aqui é redirecionado pro Hub
                        automaticamente (guard dentro do próprio WelcomeScreen, espelhando o mesmo
                        guard de LoginScreen). Login/cadastro continuam levando direto ao Hub (ver
                        Pilot 031/032 em .claude/PILOTS.md) — o CRM (/app) não é o destino padrão
                        pós-login; continua existindo e acessível a partir dos círculos do Hub. */}
                      <Route
                        path="/design-lab/command-language"
                        element={
                          <ProtectedRoute>
                            <DesignLabPage section="command-language" />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/design-lab/components-v2"
                        element={
                          <ProtectedRoute>
                            <DesignLabPage section="components-v2" />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/design-lab/home-proposals"
                        element={
                          <ProtectedRoute>
                            <CentralModulesHome />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/" element={<Landing360 />} />
                      <Route path="/welcome" element={<Landing360 initialScreen="intro" />} />
                      <Route path="/landing-new" element={<LandingInnovative />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/terms" element={<TermsOfUse />} />
                      {/* `/select-brand` era a escolha entre as duas marcas anteriores. Com marca
                        única a tela deixou de existir; a rota permanece como redirecionamento
                        para não quebrar link salvo, atalho de app instalado ou bookmark. */}
                      <Route path="/select-brand" element={<Navigate to="/welcome" replace />} />
                      <Route path="/login" element={<Landing360 initialScreen="login" />} />
                      <Route path="/reset-password" element={<ResetPasswordScreen />} />
                      <Route path="/book/:slug" element={<PublicBookingPage />} />
                      {/* Hub Executivo ("os círculos") — tela de destinos pós-login: Central
                        Comercial (CRM) + módulos executivos concedidos individualmente via
                        ModuleAccessAdmin (/app/module-access) + atalhos para ferramentas externas
                        (Bitrix24, webmail, portais). Fica fora de /app/* de propósito — sem
                        MainLayout/Sidebar do CRM — mas ainda exige login (ProtectedRoute). */}
                      <Route path="/hub" element={<Navigate to="/app" replace />} />
                      {/* Módulos executivos — NUNCA parte do CRM: pedido explícito do usuário ("não
                        quero que apareça no CRM, só nos círculos") para tirar peso/navegação do
                        CRM. Por isso ficam fora de /app/* — sem MainLayout/Sidebar do CRM — mas
                        ainda exigem login (ProtectedRoute) e a concessão real do módulo
                        (RequireModuleAccess, que nunca confia em e-mail nem em papel: a
                        autorização real vem de ModuleAccessGrant no banco).
                        Atualização (09/2026): existiam mais 3 rotas aqui (`/treinamento-birthhub360`,
                        `/proposta-comercial`, `/hub-inteligencia-marketing`) — aposentadas junto
                        com seus módulos no catálogo (ver module-catalog.ts) por serem conteúdo
                        proprietário da Birth Hub 360, pedido explícito do usuário ("Birth Hub 360 não é
                        ninguém, não é nem mais pra existir"). `social-selling` continua, rerotulado
                        para a marca Birth Hub 360. */}
                      <Route
                        path="/social-selling"
                        element={
                          <ProtectedRoute>
                            <RequireModuleAccess moduleKey="social-selling">
                              <SocialSellingHub />
                            </RequireModuleAccess>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/setup"
                        element={
                          <ProtectedRoute>
                            <RequireRole allowedRoles={['ADMIN']}>
                              <SetupWizard />
                            </RequireRole>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/app/*"
                        element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <AppLayout />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      <Route path="*" element={<Navigate to="/welcome" replace />} />
                    </Routes>
                  </Suspense>
                </ActiveRecordProvider>
              </DailyClosingProvider>
            </AuthProvider>
          </BrandProvider>
        </ExperienceModeProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
