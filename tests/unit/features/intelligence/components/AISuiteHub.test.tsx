import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

const postMock = vi.fn();

vi.mock('../../../../../src/lib/api.js', () => ({
  api: {
    post: (...args: unknown[]) => postMock(...args),
  },
}));

vi.mock('../../../../../src/lib/soundEffects.js', () => ({
  SoundFX: {
    play: vi.fn(),
  },
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('../../../../../src/hooks/useBrandAccent.js', () => ({
  useBrandAccent: () => '#000000',
}));

import { AISuiteHub } from '../../../../../src/features/intelligence/components/AISuiteHub.js';

describe('AISuiteHub — execução de motor de IA (BT360-DT-0040 / DEBT-UX-008)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('encerra o estado de execução e exibe o resultado quando a API responde com sucesso', async () => {
    postMock.mockResolvedValue({
      success: true,
      data: { message: 'Ganho personalizado gerado' },
    });
    const user = userEvent.setup();
    render(<AISuiteHub />);

    await user.click(screen.getByRole('button', { name: /executar motor/i }));

    await waitFor(() => {
      expect(screen.getByText(/Ganho personalizado gerado/)).toBeInTheDocument();
    });
    // Loading terminou: botão volta ao estado ocioso (afordância de retry implícita).
    expect(
      screen.getByRole('button', { name: /executar motor/i }),
    ).toBeEnabled();
    expect(postMock).toHaveBeenCalledWith(
      '/api/prospecting/icebreaker',
      expect.any(Object),
    );
  });

  it('encerra o loading e exibe erro com retry quando a API falha', async () => {
    postMock.mockRejectedValue(new Error('HTTP 500 — motor indisponível'));
    const user = userEvent.setup();
    render(<AISuiteHub />);

    await user.click(screen.getByRole('button', { name: /executar motor/i }));

    await waitFor(() => {
      expect(screen.getByText('Erro durante a chamada do motor:')).toBeInTheDocument();
    });
    expect(screen.getByText(/HTTP 500 — motor indisponível/)).toBeInTheDocument();
    // Spinner/estado de execução terminou e o botão volta a ficar habilitado para retry.
    expect(
      screen.getByRole('button', { name: /executar motor/i }),
    ).toBeEnabled();
    expect(screen.queryByText(/processando ia/i)).not.toBeInTheDocument();
  });
});
