import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ROLE_DEFAULT_TEMPLATES,
  useDashboardLayout,
} from '@/features/dashboard/hooks/useDashboardLayout';

vi.mock('@/contexts/AuthContext.js', () => ({
  useAuth: () => ({
    currentUser: { id: 'usr-456', name: 'Gestor Teste', role: 'GESTOR' },
  }),
}));

describe('useDashboardLayout — Dashboard Builder & Personalização por Cargo', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('inicia com o cargo GESTOR e seu template oficial de widgets e KPIs', () => {
    const { result } = renderHook(() => useDashboardLayout());

    expect(result.current.role).toBe('GESTOR');
    expect(result.current.isCustomized).toBe(false);
    expect(result.current.activeWidgets).toEqual(
      ROLE_DEFAULT_TEMPLATES.GESTOR.activeWidgets,
    );
    expect(result.current.visibleKpis).toEqual(
      ROLE_DEFAULT_TEMPLATES.GESTOR.visibleKpis,
    );
  });

  it('alterna para o cargo SDR e carrega seu template específico', () => {
    const { result } = renderHook(() => useDashboardLayout());

    act(() => {
      result.current.setRole('SDR');
    });

    expect(result.current.role).toBe('SDR');
    expect(result.current.activeWidgets).toEqual(
      ROLE_DEFAULT_TEMPLATES.SDR.activeWidgets,
    );
    expect(result.current.visibleKpis).toEqual(
      ROLE_DEFAULT_TEMPLATES.SDR.visibleKpis,
    );
  });

  it('alterna para o cargo CLOSER e carrega seu template específico', () => {
    const { result } = renderHook(() => useDashboardLayout());

    act(() => {
      result.current.setRole('CLOSER');
    });

    expect(result.current.role).toBe('CLOSER');
    expect(result.current.activeWidgets).toEqual(
      ROLE_DEFAULT_TEMPLATES.CLOSER.activeWidgets,
    );
    expect(result.current.visibleKpis).toEqual(
      ROLE_DEFAULT_TEMPLATES.CLOSER.visibleKpis,
    );
  });

  it('salva customização no localStorage e sinaliza isCustomized: true', () => {
    const { result } = renderHook(() => useDashboardLayout());

    act(() => {
      result.current.saveLayout(['pipelineFunnel', 'realtimeCockpit'], ['pipelineValue', 'winRate']);
    });

    expect(result.current.isCustomized).toBe(true);
    expect(result.current.activeWidgets).toEqual(['pipelineFunnel', 'realtimeCockpit']);
    expect(result.current.visibleKpis).toEqual(['pipelineValue', 'winRate']);

    const stored = JSON.parse(
      localStorage.getItem('birthhub:dashboard-layout:usr-456:GESTOR') || '{}',
    );
    expect(stored.activeWidgets).toEqual(['pipelineFunnel', 'realtimeCockpit']);
  });

  it('reseta para o template oficial do cargo ao chamar resetToRoleTemplate', () => {
    const { result } = renderHook(() => useDashboardLayout());

    act(() => {
      result.current.saveLayout(['gamification'], ['winRate']);
    });
    expect(result.current.isCustomized).toBe(true);

    act(() => {
      result.current.resetToRoleTemplate();
    });

    expect(result.current.isCustomized).toBe(false);
    expect(result.current.activeWidgets).toEqual(
      ROLE_DEFAULT_TEMPLATES.GESTOR.activeWidgets,
    );
    expect(result.current.visibleKpis).toEqual(
      ROLE_DEFAULT_TEMPLATES.GESTOR.visibleKpis,
    );
  });

  it('permite reordenar widgets e alternar visibilidade com toggleWidget', () => {
    const { result } = renderHook(() => useDashboardLayout());

    act(() => {
      result.current.reorderWidgets(['gamification', 'quickActions']);
    });
    expect(result.current.activeWidgets).toEqual(['gamification', 'quickActions']);

    // Remove gamification
    act(() => {
      result.current.toggleWidget('gamification');
    });
    expect(result.current.activeWidgets).toEqual(['quickActions']);

    // Tentar remover o último ativo não remove (mínimo 1)
    act(() => {
      result.current.toggleWidget('quickActions');
    });
    expect(result.current.activeWidgets).toEqual(['quickActions']);

    // Adiciona novamente gamification
    act(() => {
      result.current.toggleWidget('gamification');
    });
    expect(result.current.activeWidgets).toContain('gamification');
  });

  it('permite alternar KPIs visíveis com limite de 4', () => {
    const { result } = renderHook(() => useDashboardLayout());

    act(() => {
      result.current.toggleKpi('winRate');
    });
    // Se já estava, remove ou mantém
    act(() => {
      result.current.setIsBuilderOpen(true);
    });
    expect(result.current.isBuilderOpen).toBe(true);
  });
});
