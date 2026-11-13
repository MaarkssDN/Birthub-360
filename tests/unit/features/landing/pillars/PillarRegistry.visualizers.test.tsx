import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  PILLARS_EDITORIAL_DATA,
  VisualizerAdminOps,
  VisualizerFieldSales,
  VisualizerSocialSelling,
} from '@/features/landing/components/pillars/PillarRegistry';

describe('PillarRegistry — visualizadores 09/10/11', () => {
  it.each([
    ['VisualizerAdminOps', VisualizerAdminOps, /Governança · Admin & Operations/],
    ['VisualizerFieldSales', VisualizerFieldSales, /Field|Campo|Vendas/i],
    ['VisualizerSocialSelling', VisualizerSocialSelling, /ApproachGenerator · Shadow Copy/],
  ] as const)('%s renderiza nos temas dark e light', (_name, Comp, expected) => {
    for (const theme of ['dark', 'light'] as const) {
      const { container, unmount } = render(<Comp theme={theme} />);
      expect(container.textContent).toMatch(expected);
      unmount();
    }
  });

  it('renderVisualizer dos pilares 09, 10 e 11 produz elementos em ambos os temas', () => {
    for (const id of ['09', '10', '11']) {
      const pillar = PILLARS_EDITORIAL_DATA[id];
      expect(pillar).toBeTruthy();
      for (const theme of ['dark', 'light'] as const) {
        const el = pillar.renderVisualizer(theme);
        const { container, unmount } = render(el);
        expect(container.firstChild).toBeTruthy();
        unmount();
      }
    }
  });
});
