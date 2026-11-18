/**
 * Rotas da API para gerenciamento das conexões de CRMs Externos (HubSpot, Pipedrive, RD, Monday).
 * Acionadas pelo ExternalCrmPanel.
 */

import { Router } from 'express';
import express from 'express';
import { z } from 'zod';
import { requireRole } from '../../../shared/middlewares/requireRole.js';
import { ExternalCrmService } from './ExternalCrmService.js';
import { logger } from '../../../lib/logger.js';
import type { Request, Response } from 'express';

export const externalCrmRoutes = Router();

interface AuthenticatedRequest extends Request {
  user?: { id?: string; role?: string; organizationId?: string };
}

// Restringe todas as rotas para ADMIN/GESTOR
externalCrmRoutes.use(requireRole(['ADMIN', 'GESTOR']));

// GET /api/integrations/external-crm
// Lista conexões ativas de um provider específico
externalCrmRoutes.get('/', async (req: Request, res: Response) => {
  const organizationId = (req as AuthenticatedRequest).user?.organizationId;
  if (!organizationId) return res.status(401).send({ error: 'Unauthorized' });

  const provider = req.query.provider as string | undefined;

  try {
    const connections = await ExternalCrmService.listConnections(organizationId);
    if (provider) {
      return res.send(connections.filter((c) => c.provider === provider));
    }
    return res.send(connections);
  } catch (err: any) {
    logger.error({ err, organizationId }, 'Erro ao listar conexões de CRM externo');
    return res.status(500).send({ error: 'Falha interna' });
  }
});

// POST /api/integrations/external-crm
// Cria nova conexão
externalCrmRoutes.post('/', express.json(), async (req: Request, res: Response) => {
  const organizationId = (req as AuthenticatedRequest).user?.organizationId;
  if (!organizationId) return res.status(401).send({ error: 'Unauthorized' });

  const schema = z.object({
    provider: z.string(),
    label: z.string(),
    config: z.any(),
    inboundEventsEnabled: z.boolean().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).send({ error: 'Dados inválidos', details: parsed.error.issues });
  }

  const { provider, label, config, inboundEventsEnabled } = parsed.data;

  try {
    const connection = await ExternalCrmService.createConnection({
      organizationId,
      provider,
      label,
      config: config as Record<string, string>,
      inboundEventsEnabled,
    });

    return res.status(201).send({
      id: connection.id,
      provider: connection.provider,
      label: connection.label,
    });
  } catch (err: any) {
    logger.error({ err, organizationId }, 'Erro ao criar conexão de CRM externo');
    // Não devolve err.message: providers embutem o body cru da resposta do CRM na mensagem,
    // que pode conter PII do registro ou detalhes de auth (auditoria 2026-11-15, P2-07).
    return res.status(400).send({ error: 'Não foi possível criar a conexão. Verifique os dados e tente novamente.' });
  }
});

// DELETE /api/integrations/external-crm/:id
// Remove conexão
externalCrmRoutes.delete('/:id', async (req: Request, res: Response) => {
  const organizationId = (req as AuthenticatedRequest).user?.organizationId;
  if (!organizationId) return res.status(401).send({ error: 'Unauthorized' });

  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) return res.status(400).send({ error: 'ID obrigatório' });

  try {
    await ExternalCrmService.deleteConnection(id, organizationId);
    return res.send({ success: true });
  } catch (err: any) {
    logger.error({ err, organizationId }, 'Erro ao remover conexão de CRM externo');
    return res.status(500).send({ error: 'Falha interna' });
  }
});

// POST /api/integrations/external-crm/:id/test
// Testa a validade das credenciais de uma conexão existente
externalCrmRoutes.post('/:id/test', async (req: Request, res: Response) => {
  const organizationId = (req as AuthenticatedRequest).user?.organizationId;
  if (!organizationId) return res.status(401).send({ error: 'Unauthorized' });

  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) return res.status(400).send({ error: 'ID obrigatório' });

  try {
    const isValid = await ExternalCrmService.validateConnection(id, organizationId);
    if (!isValid) {
      return res.status(400).send({
        success: false,
        valid: false,
        error: 'Credenciais inválidas ou sem permissão de acesso no CRM externo.',
      });
    }
    return res.send({
      success: true,
      valid: true,
      message: 'Conexão validada com sucesso!',
    });
  } catch (err: any) {
    logger.error(
      { err, organizationId, connectionId: id },
      'Erro ao testar conexão de CRM externo',
    );
    return res.status(500).send({
      success: false,
      error: 'Falha ao validar credenciais. Tente novamente.',
    });
  }
});

// POST /api/integrations/external-crm/:id/sync
// Dispara importação / sincronização manual de leads.
//
// HONESTIDADE (auditoria 2026-11-15, P1-01): a importação de leads de CRMs externos ainda NÃO
// está implementada — `ExternalCrmService.importLeads` busca os deals no provider mas não
// existe persistência (Lead + dedup via ExternalEntityLink + mapeamento de etapa), e a decisão
// de modelo de dedup é de schema/domínio (Agente 01/04). Antes desta correção a rota devolvia
// `success:true` com `importedCount` = leads BUSCADOS, sem gravar nada — falso sucesso.
// Até o importador real existir, a rota responde 501 explícito. O provider continua acessível
// via `importLeads` para o futuro importador.
externalCrmRoutes.post('/:id/sync', async (req: Request, res: Response) => {
  const organizationId = (req as AuthenticatedRequest).user?.organizationId;
  if (!organizationId) return res.status(401).send({ error: 'Unauthorized' });

  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) return res.status(400).send({ error: 'ID obrigatório' });

  try {
    // 404 honesto quando a conexão não existe no tenant (sem vazar existência cross-tenant).
    const connections = await ExternalCrmService.listConnections(organizationId);
    const connection = connections.find((c) => c.id === id);
    if (!connection) {
      return res.status(404).send({ success: false, error: 'Conexão não encontrada.' });
    }

    logger.warn(
      { organizationId, connectionId: id, provider: connection.provider },
      '[external-crm] Sync de importação solicitado, mas importação de leads não está implementada',
    );

    return res.status(501).send({
      success: false,
      code: 'NOT_IMPLEMENTED',
      error:
        'A importação de leads deste CRM ainda não está disponível. A conexão está ativa, mas a ' +
        'sincronização de entrada (CRM externo → Atlas) será liberada em versão futura.',
    });
  } catch (err: any) {
    logger.error({ err, organizationId, connectionId: id }, 'Erro ao sincronizar CRM externo');
    return res.status(500).send({
      success: false,
      error: 'Falha ao sincronizar com CRM externo.',
    });
  }
});
