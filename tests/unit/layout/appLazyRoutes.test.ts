import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const APP_TSX_PATH = path.join(ROOT, 'src/App.tsx');
const APP_LAYOUT_PATH = path.join(ROOT, 'src/components/layout/AppLayout.tsx');

describe('[31 · Noa] Code-splitting com React.lazy() e Suspense no App Shell', () => {
  it('src/App.tsx importa todas as rotas secundárias e páginas via lazy() e envolve Routes em Suspense', () => {
    const content = readFileSync(APP_TSX_PATH, 'utf-8');
    expect(content).toContain("import { lazy, Suspense } from 'react'");
    expect(content).toContain('<Suspense fallback={<PageFallback />}>');

    const lazyRouteComponents = [
      'SetupWizard',
      'DesignLabPage',
      'CentralModulesHome',
      'SocialSellingHub',
      'ResetPasswordScreen',
      'PrivacyPolicy',
      'TermsOfUse',
      'DsrVerifyPage',
      'DsrStatusPage',
      'Landing360',
      'LandingInnovative',
      'PublicBookingPage',
    ];

    for (const component of lazyRouteComponents) {
      expect(content).toMatch(new RegExp(`const\\s+${component}\\s*=\\s*lazy\\(`));
    }
  });

  it('src/components/layout/AppLayout.tsx mantém code-splitting lazy() nas rotas autenticadas (/app/*)', () => {
    const content = readFileSync(APP_LAYOUT_PATH, 'utf-8');
    expect(content).toContain('lazy(');
    expect(content).toContain('<Suspense');
    const lazyMatches = content.match(/=\s*lazy\(/g) ?? [];
    expect(lazyMatches.length).toBeGreaterThanOrEqual(15);
  });
});
