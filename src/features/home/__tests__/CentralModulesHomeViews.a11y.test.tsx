// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import {
  BentoEditorialView,
  GridModularView,
  HubOrbitalView,
  WorkflowPipelineView,
} from '../CentralModulesHomeViews.js';
import { PRODUCT_MODULES } from '../../../components/layout/moduleRegistry.js';

/**
 * Regressão do handoff `.agents/handoffs/onda-3/34-para-30-a11y-paths-sem-owner.md`
 * (item 1): cards de módulo da Central de Módulos eram `<div>`/`motion.div` com
 * `onClick` sem papel, foco ou tecla — WCAG 2.1.1 (Teclado) e 4.1.2
 * (Nome/Papel/Valor). As 4 views foram corrigidas com role="button",
 * tabIndex={0} e ativação por Enter/Espaço.
 */

const modules = PRODUCT_MODULES.slice(0, 4);
const views = [
  ['BentoEditorialView', BentoEditorialView],
  ['GridModularView', GridModularView],
  ['HubOrbitalView', HubOrbitalView],
  ['WorkflowPipelineView', WorkflowPipelineView],
] as const;

describe('CentralModulesHomeViews — cards de módulo acessíveis por teclado', () => {
  for (const [name, View] of views) {
    it(`${name}: cards expõem role="button" e tabIndex=0`, () => {
      render(<View modules={[...modules]} onNavigate={vi.fn()} isDark={false} />);

      const cards = screen.getAllByRole('button');
      expect(cards.length).toBeGreaterThan(0);
      for (const card of cards) {
        expect(card).toHaveAttribute('tabindex', '0');
      }
    });

    it(`${name}: Enter e Espaço disparam onNavigate`, () => {
      const onNavigate = vi.fn();
      render(<View modules={[...modules]} onNavigate={onNavigate} isDark={false} />);

      const card = screen.getAllByRole('button')[0];
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(onNavigate).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(card, { key: ' ' });
      expect(onNavigate).toHaveBeenCalledTimes(2);
    });
  }
});
