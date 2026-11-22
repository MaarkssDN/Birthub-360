import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Alert } from '../Alert.js';
import { Button } from '../Button.js';
import { ButtonGroup } from '../ButtonGroup.js';
import { CompareTable } from '../CompareTable.js';
import { Dialog } from '../Dialog.js';
import { EmptyState } from '../EmptyState.js';
import { Pagination } from '../Pagination.js';
import { Select } from '../Select.js';
import { Textarea } from '../Textarea.js';

afterEach(() => {
  cleanup();
});

describe('Button (A03-P1-03)', () => {
  it('fica desabilitado e com aria-busy quando loading, mesmo com disabled={false} explícito', () => {
    const onClick = vi.fn();
    render(
      React.createElement(
        Button,
        { loading: true, disabled: false, onClick, magnetic: false },
        'Salvar',
      ),
    );
    const button = screen.getByRole('button', { name: 'Salvar' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('com asChild e loading, não injeta o spinner como segundo filho do Slot', () => {
    render(
      React.createElement(
        Button,
        { asChild: true, loading: true, magnetic: false },
        React.createElement('a', { href: '#destino' }, 'Ir'),
      ),
    );
    const link = screen.getByRole('link', { name: 'Ir' });
    expect(link.querySelector('svg')).toBeNull();
  });
});

describe('Dialog (A03-P1-05)', () => {
  it('renderiza subtitle como descrição acessível', () => {
    render(
      React.createElement(
        Dialog,
        { isOpen: true, onClose: () => {}, title: 'Título', subtitle: 'Descrição do modal' },
        React.createElement('p', null, 'Corpo'),
      ),
    );
    const dialog = screen.getByRole('dialog', { name: 'Título' });
    expect(dialog).toHaveAccessibleDescription('Descrição do modal');
  });

  it('sem title, ainda expõe um nome acessível', () => {
    render(
      React.createElement(
        Dialog,
        { isOpen: true, onClose: () => {} },
        React.createElement('p', null, 'Corpo'),
      ),
    );
    expect(screen.getByRole('dialog', { name: 'Diálogo' })).toBeInTheDocument();
  });

  it('preventClose bloqueia Esc e não chama onClose', () => {
    const onClose = vi.fn();
    render(
      React.createElement(
        Dialog,
        { isOpen: true, onClose, title: 'Salvando', preventClose: true },
        React.createElement('p', null, 'Corpo'),
      ),
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Fechar modal' })).not.toBeInTheDocument();
  });
});

describe('Select (WCAG 2.4.7 — foco visível em todas as variantes)', () => {
  it.each(['default', 'filled', 'ghost', 'cosmic'] as const)(
    'variante %s expõe anel de foco (focus-visible:ring)',
    (variant) => {
      const { container } = render(
        React.createElement(
          Select,
          { variant },
          React.createElement('option', { value: 'a' }, 'Opção A'),
        ),
      );
      const select = container.querySelector('select');
      expect(select?.className).toContain('focus-visible:ring-2');
      expect(select?.className).toContain('focus-visible:ring-focus-ring');
    },
  );
});

describe('Pagination (landmark + nomes acessíveis)', () => {
  const baseProps = {
    page: 2,
    totalPages: 5,
    onPageChange: () => {},
    totalItems: 120,
    itemLabel: 'contatos',
    pageSize: 20,
    onPageSizeChange: () => {},
  };

  it('expõe landmark nav nomeado e botões Anterior/Próxima com nome acessível', () => {
    render(React.createElement(Pagination, baseProps));

    expect(screen.getByRole('navigation', { name: 'Paginação' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeInTheDocument();
    // Seletor de tamanho de página associado ao seu label ("Exibir:").
    expect(screen.getByLabelText('Exibir:')).toBeInTheDocument();
  });

  it('IDs de label são únicos entre duas instanciações na mesma página', () => {
    render(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(Pagination, baseProps),
        React.createElement(Pagination, { ...baseProps, page: 3 }),
      ),
    );
    const selects = screen.getAllByLabelText('Exibir:');
    expect(selects).toHaveLength(2);
    expect(selects[0].id).not.toBe(selects[1].id);
  });
});

describe('ButtonGroup (fieldset semântico nomeado)', () => {
  it('renderiza fieldset com legend sr-only quando label é passado', () => {
    render(
      React.createElement(ButtonGroup, {
        items: [
          { value: 'a', label: 'Opção A' },
          { value: 'b', label: 'Opção B' },
        ],
        value: 'a',
        onChange: () => {},
        label: 'Período',
      }),
    );
    const group = screen.getByRole('group', { name: 'Período' });
    expect(group.tagName).toBe('FIELDSET');
  });
});

describe('Alert (role=alert + ícone decorativo oculto)', () => {
  it('expõe role="alert" e esconde o ícone de severidade da árvore de acessibilidade', () => {
    const { container } = render(
      React.createElement(Alert, { severity: 'error', title: 'Falha' }, 'Não foi possível salvar'),
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Não foi possível salvar');
    // O well do ícone é aria-hidden — role="alert" já anuncia o texto.
    const iconWell = container.querySelector('[aria-hidden="true"]');
    expect(iconWell).not.toBeNull();
    expect(iconWell?.querySelector('svg')).not.toBeNull();
  });

  it('botão de fechar tem nome acessível', () => {
    render(React.createElement(Alert, { onClose: () => {} }, 'Aviso'));
    expect(screen.getByRole('button', { name: 'Fechar alerta' })).toBeInTheDocument();
  });
});

describe('EmptyState (ícone decorativo oculto)', () => {
  it('marca o container do ícone como aria-hidden', () => {
    const { container } = render(
      React.createElement(EmptyState, { title: 'Nada aqui', description: 'Sem itens' }),
    );
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Nada aqui' })).toBeInTheDocument();
  });
});

describe('CompareTable (região rolável focável + cabeçalhos de coluna)', () => {
  it('wrapper de scroll é grupo nomeado e focável; th emitem scope="col"', () => {
    render(
      React.createElement(CompareTable, {
        columns: [{ key: 'a', label: 'Plano A' }],
        rows: [
          {
            id: 'r1',
            label: 'Preço',
            cells: [{ value: 'R$ 10' }],
          },
        ],
      }),
    );
    const region = screen.getByRole('group', {
      name: 'Tabela comparativa com rolagem horizontal',
    });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('columnheader', { name: 'Plano A' })).toHaveAttribute('scope', 'col');
  });
});

describe('Textarea (WCAG 2.4.7 — foco visível em todas as variantes)', () => {
  it.each(['default', 'filled', 'ghost', 'holographic'] as const)(
    'variante %s expõe anel de foco (focus-visible:ring)',
    (variant) => {
      const { container } = render(React.createElement(Textarea, { variant }));
      const textarea = container.querySelector('textarea');
      expect(textarea?.className).toContain('focus-visible:ring-2');
      expect(textarea?.className).toContain('focus-visible:ring-focus-ring');
    },
  );
});
