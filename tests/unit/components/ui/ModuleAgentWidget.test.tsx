import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModuleAgentWidget } from '../../../../src/components/ui/ModuleAgentWidget.js';

// Mock do useAuth
vi.mock('../../../../src/contexts/AuthContext.js', () => ({
  useAuth: () => ({
    currentUser: { id: 'usr-1', role: 'ADMIN', organizationId: 'org-test' },
    isAdmin: true,
    canAccessCommercialIntelligence: true,
    canAccessCopilotoIa: true,
  }),
}));

// Mock do SoundFX
vi.mock('../../../../src/lib/soundEffects.js', () => ({
  SoundFX: { play: vi.fn() },
}));

describe('ModuleAgentWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o personagem Orbit no Pilar 01 (CRM) com avatar local', () => {
    render(<ModuleAgentWidget activeTab="crm" />);

    expect(screen.getByText('Orbit')).toBeDefined();
    expect(screen.getByText('Guardião do CRM')).toBeDefined();
    // Garante que a orientação fictícia de voz foi removida
    expect(screen.queryByText(/Diga "Ei Orbit"/i)).toBeNull();

    // Valida uso de SVG local e acessibilidade do avatar
    const avatar = screen.getByAltText(
      'Orbit, agente guardião do CRM e da integridade de pipeline',
    );
    expect(avatar).toBeDefined();
    expect(avatar.getAttribute('src')).toBe('/brand/characters/orbit.svg');
  });

  it('renderiza o personagem Nexus no Pilar 02 (Prospecção)', () => {
    render(<ModuleAgentWidget activeTab="prospect" />);

    expect(screen.getByText('Nexus')).toBeDefined();
    expect(screen.getByText('Analista de Dados')).toBeDefined();
  });

  it('abre o card expandido ao clicar no avatar e renderiza a área de comando', () => {
    render(<ModuleAgentWidget activeTab="crm" />);

    const openBtn = screen.getByRole('button', { name: /Abrir copiloto Orbit/i });
    expect(openBtn).toBeDefined();

    fireEvent.click(openBtn);

    // Card expandido com acessibilidade de formulário
    expect(screen.getByPlaceholderText(/Pergunte ao Orbit sobre este módulo.../i)).toBeDefined();
    expect(screen.getByRole('textbox', { name: /Mensagem ou instrução para o copiloto Orbit/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Fechar painel do copiloto/i })).toBeDefined();
  });

  it('não quebra nem renderiza nada para abas não mapeadas', () => {
    const { container } = render(<ModuleAgentWidget activeTab={'aba-inexistente' as any} />);
    expect(container.firstChild).toBeNull();
  });
});
