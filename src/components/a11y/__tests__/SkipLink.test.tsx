// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { SkipLink } from '../SkipLink.js';

/**
 * Regressão WCAG 2.2 AA — critério 2.4.1 (Bypass Blocks): o shell precisa de
 * um skip link visível apenas em foco apontando para #main-content.
 */
describe('SkipLink', () => {
  afterEach(cleanup);

  it('renderiza link de fragmento para #main-content com rótulo acessível', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: 'Pular para o conteúdo principal' });
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('fica oculto visualmente até o foco (sr-only + focus:not-sr-only)', () => {
    const { container } = render(<SkipLink />);
    const link = container.querySelector('a');
    expect(link?.className).toContain('sr-only');
    expect(link?.className).toContain('focus:not-sr-only');
  });
});
