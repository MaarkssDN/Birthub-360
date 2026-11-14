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
 * Serve o frontend: em desenvolvimento (ou em testes quando não houver build), monta o middleware
 * do Vite (HMR, SPA fallback) em modo middleware embutido no mesmo processo Express; em produção
 * (ou em testes quando `dist/index.html` estiver compilado), serve os estáticos já buildados em
 * `dist/` e devolve `index.html` para qualquer rota não estática (SPA client-side routing).
 * Assíncrono porque `createViteServer` é assíncrono — precisa ser aguardado antes do error
 * handler e do restante do boot em server.ts.
 */
export async function mountFrontend(app: Express): Promise<void> {
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));
  const useStaticDist =
    env.NODE_ENV === 'production' ||
    process.env.SERVE_STATIC_DIST === 'true' ||
    (env.NODE_ENV === 'test' && hasDist);

  if (!useStaticDist) {
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

    // (11/2026) O mount de `/tools` e o relaxamento de CSP (`script-src 'unsafe-inline'`)
    // que o acompanhava foram removidos junto com `public/tools/social-selling/` — os
    // últimos HTMLs estáticos legados da marca antiga. Sem diretório, o mount só servia
    // index.html via fallback e o relaxamento de CSP ampliava a superfície sem ganho.

    // Protege arquivos estáticos do design-lab com autenticação
    app.use(
      '/design-lab',
      toolsLimiter,
      authenticateToken,
      express.static(path.join(distPath, 'design-lab')),
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
