/**
 * Testes unitários para SyncIndicator e OfflineBadge (Shell Mobile e Shell Web).
 * Cobre estados Online, Offline, Sincronizando e transição via navigator.onLine.
 * Ver .agents/handoffs/onda-15/09-para-02-shell-mobile-offline.md.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup, act, waitFor } from '@testing-library/react';
import { SyncIndicator, OfflineBadge, dispatchSyncStatus } from '@/components/layout/SyncIndicator.js';

import { offlineSyncService } from '@/features/mobile/offlineSync.service.js';

function setNavigatorOnLine(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  });
}

describe('SyncIndicator & OfflineBadge', () => {
  beforeEach(() => {
    setNavigatorOnLine(true);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    setNavigatorOnLine(true);
  });

  it('renderiza o estado Online por padrão quando conectado', () => {
    render(<SyncIndicator />);
    expect(screen.getByText(/Online/i)).toBeInTheDocument();
  });

  it('transiciona para o estado Offline ao disparar evento offline', async () => {
    render(<SyncIndicator />);

    act(() => {
      setNavigatorOnLine(false);
      window.dispatchEvent(new Event('offline'));
    });

    await waitFor(() => {
      expect(screen.getByText(/Offline/i)).toBeInTheDocument();
    });
  });

  it('OfflineBadge não renderiza nada quando Online e surge quando Offline', async () => {
    const { container } = render(<OfflineBadge />);
    expect(container.firstChild).toBeNull();

    act(() => {
      setNavigatorOnLine(false);
      window.dispatchEvent(new Event('offline'));
    });

    await waitFor(() => {
      expect(screen.getByText(/Offline/i)).toBeInTheDocument();
    });
  });

  it('transiciona para Sincronizando ao reconectar e finaliza em Online', async () => {
    let completeSync!: () => void;
    const pendingSync = new Promise<void>((resolve) => {
      completeSync = resolve;
    });
    const sync = vi.spyOn(offlineSyncService, 'sync').mockReturnValue(pendingSync as never);
    const syncQueue = vi.spyOn(offlineSyncService, 'syncQueue').mockReturnValue(pendingSync as never);
    render(<SyncIndicator />);

    // Simula desconexão
    act(() => {
      setNavigatorOnLine(false);
      window.dispatchEvent(new Event('offline'));
    });

    await waitFor(() => {
      expect(screen.getByText(/Offline/i)).toBeInTheDocument();
    });

    // Simula reconexão
    act(() => {
      setNavigatorOnLine(true);
      window.dispatchEvent(new Event('online'));
    });

    // Deve entrar em Sincronizando
    await waitFor(() => {
      expect(screen.getByText(/Sincronizando/i)).toBeInTheDocument();
    });

    expect(sync).toHaveBeenCalled();
    await act(async () => {
      completeSync();
      await pendingSync;
    });

    // Online somente após a sincronização pendente terminar
    await waitFor(
      () => {
        expect(screen.getByText(/Online/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('atualiza reativamente via dispatchSyncStatus', async () => {
    render(<SyncIndicator />);

    act(() => {
      dispatchSyncStatus({ status: 'syncing', pendingCount: 5 });
    });

    await waitFor(() => {
      expect(screen.getByText(/Sincronizando/i)).toBeInTheDocument();
    });
  });
});
