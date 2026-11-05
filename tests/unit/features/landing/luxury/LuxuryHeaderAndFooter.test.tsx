import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LuxuryHeaderHUD } from '@/features/landing/luxury/components/LuxuryHeaderHUD';
import { LuxuryFooter } from '@/features/landing/luxury/components/LuxuryFooter';

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: {
    play: vi.fn(),
  },
}));

describe('LuxuryHeaderHUD & LuxuryFooter', () => {
  it('LuxuryHeaderHUD renderiza marca e dispara onOpenPrivateAccess', () => {
    const onOpenPrivateAccess = vi.fn();
    render(
      <MemoryRouter>
        <LuxuryHeaderHUD onOpenPrivateAccess={onOpenPrivateAccess} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/BIRTH HUB/i)).toBeInTheDocument();
    expect(screen.getByText(/Central de Comando/i)).toBeInTheDocument();

    const portalBtn = screen.getByRole('button', { name: /Acesso Reservado/i });
    fireEvent.click(portalBtn);
    expect(onOpenPrivateAccess).toHaveBeenCalledTimes(1);
  });

  it('LuxuryFooter renderiza links de compliance LGPD e termos', () => {
    render(
      <MemoryRouter>
        <LuxuryFooter />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Privacidade & LGPD/i)).toBeInTheDocument();
    expect(screen.getByText(/Termos de Uso/i)).toBeInTheDocument();
    expect(screen.getByText(/Acesso ao Sistema/i)).toBeInTheDocument();
    expect(screen.getByText(/Todos os direitos reservados/i)).toBeInTheDocument();
  });
});
