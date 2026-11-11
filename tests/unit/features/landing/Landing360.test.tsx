import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Landing360 } from '@/features/landing/pages/Landing360';

const {
  signInEmailMock,
  signUpEmailMock,
  requestPasswordResetMock,
  signInSocialMock,
  submitLeadMock,
  trackLeadFormSubmittedMock,
} = vi.hoisted(() => ({
  signInEmailMock: vi.fn(),
  signUpEmailMock: vi.fn(),
  requestPasswordResetMock: vi.fn(),
  signInSocialMock: vi.fn(),
  submitLeadMock: vi.fn(),
  trackLeadFormSubmittedMock: vi.fn(),
}));

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

vi.mock('@/features/landing/services/submitLead', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/landing/services/submitLead')>();
  return {
    ...actual,
    submitLead: submitLeadMock,
  };
});

vi.mock('@/lib/analytics/conversionTelemetry', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/lib/analytics/conversionTelemetry')>();
  return {
    ...actual,
    trackLeadFormSubmitted: trackLeadFormSubmittedMock,
  };
});

describe('Landing360', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
    window.scrollTo = vi.fn();
    signInEmailMock.mockReset();
    signUpEmailMock.mockReset();
    requestPasswordResetMock.mockReset();
    signInSocialMock.mockReset();
    submitLeadMock.mockReset();
    submitLeadMock.mockResolvedValue(undefined);
    trackLeadFormSubmittedMock.mockReset();
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

  const fillValidLeadForm = (
    container: HTMLElement,
    options?: { consent?: boolean; whatsapp?: string },
  ) => {
    fireEvent.change(container.querySelector('#lead-nome') as HTMLInputElement, {
      target: { value: 'Mariana Albuquerque' },
    });
    fireEvent.change(container.querySelector('#lead-email') as HTMLInputElement, {
      target: { value: 'mariana@vanguarda.com.br' },
    });
    fireEvent.change(container.querySelector('#lead-whatsapp') as HTMLInputElement, {
      target: { value: options?.whatsapp ?? '(11) 99999-9999' },
    });
    const consent = container.querySelector('#lead-consent') as HTMLInputElement;
    if ((options?.consent ?? true) && !consent.checked) {
      fireEvent.click(consent);
    }
  };

  const submitLeadForm = () => {
    const submitBtn = screen.getByRole('button', { name: /GARANTIR MINHA DEMONSTRAÇÃO GRATUITA/i });
    fireEvent.submit(submitBtn.closest('form') as HTMLFormElement);
    return submitBtn;
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

  it('deve iniciar o consentimento desmarcado e bloquear o envio sem consentimento', async () => {
    const { container } = renderWithProviders('/', 'intro');
    const consent = container.querySelector('#lead-consent') as HTMLInputElement;
    expect(consent).toBeInTheDocument();
    expect(consent.checked).toBe(false);
    expect(consent).toHaveAttribute('required');
    expect(consent).toHaveAttribute('aria-required', 'true');

    fillValidLeadForm(container, { consent: false });
    submitLeadForm();

    const consentError = await screen.findByText(
      /autorizar o tratamento dos dados/i,
      { selector: '#lead-consent-error' },
    );
    expect(consentError).toBeInTheDocument();
    expect(consent).toHaveAttribute('aria-invalid', 'true');
    expect(consent).toHaveAttribute('aria-describedby', 'lead-consent-error');
    expect(document.activeElement).toBe(consent);
    expect(container.querySelector('#lead-form-alert')).toHaveAttribute('aria-live', 'assertive');
    expect(container.querySelector('#lead-form-alert')).toHaveTextContent(
      /autorizar o tratamento dos dados/i,
    );
    expect(submitLeadMock).not.toHaveBeenCalled();
    expect(trackLeadFormSubmittedMock).not.toHaveBeenCalled();
  });

  it('deve recusar e-mail inválido, anunciar o erro em aria-live e focar o campo', async () => {
    const { container } = renderWithProviders('/', 'intro');
    fillValidLeadForm(container);
    fireEvent.change(container.querySelector('#lead-email') as HTMLInputElement, {
      target: { value: 'invalido-sem-arroba' },
    });
    submitLeadForm();

    const emailError = await screen.findByText(/informe um e-mail válido/i, {
      selector: '#lead-email-error',
    });
    expect(emailError).toHaveAttribute('id', 'lead-email-error');
    const emailInput = container.querySelector('#lead-email') as HTMLInputElement;
    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    expect(emailInput).toHaveAttribute('aria-describedby', 'lead-email-error');
    expect(document.activeElement).toBe(emailInput);
    expect(container.querySelector('#lead-form-alert')).toHaveAttribute('aria-live', 'assertive');
    expect(container.querySelector('#lead-form-alert')).toHaveTextContent(/informe um e-mail válido/i);
    expect(submitLeadMock).not.toHaveBeenCalled();
  });

  it('deve recusar WhatsApp inválido sem DDD de 10 ou 11 dígitos', async () => {
    const { container } = renderWithProviders('/', 'intro');
    fillValidLeadForm(container);
    fireEvent.change(container.querySelector('#lead-whatsapp') as HTMLInputElement, {
      target: { value: '123' },
    });
    submitLeadForm();

    expect(
      await screen.findByText(/WhatsApp com DDD \(10 ou 11 dígitos\)/i, {
        selector: '#lead-whatsapp-error',
      }),
    ).toBeInTheDocument();
    const whatsappInput = container.querySelector('#lead-whatsapp') as HTMLInputElement;
    expect(whatsappInput).toHaveAttribute('aria-invalid', 'true');
    expect(document.activeElement).toBe(whatsappInput);
    expect(submitLeadMock).not.toHaveBeenCalled();
  });

  it('deve permitir envio sem WhatsApp e recusar só quando o número preenchido for inválido', async () => {
    const { container } = renderWithProviders('/', 'intro');
    const whatsappInput = container.querySelector('#lead-whatsapp') as HTMLInputElement;
    expect(whatsappInput).not.toHaveAttribute('required');

    fillValidLeadForm(container, { whatsapp: '' });
    submitLeadForm();

    await waitFor(() => {
      expect(submitLeadMock).toHaveBeenCalledTimes(1);
      expect(trackLeadFormSubmittedMock).toHaveBeenCalledTimes(1);
    });
    expect(submitLeadMock.mock.calls[0][0]).not.toHaveProperty('whatsapp');
    expect(submitLeadMock.mock.calls[0][0].website).toBe('');
  });

  it('deve exibir texto provisório de consentimento com e-mail, WhatsApp, finalidade e link para /privacy', () => {
    const { container } = renderWithProviders('/', 'intro');
    const consentLabel = container.querySelector('label[for="lead-consent"]') as HTMLElement;
    expect(consentLabel).toHaveTextContent(/nome, e-mail e, se informado,\s*WhatsApp/i);
    expect(consentLabel).toHaveTextContent(/contato sobre a demonstração do BirthHub\s*360°/i);
    expect(consentLabel).toHaveTextContent(/IP é guardado apenas como hash/i);
    expect(consentLabel).toHaveTextContent(/90 dias/i);
    expect(consentLabel).toHaveTextContent(/30 dias/i);
    const consentPrivacyLink = consentLabel.querySelector('a');
    expect(consentPrivacyLink).toHaveAttribute('href', '/privacy');
    expect(consentPrivacyLink).toHaveTextContent(/Política de Privacidade/i);
  });

  it('deve apontar Direitos do Titular para a seção existente em /privacy e não prometer prazo ou cancelamento em 1 clique', () => {
    renderWithProviders('/', 'intro');

    const rightsLink = screen.getByRole('link', { name: /Direitos do Titular \(LGPD Art\. 18\)/i });
    expect(rightsLink).toHaveAttribute('href', '/privacy#direitos-do-titular');
    expect(screen.queryByText(/15 minutos/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cancelamento fácil com 1 clique/i)).not.toBeInTheDocument();
  });

  it('deve expor os chips de equipe como radiogroup com navegação por teclado', () => {
    const { container } = renderWithProviders('/', 'intro');
    const group = container.querySelector('[role="radiogroup"]') as HTMLElement;
    expect(group).toHaveAttribute('aria-labelledby', 'lead-equipe-label');
    expect(container.querySelector('#lead-equipe-label')).toHaveTextContent(
      /Tamanho da Equipe Comercial/i,
    );

    const radios = screen.getAllByRole('radio');
    expect(radios.map((radio) => radio.textContent)).toEqual(['1 a 5', '6 a 15', '16 a 50', '50+']);
    expect(screen.getByRole('radio', { name: '6 a 15' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '6 a 15' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('radio', { name: '1 a 5' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: '1 a 5' })).toHaveAttribute('tabindex', '-1');

    fireEvent.keyDown(screen.getByRole('radio', { name: '6 a 15' }), { key: 'ArrowRight' });
    expect(screen.getByRole('radio', { name: '16 a 50' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '16 a 50' })).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(screen.getByRole('radio', { name: '16 a 50' }), { key: 'Home' });
    expect(screen.getByRole('radio', { name: '1 a 5' })).toHaveAttribute('aria-checked', 'true');
  });

  it('deve associar o erro de equipe via aria-describedby e usar contraste AA no tema claro', async () => {
    const { LeadSubmitError } = await import('@/features/landing/services/submitLead');
    submitLeadMock.mockRejectedValueOnce(
      new LeadSubmitError(
        'validation',
        'Não foi possível enviar seus dados. Revise as informações e tente novamente.',
        400,
        { equipe: 'invalid' },
      ),
    );

    const { container } = renderWithProviders('/', 'intro');
    const consentLabel = container.querySelector('label[for="lead-consent"]') as HTMLElement;
    expect(consentLabel.className).toMatch(/text-slate-600/);
    expect(consentLabel.className).toMatch(/dark:text-slate-400/);

    fillValidLeadForm(container);
    submitLeadForm();

    const equipeError = await screen.findByText(/Selecione o tamanho da equipe comercial/i, {
      selector: '#lead-equipe-error',
    });
    expect(equipeError).toBeInTheDocument();
    expect(equipeError.className).toMatch(/text-red-600/);
    expect(equipeError.className).toMatch(/dark:text-red-400/);
    const group = container.querySelector('[role="radiogroup"]') as HTMLElement;
    expect(group).toHaveAttribute('aria-describedby', 'lead-equipe-error');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: '6 a 15' }));
    expect(trackLeadFormSubmittedMock).not.toHaveBeenCalled();
  });

  it('deve submeter o formulário de lead com sucesso 2xx, mensagem honesta e alternar a variante A/B', async () => {
    const { container } = renderWithProviders('/', 'intro');
    fillValidLeadForm(container);
    submitLeadForm();

    await waitFor(() => {
      expect(submitLeadMock).toHaveBeenCalledTimes(1);
    });

    const payload = submitLeadMock.mock.calls[0][0];
    expect(payload).toMatchObject({
      nome: 'Mariana Albuquerque',
      email: 'mariana@vanguarda.com.br',
      whatsapp: '11999999999',
      equipe: '6 a 15',
      consent: true,
      consentTextVersion: 'landing-demo-v1',
      purpose: 'agendamento_demonstracao',
      website: '',
    });
    expect(payload.consentMetadata).toBeUndefined();

    await waitFor(() => {
      expect(
        screen.getByText(/Recebemos seus dados\. Nossa equipe vai entrar em contato\./i),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText(/Sessão Solicitada com Sucesso/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/contato via WhatsApp/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Abrir Google Agenda/i)).not.toBeInTheDocument();
    expect(trackLeadFormSubmittedMock).toHaveBeenCalledTimes(1);

    const varBBtn = screen.getAllByRole('button', { name: /Variante B/i })[0];
    fireEvent.click(varBBtn);

    await waitFor(
      () => {
        expect(
          screen.getByText(/Multiplique a capacidade de vendas da sua equipe/i),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('deve exibir erro genérico em 4xx, preservar os dados e permitir nova tentativa', async () => {
    const { LeadSubmitError } = await import('@/features/landing/services/submitLead');
    submitLeadMock.mockRejectedValueOnce(
      new LeadSubmitError('validation', 'Não foi possível enviar seus dados. Revise as informações e tente novamente.', 400),
    );

    const { container } = renderWithProviders('/', 'intro');
    fillValidLeadForm(container);
    submitLeadForm();

    await waitFor(() => {
      expect(container.querySelector('#lead-form-alert')).toHaveTextContent(
        /Não foi possível enviar seus dados/i,
      );
    });
    expect(container.querySelector('#lead-form-alert')).toHaveAttribute('role', 'alert');
    expect(container.querySelector('#lead-form-alert')).toHaveAttribute('aria-live', 'assertive');
    expect(container.querySelector('#lead-form-alert')).toHaveTextContent(
      /tentar novamente sem perder os dados/i,
    );
    expect((container.querySelector('#lead-email') as HTMLInputElement).value).toBe(
      'mariana@vanguarda.com.br',
    );
    expect(trackLeadFormSubmittedMock).not.toHaveBeenCalled();

    submitLeadMock.mockResolvedValueOnce(undefined);
    submitLeadForm();

    await waitFor(() => {
      expect(
        screen.getByText(/Recebemos seus dados\. Nossa equipe vai entrar em contato\./i),
      ).toBeInTheDocument();
    });
    expect(trackLeadFormSubmittedMock).toHaveBeenCalledTimes(1);
  });

  it('deve exibir erro específico em 503 unavailable sem disparar telemetria de sucesso', async () => {
    const { LeadSubmitError } = await import('@/features/landing/services/submitLead');
    submitLeadMock.mockRejectedValueOnce(
      new LeadSubmitError('unavailable', 'O envio está temporariamente indisponível. Tente novamente em instantes.', 503),
    );

    const { container } = renderWithProviders('/', 'intro');
    fillValidLeadForm(container);
    submitLeadForm();

    await waitFor(() => {
      expect(container.querySelector('#lead-form-alert')).toHaveTextContent(
        /temporariamente indisponível/i,
      );
    });
    expect(screen.getByRole('button', { name: /GARANTIR MINHA DEMONSTRAÇÃO GRATUITA/i })).toBeEnabled();
    expect(trackLeadFormSubmittedMock).not.toHaveBeenCalled();
  });

  it('deve exibir erro de rede quando o envio falha por conexão', async () => {
    const { LeadSubmitError } = await import('@/features/landing/services/submitLead');
    submitLeadMock.mockRejectedValueOnce(
      new LeadSubmitError('network', 'Não foi possível conectar. Verifique sua conexão e tente novamente.'),
    );

    const { container } = renderWithProviders('/', 'intro');
    fillValidLeadForm(container);
    submitLeadForm();

    await waitFor(() => {
      expect(container.querySelector('#lead-form-alert')).toHaveTextContent(/Não foi possível conectar/i);
    });
    expect(trackLeadFormSubmittedMock).not.toHaveBeenCalled();
  });

  it('deve exibir erro de limite quando o endpoint responde 429', async () => {
    const { LeadSubmitError } = await import('@/features/landing/services/submitLead');
    submitLeadMock.mockRejectedValueOnce(
      new LeadSubmitError('rate_limit', 'Muitas tentativas. O limite é de 5 envios a cada 15 minutos. Aguarde e tente novamente.', 429),
    );

    const { container } = renderWithProviders('/', 'intro');
    fillValidLeadForm(container);
    submitLeadForm();

    await waitFor(() => {
      expect(container.querySelector('#lead-form-alert')).toHaveTextContent(/Muitas tentativas/i);
    });
    expect(trackLeadFormSubmittedMock).not.toHaveBeenCalled();
  });

  it('deve exibir erro observável quando o endpoint ainda está pendente do contrato', async () => {
    const { LeadSubmitError, LEAD_SUBMIT_USER_MESSAGES } = await import(
      '@/features/landing/services/submitLead'
    );
    submitLeadMock.mockRejectedValueOnce(
      new LeadSubmitError('endpoint_unavailable', LEAD_SUBMIT_USER_MESSAGES.endpoint_unavailable),
    );

    const { container } = renderWithProviders('/', 'intro');
    fillValidLeadForm(container);
    submitLeadForm();

    await waitFor(() => {
      expect(container.querySelector('#lead-form-alert')).toHaveTextContent(
        /envio ainda não está disponível/i,
      );
    });
    expect(screen.queryByText(/Recebemos seus dados/i)).not.toBeInTheDocument();
    expect(trackLeadFormSubmittedMock).not.toHaveBeenCalled();
  });

  it('deve mapear 400 com fields para erros nos campos e preservar os dados', async () => {
    const { LeadSubmitError } = await import('@/features/landing/services/submitLead');
    submitLeadMock.mockRejectedValueOnce(
      new LeadSubmitError(
        'validation',
        'Não foi possível enviar seus dados. Revise as informações e tente novamente.',
        400,
        { email: 'invalid' },
      ),
    );

    const { container } = renderWithProviders('/', 'intro');
    fillValidLeadForm(container);
    submitLeadForm();

    const emailError = await screen.findByText(/informe um e-mail válido/i, {
      selector: '#lead-email-error',
    });
    expect(emailError).toBeInTheDocument();
    expect((container.querySelector('#lead-email') as HTMLInputElement).value).toBe(
      'mariana@vanguarda.com.br',
    );
    expect(document.activeElement).toBe(container.querySelector('#lead-email'));
    expect(trackLeadFormSubmittedMock).not.toHaveBeenCalled();
  });

  it('deve enviar o honeypot website como string vazia e fora do fluxo de teclado', async () => {
    const { container } = renderWithProviders('/', 'intro');
    const honeypot = container.querySelector('#lead-website') as HTMLInputElement;
    expect(honeypot).toBeInTheDocument();
    expect(honeypot).toHaveAttribute('tabindex', '-1');
    expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(honeypot.value).toBe('');

    fillValidLeadForm(container);
    submitLeadForm();

    await waitFor(() => {
      expect(submitLeadMock).toHaveBeenCalledTimes(1);
    });
    expect(submitLeadMock.mock.calls[0][0].website).toBe('');
    expect(submitLeadMock.mock.calls[0][0].consent).toBe(true);
    expect(submitLeadMock.mock.calls[0][0].consentTextVersion).toBe('landing-demo-v1');
  });

  it('não deve permitir duplo envio enquanto a requisição está em andamento', async () => {
    let resolveSubmit: () => void = () => {};
    submitLeadMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    const { container } = renderWithProviders('/', 'intro');
    fillValidLeadForm(container);
    const submitBtn = submitLeadForm();

    await waitFor(() => {
      expect(submitLeadMock).toHaveBeenCalledTimes(1);
    });
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveAttribute('aria-busy', 'true');
    expect(submitBtn).toHaveTextContent(/Enviando/i);

    fireEvent.submit(submitBtn.closest('form') as HTMLFormElement);
    expect(submitLeadMock).toHaveBeenCalledTimes(1);

    resolveSubmit();
    await waitFor(() => {
      expect(
        screen.getByText(/Recebemos seus dados\. Nossa equipe vai entrar em contato\./i),
      ).toBeInTheDocument();
    });
  });
});
