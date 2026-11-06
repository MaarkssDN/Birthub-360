// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { PillarSettingsPlaceholder } from '../../../../src/features/settings/components/PillarSettingsPlaceholder.js';

describe('PillarSettingsPlaceholder — Reality Verification (B-06 / Agente 22)', () => {
  it('apresenta aviso honesto de roadmap/indisponibilidade de gravacao e mantem o botao Salvar desabilitado sem simulacao falsa', () => {
    render(<PillarSettingsPlaceholder pillarName="Hub Comercial" />);

    // Verifica que o botao de salvar esta explicitamente desabilitado e com rotulo honesto
    const saveBtn = screen.getByRole('button', { name: /Salvar indispon/i });
    expect(saveBtn).toBeDisabled();

    // Verifica que existe badge clara de roadmap (Em breve)
    expect(screen.getByText('Em breve')).toBeInTheDocument();
  });
});
