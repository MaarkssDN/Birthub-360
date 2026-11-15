import { prisma } from '../../../lib/prisma.js';
import { AppError } from '../../../shared/middlewares/errorHandler.js';
import type {
  LogSocialInteractionInput,
  LogSocialInteractionResult,
  SocialInteractionKind,
} from '../domain/socialSelling.types.js';
import { assertSocialInteractionRateLimit } from './socialRateLimit.js';

/**
 * Vínculo atômico Social Selling → timeline do CRM (RN-SOC-02 / AC-SOC-002, MOD-11, JOR-15).
 *
 * "Associação imediata de abordagem gerada à timeline do Lead" — o vendedor gera a abordagem
 * (POST /approach/generate), revisa/edita e, ao executar manualmente no canal (RN-SOC-01 exige
 * clique humano; não existe envio automatizado), registra aqui em 1 clique. Cada registro vira
 * um `TimelineEvent` (type 'social_selling') no Lead — o mesmo modelo já usado por cadência,
 * voz e notas (`activity.service.ts`, `CadenceDispatchers.ts`, `PrismaNoteRepository.ts`).
 *
 * "Um clique" também significa ATÔMICO no sentido de não-perder-o-vínculo: o leadId é
 * obrigatório e validado contra a organização ANTES de qualquer escrita — TimelineEvent não tem
 * organizationId próprio (herda o tenant via Lead + RLS), então aceitar um leadId de outro
 * tenant aqui gravaria evento cross-tenant. O rate limit por organização (RN-SOC-03 /
 * RECONST-028) barra rajadas que inundariam a timeline — ver socialRateLimit.ts.
 */

const MAX_SUMMARY_LENGTH = 2000;
const TIMELINE_DESCRIPTION_MAX = 500;

const KIND_LABEL: Record<SocialInteractionKind, string> = {
  approach_sent: 'Abordagem social enviada',
  interaction_received: 'Interação social recebida',
};

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export class SocialInteractionService {
  async recordInteraction(
    organizationId: string,
    input: LogSocialInteractionInput,
  ): Promise<LogSocialInteractionResult> {
    const leadId = input.leadId?.trim();
    if (!leadId) {
      throw new AppError('leadId é obrigatório para vincular a interação à timeline do CRM.', 400);
    }

    const kind: SocialInteractionKind =
      input.kind === 'interaction_received' ? 'interaction_received' : 'approach_sent';
    const channel = input.channel?.trim() || 'linkedin';
    const summary = input.summary?.trim();
    if (summary && summary.length > MAX_SUMMARY_LENGTH) {
      throw new AppError(
        `Resumo da interação excede o máximo de ${MAX_SUMMARY_LENGTH} caracteres.`,
        400,
      );
    }

    // Rate limit ANTES de qualquer leitura/escrita — uma rajada rejeitada não deve nem tocar
    // no banco (mesmo padrão de checkProviderRateLimit antes de fetchWithProviderRetry).
    assertSocialInteractionRateLimit(organizationId);

    // Trava de tenancy: TimelineEvent não carrega organizationId — só é seguro gravar se o Lead
    // pertencer à organização do token. Sem este check, um leadId de outro tenant gravaria evento
    // na timeline alheia (RLS do Postgres também bloquearia na prática, mas falhar aqui devolve
    // 404 limpo em vez de erro de constraint).
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId },
      select: { id: true },
    });
    if (!lead) {
      throw new AppError('Lead não encontrado nesta organização.', 404);
    }

    const description = truncate(
      `${KIND_LABEL[kind]} via ${channel}${summary ? `: ${summary}` : ''}`,
      TIMELINE_DESCRIPTION_MAX,
    );

    const event = await prisma.timelineEvent.create({
      data: {
        type: 'social_selling',
        description,
        leadId: lead.id,
      },
      select: { id: true },
    });

    return {
      timelineEventId: event.id,
      leadId: lead.id,
      kind,
      channel,
    };
  }
}

export const socialInteractionService = new SocialInteractionService();
