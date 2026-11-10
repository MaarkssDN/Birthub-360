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

// Neutraliza os hooks cinematográficos (rAF/scroll/magnetic) que monopolizam o
// event loop do jsdom — useB360ScrollVelocityInertia mantém um rAF perpétuo que
// atrasa timers e renders a ponto de estourar o timeout. São efeitos puramente
// visuais: o DOM renderizado e os comportamentos assertados não mudam.
vi.mock('@/features/landing/components/CinematicFX.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/landing/components/CinematicFX.js')>();
  return {
    ...actual,
    useB360CardTilt: () => null,
    useB360MagneticAttraction: () => null,
    useB360ScrollParallax: () => null,
    useB360ScrollVelocityInertia: () => null,
    useB360SectionProgress: () => ({ progress: 0, isIntersecting: false }),
  };
});

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

    const loginBtns = screen.getAllByText(/Acessar Plataforma/i);
    fireEvent.click(loginBtns[0]);

    expect(screen.getByText(/Entrar na Plataforma/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nome@empresa\.com\.br/i)).toBeInTheDocument();

    const backBtn = screen.getByText(/Voltar ao Início/i);
    fireEvent.click(backBtn);
  });

  it('deve renderizar a tela de login diretamente quando rota é /login', () => {
    renderWithProviders('/login', 'login');

    expect(screen.getByText(/Entrar na Plataforma/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nome@empresa\.com\.br/i)).toBeInTheDocument();
  });

  it('deve permitir abrir e fechar detalhes dos pilares e acionar o simulador de ROI', () => {
    const { container } = renderWithProviders('/', 'intro');

    const pillarCard = screen.getByText(/Hub comercial/i);
    fireEvent.click(pillarCard);

    expect(screen.getAllByText(/01\. Hub Comercial/i).length).toBeGreaterThan(0);
    const closeBtn = screen.getByText(/^Fechar$/i);
    fireEvent.click(closeBtn);

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();

    // Abrir simulador de ROI
    const roiBtn = screen.getByText(/^Simular ROI$/i);
    fireEvent.click(roiBtn);
  });

  it('deve alternar para o modo Command Center e inspecionar os módulos da sidebar e do grid', () => {
    const { container } = renderWithProviders('/', 'intro');

    fireEvent.click(screen.getByText(/^Command Center$/i));

    // Clicar nos botões da sidebar do Command Center
    const sideButtons = container.querySelectorAll('.b360-side button');
    expect(sideButtons.length).toBeGreaterThan(5);
    for (const btn of Array.from(sideButtons)) {
      fireEvent.click(btn);
      const closeBtn = container.querySelector('.b360-modal-actions .b360-btn');
      if (closeBtn) fireEvent.click(closeBtn);
    }

    // Clicar em um módulo do grid COMMAND_MODULES
    fireEvent.click(screen.getByText(/Roleplay/i));
    expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Acessar Plataforma →/i));

    // Voltar e alternar para página pública
    fireEvent.click(screen.getByText(/Voltar ao Início/i));
    fireEvent.click(screen.getByText(/^Página pública$/i));
  });

  it('deve exibir e acionar o botão flutuante de voltar ao topo após rolagem', () => {
    const { container } = renderWithProviders('/', 'intro');

    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true });
    fireEvent.scroll(window);

    const topBtn = container.querySelector('.btn-floating-top') as HTMLElement;
    expect(topBtn).toBeInTheDocument();
    fireEvent.click(topBtn);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it(
    'deve validar e submeter formulários de signin, signup e forgot password',
    async () => {
    const { container } = renderWithProviders('/login', 'login');

    const getForm = () => container.querySelector('#auth-panel-email') as HTMLFormElement;
    const getAlert = () => container.querySelector('#auth-error-message') as HTMLElement;
    const getStatus = () => container.querySelector('#auth-status-message') as HTMLElement;
    const emailInput = container.querySelector('#login-email') as HTMLInputElement;
    const passwordInput = container.querySelector('#login-password') as HTMLInputElement;

    // 1. Submissão vazia
    fireEvent.submit(getForm());
    expect(getAlert()).toHaveTextContent(/informe seu e-mail corporativo/i);

    // 2. E-mail inválido
    fireEvent.change(emailInput, { target: { value: 'invalido-sem-arroba' } });
    fireEvent.submit(getForm());
    expect(getAlert()).toHaveTextContent(/e-mail corporativo válido/i);

    // 3. E-mail corporativo válido sem senha
    fireEvent.change(emailInput, { target: { value: 'executivo@empresa.com.br' } });
    fireEvent.submit(getForm());
    expect(getAlert()).toHaveTextContent(/informe sua senha de acesso/i);

    // 4. Mostrar/ocultar senha e checkbox manter conectado
    const togglePassBtn = container.querySelector(
      'button[aria-label="Mostrar ou ocultar senha"]',
    ) as HTMLElement;
    fireEvent.click(togglePassBtn);
    fireEvent.click(screen.getByText(/Manter conectado/i));

    // 5. Signin com erro e depois sucesso
    fireEvent.change(passwordInput, { target: { value: 'SenhaForte123!' } });
    signInEmailMock.mockResolvedValueOnce({ error: { message: 'Credenciais inválidas' } });
    fireEvent.submit(getForm());
    await waitFor(() => {
      expect(getAlert()).toHaveTextContent(/Credenciais inválidas/i);
    });

    signInEmailMock.mockResolvedValueOnce({ error: null });
    fireEvent.submit(getForm());
    await waitFor(() => {
      expect(signInEmailMock).toHaveBeenCalledTimes(2);
    });

    // 6. Signup com senha curta, erro e sucesso
    fireEvent.click(screen.getByText(/Criar conta/i));
    fireEvent.change(container.querySelector('#login-name') as HTMLInputElement, {
      target: { value: 'Diretor Comercial' },
    });
    fireEvent.change(passwordInput, { target: { value: '12345' } });
    fireEvent.submit(getForm());
    expect(getAlert()).toHaveTextContent(/pelo menos 8 caracteres/i);

    fireEvent.change(passwordInput, { target: { value: 'SenhaForte123!' } });
    signUpEmailMock.mockResolvedValueOnce({ error: { message: 'Domínio já registrado' } });
    fireEvent.submit(getForm());
    await waitFor(() => {
      expect(getAlert()).toHaveTextContent(/Domínio já registrado/i);
    });

    signUpEmailMock.mockResolvedValueOnce({ error: null });
    fireEvent.submit(getForm());
    await waitFor(() => {
      expect(getStatus()).toHaveTextContent(/Solicitação de provisionamento enviada/i);
    });

    // 7. Forgot password com erro e sucesso
    fireEvent.click(screen.getByText(/Fazer login/i));
    fireEvent.click(screen.getByText(/Esqueci minha senha/i));

    requestPasswordResetMock.mockResolvedValueOnce({ error: { message: 'Limite excedido' } });
    fireEvent.submit(getForm());
    await waitFor(() => {
      expect(getAlert()).toHaveTextContent(/Limite excedido/i);
    });

    requestPasswordResetMock.mockResolvedValueOnce({ error: null });
    fireEvent.submit(getForm());
    await waitFor(() => {
      expect(getStatus()).toHaveTextContent(/Link de redefinição de senha enviado/i);
    });

    // Voltar para Login Corporativo a partir de forgot
    fireEvent.click(screen.getByText(/Login Corporativo/i));
  }, 15000);

  it('deve suportar autenticação SSO Empresarial, navegação por teclado nas abas, tela cheia e erros de query string', async () => {
    const { container } = renderWithProviders('/login?error=sso_failed', 'login');
    const getAlert = () => container.querySelector('#auth-error-message') as HTMLElement;
    expect(getAlert()).toHaveTextContent(/Falha na autenticação via SSO/i);

    // Alternar tela cheia
    const fsBtn = container.querySelector('button[aria-label*="tela cheia"]') as HTMLElement;
    fireEvent.click(fsBtn);

    // Navegação por teclado entre abas Email e SSO
    const emailTab = container.querySelector('#auth-tab-email') as HTMLElement;
    fireEvent.keyDown(emailTab, { key: 'ArrowRight' });

    const ssoInput = container.querySelector('#sso-domain') as HTMLInputElement;
    expect(ssoInput).toBeInTheDocument();

    // Submissão SSO vazia
    fireEvent.change(ssoInput, { target: { value: '' } });
    fireEvent.click(screen.getByText(/Continuar com SSO/i));
    expect(getAlert()).toHaveTextContent(/informe o domínio corporativo/i);

    // Submissão SSO com falha e sucesso
    fireEvent.change(ssoInput, { target: { value: 'corporacao.com.br' } });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: 'SSO não encontrado' }),
    } as Response);

    fireEvent.click(screen.getByText(/Continuar com SSO/i));
    await waitFor(() => {
      expect(getAlert()).toHaveTextContent(/SSO não encontrado/i);
    });

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, providerName: 'Okta', provider: 'okta' }),
    } as Response);
    signInSocialMock.mockResolvedValueOnce({});

    fireEvent.click(screen.getByText(/Continuar com SSO/i));
    await waitFor(() => {
      expect(signInSocialMock).toHaveBeenCalledWith({
        provider: 'okta',
        callbackURL: '/app',
      });
    });

    fetchSpy.mockRestore();
  });
  it('deve exibir os pilares de alta conversão (proposta de valor, urgência, provas sociais e credenciais)', () => {
    const { container } = renderWithProviders('/', 'intro');

    // 1. Proposta de valor clara & 6. Urgência responsável
    expect(screen.getByText(/Ciclo de Implantação Assistida/i)).toBeInTheDocument();
    expect(screen.getByText(/Acelere o ciclo de vendas e aumente a conversão do pipeline em até 3.8x/i)).toBeInTheDocument();

    // 2. Design focado & 3. Foco no Call to Action
    const ctaLinks = screen.getAllByRole('link', { name: /Garantir Demonstração Gratuita/i });
    expect(ctaLinks.length).toBeGreaterThan(0);

    // 5. Provas sociais, métricas e selos de credibilidade
    expect(screen.getByText(/\+42%/i)).toBeInTheDocument();
    expect(screen.getAllByText(/3.8x/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/R\$ 180M\+/i)).toBeInTheDocument();
    expect(screen.getByText(/Rodrigo Silveira/i)).toBeInTheDocument();
    expect(screen.getByText(/Camila Duarte/i)).toBeInTheDocument();
    expect(screen.getByText(/Criptografia AES-256 Ponta a Ponta/i)).toBeInTheDocument();
    expect(screen.getByText(/Isolamento Multi-Tenant via Postgres RLS/i)).toBeInTheDocument();

    // 4. Formulário objetivo de captura de lead
    expect(container.querySelector('#lead-nome')).toBeInTheDocument();
    expect(container.querySelector('#lead-email')).toBeInTheDocument();
    expect(container.querySelector('#lead-whatsapp')).toBeInTheDocument();
  });

  it('deve submeter o formulário de lead com sucesso e alternar a variante A/B', async () => {
    const { container } = renderWithProviders('/', 'intro');

    const emailInput = container.querySelector('#lead-email') as HTMLInputElement;
    expect(emailInput).toBeInTheDocument();

    // Preenche apenas o campo assertado no sucesso para evitar re-renders
    // desnecessários da landing inteira (cada change dispara render do componente).
    fireEvent.change(emailInput, { target: { value: 'mariana@vanguarda.com.br' } });

    // Submissão do formulário
    const submitBtn = screen.getByRole('button', { name: /GARANTIR MINHA DEMONSTRAÇÃO GRATUITA/i });
    const leadFormEl = submitBtn.closest('form') as HTMLFormElement;
    fireEvent.submit(leadFormEl);

    await waitFor(
      () => {
        expect(screen.getByText(/Sessão Solicitada com Sucesso/i)).toBeInTheDocument();
        expect(screen.getByText(/mariana@vanguarda\.com\.br/i)).toBeInTheDocument();
        expect(screen.getByText(/Abrir Google Agenda/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // 8. Teste A/B: alternar para Variante B
    const varBBtn = screen.getAllByRole('button', { name: /Variante B/i })[0];
    fireEvent.click(varBBtn);

    await waitFor(
      () => {
        expect(screen.getByText(/Multiplique a capacidade de vendas da sua equipe/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });
});
