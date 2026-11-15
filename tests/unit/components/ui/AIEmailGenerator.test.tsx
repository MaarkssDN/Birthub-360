import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AIEmailGenerator } from '@/components/ui/AIEmailGenerator';

const apiPost = vi.fn();

vi.mock('@/lib/api.js', () => ({
  api: { post: (...args: unknown[]) => apiPost(...args) },
}));

vi.mock('@/hooks/useActivePlaybook.js', () => ({
  useActivePlaybook: () => ({
    info: { label: 'Playbook X', description: 'desc' },
    playbook: 'x',
    setPlaybook: vi.fn(),
  }),
}));

vi.mock('@/lib/soundEffects', () => ({ SoundFX: { play: vi.fn() } }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

afterEach(() => {
  cleanup();
  apiPost.mockReset();
});

const emailResult = {
  result: {
    subject: 'Assunto IA',
    body: 'Corpo do e-mail',
    icpAnalysis: 'ICP compatível',
  },
};

const callResult = {
  result: {
    opening: 'Abertura',
    discoveryQuestions: ['Pergunta 1?', 'Pergunta 2?'],
    objectionTips: [{ objection: 'Está caro', response: 'Mostre ROI' }],
    closing: 'Fechamento',
    icpAnalysis: 'ICP ok',
  },
};

const messageResult = {
  result: {
    body: 'Oi! Mensagem curta',
    followUpSuggestion: 'Follow-up em 2 dias',
    icpAnalysis: 'ICP ok',
  },
};

describe('AIEmailGenerator', () => {
  it('renderiza header, seletor de tom e CTA inicial para e-mail', () => {
    render(<AIEmailGenerator companyName="Acme" />);
    expect(screen.getByText('Copiloto IA: Abordagem de Prospecção')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Consultivo' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByRole('button', { name: 'Sintetizar E-mail com IA' }),
    ).toBeInTheDocument();
  });

  it('alterna tom e canal', () => {
    render(<AIEmailGenerator />);
    fireEvent.click(screen.getByRole('button', { name: 'Foco ROI' }));
    expect(screen.getByRole('button', { name: 'Foco ROI' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: /Ligação/ }));
    expect(
      screen.getByRole('button', { name: 'Gerar Roteiro de Ligação' }),
    ).toBeInTheDocument();
  });

  it('gera e-mail, exibe painel editável, mailto e cópia', async () => {
    apiPost.mockResolvedValue(emailResult);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<AIEmailGenerator phone="(11) 99999-0000" />);
    fireEvent.click(screen.getByRole('button', { name: 'Sintetizar E-mail com IA' }));

    await waitFor(() => expect(screen.getByDisplayValue('Assunto IA')).toBeInTheDocument());
    expect(apiPost).toHaveBeenCalledWith(
      '/api/intelligence/studio',
      expect.objectContaining({ kind: 'email' }),
      expect.anything(),
    );

    const mailto = screen.getByRole('link', { name: /Enviar/ });
    expect(mailto).toHaveAttribute('href', expect.stringContaining('mailto:'));

    fireEvent.click(screen.getByRole('button', { name: /Copiar Texto/ }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Assunto: Assunto IA'));

    // edição do corpo reflete no estado
    fireEvent.change(screen.getByLabelText(/Corpo da Mensagem/), {
      target: { value: 'novo corpo' },
    });
    expect(screen.getByLabelText(/Corpo da Mensagem/)).toHaveValue('novo corpo');
  });

  it('gera roteiro de ligação com perguntas, objeções e link tel:', async () => {
    apiPost.mockResolvedValue(callResult);
    render(<AIEmailGenerator phone="11999990000" />);

    fireEvent.click(screen.getByRole('button', { name: /Ligação/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Gerar Roteiro de Ligação' }));

    await waitFor(() => expect(screen.getByText('Abertura')).toBeInTheDocument());
    expect(screen.getByText(/1\. Pergunta 1/)).toBeInTheDocument();
    expect(screen.getByText(/Está caro/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ligar para/ })).toHaveAttribute(
      'href',
      'tel:11999990000',
    );
  });

  it('gera mensagem curta com link wa.me quando há telefone', async () => {
    apiPost.mockResolvedValue(messageResult);
    render(<AIEmailGenerator phone="(11) 98888-7777" />);

    fireEvent.click(screen.getByRole('button', { name: /Mensagem/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Gerar Mensagem Curta' }));

    await waitFor(() =>
      expect(screen.getByDisplayValue('Oi! Mensagem curta')).toBeInTheDocument(),
    );
    const wa = screen.getByRole('link', { name: /Enviar WhatsApp/ });
    expect(wa).toHaveAttribute('href', expect.stringContaining('https://wa.me/5511988887777'));
    expect(screen.getByText('Follow-up em 2 dias')).toBeInTheDocument();
  });

  it('exibe erro da API com role=alert', async () => {
    apiPost.mockRejectedValue(new Error('timeout do motor'));
    render(<AIEmailGenerator />);
    fireEvent.click(screen.getByRole('button', { name: 'Sintetizar E-mail com IA' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('timeout do motor'));
  });
});
