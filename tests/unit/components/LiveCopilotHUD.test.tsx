/**
 * Testes unitários para LiveCopilotHUD (HUD flutuante do Copiloto IA durante chamadas ativas).
 * Cobre renderização, badge de confiança, transcrição, ações de contorno e acessibilidade.
 * Ver .agents/handoffs/onda-15/07-para-02-hud-copiloto-live.md.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { LiveCopilotHUD } from '@/features/copilot/components/LiveCopilotHUD.js';
import { copilotLiveBus } from '@/features/copilot/copilotLiveBus.js';

describe('LiveCopilotHUD', () => {
  beforeEach(() => {
    copilotLiveBus.reset();
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    cleanup();
    copilotLiveBus.reset();
    vi.restoreAllMocks();
  });

  it('não renderiza na tela quando não há chamada ativa', () => {
    const { container } = render(<LiveCopilotHUD isActive={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza quando chamada ativa é detectada e exibe dados do lead', () => {
    render(
      <LiveCopilotHUD
        isActive={true}
        leadName="Carlos Mendes"
        leadCompany="Acme Corp"
      />,
    );

    expect(screen.getByRole('region', { name: /copiloto ia durante chamada ativa/i })).toBeInTheDocument();
    expect(screen.getByText('Carlos Mendes')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('exibe badge de confiança da IA e categoria da objeção', () => {
    render(
      <LiveCopilotHUD
        isActive={true}
        leadName="Carlos Mendes"
        leadCompany="Acme Corp"
      />,
    );

    // Categoria padrão ou detectada
    expect(screen.getByText(/Preço & Orçamento/i)).toBeInTheDocument();
    // Badge de confiança
    expect(screen.getByText(/% Confiança/i)).toBeInTheDocument();
  });

  it('permite copiar o script de argumentação com feedback visual', async () => {
    render(<LiveCopilotHUD isActive={true} />);

    const copyBtn = screen.getByRole('button', { name: /copiar argumento/i });
    expect(copyBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(screen.getByText(/Copiado!/i)).toBeInTheDocument();
  });

  it('dispara evento ao clicar em Inserir na proposta', () => {
    const eventSpy = vi.fn();
    window.addEventListener('copilot:insert-proposal', eventSpy);

    render(<LiveCopilotHUD isActive={true} />);

    const insertBtn = screen.getByRole('button', { name: /inserir argumento na proposta comercial/i });
    fireEvent.click(insertBtn);

    expect(eventSpy).toHaveBeenCalled();
    window.removeEventListener('copilot:insert-proposal', eventSpy);
  });

  it('permite minimizar e maximizar o HUD', () => {
    render(<LiveCopilotHUD isActive={true} />);

    // Clica para minimizar
    const minimizeBtn = screen.getByRole('button', { name: /minimizar copiloto hud/i });
    fireEvent.click(minimizeBtn);

    // Deve exibir o pill minimizado
    const maximizeBtn = screen.getByRole('button', { name: /maximizar hud do copiloto ia/i });
    expect(maximizeBtn).toBeInTheDocument();

    // Restaura
    fireEvent.click(maximizeBtn);
    expect(screen.getAllByText(/Preço & Orçamento/i)[0]).toBeInTheDocument();
  });

  it('permite alternar entre os tamanhos (compact, standard, expanded)', () => {
    render(<LiveCopilotHUD isActive={true} initialSize="compact" />);

    const sizeBtn = screen.getByRole('button', { name: /tamanho atual/i });
    expect(sizeBtn).toHaveTextContent('SM');

    // Clica para mudar para MD (standard)
    fireEvent.click(sizeBtn);
    expect(sizeBtn).toHaveTextContent('MD');

    // Clica para mudar para LG (expanded)
    fireEvent.click(sizeBtn);
    expect(sizeBtn).toHaveTextContent('LG');
  });

  it('minimiza o HUD ao pressionar tecla Escape (WCAG 2.2 AA)', () => {
    render(<LiveCopilotHUD isActive={true} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.getByRole('button', { name: /maximizar hud do copiloto ia/i })).toBeInTheDocument();
  });

  it('reage a eventos de chamada iniciada e objeção via copilotLiveBus', () => {
    render(<LiveCopilotHUD />);

    // Inicia chamada pelo barramento
    act(() => {
      copilotLiveBus.startCall({
        leadName: 'Fernanda Lima',
        leadCompany: 'Inova Brasil',
      });
    });

    expect(screen.getByText('Fernanda Lima')).toBeInTheDocument();

    // Emite objeção de timing
    act(() => {
      copilotLiveBus.emitObjection({
        id: 'obj-timing-1',
        sessionId: 'session-123',
        category: 'timing',
        confidence: 0.91,
        matchedSnippet: 'agora não é um bom momento para rever isso',
        matchedPattern: 'Adiamento de decisão',
        explanation: 'Lead adiando avaliação',
        timestamp: Date.now(),
        latencyMs: 250,
        suggestedRebuttals: [
          {
            strategy: 'pivot',
            title: 'Custo da inação imediata',
            script: 'Compreendo que a prioridade deste mês seja outra...',
            keyTakeaway: 'Destaque o retorno acumulado.',
          },
        ],
      });
    });

    expect(screen.getByText(/Timing & Prioridade/i)).toBeInTheDocument();
    expect(screen.getByText(/91% Confiança/i)).toBeInTheDocument();
    expect(screen.getByText(/Compreendo que a prioridade deste mês seja outra/i)).toBeInTheDocument();
  });
});
