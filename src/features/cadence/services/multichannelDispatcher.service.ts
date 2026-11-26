/**
 * Disparador de Cadência Multicanal com Bloqueio Prévio de Opt-Out LGPD (Passo 61 / Agente 17)
 *
 * CONTRATO DORMENTE — POS3-44-DORMANT-CONTRACTS: esta classe NÃO possui nenhum caller de
 * produção no repositório (verificado por grep em src/, server.ts e tests/). O dispatcher real
 * usado pelo runtime de cadência é `buildProductionCadenceDispatcher`
 * (`src/features/cadence/infra/dispatchers/CadenceDispatchers.ts`), injetado em
 * `jobs/cadenceRun.worker.ts` — ele sim envia WhatsApp/e-mail/voz de verdade.
 *
 * A versão anterior deste stub retornava `{ success: true }` apenas com um log — sucesso falso.
 * Agora `dispatch` falha explicitamente para qualquer canal: se um consumidor futuro aparecer,
 * ele deve ser reescrito para delegar ao dispatcher real (ou injetar `CadenceChannelDispatcherPort`
 * de `application/CadenceExecutionService.ts`), nunca ressuscitar o retorno de sucesso vazio.
 */

import { logger } from '../../../lib/logger.js';

export interface DispatchRequest {
  leadId: string;
  channel: 'WHATSAPP' | 'EMAIL' | 'VOICE';
  content: string;
  isOptedOut: boolean;
}

export class MultichannelDispatcherService {
  public async dispatch(request: DispatchRequest): Promise<{ success: boolean; reason?: string }> {
    if (request.isOptedOut) {
      logger.warn({ leadId: request.leadId }, 'Disparo bloqueado: titular solicitou opt-out');
      return { success: false, reason: 'OPT_OUT_BLOCKED' };
    }

    logger.error(
      { leadId: request.leadId, channel: request.channel },
      'MultichannelDispatcherService.dispatch chamado sem implementação de canal — stub dormente, nenhum envio realizado.',
    );
    throw new Error(
      'MultichannelDispatcherService não está ligado a nenhum canal real (stub dormente). ' +
        'Use buildProductionCadenceDispatcher (infra/dispatchers/CadenceDispatchers.ts) ou injete CadenceChannelDispatcherPort.',
    );
  }
}

export const multichannelDispatcher = new MultichannelDispatcherService();
