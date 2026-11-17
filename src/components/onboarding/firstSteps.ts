import { hasRequiredRole } from '../../lib/auth/authorization.js';

export type StepAudience = 'all' | 'management' | 'admin' | 'sales';

export interface FirstStep {
  id: string;
  audience: StepAudience;
  path: string;
  titleKey: string;
  descriptionKey: string;
}

export const FIRST_STEPS: FirstStep[] = [
  {
    id: 'workspace',
    audience: 'all',
    path: '/app/workspace',
    titleKey: 'firstSteps.step.workspace.title',
    descriptionKey: 'firstSteps.step.workspace.description',
  },
  {
    id: 'crm',
    audience: 'all',
    path: '/app/crm',
    titleKey: 'firstSteps.step.crm.title',
    descriptionKey: 'firstSteps.step.crm.description',
  },
  {
    id: 'settings',
    audience: 'all',
    path: '/app/settings',
    titleKey: 'firstSteps.step.settings.title',
    descriptionKey: 'firstSteps.step.settings.description',
  },
  {
    id: 'forecast',
    audience: 'management',
    path: '/app/forecast',
    titleKey: 'firstSteps.step.forecast.title',
    descriptionKey: 'firstSteps.step.forecast.description',
  },
  {
    id: 'team',
    audience: 'admin',
    path: '/app/team',
    titleKey: 'firstSteps.step.team.title',
    descriptionKey: 'firstSteps.step.team.description',
  },
  {
    id: 'moduleAccess',
    audience: 'admin',
    path: '/app/module-access',
    titleKey: 'firstSteps.step.moduleAccess.title',
    descriptionKey: 'firstSteps.step.moduleAccess.description',
  },
  {
    id: 'prospect',
    audience: 'sales',
    path: '/app/prospect',
    titleKey: 'firstSteps.step.prospect.title',
    descriptionKey: 'firstSteps.step.prospect.description',
  },
  {
    id: 'activities',
    audience: 'sales',
    path: '/app/activities',
    titleKey: 'firstSteps.step.activities.title',
    descriptionKey: 'firstSteps.step.activities.description',
  },
  {
    id: 'mesa',
    audience: 'sales',
    path: '/app/mesa-tratamento',
    titleKey: 'firstSteps.step.mesa.title',
    descriptionKey: 'firstSteps.step.mesa.description',
  },
  {
    id: 'dashboard',
    audience: 'all',
    path: '/app/dashboard',
    titleKey: 'firstSteps.step.dashboard.title',
    descriptionKey: 'firstSteps.step.dashboard.description',
  },
  {
    id: 'reports',
    audience: 'all',
    path: '/app/reports',
    titleKey: 'firstSteps.step.reports.title',
    descriptionKey: 'firstSteps.step.reports.description',
  },
];

export function matchesAudience(audience: StepAudience, role: string): boolean {
  switch (audience) {
    case 'all':
      return true;
    case 'management':
      return hasRequiredRole(role, ['ADMIN', 'GESTOR']);
    case 'admin':
      return role === 'ADMIN';
    case 'sales':
      // Mesmo piso de MESA_TRATAMENTO_ROLES (SDR/CLOSER e acima): prospect/atividades são
      // abertas a autenticados, mas a mesa de tratamento exige este conjunto no backend.
      return hasRequiredRole(role, ['SDR', 'CLOSER']);
    default:
      return false;
  }
}

export function getFirstStepsForRole(role: string): FirstStep[] {
  return FIRST_STEPS.filter((step) => matchesAudience(step.audience, role));
}
