// @vitest-environment node
// frontend.ts importa `vite` (→ esbuild), que quebra no jsdom: o realm do jsdom faz
// `TextEncoder().encode("") instanceof Uint8Array` ser false e o esbuild aborta no import.
// O predicado testado é puro — ambiente node é o correto (mesmo padrão de tests/unit/ci/*).
import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import {
  isBlockedDesignLabPath,
  isBlockedToolsPath,
  mountFrontend,
} from '../../../src/bootstrap/frontend.js';

// mountFrontend chama createViteServer no branch de dev/test — mockado para não subir um
// servidor Vite de verdade dentro do teste unitário. O middleware fake responde 200 para
// qualquer path que sobreviver à guarda, provando que a requisição passou por ela.
vi.mock('vite', () => ({
  // frontend.ts importa `createServer as createViteServer` — o mock precisa expor o
  // nome original do export para o Vitest resolver o alias.
  createServer: vi.fn(async () => ({
    middlewares: (_req: unknown, res: { status: (n: number) => { end: (b: string) => void } }) => {
      res.status(200).end('vite-dev');
    },
  })),
}));

// authenticateToken real dependeria de better-auth/prisma (sessão no banco). Aqui só
// interessa a guarda anti-bypass — o mount autenticado é reduzido a next().
vi.mock('../../../src/shared/middlewares/authenticateToken.js', () => ({
  authenticateToken: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

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

/**
 * Guarda anti-bypass dos estáticos de /tools (P0, handoff 24→00 PR #415).
 * Cobre os aliases que o Express/Vite decodificam e servem fora do mount
 * autenticado `/tools`: encoding, `/public/`, `/@fs/` e variações de caixa,
 * preservando módulos legítimos sob `/src/`.
 */
describe('isBlockedToolsPath', () => {
  it.each([
    '/tools/social-selling',
    '/tools',
    '/src/features/intelligence/tools/crmTools.ts',
    '/src/features/prospecting/components/prospecting-hub/tools/ApolloTool.tsx',
    '/src/lib/ai/tools/registry.ts',
    '/app/crm',
    '/design-lab/assets/lab.css',
    '/',
  ])('permite caminho legítimo: %s', (path) => {
    expect(isBlockedToolsPath(path)).toBe(false);
  });

  it.each([
    '/public/tools/social-selling/index.html',
    '/@fs/abs/path/public/tools/social-selling/index.html',
    '/foo/tools/bar.html',
    '/PUBLIC/tools/secret.html',
    '/tools%2Fsocial-selling',
    '/%74ools/social-selling',
    '/x%2Ftools%2Fsocial-selling',
  ])('bloqueia bypass de /tools: %s', (path) => {
    expect(isBlockedToolsPath(path)).toBe(true);
  });

  it('mantém raw path quando o encoding é malformado', () => {
    expect(isBlockedToolsPath('/tools%ZZ/assets')).toBe(false);
    expect(isBlockedToolsPath('/public/tools/%ZZ')).toBe(true);
  });
});

/**
 * Middleware de guarda registrado por mountFrontend (P0, DEM-20261114-001/003):
 * qualquer path que toque um asset do design-lab por alias não autorizado precisa
 * receber 404 ANTES de express.static/vite.middlewares — senão o alias decodificado
 * serviria o arquivo sem passar pelo mount autenticado `/design-lab`.
 */
describe('mountFrontend — guarda anti-bypass design-lab e /tools', () => {
  async function buildApp() {
    const app = express();
    await mountFrontend(app);
    return app;
  }

  it('responde 404 para aliases de design-lab antes de qualquer static', async () => {
    const app = await buildApp();
    for (const alias of [
      '/public/design-lab/assets/lab.css',
      '/@fs/abs/path/public/design-lab/secret.json',
      '/foo/design-lab/bar.png',
      '/PUBLIC/design-lab/secret.json',
    ]) {
      const res = await request(app).get(alias);
      expect(res.status, alias).toBe(404);
    }
  });

  it('responde 404 para aliases e encodings de /tools antes de qualquer static', async () => {
    const app = await buildApp();
    for (const alias of [
      '/public/tools/social-selling/index.html',
      '/@fs/abs/path/public/tools/social-selling/index.html',
      '/tools%2Fsocial-selling',
      '/%74ools/social-selling',
      '/foo/tools/bar.html',
      '/PUBLIC/tools/secret.html',
    ]) {
      const res = await request(app).get(alias);
      expect(res.status, alias).toBe(404);
    }
  });

  it('deixa passar o prefixo legítimo /design-lab para o mount autenticado', async () => {
    const app = await buildApp();
    const res = await request(app).get('/design-lab/assets/lab.css');
    // Sobreviveu à guarda (não é 404) e seguiu a cadeia /design-lab → vite mock.
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(200);
  });

  it('deixa passar o prefixo legítimo /tools/x para o mount autenticado', async () => {
    const app = await buildApp();
    const res = await request(app).get('/tools/x');
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(200);
  });

  it('deixa passar paths comuns e módulos fonte do design-lab e de tools', async () => {
    const app = await buildApp();
    for (const path of [
      '/app/crm',
      '/src/features/design-lab/pages/Lab.tsx',
      '/src/features/intelligence/tools/crmTools.ts',
      '/src/lib/ai/tools/registry.ts',
      '/tools/x',
    ]) {
      const res = await request(app).get(path);
      expect(res.status, path).toBe(200);
    }
  });
});
