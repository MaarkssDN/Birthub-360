import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Act6PrivatePortal } from '@/features/landing/luxury/components/Act6PrivatePortal';
import { LuxuryLandingPage } from '@/features/landing/luxury/LuxuryLandingPage';

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: { play: vi.fn() },
}));

vi.mock('@/components/brand/BirthHubOrbit360', () => ({
  BirthHubOrbit360: () => <div data-testid="birthhub-orbit-360" />,
}));

import { SoundFX } from '@/lib/soundEffects';

const playMock = vi.mocked(SoundFX.play);

const renderPortal = () =>
  render(
    <MemoryRouter>
      <Act6PrivatePortal />
    </MemoryRouter>,
  );

function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  return async () => {
    await user.type(screen.getByLabelText(/Nome Completo/i), 'Mariana Albuquerque');
    await user.type(screen.getByLabelText(/E-mail Corporativo/i), 'mariana@empresa.com.br');
    await user.type(screen.getByLabelText(/^WhatsApp$/i), '(11) 99999-9999');
  };
}

const originalMatchMedia = window.matchMedia;

function stubMatchMedia() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  playMock.mockClear();
  stubMatchMedia();
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Act6PrivatePortal', () => {
  it('renderiza o formulário do Portal Privado com honeypot e link para login', () => {
    renderPortal();

    expect(screen.getByText('Sessão Executiva Reservada')).toBeInTheDocument();
    expect(screen.getByText(/Transforme a sua área comercial/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail Corporativo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^WhatsApp$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Empresa/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByLabelText(/Website/i)).toBeInTheDocument(); // honeypot
    expect(screen.getByRole('link', { name: /Entrar no Console/i })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  it('mantém o submit desabilitado sem consentimento LGPD', async () => {
    const user = userEvent.setup();
    renderPortal();

    await fillRequiredFields(user)();
    const submit = screen.getByRole('button', { name: /Confirmar Solicitação de Acesso/i });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole('checkbox'));
    expect(submit).toBeEnabled();
  });

  it('seleciona tamanho de equipe e envia payload real com sucesso', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPortal();
    await fillRequiredFields(user)();
    await user.type(screen.getByLabelText(/Empresa/i), 'Logística Nacional');
    await user.click(screen.getByRole('button', { name: '50+' }));
    expect(screen.getByRole('button', { name: '50+' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '6 a 15' })).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /Confirmar Solicitação de Acesso/i }));

    await waitFor(() => {
      expect(screen.getByText('Solicitação Recebida')).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/public/lead-capture');
    expect(init.method).toBe('POST');
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      nome: 'Mariana Albuquerque',
      email: 'mariana@empresa.com.br',
      whatsapp: '(11) 99999-9999',
      empresa: 'Logística Nacional',
      equipe: '50+',
      consent: true,
    });
    expect(playMock).toHaveBeenCalledWith('success');
  });

  it('exibe erro honesto quando a API rejeita ou retorna success=false', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: 'Limite de solicitações atingido.' }),
      }),
    );

    renderPortal();
    await fillRequiredFields(user)();
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /Confirmar Solicitação de Acesso/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Limite de solicitações atingido.');
    });
    expect(playMock).toHaveBeenCalledWith('error');
    // Formulário continua visível para nova tentativa
    expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
  });

  it('exibe erro genérico quando fetch falha sem Error.message útil', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('falha de rede'));

    renderPortal();
    await fillRequiredFields(user)();
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /Confirmar Solicitação de Acesso/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Não foi possível enviar sua solicitação. Tente novamente.',
      );
    });
  });
});

describe('LuxuryLandingPage', () => {
  it('monta os 6 atos + header/footer e ativa a classe dark no documento', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    render(
      <MemoryRouter>
        <LuxuryLandingPage />
      </MemoryRouter>,
    );

    // Atos principais renderizados
    expect(await screen.findByTestId('birthhub-orbit-360')).toBeInTheDocument();
    expect(screen.getByText('A Matriz Contínua 360º')).toBeInTheDocument();
    expect(screen.getByText('A Verdade Operacional')).toBeInTheDocument();
    expect(screen.getByText('O Índice de Soberania')).toBeInTheDocument();
    expect(screen.getByText('Sessão Executiva Reservada')).toBeInTheDocument();
    expect(screen.getByText(/Todos os direitos reservados/i)).toBeInTheDocument();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('CTA do header rola até a seção #acesso via scrollIntoView', async () => {
    const scrollSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollSpy;
    render(
      <MemoryRouter>
        <LuxuryLandingPage />
      </MemoryRouter>,
    );

    const portalBtn = await screen.findAllByRole('button', { name: /Acesso Reservado/i });
    fireEvent.click(portalBtn[0]);
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth' });
  });
});
