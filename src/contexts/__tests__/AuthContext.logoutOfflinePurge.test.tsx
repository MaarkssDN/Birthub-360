/**
 * Regressão EXP-03 (handoff onda-forense-20261020/00-para-09-forense):
 * o logout deve expurgar a fila offline criptografada antes do redirect,
 * impedindo que dados de um usuário persistam no dispositivo para o próximo.
 *
 * Este arquivo cobre o WIRED do logout (AuthContext -> offlineSyncService.clearQueue).
 * A prova de que clearQueue remove as chaves `birthhub_offline_sync_queue_v1` e
 * `birthhub_offline_id_mappings_v1` do storage criptografado está em
 * src/features/mobile/__tests__/offlineLogoutPurge.test.ts.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const clearQueueMock = vi.fn().mockResolvedValue(undefined);
const signOutMock = vi.fn().mockResolvedValue({});

vi.mock('../../lib/auth-client.js', () => ({
  authClient: {
    useSession: () => ({
      data: {
        user: {
          id: 'user_1',
          name: 'Usuário Um',
          email: 'um@birthhub360.com',
          role: 'ADMIN',
        },
      },
      isPending: false,
    }),
    signOut: (...args: unknown[]) => signOutMock(...args),
  },
}));

vi.mock('../../features/mobile/offlineSync.service.js', () => ({
  offlineSyncService: {
    clearQueue: (...args: unknown[]) => clearQueueMock(...args),
  },
}));

import { AuthProvider, useAuth } from '../AuthContext.js';

const originalLocation = window.location;
let hrefSet: string[];
let eventOrder: string[];

function LogoutButton() {
  const { logout } = useAuth();
  return <button onClick={() => void logout()}>sair</button>;
}

beforeEach(() => {
  // mockReset (não só mockClear): implementações pendentes/rejeitadas de um
  // teste não podem vazar para o próximo.
  clearQueueMock.mockReset();
  clearQueueMock.mockResolvedValue(undefined);
  signOutMock.mockReset();
  signOutMock.mockResolvedValue({});
  hrefSet = [];
  eventOrder = [];
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      ...originalLocation,
      get href() {
        return hrefSet.at(-1) ?? 'http://localhost/';
      },
      set href(v: string) {
        hrefSet.push(v);
        eventOrder.push('redirect');
      },
    },
  });
});

afterEach(() => {
  cleanup();
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  vi.clearAllMocks();
});

describe('AuthContext.logout — expurgo da fila offline (EXP-03)', () => {
  it('chama offlineSyncService.clearQueue() antes do redirect para /login', async () => {
    clearQueueMock.mockImplementation(async () => {
      eventOrder.push('clearQueue');
    });

    render(
      <AuthProvider>
        <LogoutButton />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'sair' }));

    await waitFor(() => expect(hrefSet).toContain('/login'));

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(clearQueueMock).toHaveBeenCalledTimes(1);
    // Expurgo deve ocorrer ANTES do redirect — senão a navegação pode abortar a limpeza.
    expect(eventOrder.indexOf('clearQueue')).toBeLessThan(eventOrder.indexOf('redirect'));
  });

  it('redireciona para /login mesmo se clearQueue nunca resolver (timeout de 3s — ressalva 24)', async () => {
    // Simula o cenário apontado pelo Agente 24: `clearQueue()` trava em
    // `await this.ready` (IndexedDB/crypto indisponível). O logout NÃO pode
    // ficar pendurado — o redirect deve ocorrer após o timeout interno.
    clearQueueMock.mockImplementation(() => new Promise<void>(() => {}));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <AuthProvider>
        <LogoutButton />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'sair' }));

    // Timeout interno é 3000ms; margem para o waitFor.
    await waitFor(() => expect(hrefSet).toContain('/login'), { timeout: 8000 });
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Expurgo da fila offline excedeu 3s'),
    );
    warnSpy.mockRestore();
  });

  it('ainda redireciona para /login se clearQueue falhar (best-effort)', async () => {
    clearQueueMock.mockRejectedValue(new Error('storage indisponível'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AuthProvider>
        <LogoutButton />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'sair' }));

    await waitFor(() => expect(hrefSet).toContain('/login'));
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
