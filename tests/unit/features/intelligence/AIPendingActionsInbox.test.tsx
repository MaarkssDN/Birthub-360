// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import axe from 'axe-core';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../../src/lib/api.js';
import {
  type AIPendingActionItem,
  AIPendingActionsInbox,
  presentationFor,
} from '../../../../src/features/intelligence/components/AIPendingActionsInbox.js';

vi.mock('../../../../src/lib/api.js', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../../src/lib/clientLogger.js', () => ({
  clientLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockPendingActions: AIPendingActionItem[] = [
  {
    id: 'act-001',
    entity: 'Lead',
    action: 'send_email',
    agentRole: 'SDR',
    riskLevel: 'low',
    confidence: 0.95,
    payload: {
      leadId: 'lead-123',
      to: 'joao.silva@empresa.com.br',
      subject: 'Proposta Comercial Birth Hub 360',
      body: 'Olá João, conforme conversamos na reunião técnica, segue o resumo da proposta.',
      evidenceSnippet: 'Promessa: envio de proposta em 2 dias úteis',
      requiresApproval: true,
    },
    createdAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'act-002',
    entity: 'Lead',
    action: 'send_whatsapp_reply',
    agentRole: 'Negociador de IA',
    riskLevel: 'medium',
    confidence: 0.88,
    payload: {
      leadId: 'lead-456',
      recipient: '+5511999998888',
      message: 'Olá Maria, podemos agendar nossa demonstração amanhã às 14h?',
      trigger: 'negotiation_reply',
      triggerDetail: 'Lead demonstrou interesse em demonstração ao vivo',
      requiresApproval: true,
    },
    createdAt: '2026-11-01T11:30:00.000Z',
  },
  {
    id: 'act-003',
    entity: 'Lead',
    action: 'create_follow_up',
    agentRole: 'Promise Guardian',
    riskLevel: 'high',
    confidence: 0.99,
    payload: {
      leadId: 'lead-789',
      date: '2026-11-03',
      observations: 'Alinhamento urgente de desconto com a diretoria',
      evidenceSnippet: 'Detectado compromisso: verificar condição especial de desconto',
      requiresApproval: true,
    },
    createdAt: '2026-11-01T12:00:00.000Z',
  },
];

describe('AIPendingActionsInbox — Componente HITL e Acessibilidade (WCAG 2.2 AA)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Estado de Carregamento (Loading)', () => {
    it('renderiza o estado de carregamento acessível', async () => {
      vi.mocked(api.get).mockReturnValue(new Promise(() => {}));

      render(<AIPendingActionsInbox />);

      expect(screen.getByRole('status', { name: /carregando ações pendentes/i })).toBeInTheDocument();
      expect(screen.getByText(/buscando ações suspensas para aprovação humana/i)).toBeInTheDocument();
    });
  });

  describe('2. Estado Vazio (Empty)', () => {
    it('renderiza mensagem acessível quando não há ações pendentes', async () => {
      vi.mocked(api.get).mockResolvedValue([]);

      render(<AIPendingActionsInbox />);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /nenhuma ação pendente de aprovação humana/i }),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(/o enxame de ia está operando normalmente/i),
      ).toBeInTheDocument();
    });
  });

  describe('3. Estado de Erro (Error)', () => {
    it('renderiza banner de erro acessível com role="alert" e botão de retry', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Conexão recusada pelo gateway'));

      render(<AIPendingActionsInbox />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByText(/erro na comunicação com a célula de ia/i)).toBeInTheDocument();
      expect(screen.getByText(/conexão recusada pelo gateway/i)).toBeInTheDocument();

      // Testa botão de retry
      vi.mocked(api.get).mockResolvedValue(mockPendingActions);
      const retryBtn = screen.getByRole('button', { name: /tentar novamente/i });
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.getByText('E-mail Comercial (SDR / Closer)')).toBeInTheDocument();
      });
    });
  });

  describe('4. Renderização e Apresentação das Ações', () => {
    it('renderiza lista de cards de ações com metadados, gatilhos e badges de risco', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPendingActions);

      render(<AIPendingActionsInbox />);

      await waitFor(() => {
        expect(screen.getByText('E-mail Comercial (SDR / Closer)')).toBeInTheDocument();
      });

      expect(screen.getByText(/negociador de ia · réplica whatsapp/i)).toBeInTheDocument();
      expect(screen.getByText('Atividade de Follow-up / Tarefa')).toBeInTheDocument();

      // Badges de risco com texto acessível
      expect(screen.getAllByText('Baixo Risco').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Médio Risco').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Alto Risco').length).toBeGreaterThanOrEqual(1);

      // Indicadores de confiança
      expect(screen.getByText('95% conf.')).toBeInTheDocument();

      // Gatilho / Evidência detectada
      expect(screen.getByText(/promessa: envio de proposta em 2 dias úteis/i)).toBeInTheDocument();
    });
  });

  describe('5. Aprovação em 1 Clique (HITL 1-Click Approve)', () => {
    it('aprova e executa ação imediatamente ao clicar em Aprovar', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPendingActions);
      vi.mocked(api.post).mockResolvedValue({
        success: true,
        data: {
          action: mockPendingActions[0],
          execution: { sent: true },
        },
      });

      const onActionProcessed = vi.fn();
      render(<AIPendingActionsInbox onActionProcessed={onActionProcessed} />);

      await waitFor(() => {
        expect(screen.getByText('E-mail Comercial (SDR / Closer)')).toBeInTheDocument();
      });

      const approveBtn = screen.getByRole('button', {
        name: /aprovar e enviar para joao\.silva@empresa\.com\.br/i,
      });
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api/agent/commercial-cell/pending-actions/act-001/approve',
        );
      });

      expect(onActionProcessed).toHaveBeenCalledWith('act-001', 'approved');

      // Ação aprovada é removida da lista
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'E-mail Comercial (SDR / Closer)' })).not.toBeInTheDocument();
      });
    });
  });

  describe('6. Rejeição em 1 Clique (HITL 1-Click Reject)', () => {
    it('rejeita e descarta ação imediatamente ao clicar em Rejeitar', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPendingActions);
      vi.mocked(api.post).mockResolvedValue({ success: true });

      const onActionProcessed = vi.fn();
      render(<AIPendingActionsInbox onActionProcessed={onActionProcessed} />);

      await waitFor(() => {
        expect(screen.getByText(/negociador de ia · réplica whatsapp/i)).toBeInTheDocument();
      });

      const rejectBtn = screen.getByRole('button', {
        name: /rejeitar e descartar negociador de ia · réplica whatsapp/i,
      });
      fireEvent.click(rejectBtn);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api/agent/commercial-cell/pending-actions/act-002/reject',
        );
      });

      expect(onActionProcessed).toHaveBeenCalledWith('act-002', 'rejected');

      // Card da ação rejeitada é removido da lista
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /negociador de ia · réplica whatsapp/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('7. Filtros e Busca Acessíveis', () => {
    it('filtra ações por nível de risco ao clicar nos cards de resumo', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPendingActions);

      render(<AIPendingActionsInbox />);

      await waitFor(() => {
        expect(screen.getByText('E-mail Comercial (SDR / Closer)')).toBeInTheDocument();
      });

      // Clica no filtro de Alto Risco
      const highRiskBtn = screen.getByRole('button', { name: /alto risco/i });
      fireEvent.click(highRiskBtn);

      // Só o act-003 (high) deve estar visível
      expect(screen.getByText('Atividade de Follow-up / Tarefa')).toBeInTheDocument();
      expect(screen.queryByText('E-mail Comercial (SDR / Closer)')).not.toBeInTheDocument();
      expect(screen.queryByText(/negociador de ia · réplica whatsapp/i)).not.toBeInTheDocument();
    });

    it('filtra ações pelo campo de busca', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPendingActions);

      render(<AIPendingActionsInbox />);

      await waitFor(() => {
        expect(screen.getByText('E-mail Comercial (SDR / Closer)')).toBeInTheDocument();
      });

      const searchInput = screen.getByRole('searchbox');
      fireEvent.change(searchInput, { target: { value: 'maria' } });

      expect(screen.getByText(/negociador de ia · réplica whatsapp/i)).toBeInTheDocument();
      expect(screen.queryByText('E-mail Comercial (SDR / Closer)')).not.toBeInTheDocument();
    });
  });

  describe('8. Operações em Lote (Batch Actions)', () => {
    it('permite selecionar todos e aprovar em lote', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPendingActions);
      vi.mocked(api.post).mockResolvedValue({ success: true });

      render(<AIPendingActionsInbox />);

      await waitFor(() => {
        expect(screen.getByText('E-mail Comercial (SDR / Closer)')).toBeInTheDocument();
      });

      const selectAllCheckbox = screen.getByLabelText(/selecionar todos/i);
      fireEvent.click(selectAllCheckbox);

      const batchApproveBtn = screen.getByRole('button', { name: /aprovar 3 ações selecionadas/i });
      expect(batchApproveBtn).toBeInTheDocument();

      fireEvent.click(batchApproveBtn);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('9. Auditoria de Acessibilidade com axe-core (WCAG 2.2 AA)', () => {
    it('possui 0 violações de acessibilidade no axe-core quando preenchido', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPendingActions);

      const { container } = render(<AIPendingActionsInbox />);

      await waitFor(() => {
        expect(screen.getByText('E-mail Comercial (SDR / Closer)')).toBeInTheDocument();
      });

      // Executa auditoria do axe-core sobre a árvore DOM renderizada
      const results = await axe.run(container, {
        rules: {
          // No ambiente JSDOM puro, regras de contraste que dependem de layout de canvas
          // podem retornar inconclusivas; desativamos apenas medições sintéticas de cor de JSDOM
          'color-contrast': { enabled: false },
        },
      });

      expect(results.violations).toEqual([]);
    });

    it('possui 0 violações de acessibilidade no axe-core no estado vazio', async () => {
      vi.mocked(api.get).mockResolvedValue([]);

      const { container } = render(<AIPendingActionsInbox />);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /nenhuma ação pendente de aprovação humana/i }),
        ).toBeInTheDocument();
      });

      const results = await axe.run(container, {
        rules: {
          'color-contrast': { enabled: false },
        },
      });

      expect(results.violations).toEqual([]);
    });
  });

  describe('7. Caminhos de borda (cobertura de código novo no Sonar)', () => {
    const extras: AIPendingActionItem[] = [
      {
        id: 'act-n1',
        entity: 'Lead',
        action: 'notify_team',
        agentRole: 'Supervisor',
        riskLevel: 'low',
        confidence: 0.7,
        payload: { leadId: 'lead-n1' },
        createdAt: '2026-11-01T13:00:00.000Z',
      },
      {
        id: 'act-c1',
        entity: 'Lead',
        action: 'start_cadence',
        agentRole: 'SDR',
        riskLevel: 'low',
        confidence: 0.8,
        payload: { leadId: 'lead-c1' },
        createdAt: '2026-11-01T13:10:00.000Z',
      },
    ];

    it('apresenta notify_team e start_cadence', () => {
      expect(presentationFor(extras[0]).title).toBe('Notificação Interna de Equipe');
      expect(presentationFor(extras[1]).title).toBe('Cadência Multicanal Autônoma');
    });

    it('aceita envelope { data } e cai no endpoint canônico quando o primário falha', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ success: true, data: mockPendingActions });
      const { unmount } = render(<AIPendingActionsInbox />);
      expect(await screen.findByText('E-mail Comercial (SDR / Closer)')).toBeInTheDocument();
      unmount();

      vi.mocked(api.get)
        .mockRejectedValueOnce(new Error('primário fora'))
        .mockResolvedValueOnce(mockPendingActions);
      render(<AIPendingActionsInbox />);
      expect(await screen.findByText('E-mail Comercial (SDR / Closer)')).toBeInTheDocument();
      expect(api.get).toHaveBeenCalledWith('/api/intelligence/pending');
    });

    it('aprova via fallback e abre mailto quando o e-mail não foi enviado; fecha o feedback', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPendingActions);
      vi.mocked(api.post)
        .mockRejectedValueOnce(new Error('primário fora'))
        .mockResolvedValueOnce({ execution: { sent: false, reason: 'smtp' } });
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      render(<AIPendingActionsInbox />);
      fireEvent.click(
        await screen.findByRole('button', { name: /aprovar e enviar para joao\.silva@empresa\.com\.br/i }),
      );
      await waitFor(() => expect(openSpy).toHaveBeenCalled());
      expect(String(openSpy.mock.calls[0][0])).toMatch(/^mailto:joao\.silva%40empresa\.com\.br/);
      expect(api.post).toHaveBeenCalledWith('/api/intelligence/pending/act-001/approve');
      fireEvent.click(await screen.findByRole('button', { name: 'Fechar notificação de status' }));
      expect(screen.queryByText(/aprovada e executada/)).not.toBeInTheDocument();
      openSpy.mockRestore();
    });

    it('mostra falha ao aprovar e rejeita via DELETE canônico', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPendingActions);
      vi.mocked(api.post).mockRejectedValue(new Error('indisponível'));
      vi.mocked(api.delete).mockResolvedValue({});
      render(<AIPendingActionsInbox />);
      fireEvent.click(
        await screen.findByRole('button', { name: /aprovar e enviar para joao\.silva@empresa\.com\.br/i }),
      );
      expect((await screen.findAllByText(/falha ao aprovar ação: indisponível/i)).length).toBeGreaterThan(0);

      fireEvent.click(screen.getAllByRole('button', { name: /rejeitar e descartar/i })[0]);
      await waitFor(() => expect(api.delete).toHaveBeenCalled());
    });

    it('mostra falha ao rejeitar quando os dois endpoints falham', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPendingActions);
      vi.mocked(api.post).mockRejectedValue(new Error('x'));
      vi.mocked(api.delete).mockRejectedValue(new Error('sem acesso'));
      render(<AIPendingActionsInbox />);
      fireEvent.click((await screen.findAllByRole('button', { name: /rejeitar e descartar/i }))[0]);
      expect((await screen.findAllByText(/falha ao rejeitar ação: sem acesso/i)).length).toBeGreaterThan(0);
    });

    it('aprova e rejeita em lote com fallback e falhas parciais', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPendingActions);
      vi.mocked(api.post).mockImplementation(async (url: string) => {
        if (url.includes('commercial-cell')) throw new Error('primário fora');
        if (url.includes('act-002')) throw new Error('falhou');
        return {};
      });
      render(<AIPendingActionsInbox />);
      await screen.findByText('E-mail Comercial (SDR / Closer)');

      const selectAll = screen.getByLabelText(/selecionar todos/i);
      fireEvent.click(selectAll);
      fireEvent.click(screen.getByRole('button', { name: 'Aprovar 3 ações selecionadas' }));
      expect((await screen.findAllByText('2 ação(ões) aprovada(s) em lote.')).length).toBeGreaterThan(0);
    });

    it('rejeita em lote com fallback DELETE e falha parcial; alterna seleção individual', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPendingActions);
      vi.mocked(api.post).mockRejectedValue(new Error('primário fora'));
      vi.mocked(api.delete).mockImplementation(async (url: string) => {
        if (url.includes('act-003')) throw new Error('falhou');
        return {};
      });
      render(<AIPendingActionsInbox />);
      await screen.findByText('E-mail Comercial (SDR / Closer)');

      const boxes = screen.getAllByRole('checkbox', { name: /selecionar ação/i });
      fireEvent.click(boxes[0]);
      fireEvent.click(boxes[0]);
      const selectAll = screen.getByLabelText(/selecionar todos/i);
      fireEvent.click(selectAll);
      fireEvent.click(selectAll);
      fireEvent.click(selectAll);
      fireEvent.click(screen.getByRole('button', { name: 'Rejeitar 3 ações selecionadas' }));
      expect((await screen.findAllByText('2 ação(ões) rejeitada(s) em lote.')).length).toBeGreaterThan(0);
    });

    it('filtra por risco, tipo e busca; limpa a busca e todos os filtros', async () => {
      vi.mocked(api.get).mockResolvedValue([...mockPendingActions, ...extras]);
      render(<AIPendingActionsInbox />);
      await screen.findByText('E-mail Comercial (SDR / Closer)');

      const riskToolbar = screen.getByLabelText('Resumo por nível de risco');
      fireEvent.click(within(riskToolbar).getByRole('button', { name: /baixo risco/i }));
      fireEvent.click(within(riskToolbar).getByRole('button', { name: /total pendente/i }));

      const typeToolbar = screen.getByRole('toolbar', { name: 'Filtrar por canal ou tipo de ação' });
      fireEvent.click(within(typeToolbar).getByRole('button', { name: 'E-mail' }));
      expect(screen.queryByText('Notificação Interna de Equipe')).not.toBeInTheDocument();
      fireEvent.click(within(typeToolbar).getByRole('button', { name: 'Todos' }));

      const search = screen.getByPlaceholderText('Buscar por lead, agente, assunto ou canal...');
      fireEvent.change(search, { target: { value: 'termo-inexistente-xyz' } });
      expect(screen.getByText(/nenhuma ação corresponde aos filtros/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Limpar termo de busca' }));
      expect(screen.getByText('E-mail Comercial (SDR / Closer)')).toBeInTheDocument();

      fireEvent.change(search, { target: { value: 'termo-inexistente-xyz' } });
      fireEvent.click(screen.getByRole('button', { name: /limpar todos os filtros/i }));
      expect(screen.getByText('E-mail Comercial (SDR / Closer)')).toBeInTheDocument();
    });
  });
});
