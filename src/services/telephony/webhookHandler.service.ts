/**
 * src/services/telephony/webhookHandler.service.ts
 * Handler desacoplado e assincrono de webhooks 3CX com resposta 202 imediata (Handoff 12-para-06 / B-07).
 */
import { process3CXWebhook } from '../../features/integrations/threecx/threecx.service.js';
import { logger } from '../../lib/logger.js';

export interface Webhook3CXEnqueueResult {
  accepted: boolean;
  queued: boolean;
  jobId: string;
}

export class TelephonyWebhookHandler {
  /**
   * Enfileira evento recebido do 3CX para execucao em background, liberando o servidor 3CX em < 50ms (HTTP 202).
   */
  public async handleIncoming3CXWebhook(
    payload: Record<string, unknown>,
  ): Promise<Webhook3CXEnqueueResult> {
    const jobId = `3cx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Dispara processamento em background assincronamente (worker/queue abstraction)
    setImmediate(async () => {
      try {
        await process3CXWebhook(payload);
        logger.info(
          { jobId },
          '[TelephonyWebhookHandler] Processamento assincrono concluido com sucesso',
        );
      } catch (error) {
        logger.error(
          { jobId, err: error },
          '[TelephonyWebhookHandler] Falha no processamento assincrono do webhook 3CX',
        );
      }
    });

    return {
      accepted: true,
      queued: true,
      jobId,
    };
  }
}

export const telephonyWebhookHandler = new TelephonyWebhookHandler();
