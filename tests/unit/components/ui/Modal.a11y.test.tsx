// @vitest-environment jsdom
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from '../../../../src/components/ui/Modal.js';

describe('[34 · Ari] Modal — Acessibilidade WCAG 2.2 AA (Focus Trap & Escape)', () => {
  it('fecha o modal ao pressionar a tecla Escape', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Configurações">
        <button type="button">Ação Primária</button>
      </Modal>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('prende o foco (focus trap) em Tab e Shift+Tab dentro dos elementos focáveis do modal', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Editar Lead">
        <input aria-label="Nome do lead" />
        <button type="button">Salvar</button>
      </Modal>,
    );

    const closeBtn = screen.getByRole('button', { name: 'Fechar diálogo' });
    const input = screen.getByLabelText('Nome do lead');
    const saveBtn = screen.getByRole('button', { name: 'Salvar' });

    // Foco no último elemento + Tab → volta ao primeiro elemento focável (closeBtn)
    saveBtn.focus();
    expect(document.activeElement).toBe(saveBtn);
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(closeBtn);

    // Foco no primeiro elemento + Shift+Tab → cicla para o último elemento focável (saveBtn)
    closeBtn.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(saveBtn);

    // Elemento intermediário continua acessível
    input.focus();
    expect(document.activeElement).toBe(input);
  });
});
