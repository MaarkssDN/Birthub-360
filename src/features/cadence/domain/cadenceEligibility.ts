import {
  normalizeOptOutSubject,
  scopeBlocksChannel,
  subjectsMatch,
  type CadenceChannel,
  type OptOutRecord,
  type OptOutSubject,
} from './optOut.js';

/**
 * Elegibilidade de um lead para ENTRAR numa cadência (TAREFA-SANEAMENTO-035 / BT360-DT-0080).
 *
 * Até aqui a única verificação de opt-out no início da cadência era por contato, lead a lead, em
 * `POST /api/cadence/runs` (`checkOptOutStatus`) — sem cobertura para lead sem `contactId` e sem
 * nenhum filtro em lote: quem associa muitos leads à régua de uma vez não tinha como excluir os
 * inelegíveis antes de eles virarem `CadenceRun` (e passarem a ocupar a fila do worker a cada
 * tick). Este módulo é a regra pura que decide elegibilidade a partir de dados já carregados —
 * quem faz I/O é `application/cadenceEligibility.ts` + `infra/PrismaCadenceEligibilityRepository.ts`.
 *
 * Cobre as MESMAS fontes de bloqueio de `checkOptOutStatus` (shared/services/optOutCheck.service.ts),
 * em lote e escopadas aos canais que a sequência realmente usa:
 * 1. contato anonimizado/excluído (LGPD Art. 18);
 * 2. flags de opt-out em `customFields` do lead e do contato (`optOut`, `optOutEmail`,
 *    `optOutWhatsApp`, `optOutVoice` — `optedOut` aceito por simetria com o interceptor);
 * 3. registro unificado `OptOutRecord` casando por leadId, e-mail ou telefone, com escopo
 *    `global` ou igual a um dos canais da sequência.
 */

export interface CadenceEligibilityContactInfo {
  /** `true` quando o contato foi anonimizado (nome sentinel) ou tem `deletedAt` preenchido. */
  anonymizedOrDeleted: boolean;
  customFields?: Record<string, unknown> | null;
}

export interface CadenceEligibilityLeadInput {
  leadId: string;
  /** Identificadores de contato do lead (leadId + e-mail + telefone já resolvidos pelo chamador). */
  subject: OptOutSubject;
  leadCustomFields?: Record<string, unknown> | null;
  contact?: CadenceEligibilityContactInfo | null;
}

export type CadenceIneligibilityReason =
  | 'contact-anonymized'
  | 'opt-out-flag'
  | 'opt-out-record';

export interface CadenceEligibilityVerdict {
  eligible: boolean;
  reason?: CadenceIneligibilityReason;
  /** Escopo do `OptOutRecord` que bloqueou, quando `reason === 'opt-out-record'` — observabilidade sem PII. */
  matchedScope?: OptOutRecord['scope'];
}

/** Mesma convenção de chave de `optOutCheck.service.ts`: optOut<Canal em PascalCase>. */
const CHANNEL_FLAG_KEY: Record<CadenceChannel, string> = {
  email: 'optOutEmail',
  whatsapp: 'optOutWhatsApp',
  voice: 'optOutVoice',
};

/**
 * `optOut`/`optedOut` genéricos bloqueiam qualquer canal; as flags por canal só bloqueiam quando
 * aquele canal está na sequência (um lead que pediu para não receber e-mail pode continuar
 * recebendo WhatsApp — mesmo critério do interceptor por contato).
 */
function customFieldsBlockChannels(
  customFields: Record<string, unknown> | null | undefined,
  channels: CadenceChannel[],
): boolean {
  if (!customFields || typeof customFields !== 'object' || Array.isArray(customFields)) {
    return false;
  }
  if (customFields.optOut === true || customFields.optedOut === true) return true;
  return channels.some((channel) => customFields[CHANNEL_FLAG_KEY[channel]] === true);
}

/**
 * Decide se UM lead pode entrar na cadência. Pura: recebe os registros de opt-out já consultados
 * em lote pelo chamador — nunca faz I/O, para ser testável sem banco.
 */
export function evaluateLeadCadenceEligibility(
  input: CadenceEligibilityLeadInput,
  optOutRecords: OptOutRecord[],
  channels: CadenceChannel[],
): CadenceEligibilityVerdict {
  const contact = input.contact ?? null;

  if (contact?.anonymizedOrDeleted) {
    return { eligible: false, reason: 'contact-anonymized' };
  }

  if (
    customFieldsBlockChannels(input.leadCustomFields, channels) ||
    customFieldsBlockChannels(contact?.customFields, channels)
  ) {
    return { eligible: false, reason: 'opt-out-flag' };
  }

  const query = normalizeOptOutSubject(input.subject);
  const blocking = optOutRecords.find(
    (record) =>
      subjectsMatch(record, query) &&
      channels.some((channel) => scopeBlocksChannel(record.scope, channel)),
  );

  if (blocking) {
    return { eligible: false, reason: 'opt-out-record', matchedScope: blocking.scope };
  }

  return { eligible: true };
}
