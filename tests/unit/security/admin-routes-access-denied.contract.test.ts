import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// B-02 (AGENTS.md §22) / §26 — prova de acesso NEGADO nas rotas administrativas.
//
// A auditoria `.agents/runs/00-auditoria-b02-rotas-admin-20261120.md` confirmou por leitura que
// estas rotas têm guarda de papel, mas não existia teste que quebrasse se alguém a removesse.
// Aqui o app é montado EXATAMENTE como `server.ts` faz (`applyRateLimiters` → `express.json` →
// `mountFeatureRoutes`), então tanto a guarda dentro do router quanto a do mount em
// `src/bootstrap/routes.ts` (ex.: `/api/api-keys`) são as de produção. Só a sessão do Better Auth
// é simulada, com o papel desejado; um papel insuficiente tem de voltar 403 com o corpo
// padronizado de `requireRole`. Como o papel é checado antes do handler, nenhum serviço /
// banco é tocado — o teste roda sem Postgres (os `rbac-e2e-*` de tests/integration cobrem o
// caminho de sucesso com sessão e RLS reais).

const { authGetSessionMock } = vi.hoisted(() => ({ authGetSessionMock: vi.fn() }));

vi.mock('@/lib/auth.js', () => ({
  auth: { api: { getSession: (...args: unknown[]) => authGetSessionMock(...args) } },
}));
vi.mock('@/config/access-policy.js', () => ({ isAuthorizedLoginEmail: () => true }));

import { applyRateLimiters } from '@/bootstrap/rateLimiters.js';
import { mountFeatureRoutes } from '@/bootstrap/routes.js';
import { errorHandler } from '@/shared/middlewares/errorHandler.js';

type Role = 'ADMIN' | 'GESTOR' | 'CLOSER' | 'SDR' | 'VISUALIZADOR';
type Method = 'post' | 'put' | 'delete';

interface Probe {
  method: Method;
  path: string;
}

interface Surface {
  name: string;
  mount: string;
  /** Papel mínimo que o código de produção exige; papéis abaixo dele devem receber 403. */
  minimumRole: Role;
  probes: Probe[];
}

const HIERARCHY: Role[] = ['VISUALIZADOR', 'SDR', 'CLOSER', 'GESTOR', 'ADMIN'];
const rolesBelow = (min: Role): Role[] => HIERARCHY.slice(0, HIERARCHY.indexOf(min));

const SURFACES: Surface[] = [
  {
    name: 'time (convite, papel, remoção de membros)',
    mount: '/api/team',
    minimumRole: 'ADMIN',
    probes: [
      { method: 'post', path: '/' },
      { method: 'post', path: '/invite' },
      { method: 'put', path: '/member-1/role' },
      { method: 'delete', path: '/member-1' },
    ],
  },
  {
    name: 'acesso a módulos por usuário',
    mount: '/api/module-access',
    minimumRole: 'ADMIN',
    probes: [
      { method: 'put', path: '/user-1/crm' },
      { method: 'delete', path: '/user-1/crm' },
    ],
  },
  {
    name: 'módulos da organização',
    mount: '/api/organization-modules',
    minimumRole: 'ADMIN',
    probes: [
      { method: 'post', path: '/onboarding/complete' },
      { method: 'put', path: '/' },
      { method: 'post', path: '/crm' },
      { method: 'delete', path: '/crm' },
    ],
  },
  {
    name: 'cargos (atribuição)',
    mount: '/api/job-roles',
    minimumRole: 'ADMIN',
    probes: [
      { method: 'post', path: '/assignments' },
      { method: 'delete', path: '/assignments/user-1/role-1' },
    ],
  },
  {
    name: 'chaves de API',
    mount: '/api/api-keys',
    minimumRole: 'ADMIN',
    // Em produção o papel é exigido no mount (`routes.ts`), não dentro do router: este caso falha
    // se alguém remover o `requireRole(['ADMIN'])` de lá.
    probes: [
      { method: 'post', path: '/' },
      { method: 'delete', path: '/key-1' },
    ],
  },
  {
    name: 'preferências de pilares (PUT)',
    mount: '/api/settings/pillars',
    minimumRole: 'ADMIN',
    probes: [{ method: 'put', path: '/geral' }],
  },
  {
    name: 'integração Omie',
    mount: '/api/integrations/omie',
    minimumRole: 'GESTOR',
    probes: [
      { method: 'post', path: '/connect' },
      { method: 'post', path: '/disconnect/conn-1' },
      { method: 'post', path: '/connections/conn-1/test' },
      { method: 'post', path: '/connections/conn-1/customers' },
    ],
  },
  {
    name: 'integração Slack',
    mount: '/api/integrations/slack',
    minimumRole: 'GESTOR',
    probes: [
      { method: 'post', path: '/connect' },
      { method: 'post', path: '/disconnect/conn-1' },
      { method: 'post', path: '/connections/conn-1/test' },
      { method: 'post', path: '/connections/conn-1/message' },
    ],
  },
  {
    name: 'WhatsApp (conectar/desconectar)',
    mount: '/api/whatsapp',
    minimumRole: 'GESTOR',
    probes: [
      { method: 'post', path: '/connect' },
      { method: 'post', path: '/disconnect' },
    ],
  },
  {
    name: 'automações (gestão)',
    mount: '/api/automations',
    minimumRole: 'GESTOR',
    probes: [
      { method: 'post', path: '/' },
      { method: 'put', path: '/auto-1' },
      { method: 'delete', path: '/auto-1' },
      { method: 'post', path: '/auto-1/dry-run' },
    ],
  },
  {
    name: 'automações (varredura de estagnação)',
    mount: '/api/automations',
    minimumRole: 'ADMIN',
    probes: [{ method: 'post', path: '/stagnation-scan' }],
  },
  {
    name: 'base de conhecimento (exclusão)',
    mount: '/api/knowledge',
    minimumRole: 'GESTOR',
    probes: [{ method: 'delete', path: '/doc-1' }],
  },
];

const session = (role: Role) => ({
  user: {
    id: `user-${role}`,
    email: `${role.toLowerCase()}@birthhub360.test`,
    organizationId: 'org-a',
    role,
  },
});

function buildApp() {
  const app = express();
  applyRateLimiters(app);
  app.use(express.json());
  mountFeatureRoutes(app);
  app.use(errorHandler);
  return app;
}

describe('B-02 — rotas administrativas negam papéis insuficientes (403) e anônimos (401)', () => {
  beforeEach(() => {
    authGetSessionMock.mockReset();
  });

  for (const surface of SURFACES) {
    describe(`${surface.name} — exige ${surface.minimumRole}+`, () => {
      const denied = rolesBelow(surface.minimumRole);

      for (const probe of surface.probes) {
        for (const role of denied) {
          it(`${probe.method.toUpperCase()} ${surface.mount}${probe.path}: ${role} recebe 403 padronizado`, async () => {
            authGetSessionMock.mockResolvedValue(session(role));

            const res = await request(buildApp())
              [probe.method](`${surface.mount}${probe.path}`)
              .send({});

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('Insufficient permissions');
            expect(res.body.error).toContain(`Your role: ${role}`);
          });
        }

        it(`${probe.method.toUpperCase()} ${surface.mount}${probe.path}: sem sessão recebe 401`, async () => {
          authGetSessionMock.mockResolvedValue(null);

          const res = await request(buildApp())
            [probe.method](`${surface.mount}${probe.path}`)
            .send({});

          expect(res.status).toBe(401);
        });
      }
    });
  }
});
