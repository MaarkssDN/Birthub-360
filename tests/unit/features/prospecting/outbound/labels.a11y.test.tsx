import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoginScreen } from '../../../../../src/features/prospecting/outbound/components/LoginScreen.js';
import { OllamaTerminalTab } from '../../../../../src/features/prospecting/outbound/components/OllamaTerminalTab.js';
import type { AIConfig } from '../../../../../src/features/prospecting/outbound/types.js';

// a11y/noLabelWithoutControl: cada <label> precisa apontar para o seu campo.
describe('Prospecção outbound — rótulos acessíveis', () => {
  afterEach(() => {
    cleanup();
  });

  it('associa os rótulos Email e Senha aos campos do login', () => {
    render(<LoginScreen onLogin={vi.fn()} isDark={false} />);

    const email = screen.getByLabelText('Email');
    const senha = screen.getByLabelText('Senha');
    expect(email.tagName).toBe('INPUT');
    expect(senha).toHaveAttribute('type', 'password');
    expect(email.id).not.toBe(senha.id);
  });

  it('associa o rótulo do prompt de teste ao campo do terminal Ollama', () => {
    render(
      <OllamaTerminalTab
        aiConfig={{} as AIConfig}
        setAiConfig={vi.fn()}
        ollamaStatus={{ online: false }}
        onCheckOllama={vi.fn()}
        isChecking={false}
      />,
    );

    expect(screen.getByLabelText(/Prompt de Teste para o LLaMA3/i).tagName).toBe('TEXTAREA');
  });
});
