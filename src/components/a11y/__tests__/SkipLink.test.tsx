import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SkipLink } from '../SkipLink.js';

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  window.history.replaceState(null, '', '/');
});

describe('SkipLink (WCAG 2.4.1 Bypass Blocks)', () => {
  it('renderiza como link com nome acessível e href para o alvo padrão', () => {
    render(React.createElement(SkipLink));
    const link = screen.getByRole('link', { name: 'Pular para o conteúdo principal' });
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('respeita targetId e children customizados', () => {
    render(
      React.createElement(
        SkipLink,
        { targetId: 'conteudo', 'data-testid': 'skip' } as any,
        'Ir para o conteúdo',
      ),
    );
    const link = screen.getByRole('link', { name: 'Ir para o conteúdo' });
    expect(link).toHaveAttribute('href', '#conteudo');
  });

  it('no clique, move o foco para o elemento alvo e rola até ele', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const main = document.createElement('main');
    main.id = 'main-content';
    document.body.appendChild(main);

    render(React.createElement(SkipLink));
    const link = screen.getByRole('link', { name: 'Pular para o conteúdo principal' });
    fireEvent.click(link);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(main);
    expect(main).toHaveAttribute('tabindex', '-1');
    expect(window.location.hash).toBe('#main-content');
  });

  it('não força tabindex=-1 quando o alvo já é focável por atributo próprio', () => {
    const main = document.createElement('main');
    main.id = 'main-content';
    main.setAttribute('tabindex', '0');
    document.body.appendChild(main);

    render(React.createElement(SkipLink));
    fireEvent.click(screen.getByRole('link'));

    expect(main).toHaveAttribute('tabindex', '0');
  });

  it('com alvo inexistente, não impede o comportamento padrão do âncora', () => {
    render(React.createElement(SkipLink));
    const link = screen.getByRole('link');
    // Sem #main-content no documento: handleClick retorna cedo e o clique
    // segue o fluxo padrão (navegação de âncora), sem erro.
    expect(() => fireEvent.click(link)).not.toThrow();
  });

  it('respeita onClick externo que chama preventDefault', () => {
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault());
    const main = document.createElement('main');
    main.id = 'main-content';
    document.body.appendChild(main);

    render(React.createElement(SkipLink, { onClick }));
    fireEvent.click(screen.getByRole('link'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(document.activeElement).not.toBe(main);
  });
});
