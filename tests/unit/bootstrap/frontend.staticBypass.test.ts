// @vitest-environment node
// Regressão M-P0-07: exercita o ramo de PRODUÇÃO de mountFrontend com um dist/ real em diretório
// temporário e express.static/send de verdade (sem mock). O cliente escreve a
// request line direto no socket porque supertest/fetch resolvem `..` e `\` antes de enviar (e
// interceptadores de http.request rejeitam absolute-form), mascarando o bypass.
// Invariante: nenhum path sem autenticação devolve bytes de dist/tools ou dist/design-lab.
import fs from 'node:fs';
import type http from 'node:http';
import net, { type AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  isBlockedDesignLabPath,
  isBlockedToolsPath,
  mountFrontend,
} from '../../../src/bootstrap/frontend.js';

vi.mock('vite', () => ({ createServer: vi.fn() }));

vi.mock('../../../src/shared/middlewares/authenticateToken.js', () => ({
  authenticateToken: (
    req: { headers: Record<string, unknown> },
    res: { status: (n: number) => { end: () => void } },
    next: () => void,
  ) => (req.headers['x-test-auth'] === 'ok' ? next() : res.status(401).end()),
}));

const DIRS = ['tools', 'design-lab'] as const;
const marker = (dir: string) => `CONTEUDO-PROTEGIDO-${dir}`;
const SHELL = 'SHELL-SPA';

let root: string;
let server: http.Server;

function rawGet(rawPath: string, auth = false): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const { port } = server.address() as AddressInfo;
    const socket = net.connect(port, '127.0.0.1', () => {
      const head = [`GET ${rawPath} HTTP/1.1`, 'Host: x', 'Connection: close'];
      if (auth) head.push('x-test-auth: ok');
      socket.write(`${head.join('\r\n')}\r\n\r\n`);
    });
    let raw = '';
    socket.setEncoding('utf8');
    socket.on('data', (chunk: string) => {
      raw += chunk;
    });
    socket.on('error', reject);
    socket.on('end', () => {
      const headEnd = raw.indexOf('\r\n\r\n');
      resolve({ status: Number(raw.split(' ')[1]), body: raw.slice(headEnd + 4) });
    });
  });
}

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'bh360-static-bypass-'));
  const dist = path.join(root, 'dist');
  for (const dir of DIRS) {
    fs.mkdirSync(path.join(dist, dir), { recursive: true });
    fs.writeFileSync(path.join(dist, dir, 's.txt'), marker(dir));
  }
  fs.mkdirSync(path.join(dist, 'assets'));
  fs.writeFileSync(path.join(dist, 'assets', 'app.txt'), 'ASSET-PUBLICO');
  fs.writeFileSync(path.join(dist, 'index.html'), SHELL);

  vi.spyOn(process, 'cwd').mockReturnValue(root);
  vi.stubEnv('SERVE_STATIC_DIST', 'true');
  const app = express();
  await mountFrontend(app);
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => resolve());
  });
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  fs.rmSync(root, { recursive: true, force: true });
});

describe.each(DIRS)('estáticos de /%s sem autenticação (socket cru, dist real)', (dir) => {
  const hexFirst = dir.charCodeAt(0).toString(16);
  const otherDir = DIRS.find((d) => d !== dir);

  it.each([
    `/x/..%2F${dir}/s.txt`,
    `/x/..%2F${dir}%2Fs.txt`,
    `/x/../${dir}/s.txt`,
    `/./${dir}/s.txt`,
    `/%2E/${dir}/s.txt`,
    `/x/%2e%2e/${dir}/s.txt`,
    `/x%2F..%2F${dir}/s.txt`,
    `/.%2F${dir}/s.txt`,
    `/x/..%5C${dir}%5Cs.txt`,
    `/${dir}%5Cs.txt`,
    `/%5C${dir}%5Cs.txt`,
    `/x\\..\\${dir}\\s.txt`,
    `/x/../${dir.toUpperCase()}/s.txt`,
    `/src/features/${dir}/..%2F..%2F..%2F${dir}%2Fs.txt`,
    `/src/features/${dir}/../../../${dir}/s.txt`,
    `/api/../${dir}/s.txt`,
    `/app/..%2F${dir}/s.txt`,
    `/@fs/../${dir}/s.txt`,
    // `\` é caractere literal no Linux e separador no Windows: as duas leituras precisam barrar.
    `/a%5Cb/../${dir}/s.txt`,
    `/a%5Cb%2F..%2F${dir}%2Fs.txt`,
    // normalize→decode (Vite/proxy) e decode→normalize (send) divergem aqui.
    `/a%2Fb/../${dir}/s.txt`,
    `/a%2Fb/../../${dir}/s.txt`,
    `/${dir}%2Fs.txt`,
    `//${dir}/s.txt`,
    `/%2F${dir}/s.txt`,
    `/%${hexFirst}${dir.slice(1)}/s.txt`,
    // O outro mount autenticado não pode servir de trampolim.
    `/${otherDir}/..%2F${dir}%2Fs.txt`,
  ])('bloqueia com 404: %s', async (rawPath) => {
    const res = await rawGet(rawPath);
    expect(res.body).not.toContain(marker(dir));
    expect(res.status).toBe(404);
  });

  // Formas que o static não resolve para o ativo, ou que caem no mount: o contrato é não vazar.
  it.each([
    `/x/%252e%252e/${dir}/s.txt`,
    `/x/..%252F${dir}%252Fs.txt`,
    `/%252e/${dir}/s.txt`,
    `/%25${hexFirst}${dir.slice(1)}/s.txt`,
    `/${dir}%00/s.txt`,
    `/x%00/../${dir}/s.txt`,
    `/x/../${dir}/%ZZ/../s.txt`,
    `/x/..%2F${dir}/s.txt%ZZ`,
    `/${dir}%ZZ/../${dir}/s.txt`,
    `/${dir}/../${dir}/s.txt`,
    `/${dir}//s.txt`,
    `/${dir}/./s.txt`,
    `/${dir}/s.txt/`,
    `/${dir}./s.txt`,
    `/${dir}%20/s.txt`,
    `/${dir.replace('s', '%C5%BF')}/s.txt`,
    // Aliases do Windows: stream NTFS do diretório/arquivo.
    `/${dir}::$INDEX_ALLOCATION/s.txt`,
    `/${dir}:$I30:$INDEX_ALLOCATION/s.txt`,
    `/${dir}/s.txt::$DATA`,
    `/x/../${dir}::$INDEX_ALLOCATION/s.txt`,
    `/foo/${dir}/s.txt`,
    `/x%2F${dir}%2Fs.txt`,
    `http://h/x/../${dir}/s.txt`,
  ])('não vaza conteúdo: %s', async (rawPath) => {
    expect((await rawGet(rawPath)).body).not.toContain(marker(dir));
  });

  it.each([`/${dir}/s.txt`, `/${dir.toUpperCase()}/s.txt`, `/${dir}/`, `/${dir}`])(
    'exige autenticação no prefixo legítimo: %s',
    async (rawPath) => {
      expect((await rawGet(rawPath)).status).toBe(401);
    },
  );

  it('serve o ativo para requisição autenticada', async () => {
    expect(await rawGet(`/${dir}/s.txt`, true)).toEqual({ status: 200, body: marker(dir) });
  });

  it('mantém o alias bloqueado mesmo autenticado', async () => {
    expect((await rawGet(`/x/..%2F${dir}%2Fs.txt`, true)).status).toBe(404);
  });
});

it.each(['/DESIGN~1/s.txt', '/design%7E1/s.txt', '/x/..%5CDESIGN~1%5Cs.txt'])(
  'bloqueia o nome curto 8.3 do Windows: %s',
  async (rawPath) => {
    expect((await rawGet(rawPath)).status).toBe(404);
  },
);

describe('rotas legítimas continuam acessíveis sem autenticação', () => {
  it.each([
    '/',
    '/welcome',
    '/dashboard/tools',
    '/dashboard/tools/',
    '/app/crm',
    '/app/tools/x',
    '/app/x%20y',
    '/book/a%2Fb',
  ])('devolve o shell da SPA: %s', async (rawPath) => {
    expect(await rawGet(rawPath)).toEqual({ status: 200, body: SHELL });
  });

  it('devolve asset público', async () => {
    expect(await rawGet('/assets/app.txt')).toEqual({ status: 200, body: 'ASSET-PUBLICO' });
  });
});

describe('predicados — ramo dev (vite, /@fs/)', () => {
  it.each([
    '/src/features/intelligence/tools/crmTools.ts',
    '/node_modules/pkg/tools/index.js',
    '/@fs/C:/repo/src/lib/ai/tools/registry.ts',
    '/@fs/C:/repo/node_modules/pkg/tools/index.js',
    '/@id/pkg/tools/index.js',
    '/design-lab/tools/x.js',
  ])('permite %s', (p) => {
    expect(isBlockedToolsPath(p)).toBe(false);
  });

  it.each([
    '/@fs/C:/repo/src/../public/tools/s.txt',
    '/@fs/C:/repo/public%5Ctools%5Cs.txt',
    '/@fs/C:/repo/dist/tools/s.txt',
    '/src/features/x/..%2F..%2F..%2Fpublic%2Ftools%2Fs.txt',
    '/node_modules/../public/tools/s.txt',
  ])('bloqueia %s', (p) => {
    expect(isBlockedToolsPath(p)).toBe(true);
    expect(isBlockedDesignLabPath(p.replace('tools', 'design-lab'))).toBe(true);
  });
});
