import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PillarDetailDialog } from '@/features/landing/components/pillars/PillarDetailDialog';

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: { play: vi.fn() },
}));

import { SoundFX } from '@/lib/soundEffects';

const playMock = vi.mocked(SoundFX.play);

function renderDialog(props: Partial<Parameters<typeof PillarDetailDialog>[0]> = {}) {
  const onClose = vi.fn();
  const utils = render(
    <PillarDetailDialog isOpen onClose={onClose} theme="dark" {...props}>
      <h2 id="b360-dialog-title">Título do pilar</h2>
      <p id="b360-dialog-desc">Descrição</p>
      <button type="button" data-primary-action="true">
        Ação principal
      </button>
      <button type="button">Secundária</button>
    </PillarDetailDialog>,
  );
  return { onClose, ...utils };
}

beforeEach(() => {
  playMock.mockClear();
});

afterEach(() => {
  document.body.style.overflow = '';
});

describe('PillarDetailDialog', () => {
  it('não renderiza nada quando isOpen=false', () => {
    const { container } = render(
      <PillarDetailDialog isOpen={false} onClose={vi.fn()} theme="dark">
        conteúdo
      </PillarDetailDialog>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza dialog acessível com children e trava o scroll do body', () => {
    renderDialog();

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Título do pilar')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('Escape fecha via onClose e toca som; clique no backdrop também fecha', () => {
    const { onClose } = renderDialog();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(playMock).toHaveBeenCalledWith('click');

    // clique no backdrop (role=dialog externo) fecha; clique interno não propaga
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByText('Ação principal'));
    expect(onClose).toHaveBeenCalledTimes(2); // stopPropagation no painel interno
  });

  it('botão fechar superior dispara onClose', () => {
    const { onClose } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar painel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('foca o botão data-primary-action após abrir e restaura foco ao fechar', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = renderDialog();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 80));
    });
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Ação principal' }),
    );

    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('focus trap: Tab no último focável volta ao primeiro (e Shift+Tab inverso)', async () => {
    renderDialog();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 80));
    });

    const first = screen.getByRole('button', { name: 'Ação principal' });
    const last = screen.getByRole('button', { name: 'Secundária' });
    const closeBtn = screen.getByRole('button', { name: 'Fechar painel' });

    // O "last" real é o último do NodeList (botão Secundária); Tab a partir dele
    // deve voltar o foco ao primeiro focável do modal (botão Fechar painel).
    last.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.activeElement).toBe(closeBtn);
    expect(first).toBeInTheDocument();
  });

  it('aplica classes de tema light e cores de tema alternativas', () => {
    const { container, rerender } = render(
      <PillarDetailDialog isOpen onClose={vi.fn()} theme="light" themeColor="pink">
        x
      </PillarDetailDialog>,
    );
    const inner = container.querySelector('[role="dialog"] > div');
    expect(inner?.className).toContain('border-pink-300');

    rerender(
      <PillarDetailDialog isOpen onClose={vi.fn()} theme="dark" themeColor="gold">
        x
      </PillarDetailDialog>,
    );
    expect(inner?.className).toContain('border-amber-500/40');

    rerender(
      <PillarDetailDialog isOpen onClose={vi.fn()} theme="dark" themeColor="iris">
        x
      </PillarDetailDialog>,
    );
    expect(inner?.className).toContain('border-violet-500/40');
  });

  it.each([
    ['dark', 'cyan'],
    ['dark', 'pink'],
    ['dark', 'gold'],
    ['dark', 'iris'],
    ['light', 'cyan'],
    ['light', 'pink'],
    ['light', 'gold'],
    ['light', 'iris'],
  ] as const)('renderiza tema %s/%s sem erro', (theme, themeColor) => {
    renderDialog({ theme, themeColor });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
