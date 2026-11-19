import { describe, expect, it } from 'vitest';
import { isBlockedDesignLabPath } from '../../../src/bootstrap/frontend.js';

/**
 * Guarda anti-bypass dos estáticos do design-lab (P0, DEM-20261114-001/003).
 * Cobre os aliases que o Express/Vite decodificam e servem fora do mount
 * autenticado `/design-lab`: encoding, `/public/`, `/@fs/` e variações de caixa.
 */
describe('isBlockedDesignLabPath', () => {
  it.each([
    '/design-lab/assets/lab.css',
    '/design-lab',
    '/src/features/design-lab/pages/Lab.tsx',
    '/app/crm',
    '/tools/social-selling',
    '/',
  ])('permite caminho legítimo: %s', (path) => {
    expect(isBlockedDesignLabPath(path)).toBe(false);
  });

  it.each([
    '/public/design-lab/assets/lab.css',
    '/@fs/abs/path/public/design-lab/assets/lab.css',
    '/foo/design-lab/bar.png',
    '/PUBLIC/design-lab/secret.json',
    '/x%2Fdesign-lab%2Fassets%2Flab.css',
    '/%64esign-lab/assets/lab.css',
  ])('bloqueia bypass do design-lab: %s', (path) => {
    expect(isBlockedDesignLabPath(path)).toBe(true);
  });

  it('mantém raw path quando o encoding é malformado', () => {
    expect(isBlockedDesignLabPath('/design-lab%ZZ/assets')).toBe(false);
    expect(isBlockedDesignLabPath('/public/design-lab/%ZZ')).toBe(true);
  });
});
