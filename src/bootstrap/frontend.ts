import fs from 'node:fs';
import path from 'node:path';
import type { Express } from 'express';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import { env } from '../config/env.js';
import { authenticateToken } from '../shared/middlewares/authenticateToken.js';

// CodeQL (achado real de finalização, PR #344): `app.get('*', ...)` nunca era reconhecido pelo
// analisador de rotas do Express 5/path-to-regexp v8 (o mesmo motivo do bug de boot corrigido
// acima) — assim que virou `/{*splat}` (sintaxe válida), o CodeQL passou a enxergar este handler
// como uma rota real que faz acesso a disco (`res.sendFile`) sem rate limit. Limite bem mais
// generoso que `apiLimiter` (rateLimiters.ts) de propósito: esta rota serve o shell da SPA pra
// QUALQUER caminho não estático — todo carregamento/recarregamento de página passa por aqui, não
// só chamadas de API — um limite apertado quebraria navegação legítima. Store em memória (não
// Redis) por ser um limitador só de defesa contra abuso bruto, não uma trava de negócio que
// precise ficar sincronizada entre instâncias.
const spaFallbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1200,
  standardHeaders: true,
  legacyHeaders: false,
});

// CodeQL ("Missing rate limiting"): a análise exige que o rate limit esteja visível na mesma
// rota que faz a autorização — um limiter equivalente montado em outro arquivo
// (src/bootstrap/rateLimiters.ts, antes de mountFrontend) é correto em runtime mas não satisfaz
// essa checagem entre arquivos. Mesmo perfil de risco do apiLimiter (leitura autenticada, sem
// mutação de estado): materiais de capacitação comercial, não dado de tenant.
const toolsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.API_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Decide se um path cru (req.path) alcança um diretório estático protegido (`tools`,
 * `design-lab`) por fora do mount autenticado. O path é canonicalizado como o
 * express.static/send (decode, `\` → `/`, colapso de `//`, resolução de `.`/`..`) e a decisão
 * é sobre a forma canônica — as isenções de `isExempt` só valem nela.
 *
 * Paths ambíguos (cuja forma canônica difere da decodificada, ou com separador codificado) que
 * mencionem o diretório são sempre bloqueados: send, Vite e proxies normalizam em ordens
 * diferentes (decode→normalize vs. normalize→decode; `\` só é separador no Windows), então
 * nenhuma forma canônica única representa o arquivo que cada um serviria. Nenhum cliente legítimo
 * emite esses paths — o navegador resolve `..` antes de enviar.
 */
function bypassesProtectedStatic(
  rawPath: string,
  dir: 'design-lab' | 'tools',
  isExempt: (canonicalPath: string) => boolean,
): boolean {
  let decodedPath = rawPath;
  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch {
    // Path malformado: mantém o raw — o static downstream já rejeita encoding inválido.
  }
  const unifiedPath = decodedPath.replace(/\\/g, '/');
  // Nome curto 8.3 do Windows (`DESIGN~1`).
  if (new RegExp(`(?:^|/)${dir.slice(0, 6)}~[0-9]`, 'i').test(unifiedPath)) return true;
  // `u` + `i`: case folding Unicode (`ſ` = `s`), como em filesystems case-insensitive.
  if (!new RegExp(`(?:^|/)${dir}(?:[/:]|$)`, 'iu').test(unifiedPath)) return false;

  const canonicalPath = path.posix.normalize(`/${unifiedPath}`);
  if (canonicalPath !== decodedPath || /%(?:2f|5c)/i.test(rawPath)) return true;
  // `tools::$INDEX_ALLOCATION` abre o próprio diretório em NTFS (stream alternativo).
  if (new RegExp(`/${dir}:`, 'iu').test(canonicalPath)) return true;

  // Prefixo legítimo é o que o mount autenticado casa: literal e sem decode (`/%74ools` não casa).
  return !new RegExp(`^/${dir}(?:/|$)`, 'i').test(rawPath) && !isExempt(canonicalPath);
}

/**
 * Predicado puro da guarda anti-bypass do design-lab — extraído para teste unitário.
 * Qualquer segmento `design-lab` fora do prefixo `/design-lab` é bloqueado, exceto o código-fonte
 * servido pelo Vite em dev (`/src/features/design-lab/`).
 */
export function isBlockedDesignLabPath(rawPath: string): boolean {
  return bypassesProtectedStatic(rawPath, 'design-lab', (canonicalPath) =>
    /^\/src\/features\/design-lab\//iu.test(canonicalPath),
  );
}

/**
 * Predicado puro da guarda anti-bypass dos estáticos de /tools — mesma classe de
 * vulnerabilidade P0 do design-lab (DEM-20261114-001/003, guarda do PR #415). Cobre aliases como
 * `/%74ools/...`, `/tools%2F...`, `//tools/...`, `/x/..%2Ftools/...`, `/public/tools/...` e
 * `/@fs/<abs>/public|dist/tools/...` (dev).
 *
 * Diferente do design-lab, `tools` é segmento comum fora dos ativos. Na forma canônica são
 * legítimos, desde que não passem por `public|dist/tools`: `tools` como último segmento (rota SPA
 * `/dashboard/tools`) e qualquer coisa sob `/api/`, `/app/` (rotas SPA), `/design-lab/` (mount
 * próprio autenticado), `/src/`, `/node_modules/` ou `/@…/` (módulos servidos pelo Vite em dev).
 */
export function isBlockedToolsPath(rawPath: string): boolean {
  return bypassesProtectedStatic(
    rawPath,
    'tools',
    (canonicalPath) =>
      !/^\/tools(?:\/|$)|\/(?:public|dist)\/tools(?:\/|$)/iu.test(canonicalPath) &&
      (!/\/tools\/./iu.test(canonicalPath) ||
        /^\/(?:api|app|src|node_modules|design-lab|@[^/]+)\//iu.test(canonicalPath)),
  );
}

/**
 * Serve o frontend: em desenvolvimento (ou em testes quando não houver build), monta o middleware
 * do Vite (HMR, SPA fallback) em modo middleware embutido no mesmo processo Express; em produção
 * (ou em testes quando `dist/index.html` estiver compilado), serve os estáticos já buildados em
 * `dist/` e devolve `index.html` para qualquer rota não estática (SPA client-side routing).
 * Assíncrono porque `createViteServer` é assíncrono — precisa ser aguardado antes do error
 * handler e do restante do boot em server.ts.
 */
export async function mountFrontend(app: Express): Promise<void> {
  // Guarda anti-bypass dos estáticos do design-lab e de /tools (achados P0 DEM-20261114-001/003 e PR #415).
  // Os mounts `/design-lab` e `/tools` autenticados abaixo só casam o prefixo literal — um path como
  // `/design-lab%2Fassets%2Flab.css`, `/tools%2F...`, `/%74ools/...`, `/public/tools/...` ou
  // `/@fs/<abs>/public/tools/...` (aliases que o Vite dev ou express.static servem fora do mount)
  // não casa o prefixo, mas os middlewares estáticos decodificam e servem o MESMO arquivo
  // sem autenticação. Aqui o path é canonicalizado como o static faz e o que alcançar esses
  // diretórios fora do prefixo legítimo é bloqueado com 404 antes de qualquer static.
  app.use((req, res, next) => {
    if (isBlockedDesignLabPath(req.path) || isBlockedToolsPath(req.path)) {
      res.status(404).end();
      return;
    }
    next();
  });

  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));
  const useStaticDist =
    env.NODE_ENV === 'production' ||
    process.env.SERVE_STATIC_DIST === 'true' ||
    (env.NODE_ENV === 'test' && hasDist);

  if (!useStaticDist) {
    // FRONTEND-001: Serve estáticos do /tools protegido por autenticação para evitar
    // acesso desprotegido a ferramentas e materiais de capacitação comercial
    app.use(
      '/tools',
      toolsLimiter,
      authenticateToken,
      express.static(path.join(process.cwd(), 'public', 'tools')),
    );

    // Protege arquivos estáticos do design-lab com autenticação em desenvolvimento
    app.use(
      '/design-lab',
      toolsLimiter,
      authenticateToken,
      express.static(path.join(process.cwd(), 'public', 'design-lab')),
    );

    const vite = await createViteServer({
      server: { middlewareMode: true, host: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');

    // Ferramentas estáticas legadas (public/tools/** — hoje só social-selling; propostas
    // comerciais, portal comercial e treinamento foram aposentados em 09/2026, conteúdo
    // proprietário da Birth Hub 360) dependem de <script> inline e onclick="" espalhados pelos
    // arquivos HTML pré-existentes. A CSP estrita do Helmet (`script-src 'self'`, sem
    // unsafe-inline — ver security.ts) bloqueia TODO esse JS em produção: nenhum botão desses
    // HTMLs funciona (ex.: os botões de abrir ferramenta em Motor de Social Selling Birth Hub 360.html),
    // sem nenhum erro visível ao usuário, só um "Refused to execute inline script" no console do
    // navegador.
    // Reescrever o JS inline de dezenas de arquivos legados para scripts externos é um retrabalho
    // grande demais para este fix — em vez disso, relaxa script-src só para ESTE caminho estático
    // (conteúdo próprio do produto, nunca dado de usuário refletido), sobrescrevendo aqui o header
    // que o Helmet global já setou. O resto do app (rotas autenticadas do CRM, onde entrada de
    // usuário é renderizada) mantém a CSP estrita — este relaxamento não amplia a superfície de
    // XSS lá, só neste conjunto de arquivos estáticos que já é assim há tempos.
    app.use('/tools', (_req, res, next) => {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'",
      );
      next();
    });
    app.use(
      '/tools',
      toolsLimiter,
      authenticateToken,
      express.static(path.join(process.cwd(), 'public', 'tools')),
    );

    // Protege arquivos estáticos do design-lab com autenticação
    app.use(
      '/design-lab',
      toolsLimiter,
      authenticateToken,
      express.static(path.join(process.cwd(), 'public', 'design-lab')),
    );

    app.use(express.static(distPath));

    // Nota (09/2026): existia aqui um mount de `/_next` (produção) para o export estático Next.js
    // de `dist/tools/treinamento-birthhub360/` — módulo executivo aposentado — conteúdo proprietário
    // da Birth Hub 360, pedido explícito do usuário. Removido junto com o diretório estático.

    // Express 5 (path-to-regexp v8) não aceita mais o wildcard nu `'*'` — o processo morria no
    // boot com `PathError: Missing parameter name at index 1: *` (Render, deploys de 03/09/2026,
    // commits 6624fda/5cd0a2d, ambos `update_failed`). A CI nunca pegou porque o E2E roda com
    // NODE_ENV=test, que cai no branch do Vite acima e nunca executa este fallback de produção —
    // ver scripts/ci/smoke-production-boot.mjs, que passou a exercitar exatamente este caminho.
    // `/{*splat}` é a sintaxe oficial do Express 5 para "qualquer caminho, inclusive a raiz".
    app.get('/{*splat}', spaFallbackLimiter, (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}
