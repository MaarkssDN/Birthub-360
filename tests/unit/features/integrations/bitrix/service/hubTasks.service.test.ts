import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * `hubTasks.service.ts` dá suporte ao widget "Tarefas pendentes" do Hub Executivo
 * (`HubTaskWidget.tsx`) — pedido explícito do usuário: "tudo tem que estar em sincronia com o
 * Bitrix24". Antes disto o widget tinha 3 nomes fixos e `useState` local sem chamada de rede
 * nenhuma. Este serviço não toca Prisma diretamente (não há tabela nova — o Bitrix é a fonte de
 * verdade), então os mocks aqui são as próprias funções de `client.js`/`connections.js`/
 * `deals.js`/`userMapping.js` que ele chama, não o Prisma.
 */

const callBitrix = vi.fn();
const getConnectionWebhookUrl = vi.fn();
vi.mock('../../../../../../src/features/integrations/bitrix/service/client.js', () => ({
  callBitrix: (...args: unknown[]) => callBitrix(...args),
  getConnectionWebhookUrl: (...args: unknown[]) => getConnectionWebhookUrl(...args),
}));

const listBitrixConnections = vi.fn();
vi.mock('../../../../../../src/features/integrations/bitrix/service/connections.js', () => ({
  listBitrixConnections: (...args: unknown[]) => listBitrixConnections(...args),
}));

const getBitrixUsers = vi.fn();
vi.mock('../../../../../../src/features/integrations/bitrix/service/deals.js', () => ({
  getBitrixUsers: (...args: unknown[]) => getBitrixUsers(...args),
}));

const resolveOwnBitrixUserId = vi.fn();
vi.mock('../../../../../../src/features/integrations/bitrix/service/userMapping.js', () => ({
  resolveOwnBitrixUserId: (...args: unknown[]) => resolveOwnBitrixUserId(...args),
}));

vi.mock('../../../../../../src/lib/logger.js', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import {
  listHubTaskAssignees,
  listHubTasks,
  createHubTask,
  toggleHubTask,
} from '../../../../../../src/features/integrations/bitrix/service/hubTasks.service';

const ORG_ID = 'org-1';
const CONNECTION = { id: 'conn-1' };
const USER = { id: 'user-1', email: 'vendedor@birthhub360.com.br', name: 'Vendedor Um' };
const USER_ADMIN = {
  id: 'admin-1',
  email: 'admin@birthhub360.com.br',
  name: 'Admin',
  role: 'ADMIN',
  bitrixUserId: 99,
};
const ASSIGNEES = [
  { id: '10', name: 'Ana Souza', email: 'ana@birthhub360.com.br' },
  { id: '20', name: 'Bruno Reis', email: 'bruno@birthhub360.com.br' },
];

beforeEach(() => {
  vi.clearAllMocks();
  listBitrixConnections.mockResolvedValue([CONNECTION]);
  getConnectionWebhookUrl.mockResolvedValue('https://portal.bitrix24.com.br/rest/1/token/');
  getBitrixUsers.mockResolvedValue(ASSIGNEES);
  resolveOwnBitrixUserId.mockReturnValue('10');
});

describe('listHubTaskAssignees', () => {
  it('devolve os usuários reais do Bitrix24 da conexão da organização', async () => {
    const result = await listHubTaskAssignees(ORG_ID);

    expect(result).toEqual(ASSIGNEES);
    expect(getBitrixUsers).toHaveBeenCalledWith(ORG_ID, CONNECTION.id);
  });

  it('lança AppError quando a organização não tem conexão Bitrix24', async () => {
    listBitrixConnections.mockResolvedValue([]);

    await expect(listHubTaskAssignees(ORG_ID)).rejects.toThrow(
      'Conexão com Bitrix24 não encontrada para esta organização.',
    );
    expect(getBitrixUsers).not.toHaveBeenCalled();
  });
});

describe('listHubTasks', () => {
  it('lista as tarefas criadas pelo usuário logado, mapeando responsável e status real', async () => {
    callBitrix.mockImplementation((_url: string, method: string, params: any) => {
      if (method !== 'tasks.task.list') return Promise.resolve({ result: {} });
      const tasks =
        params?.filter?.CREATED_BY === '10'
          ? [
              { ID: 101, TITLE: 'Ligar para cliente X', RESPONSIBLE_ID: 20, STATUS: '2' },
              { ID: 102, TITLE: 'Enviar proposta', RESPONSIBLE_ID: '10', STATUS: '5' },
            ]
          : [];
      return Promise.resolve({ result: { tasks } });
    });

    const result = await listHubTasks(ORG_ID, USER);

    // Ordenação por ID descendente — mesma ordem que o Bitrix aplica com order: { ID: 'DESC' }.
    expect(result).toEqual([
      {
        id: '102',
        text: 'Enviar proposta',
        assigneeId: '10',
        assigneeName: 'Ana Souza',
        done: true,
      },
      {
        id: '101',
        text: 'Ligar para cliente X',
        assigneeId: '20',
        assigneeName: 'Bruno Reis',
        done: false,
      },
    ]);
    expect(callBitrix).toHaveBeenCalledWith(
      'https://portal.bitrix24.com.br/rest/1/token/',
      'tasks.task.list',
      expect.objectContaining({ filter: { CREATED_BY: '10' } }),
    );
  });

  it('usa "Tarefa sem título" e "Responsável" como fallback quando o Bitrix não devolve o campo', async () => {
    callBitrix.mockResolvedValue({
      result: { tasks: [{ ID: 5, RESPONSIBLE_ID: 999, STATUS: '2' }] },
    });

    const result = await listHubTasks(ORG_ID, USER);

    expect(result).toEqual([
      {
        id: '5',
        text: 'Tarefa sem título',
        assigneeId: '999',
        assigneeName: 'Responsável',
        done: false,
      },
    ]);
  });

  it('lança AppError quando não há conexão Bitrix24 configurada', async () => {
    listBitrixConnections.mockResolvedValue([]);

    await expect(listHubTasks(ORG_ID, USER)).rejects.toThrow(
      'Conexão com Bitrix24 não encontrada para esta organização.',
    );
  });

  it('lança AppError quando o login da Central não tem usuário Bitrix correspondente', async () => {
    resolveOwnBitrixUserId.mockReturnValue(null);

    await expect(listHubTasks(ORG_ID, USER)).rejects.toThrow(
      'Seu login não tem um usuário correspondente no Bitrix24',
    );
    expect(callBitrix).not.toHaveBeenCalled();
  });

  it('usa o bitrixUserId vinculado explicitamente, sem precisar resolver por e-mail/nome', async () => {
    const userComVinculo = { ...USER, bitrixUserId: 20 };
    callBitrix.mockResolvedValue({ result: { tasks: [] } });

    await listHubTasks(ORG_ID, userComVinculo);

    expect(resolveOwnBitrixUserId).not.toHaveBeenCalled();
    expect(callBitrix).toHaveBeenCalledWith(
      expect.any(String),
      'tasks.task.list',
      expect.objectContaining({ filter: { CREATED_BY: '20' } }),
    );
  });

  it('também lista tarefas delegadas PARA o usuário (RESPONSIBLE_ID), sem duplicar as próprias', async () => {
    callBitrix.mockImplementation((_url: string, method: string, params: any) => {
      if (method !== 'tasks.task.list') return Promise.resolve({ result: {} });
      const tasks =
        params?.filter?.CREATED_BY === '10'
          ? [
              { ID: 101, TITLE: 'Delegada por mim', RESPONSIBLE_ID: 20, STATUS: '2' },
              { ID: 104, TITLE: 'Autoatribuída', RESPONSIBLE_ID: 10, STATUS: '2' },
            ]
          : params?.filter?.RESPONSIBLE_ID === '10'
            ? [
                { ID: 103, TITLE: 'Recebida de colega', RESPONSIBLE_ID: 10, STATUS: '2' },
                { ID: 104, TITLE: 'Autoatribuída', RESPONSIBLE_ID: 10, STATUS: '2' },
              ]
            : [];
      return Promise.resolve({ result: { tasks } });
    });

    const result = await listHubTasks(ORG_ID, USER);

    expect(callBitrix).toHaveBeenCalledWith(
      expect.any(String),
      'tasks.task.list',
      expect.objectContaining({ filter: { RESPONSIBLE_ID: '10' } }),
    );
    // 104 aparece nas duas listagens (criei E sou responsável) — deve vir deduplicada.
    expect(result.map((t) => t.id).sort()).toEqual(['101', '103', '104']);
    expect(result.filter((t) => t.id === '104')).toHaveLength(1);
    expect(result.find((t) => t.id === '103')?.text).toBe('Recebida de colega');
  });

  it('propaga o erro (não engole) quando tasks.task.list falha no Bitrix24', async () => {
    callBitrix.mockRejectedValue(new Error('timeout no portal Bitrix24'));

    await expect(listHubTasks(ORG_ID, USER)).rejects.toThrow('timeout no portal Bitrix24');
  });
});

describe('createHubTask', () => {
  it('cria a tarefa no Bitrix24 e relista o estado canônico', async () => {
    callBitrix.mockImplementation((_url: string, method: string) => {
      if (method === 'tasks.task.add') return Promise.resolve({ result: { task: { id: 999 } } });
      if (method === 'tasks.task.list') {
        return Promise.resolve({
          result: {
            tasks: [{ ID: 999, TITLE: 'Nova tarefa', RESPONSIBLE_ID: 20, STATUS: '2' }],
          },
        });
      }
      return Promise.resolve({ result: {} });
    });

    const result = await createHubTask(ORG_ID, USER, { text: '  Nova tarefa  ', assigneeId: '20' });

    expect(callBitrix).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      'tasks.task.add',
      expect.objectContaining({
        fields: expect.objectContaining({
          TITLE: 'Nova tarefa',
          RESPONSIBLE_ID: '20',
          CREATED_BY: '10',
        }),
      }),
    );
    expect(result).toEqual([
      { id: '999', text: 'Nova tarefa', assigneeId: '20', assigneeName: 'Bruno Reis', done: false },
    ]);
  });

  it('rejeita texto vazio (ou só espaços) sem chamar o Bitrix24', async () => {
    await expect(createHubTask(ORG_ID, USER, { text: '   ', assigneeId: '20' })).rejects.toThrow(
      'Descrição da tarefa é obrigatória.',
    );
    expect(callBitrix).not.toHaveBeenCalled();
  });

  it('rejeita quando nenhum responsável foi selecionado', async () => {
    await expect(
      createHubTask(ORG_ID, USER, { text: 'Tarefa válida', assigneeId: '' }),
    ).rejects.toThrow('Selecione quem vai receber a tarefa.');
    expect(callBitrix).not.toHaveBeenCalled();
  });
});

describe('toggleHubTask', () => {
  /** Mock do fluxo completo: tasks.task.get (authz) → mutação → tasks.task.list (relistagem). */
  function mockToggleFlow(task: Record<string, unknown> | null, listTasks: unknown[] = []) {
    callBitrix.mockImplementation((_url: string, method: string) => {
      if (method === 'tasks.task.get') {
        return Promise.resolve(task ? { result: { task } } : { result: {} });
      }
      if (method === 'tasks.task.list') {
        return Promise.resolve({ result: { tasks: listTasks } });
      }
      return Promise.resolve({});
    });
  }

  it('chama tasks.task.complete quando done=true e relista', async () => {
    mockToggleFlow(
      { ID: 101, TITLE: 'Ligar para cliente X', CREATED_BY: 10, RESPONSIBLE_ID: 20, STATUS: '2' },
      [],
    );

    await toggleHubTask(ORG_ID, USER, '101', true);

    expect(callBitrix).toHaveBeenCalledWith(expect.any(String), 'tasks.task.complete', {
      taskId: '101',
    });
  });

  it('chama tasks.task.renew quando done=false e relista', async () => {
    mockToggleFlow(
      { ID: 101, TITLE: 'Ligar para cliente X', CREATED_BY: 10, RESPONSIBLE_ID: 20, STATUS: '5' },
      [],
    );

    await toggleHubTask(ORG_ID, USER, '101', false);

    expect(callBitrix).toHaveBeenCalledWith(expect.any(String), 'tasks.task.renew', {
      taskId: '101',
    });
  });

  it('devolve a lista atualizada vinda da relistagem, não um objeto local', async () => {
    mockToggleFlow(
      { ID: 101, TITLE: 'Ligar para cliente X', CREATED_BY: 10, RESPONSIBLE_ID: 10, STATUS: '2' },
      [{ ID: 101, TITLE: 'Ligar para cliente X', RESPONSIBLE_ID: 10, STATUS: '5' }],
    );

    const result = await toggleHubTask(ORG_ID, USER, '101', true);

    expect(result).toEqual([
      {
        id: '101',
        text: 'Ligar para cliente X',
        assigneeId: '10',
        assigneeName: 'Ana Souza',
        done: true,
      },
    ]);
  });

  // ── Autorização (IDOR intra-portal — handoffs 43→50 e 45→06) ──────────────────────────

  it('permite concluir tarefa da qual sou o RESPONSIBLE_ID (delegada para mim)', async () => {
    mockToggleFlow({
      ID: 101,
      TITLE: 'Tarefa recebida',
      CREATED_BY: 20,
      RESPONSIBLE_ID: 10,
      STATUS: '2',
    });

    await toggleHubTask(ORG_ID, USER, '101', true);

    expect(callBitrix).toHaveBeenCalledWith(expect.any(String), 'tasks.task.complete', {
      taskId: '101',
    });
  });

  it('nega (403) toggle de tarefa de outro usuário — nem criador nem responsável', async () => {
    mockToggleFlow({
      ID: 777,
      TITLE: 'Tarefa alheia',
      CREATED_BY: 20,
      RESPONSIBLE_ID: 20,
      STATUS: '2',
    });

    await expect(toggleHubTask(ORG_ID, USER, '777', true)).rejects.toThrow(
      'não tem permissão para alterar esta tarefa',
    );
    expect(callBitrix).not.toHaveBeenCalledWith(
      expect.any(String),
      'tasks.task.complete',
      expect.anything(),
    );
    expect(callBitrix).not.toHaveBeenCalledWith(
      expect.any(String),
      'tasks.task.renew',
      expect.anything(),
    );
  });

  it('nega (403) também no renew de tarefa alheia', async () => {
    mockToggleFlow({
      ID: 777,
      TITLE: 'Tarefa alheia',
      CREATED_BY: 20,
      RESPONSIBLE_ID: 20,
      STATUS: '5',
    });

    await expect(toggleHubTask(ORG_ID, USER, '777', false)).rejects.toThrow(
      'não tem permissão para alterar esta tarefa',
    );
    expect(callBitrix).not.toHaveBeenCalledWith(
      expect.any(String),
      'tasks.task.renew',
      expect.anything(),
    );
  });

  it('ADMIN/GESTOR pode alternar qualquer tarefa do portal, sem vínculo Bitrix próprio', async () => {
    resolveOwnBitrixUserId.mockReturnValue(null); // admin não tem usuário Bitrix mapeado
    mockToggleFlow({
      ID: 777,
      TITLE: 'Tarefa de terceiro',
      CREATED_BY: 20,
      RESPONSIBLE_ID: 30,
      STATUS: '2',
    });

    await toggleHubTask(ORG_ID, USER_ADMIN, '777', true);

    expect(callBitrix).toHaveBeenCalledWith(expect.any(String), 'tasks.task.complete', {
      taskId: '777',
    });
    // gestor não precisa do próprio bitrixUserId para autorizar — não resolve o mapeamento
    expect(resolveOwnBitrixUserId).not.toHaveBeenCalled();
  });

  it('retorna 404 quando a tarefa não existe no portal', async () => {
    mockToggleFlow(null);

    await expect(toggleHubTask(ORG_ID, USER, '999999', true)).rejects.toThrow(
      'Tarefa não encontrada',
    );
    expect(callBitrix).not.toHaveBeenCalledWith(
      expect.any(String),
      'tasks.task.complete',
      expect.anything(),
    );
  });
});
