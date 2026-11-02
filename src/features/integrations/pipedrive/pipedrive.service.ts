/**
 * Pipedrive Integration Service
 *
 * Stub para gerenciar:
 * 1. OAuth 2.0 flow (geração de URL de consentimento, troca de código por token, refresh).
 * 2. Mapeamento de funil (deal stages, pipelines).
 * 3. Writeback (atualizar Birth Hub a partir de webhooks do Pipedrive).
 */

import { logger } from '../../../lib/logger.js';
import '../../../lib/prisma.js';

export const PipedriveService = {
  /**
   * Gera a URL de autorização OAuth para o usuário conectar o Pipedrive.
   */
  getOAuthConsentUrl(organizationId: string): string {
    logger.info({ organizationId }, '[pipedrive] Gerando URL de consentimento OAuth');
    return 'https://oauth.pipedrive.com/oauth/authorize?client_id=STUB&redirect_uri=STUB'; // TODO: Implementar real URL
  },

  /**
   * Troca o auth code do callback por access e refresh tokens.
   */
  async exchangeCodeForTokens(organizationId: string, code: string): Promise<void> {
    logger.info({ organizationId, code }, '[pipedrive] Trocando auth code por tokens');
    // TODO: Implementar POST https://oauth.pipedrive.com/oauth/token e persistir na conexão
  },

  /**
   * Mapeamento de funil: recupera pipelines e stages para mapear com o Birth Hub.
   */
  async getPipelinesAndStages(connectionId: string): Promise<any[]> {
    logger.info({ connectionId }, '[pipedrive] Recuperando pipelines e stages');
    // TODO: Implementar GET /v1/pipelines
    return [];
  },

  /**
   * Writeback: processa payload de webhook do Pipedrive.
   */
  async handleWebhookWriteback(payload: any): Promise<void> {
    logger.info({ payload }, '[pipedrive] Recebido webhook do Pipedrive');
    // TODO: Implementar lógica de atualização de leads/negócios baseado no payload
  },
};
