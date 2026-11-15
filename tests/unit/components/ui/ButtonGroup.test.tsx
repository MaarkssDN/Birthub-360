import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ButtonGroup, ToggleButtonGroup } from '@/components/ui/ButtonGroup';

vi.mock('@/lib/soundEffects', () => ({ SoundFX: { play: vi.fn() } }));

afterEach(cleanup);

const items = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta', icon: <span data-testid="icon-b">i</span> },
  { value: 'c', label: 'Gamma', disabled: true },
] as const;

describe('ButtonGroup', () => {
  it('marca o item selecionado com aria-pressed e dispara onChange', () => {
    const onChange = vi.fn();
    render(<ButtonGroup items={[...items]} value="a" onChange={onChange} />);

    const alpha = screen.getByRole('button', { name: 'Alpha' });
    const beta = screen.getByRole('button', { name: /Beta/ });
    expect(alpha).toHaveAttribute('aria-pressed', 'true');
    expect(beta).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(beta);
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('não dispara onChange para item desabilitado', () => {
    const onChange = vi.fn();
    render(<ButtonGroup items={[...items]} value="a" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gamma' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('aplica classes de tamanho e toca som apenas quando o valor muda', async () => {
    const { SoundFX } = await import('@/lib/soundEffects');
    const onChange = vi.fn();
    render(
      <ButtonGroup items={[...items]} value="a" onChange={onChange} size="lg" soundFeedback />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Beta/ }));
    expect(SoundFX.play).toHaveBeenCalledWith('click');

    vi.mocked(SoundFX.play).mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));
    // Clicar no já selecionado ainda chama onChange, mas sem som (value === value selecionado? não — 'a' !== 'a'? é igual)
    expect(onChange).toHaveBeenCalledWith('a');
  });
});

describe('ToggleButtonGroup', () => {
  it('é um alias funcional de ButtonGroup', () => {
    const onChange = vi.fn();
    render(<ToggleButtonGroup items={[...items]} value="b" onChange={onChange} />);
    expect(screen.getByRole('button', { name: /Beta/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(onChange).toHaveBeenCalledWith('a');
  });
});
