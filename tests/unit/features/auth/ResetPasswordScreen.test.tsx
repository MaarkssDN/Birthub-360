import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const resetPasswordMock = vi.fn(async () => ({ data: { status: true } }));
const playMock = vi.fn();

vi.mock('@/lib/soundEffects', () => ({ SoundFX: { play: (...a: unknown[]) => playMock(...a) } }));
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));
vi.mock('@/contexts/BrandContext', () => ({
  useBrand: () => ({ brandInfo: { slogan: 'Slogan teste' } }),
}));
vi.mock('@/lib/auth-client', () => ({
  authClient: { resetPassword: (...a: unknown[]) => resetPasswordMock(...a) },
}));

import { ResetPasswordScreen } from '@/features/auth/components/ResetPasswordScreen';

function renderScreen(entry = '/reset-password?token=tok-123') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordScreen />} />
        <Route path="/login" element={<p data-testid="login-page">login</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  resetPasswordMock.mockClear();
  playMock.mockClear();
});

afterEach(cleanup);

describe('ResetPasswordScreen', () => {
  it('mostra link inválido quando não há token', () => {
    renderScreen('/reset-password');
    expect(screen.getByText(/link de redefinição de senha é inválido/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Voltar para o login/ })).toBeTruthy();
  });

  it('mostra link inválido quando a URL traz error', () => {
    renderScreen('/reset-password?error=INVALID_TOKEN');
    expect(screen.getByText(/link de redefinição de senha é inválido/)).toBeTruthy();
  });

  it('renderiza o formulário com token válido e mede a força da senha', () => {
    renderScreen();
    const input = screen.getByLabelText('Nova Senha');
    fireEvent.change(input, { target: { value: 'curta' } });
    expect(screen.getByText('Senha Fraca')).toBeTruthy();
    fireEvent.change(input, { target: { value: 'SenhaForte123!' } });
    expect(screen.getByText('Senha Forte')).toBeTruthy();
  });

  it('alterna visibilidade dos campos de senha', () => {
    renderScreen();
    const newPwd = screen.getByLabelText('Nova Senha');
    const confirm = screen.getByLabelText('Confirmar Nova Senha');
    expect(newPwd.getAttribute('type')).toBe('password');
    fireEvent.click(screen.getByLabelText('Mostrar ou ocultar senha'));
    expect(newPwd.getAttribute('type')).toBe('text');
    fireEvent.click(screen.getByLabelText('Mostrar ou ocultar confirmação de senha'));
    expect(confirm.getAttribute('type')).toBe('text');
    expect(playMock).toHaveBeenCalledWith('click');
  });

  it('rejeita senhas divergentes sem chamar a API', async () => {
    renderScreen();
    fireEvent.change(screen.getByLabelText('Nova Senha'), { target: { value: 'SenhaForte123!' } });
    fireEvent.change(screen.getByLabelText('Confirmar Nova Senha'), { target: { value: 'OutraSenha456!' } });
    fireEvent.click(screen.getByRole('button', { name: /Redefinir Senha/ }));
    expect(await screen.findByText('As senhas não coincidem.')).toBeTruthy();
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it('redefine a senha com sucesso e oferece navegação para login', async () => {
    renderScreen();
    fireEvent.change(screen.getByLabelText('Nova Senha'), { target: { value: 'SenhaForte123!' } });
    fireEvent.change(screen.getByLabelText('Confirmar Nova Senha'), { target: { value: 'SenhaForte123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Redefinir Senha/ }));

    await waitFor(() => expect(resetPasswordMock).toHaveBeenCalledWith({
      newPassword: 'SenhaForte123!',
      token: 'tok-123',
    }));
    expect(await screen.findByText(/Senha redefinida com sucesso/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Ir para o login/ }));
    expect(await screen.findByTestId('login-page')).toBeTruthy();
  });

  it('exibe erro da API quando o reset falha', async () => {
    resetPasswordMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Token expirado' },
    } as never);
    renderScreen();
    fireEvent.change(screen.getByLabelText('Nova Senha'), { target: { value: 'SenhaForte123!' } });
    fireEvent.change(screen.getByLabelText('Confirmar Nova Senha'), { target: { value: 'SenhaForte123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Redefinir Senha/ }));
    expect(await screen.findByText('Token expirado')).toBeTruthy();
  });
});
