import { Router } from 'express';
import { auditAccessMiddleware } from '../../../lib/security/auditLog.middleware.js';
import { companySchema } from '../../../lib/zod.js';
import { container } from '../../../shared/di/container.js';
import { requireRole } from '../../../shared/middlewares/requireRole.js';
import { validateRequest } from '../../../shared/middlewares/validateRequest.js';
import type { CompanyController } from '../presentation/CompanyController.js';

const router = Router();
const writeRoles = requireRole(['ADMIN', 'GESTOR', 'CLOSER', 'SDR']);

router.get('/', (req, res, next) =>
  container.resolve<CompanyController>('CompanyController').getCompanies(req, res, next),
);

// DEM-20261114-003 (follow-up Onda 2): o detalhe da empresa expõe PII/dados cadastrais do tenant
// (contatos, leads vinculados) — acesso registrado em AuditLog (GET → EXPORT; entityId = :id).
router.get('/:id', auditAccessMiddleware('Company'), (req, res, next) =>
  container.resolve<CompanyController>('CompanyController').getCompanyById(req, res, next),
);
router.post('/', writeRoles, validateRequest(companySchema), (req, res, next) =>
  container.resolve<CompanyController>('CompanyController').createCompany(req, res, next),
);
router.put('/:id', writeRoles, validateRequest(companySchema.partial()), (req, res, next) =>
  container.resolve<CompanyController>('CompanyController').updateCompany(req, res, next),
);

// Apenas ADMIN e GESTOR podem deletar empresas
router.delete('/:id', requireRole(['ADMIN', 'GESTOR']), (req, res, next) =>
  container.resolve<CompanyController>('CompanyController').deleteCompany(req, res, next),
);

// Re-enriquece uma empresa já existente no CRM (Receita Federal + heurísticas de domínio/e-mail).
router.post('/:id/enrich', writeRoles, (req, res, next) =>
  container.resolve<CompanyController>('CompanyController').enrichCompany(req, res, next),
);

export const companyRoutes = router;
