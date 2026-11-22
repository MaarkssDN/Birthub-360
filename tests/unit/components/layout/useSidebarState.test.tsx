import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LEGACY_SIDEBAR_COLLAPSED_KEY,
  SIDEBAR_COLLAPSED_KEY,
  useSidebarState,
} from '@/components/layout/hooks/useSidebarState';

let mockReducedMotion = false;
vi.mock('framer-motion', async (importOriginal) => ({
  ...(await importOriginal<typeof import('framer-motion')>()),
  useReducedMotion: () => mockReducedMotion,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => mockNavigate,
}));

interface ProbeProps {
  activeTab?: any;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
}

function Probe({
  activeTab = 'dashboard',
  collapsed,
  onToggleCollapse,
  onCloseMobile,
}: ProbeProps) {
  const state = useSidebarState({
    activeTab,
    collapsed,
    onToggleCollapse,
    onCloseMobile,
  });

  return (
    <div>
      <span data-testid="is-collapsed">{String(state.isCollapsed)}</span>
      <span data-testid="revenue-tree-expanded">
        {String(!!state.expandedGroups.revenue_tree)}
      </span>
      <span data-testid="hovered-group">{state.hoveredGroupId ?? 'none'}</span>
      <button type="button" onClick={state.toggleCollapse} data-testid="btn-toggle-collapse">
        Toggle Collapse
      </button>
      <button
        type="button"
        onClick={() => state.toggleGroupExpand('revenue_tree')}
        data-testid="btn-toggle-group"
      >
        Toggle Group
      </button>
      <button
        type="button"
        onClick={() => state.setHoveredGroupId('revenue_tree')}
        data-testid="btn-hover-group"
      >
        Hover Group
      </button>
      <button
        type="button"
        onClick={() => state.openTab('companies')}
        data-testid="btn-open-tab"
      >
        Open Companies
      </button>
      <button
        type="button"
        onClick={(e) => state.selectTab('companies', e)}
        data-testid="btn-select-tab"
      >
        Select Companies
      </button>
    </div>
  );
}

function renderProbe(props: ProbeProps = {}) {
  return render(
    <MemoryRouter initialEntries={['/app/dashboard']}>
      <Probe {...props} />
    </MemoryRouter>,
  );
}

describe('useSidebarState hook', () => {
  beforeEach(() => {
    mockReducedMotion = false;
    mockNavigate.mockClear();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('inicia com collapsed = false por padrão quando localStorage está vazio', () => {
    renderProbe();
    expect(screen.getByTestId('is-collapsed')).toHaveTextContent('false');
  });

  it('respeita estado salvo no localStorage (SIDEBAR_COLLAPSED_KEY)', () => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, 'true');
    renderProbe();
    expect(screen.getByTestId('is-collapsed')).toHaveTextContent('true');
  });

  it('respeita chave legada no localStorage (LEGACY_SIDEBAR_COLLAPSED_KEY)', () => {
    window.localStorage.setItem(LEGACY_SIDEBAR_COLLAPSED_KEY, 'true');
    renderProbe();
    expect(screen.getByTestId('is-collapsed')).toHaveTextContent('true');
  });

  it('alterna o estado de recolhimento via toggleCollapse e persiste no localStorage', () => {
    renderProbe();
    const btn = screen.getByTestId('btn-toggle-collapse');

    fireEvent.click(btn);
    expect(screen.getByTestId('is-collapsed')).toHaveTextContent('true');
    expect(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBe('true');

    fireEvent.click(btn);
    expect(screen.getByTestId('is-collapsed')).toHaveTextContent('false');
    expect(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBe('false');
  });

  it('prioriza externalCollapsed e onToggleCollapse quando fornecidos', () => {
    const onToggleCollapse = vi.fn();
    renderProbe({ collapsed: true, onToggleCollapse });

    expect(screen.getByTestId('is-collapsed')).toHaveTextContent('true');

    fireEvent.click(screen.getByTestId('btn-toggle-collapse'));
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBeNull();
  });

  it('gerencia expansão de grupos sanfona', () => {
    renderProbe();
    expect(screen.getByTestId('revenue-tree-expanded')).toHaveTextContent('true');

    fireEvent.click(screen.getByTestId('btn-toggle-group'));
    expect(screen.getByTestId('revenue-tree-expanded')).toHaveTextContent('false');

    fireEvent.click(screen.getByTestId('btn-toggle-group'));
    expect(screen.getByTestId('revenue-tree-expanded')).toHaveTextContent('true');
  });

  it('auto-expande grupo revenue_tree se activeTab for um sub-item (ex: crm360)', () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={['/app/dashboard']}>
        <Probe activeTab="dashboard" />
      </MemoryRouter>,
    );

    // Fecha manualmente
    fireEvent.click(screen.getByTestId('btn-toggle-group'));
    expect(screen.getByTestId('revenue-tree-expanded')).toHaveTextContent('false');

    // Navega para crm360
    rerender(
      <MemoryRouter initialEntries={['/app/crm360']}>
        <Probe activeTab="crm360" />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('revenue-tree-expanded')).toHaveTextContent('true');
  });

  it('gerencia hoveredGroupId para o menu rail', () => {
    renderProbe();
    expect(screen.getByTestId('hovered-group')).toHaveTextContent('none');

    fireEvent.click(screen.getByTestId('btn-hover-group'));
    expect(screen.getByTestId('hovered-group')).toHaveTextContent('revenue_tree');
  });

  it('openTab navega para /app/:tab e invoca onCloseMobile se fornecido', () => {
    const onCloseMobile = vi.fn();
    renderProbe({ onCloseMobile });

    fireEvent.click(screen.getByTestId('btn-open-tab'));
    expect(mockNavigate).toHaveBeenCalledWith('/app/companies');
    expect(onCloseMobile).toHaveBeenCalledTimes(1);
  });

  it('selectTab pula animação e navega direto se Ctrl/Cmd estiver pressionado', () => {
    renderProbe();
    fireEvent.click(screen.getByTestId('btn-select-tab'), { ctrlKey: true });
    expect(mockNavigate).toHaveBeenCalledWith('/app/companies');
  });
});
