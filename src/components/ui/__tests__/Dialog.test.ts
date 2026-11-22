import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Dialog } from '../Dialog.js';

afterEach(() => {
  cleanup();
});

function DialogHarness({ onClose }: { onClose: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'button',
      { type: 'button', onClick: () => setIsOpen(true) },
      'Abrir modal',
    ),
    React.createElement(
      Dialog,
      {
        isOpen,
        onClose: () => {
          onClose();
          setIsOpen(false);
        },
        title: 'Exemplo',
      },
      React.createElement('p', null, 'Conteúdo do modal'),
    ),
  );
}

describe('Dialog', () => {
  it('abre como modal acessível e fecha pelo botão com callback', () => {
    const onClose = vi.fn();
    render(React.createElement(DialogHarness, { onClose }));

    fireEvent.click(screen.getByRole('button', { name: 'Abrir modal' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Exemplo')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo do modal')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fechar modal' }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
