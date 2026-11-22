import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CtaBanner } from '../../../../src/components/ui/CtaBanner.js';

describe('CtaBanner', () => {
  it('usa o título padrão e dispara o CTA nos dois botões', () => {
    const onCtaClick = vi.fn();
    render(<CtaBanner onCtaClick={onCtaClick} />);
    expect(screen.getByText(/Pronto para transformar/i)).toBeInTheDocument();
    expect(screen.getByText(/sua operação de vendas/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Acessar Plataforma Agora/i }));
    fireEvent.click(screen.getByRole('button', { name: /Agendar Demonstração VIP/i }));
    expect(onCtaClick).toHaveBeenCalledTimes(2);
  });

  it('respeita título e descrição customizados', () => {
    render(<CtaBanner title="Vamos conversar" description="Agenda aberta esta semana." />);
    expect(screen.getByText('Vamos conversar')).toBeInTheDocument();
    expect(screen.getByText('Agenda aberta esta semana.')).toBeInTheDocument();
  });
});
