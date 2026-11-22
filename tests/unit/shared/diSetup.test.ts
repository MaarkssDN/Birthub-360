import { describe, it, expect } from 'vitest';
import { setupDI } from '@/shared/di/setup';
import { container } from '@/shared/di/container';

describe('shared/di setup', () => {
  it('registra os controllers e serviços centrais no container', () => {
    setupDI();

    for (const name of [
      'EventBus',
      'LeadController',
      'CompanyController',
      'ContactController',
      'AutomationController',
      'AnalyticsController',
      'CommercialIntelligenceController',
      'Crm360Controller',
      'BugReportController',
      'UsageController',
      'FeatureFlagsController',
      'CopilotoIaController',
    ]) {
      expect(container.resolve(name), name).toBeTruthy();
    }
  });
});
