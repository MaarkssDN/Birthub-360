import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type Locale = 'pt-BR' | 'en-US';
export type TranslationVars = Record<string, string | number>;

const ptBR: Record<string, string> = {
  'common.back': 'Voltar',
  'common.continue': 'Continuar',
  'common.dismiss': 'Dispensar',
  'common.open': 'Abrir',
  'common.retry': 'Tentar novamente',
  'common.saveAndOpenDashboard': 'Salvar e ir para o Dashboard',
  'common.saving': 'Salvando...',
  'common.tryAgain': 'Tentar salvar novamente',
  'setup.welcomeTitle': 'Bem-vindo(a) ao Birth Hub 360',
  'setup.welcomeSubtitle': 'Configure os módulos que sua organização vai utilizar.',
  'setup.loadingModules': 'Carregando módulos da organização...',
  'setup.loadErrorTitle': 'Não foi possível carregar os módulos',
  'setup.confirmTitle': 'Confirmar configuração',
  'setup.confirmDescription':
    'Você selecionou {{count}} módulo(s). A configuração só é gravada quando você confirmar abaixo; depois, poderá alterá-la na aba de Administração.',
  'setup.requiredModule': 'Módulo Base Obrigatório',
  'setup.saveErrorTitle': 'Configuração não foi salva',
  'firstSteps.title': 'Primeiros passos',
  'firstSteps.subtitle':
    'Conclua as ações essenciais para o seu papel e deixe a plataforma pronta para o dia a dia.',
  'firstSteps.progress': '{{completed}} de {{total}} concluídos',
  'firstSteps.dismiss': 'Dispensar checklist',
  'firstSteps.complete': 'Marcar como concluído',
  'firstSteps.completed': 'Concluído',
  'firstSteps.step.workspace.title': 'Conheça seu workspace',
  'firstSteps.step.workspace.description':
    'Veja os módulos e atalhos liberados para o seu papel.',
  'firstSteps.step.crm.title': 'Abra o pipeline comercial',
  'firstSteps.step.crm.description':
    'Revise o funil, os negócios ativos e o próximo passo de cada oportunidade.',
  'firstSteps.step.settings.title': 'Revise preferências',
  'firstSteps.step.settings.description':
    'Ajuste tema, integrações e preferências que afetam sua rotina.',
  'firstSteps.step.forecast.title': 'Confira a previsibilidade',
  'firstSteps.step.forecast.description':
    'Valide metas, forecast e leitura de receita com o time de gestão.',
  'firstSteps.step.team.title': 'Ajuste a equipe',
  'firstSteps.step.team.description':
    'Convide usuários e confirme os papéis antes de liberar o acesso.',
  'firstSteps.step.moduleAccess.title': 'Libere módulos por pessoa',
  'firstSteps.step.moduleAccess.description':
    'Defina quais módulos cada usuário pode acessar na organização.',
  'firstSteps.step.prospect.title': 'Encontre uma conta para trabalhar',
  'firstSteps.step.prospect.description':
    'Use a prospecção para montar a próxima lista de contas e decisores.',
  'firstSteps.step.activities.title': 'Registre a primeira atividade',
  'firstSteps.step.activities.description':
    'Crie uma tarefa ou registre um contato para manter o histórico real.',
  'firstSteps.step.mesa.title': 'Abra a mesa de tratamento',
  'firstSteps.step.mesa.description':
    'Trabalhe a fila de leads e priorize o próximo atendimento comercial.',
  'firstSteps.step.dashboard.title': 'Acompanhe o dashboard',
  'firstSteps.step.dashboard.description':
    'Use os indicadores para acompanhar a operação sem alterar dados.',
  'firstSteps.step.reports.title': 'Explore relatórios',
  'firstSteps.step.reports.description':
    'Consulte os relatórios disponíveis para leitura e acompanhamento.',
};

const enUS: Record<string, string> = {
  'common.back': 'Back',
  'common.continue': 'Continue',
  'common.dismiss': 'Dismiss',
  'common.open': 'Open',
  'common.retry': 'Try again',
  'common.saveAndOpenDashboard': 'Save and go to Dashboard',
  'common.saving': 'Saving...',
  'common.tryAgain': 'Try saving again',
  'setup.welcomeTitle': 'Welcome to Birth Hub 360',
  'setup.welcomeSubtitle': 'Configure the modules your organization will use.',
  'setup.loadingModules': 'Loading organization modules...',
  'setup.loadErrorTitle': 'We could not load the modules',
  'setup.confirmTitle': 'Confirm configuration',
  'setup.confirmDescription':
    'You selected {{count}} module(s). The configuration is only saved when you confirm below; afterwards, you can change it in Administration.',
  'setup.requiredModule': 'Required base module',
  'setup.saveErrorTitle': 'Configuration was not saved',
  'firstSteps.title': 'First steps',
  'firstSteps.subtitle':
    'Complete the essential actions for your role and get the platform ready for daily work.',
  'firstSteps.progress': '{{completed}} of {{total}} completed',
  'firstSteps.dismiss': 'Dismiss checklist',
  'firstSteps.complete': 'Mark as completed',
  'firstSteps.completed': 'Completed',
  'firstSteps.step.workspace.title': 'Meet your workspace',
  'firstSteps.step.workspace.description':
    'See the modules and shortcuts enabled for your role.',
  'firstSteps.step.crm.title': 'Open the sales pipeline',
  'firstSteps.step.crm.description':
    'Review the funnel, active deals, and the next step for each opportunity.',
  'firstSteps.step.settings.title': 'Review preferences',
  'firstSteps.step.settings.description':
    'Adjust theme, integrations, and preferences that affect your routine.',
  'firstSteps.step.forecast.title': 'Check predictability',
  'firstSteps.step.forecast.description':
    'Validate goals, forecast, and revenue reading with the management team.',
  'firstSteps.step.team.title': 'Set up the team',
  'firstSteps.step.team.description':
    'Invite users and confirm roles before enabling access.',
  'firstSteps.step.moduleAccess.title': 'Enable modules per person',
  'firstSteps.step.moduleAccess.description':
    'Define which modules each user can access in the organization.',
  'firstSteps.step.prospect.title': 'Find an account to work on',
  'firstSteps.step.prospect.description':
    'Use prospecting to build the next list of accounts and decision makers.',
  'firstSteps.step.activities.title': 'Register the first activity',
  'firstSteps.step.activities.description':
    'Create a task or log a contact to keep the real history.',
  'firstSteps.step.mesa.title': 'Open the treatment desk',
  'firstSteps.step.mesa.description':
    'Work the lead queue and prioritize the next commercial touch.',
  'firstSteps.step.dashboard.title': 'Follow the dashboard',
  'firstSteps.step.dashboard.description':
    'Use the indicators to follow operations without changing data.',
  'firstSteps.step.reports.title': 'Explore reports',
  'firstSteps.step.reports.description':
    'Check the available reports for reading and follow-up.',
};

const MESSAGES: Record<Locale, Record<string, string>> = {
  'pt-BR': ptBR,
  'en-US': enUS,
};

const LOCALE_STORAGE_KEY = '@birthhub360:locale';

function isLocale(value: string | null): value is Locale {
  return value === 'pt-BR' || value === 'en-US';
}

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'pt-BR';
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(stored) ? stored : 'pt-BR';
}

export function translate(locale: Locale, key: string, vars?: TranslationVars): string {
  const template = MESSAGES[locale][key] ?? MESSAGES['pt-BR'][key] ?? key;
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = vars[name];
    return value === undefined ? `{{${name}}}` : String(value);
  });
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: TranslationVars) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);

  useEffect(() => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => setLocaleState(next), []);
  const t = useCallback((key: string, vars?: TranslationVars) => translate(locale, key, vars), [
    locale,
  ]);
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n deve ser usado dentro de <I18nProvider>.');
  }
  return context;
}
