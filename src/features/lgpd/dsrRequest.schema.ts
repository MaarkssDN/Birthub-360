import { z } from 'zod';

/**
 * Schemas Zod do canal público de solicitação DSR (LGPD art. 18) — handoff
 * `.agents/handoffs/21-para-01-dsr-canal-publico-lgpd.md`.
 *
 * `rightType` usa os valores do enum `DataSubjectRightType` (schema.prisma) em
 * MAIÚSCULAS — o contrato público é o próprio enum, sem camada de tradução.
 */
export const DSR_RIGHT_TYPES = [
  'ACCESS',
  'PORTABILITY',
  'CORRECTION',
  'ERASURE',
  'CONSENT_REVOCATION',
  'SHARING_INFO',
] as const;

export type DsrRightType = (typeof DSR_RIGHT_TYPES)[number];

export const dsrRequestSchema = z.object({
  email: z.string().trim().email().max(160),
  rightType: z.enum(DSR_RIGHT_TYPES),
  // Canal preferencial de contato — informativo; a verificação de identidade é
  // SEMPRE pelo e-mail cadastrado do titular (nunca pelo canal declarado aqui).
  preferredChannel: z.enum(['email', 'whatsapp']).optional(),
  // Texto livre do titular (ex.: qual correção deseja, detalhe do pedido).
  details: z.string().trim().max(2000).optional(),
});

export type DsrRequestInput = z.infer<typeof dsrRequestSchema>;

export const dsrVerifySchema = z.object({
  protocol: z.string().trim().min(4).max(64),
  token: z.string().trim().min(10).max(200),
});

export type DsrVerifyInput = z.infer<typeof dsrVerifySchema>;

export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}
