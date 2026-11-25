import { describe, expect, it } from 'vitest';
import {
  MultichannelDispatcherService,
  multichannelDispatcher,
} from '../services/multichannelDispatcher.service.js';

/**
 * POS3-44-DORMANT-CONTRACTS: `multichannelDispatcher.service.ts` é um stub dormente sem
 * nenhum caller de produção. O dispatcher real é `buildProductionCadenceDispatcher`
 * (infra/dispatchers/CadenceDispatchers.ts), usado por `jobs/cadenceRun.worker.ts`.
 * Estes testes garantem que o stub NUNCA reporte sucesso sem enviar de fato.
 */
describe('MultichannelDispatcherService (stub dormente — POS3-44)', () => {
  const baseRequest = {
    leadId: 'lead-1',
    channel: 'WHATSAPP' as const,
    content: 'mensagem',
    isOptedOut: false,
  };

  it('nunca retorna success:true — falha explicitamente em vez de fingir envio', async () => {
    const service = new MultichannelDispatcherService();
    await expect(service.dispatch(baseRequest)).rejects.toThrow(/não está ligado a nenhum canal/);
  });

  it('singleton exportado também falha explicitamente', async () => {
    await expect(multichannelDispatcher.dispatch(baseRequest)).rejects.toThrow();
  });

  it('mantém o bloqueio de opt-out como recusa honesta (success:false, não exceção)', async () => {
    const service = new MultichannelDispatcherService();
    const result = await service.dispatch({ ...baseRequest, isOptedOut: true });
    expect(result).toEqual({ success: false, reason: 'OPT_OUT_BLOCKED' });
  });
});
