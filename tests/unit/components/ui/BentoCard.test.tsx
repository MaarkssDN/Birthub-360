import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BentoCard } from '@/components/ui/bento/BentoCard';

vi.mock('@/lib/soundEffects', () => ({ SoundFX: { play: vi.fn() } }));

afterEach(cleanup);

describe('BentoCard', () => {
  it('renderiza children e aplica spans/variant', () => {
    render(
      <BentoCard colSpan={2} rowSpan={2} variant="cosmic" data-testid="card">
        conteúdo
      </BentoCard>,
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveTextContent('conteúdo');
    expect(card).toHaveClass('md:col-span-2', 'md:row-span-2');
    expect(card).toHaveAttribute('data-accent', 'iris');
  });

  it('sem onClick não expõe role=button; com onClick vira botão acessível por teclado', () => {
    const onClick = vi.fn();
    const { rerender } = render(<BentoCard>sem ação</BentoCard>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(
      <BentoCard onClick={onClick}>
        com ação
      </BentoCard>,
    );
    const card = screen.getByRole('button', { name: 'com ação' });
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('mostra spotlight no hover e dispara sons quando habilitados', async () => {
    const { SoundFX } = await import('@/lib/soundEffects');
    render(
      <BentoCard soundHover soundClick onClick={vi.fn()}>
        hover
      </BentoCard>,
    );
    const card = screen.getByRole('button');
    fireEvent.mouseEnter(card);
    fireEvent.mouseLeave(card);
    expect(SoundFX.play).toHaveBeenCalledWith('hover');
  });
});
