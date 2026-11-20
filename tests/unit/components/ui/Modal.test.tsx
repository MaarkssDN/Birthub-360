import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Modal } from '@/components/ui/Modal';

afterEach(cleanup);

describe('Modal', () => {
  it('não renderiza nada quando fechado', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Título">
        corpo
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renderiza dialog acessível, foca o container e fecha pelo botão', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Detalhes">
        <p>conteúdo do modal</p>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(screen.getByText('conteúdo do modal')).toBeInTheDocument();
    expect(document.activeElement).toBe(dialog);

    fireEvent.click(screen.getByRole('button', { name: 'Fechar diálogo' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
