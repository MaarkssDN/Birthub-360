/**
 * Feature Flags for Design V2
 * Agente 33 (Célia) — Fase 1: Fundação
 */

export const DESIGN_V2_FLAGS = {
  /** Novos design tokens (cores, tipografia, espaçamento) */
  NEW_TOKENS: 'design.newTokens',
  /** Novos componentes UI v2 */
  NEW_COMPONENTS: 'design.newComponents',
  /** Nova navegação e layout */
  NEW_NAVIGATION: 'design.newNavigation',
  /** Novos estados de UI */
  NEW_UI_STATES: 'design.newUIStates',
  /** Novas landing pages */
  NEW_LANDING: 'design.newLanding',
  /** Novo onboarding */
  NEW_ONBOARDING: 'design.newOnboarding',
  /** Novos dashboards */
  NEW_DASHBOARDS: 'design.newDashboards',
  /** Novo sistema de motion v2 */
  NEW_MOTION: 'design.newMotion',
  /** Novos assets de marca */
  NEW_BRAND_ASSETS: 'design.newBrandAssets',
  /** Flag global para design v2 */
  V2_ENABLED: 'design.v2Enabled',
} as const;

export type DesignV2Flag = (typeof DESIGN_V2_FLAGS)[keyof typeof DESIGN_V2_FLAGS];

/**
 * Check if a design v2 feature flag is enabled
 * @param flag - The feature flag to check
 * @returns boolean indicating if the flag is enabled
 */
export function isDesignV2Enabled(flag: DesignV2Flag): boolean {
  // Flags v2 são opt-in explícito em TODOS os ambientes. O atalho anterior
  // (`import.meta.env.DEV → true`) vazava para CI/E2E: o Vite 6 deriva
  // import.meta.env.DEV de `process.env.NODE_ENV === 'production'`, então um
  // `vite build` com NODE_ENV=test (todos os workflows de teste) compilava
  // DEV=true — e o middleware Vite de testes sem dist também é DEV — fazendo
  // Landing360V2 e a navegação v2 renderizarem nas suítes que homologam a v1
  // (phase05-homologation, regressão visual). Em dev local, opt-in via console:
  // localStorage.setItem('design.newLanding', 'true').
  const enabled = localStorage.getItem(flag);
  return enabled === 'true';
}

/**
 * Set a design v2 feature flag
 * @param flag - The feature flag to set
 * @param enabled - Whether to enable or disable the flag
 */
export function setDesignV2Flag(flag: DesignV2Flag, enabled: boolean): void {
  localStorage.setItem(flag, enabled.toString());
}

/**
 * Toggle a design v2 feature flag
 * @param flag - The feature flag to toggle
 */
export function toggleDesignV2Flag(flag: DesignV2Flag): void {
  const current = isDesignV2Enabled(flag);
  setDesignV2Flag(flag, !current);
}

/**
 * Enable all design v2 features
 */
export function enableAllDesignV2(): void {
  Object.values(DESIGN_V2_FLAGS).forEach((flag) => {
    setDesignV2Flag(flag, true);
  });
}

/**
 * Disable all design v2 features
 */
export function disableAllDesignV2(): void {
  Object.values(DESIGN_V2_FLAGS).forEach((flag) => {
    setDesignV2Flag(flag, false);
  });
}
