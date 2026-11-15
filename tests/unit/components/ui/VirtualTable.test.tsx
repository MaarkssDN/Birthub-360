import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VirtualTable, type ColumnDef } from '@/components/ui/VirtualTable';

// jsdom não tem layout: o virtualizador real retornaria 0 itens. Mockamos para
// devolver todos os índices — o que está sob teste é a renderização/contrato do
// componente, não a matemática do @tanstack/react-virtual.
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: index,
        start: index * 56,
        size: 56,
        end: (index + 1) * 56,
      })),
    getTotalSize: () => count * 56,
  }),
}));

afterEach(cleanup);

interface Row {
  id: string;
  name: string;
}

const columns: ColumnDef<Row>[] = [
  {
    key: 'name',
    header: 'Nome',
    width: 200,
    render: (row) => <span>{row.name}</span>,
  },
  {
    key: 'id',
    header: 'ID',
    align: 'right',
    render: (row) => row.id,
  },
];

describe('VirtualTable', () => {
  it('exibe empty state quando não há dados', () => {
    render(
      <VirtualTable data={[]} columns={columns} getRowKey={(r) => r.id} />,
    );
    expect(screen.getByText('Nenhum registro encontrado.')).toBeInTheDocument();
  });

  it('exibe emptyState customizado', () => {
    render(
      <VirtualTable
        data={[]}
        columns={columns}
        getRowKey={(r) => r.id}
        emptyState={<div data-testid="vazio">Nada aqui</div>}
      />,
    );
    expect(screen.getByTestId('vazio')).toBeInTheDocument();
  });

  it('renderiza cabeçalho e linhas com células alinhadas', () => {
    const data: Row[] = [
      { id: '1', name: 'Alpha' },
      { id: '2', name: 'Beta' },
    ];
    render(<VirtualTable data={data} columns={columns} getRowKey={(r) => r.id} />);

    expect(screen.getByRole('columnheader', { name: 'Nome' })).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2 linhas
  });

  it('dispara onRowClick por clique e por teclado (Enter/Espaço)', () => {
    const onRowClick = vi.fn();
    const data: Row[] = [{ id: '1', name: 'Alpha' }];
    render(
      <VirtualTable
        data={data}
        columns={columns}
        getRowKey={(r) => r.id}
        onRowClick={onRowClick}
      />,
    );
    const row = screen.getAllByRole('row')[1];
    expect(row).toHaveAttribute('tabindex', '0');

    fireEvent.click(row);
    expect(onRowClick).toHaveBeenCalledWith(data[0], 0);

    fireEvent.keyDown(row, { key: 'Enter' });
    fireEvent.keyDown(row, { key: ' ' });
    expect(onRowClick).toHaveBeenCalledTimes(3);
  });

  it('renderiza skeletons durante loading', () => {
    render(
      <VirtualTable
        data={[{ id: '1', name: 'Alpha' }]}
        columns={columns}
        getRowKey={(r) => r.id}
        loading
        skeletonRows={3}
      />,
    );
    // Em loading, os dados reais não aparecem — só skeletons.
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(4); // header + 3 skeletons
  });
});
