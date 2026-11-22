import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AuroraButton } from '../../../../src/components/ui/AuroraButton.js';

describe('AuroraButton', () => {
  it('renderiza o conteúdo e dispara onClick', () => {
    const onClick = vi.fn();
    render(<AuroraButton onClick={onClick}>Entrar</AuroraButton>);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('aceita o tamanho small e glow desligado', () => {
    render(
      <AuroraButton size="small" glow={false}>
        Compacto
      </AuroraButton>,
    );
    expect(screen.getByRole('button', { name: 'Compacto' })).toBeInTheDocument();
  });
});
