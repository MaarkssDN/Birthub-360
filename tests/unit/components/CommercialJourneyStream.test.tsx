import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));
vi.mock('../../../src/lib/soundEffects.js', () => ({
  SoundFX: { play: vi.fn() },
}));

import { CommercialJourneyStream } from '../../../src/components/CommercialJourneyStream.js';

const TABS = [
  'Dinâmica do Funil',
  'Estágios & Gates',
  'Ações Táticas',
  'Agentes Autônomos',
  'Contas ICP',
  'Fechamentos',
];

describe('CommercialJourneyStream', () => {
  it('renderiza o header, troca abas/filtros, fecha e navega para módulos', () => {
    const onClose = vi.fn();
    render(<CommercialJourneyStream onClose={onClose} />);

    expect(screen.getByText(/Jornada Comercial 360°/i)).toBeInTheDocument();
    expect(screen.getByText(/Ao Vivo/i)).toBeInTheDocument();

    for (const label of TABS) {
      fireEvent.click(screen.getByRole('button', { name: label }));
    }

    fireEvent.click(screen.getByRole('button', { name: /Visitas & Calls/i }));
    fireEvent.click(screen.getByRole('button', { name: /Fechamento Iminente/i }));
    fireEvent.click(screen.getByRole('button', { name: /Set/i }));
    fireEvent.click(screen.getByRole('button', { name: /Nov/i }));

    fireEvent.click(screen.getByRole('button', { name: /Adicionar Oportunidade/i }));
    expect(navigate).toHaveBeenCalledWith('/app/prospect');

    fireEvent.click(screen.getByRole('button', { name: /Ver Kanban 360°/i }));
    expect(navigate).toHaveBeenCalledWith('/app/crm');

    fireEvent.click(screen.getByRole('button', { name: /Fechar visão detalhada/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('funciona sem onClose (sem botão de fechar)', () => {
    render(<CommercialJourneyStream />);
    expect(screen.queryByRole('button', { name: /Fechar visão detalhada/i })).toBeNull();
    expect(screen.getByText(/Jornada Comercial 360°/i)).toBeInTheDocument();
  });
});
