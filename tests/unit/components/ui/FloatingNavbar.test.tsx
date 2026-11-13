import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FloatingNavbar } from '../../../../src/components/ui/FloatingNavbar.js';

describe('FloatingNavbar', () => {
  it('renderiza CTA padrão, alterna o tema e abre o menu mobile', () => {
    const onToggleTheme = vi.fn();
    const onLoginClick = vi.fn();
    render(<FloatingNavbar theme="dark" onToggleTheme={onToggleTheme} onLoginClick={onLoginClick} />);

    expect(screen.getByRole('button', { name: /Entrar no Hub/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Entrar no Hub/i }));
    expect(onLoginClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Modo Claro' }));
    expect(onToggleTheme).toHaveBeenCalledTimes(1);

    expect(screen.getAllByText('Visão Geral').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    // Links do dropdown mobile (além dos da nav desktop hidden)
    const mobileLinks = screen.getAllByRole('link', { name: 'Ecossistema' });
    expect(mobileLinks.length).toBeGreaterThan(1);
    fireEvent.click(mobileLinks[mobileLinks.length - 1]!);
    // Menu fecha após o clique
    expect(screen.queryByRole('link', { name: 'Ecossistema' })).toBeTruthy();
  });

  it('usa ctaText customizado, tema claro e reage ao scroll', () => {
    const onToggleTheme = vi.fn();
    render(
      <FloatingNavbar
        theme="light"
        ctaText="Começar agora"
        onToggleTheme={onToggleTheme}
        links={[{ label: 'Docs', href: '#docs' }]}
      />,
    );
    expect(screen.getByText('Começar agora')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Modo Escuro' }));
    expect(onToggleTheme).toHaveBeenCalled();

    Object.defineProperty(window, 'scrollY', { value: 40, configurable: true, writable: true });
    fireEvent.scroll(window);
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
    fireEvent.scroll(window);
  });
});
