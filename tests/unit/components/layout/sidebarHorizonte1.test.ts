import { describe, expect, it } from 'vitest';
import {
  ALL_MODULES,
  getActiveModuleId,
  getModuleById,
  getRailModules,
  getVisibleModuleItems,
  navTarget,
  PRODUCT_MODULES,
} from '../../../../src/components/layout/moduleRegistry.js';
import { TAB_META } from '../../../../src/components/layout/tabMeta.js';

const ALL_PERMISSIONS = {
  canAccessCommercialIntelligence: true,
  canAccessCopilotoIa: true,
  canManageOperations: true,
  isAdmin: true,
};

describe('moduleRegistry — 11 módulos oficiais + Hub (navegação modular)', () => {
  it('declara exatamente os 11 módulos oficiais (P01–P08, M09–M11) fora do Hub', () => {
    expect(PRODUCT_MODULES).toHaveLength(11);
    expect(PRODUCT_MODULES.map((m) => m.code)).toEqual([
      'P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'M09', 'M10', 'M11',
    ]);
    expect(ALL_MODULES).toHaveLength(12);
    expect(getModuleById('hub').label).toBe('Hub Central');
  });

  it('todo item de navegação resolve um TabType real com meta', () => {
    for (const m of ALL_MODULES) {
      for (const i of m.items) {
        expect(TAB_META[i.tab], `${m.id}/${i.tab}`).toBeDefined();
      }
    }
  });

  it('toda rota /app gerada por item é deep-linkável e prefixada', () => {
    for (const m of ALL_MODULES) {
      for (const i of getVisibleModuleItems(m, ALL_PERMISSIONS)) {
        expect(navTarget(i)).toMatch(/^\/app\//);
      }
    }
  });

  it('cobre as rotas que antes eram órfãs da sidebar (playbooks, jornadas, chatbook, reports, winloss, knowledge, propostas, pipeline_ponderado, mesa-tratamento, calendar)', () => {
    const tabs = new Set(
      ALL_MODULES.flatMap((m) => getVisibleModuleItems(m, ALL_PERMISSIONS).map((i) => i.tab)),
    );
    for (const orphan of [
      'playbooks', 'jornadas', 'processos', 'roteiros', 'chatbook',
      'reports', 'winloss', 'knowledge', 'propostas', 'pipeline_ponderado',
      'mesa-tratamento', 'calendar', 'prospect', 'market-intelligence',
    ]) {
      expect(tabs.has(orphan as never), orphan).toBe(true);
    }
  });

  it('resolve o módulo dono de cada rota /app', () => {
    expect(getActiveModuleId('/app')).toBe('hub');
    expect(getActiveModuleId('/app/dashboard')).toBe('hub');
    expect(getActiveModuleId('/app/crm')).toBe('p01');
    expect(getActiveModuleId('/app/crm360')).toBe('p01');
    expect(getActiveModuleId('/app/prospect/inteligente')).toBe('p02');
    expect(getActiveModuleId('/app/market-intelligence/hub')).toBe('p02');
    expect(getActiveModuleId('/app/jornadas')).toBe('p03');
    expect(getActiveModuleId('/app/analytics')).toBe('p04');
    expect(getActiveModuleId('/app/forecast')).toBe('p05');
    expect(getActiveModuleId('/app/copiloto_ia')).toBe('p06');
    expect(getActiveModuleId('/app/intelligence/elite-agent')).toBe('p06');
    expect(getActiveModuleId('/app/integrations')).toBe('p07');
    expect(getActiveModuleId('/app/mesa-tratamento')).toBe('p08');
    expect(getActiveModuleId('/app/team')).toBe('m09');
    expect(getActiveModuleId('/app/settings')).toBe('m09');
  });

  it('aplica gates de permissão nos itens restritos', () => {
    const noPerms = {
      canAccessCommercialIntelligence: false,
      canAccessCopilotoIa: false,
      canManageOperations: false,
      isAdmin: false,
    };
    const p06 = getModuleById('p06');
    const tabsP06 = getVisibleModuleItems(p06, noPerms).map((i) => i.tab);
    expect(tabsP06).not.toContain('copiloto_ia');
    expect(tabsP06).not.toContain('commercial_intelligence');

    const p07 = getModuleById('p07');
    expect(getVisibleModuleItems(p07, noPerms).map((i) => i.tab)).not.toContain('automations');
    expect(getVisibleModuleItems(p07, noPerms).map((i) => i.tab)).not.toContain('integrations');

    const m09 = getModuleById('m09');
    const tabsM09 = getVisibleModuleItems(m09, noPerms).map((i) => i.tab);
    expect(tabsM09).not.toContain('team');
    expect(tabsM09).not.toContain('module-access');
    expect(tabsM09).not.toContain('usage');
    expect(tabsM09).toContain('settings');

    // Com permissões, os itens restritos voltam.
    const tabsP06All = getVisibleModuleItems(p06, ALL_PERMISSIONS).map((i) => i.tab);
    expect(tabsP06All).toContain('copiloto_ia');
    expect(tabsP06All).toContain('commercial_intelligence');
  });

  it('rail expõe os 11 módulos; M10 é informational (mobile) e M11 navega para rota externa', () => {
    const rail = getRailModules(ALL_PERMISSIONS);
    expect(rail).toHaveLength(11);
    const m10 = rail.find((m) => m.id === 'm10');
    const m11 = rail.find((m) => m.id === 'm11');
    expect(m10?.home).toBeNull();
    expect(m10?.availability).toBe('mobile');
    expect(m11?.external).toBe(true);
    expect(m11?.home).toBe('/social-selling');
  });
});
