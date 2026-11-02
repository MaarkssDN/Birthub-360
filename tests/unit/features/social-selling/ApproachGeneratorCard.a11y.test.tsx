import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ApproachGeneratorCard } from '../../../../src/features/social-selling/components/ApproachGeneratorCard.js';

// a11y/noLabelWithoutControl: cada <label> do formulário precisa apontar para o seu campo.
describe('ApproachGeneratorCard — rótulos acessíveis', () => {
  afterEach(() => {
    cleanup();
  });

  it('associa cada rótulo do formulário ao seu campo', () => {
    render(<ApproachGeneratorCard />);

    expect(screen.getByLabelText(/Empresa Alvo/i)).toBe(
      screen.getByPlaceholderText(/Ex: Banco Neon, TOTVS/i),
    );
    expect(screen.getByLabelText(/Cargo do Decisor/i)).toBe(
      screen.getByPlaceholderText(/Ex: Diretor Comercial/i),
    );
    expect(screen.getByLabelText(/Segmento/i)).toBe(screen.getByPlaceholderText(/Ex: Fintech/i));
    expect(screen.getByLabelText(/Evento Gatilho/i)).toBe(
      screen.getByPlaceholderText(/Ex: Anúncio de rodada/i),
    );
    expect(screen.getByLabelText(/^Canal$/i).tagName).toBe('SELECT');
    expect(screen.getByLabelText(/Tom de Voz/i).tagName).toBe('SELECT');
  });
});
