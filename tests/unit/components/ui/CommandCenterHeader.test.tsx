import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CommandCenterHeader } from '@/components/ui/CommandCenterHeader';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

function HeaderWithThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <CommandCenterHeader
        title="Cockpit Command Center 360°"
        pillar="01 · EXECUTIVE HUB"
        state="LIVE"
        description="Visão consolidada de inteligência comercial em tempo real"
        actions={
          <button
            type="button"
            data-testid="toggle-theme-btn"
            onClick={toggleTheme}
            className="px-4 py-2 min-h-[44px] min-w-[44px] rounded-lg bg-brand text-white"
          >
            Alternar Tema ({theme})
          </button>
        }
      />
    </div>
  );
}

describe('CommandCenterHeader & Mobile Cockpit Parity', () => {
  it('renderiza título, pilar, estado operacional e ações com suporte a toque', () => {
    const handleAction = vi.fn();
    render(
      <CommandCenterHeader
        title="Cockpit CRM"
        pillar="02 · CRM"
        state="PROCESSING"
        description="Gestão de Oportunidades e Leads"
        actions={
          <button
            type="button"
            onClick={handleAction}
            className="px-4 py-2 min-h-[44px] touch-manipulation"
          >
            Ação Rápida
          </button>
        }
      />
    );

    expect(screen.getByText('Cockpit CRM')).toBeInTheDocument();
    expect(screen.getByText('02 · CRM')).toBeInTheDocument();
    expect(screen.getByText('Gestão de Oportunidades e Leads')).toBeInTheDocument();

    const actionBtn = screen.getByText('Ação Rápida');
    fireEvent.click(actionBtn);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('suporta alternância de tema escuro/claro (Dark/Light mode)', () => {
    render(
      <ThemeProvider>
        <HeaderWithThemeToggle />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');

    const toggleBtn = screen.getByTestId('toggle-theme-btn');
    fireEvent.click(toggleBtn);

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
  });
});
