import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Landing360 } from '@/features/landing/pages/Landing360Impeccable';

const authState = {
  currentUser: null as { id: string } | null,
  isPending: false,
  signOut: vi.fn(),
};

const { signInEmailMock, signUpEmailMock, requestPasswordResetMock, signInSocialMock, navMock } =
  vi.hoisted(() => ({
    signInEmailMock: vi.fn(),
    signUpEmailMock: vi.fn(),
    requestPasswordResetMock: vi.fn(),
    signInSocialMock: vi.fn(),
    navMock: vi.fn(),
  }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navMock,
  };
});

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: { play: vi.fn() },
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: { email: signInEmailMock, social: signInSocialMock },
    signUp: { email: signUpEmailMock },
    requestPasswordReset: requestPasswordResetMock,
  },
}));

function renderPage(route = '/', initialScreen: 'intro' | 'login' = 'intro') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <Landing360 initialScreen={initialScreen} />
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe('Landing360Impeccable', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    authState.currentUser = null;
    authState.isPending = false;
    navMock.mockReset();
    signInEmailMock.mockReset();
    signUpEmailMock.mockReset();
    requestPasswordResetMock.mockReset();
    signInSocialMock.mockReset();
    window.scrollTo = vi.fn();
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
  });

  it('mostra o estado de carregamento enquanto a sessão ainda está pendente', () => {
    authState.isPending = true;
    const { container } = renderPage();
    expect(container.querySelector('.lp-loader')).toBeInTheDocument();
    expect(screen.queryByText(/Revenue Command Center/i)).not.toBeInTheDocument();
  });

  it('redireciona para /app quando já existe sessão autenticada', () => {
    authState.currentUser = { id: 'u-1' };
    renderPage();
    expect(navMock).toHaveBeenCalledWith('/app', { replace: true });
  });

  it('renderiza a intro com proposta de valor, módulos, fluxo, integrações e segurança', () => {
    renderPage('/', 'intro');

    expect(document.title).toBe('Birth Hub 360° · Revenue Command Center');
    expect(screen.getAllByText(/Revenue Command Center/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/plataforma definitiva de CRM B2B/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Acessar plataforma/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Simular ROI$/i })).toBeInTheDocument();

    expect(screen.getByText('11 Módulos Integrados')).toBeInTheDocument();
    expect(screen.getByText('Hub Comercial')).toBeInTheDocument();
    expect(screen.getByText('Social Selling')).toBeInTheDocument();
    expect(screen.getByText('Conectores & APIs')).toBeInTheDocument();
    expect(screen.getByText('Command Center')).toBeInTheDocument();
    expect(screen.getByText('Pipeline ao Vivo')).toBeInTheDocument();

    expect(screen.getAllByText('Como funciona').length).toBeGreaterThan(0);
    expect(screen.getByText('Conecte dados')).toBeInTheDocument();
    expect(screen.getByText('Receita cresce')).toBeInTheDocument();

    expect(screen.getByText('Integrações Nativas')).toBeInTheDocument();
    expect(screen.getByText('Bitrix24')).toBeInTheDocument();
    expect(screen.getByText('Salesforce')).toBeInTheDocument();

    expect(screen.getByText('Segurança Enterprise')).toBeInTheDocument();
    expect(screen.getByText('Multi-tenancy RLS')).toBeInTheDocument();
    expect(screen.getByText('LGPD Nativa')).toBeInTheDocument();

    expect(screen.getByText(/Pronto para escalar sua receita/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacidade' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Termos' })).toHaveAttribute('href', '/terms');
    expect(screen.getByText(/Feito com excelência no Brasil/i)).toBeInTheDocument();
  });

  it('alterna o tema pelo botão do header', () => {
    renderPage('/', 'intro');
    const toggle = screen.getByRole('button', { name: /Alternar tema/i });
    const before = document.documentElement.dataset.theme;
    fireEvent.click(toggle);
    expect(document.documentElement.dataset.theme).not.toBe(before);
  });

  it('abre o login pelos CTAs e volta à intro pelo botão voltar', () => {
    renderPage('/', 'intro');
    fireEvent.click(screen.getByRole('button', { name: /Acessar plataforma/i }));
    expect(navMock).toHaveBeenCalledWith('/login', { replace: true });
    expect(screen.getByText(/Birth Hub 360°/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/seu@email.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Entrar$/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Voltar/i }));
    expect(screen.getAllByText(/Revenue Command Center/i).length).toBeGreaterThan(0);
  });

  it('abre a tela de login direto na rota /login e interpreta erros da query string', () => {
    renderPage('/login?error=sso_failed', 'login');
    expect(screen.getByText(/Falha na autenticação via SSO/i)).toBeInTheDocument();
  });

  it('exibe mensagem de acesso não autorizado e erros genéricos da query', () => {
    const { unmount } = renderPage('/login?error=unauthorized', 'login');
    expect(screen.getByText(/Acesso não autorizado/i)).toBeInTheDocument();
    unmount();
    renderPage('/login?error=token%20inválido', 'login');
    expect(screen.getByText(/token inválido/i)).toBeInTheDocument();
  });

  it('abre e fecha o detalhe de um pilar e o simulador de ROI', () => {
    renderPage('/', 'intro');
    fireEvent.click(screen.getByText('Hub Comercial'));
    expect(screen.getAllByText(/Hub Comercial/i).length).toBeGreaterThan(1);
    fireEvent.click(screen.getByText(/^Fechar$/i));

    fireEvent.click(screen.getByRole('button', { name: /^Simular ROI$/i }));
    expect(document.querySelector('[role="dialog"]')).toBeInTheDocument();
  });

  it('abre o simulador a partir do CTA final e do rodapé', () => {
    renderPage('/', 'intro');
    fireEvent.click(screen.getByRole('button', { name: /Calcular ROI/i }));
    expect(document.querySelector('[role="dialog"]')).toBeInTheDocument();
  });

  it('mostra e aciona o botão de voltar ao topo após a rolagem', () => {
    const { container } = renderPage('/', 'intro');
    const btn = container.querySelector('.lp-scroll-top') as HTMLButtonElement;
    expect(btn).toBeInTheDocument();
    expect(btn.className).not.toContain('lp-scroll-top--vis');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 500 });
    fireEvent.scroll(window);
    expect(btn.className).toContain('lp-scroll-top--vis');

    fireEvent.click(btn);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('valida e submete signin, signup e recuperação de senha', async () => {
    renderPage('/login', 'login');

    const email = screen.getByPlaceholderText(/seu@email.com/i);
    const submit = () => fireEvent.click(screen.getByRole('button', { name: /^Entrar$/i }));

    fireEvent.change(email, { target: { value: 'usuario@intranet' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'SenhaForte1' } });
    submit();
    expect(await screen.findByText(/E-mail não autorizado/i)).toBeInTheDocument();

    fireEvent.change(email, { target: { value: 'executivo@empresa.com.br' } });
    signInEmailMock.mockResolvedValueOnce({ error: { message: 'Credenciais inválidas' } });
    submit();
    expect(await screen.findByText(/Credenciais inválidas/i)).toBeInTheDocument();

    signInEmailMock.mockResolvedValueOnce({ error: null });
    submit();
    await waitFor(() => {
      expect(signInEmailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'executivo@empresa.com.br',
          rememberMe: true,
          callbackURL: '/app',
        }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /^Criar$/i }));
    expect(screen.getByPlaceholderText(/Seu nome/i)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Seu nome/i), { target: { value: 'Ana' } });
    fireEvent.change(email, { target: { value: 'ana@intranet' } });
    fireEvent.click(screen.getByRole('button', { name: /Criar conta/i }));
    expect(await screen.findByText(/E-mail não autorizado/i)).toBeInTheDocument();

    fireEvent.change(email, { target: { value: 'ana@empresa.com.br' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'SenhaForte1' } });
    signUpEmailMock.mockResolvedValueOnce({ error: { message: 'Domínio já registrado' } });
    fireEvent.click(screen.getByRole('button', { name: /Criar conta/i }));
    expect(await screen.findByText(/Domínio já registrado/i)).toBeInTheDocument();

    signUpEmailMock.mockResolvedValueOnce({ error: null });
    fireEvent.click(screen.getByRole('button', { name: /Criar conta/i }));
    expect(await screen.findByText(/Conta criada! Verifique seu e-mail/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Entrar$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Esqueci a senha/i }));
    fireEvent.change(email, { target: { value: 'ana@empresa.com.br' } });
    requestPasswordResetMock.mockResolvedValueOnce({});
    fireEvent.click(screen.getByRole('button', { name: /Enviar link/i }));
    expect(await screen.findByText(/Link enviado! Verifique seu e-mail/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/^Voltar$/));
    expect(screen.getByRole('button', { name: /^Entrar$/i })).toBeInTheDocument();
  });

  it('alterna visibilidade da senha, checkbox lembrar e cobre erro de conexão', async () => {
    signInEmailMock.mockRejectedValueOnce(new Error('network'));
    renderPage('/login', 'login');

    const password = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
    expect(password).toHaveAttribute('type', 'password');
    fireEvent.click(document.querySelector('.lp-fld-pw-tog') as HTMLButtonElement);
    expect(password).toHaveAttribute('type', 'text');

    const remember = screen.getByRole('checkbox');
    expect(remember).toBeChecked();
    fireEvent.click(remember);
    expect(remember).not.toBeChecked();

    fireEvent.change(screen.getByPlaceholderText(/seu@email.com/i), {
      target: { value: 'executivo@empresa.com.br' },
    });
    fireEvent.change(password, { target: { value: 'SenhaForte1' } });
    fireEvent.click(screen.getByRole('button', { name: /^Entrar$/i }));
    expect(await screen.findByText(/Erro de conexão/i)).toBeInTheDocument();
  });

  it('alterna para SSO, inicia o fluxo Microsoft e trata falha', async () => {
    renderPage('/login', 'login');
    fireEvent.click(screen.getByRole('tab', { name: /^SSO$/i }));
    expect(screen.getByPlaceholderText(/empresa.com.br/i)).toBeInTheDocument();

    signInSocialMock.mockRejectedValueOnce(new Error('sso'));
    fireEvent.click(screen.getByRole('button', { name: /Conectar via SSO/i }));
    expect(await screen.findByText(/Erro ao iniciar SSO/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Usar e-mail/i }));
    expect(screen.getByPlaceholderText(/seu@email.com/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /^SSO$/i }));
    signInSocialMock.mockResolvedValueOnce({});
    fireEvent.click(screen.getByRole('button', { name: /Conectar via SSO/i }));
    await waitFor(() => {
      expect(signInSocialMock).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'microsoft',
          callbackURL: '/app',
        }),
      );
    });
  });

  it('entra no login pelo CTA "Começar agora" da seção final', () => {
    renderPage('/', 'intro');
    fireEvent.click(screen.getByRole('button', { name: /Começar agora/i }));
    expect(screen.getByRole('button', { name: /^Entrar$/i })).toBeInTheDocument();
    expect(navMock).toHaveBeenCalledWith('/login', { replace: true });
  });
});
