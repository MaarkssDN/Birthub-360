import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { AgentForm } from '../../../../src/features/voice-hub/components/AgentForm.js';
import PlaygroundPage from '../../../../src/features/voice-hub/pages/Dashboard/Playground.js';

// a11y/noLabelWithoutControl: cada <label> precisa apontar para o seu campo.
describe('Voice Hub — rótulos acessíveis', () => {
  afterEach(() => {
    cleanup();
  });

  it('associa os rótulos do formulário de agente aos seus campos', () => {
    render(
      <MemoryRouter>
        <AgentForm />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Nome do Agente').tagName).toBe('INPUT');
    expect(screen.getByLabelText('Idioma Principal').tagName).toBe('SELECT');
    expect(screen.getByLabelText('Descrição e Missão').tagName).toBe('TEXTAREA');
  });

  it('associa os rótulos de modelo e temperatura do playground', () => {
    render(
      <MemoryRouter>
        <PlaygroundPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Modelo').tagName).toBe('SELECT');
    expect(screen.getByLabelText(/Temperatura/)).toHaveAttribute('type', 'range');
  });
});
