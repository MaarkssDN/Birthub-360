import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LuxuryLandingPage } from '@/features/landing/luxury/LuxuryLandingPage';

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: {
    play: vi.fn(),
  },
}));

vi.mock('@/components/brand/BirthHubOrbit360', () => ({
  BirthHubOrbit360: () => <div data-testid="orbit-360-mock" />,
  default: () => <div data-testid="orbit-360-mock" />,
}));

const originalScrollIntoView = Element.prototype.scrollIntoView;
const originalMatchMedia = window.matchMedia;

beforeAll(() => {
  // jsdom não implementa scrollIntoView — stub mínimo para o CTA "Acesso Reservado"
  Element.prototype.scrollIntoView = vi.fn();
  // jsdom não implementa matchMedia — useSmoothInertiaScroll consulta prefers-reduced-motion
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

afterAll(() => {
  Element.prototype.scrollIntoView = originalScrollIntoView;
  window.matchMedia = originalMatchMedia;
});

function renderPage() {
  return render(
    <MemoryRouter>
      <LuxuryLandingPage />
    </MemoryRouter>,
  );
}

describe('LuxuryLandingPage', () => {
  it('ativa o tema dark no documento ao montar', () => {
    renderPage();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('renderiza os 6 atos da narrativa de autoridade', async () => {
    renderPage();

    // ATO I — hero
    expect(
      screen.getByText('A inteligência de negócios.'),
    ).toBeInTheDocument();
    expect(await screen.findByTestId('orbit-360-mock')).toBeInTheDocument();

    // ATO III — matriz
    expect(screen.getByText(/A Matriz Contínua 360º/i)).toBeInTheDocument();

    // ATO IV — console
    expect(screen.getByText('A Verdade Operacional')).toBeInTheDocument();

    // ATO V — métricas
    expect(screen.getByText(/O Índice de Soberania/i)).toBeInTheDocument();

    // ATO VI — portal
    expect(screen.getByText(/Sessão Executiva Reservada/i)).toBeInTheDocument();
    expect(document.getElementById('acesso')).not.toBeNull();
  });

  it('o botão Acesso Reservado do HUD rola suavemente até a seção #acesso', () => {
    renderPage();

    const acessoSection = document.getElementById('acesso') as HTMLElement;
    fireEvent.click(screen.getByRole('button', { name: /Acesso Reservado/i }));

    expect(acessoSection.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
    });
  });
});
