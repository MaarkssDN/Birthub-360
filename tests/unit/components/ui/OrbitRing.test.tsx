import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { OrbitRing } from '@/components/ui/OrbitRing';

afterEach(cleanup);

describe('OrbitRing', () => {
  it('renderiza o selo 360° padrão com tamanho default', () => {
    render(<OrbitRing />);
    expect(screen.getByText('360°')).toBeInTheDocument();
  });

  it('aplica dimensões numéricas e string customizadas', () => {
    const { container, rerender } = render(<OrbitRing size={80} data-testid="ring" />);
    const ring = screen.getByTestId('ring');
    expect(ring).toHaveStyle({ width: '80px', height: '80px' });

    rerender(<OrbitRing size="10rem" data-testid="ring" />);
    expect(ring).toHaveStyle({ width: '10rem', height: '10rem' });
    expect(container.querySelector('.rounded-full')).toBeInTheDocument();
  });

  it('renderiza children customizados e respeita innerClassName', () => {
    render(
      <OrbitRing innerClassName="custom-inner" borderWidth={4}>
        <span data-testid="child">ORB</span>
      </OrbitRing>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    const inner = screen.getByTestId('child').parentElement;
    expect(inner).toHaveClass('custom-inner');
    expect(inner).toHaveStyle({ width: 'calc(100% - 8px)', height: 'calc(100% - 8px)' });
  });

  it('desativa o glow e a animação via props', () => {
    render(<OrbitRing glow={false} spin={false} data-testid="ring" />);
    const outer = screen.getByTestId('ring').firstElementChild as HTMLElement;
    expect(outer.style.boxShadow).toBe('');
  });
});
