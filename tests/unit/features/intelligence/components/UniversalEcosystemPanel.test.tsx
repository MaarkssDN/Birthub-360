import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../../src/lib/soundEffects.js', () => ({
  SoundFX: { play: vi.fn() },
}));
vi.mock('../../../../../src/lib/api.js', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

import { api } from '../../../../../src/lib/api.js';
import { UniversalEcosystemPanel } from '../../../../../src/features/intelligence/components/UniversalEcosystemPanel.js';

const slack = {
  provider: 'slack',
  name: 'Slack Workspace',
  group: 'messaging' as const,
  settingKey: null,
  description: 'Alertas no Slack.',
  fields: [{ key: 'webhookUrl', label: 'Webhook', placeholder: 'https://hooks.slack.com' }],
  connected: true,
  statusDetail: 'Canal #vendas',
  maskedConfig: {},
};

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('UniversalEcosystemPanel — teste de ping do conector', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (String(url).includes('/connectors')) return { data: [slack] };
      return { data: [] };
    });
  });

  it('mostra o ping, a mensagem do barramento e o estado Testando', async () => {
    const pending = deferred<{ data: { message: string } }>();
    vi.mocked(api.post).mockReturnValue(pending.promise);

    render(<UniversalEcosystemPanel mode="connectors" onLaunchSwarmMission={vi.fn()} />);

    const ping = await screen.findByRole('button', { name: 'Testar Ping' });
    fireEvent.click(ping);

    const testing = await screen.findByRole('button', { name: 'Testando...' });
    expect(testing).toHaveProperty('disabled', true);
    expect(api.post).toHaveBeenCalledWith('/api/agent/ecosystem/connectors/slack/test', {});

    pending.resolve({ data: { message: 'Ping do Slack aceito.' } });
    expect(await screen.findByText('Ping do Slack aceito.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Testar Ping' })).toBeTruthy();
  });

  it('usa a mensagem padrão quando o barramento não devolve texto', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { message: '' } });

    render(<UniversalEcosystemPanel mode="connectors" onLaunchSwarmMission={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Testar Ping' }));

    expect(await screen.findByText('Teste do conector SLACK concluído.')).toBeTruthy();
  });

  it('aceita o corpo direto, sem envelope data', async () => {
    vi.mocked(api.post).mockResolvedValue({ message: 'pong direto' });

    render(<UniversalEcosystemPanel mode="connectors" onLaunchSwarmMission={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Testar Ping' }));

    expect(await screen.findByText('pong direto')).toBeTruthy();
  });

  it('mostra a falha quando o ping rejeita com Error ou com valor solto', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error('webhook recusado'));

    const view = render(<UniversalEcosystemPanel mode="connectors" onLaunchSwarmMission={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Testar Ping' }));
    expect(await screen.findByText('webhook recusado')).toBeTruthy();

    view.unmount();
    vi.mocked(api.post).mockRejectedValueOnce('timeout');
    render(<UniversalEcosystemPanel mode="connectors" onLaunchSwarmMission={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Testar Ping' }));
    expect(await screen.findByText('Falha ao testar conector SLACK.')).toBeTruthy();
  });
});

// a11y/noLabelWithoutControl: os rótulos precisam apontar para os seus campos.
describe('UniversalEcosystemPanel — rótulos acessíveis', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (String(url).includes('/connectors')) return { data: [slack] };
      return { data: [] };
    });
  });

  it('associa o rótulo de cada credencial ao seu campo no modo conectores', async () => {
    render(<UniversalEcosystemPanel mode="connectors" onLaunchSwarmMission={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Editar Credenciais' }));

    const field = screen.getByLabelText('Webhook');
    expect(field.tagName).toBe('INPUT');
    expect(field).toBe(screen.getByPlaceholderText('https://hooks.slack.com'));
  });

  it('associa os rótulos do estúdio aos seus campos', () => {
    render(<UniversalEcosystemPanel mode="studio" onLaunchSwarmMission={vi.fn()} />);

    expect(screen.getByLabelText(/Formato do Artefato/i).tagName).toBe('SELECT');
    expect(screen.getByLabelText(/Título do Arquivo/i).tagName).toBe('INPUT');
    expect(screen.getByLabelText(/Nome \/ Cargo do Agente Separado/i)).toHaveProperty(
      'value',
      'Especialista de Operações & Receita 360',
    );
    expect(screen.getByLabelText(/Diretriz \/ System Prompt do Agente/i).tagName).toBe('INPUT');
    expect(screen.getByLabelText(/Missão para o Agente Separado/i).tagName).toBe('INPUT');
  });
});
