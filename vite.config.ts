import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { cpSync } from 'node:fs';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      // Million.js (`million.vite({ auto: true })`, adicionado em 22/09) NÃO pode voltar em modo auto:
      // ele recompila componentes em "blocos" com DOM próprio (`<slot>`, `$change`) fora do React, e
      // os inputs controlados deixam de receber onChange — a busca do Kanban (?q=) e as views salvas
      // simplesmente paravam de funcionar, em dev e no build de produção (achado dos E2E).
      react(),
      tailwindcss(),
      {
        name: 'copy-public-assets',
        apply: 'build',
        writeBundle({ dir }) {
          if (!dir) throw new Error('O build precisa de um diretório de saída.');
          const publicDir = path.resolve(__dirname, 'public');
          cpSync(publicDir, dir, {
            recursive: true,
            force: false,
            filter(source) {
              const [entry] = path.relative(publicDir, source).split(path.sep);
              return !['tools', 'design-lab'].includes(entry.toLowerCase());
            },
          });
        },
      },
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
        manifest: {
          name: 'Birth Hub 360 — Central de Inteligência Comercial',
          short_name: 'Birth Hub 360',
          description: 'CRM com IA para equipes comerciais de alta performance',
          theme_color: '#F4F7FB',
          background_color: '#F4F7FB',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/app',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: '/icons/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: 'CRM',
              url: '/app/crm',
              icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
            },
            {
              name: 'Prospecção',
              url: '/app/prospect',
              icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
            },
          ],
        },
        workbox: {
          // Cache de assets estáticos: CacheFirst (imutáveis via hash de build)
          globPatterns: ['**/*.js', '**/*.css', '**/*.html', '**/*.ico', '**/*.png', '**/*.svg', '**/*.woff2'],
          runtimeCaching: [
            {
              urlPattern: ({ url, sameOrigin }) =>
                sameOrigin && /^\/(?:tools|design-lab)(?:\/|$)/i.test(url.pathname),
              handler: 'NetworkOnly',
            },
            {
              // Assets de fontes e ícones: CacheFirst
              urlPattern: /\.(woff2?|ttf|otf|eot)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'birthub360-fonts',
                expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
          // Exclui rotas de API real do service worker (não cachear POST/PATCH/DELETE)
          navigateFallbackDenylist: [
            /^\/api\//,
            /^\/webhook\//,
            /^\/(?:tools|design-lab)(?:\/|\?|$)/i,
          ],
        },
        // Desabilita em modo dev para não interferir com HMR
        devOptions: { enabled: false },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      entries: ['index.html'],
      include: [
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom',
        'react-dom/client',
        'react-router-dom',
        'framer-motion',
        'lucide-react',
        'clsx',
        'tailwind-merge',
        '@radix-ui/react-slot',
        'class-variance-authority',
        'canvas-confetti',
        '@react-three/fiber',
        '@react-three/drei',
        'three',
        'pino',
        'recharts',
        'date-fns',
        '@tanstack/react-query',
        'better-auth/react',
        'better-auth/client/plugins',
      ],
      holdUntilCrawlEnd: true,
    },
    ssr: {
      external: [
        '@sentry/node-core',
        '@sentry/server-utils',
        '@sentry/node',
      ],
    },
    server: {
      host: true, // Permite acesso via rede (0.0.0.0)
      port: 3024, // O backend já usa a 3024 via env.PORT e serve o Vite via middleware.
      strictPort: true, // Garante que se usarem Vite standalone, ele tente usar a 3024.
      allowedHosts: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3024',
          changeOrigin: true,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      // ignored: sem isso, o Vite observa o projeto inteiro (inclusive playwright-report/ e
      // test-results/, que o Playwright regrava a cada teste enquanto o servidor de e2e roda essa
      // mesma config em middleware mode) — cada gravação do relatório disparava um full reload da
      // página no meio do teste, derrubando login/formulário em andamento (TEST-002).
      // `.claude/worktrees/**` entrou na lista depois de um achado real (11/09/2026): com várias
      // sessões Claude Code rodando em paralelo, cada uma no seu próprio worktree dentro deste
      // mesmo diretório, o Vite (e o `tsx watch` do `npm run dev`, que soma outro watcher por
      // cima) tentava vigiar TODAS as cópias completas do repo simultaneamente — cada edição de
      // QUALQUER worktree disparava reload em cascata aqui, saturando o watcher a ponto de o
      // servidor nunca terminar de subir (ou, uma vez de pé, nunca responder a requisições —
      // event loop preso processando reload atrás de reload). Sem isso, `npm run dev` é
      // inutilizável sempre que outro worktree deste projeto está ativo.
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : {
              ignored: [
                '**/playwright-report/**',
                '**/test-results/**',
                '**/coverage/**',
                '**/.claude/worktrees/**',
              ],
            },
    },
    build: {
      copyPublicDir: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replaceAll('\\', '/');
            // O helper de preload do Vite (`\0vite/preload-helper.js`) é importado
            // estaticamente por TODO chunk com import dinâmico, inclusive o entry.
            // Sem regra própria, o Rollup o aloja dentro do primeiro chunk manual
            // que encontrar (na prática vendor-3d) — e como o entry passa a
            // importá-lo estaticamente, o Vite marca vendor-3d (~240KB gzip de
            // three.js) como modulepreload do index.html, punindo o load inicial
            // de todas as rotas. Forçá-lo para vendor-react (chunk já eager)
            // elimina essa aresta sem mudar o comportamento do preload.
            if (normalizedId.includes('vite/preload-helper')) {
              return 'vendor-react';
            }
            if (!normalizedId.includes('/node_modules/')) return undefined;

            // clsx/tailwind-merge são deps minúsculas compartilhadas por dezenas de
            // componentes. O Rollup as aloja dentro de um chunk manual quando uma
            // lib pesada também as usa como dependência (clsx é dep do recharts) —
            // resultado observado: o entry importava `clsx` de vendor-charts,
            // forçando modulepreload de ~120KB gzip (recharts + d3) no load inicial.
            // Fixá-las em vendor-react (já eager) remove a aresta entry→vendor-charts.
            if (
              normalizedId.includes('/clsx/') ||
              normalizedId.includes('/tailwind-merge/')
            ) {
              return 'vendor-react';
            }
            if (
              normalizedId.includes('/react/') ||
              normalizedId.includes('/react-dom/') ||
              normalizedId.includes('/react-router') ||
              normalizedId.includes('/scheduler/')
            ) {
              return 'vendor-react';
            }
            if (normalizedId.includes('/framer-motion/') || normalizedId.includes('/motion/')) {
              return 'vendor-motion';
            }
            if (normalizedId.includes('/lucide-react/')) {
              return 'vendor-icons';
            }
            if (normalizedId.includes('/@dnd-kit/')) {
              return 'vendor-dnd';
            }
            // ECharts é ~750kB antes de tree-shake — chunk dedicado para lazy load
            if (normalizedId.includes('/echarts/') || normalizedId.includes('/zrender/')) {
              return 'vendor-echarts';
            }
            if (normalizedId.includes('/exceljs/')) {
              return 'vendor-excel';
            }
            if (normalizedId.includes('/recharts/') || normalizedId.includes('/d3-')) {
              return 'vendor-charts';
            }
            if (normalizedId.includes('/@better-auth/') || normalizedId.includes('/redux/')) {
              return 'vendor-auth';
            }
            // Tiptap + ProseMirror
            if (normalizedId.includes('/@tiptap/') || normalizedId.includes('/prosemirror-')) {
              return 'vendor-tiptap';
            }
            // React PDF (pdf-lib + fontkit)
            if (
              normalizedId.includes('/@react-pdf/') ||
              normalizedId.includes('/pdf-lib/') ||
              normalizedId.includes('/fontkit/')
            ) {
              return 'vendor-pdf';
            }
            // Embla Carousel
            if (normalizedId.includes('/embla-carousel')) {
              return 'vendor-carousel';
            }
            // Three.js + React Three Fiber (~1MB) — biblioteca 3D pesada que só
            // carrega sob demanda; isolar em chunk próprio evita que ela divida
            // destino com vendors de UI.
            if (
              normalizedId.includes('/three/') ||
              normalizedId.includes('/@react-three/')
            ) {
              return 'vendor-3d';
            }
            return undefined;
          },
        },
      },
    },
  };
});
