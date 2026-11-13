import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CharacterGalleryView } from '@/features/characters/CharacterGalleryView';
import type { CharacterApiEntry, CharactersApiResponse } from '@/features/characters/characterApiTypes';
import type { CharacterDefinition } from '@/features/characters/characterCatalog.shared';

vi.mock('@/lib/sse.js', () => ({
  sseRequestInit: (body: unknown, signal?: AbortSignal) => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  }),
  readSseStream: vi.fn(async () => {}),
}));

function makeDef(overrides: Partial<CharacterDefinition>): CharacterDefinition {
  return {
    id: 'c1',
    name: 'Teste',
    role: 'Papel',
    layer: 'pillar',
    linkedAgentId: null,
    contextGroup: null,
    modules: [],
    palette: { primary: '#111', secondary: '#222', accent: '#333', heading: '#fff', subheading: '#aaa', halo: 'none' },
    svg: '/x.svg',
    viewBox: '0 0 1 1',
    badgeGradient: '',
    headingColor: '#fff',
    subheadingColor: '#aaa',
    contextMsg: null,
    ariaLabel: 'label',
    accessibleDescription: 'desc',
    archetype: 'circle',
    animationSignature: 'pulse',
    states: ['idle'],
    fallbackId: 'core',
    voiceCommand: null,
    ...overrides,
  } as CharacterDefinition;
}

function makeEntry(overrides: Partial<CharacterApiEntry>): CharacterApiEntry {
  return {
    ...makeDef({}),
    runtime: {
      kind: 'pillar-context',
      status: 'available',
      reason: null,
      httpRoute: null,
      capabilities: [],
      requiresApproval: false,
      risk: null,
      dispatch: 'none',
    },
    ...overrides,
  } as CharacterApiEntry;
}

const orbit = makeEntry({
  id: 'orbit',
  name: 'Orbit',
  role: 'Guardião do CRM',
  layer: 'pillar',
  linkedAgentId: 'agent-orbit',
});
const seller = makeEntry({
  id: 'seller-01',
  name: 'Closer Alpha',
  role: 'Fechamento',
  layer: 'commercial-agent',
  runtime: { ...makeEntry({}).runtime, status: 'available', dispatch: 'swarm-stream' },
});
const voice = makeEntry({
  id: 'voice-01',
  name: 'Voz Beta',
  role: 'Canal de voz',
  layer: 'channel-agent',
  runtime: { ...makeEntry({}).runtime, status: 'unavailable' },
});
const orchestrator = makeEntry({
  id: 'org-01',
  name: 'Orq Gamma',
  role: 'Orquestração',
  layer: 'orchestration',
  runtime: { ...makeEntry({}).runtime, status: 'degraded' },
});

const payload: CharactersApiResponse = {
  characters: [orbit, seller, voice, orchestrator],
  swarm: { concurrency: { maxConcurrent: 4, active: 2, waiting: 1 }, circuitBreaker: { state: 'closed' } },
  generatedAt: '2026-01-01T00:00:00Z',
};

const activity = {
  id: 'log-1',
  agentType: 'closer',
  action: 'mission.start',
  result: 'success',
  sessionId: 'sess-1',
  createdAt: '2026-01-01T10:00:00Z',
};

function mockFetch(charsOk = true) {
  const fn = vi.fn(async (input: unknown) => {
    const url = typeof input === 'string' ? input : (input as Request)?.url ?? '';
    if (url.includes('/activity')) {
      return { ok: true, json: async () => ({ success: true, data: { logs: [activity] } }) } as Response;
    }
    if (!charsOk) return { ok: false, status: 500, json: async () => ({}) } as Response;
    return { ok: true, json: async () => ({ success: true, data: payload }) } as Response;
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

function renderView() {
  return render(
    <MemoryRouter>
      <CharacterGalleryView />
    </MemoryRouter>,
  );
}

beforeEach(() => mockFetch());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('CharacterGalleryView', () => {
  it('carrega e renderiza os personagens agrupados por camada', async () => {
    renderView();
    expect(await screen.findByText('Orbit')).toBeTruthy();
    expect(screen.getByText('Closer Alpha')).toBeTruthy();
    expect(screen.getByText('Voz Beta')).toBeTruthy();
    expect(screen.getAllByText(/Pilares \(9 originais\)/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Agentes Comerciais \(15\)/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Enxame: 2\/4 missões ativas/)).toBeTruthy();
    expect(screen.getByText('mission.start')).toBeTruthy();
  });

  it('filtra por busca, camada e status de runtime', async () => {
    renderView();
    await screen.findByText('Orbit');

    fireEvent.change(screen.getByLabelText('Buscar personagem'), { target: { value: 'closer' } });
    expect(screen.queryByText('Orbit')).toBeNull();
    expect(screen.getByText('Closer Alpha')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Buscar personagem'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Filtrar por camada'), { target: { value: 'channel-agent' } });
    expect(screen.queryByText('Orbit')).toBeNull();
    expect(screen.getByText('Voz Beta')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Filtrar por camada'), { target: { value: 'all' } });
    fireEvent.change(screen.getByLabelText('Filtrar por status de runtime'), { target: { value: 'degraded' } });
    expect(screen.getByText('Orq Gamma')).toBeTruthy();
    expect(screen.queryByText('Orbit')).toBeNull();
    expect(screen.queryByText('Closer Alpha')).toBeNull();
    expect(screen.queryByText('Voz Beta')).toBeNull();
  });

  it('mostra estado vazio quando nenhum filtro corresponde', async () => {
    renderView();
    await screen.findByText('Orbit');
    fireEvent.change(screen.getByLabelText('Buscar personagem'), { target: { value: 'zzz-inexistente' } });
    expect(screen.getByText('Nenhum personagem corresponde aos filtros.')).toBeTruthy();
  });

  it('alterna estado visual de prévia e tema claro/escuro', async () => {
    renderView();
    await screen.findByText('Orbit');
    fireEvent.click(screen.getByRole('button', { name: 'Processamento' }));
    expect(screen.getByRole('button', { name: 'Processamento' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Tema claro' }));
    expect(screen.getByRole('button', { name: 'Tema escuro' })).toBeTruthy();
  });

  it('abre o painel de detalhe ao clicar no card e fecha pelo botão', async () => {
    renderView();
    await screen.findByText('Orbit');
    fireEvent.click(screen.getByTestId('character-card-orbit'));
    const panel = await screen.findByTestId('character-detail-panel');
    expect(panel.textContent).toContain('Orbit');
    fireEvent.click(screen.getByLabelText('Fechar detalhes do personagem'));
    await waitFor(() => expect(screen.queryByTestId('character-detail-panel')).toBeNull());
  });

  it('envia missão via Supervisor a partir do painel de detalhe', async () => {
    renderView();
    await screen.findByText('Closer Alpha');
    fireEvent.click(screen.getByTestId('character-card-seller-01'));
    await screen.findByTestId('character-detail-panel');
    fireEvent.change(screen.getByLabelText('Missão para o agente Closer Alpha'), {
      target: { value: 'Qualificar lead quente' },
    });
    fireEvent.click(screen.getByLabelText('Enviar missão'));
    expect(await screen.findByText(/Missão enviada ao Supervisor 00/)).toBeTruthy();
    expect(await screen.findByText(/Stream encerrado|Execução concluída/)).toBeTruthy();
  });

  it('exibe erro e permite tentar novamente', async () => {
    vi.unstubAllGlobals();
    let calls = 0;
    vi.stubGlobal('fetch', vi.fn(async (input: unknown) => {
      const url = typeof input === 'string' ? input : (input as Request)?.url ?? '';
      calls += 1;
      if (url.includes('/activity')) return { ok: true, json: async () => ({ success: true, data: { logs: [] } }) } as Response;
      if (calls <= 2) return { ok: false, status: 500, json: async () => ({}) } as Response;
      return { ok: true, json: async () => ({ success: true, data: payload }) } as Response;
    }));
    renderView();
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('HTTP 500');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Orbit')).toBeTruthy();
  });
});
