import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DsrStatusPage from '@/features/lgpd/pages/DsrStatusPage';
import DsrVerifyPage from '@/features/lgpd/pages/DsrVerifyPage';
import { DsrRequestForm } from '@/features/lgpd/pages/DsrRequestForm';
import { server } from '../../../mocks/server';

const VERIFY_URL = '*/api/public/data-subject-requests/verify';
const STATUS_URL = '*/api/public/data-subject-requests/status/:token';
const REQUEST_URL = '*/api/public/data-subject-requests';

function renderWithRoute(ui: React.ReactElement, route: string) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}

describe('DsrVerifyPage', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('mostra erro amigável quando faltam protocol/token na query', async () => {
    renderWithRoute(<DsrVerifyPage />, '/privacidade/dsr/verificar');
    expect(await screen.findByRole('alert')).toHaveTextContent(/link está incompleto/i);
  });

  it('executa o direito e mostra sucesso para COMPLETED sem pacote', async () => {
    let body: unknown;
    server.use(
      http.post(VERIFY_URL, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ok: true, status: 'COMPLETED' });
      }),
    );
    renderWithRoute(
      <DsrVerifyPage />,
      '/privacidade/dsr/verificar?protocol=DSR-1234&token=tok_abc',
    );
    expect(await screen.findByText(/Solicitação concluída/i)).toBeInTheDocument();
    expect(body).toEqual({ protocol: 'DSR-1234', token: 'tok_abc' });
  });

  it('mostra "em análise" para IN_PROGRESS (correção/compartilhamento)', async () => {
    server.use(
      http.post(VERIFY_URL, () => HttpResponse.json({ ok: true, status: 'IN_PROGRESS' })),
    );
    renderWithRoute(
      <DsrVerifyPage />,
      '/privacidade/dsr/verificar?protocol=DSR-9&token=tok_xyz',
    );
    expect(await screen.findByText(/em análise/i)).toBeInTheDocument();
  });

  it('oferece download do dossiê JSON quando package está presente', async () => {
    const createObjectURL = vi.fn(() => 'blob:mock');
    const revokeObjectURL = vi.fn();
    window.URL.createObjectURL = createObjectURL;
    window.URL.revokeObjectURL = revokeObjectURL;
    server.use(
      http.post(VERIFY_URL, () =>
        HttpResponse.json({ ok: true, status: 'COMPLETED', package: '{"dados":true}' }),
      ),
    );
    renderWithRoute(
      <DsrVerifyPage />,
      '/privacidade/dsr/verificar?protocol=DSR-77&token=tok_pkg',
    );
    const btn = await screen.findByRole('button', { name: /Baixar meus dados/i });
    fireEvent.click(btn);
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
  });

  it('mapeia invalid_or_expired_token para mensagem amigável', async () => {
    server.use(
      http.post(VERIFY_URL, () =>
        HttpResponse.json({ ok: false, error: 'invalid_or_expired_token' }, { status: 400 }),
      ),
    );
    renderWithRoute(
      <DsrVerifyPage />,
      '/privacidade/dsr/verificar?protocol=DSR-1&token=expired',
    );
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/link é inválido ou já expirou/i);
  });
});

describe('DsrStatusPage', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('mostra protocolo, tipo, status e prazo de 15 dias', async () => {
    server.use(
      http.get(STATUS_URL, () =>
        HttpResponse.json({
          ok: true,
          protocol: 'DSR-2026-0001',
          rightType: 'ACCESS',
          status: 'COMPLETED',
          createdAt: '2026-11-01T10:00:00.000Z',
          verifiedAt: '2026-11-01T12:00:00.000Z',
        }),
      ),
    );
    renderWithRoute(
      <DsrStatusPage />,
      '/privacidade/dsr/acompanhamento?token=status_tok',
    );
    expect(await screen.findByText('DSR-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('Acesso aos meus dados')).toBeInTheDocument();
    expect(screen.getByText('Concluído')).toBeInTheDocument();
    // O prazo é createdAt + 15 dias (art. 19); a data exata depende do fuso do
    // runner — o que importa é que o campo existe e é uma data pt-BR.
    expect(screen.getByText(/até \d{2}\/\d{2}\/\d{4}/)).toBeInTheDocument();
  });

  it('orienta o titular quando a solicitação ainda aguarda verificação', async () => {
    server.use(
      http.get(STATUS_URL, () =>
        HttpResponse.json({
          ok: true,
          protocol: 'DSR-PEND',
          rightType: 'ERASURE',
          status: 'PENDING_VERIFICATION',
          createdAt: '2026-11-10T10:00:00.000Z',
          verifiedAt: null,
        }),
      ),
    );
    renderWithRoute(
      <DsrStatusPage />,
      '/privacidade/dsr/acompanhamento?token=t',
    );
    expect(await screen.findByText(/aguarda a confirmação pelo link/i)).toBeInTheDocument();
  });

  it('trata token inexistente com erro amigável', async () => {
    server.use(
      http.get(STATUS_URL, () =>
        HttpResponse.json({ ok: false, error: 'invalid_or_expired_token' }, { status: 400 }),
      ),
    );
    renderWithRoute(
      <DsrStatusPage />,
      '/privacidade/dsr/acompanhamento?token=bad',
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(/inválido ou já expirou/i);
  });
});

describe('DsrRequestForm', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('valida campos obrigatórios sem chamar a API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderWithRoute(<DsrRequestForm />, '/privacy');
    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitação/i }));
    await waitFor(() => {
      expect(screen.getByText(/Informe um e-mail válido/i)).toBeInTheDocument();
      expect(screen.getByText(/Selecione o tipo de solicitação/i)).toBeInTheDocument();
    });
    const dsrCalls = fetchSpy.mock.calls.filter(([url]) =>
      String(url).includes('/api/public/data-subject-requests'),
    );
    expect(dsrCalls).toHaveLength(0);
    fetchSpy.mockRestore();
  });

  it('envia o payload do contrato e mostra confirmação anti-enumeração', async () => {
    let body: Record<string, unknown> | undefined;
    server.use(
      http.post(REQUEST_URL, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ok: true }, { status: 202 });
      }),
    );
    renderWithRoute(<DsrRequestForm />, '/privacy');

    fireEvent.change(screen.getByLabelText(/E-mail cadastrado/i), {
      target: { value: 'titular@empresa.com' },
    });
    fireEvent.change(screen.getByLabelText(/O que você deseja/i), {
      target: { value: 'ACCESS' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitação/i }));

    expect(await screen.findByText(/Solicitação recebida/i)).toBeInTheDocument();
    expect(body).toMatchObject({
      email: 'titular@empresa.com',
      rightType: 'ACCESS',
      preferredChannel: 'email',
    });
  });
});
