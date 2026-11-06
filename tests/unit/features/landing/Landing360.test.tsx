import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Landing360 } from '@/features/landing/pages/Landing360';
import { ThemeProvider } from '@/contexts/ThemeContext';

vi.mock('../../../contexts/AuthContext.js', () => ({
  useAuth: () => ({
    currentUser: null,
    isPending: false,
    signOut: vi.fn(),
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
    isPending: false,
    signOut: vi.fn(),
  }),
}));

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: {
    play: vi.fn(),
  },
}));

vi.mock('../../../lib/soundEffects.js', () => ({
  SoundFX: {
    play: vi.fn(),
  },
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    forgetPassword: vi.fn(),
  },
}));

vi.mock('../../../lib/auth-client.js', () => ({
  authClient: {
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    forgetPassword: vi.fn(),
  },
}));

describe('Landing360', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
    window.scrollTo = vi.fn();
  });

  const renderWithProviders = (initialRoute = '/', initialScreen: 'intro' | 'login' = 'intro') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <ThemeProvider>
          <Landing360 initialScreen={initialScreen} />
        </ThemeProvider>
      </MemoryRouter>,
    );
  };

  it('deve renderizar a tela inicial com o slogan oficial e botões de ação', () => {
    renderWithProviders('/', 'intro');

    expect(screen.getByText(/Dados que Conectam/i)).toBeInTheDocument();
    expect(screen.getByText(/Inteligência que Decide/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Acessar Plataforma/i).length).toBeGreaterThan(0);
  });

  it('deve alternar para a tela de login ao acionar o botão de acesso', () => {
    renderWithProviders('/', 'intro');

    const loginBtns = screen.getAllByRole('button', { name: /Acessar Plataforma/i });
    fireEvent.click(loginBtns[0]);

    expect(screen.getByText(/Entrar na Plataforma/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nome@empresa\.com\.br/i)).toBeInTheDocument();
  });

  it('deve renderizar a tela de login diretamente quando rota é /login', () => {
    renderWithProviders('/login', 'login');

    expect(screen.getByText(/Entrar na Plataforma/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nome@empresa\.com\.br/i)).toBeInTheDocument();
  });

  it('deve permitir abrir e fechar detalhes de um pilar', () => {
    renderWithProviders('/', 'intro');

    const pillarCard = screen.getByText(/Hub comercial/i);
    fireEvent.click(pillarCard);

    expect(screen.getAllByText(/01\. Hub Comercial/i).length).toBeGreaterThan(0);
    const closeBtn = screen.getByRole('button', { name: /^Fechar$/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('deve alternar entre os modos de autenticação na tela de login', () => {
    renderWithProviders('/login', 'login');

    // Clicar em Criar conta
    const signupBtn = screen.getByRole('button', { name: /Criar conta/i });
    fireEvent.click(signupBtn);
    expect(screen.getAllByText(/Solicitar Acesso/i).length).toBeGreaterThan(0);

    // Clicar em Fazer login
    const loginBackBtn = screen.getByRole('button', { name: /Fazer login/i });
    fireEvent.click(loginBackBtn);
    expect(screen.getByText(/Entrar na Plataforma/i)).toBeInTheDocument();

    // Clicar em Esqueci
    const forgotBtn = screen.getByRole('button', { name: /Esqueci/i });
    fireEvent.click(forgotBtn);
    expect(screen.getByText(/Enviar Link de Redefinição/i)).toBeInTheDocument();
  });
});
