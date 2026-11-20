import express, { type Router } from 'express';
import rateLimit from 'express-rate-limit';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// B-02 (AGENTS.md §22) / §26 — prova de acesso NEGADO nas rotas administrativas.
//
// A auditoria `.agents/runs/00-auditoria-b02-rotas-admin-20261120.md` confirmou por leitura que
// estas rotas têm guarda de papel, mas não existia teste que quebrasse se alguém a removesse.
// Aqui o router REAL é montado atrás do `authenticateToken` REAL (só a sessão do Better Auth é
// simulada, com o papel desejado) e a requisição de um papel insuficiente tem de voltar 403 com o
// corpo padronizado de `requireRole`. Como o papel é checado antes do handler, nenhum serviço /
// banco é tocado — o teste roda sem Postgres (os `rbac-e2e-*` de tests/integration cobrem o
// caminho de sucesso com sessão e RLS reais).

const { authGetSessionMock } = vi.hoisted(() => ({ authGetSessionMock: vi.fn() }));

vi.mock('@/lib/auth.js', () => ({
  auth: { api: { getSession: (...args: unknown[]) => authGetSessionMock(...args) } },
}));
vi.mock('@/config/access-policy.js', () => ({ isAuthorizedLoginEmail: () => true }));

import { apiKeyRoutes } from '@/features/api-keys/apiKey.routes.js';
import { automationRoutes } from '@/features/automations/routes/automation.routes.js';
import { omieRoutes } from '@/features/integrations/omie/omie.routes.js';
import { slackRoutes } from '@/features/integrations/slack/slack.routes.js';
import { whatsappRoutes } from '@/features/integrations/whatsapp/whatsapp.routes.js';
import { jobRoleRoutes } from '@/features/job-roles/routes/jobRole.routes.js';
import { knowledgeRoutes } from '@/features/knowledge/knowledge.routes.js';
import { moduleAccessRoutes } from '@/features/module-access/routes/moduleAccess.routes.js';
import { organizationModulesRoutes } from '@/features/organization-modules/routes/organizationModules.routes.js';
import { pillarSettingsRoutes } from '@/features/settings/routes/pillarSettings.routes.js';
import { teamRoutes } from '@/features/team/routes/team.routes.js';
import { authenticateToken } from '@/shared/middlewares/authenticateToken.js';
import { requireTenant } from '@/shared/middlewares/authorization.js';
import { errorHandler } from '@/shared/middlewares/errorHandler.js';
import { requireRole } from '@/shared/middlewares/requireRole.js';

type Role = 'ADMIN' | 'GESTOR' | 'CLOSER' | 'SDR' | 'VISUALIZADOR';
type Method = 'post' | 'put' | 'delete';

interface Probe {
  method: Method;
  path: string;
}

interface Surface {
  name: string;
  mount: string;
  router: Router;
  /** Papel mínimo que o código de produção exige; papéis abaixo dele devem receber 403. */
  minimumRole: Role;
  /** Middlewares aplicados em `routes.ts` no mount, antes do router (espelha produção). */
  mountGuards?: express.RequestHandler[];
  probes: Probe[];
}

const HIERARCHY: Role[] = ['VISUALIZADOR', 'SDR', 'CLOSER', 'GESTOR', 'ADMIN'];
const rolesBelow = (min: Role): Role[] => HIERARCHY.slice(0, HIERARCHY.indexOf(min));

const SURFACES: Surface[] = [
  {
    name: 'time (convite, papel, remoção de membros)',
    mount: '/api/team',
    router: teamRoutes,
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
    router: moduleAccessRoutes,
    minimumRole: 'ADMIN',
    probes: [
      { method: 'put', path: '/user-1/crm' },
      { method: 'delete', path: '/user-1/crm' },
    ],
  },
  {
    name: 'módulos da organização',
    mount: '/api/organization-modules',
    router: organizationModulesRoutes,
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
    router: jobRoleRoutes,
    minimumRole: 'ADMIN',
    probes: [
      { method: 'post', path: '/assignments' },
      { method: 'delete', path: '/assignments/user-1/role-1' },
    ],
  },
  {
    name: 'chaves de API',
    mount: '/api/api-keys',
    router: apiKeyRoutes,
    minimumRole: 'ADMIN',
    // Em produção o papel é exigido no mount (routes.ts), não dentro do router.
    mountGuards: [requireRole(['ADMIN'])],
    probes: [
      { method: 'post', path: '/' },
      { method: 'delete', path: '/key-1' },
    ],
  },
  {
    name: 'preferências de pilares (PUT)',
    mount: '/api/settings/pillars',
    router: pillarSettingsRoutes,
    minimumRole: 'ADMIN',
    probes: [{ method: 'put', path: '/geral' }],
  },
  {
    name: 'integração Omie',
    mount: '/api/integrations/omie',
    router: omieRoutes,
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
    router: slackRoutes,
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
    router: whatsappRoutes,
    minimumRole: 'GESTOR',
    probes: [
      { method: 'post', path: '/connect' },
      { method: 'post', path: '/disconnect' },
    ],
  },
  {
    name: 'automações (gestão)',
    mount: '/api/automations',
    router: automationRoutes,
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
    router: automationRoutes,
    minimumRole: 'ADMIN',
    probes: [{ method: 'post', path: '/stagnation-scan' }],
  },
  {
    name: 'base de conhecimento (exclusão)',
    mount: '/api/knowledge',
    router: knowledgeRoutes,
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

function buildApp(surface: Surface) {
  const app = express();
  app.use(express.json());
  app.use(
    surface.mount,
    // Espelha o apiLimiter que produção aplica em toda rota /api (evita o alerta
    // js/missing-rate-limiting do CodeQL num app de teste isolado). Generoso: nunca dispara aqui.
    rateLimit({ windowMs: 15 * 60 * 1000, max: 100_000, standardHeaders: true, legacyHeaders: false }),
    authenticateToken,
    requireTenant,
    ...(surface.mountGuards ?? []),
    surface.router,
  );
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

            const res = await request(buildApp(surface))
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

          const res = await request(buildApp(surface))
            [probe.method](`${surface.mount}${probe.path}`)
            .send({});

          expect(res.status).toBe(401);
        });
      }
    });
  }
});
