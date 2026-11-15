import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Timeline, type TimelineItem } from '@/components/ui/Timeline';

afterEach(cleanup);

const base: TimelineItem = {
  id: '1',
  title: 'Lead criado',
  timestamp: '10:00',
};

describe('Timeline', () => {
  it('exibe mensagem de vazio customizada ou padrão', () => {
    const { rerender } = render(<Timeline items={[]} />);
    expect(screen.getByText('Nenhuma atividade registrada ainda.')).toBeInTheDocument();

    rerender(<Timeline items={[]} emptyMessage="Sem histórico" />);
    expect(screen.getByText('Sem histórico')).toBeInTheDocument();
  });

  it('renderiza itens com título, timestamp, descrição e autor', () => {
    render(
      <Timeline
        items={[
          { ...base, description: 'via importação', author: 'Ana' },
          { id: '2', title: 'Status alterado', timestamp: '11:00', type: 'status_change' },
        ]}
      />,
    );
    expect(screen.getByText('Lead criado')).toBeInTheDocument();
    expect(screen.getByText('via importação')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Status alterado')).toBeInTheDocument();
  });

  it.each([
    'note',
    'alert',
    'whatsapp',
    'email',
    'call',
    'activity',
    undefined,
  ] as const)('renderiza ícone para type=%s sem quebrar', (type) => {
    render(<Timeline items={[{ ...base, id: String(type), type }]} />);
    expect(screen.getByText('Lead criado')).toBeInTheDocument();
  });
});
