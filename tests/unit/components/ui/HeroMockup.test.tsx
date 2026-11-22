import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroMockup } from '../../../../src/components/ui/HeroMockup.js';

describe('HeroMockup', () => {
  it('mostra título e badge padrão e o conteúdo filho', () => {
    render(
      <HeroMockup>
        <p>Conteúdo do painel</p>
      </HeroMockup>,
    );
    expect(screen.getByText(/Revenue Command Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Produção · v4.2 Enterprise/i)).toBeInTheDocument();
    expect(screen.getByText('Conteúdo do painel')).toBeInTheDocument();
    expect(screen.getByText('https://app.birthhub360.com.br')).toBeInTheDocument();
  });

  it('aceita título e badge customizados', () => {
    render(
      <HeroMockup title="Painel interno" badge="Staging">
        <span>filho</span>
      </HeroMockup>,
    );
    expect(screen.getByText('Painel interno')).toBeInTheDocument();
    expect(screen.getByText('Staging')).toBeInTheDocument();
  });
});
