import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const updateUserMock = vi.fn();
const changePasswordMock = vi.fn();
const refetchSessionMock = vi.fn();
const soundPlayMock = vi.fn();

const currentUser = {
  id: 'user-1',
  name: 'Maria Silva',
  email: 'maria@empresa.com',
  role: 'SDR',
  image: 'https://cdn.exemplo.com/foto-antiga.png',
};

vi.mock('../../../../src/contexts/AuthContext.js', () => ({
  useAuth: () => ({ currentUser, isAdmin: false }),
}));

vi.mock('../../../../src/contexts/ThemeContext.js', () => ({
  useTheme: () => ({ theme: 'dark', setThemeMode: vi.fn() }),
}));

vi.mock('../../../../src/i18n/index.js', () => ({
  useI18n: () => ({ locale: 'pt-BR', setLocale: vi.fn() }),
}));

vi.mock('../../../../src/lib/auth-client.js', () => ({
  authClient: {
    updateUser: (...args: unknown[]) => updateUserMock(...args),
    changePassword: (...args: unknown[]) => changePasswordMock(...args),
    useSession: () => ({ refetch: refetchSessionMock }),
  },
}));

vi.mock('../../../../src/lib/soundEffects.js', () => ({
  SoundFX: { play: (...args: unknown[]) => soundPlayMock(...args) },
}));

// Painéis pesados das outras abas — o teste cobre apenas a aba Perfil (default).
vi.mock('../../../../src/features/team/components/Team.js', () => ({ Team: () => null }));
vi.mock('../../../../src/features/integrations/components/Integrations.js', () => ({
  Integrations: () => null,
}));
vi.mock('../../../../src/features/feature-flags/components/FeatureFlagsPanel.js', () => ({
  FeatureFlagsPanel: () => null,
}));
vi.mock('../../../../src/features/lgpd/components/AuditLogs.js', () => ({
  AuditLogs: () => null,
}));
vi.mock('../../../../src/features/lgpd/components/DataSubjectRights.js', () => ({
  DataSubjectRights: () => null,
}));
vi.mock('../../../../src/features/settings/components/LearningProfilePanel.js', () => ({
  LearningProfilePanel: () => null,
}));
vi.mock('../../../../src/features/settings/components/MemoryGovernancePanel.js', () => ({
  MemoryGovernancePanel: () => null,
}));
vi.mock('../../../../src/features/settings/components/MultiRegionFailoverPanel.js', () => ({
  MultiRegionFailoverPanel: () => null,
}));
vi.mock('../../../../src/features/settings/components/LeadDedupPanel.js', () => ({
  LeadDedupPanel: () => null,
}));
vi.mock('../../../../src/features/settings/components/CompanyDedupPanel.js', () => ({
  CompanyDedupPanel: () => null,
}));

import { Settings } from '../../../../src/features/settings/components/Settings.js';

function profileForm() {
  const input = screen.getByLabelText('Nome de exibição');
  const form = input.closest('form');
  if (!form) throw new Error('formulário de perfil não encontrado');
  return form;
}

function passwordForm() {
  const input = screen.getByLabelText('Senha atual');
  const form = input.closest('form');
  if (!form) throw new Error('formulário de senha não encontrado');
  return form;
}

describe('Settings — aba Perfil (UX-09)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateUserMock.mockResolvedValue({ data: { user: currentUser }, error: null });
    changePasswordMock.mockResolvedValue({ data: {}, error: null });
    refetchSessionMock.mockResolvedValue(undefined);
  });

  it('renderiza nome, e-mail, papel e avatar da sessão', () => {
    render(<Settings />);
    expect(screen.getByLabelText('Nome de exibição')).toHaveValue('Maria Silva');
    expect(screen.getByText('maria@empresa.com')).toBeInTheDocument();
    expect(screen.getByText('SDR')).toBeInTheDocument();
    expect(screen.getByAltText('')).toHaveAttribute(
      'src',
      'https://cdn.exemplo.com/foto-antiga.png',
    );
  });

  it('salva nome alterado via authClient.updateUser e refaz a sessão', async () => {
    render(<Settings />);
    fireEvent.change(screen.getByLabelText('Nome de exibição'), {
      target: { value: '  Maria Souza  ' },
    });
    fireEvent.submit(profileForm());

    await waitFor(() =>
      expect(updateUserMock).toHaveBeenCalledWith({ name: 'Maria Souza' }),
    );
    // Imagem inalterada → não entra no payload (não pode apagar o avatar por acidente).
    expect(updateUserMock.mock.calls[0][0]).not.toHaveProperty('image');
    expect(refetchSessionMock).toHaveBeenCalled();
    expect(await screen.findByText('Perfil atualizado com sucesso!')).toBeInTheDocument();
    expect(soundPlayMock).toHaveBeenCalledWith('success');
  });

  it('envia image quando a URL do avatar muda e null quando é removida', async () => {
    render(<Settings />);
    fireEvent.change(screen.getByLabelText('Foto de perfil (URL)'), {
      target: { value: 'https://cdn.exemplo.com/nova-foto.png' },
    });
    fireEvent.submit(profileForm());
    await waitFor(() =>
      expect(updateUserMock).toHaveBeenCalledWith({
        name: 'Maria Silva',
        image: 'https://cdn.exemplo.com/nova-foto.png',
      }),
    );

    updateUserMock.mockClear();
    fireEvent.change(screen.getByLabelText('Foto de perfil (URL)'), {
      target: { value: '' },
    });
    fireEvent.submit(profileForm());
    await waitFor(() =>
      expect(updateUserMock).toHaveBeenCalledWith({ name: 'Maria Silva', image: null }),
    );
  });

  it('rejeita nome em branco sem chamar o backend', async () => {
    render(<Settings />);
    fireEvent.change(screen.getByLabelText('Nome de exibição'), { target: { value: '   ' } });
    fireEvent.submit(profileForm());
    expect(
      await screen.findByText('O nome não pode estar em branco.'),
    ).toBeInTheDocument();
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it('exibe erro do backend quando updateUser falha', async () => {
    updateUserMock.mockResolvedValue({
      data: null,
      error: { message: 'Nome já está em uso.' },
    });
    render(<Settings />);
    fireEvent.change(screen.getByLabelText('Nome de exibição'), {
      target: { value: 'Outro Nome' },
    });
    fireEvent.submit(profileForm());
    expect(await screen.findByText('Nome já está em uso.')).toBeInTheDocument();
    expect(refetchSessionMock).not.toHaveBeenCalled();
  });

  it('valida senha: confirmação divergente e tamanho mínimo', async () => {
    render(<Settings />);
    fireEvent.change(screen.getByLabelText('Senha atual'), { target: { value: 'atual123' } });
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'curta' } });
    fireEvent.change(screen.getByLabelText('Confirmar nova senha'), {
      target: { value: 'curta' },
    });
    fireEvent.submit(passwordForm());
    expect(
      await screen.findByText('A nova senha deve ter no mínimo 8 caracteres.'),
    ).toBeInTheDocument();
    expect(changePasswordMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Nova senha'), {
      target: { value: 'senha-nova-123' },
    });
    fireEvent.change(screen.getByLabelText('Confirmar nova senha'), {
      target: { value: 'senha-diferente' },
    });
    fireEvent.submit(passwordForm());
    expect(
      await screen.findByText('A confirmação de nova senha não confere.'),
    ).toBeInTheDocument();
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it('troca a senha via authClient.changePassword e limpa os campos', async () => {
    render(<Settings />);
    fireEvent.change(screen.getByLabelText('Senha atual'), { target: { value: 'atual123' } });
    fireEvent.change(screen.getByLabelText('Nova senha'), {
      target: { value: 'senha-nova-123' },
    });
    fireEvent.change(screen.getByLabelText('Confirmar nova senha'), {
      target: { value: 'senha-nova-123' },
    });
    fireEvent.submit(passwordForm());

    await waitFor(() =>
      expect(changePasswordMock).toHaveBeenCalledWith({
        currentPassword: 'atual123',
        newPassword: 'senha-nova-123',
        revokeOtherSessions: false,
      }),
    );
    expect(await screen.findByText('Senha alterada com sucesso!')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha atual')).toHaveValue('');
    expect(screen.getByLabelText('Nova senha')).toHaveValue('');
    expect(screen.getByLabelText('Confirmar nova senha')).toHaveValue('');
  });

  it('exibe erro do backend quando changePassword falha', async () => {
    changePasswordMock.mockResolvedValue({
      data: null,
      error: { message: 'Senha atual incorreta.' },
    });
    render(<Settings />);
    fireEvent.change(screen.getByLabelText('Senha atual'), { target: { value: 'errada' } });
    fireEvent.change(screen.getByLabelText('Nova senha'), {
      target: { value: 'senha-nova-123' },
    });
    fireEvent.change(screen.getByLabelText('Confirmar nova senha'), {
      target: { value: 'senha-nova-123' },
    });
    fireEvent.submit(passwordForm());
    expect(await screen.findByText('Senha atual incorreta.')).toBeInTheDocument();
  });
});
