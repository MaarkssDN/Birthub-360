import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  AGENT_NAMES,
  createId,
  formatMs,
  formatPercent,
  getAgentName,
  MISSION_SUGGESTIONS,
  PIPELINE_AGENTS,
  SLO_ROLE_COLOR,
  SLO_ROLE_LABEL,
  SwarmDashboard,
} from '../SwarmDashboard.js';

beforeAll(() => {
  Element.prototype.scrollTo = vi.fn();
});

vi.mock('../UniversalEcosystemPanel.js', () => ({
  UniversalEcosystemPanel: () => <div data-testid="universal-ecosystem">Universal Ecosystem</div>,
}));

vi.mock('../../../lib/soundEffects.js', () => ({
  SoundFX: {
    play: vi.fn(),
  },
}));

vi.mock('../../../hooks/useBrandAccent.js', () => ({
  useBrandAccent: () => ({
    text: 'text-brand',
    gradient: 'from-brand to-brand-accent',
    bgSofter: 'bg-brand/10',
    borderSoft: 'border-brand/20',
    hoverBorder: 'hover:border-brand',
    blobA: 'bg-brand',
  }),
}));

describe('SwarmDashboard & Modular Constants', () => {
  describe('swarmMission.constants', () => {
    it('provides valid mission suggestions presets', () => {
      expect(MISSION_SUGGESTIONS.length).toBeGreaterThan(0);
      expect(MISSION_SUGGESTIONS[0]).toContain('TransLogística');
    });

    it('contains all 5 pipeline agents in order', () => {
      expect(PIPELINE_AGENTS).toHaveLength(5);
      expect(PIPELINE_AGENTS.map((p) => p.key)).toEqual(['sdr', 'bdr', 'closer', 'crm', 'ops']);
    });

    it('resolves agent names correctly via getAgentName and AGENT_NAMES', () => {
      expect(Object.keys(AGENT_NAMES)).toHaveLength(6);
      expect(getAgentName('supervisor')).toBe('Supervisor (Orquestrador)');
      expect(getAgentName('sdr')).toBe('SDR Autônomo');
      expect(getAgentName('bdr')).toBe('BDR (Outbound)');
      expect(getAgentName('closer')).toBe('Closer Autônomo');
      expect(getAgentName('crm')).toBe('Gestor de CRM');
      expect(getAgentName('ops')).toBe('Agente de Operações');
      expect(getAgentName('unknown')).toBe('Agente');
    });

    it('formats SLO percentages accurately', () => {
      expect(formatPercent({ value: null, numerator: 0, denominator: 0 })).toBe('—');
      expect(formatPercent({ value: 0.854, numerator: 85, denominator: 100 })).toBe('85%');
      expect(formatPercent({ value: 1.0, numerator: 10, denominator: 10 })).toBe('100%');
    });

    it('formats SLO latency milliseconds cleanly', () => {
      expect(formatMs(null)).toBe('—');
      expect(formatMs(450)).toBe('450 ms');
      expect(formatMs(2500)).toBe('2.5 s');
      expect(formatMs(120000)).toBe('2.0 min');
    });

    it('generates unique ids via createId', () => {
      const id1 = createId();
      const id2 = createId();
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('defines labels and colors for all SLO roles', () => {
      const roles = ['SDR', 'BDR', 'CLOSER', 'CRM', 'OPS'] as const;
      for (const role of roles) {
        expect(SLO_ROLE_LABEL[role]).toBeTruthy();
        expect(SLO_ROLE_COLOR[role]).toBeTruthy();
      }
    });
  });

  describe('SwarmDashboard Component', () => {
    it('renders the header and initial waiting state with presets', () => {
      render(<SwarmDashboard />);

      expect(screen.getByText(/Swarm/i)).toBeInTheDocument();
      expect(screen.getByText(/Orquestração Autônoma de Agentes Comerciais/i)).toBeInTheDocument();
      expect(screen.getByText('Aguardando Missão')).toBeInTheDocument();
      expect(screen.getByText(MISSION_SUGGESTIONS[0])).toBeInTheDocument();
    });

    it('populates mission input when clicking a mission suggestion', () => {
      render(<SwarmDashboard />);

      const suggestionButton = screen.getByText(MISSION_SUGGESTIONS[0]);
      fireEvent.click(suggestionButton);

      const input = screen.getByPlaceholderText(
        'O que você deseja que o Swarm faça? (Clique aqui para digitar)',
      ) as HTMLInputElement;
      expect(input.value).toBe(MISSION_SUGGESTIONS[0]);
    });

    it('switches between view tabs', () => {
      render(<SwarmDashboard />);

      const connectorsBtn = screen.getByRole('button', { name: /Ecossistema/i });
      fireEvent.click(connectorsBtn);
      expect(screen.getByTestId('universal-ecosystem')).toBeInTheDocument();

      const missionBtn = screen.getByRole('button', { name: /Missão ao vivo/i });
      fireEvent.click(missionBtn);
      expect(screen.getByText('Aguardando Missão')).toBeInTheDocument();
    });
  });
});
