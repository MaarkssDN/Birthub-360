import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { copilotLiveBus } from '../../../src/features/copilot/copilotLiveBus.js';
import { LiveCopilotHUD } from '../../../src/features/copilot/components/LiveCopilotHUD.js';
import { WarRoomArenaView } from '../../../src/features/gamification/components/WarRoomArenaView.js';
import { PredictiveRevenueCockpit } from '../../../src/features/commercial-intelligence/components/PredictiveRevenueCockpit.js';
import { MultiRegionFailoverPanel } from '../../../src/features/settings/components/MultiRegionFailoverPanel.js';

// Mocks do ambiente de teste
vi.mock('../../../src/contexts/AuthContext.js', () => ({
  useAuth: () => ({
    currentUser: { id: 'usr-closer-01', name: 'Lucas Closer', role: 'CLOSER' },
    isAdmin: true,
  }),
}));

vi.mock('../../../src/lib/soundEffects.js', () => ({
  SoundFX: {
    play: vi.fn(),
  },
}));

vi.mock('../../../src/lib/toast.js', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Cockpit Operacional e Telas de Gestão na UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    copilotLiveBus.reset();
  });

  describe('1. HUD do Live Copilot de Voz (Bimodal)', () => {
    it('deve renderizar a telemetria do motor bimodal de voz com P50 e estado LISTENING', () => {
      copilotLiveBus.startCall({
        sessionId: 'call-bimodal-test',
        leadName: 'Fernanda Rocha',
        leadCompany: 'LogSul Transportes',
      });

      render(<LiveCopilotHUD isActive={true} sessionId="call-bimodal-test" />);

      expect(screen.getByText('Fernanda Rocha')).toBeDefined();
      expect(screen.getByText('LogSul Transportes')).toBeDefined();
      expect(screen.getByText('Voz: Ouvindo Lead')).toBeDefined();
      expect(screen.getByText('P50 380ms')).toBeDefined();
    });

    it('deve acionar o controle de Barge-In e registrar interrupção na telemetria', () => {
      copilotLiveBus.startCall({ sessionId: 'call-test' });
      render(<LiveCopilotHUD isActive={true} sessionId="call-test" />);

      const bargeInButtons = screen.getAllByRole('button', { name: /Barge-In/i });
      expect(bargeInButtons.length).toBeGreaterThan(0);

      fireEvent.click(bargeInButtons[0]);

      const state = copilotLiveBus.getState();
      expect(state.bimodalVoice.state).toBe('INTERRUPTED');
      expect(state.bimodalVoice.lastBargeInMs).toBeDefined();
    });

    it('deve alternar para modo Fallback STT/TTS assíncrono e retornar para bimodal', () => {
      copilotLiveBus.startCall({ sessionId: 'call-test' });
      render(<LiveCopilotHUD isActive={true} sessionId="call-test" />);

      const fallbackToggle = screen.getByTitle(/Ativar fallback assíncrono/i);
      fireEvent.click(fallbackToggle);

      let state = copilotLiveBus.getState();
      expect(state.bimodalVoice.isFallback).toBe(true);
      expect(state.bimodalVoice.transport).toBe('websocket');
      expect(state.bimodalVoice.state).toBe('FALLBACK');

      // Alternar de volta
      const bimodalRestore = screen.getByTitle(/Voltar para Bimodal WebRTC/i);
      fireEvent.click(bimodalRestore);

      state = copilotLiveBus.getState();
      expect(state.bimodalVoice.isFallback).toBe(false);
      expect(state.bimodalVoice.transport).toBe('webrtc');
    });
  });

  describe('2. Arena Interativa de War Room', () => {
    it('deve renderizar o lobby com os 3 modos de duelo', () => {
      render(<WarRoomArenaView />);

      expect(screen.getByText('Arena Interativa de War Room')).toBeDefined();
      expect(screen.getByText('Duelo de Objeções')).toBeDefined();
      expect(screen.getByText('Desafio de Equipe')).toBeDefined();
      expect(screen.getByText('Torneio Sazonal')).toBeDefined();
    });

    it('deve iniciar o duelo e apresentar o round cronometrado com objeção ativa', () => {
      render(<WarRoomArenaView />);

      const enterArenaBtn = screen.getByRole('button', { name: /Entrar na Arena Agora/i });
      fireEvent.click(enterArenaBtn);

      expect(screen.getByText('Round 1 de 3')).toBeDefined();
      expect(screen.getByText(/Objeção do Lead/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/Estruture sua resposta/i)).toBeDefined();
    });

    it('associa o rótulo "Sua Defesa de Objeção" ao campo de resposta (a11y)', () => {
      render(<WarRoomArenaView />);

      fireEvent.click(screen.getByRole('button', { name: /Entrar na Arena Agora/i }));

      const field = screen.getByLabelText(/Sua Defesa de Objeção/i);
      expect(field.tagName).toBe('TEXTAREA');
      expect(field).toBe(screen.getByPlaceholderText(/Estruture sua resposta/i));
    });
  });

  describe('3. Cockpit de Forecast Preditivo (contrato honesto V2)', () => {
    const basePayload = {
      currentPeriod: '2026-01',
      closedWonRevenue: 0,
      weightedPipelineRevenue: 0,
      modelConfidence: 'ESTIMATED_ONLY' as const,
    };

    it('deve exibir estado de dados insuficientes sem fabricar projeções', () => {
      render(
        <PredictiveRevenueCockpit
          loading={false}
          data={{
            ...basePayload,
            status: 'insufficient_data',
            projections: null,
          }}
          error={null}
        />,
      );

      expect(screen.getByTestId('predictive-empty')).toBeDefined();
      expect(screen.getByText(/Histórico Insuficiente/i)).toBeDefined();
    });

    it('deve exibir erro real quando a API falha', () => {
      render(<PredictiveRevenueCockpit loading={false} data={null} error="timeout" />);

      expect(screen.getByTestId('predictive-error')).toBeDefined();
      expect(screen.getByText('timeout')).toBeDefined();
    });

    it('deve exibir horizontes P10/P50/P90 quando há dados reais', () => {
      render(
        <PredictiveRevenueCockpit
          loading={false}
          data={{
            ...basePayload,
            status: 'ok',
            projections: {
              days30: {
                horizonDays: 30,
                expectedRevenue: 1000,
                confidenceInterval: { p10: 800, p50: 1000, p90: 1200 },
                status: 'ok',
              },
              days90: {
                horizonDays: 90,
                expectedRevenue: 3000,
                confidenceInterval: { p10: 2400, p50: 3000, p90: 3600 },
                status: 'ok',
              },
              days180: {
                horizonDays: 180,
                expectedRevenue: 6000,
                confidenceInterval: { p10: 4800, p50: 6000, p90: 7200 },
                status: 'ok',
              },
            },
          }}
          error={null}
        />,
      );

      expect(screen.getByTestId('predictive-ready')).toBeDefined();
      expect(screen.getByText('Horizonte 30 Dias')).toBeDefined();
      expect(screen.getByText('Horizonte 90 Dias')).toBeDefined();
      expect(screen.getByText('Horizonte 180 Dias')).toBeDefined();
    });
  });

  describe('4. Visualizador de Failover Multi-Região', () => {
    it('deve exibir as 3 regiões canônicas (sa-east-1, us-east-1, us-west-2)', () => {
      render(<MultiRegionFailoverPanel />);

      expect(screen.getByText('Visualizador de Failover Multi-Região')).toBeDefined();
      expect(screen.getByText('sa-east-1')).toBeDefined();
      expect(screen.getByText('us-east-1')).toBeDefined();
      expect(screen.getByText('us-west-2')).toBeDefined();
      expect(screen.getByText('PRIMÁRIO')).toBeDefined();
    });

    it('deve se declarar demonstração visual e não oferecer failover executável', () => {
      render(<MultiRegionFailoverPanel />);

      // EXP-05: o painel não pode mais simular telemetria/failover operacional.
      expect(screen.getByText(/Demonstração visual/i)).toBeDefined();
      expect(screen.getByText(/não estão conectados a uma infraestrutura operacional/i)).toBeDefined();
      expect(screen.queryByRole('button', { name: /Disparar Failover/i })).toBeNull();
      expect(screen.getByText(/Nenhum failover real foi registrado/i)).toBeDefined();
    });
  });
});
