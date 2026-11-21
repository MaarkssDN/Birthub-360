export interface MobileCrashEventPayload {
  message: string;
  stacktrace?: string;
  user?: {
    id?: string;
    email?: string;
    name?: string;
    cpf?: string;
  };
  extra?: Record<string, unknown>;
}

const EMAIL_PII_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const CPF_PII_REGEX = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const LEAD_NAME_PARAM_REGEX = /\b(?:leadName|patientName|clientName|nomePaciente)=([^&\s]+)/gi;

export function sanitizePiiFromCrashString(input: string): string {
  return input
    .replace(EMAIL_PII_REGEX, '[EMAIL_REDACTED]')
    .replace(CPF_PII_REGEX, '[CPF_REDACTED]')
    .replace(LEAD_NAME_PARAM_REGEX, 'leadName=[NAME_REDACTED]');
}

export function sanitizeSentryMobileCrashEvent(
  event: MobileCrashEventPayload,
): MobileCrashEventPayload {
  return {
    message: sanitizePiiFromCrashString(event.message),
    stacktrace: event.stacktrace ? sanitizePiiFromCrashString(event.stacktrace) : undefined,
    user: event.user
      ? {
          id: event.user.id,
          email: undefined,
          name: undefined,
          cpf: undefined,
        }
      : undefined,
    extra: event.extra
      ? Object.fromEntries(
          Object.entries(event.extra).map(([k, v]) => [
            k,
            typeof v === 'string' ? sanitizePiiFromCrashString(v) : '[REDACTED_OBJECT]',
          ]),
        )
      : undefined,
  };
}
