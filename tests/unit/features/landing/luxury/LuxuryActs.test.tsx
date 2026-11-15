import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Act1Hero } from '@/features/landing/luxury/components/Act1Hero';
import { Act3Singularity } from '@/features/landing/luxury/components/Act3Singularity';
import { Act4TacticalEngine } from '@/features/landing/luxury/components/Act4TacticalEngine';
import { Act5SovereigntyMetrics } from '@/features/landing/luxury/components/Act5SovereigntyMetrics';

vi.mock('@/lib/soundEffects', () => ({
  SoundFX: { play: vi.fn() },
}));

// BirthHubOrbit360 é lazy (r3f/three) — stub para não carregar WebGL no jsdom.
vi.mock('@/components/brand/BirthHubOrbit360', () => ({
  BirthHubOrbit360: () => <div data-testid="birthhub-orbit-360" />,
}));

import { SoundFX } from '@/lib/soundEffects';

const playMock = vi.mocked(SoundFX.play);

beforeEach(() => {
  playMock.mockClear();
});

describe('Act1Hero', () => {
  it('renderiza manchete, badge de telemetria e indicadores de segurança', async () => {
    render(<Act1Hero />);

    expect(screen.getByText('Arquitetura de Comando 360º · 2026')).toBeInTheDocument();
    expect(screen.getByText('A inteligência de negócios.')).toBeInTheDocument();
    expect(screen.getByText('Unificada e soberana.')).toBeInTheDocument();
    expect(screen.getByText('Multi-Tenant RLS')).toBeInTheDocument();
    expect(screen.getByText('100% LGPD Nativo')).toBeInTheDocument();
    expect(screen.getByText('Tempo Real / 120 FPS')).toBeInTheDocument();

    // Lazy Suspense resolve o stub da órbita 360
    expect(await screen.findByTestId('birthhub-orbit-360')).toBeInTheDocument();
  });

  it('CTA primário dispara som e onOpenPrivateAccess; link secundário toca som de foco', () => {
    const onOpenPrivateAccess = vi.fn();
    render(<Act1Hero onOpenPrivateAccess={onOpenPrivateAccess} />);

    fireEvent.click(screen.getByRole('button', { name: /Solicitar Demonstração Executiva/i }));
    expect(playMock).toHaveBeenCalledWith('confirm');
    expect(onOpenPrivateAccess).toHaveBeenCalledTimes(1);

    const secondary = screen.getByRole('link', { name: /Compreender a Arquitetura/i });
    expect(secondary).toHaveAttribute('href', '#tese');
    fireEvent.pointerDown(secondary);
    expect(playMock).toHaveBeenCalledWith('focus');
  });
});

describe('Act3Singularity', () => {
  it('renderiza os 4 quadrantes do ciclo com detalhes e tag de matriz', () => {
    render(<Act3Singularity />);

    expect(screen.getByText('A Matriz Contínua 360º')).toBeInTheDocument();
    expect(screen.getByText('Quatro movimentos contínuos.')).toBeInTheDocument();
    expect(screen.getByText('Fluxo Orbital:')).toBeInTheDocument();

    for (const title of ['DADOS', 'INTELIGÊNCIA', 'DECISÃO', 'EXECUÇÃO']) {
      expect(screen.getByRole('button', { name: new RegExp(title) })).toBeInTheDocument();
    }
    expect(screen.getByText('INGESTÃO UNIFICADA')).toBeInTheDocument();
    expect(screen.getByText('CÉREBRO COGNITIVO')).toBeInTheDocument();
    expect(screen.getByText('DIREÇÃO ESTRATÉGICA')).toBeInTheDocument();
    expect(screen.getByText('VELOCIDADE DE AÇÃO')).toBeInTheDocument();
  });

  it('seleciona o quadrante clicado (estado ativo com escala/ring)', () => {
    render(<Act3Singularity />);

    const execButton = screen.getByRole('button', { name: /EXECUÇÃO/ });
    expect(execButton.className).not.toContain('scale-[1.03]');

    fireEvent.click(execButton);
    expect(execButton.className).toContain('scale-[1.03]');

    // O indicador de progresso reflete o quadrante ativo
    expect(screen.getByText('EXECUÇÃO', { selector: 'span.font-bold' })).toBeInTheDocument();
  });
});

describe('Act4TacticalEngine', () => {
  it('renderiza o console na visão default (Copiloto em Chamada) com cronômetro ao vivo', () => {
    render(<Act4TacticalEngine />);

    expect(screen.getByText('CONSOLE EXECUTIVO · BIRTH-HUB-OS v2.0')).toBeInTheDocument();
    expect(screen.getByText('Sessão de Voz Ativa #8291')).toBeInTheDocument();
    expect(screen.getByText(/04:12 ao vivo/)).toBeInTheDocument();
    expect(screen.getByText(/Objeção Detectada em Tempo Real/i)).toBeInTheDocument();
    expect(screen.getByText(/Prescrição do Copiloto/i)).toBeInTheDocument();
    expect(screen.getByText('84% de Fechamento')).toBeInTheDocument();
  });

  it('alterna para a visão Enxame de Agentes IA e para Telemetria de Negócios', () => {
    render(<Act4TacticalEngine />);

    fireEvent.click(screen.getByRole('button', { name: 'Enxame de Agentes IA' }));
    expect(screen.getByText('AGENTE 05 · PROSPECÇÃO')).toBeInTheDocument();
    expect(screen.getByText('AGENTE 07 · COPILOTO IA')).toBeInTheDocument();
    expect(screen.getByText('AGENTE 12 · VOZ & CALLS')).toBeInTheDocument();
    expect(screen.getByText(/1\.240 contas analisadas hoje/)).toBeInTheDocument();
    expect(playMock).toHaveBeenCalledWith('click');

    fireEvent.click(screen.getByRole('button', { name: 'Telemetria de Negócios' }));
    expect(screen.getByText('R$ 4.280.000')).toBeInTheDocument();
    expect(screen.getByText('R$ 2.940.000')).toBeInTheDocument();
    expect(screen.getByText('3 Contas')).toBeInTheDocument();
    expect(screen.getByText('114% Atingimento')).toBeInTheDocument();
    expect(screen.getByText(/Zero latência de dados/i)).toBeInTheDocument();
  });
});

describe('Act5SovereigntyMetrics', () => {
  it('renderiza as 4 métricas do Índice de Soberania e os selos de conformidade', () => {
    render(<Act5SovereigntyMetrics />);

    expect(screen.getByText('O Índice de Soberania')).toBeInTheDocument();
    expect(screen.getByText('+42%')).toBeInTheDocument();
    expect(screen.getByText('< 12ms')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('360º')).toBeInTheDocument();
    expect(screen.getByText('Velocidade de Avanço no Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Isolamento Multi-Tenant (RLS)')).toBeInTheDocument();

    expect(screen.getByText('Criptografia Ponta a Ponta')).toBeInTheDocument();
    expect(screen.getByText('Conformidade LGPD Nativa')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL com RLS')).toBeInTheDocument();
    expect(screen.getByText('Infraestrutura de Baixa Latência')).toBeInTheDocument();
  });
});
