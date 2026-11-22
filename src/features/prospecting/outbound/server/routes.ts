import { Router } from 'express';

// Modular child routers
import {
  authRouter,
  hashPassword,
  verifyHashedPassword,
  normalizeCompany,
  SCRYPT_PREFIX,
} from './routes/auth.routes.js';
import { systemRouter } from './routes/system.routes.js';
import { campaignsRouter } from './routes/campaigns.routes.js';
import { tasksRouter } from './routes/tasks.routes.js';
import { chatRouter } from './routes/chat.routes.js';
import { integrationsRouter } from './routes/integrations.routes.js';
import { leadsRouter } from './routes/leads.routes.js';

// Utilities & Services
import {
  formatLeadRow,
  validateChangedLeadFields,
  upsertMessageWithVersioning,
} from './utils/formatLead.js';
import {
  findLeads,
  enrichLeadWithApollo,
  resolveCnpjWithResilience,
  cleanDomain,
  cleanDomainForCache,
  slugify,
  normalizeLinkedInUrl,
  APOLLO_PREFERRED_TITLES,
} from './services/leadSearch.service.js';
import { attachUser, requireTenantScope } from './auth.js';

// Re-exports for backwards compatibility
export { formatLeadRow, validateChangedLeadFields, upsertMessageWithVersioning };
export {
  findLeads,
  enrichLeadWithApollo,
  resolveCnpjWithResilience,
  cleanDomain,
  cleanDomainForCache,
  slugify,
  normalizeLinkedInUrl,
  APOLLO_PREFERRED_TITLES,
};
export { hashPassword, verifyHashedPassword, normalizeCompany, SCRYPT_PREFIX };

export const apiRouter = Router();

// Auth & RBAC: popula req.outboundUser a partir do cookie de sessão assinado
apiRouter.use(attachUser);

// Rotas públicas: auth (login/logout/me) e health check de sondas — ficam
// ANTES do guard de tenant de propósito.
apiRouter.use(authRouter);
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handoff 12→05 (F2): TODO router de dados abaixo exige sessão válida E
// `company` preenchida (requireTenantScope → 401 sem sessão, 403 sem tenant).
// O isolamento por company nas queries ainda é parcial — ver a seção Resolução
// do handoff; o mount em bootstrap/routes.ts permanece fechado (503) até a
// migração completa para o tenant canônico.
apiRouter.use(requireTenantScope);

// Mount modular sub-routers
apiRouter.use(systemRouter);
apiRouter.use(campaignsRouter);
apiRouter.use(tasksRouter);
apiRouter.use(chatRouter);
apiRouter.use(integrationsRouter);
apiRouter.use(leadsRouter);
