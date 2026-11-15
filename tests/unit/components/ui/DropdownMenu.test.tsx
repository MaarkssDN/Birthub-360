import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DropdownMenu } from '@/components/ui/DropdownMenu';

afterEach(cleanup);

describe('DropdownMenu', () => {
  it('mantém o menu fechado por padrão e expõe aria-expanded/controls', () => {
    render(
      <DropdownMenu
        triggerLabel="Ações"
        items={[{ label: 'Editar', onClick: vi.fn() }]}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Ações' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('abre o menu, executa o item e fecha', () => {
    const onClick = vi.fn();
    render(
      <DropdownMenu
        triggerLabel="Ações"
        items={[
          { label: 'Editar', onClick },
          { label: 'Excluir', onClick: vi.fn() },
        ]}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Ações' });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', screen.getByRole('menu').id);

    fireEvent.click(screen.getByRole('menuitem', { name: 'Editar' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('fecha ao clicar novamente no trigger', () => {
    render(<DropdownMenu triggerLabel="Ações" items={[{ label: 'X', onClick: vi.fn() }]} />);
    const trigger = screen.getByRole('button', { name: 'Ações' });
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
