import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Landing360 } from '@/features/landing/pages/Landing360';

const { signInEmailMock, signUpEmailMock, requestPasswordResetMock, signInSocialMock } = vi.hoisted(
  () => ({
    signInEmailMock: vi.fn(),
    signUpEmailMock: vi.fn(),
    requestPasswordResetMock: vi.fn(),
    signInSocialMock: vi.fn(),
  }),
);

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
    signIn: { email: signInEmailMock, social: signInSocialMock },
    signUp: { email: signUpEmailMock },
    requestPasswordReset: requestPasswordResetMock,
  },
}));

vi.mock('../../../lib/auth-client.js', () => ({
  authClient: {
    signIn: { email: signInEmailMock, social: signInSocialMock },
    signUp: { email: signUpEmailMock },
    requestPasswordReset: requestPasswordResetMock,
  },
}));

describe('Landing360', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
    window.scrollTo = vi.fn();
    signInEmailMock.mockReset();
    signUpEmailMock.mockReset();
    requestPasswordResetMock.mockReset();
    signInSocialMock.mockReset();
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

  it('deve alternar para a tela de login ao acionar o botão de acesso e voltar ao início', () => {
    renderWithProviders('/', 'intro');

    const loginBtns = screen.getAllByRole('button', { name: /Acessar Plataforma/i });
    fireEvent.click(loginBtns[0]);

    expect(screen.getByText(/Entrar na Plataforma/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nome@empresa\.com\.br/i)).toBeInTheDocument();

    const backBtn = screen.getByRole('button', { name: /Voltar ao Início/i });
    fireEvent.click(backBtn);
  });

  it('deve renderizar a tela de login diretamente quando rota é /login', () => {
    renderWithProviders('/login', 'login');

    expect(screen.getByText(/Entrar na Plataforma/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nome@empresa\.com\.br/i)).toBeInTheDocument();
  });

  it('deve permitir abrir e fechar detalhes dos pilares e acionar o simulador de ROI', () => {
    renderWithProviders('/', 'intro');

    const pillarCard = screen.getByText(/Hub comercial/i);
    fireEvent.click(pillarCard);

    expect(screen.getAllByText(/01\. Hub Comercial/i).length).toBeGreaterThan(0);
    const closeBtn = screen.getByRole('button', { name: /^Fechar$/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Abrir simulador de ROI
    const roiBtn = screen.getByRole('button', { name: /^Simular ROI$/i });
    fireEvent.click(roiBtn);
  });

  it('deve alternar para o modo Command Center e inspecionar os módulos da sidebar e do grid', () => {
    renderWithProviders('/', 'intro');

    const cmdBtn = screen.getByRole('button', { name: /^Command Center$/i });
    fireEvent.click(cmdBtn);

    // Clicar nos itens da sidebar do Command Center
    const sideItems = [
      /✧ Inteligência/i,
      /▦ CRM & BI/i,
      /◎ Prospecção/i,
      /⌘ Automações/i,
      /◈ VoiceHub/i,
      /◉ Governança/i,
      /⥈ Integrações/i,
      /\+ Nova missão/i,
      /Iniciar missão/i,
    ];

    for (const pattern of sideItems) {
      fireEvent.click(screen.getAllByRole('button', { name: pattern })[0]);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /^Fechar$/i }));
    }

    // Clicar em um módulo do grid COMMAND_MODULES
    fireEvent.click(screen.getByText(/Roleplay/i));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Acessar Plataforma →/i }));

    // Voltar e alternar para página pública
    fireEvent.click(screen.getByRole('button', { name: /Voltar ao Início/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Página pública$/i }));
  });

  it('deve exibir e acionar o botão flutuante de voltar ao topo após rolagem', () => {
    renderWithProviders('/', 'intro');

    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true });
    fireEvent.scroll(window);

    const topBtn = screen.getByRole('button', { name: /Voltar ao topo da página/i });
    fireEvent.click(topBtn);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('deve validar e submeter formulários de signin, signup e forgot password', async () => {
    renderWithProviders('/login', 'login');

    const submitBtn = () =>
      screen.getByRole('button', {
        name: /Entrar na Plataforma|Solicitar Acesso|Enviar Link de Redefinição/i,
      });
    const emailInput = screen.getByPlaceholderText(/nome@empresa\.com\.br/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);

    // 1. Submissão vazia
    fireEvent.click(submitBtn());
    expect(screen.getByRole('alert')).toHaveTextContent(/informe seu e-mail corporativo/i);

    // 2. E-mail inválido
    fireEvent.change(emailInput, { target: { value: 'invalido-sem-arroba' } });
    fireEvent.click(submitBtn());
    expect(screen.getByRole('alert')).toHaveTextContent(/e-mail corporativo válido/i);

    // 3. E-mail corporativo válido sem senha
    fireEvent.change(emailInput, { target: { value: 'executivo@empresa.com.br' } });
    fireEvent.click(submitBtn());
    expect(screen.getByRole('alert')).toHaveTextContent(/informe sua senha de acesso/i);

    // 4. Mostrar/ocultar senha e checkbox manter conectado
    fireEvent.click(screen.getByRole('button', { name: /Mostrar ou ocultar senha/i }));
    fireEvent.click(screen.getByLabelText(/Manter conectado/i));

    // 5. Signin com erro e depois sucesso
    fireEvent.change(passwordInput, { target: { value: 'SenhaForte123!' } });
    signInEmailMock.mockResolvedValueOnce({ error: { message: 'Credenciais inválidas' } });
    fireEvent.click(submitBtn());
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Credenciais inválidas/i);
    });

    signInEmailMock.mockResolvedValueOnce({ error: null });
    fireEvent.click(submitBtn());
    await waitFor(() => {
      expect(signInEmailMock).toHaveBeenCalledTimes(2);
    });

    // 6. Signup com senha curta, erro e sucesso
    fireEvent.click(screen.getByRole('button', { name: /Criar conta/i }));
    fireEvent.change(screen.getByPlaceholderText(/Seu nome/i), {
      target: { value: 'Diretor Comercial' },
    });
    fireEvent.change(passwordInput, { target: { value: '12345' } });
    fireEvent.click(submitBtn());
    expect(screen.getByRole('alert')).toHaveTextContent(/pelo menos 8 caracteres/i);

    fireEvent.change(passwordInput, { target: { value: 'SenhaForte123!' } });
    signUpEmailMock.mockResolvedValueOnce({ error: { message: 'Domínio já registrado' } });
    fireEvent.click(submitBtn());
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Domínio já registrado/i);
    });

    signUpEmailMock.mockResolvedValueOnce({ error: null });
    fireEvent.click(submitBtn());
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        /Solicitação de provisionamento enviada/i,
      );
    });

    // 7. Forgot password com erro e sucesso
    fireEvent.click(screen.getByRole('button', { name: /Fazer login/i }));
    fireEvent.click(screen.getByRole('button', { name: /Esqueci minha senha/i }));

    requestPasswordResetMock.mockResolvedValueOnce({ error: { message: 'Limite excedido' } });
    fireEvent.click(submitBtn());
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Limite excedido/i);
    });

    requestPasswordResetMock.mockResolvedValueOnce({ error: null });
    fireEvent.click(submitBtn());
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/Link de redefinição de senha enviado/i);
    });

    // Voltar para Login Corporativo a partir de forgot
    fireEvent.click(screen.getByRole('button', { name: /Voltar para Login Corporativo/i }));
  });

  it('deve suportar autenticação SSO Empresarial, navegação por teclado nas abas, tela cheia e erros de query string', async () => {
    renderWithProviders('/login?error=sso_failed', 'login');
    expect(screen.getByRole('alert')).toHaveTextContent(/Falha na autenticação via SSO/i);

    // Alternar tela cheia
    const fsBtn = screen.getByRole('button', { name: /modo tela cheia/i });
    fireEvent.click(fsBtn);

    // Navegação por teclado entre abas Email e SSO
    const emailTab = screen.getByRole('tab', { name: /E-mail Corporativo/i });
    fireEvent.keyDown(emailTab, { key: 'ArrowRight' });

    const ssoInput = screen.getByPlaceholderText(/empresa\.com\.br/i);
    expect(ssoInput).toBeInTheDocument();

    // Submissão SSO vazia
    fireEvent.change(ssoInput, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Continuar com SSO/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/informe o domínio corporativo/i);

    // Submissão SSO com falha e sucesso
    fireEvent.change(ssoInput, { target: { value: 'corporacao.com.br' } });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: 'SSO não encontrado' }),
    } as Response);

    fireEvent.click(screen.getByRole('button', { name: /Continuar com SSO/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/SSO não encontrado/i);
    });

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, providerName: 'Okta', provider: 'okta' }),
    } as Response);
    signInSocialMock.mockResolvedValueOnce({});

    fireEvent.click(screen.getByRole('button', { name: /Continuar com SSO/i }));
    await waitFor(() => {
      expect(signInSocialMock).toHaveBeenCalledWith({
        provider: 'okta',
        callbackURL: '/app',
      });
    });

    fetchSpy.mockRestore();
  });
});
