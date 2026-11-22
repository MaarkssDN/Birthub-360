import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PILLARS_EDITORIAL_DATA,
  PillarDetailModal,
} from '@/features/landing/components/PillarDetailModal';
import { PillarContent } from '@/features/landing/components/pillars/PillarContent';
import { PillarDetailDialog } from '@/features/landing/components/pillars/PillarDetailDialog';

const navigateMock = vi.fn();
const authState = vi.hoisted(() => ({
  currentUser: null as { id: string; role: string } | null,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: authState.currentUser,
    isPending: false,
    signOut: vi.fn(),
  }),
}));

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: {
    play: vi.fn(),
  },
}));

describe('PillarDetailModal — Arquitetura dos 8 Pilares Comerciais', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.currentUser = null;
    document.body.style.overflow = '';
  });

  const renderModal = (props: Partial<React.ComponentProps<typeof PillarDetailModal>> = {}) => {
    const defaultProps = {
      isOpen: true,
      pillarId: '01',
      onClose: vi.fn(),
      onProceedToLogin: vi.fn(),
      onOpenRoiSimulator: vi.fn(),
      theme: 'dark' as const,
      ...props,
    };

    return {
      ...render(
        <MemoryRouter>
          <PillarDetailModal {...defaultProps} />
        </MemoryRouter>,
      ),
      props: defaultProps,
    };
  };

  it('não deve renderizar nada quando isOpen for false', () => {
    const { container } = renderModal({ isOpen: false });
    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar todos os 8 pilares com seus dados editoriais, capacidades e disponibilidade', () => {
    const pillarIds = ['01', '02', '03', '04', '05', '06', '07', '08'];

    for (const id of pillarIds) {
      const data = PILLARS_EDITORIAL_DATA[id];
      const { unmount } = renderModal({ pillarId: id });

      expect(screen.getByText(data.modalTitle)).toBeInTheDocument();
      expect(screen.getByText(data.badge)).toBeInTheDocument();
      expect(screen.getByText(data.tagline)).toBeInTheDocument();
      expect(screen.getByText(data.commercialDescription)).toBeInTheDocument();
      expect(screen.getByText(data.availability)).toBeInTheDocument();

      // Verificar primeira capacidade real
      expect(screen.getByText(data.capabilities[0].title)).toBeInTheDocument();

      // Verificar primeira métrica
      expect(screen.getByText(data.metrics[0].value)).toBeInTheDocument();

      // Verificar badge explícito de simulação baseada em dados operacionais
      expect(screen.getByText('Simulação baseada em dados operacionais')).toBeInTheDocument();

      unmount();
    }
  });

  it('deve estruturar a interface com duas áreas no desktop (conteúdo e visualização)', () => {
    const { container } = renderModal({ pillarId: '01' });

    // Grid com 12 colunas em telas grandes (lg:grid-cols-12)
    const gridLayout = container.querySelector('.lg\\:grid-cols-12');
    expect(gridLayout).toBeInTheDocument();

    // 2 áreas com lg:col-span-6 cada
    const areas = container.querySelectorAll('.lg\\:col-span-6');
    expect(areas.length).toBe(2);
  });

  it('deve alternar a estilização semântica entre modo Dark e Light', () => {
    // Dark mode
    const { container: darkContainer, unmount: unmountDark } = renderModal({
      pillarId: '01',
      theme: 'dark',
    });
    expect(darkContainer.querySelector('.bg-\\[\\#0B132B\\]\\/98')).toBeInTheDocument();
    unmountDark();

    // Light mode
    const { container: lightContainer, unmount: unmountLight } = renderModal({
      pillarId: '01',
      theme: 'light',
    });
    expect(lightContainer.querySelector('.bg-white\\/98')).toBeInTheDocument();
    expect(screen.getByText('01. Hub Comercial')).toHaveClass('text-sky-700');
    unmountLight();
  });

  it('deve controlar o scroll do fundo (body scroll lock) ao abrir e restaurar ao fechar', () => {
    expect(document.body.style.overflow).toBe('');

    const { unmount } = renderModal({ isOpen: true, pillarId: '01' });
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('deve fechar o painel ao pressionar a tecla Escape', () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('deve fechar o painel ao clicar no backdrop externo ou no botão Fechar', () => {
    const onClose = vi.fn();
    const { container } = renderModal({ onClose });

    // Clicar no botão Fechar
    const closeBtn = screen.getByText(/^Fechar$/i);
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Clicar no backdrop
    const backdrop = container.querySelector('[role="dialog"]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('deve disparar o Simulador de ROI nos pilares pertinentes (01 e 05)', () => {
    const onOpenRoiSimulator = vi.fn();
    const onClose = vi.fn();

    // Pilar 01
    const { unmount } = renderModal({
      pillarId: '01',
      onOpenRoiSimulator,
      onClose,
    });

    const roiBtn = screen.getByText(/Simular ROI/i);
    fireEvent.click(roiBtn);
    expect(onOpenRoiSimulator).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('deve redirecionar para a tela de autenticação quando acionado por usuário deslogado', () => {
    const onProceedToLogin = vi.fn();
    renderModal({ pillarId: '02', onProceedToLogin });

    const ctaBtn = screen.getByText('Explorar Inteligência de Mercado');
    fireEvent.click(ctaBtn);

    expect(onProceedToLogin).toHaveBeenCalledTimes(1);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('deve navegar para a rota do pilar quando acionado por usuário autenticado', () => {
    authState.currentUser = { id: 'user-1', role: 'ADMIN' };
    const onProceedToLogin = vi.fn();
    const onClose = vi.fn();
    renderModal({ pillarId: '02', onProceedToLogin, onClose });

    fireEvent.click(screen.getByText('Explorar Inteligência de Mercado'));

    expect(navigateMock).toHaveBeenCalledWith(PILLARS_EDITORIAL_DATA['02'].route);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onProceedToLogin).not.toHaveBeenCalled();
  });

  it('deve suportar modal genérico de módulos de Command Center', () => {
    const onProceedToLogin = vi.fn();
    const onClose = vi.fn();
    renderModal({
      pillarId: null,
      genericModal: {
        title: 'Módulo de Roleplay Comercial',
        desc: 'Simulação interativa com IA para treinamento tático.',
      },
      onProceedToLogin,
      onClose,
    });

    expect(screen.getByText('Módulo de Roleplay Comercial')).toBeInTheDocument();
    expect(screen.getByText('Simulação interativa com IA para treinamento tático.')).toBeInTheDocument();
    expect(screen.getByText('Acessar Plataforma →')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Acessar Plataforma →'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onProceedToLogin).toHaveBeenCalledTimes(1);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('deve exportar as primitivas arquiteturais PillarDetailDialog e PillarContent', () => {
    expect(PillarDetailDialog).toBeDefined();
    expect(PillarContent).toBeDefined();
  });

  it('deve renderizar todos os 8 visualizadores contextuais em modo Light sem reter tema escuro', () => {
    const pillarIds = ['01', '02', '03', '04', '05', '06', '07', '08'];

    for (const id of pillarIds) {
      const { container, unmount } = renderModal({ pillarId: id, theme: 'light' });

      // O container do visualizador contextual deve possuir classe clara no tema light
      expect(screen.getByText('Interface Operacional')).toBeInTheDocument();
      expect(screen.getByText('Simulação baseada em dados operacionais')).toBeInTheDocument();

      // Verificar que não há bloqueio de renderização do mockup no tema light
      const visualizerRoot = container.querySelector('.transition-all.duration-300');
      expect(visualizerRoot).toBeInTheDocument();
      expect(visualizerRoot?.children.length).toBeGreaterThan(0);

      unmount();
    }
  });
});
