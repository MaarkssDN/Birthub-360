// @vitest-environment node
// frontend.ts importa `vite` (→ esbuild), que quebra no jsdom: o realm do jsdom faz
// `TextEncoder().encode("") instanceof Uint8Array` ser false e o esbuild aborta no import.
// O predicado testado é puro — ambiente node é o correto (mesmo padrão de
// tests/unit/bootstrap/frontend.test.ts do PR #415 para a guarda do design-lab).
import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { isBlockedToolsPath, mountFrontend } from '../../../src/bootstrap/frontend.js';

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
 * Guarda anti-bypass dos estáticos de /tools (handoff
 * .agents/handoffs/onda-review-20261119/24-para-00-guarda-antibypass-tools.md).
 * Mesma classe P0 do design-lab: os mounts `/tools` autenticados só casam o
 * prefixo literal, mas express.static(distPath)/vite.middlewares decodificam e
 * servem o mesmo arquivo por aliases — sem a guarda, `/%74ools/...`,
 * `/tools%2F...`, `//tools/...`, `/public/tools/...` e `/@fs/…/public|dist/tools/…`
 * entregariam os HTMLs de public/tools (social-selling) sem authenticateToken.
 */
describe('isBlockedToolsPath', () => {
  it.each([
    '/tools/social-selling/Motor de Social Selling.html',
    '/tools',
    '/TOOLS/x',
    // Paths legítimos que contêm "tools" como segmento intermediário/final NÃO
    // tocam os ativos estáticos — a guarda não pode quebrá-los (SPA fallback,
    // rotas de API e módulos fonte servidos pelo Vite em dev).
    '/dashboard/tools',
    '/api/prospecting/tools/status',
    '/src/features/intelligence/tools/opsTools.ts',
    '/src/features/prospecting/components/prospecting-hub/tools/YoutubeTool.tsx',
    '/@fs/abs/path/src/features/intelligence/tools/opsTools.ts',
    '/app/crm',
    '/',
  ])('permite caminho legítimo: %s', (path) => {
    expect(isBlockedToolsPath(path)).toBe(false);
  });

  it.each([
    // Encoding do primeiro segmento — express.static(dist) decodifica e serve dist/tools.
    '/%74ools/social-selling/x.html',
    '/tools%2Fsocial-selling%2Fx.html',
    '/%2Ftools/x',
    '/tools%2F',
    // Barra dupla — o static normaliza e serve o mesmo arquivo.
    '//tools/x',
    // Alias /public/ e case.
    '/public/tools/social-selling/x.html',
    '/PUBLIC/TOOLS/x',
    // Alias /@fs/ absoluto apontando para public/tools ou dist/tools (dev).
    '/@fs/abs/path/public/tools/social-selling/x.html',
    '/@fs/abs/path/dist/tools/social-selling/x.html',
    '/@fs/C:/repo/public%2Ftools/x',
    // Segmento "tools" no fim também resolve para o diretório.
    '/%74ools',
  ])('bloqueia bypass de /tools: %s', (path) => {
    expect(isBlockedToolsPath(path)).toBe(true);
  });

  it('mantém raw path quando o encoding é malformado', () => {
    expect(isBlockedToolsPath('/tools%ZZ/x')).toBe(false);
    expect(isBlockedToolsPath('/public/tools/%ZZ')).toBe(true);
  });
});

/**
 * Middleware de guarda registrado por mountFrontend: qualquer path que resolva
 * para os ativos de /tools por alias não autorizado precisa receber 404 ANTES
 * de express.static/vite.middlewares — senão o alias decodificado serviria o
 * arquivo sem passar pelo mount autenticado `/tools`.
 */
describe('mountFrontend — guarda anti-bypass /tools', () => {
  async function buildApp() {
    const app = express();
    await mountFrontend(app);
    return app;
  }

  it('responde 404 para aliases de /tools antes de qualquer static', async () => {
    const app = await buildApp();
    for (const alias of [
      '/%74ools/social-selling/x.html',
      '/tools%2Fsocial-selling%2Fx.html',
      '//tools/x',
      '/public/tools/social-selling/x.html',
      '/@fs/abs/path/public/tools/social-selling/x.html',
      '/PUBLIC/TOOLS/x',
    ]) {
      const res = await request(app).get(alias);
      expect(res.status, alias).toBe(404);
    }
  });

  it('deixa passar o prefixo legítimo /tools para o mount autenticado', async () => {
    const app = await buildApp();
    for (const path of ['/tools', '/tools/', '/tools/social-selling/x.html', '/TOOLS/x']) {
      const res = await request(app).get(path);
      // Sobreviveu à guarda (não é o 404 da guarda) e seguiu a cadeia /tools.
      // '/tools' exato pode vir 301 do serve-static (redirect p/ '/tools/') —
      // o que importa é não ter sido bloqueado pela guarda.
      expect(res.status, path).not.toBe(404);
    }
    const resFile = await request(app).get('/tools/social-selling/x.html');
    expect(resFile.status).toBe(200);
  });

  it('deixa passar paths com "tools" que não são os ativos estáticos', async () => {
    const app = await buildApp();
    for (const path of [
      '/dashboard/tools',
      '/api/prospecting/tools/status',
      '/src/features/intelligence/tools/opsTools.ts',
      '/app/crm',
    ]) {
      const res = await request(app).get(path);
      expect(res.status, path).toBe(200);
    }
  });
});
