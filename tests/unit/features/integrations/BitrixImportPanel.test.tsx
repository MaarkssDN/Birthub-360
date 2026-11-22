// @vitest-environment jsdom

/**
 * Cobre `BitrixImportPanel.tsx` após a decomposição da TAREFA-SANEAMENTO-004
 * (BT360-DT-0030): container + componentes em `components/bitrixImport/`.
 * Garante não-regressão do fluxo principal — listagem de negócios, seleção,
 * importação em lote (sucesso e falha) e erro de carga.
 */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getMock = vi.fn();
const postMock = vi.fn();
const putMock = vi.fn();

// Papel mutável para cobrir tanto o caminho ADMIN/GESTOR (pode filtrar por
// vendedor) quanto o de vendedor comum ("Exclusivo do Seu Usuário").
let authRole = 'ADMIN';

vi.mock('../../../../src/lib/api.js', () => ({
  api: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args),
    put: (...args: unknown[]) => putMock(...args),
  },
  invalidateInFlightGetCache: vi.fn(),
}));

vi.mock('../../../../src/contexts/AuthContext.js', () => ({
  useAuth: () => ({ currentUser: { role: authRole } }),
}));

import { BitrixImportPanel } from '../../../../src/features/integrations/components/BitrixImportPanel.js';

const CONNECTION_ID = 'conn-1';

const DEAL = {
  id: 'deal-1',
  title: 'Oportunidade Atlas',
  stageLabel: 'Proposta',
  assignedById: null,
  dateCreate: '2026-11-01T10:00:00.000Z',
  opportunity: '15000',
  alreadyImported: false,
};

function mockGetRoutes(overrides: Record<string, unknown> = {}) {
  getMock.mockImplementation((url: string) => {
    if (url.includes('/api/bitrix/deal-pipelines')) return Promise.resolve([]);
    if (url.includes('/api/bitrix/users')) return Promise.resolve([]);
    if (url.includes('/api/bitrix/fields')) return Promise.resolve([]);
    if (url.includes('/api/bitrix/deals')) {
      return Promise.resolve({
        data: { deals: [DEAL], next: null, total: 1 },
        meta: { restricted: false },
      });
    }
    if (url in overrides) return Promise.resolve(overrides[url]);
    return Promise.reject(new Error(`rota não mockada: ${url}`));
  });
}

beforeEach(() => {
  getMock.mockReset();
  postMock.mockReset();
  putMock.mockReset();
  authRole = 'ADMIN';
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('BitrixImportPanel (pós-decomposição TAREFA-SANEAMENTO-004)', () => {
  it('lista negócios do Bitrix e permite selecionar para importação', async () => {
    mockGetRoutes();
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);

    expect(await screen.findByText('Oportunidade Atlas')).toBeTruthy();
    expect(screen.getByText('Importador Inteligente Bitrix24')).toBeTruthy();

    fireEvent.click(screen.getByRole('checkbox'));
    expect(await screen.findByText('1 selecionado(s)')).toBeTruthy();
    expect(screen.getByText(/Total Selecionado: R\$ 15\.000/)).toBeTruthy();
  });

  it('importa selecionados com sucesso e exibe o resultado', async () => {
    mockGetRoutes();
    postMock.mockResolvedValue({
      imported: 1,
      skipped: 0,
      skippedConflicts: 0,
      skippedNotOwned: 0,
      failed: 0,
      importedLeadIds: [],
    });
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);

    fireEvent.click(await screen.findByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Importar \(1\)/ }));

    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith(
        '/api/bitrix/deals/import',
        { connectionId: CONNECTION_ID, bitrixDealIds: ['deal-1'] },
        { timeoutMs: 90_000 },
      ),
    );
    expect(await screen.findByText(/1 registro\(s\) importado\(s\) com sucesso/)).toBeTruthy();
  });

  it('exibe erro explícito quando a importação falha', async () => {
    mockGetRoutes();
    postMock.mockRejectedValue(new Error('Bitrix indisponível'));
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);

    fireEvent.click(await screen.findByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Importar \(1\)/ }));

    expect(await screen.findByText('Bitrix indisponível')).toBeTruthy();
  });

  it('exibe erro quando a carga inicial falha', async () => {
    getMock.mockImplementation((url: string) => {
      if (url.includes('/api/bitrix/deals')) return Promise.reject(new Error('HTTP 500'));
      if (url.includes('/api/bitrix/deal-pipelines')) return Promise.resolve([]);
      if (url.includes('/api/bitrix/users')) return Promise.resolve([]);
      if (url.includes('/api/bitrix/fields')) return Promise.resolve([]);
      return Promise.resolve([]);
    });
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);

    expect(await screen.findByText('HTTP 500')).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cobertura dos caminhos extraídos na decomposição (bitrixImport/*) e dos
// fluxos de leads/filtros/paginação/modal que o Sonar conta como "new code".
// ─────────────────────────────────────────────────────────────────────────────

const PIPELINE = { id: 'p1', name: 'Comercial' };
const STAGE = { id: 's1', name: 'Negociação' };
const USER = { id: 'u1', name: 'Maria Silva' };
const FIELD = { code: 'UF_CRM_TRANSPORTADORA', label: 'Transportadora' };

const DEAL_ASSIGNED = {
  ...DEAL,
  id: 'deal-2',
  title: 'Negócio Beta',
  assignedById: 'u1',
  opportunity: '25000',
};

const DEAL_IMPORTED = {
  ...DEAL,
  id: 'deal-3',
  title: 'Negócio Antigo',
  opportunity: '0',
  alreadyImported: true,
};

const LEAD = {
  id: 'lead-1',
  title: 'Lead Alfa',
  companyTitle: 'Acme',
  contactName: 'João Souza',
  phone: '+55 11 99999-0000',
  email: 'joao@acme.com',
  statusLabel: 'Novo',
  sourceId: null,
  dateCreate: '2026-11-02T10:00:00.000Z',
  alreadyImported: false,
};

const LEAD_NO_PHONE = {
  ...LEAD,
  id: 'lead-2',
  title: 'Lead Beta',
  contactName: 'Ana Lead',
  phone: null,
  email: null,
};

const LEAD_IMPORTED = {
  ...LEAD,
  id: 'lead-3',
  title: 'Lead Antigo',
  phone: null,
  email: null,
  alreadyImported: true,
};

interface RouteMocks {
  pipelines?: unknown[];
  stages?: unknown[];
  users?: unknown[];
  fields?: Record<string, unknown[]>;
  deals?: { deals: unknown[]; next: number | null; total: number };
  dealMeta?: { restricted: boolean; warning?: string };
  leads?: { leads: unknown[]; next: number | null; total: number };
  leadMeta?: { restricted: boolean; warning?: string };
}

function mockFullRoutes(overrides: RouteMocks = {}) {
  const pipelines = overrides.pipelines ?? [];
  const fields = overrides.fields ?? { deal: [], lead: [] };
  const deals = overrides.deals ?? { deals: [DEAL], next: null, total: 1 };
  const leads = overrides.leads ?? { leads: [LEAD], next: null, total: 1 };
  getMock.mockImplementation((url: string) => {
    if (url.includes('/api/bitrix/deal-pipelines')) return Promise.resolve(pipelines);
    if (url.includes('/api/bitrix/users'))
      return Promise.resolve(overrides.users ?? [USER]);
    if (url.includes('/api/bitrix/fields')) {
      const entity = url.includes('entity=lead') ? 'lead' : 'deal';
      return Promise.resolve(fields[entity] ?? []);
    }
    if (url.includes('/api/bitrix/deal-stages'))
      return Promise.resolve(overrides.stages ?? [STAGE]);
    if (url.includes('/api/bitrix/deals')) {
      return Promise.resolve({
        data: deals,
        meta: overrides.dealMeta ?? { restricted: false },
      });
    }
    if (url.includes('/api/bitrix/leads')) {
      return Promise.resolve({
        data: leads,
        meta: overrides.leadMeta ?? { restricted: false },
      });
    }
    return Promise.reject(new Error(`rota não mockada: ${url}`));
  });
}

function dealUrls(): string[] {
  return getMock.mock.calls.map((c) => String(c[0])).filter((u) => u.includes('/deals'));
}

describe('BitrixImportPanel — filtros, ordenação e paginação (modo Negócios)', () => {
  it('renderiza pipeline, vendedor e resolve o nome do responsável no card', async () => {
    mockFullRoutes({
      pipelines: [PIPELINE],
      deals: { deals: [DEAL_ASSIGNED], next: null, total: 1 },
    });
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);

    expect(await screen.findByText('Negócio Beta')).toBeTruthy();
    expect(screen.getByText('Comercial')).toBeTruthy();
    // userName() resolve o assignedById via lista de usuários do portal —
    // o nome aparece no card e também como <option> do filtro de vendedor.
    expect(screen.getAllByText('Maria Silva').length).toBeGreaterThan(0);
    // ADMIN pode escolher qualquer vendedor no filtro.
    expect(screen.getByLabelText(/Vendedor/)).toBeTruthy();
  });

  it('vendedor sem papel ADMIN/GESTOR vê trava de isolamento em vez do select', async () => {
    authRole = 'VENDEDOR';
    mockFullRoutes({ pipelines: [PIPELINE] });
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);

    expect(await screen.findByText('Oportunidade Atlas')).toBeTruthy();
    expect(screen.getByText('Exclusivo do Seu Usuário')).toBeTruthy();
  });

  it('avisa quando o portal não tem pipeline Comercial', async () => {
    mockFullRoutes({ pipelines: [] });
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);

    expect(await screen.findByText('Oportunidade Atlas')).toBeTruthy();
    expect(screen.getByText(/não tem um pipeline/)).toBeTruthy();
  });

  it('propaga etapa, vendedor, mês, ano e ordenação para a query de deals', async () => {
    mockFullRoutes({ pipelines: [PIPELINE], stages: [STAGE] });
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);
    await screen.findByText('Oportunidade Atlas');

    // As etapas chegam de /api/bitrix/deal-stages de forma assíncrona — é
    // preciso esperar a <option> existir antes de trocar o select.
    await screen.findByRole('option', { name: 'Negociação' });
    fireEvent.change(screen.getByLabelText(/Etapa/), { target: { value: 's1' } });
    await waitFor(() =>
      expect(dealUrls().some((u) => u.includes('stageId=s1'))).toBe(true),
    );

    fireEvent.change(screen.getByLabelText(/Vendedor/), { target: { value: 'u1' } });
    await waitFor(() =>
      expect(dealUrls().some((u) => u.includes('assignedById=u1'))).toBe(true),
    );

    fireEvent.change(screen.getByLabelText('Mês'), { target: { value: '3' } });
    await waitFor(() => expect(dealUrls().some((u) => u.includes('month=3'))).toBe(true));

    fireEvent.change(screen.getByLabelText('Ano'), { target: { value: '2025' } });
    await waitFor(() => expect(dealUrls().some((u) => u.includes('year=2025'))).toBe(true));

    fireEvent.change(screen.getByLabelText(/Ordenar Por/), {
      target: { value: 'name' },
    });
    // Ordenação é local (useMemo) — basta garantir que a UI continua íntegra.
    expect(await screen.findByText('Oportunidade Atlas')).toBeTruthy();
  });

  it('busca textual entra na query após o debounce de 400ms', async () => {
    mockFullRoutes();
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);
    await screen.findByText('Oportunidade Atlas');

    fireEvent.change(
      screen.getByPlaceholderText('Buscar por empresa, oportunidade ou negócio...'),
      { target: { value: 'atlas' } },
    );

    await waitFor(
      () => expect(dealUrls().some((u) => u.includes('search=atlas'))).toBe(true),
      { timeout: 3000 },
    );
  });

  it('campo personalizado só filtra quando código e valor estão preenchidos', async () => {
    mockFullRoutes({ fields: { deal: [FIELD], lead: [] } });
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);
    await screen.findByText('Oportunidade Atlas');

    fireEvent.change(screen.getByLabelText(/Campo personalizado/), {
      target: { value: 'UF_CRM_TRANSPORTADORA' },
    });
    // Sem valor, a query não pode carregar customFieldValue.
    await new Promise((r) => setTimeout(r, 500));
    expect(
      dealUrls().every((u) => !u.includes('customFieldValue')),
    ).toBe(true);

    fireEvent.change(screen.getByLabelText(/Valor exato a filtrar/), {
      target: { value: 'Transmana' },
    });
    await waitFor(
      () =>
        expect(
          dealUrls().some(
            (u) =>
              u.includes('customFieldCode=UF_CRM_TRANSPORTADORA') &&
              u.includes('customFieldValue=Transmana'),
          ),
        ).toBe(true),
      { timeout: 3000 },
    );
  });

  it('quick filter "Com Valor" esconde negócios sem oportunidade e "Disponíveis" esconde importados', async () => {
    mockFullRoutes({
      deals: {
        deals: [DEAL, DEAL_ASSIGNED, DEAL_IMPORTED],
        next: null,
        total: 3,
      },
    });
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);
    await screen.findByText('Oportunidade Atlas');
    expect(screen.getByText('Negócio Beta')).toBeTruthy();
    expect(screen.getByText('Negócio Antigo')).toBeTruthy();

    // has_value: só os dois com oportunidade > 0 (o importado tem '0').
    fireEvent.click(screen.getByRole('button', { name: 'Com Valor (R$)' }));
    expect(screen.getByText('Oportunidade Atlas')).toBeTruthy();
    expect(screen.getByText('Negócio Beta')).toBeTruthy();
    expect(screen.queryByText('Negócio Antigo')).toBeNull();

    // unimported: mantém os não importados e esconde o já importado.
    fireEvent.click(screen.getByRole('button', { name: 'Disponíveis para Importar' }));
    expect(screen.getByText('Oportunidade Atlas')).toBeTruthy();
    expect(screen.getByText('Negócio Beta')).toBeTruthy();
    expect(screen.queryByText('Negócio Antigo')).toBeNull();
  });

  it('quick filter "Disponíveis" sem itens importáveis mostra estado vazio', async () => {
    mockFullRoutes({
      deals: { deals: [DEAL_IMPORTED], next: null, total: 1 },
    });
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);
    await screen.findByText('Negócio Antigo');

    fireEvent.click(screen.getByRole('button', { name: 'Disponíveis para Importar' }));
    expect(await screen.findByText('Nenhum registro encontrado')).toBeTruthy();
  });

  it('paginação navega para a próxima página e volta', async () => {
    let page = 0;
    getMock.mockImplementation((url: string) => {
      if (url.includes('/api/bitrix/deal-pipelines')) return Promise.resolve([]);
      if (url.includes('/api/bitrix/users')) return Promise.resolve([]);
      if (url.includes('/api/bitrix/fields')) return Promise.resolve([]);
      if (url.includes('/api/bitrix/deals')) {
        page = Number(new URLSearchParams(url.split('?')[1]).get('start') ?? '0');
        return Promise.resolve({
          data: {
            deals: page === 0 ? [DEAL] : [{ ...DEAL, id: 'deal-p2', title: 'Página Dois' }],
            next: page === 0 ? 50 : null,
            total: 2,
          },
          meta: { restricted: false },
        });
      }
      return Promise.reject(new Error(`rota não mockada: ${url}`));
    });
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);
    await screen.findByText('Oportunidade Atlas');

    fireEvent.click(screen.getByRole('button', { name: /Próxima/ }));
    expect(await screen.findByText('Página Dois')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Anterior/ }));
    expect(await screen.findByText('Oportunidade Atlas')).toBeTruthy();
  });

  it('importa um único negócio pelo botão "Importar Agora" do card', async () => {
    mockFullRoutes();
    postMock.mockResolvedValue({
      imported: 1,
      skipped: 0,
      skippedConflicts: 0,
      skippedNotOwned: 0,
      failed: 0,
    });
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);
    await screen.findByText('Oportunidade Atlas');

    fireEvent.click(screen.getByRole('button', { name: /Importar Agora/ }));

    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith(
        '/api/bitrix/deals/import',
        { connectionId: CONNECTION_ID, bitrixDealIds: ['deal-1'] },
        { timeoutMs: 30_000 },
      ),
    );
    expect(await screen.findByText(/1 registro\(s\) importado\(s\)/)).toBeTruthy();
  });

  it('detalha conflitos, ignorados por titularidade e falhas reais no resultado', async () => {
    mockFullRoutes();
    postMock.mockResolvedValue({
      imported: 1,
      skipped: 2,
      skippedConflicts: 1,
      skippedNotOwned: 1,
      failed: 1,
    });
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);

    fireEvent.click(await screen.findByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Importar \(1\)/ }));

    expect(await screen.findByText(/2 já existiam/)).toBeTruthy();
    expect(screen.getByText(/bloqueado\(s\) — pertenciam a outro responsável/)).toBeTruthy();
    expect(screen.getByText(/não atribuídos a você no Bitrix24/)).toBeTruthy();
    expect(screen.getByText(/falharam de verdade/)).toBeTruthy();
  });

  it('exibe aviso de restrição de permissão retornado pela API', async () => {
    mockFullRoutes({
      dealMeta: { restricted: true, warning: 'Permissão limitada no portal Bitrix24' },
    });
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);

    expect(await screen.findByText('Oportunidade Atlas')).toBeTruthy();
    expect(screen.getByText('Permissão limitada no portal Bitrix24')).toBeTruthy();
  });

  it('negócio já importado tem checkbox desabilitado e não oferece importação', async () => {
    mockFullRoutes({
      deals: { deals: [DEAL_IMPORTED], next: null, total: 1 },
    });
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);

    expect(await screen.findByText('Negócio Antigo')).toBeTruthy();
    expect(screen.getByText('Já Importado')).toBeTruthy();
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);
    expect(screen.queryByRole('button', { name: /Importar Agora/ })).toBeNull();
  });

  it('selecionar todos da página, marcar todos e desmarcar tudo', async () => {
    mockFullRoutes({
      deals: {
        deals: [DEAL, DEAL_ASSIGNED, DEAL_IMPORTED],
        next: null,
        total: 3,
      },
    });
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);
    await screen.findByText('Oportunidade Atlas');

    fireEvent.click(screen.getByRole('button', { name: /Selecionar Todos da Página/ }));
    expect(await screen.findByText('2 selecionado(s)')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Marcar Todos' }));
    expect(screen.getByText('2 selecionado(s)')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Desmarcar Tudo' }));
    await waitFor(() => expect(screen.queryByText(/selecionado\(s\)/)).toBeNull());
    expect(screen.getByRole('button', { name: /Importar selecionados/ })).toBeTruthy();
  });

  it('botão Atualizar Portal recarrega a listagem', async () => {
    mockFullRoutes();
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);
    await screen.findByText('Oportunidade Atlas');
    const callsBefore = dealUrls().length;

    fireEvent.click(screen.getByRole('button', { name: /Atualizar Portal/ }));

    await waitFor(() => expect(dealUrls().length).toBeGreaterThan(callsBefore));
  });
});

describe('BitrixImportPanel — modal Editar em Lote', () => {
  it('abre o modal, troca a temperatura e aplica aos leads importados', async () => {
    mockFullRoutes();
    postMock.mockResolvedValue({
      imported: 1,
      skipped: 0,
      skippedConflicts: 0,
      skippedNotOwned: 0,
      failed: 0,
      importedLeadIds: ['lead-criado-1'],
    });
    putMock.mockResolvedValue({});
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);

    fireEvent.click(await screen.findByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Editar em Lote (1)' }));

    expect(await screen.findByText('Editar em Lote (1 itens)')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Quente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar & Importar (1)' }));

    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith(
        '/api/bitrix/deals/import',
        { connectionId: CONNECTION_ID, bitrixDealIds: ['deal-1'] },
        { timeoutMs: 90_000 },
      ),
    );
    await waitFor(() =>
      expect(putMock).toHaveBeenCalledWith('/api/leads/lead-criado-1', {
        temperature: 'Quente',
      }),
    );
  });

  it('avisa quando a temperatura não pode ser aplicada a parte dos leads', async () => {
    mockFullRoutes();
    postMock.mockResolvedValue({
      imported: 2,
      skipped: 0,
      skippedConflicts: 0,
      skippedNotOwned: 0,
      failed: 0,
      importedLeadIds: ['lead-1', 'lead-2'],
    });
    putMock.mockRejectedValue(new Error('falha ao atualizar'));
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);

    fireEvent.click(await screen.findByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Editar em Lote (1)' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Aplicar & Importar (1)' }));

    expect(
      await screen.findByText(/temperatura inicial não pôde ser aplicada a 2 de 2 lead/),
    ).toBeTruthy();
  });

  it('cancelar fecha o modal sem importar', async () => {
    mockFullRoutes();
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);

    fireEvent.click(await screen.findByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Editar em Lote (1)' }));
    expect(await screen.findByText('Editar em Lote (1 itens)')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() =>
      expect(screen.queryByText('Editar em Lote (1 itens)')).toBeNull(),
    );
    expect(postMock).not.toHaveBeenCalled();
  });
});

describe('BitrixImportPanel — modo Leads', () => {
  it('lista leads, filtra por telefone e importa selecionados', async () => {
    mockFullRoutes({
      leads: { leads: [LEAD, LEAD_NO_PHONE, LEAD_IMPORTED], next: null, total: 3 },
    });
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);

    fireEvent.click(await screen.findByRole('button', { name: /Leads \(Todos\)/ }));

    expect(await screen.findByText('Lead Alfa')).toBeTruthy();
    expect(screen.getByText('Lead Beta')).toBeTruthy();
    // Card de lead: contato, telefone com link WhatsApp, e-mail e badge de importado.
    expect(screen.getAllByText('João Souza').length).toBeGreaterThan(0);
    expect(screen.getByText('Já Importado')).toBeTruthy();
    const waLink = document.querySelector('a[href^="https://wa.me/"]');
    expect(waLink?.getAttribute('href')).toBe('https://wa.me/5511999990000');
    expect(document.querySelector('a[href="mailto:joao@acme.com"]')).toBeTruthy();

    // Quick filter exclusivo do modo leads — após filtrar, só o lead com
    // telefone permanece, então getByRole('checkbox') é único.
    fireEvent.click(screen.getByRole('button', { name: 'Com Telefone' }));
    expect(screen.getByText('Lead Alfa')).toBeTruthy();
    expect(screen.queryByText('Lead Beta')).toBeNull();

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Importar \(1\)/ }));

    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith(
        '/api/bitrix/leads/import',
        { connectionId: CONNECTION_ID, bitrixLeadIds: ['lead-1'] },
        { timeoutMs: 90_000 },
      ),
    );
  });

  it('importa um único lead pelo card', async () => {
    mockFullRoutes();
    postMock.mockResolvedValue({
      imported: 1,
      skipped: 0,
      skippedConflicts: 0,
      skippedNotOwned: 0,
      failed: 0,
    });
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);

    fireEvent.click(await screen.findByRole('button', { name: /Leads \(Todos\)/ }));
    expect(await screen.findByText('Lead Alfa')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Importar Agora/ }));

    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith(
        '/api/bitrix/leads/import',
        { connectionId: CONNECTION_ID, bitrixLeadIds: ['lead-1'] },
        { timeoutMs: 30_000 },
      ),
    );
  });

  it('exibe erro quando a carga de leads falha', async () => {
    getMock.mockImplementation((url: string) => {
      if (url.includes('/api/bitrix/leads')) return Promise.reject(new Error('HTTP 502'));
      if (url.includes('/api/bitrix/deal-pipelines')) return Promise.resolve([]);
      if (url.includes('/api/bitrix/users')) return Promise.resolve([]);
      if (url.includes('/api/bitrix/fields')) return Promise.resolve([]);
      return Promise.resolve([]);
    });
    render(<BitrixImportPanel connectionId={CONNECTION_ID} />);

    fireEvent.click(await screen.findByRole('button', { name: /Leads \(Todos\)/ }));

    expect(await screen.findByText('HTTP 502')).toBeTruthy();
    expect(await screen.findByText('Nenhum registro encontrado')).toBeTruthy();
  });
});
