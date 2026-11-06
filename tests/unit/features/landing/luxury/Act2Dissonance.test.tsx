import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Act2Dissonance } from '@/features/landing/luxury/components/Act2Dissonance';

describe('Act2Dissonance', () => {
  it('renderiza o cabeçalho oficial com tag de alerta e título da tese', () => {
    render(<Act2Dissonance />);

    expect(screen.getByText(/A Anatomia da Fuga de Receita/i)).toBeInTheDocument();
    expect(screen.getByText(/A ilusão das/i)).toBeInTheDocument();
    expect(screen.getByText(/ferramentas isoladas/i)).toBeInTheDocument();
  });

  it('renderiza o ecossistema de integrações e a comparação retalhado vs soberano', () => {
    render(<Act2Dissonance />);

    // Verifica plataformas no carrossel de ecossistema
    expect(screen.getByText('Bitrix24')).toBeInTheDocument();
    expect(screen.getByText('Salesforce')).toBeInTheDocument();
    expect(screen.getByText('HubSpot')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();

    // Verifica cards de contraste arquitetural
    expect(screen.getByText(/O Ecossistema Retalhado/i)).toBeInTheDocument();
    expect(screen.getByText(/ALTO RISCO/i)).toBeInTheDocument();
    expect(screen.getByText(/Central de Comando Unificada/i)).toBeInTheDocument();
    expect(screen.getByText(/SOBERANO/i)).toBeInTheDocument();
    expect(screen.getByText(/Fluxo contínuo 360º/i)).toBeInTheDocument();
  });
});
