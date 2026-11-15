export type SocialSellingChannel = 'linkedin' | 'email' | 'whatsapp';
export type SocialSellingTone = 'consultivo' | 'executivo' | 'provocativo' | 'storytelling';

export interface GenerateApproachInput {
  targetCompany?: string;
  targetRole?: string;
  segment?: string;
  triggerEvent?: string;
  channel?: SocialSellingChannel;
  tone?: SocialSellingTone;
}

export interface GeneratedApproachResult {
  headline: string;
  hook: string;
  body: string;
  callToAction: string;
  fullMessage: string;
  channel: SocialSellingChannel;
  tone: SocialSellingTone;
  modelUsed: string;
  estimatedTokens: number;
}

/**
 * RN-SOC-02 / AC-SOC-002 (MOD-11, JOR-15): registro de uma abordagem social já executada por um
 * humano (clique manual — RN-SOC-01 proíbe postagem automática) ou de uma interação recebida,
 * vinculado à timeline do Lead no CRM com 1 clique.
 */
export type SocialInteractionKind = 'approach_sent' | 'interaction_received';

export interface LogSocialInteractionInput {
  leadId: string;
  kind?: SocialInteractionKind;
  channel?: SocialSellingChannel | string;
  /** Texto curto descrevendo a abordagem/interação (ex.: resumo do post ou do recado). */
  summary?: string;
}

export interface LogSocialInteractionResult {
  timelineEventId: string;
  leadId: string;
  kind: SocialInteractionKind;
  channel: string;
}
