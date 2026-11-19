import { hasRequiredRole } from '../../lib/auth/authorization.js';

export type StepAudience = 'all' | 'management' | 'admin' | 'sales';

export interface FirstStep {
  id: string;
  audience: StepAudience;
  path: string;
  titleKey: string;
  descriptionKey: string;
}

const STEP_SPECS: ReadonlyArray<readonly [string, StepAudience, string]> = [
  ['workspace', 'all', '/app/workspace'],
  ['crm', 'all', '/app/crm'],
  ['settings', 'all', '/app/settings'],
  ['forecast', 'management', '/app/forecast'],
  ['team', 'admin', '/app/team'],
  ['moduleAccess', 'admin', '/app/module-access'],
  ['prospect', 'sales', '/app/prospect'],
  ['activities', 'sales', '/app/activities'],
  ['mesa', 'sales', '/app/mesa-tratamento'],
  ['dashboard', 'all', '/app/dashboard'],
  ['reports', 'all', '/app/reports'],
];

export const FIRST_STEPS: FirstStep[] = STEP_SPECS.map(([id, audience, path]) => ({
  id,
  audience,
  path,
  titleKey: `firstSteps.step.${id}.title`,
  descriptionKey: `firstSteps.step.${id}.description`,
}));

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
