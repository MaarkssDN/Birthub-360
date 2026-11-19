import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../../lib/api.js';
import { bitrixApi } from '../bitrix.api.js';

vi.mock('../../../../lib/api.js', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('bitrixApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listConnections', () => {
    it('deve retornar a lista diretamente quando o apiFetch retorna array desempacotado', async () => {
      const mockConnections = [
        {
          id: 'conn-1',
          label: 'Bitrix CRM SP',
          webhookUrl: 'https://b24.test/rest/1',
          createdAt: '2026-01-01T00:00:00.000Z',
          inboundEventsEnabled: true,
        },
      ];
      vi.mocked(api.get).mockResolvedValueOnce(mockConnections);

      const result = await bitrixApi.listConnections();

      expect(api.get).toHaveBeenCalledWith('/api/bitrix/connections');
      expect(result).toEqual(mockConnections);
    });

    it('deve desempacotar res.data quando o backend retorna envelope { data: [...] }', async () => {
      const mockConnections = [
        {
          id: 'conn-2',
          label: 'Bitrix CRM RJ',
          webhookUrl: 'https://b24.test/rest/2',
          createdAt: '2026-01-02T00:00:00.000Z',
          inboundEventsEnabled: false,
        },
      ];
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockConnections });

      const result = await bitrixApi.listConnections();

      expect(api.get).toHaveBeenCalledWith('/api/bitrix/connections');
      expect(result).toEqual(mockConnections);
    });
  });

  describe('listUsers', () => {
    it('deve retornar a lista diretamente quando o apiFetch retorna array desempacotado', async () => {
      const mockUsers = [
        { id: '1', name: 'Gestor A', email: 'gestora@test.com' },
        { id: '2', name: 'Vendedor B', email: null },
      ];
      vi.mocked(api.get).mockResolvedValueOnce(mockUsers);

      const result = await bitrixApi.listUsers('conn-123');

      expect(api.get).toHaveBeenCalledWith('/api/bitrix/users?connectionId=conn-123');
      expect(result).toEqual(mockUsers);
    });

    it('deve desempacotar res.data quando o backend retorna envelope { data: [...] }', async () => {
      const mockUsers = [{ id: '3', name: 'Suporte C', email: 'suporte@test.com' }];
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockUsers });

      const result = await bitrixApi.listUsers('conn-456');

      expect(api.get).toHaveBeenCalledWith('/api/bitrix/users?connectionId=conn-456');
      expect(result).toEqual(mockUsers);
    });
  });

  describe('listLeads', () => {
    it('deve consultar leads sem termo de busca', async () => {
      const mockResponse = {
        data: {
          leads: [
            {
              id: 'lead-1',
              title: 'Lead Alpha',
              statusId: 'NEW',
              statusLabel: 'Novo',
              assignedById: '1',
              assignedByName: 'Gestor A',
              dateCreate: '2026-01-01',
            },
          ],
          total: 1,
        },
      };
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

      const result = await bitrixApi.listLeads('conn-1');

      expect(api.get).toHaveBeenCalledWith('/api/bitrix/leads?connectionId=conn-1');
      expect(result).toEqual(mockResponse.data);
    });

    it('deve incluir parâmetro de busca quando fornecido', async () => {
      const mockResponse = {
        data: {
          leads: [],
          total: 0,
        },
      };
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

      const result = await bitrixApi.listLeads('conn-1', 'Hospital Santa Clara');

      expect(api.get).toHaveBeenCalledWith(
        '/api/bitrix/leads?connectionId=conn-1&search=Hospital+Santa+Clara',
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('listDeals', () => {
    it('deve consultar negócios sem termo de busca', async () => {
      const mockResponse = {
        data: {
          deals: [
            {
              id: 'deal-1',
              title: 'Contrato Anual',
              stageId: 'PROPOSAL',
              stageLabel: 'Proposta',
              categoryId: '0',
              opportunity: 50000,
              currencyId: 'BRL',
              assignedById: '1',
              assignedByName: 'Gestor A',
              dateCreate: '2026-01-01',
            },
          ],
          total: 1,
        },
      };
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

      const result = await bitrixApi.listDeals('conn-1');

      expect(api.get).toHaveBeenCalledWith('/api/bitrix/deals?connectionId=conn-1');
      expect(result).toEqual(mockResponse.data);
    });

    it('deve incluir parâmetro de busca quando fornecido', async () => {
      const mockResponse = {
        data: {
          deals: [],
          total: 0,
        },
      };
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

      const result = await bitrixApi.listDeals('conn-1', 'Renovação');

      expect(api.get).toHaveBeenCalledWith(
        '/api/bitrix/deals?connectionId=conn-1&search=Renova%C3%A7%C3%A3o',
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('operações de importação e exportação', () => {
    it('deve chamar importLeads corretamente', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ success: true });

      const res = await bitrixApi.importLeads('conn-1', ['101', '102']);

      expect(api.post).toHaveBeenCalledWith('/api/bitrix/leads/import', {
        connectionId: 'conn-1',
        bitrixLeadIds: ['101', '102'],
      });
      expect(res).toEqual({ success: true });
    });

    it('deve chamar importDeals corretamente', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ success: true });

      const res = await bitrixApi.importDeals('conn-1', ['201', '202']);

      expect(api.post).toHaveBeenCalledWith('/api/bitrix/deals/import', {
        connectionId: 'conn-1',
        bitrixDealIds: ['201', '202'],
      });
      expect(res).toEqual({ success: true });
    });

    it('deve chamar importRecentBitrixLeads corretamente', async () => {
      const mockData = { success: true, data: { imported: 5, skipped: 2 } };
      vi.mocked(api.post).mockResolvedValueOnce(mockData);

      const res = await bitrixApi.importRecentBitrixLeads();

      expect(api.post).toHaveBeenCalledWith('/api/crm/leads/import/bitrix24', {});
      expect(res).toEqual(mockData);
    });

    it('deve chamar exportLead com connectionId opcional', async () => {
      const mockData = { success: true, data: { bitrixLeadId: '301' } };
      vi.mocked(api.post).mockResolvedValueOnce(mockData);

      const res = await bitrixApi.exportLead('lead-xyz', 'conn-1');

      expect(api.post).toHaveBeenCalledWith('/api/bitrix/leads/lead-xyz/export', {
        connectionId: 'conn-1',
      });
      expect(res).toEqual(mockData);
    });

    it('deve chamar exportLeadsBatch com lista de ids', async () => {
      const mockData = { success: true, data: { exportedCount: 3, skippedCount: 0 } };
      vi.mocked(api.post).mockResolvedValueOnce(mockData);

      const res = await bitrixApi.exportLeadsBatch(['lead-1', 'lead-2'], 'conn-1');

      expect(api.post).toHaveBeenCalledWith('/api/bitrix/leads/export-batch', {
        leadIds: ['lead-1', 'lead-2'],
        connectionId: 'conn-1',
      });
      expect(res).toEqual(mockData);
    });
  });
});
