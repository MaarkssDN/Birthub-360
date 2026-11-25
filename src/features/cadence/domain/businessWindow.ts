import {
  type CallWindow,
  DEFAULT_CALL_WINDOW,
  isWithinCallWindow,
} from '../../../shared/policies/coldCall.policy.js';

/**
 * Janela comercial das cadências avaliada no fuso do DESTINATÁRIO (lead), não do servidor.
 *
 * Contexto (handoff 44→17, Onda 4 / POS4-17-CADENCE-TZ): até aqui o worker injetava
 * `isWithinCallWindow(now)` com `DEFAULT_CALL_WINDOW` fixo em `America/Sao_Paulo` — um lead em
 * `America/Manaus` era avaliado como se estivesse em SP, e o avaliador por-timezone que já existia
 * (`src/features/crm/cadences/cadence.worker.ts`, dono do Agente 04) ficava morto em produção.
 *
 * Regras de resolução do fuso (nesta ordem — primeira que produzir um IANA válido vence):
 *  1. `explicitTimeZone` — `Lead.customFields.timezone` quando preenchido com um identificador
 *     IANA válido (escape hatch sem migration; ver `PrismaLeadSubjectResolver`).
 *  2. `state` — UF da `Company` vinculada ao lead, mapeada para o fuso IANA da região
 *     (`timeZoneForBrazilianState`). Cobre o caso comum: empresa de Manaus → `America/Manaus`.
 *  3. Fallback documentado: `America/Sao_Paulo` — mesma premissa que já era a global anterior,
 *     então leads sem nenhum sinal de localização mantêm exatamente o comportamento de antes.
 *
 * A janela em si (09:00–18:00, seg–sex) é a MESMA de `DEFAULT_CALL_WINDOW` — esta missão corrige
 * o fuso, não os horários. O avaliador do CRM usa 08:00–19:00; a divergência de horários entre os
 * dois avaliadores está registrada no handoff POS4 para decisão do 00 (não alterada aqui para não
 * mudar comportamento de produção além do escopo).
 */

export const DEFAULT_BUSINESS_TIMEZONE = 'America/Sao_Paulo';

/**
 * UF (sigla, maiúscula ou minúscula) → fuso IANA. Mapa das zonas oficiais brasileiras
 * (tzdb): os estados do horário de Brasília (UTC-3) usam os identificadores regionais da tzdb
 * quando existem (`America/Fortaleza`, `America/Recife`, `America/Bahia`, `America/Maceio`,
 * `America/Araguaina`, `America/Belem`) — mesmo offset atual de `America/Sao_Paulo`, mas corretos
 * caso a tzdb volte a divergir historicamente; os fusos de UTC-4/UTC-5 são os que realmente mudam
 * o resultado da janela.
 */
const UF_TO_TIMEZONE: Record<string, string> = {
  AC: 'America/Rio_Branco', // Acre — UTC-5
  AL: 'America/Maceio',
  AM: 'America/Manaus', // Amazonas (principal) — UTC-4
  AP: 'America/Belem',
  BA: 'America/Bahia',
  CE: 'America/Fortaleza',
  DF: 'America/Sao_Paulo',
  ES: 'America/Sao_Paulo',
  GO: 'America/Sao_Paulo',
  MA: 'America/Fortaleza',
  MG: 'America/Sao_Paulo',
  MS: 'America/Campo_Grande', // Mato Grosso do Sul — UTC-4
  MT: 'America/Cuiaba', // Mato Grosso — UTC-4
  PA: 'America/Belem', // Pará (principal, zona leste)
  PB: 'America/Fortaleza',
  PE: 'America/Recife',
  PI: 'America/Fortaleza',
  PR: 'America/Sao_Paulo',
  RJ: 'America/Sao_Paulo',
  RN: 'America/Fortaleza',
  RO: 'America/Porto_Velho', // Rondônia — UTC-4
  RR: 'America/Boa_Vista', // Roraima — UTC-4
  RS: 'America/Sao_Paulo',
  SC: 'America/Sao_Paulo',
  SE: 'America/Maceio',
  SP: 'America/Sao_Paulo',
  TO: 'America/Araguaina',
};

/** `true` quando `value` é um identificador IANA que o `Intl` desta plataforma aceita. */
export function isValidIanaTimeZone(value: string | null | undefined): value is string {
  if (typeof value !== 'string' || value.trim() === '') return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value.trim() });
    return true;
  } catch {
    return false;
  }
}

/**
 * Devolve o fuso IANA para uma UF brasileira, ou `null` quando a sigla não é reconhecida
 * (vazio, nome por extenso, UF de outro país, lixo). O chamador decide o fallback.
 */
export function timeZoneForBrazilianState(state: string | null | undefined): string | null {
  if (typeof state !== 'string') return null;
  const uf = state.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(uf)) return null;
  return UF_TO_TIMEZONE[uf] ?? null;
}

/**
 * Resolve o fuso efetivo da janela comercial de cadência. `explicitTimeZone` tem precedência
 * (override manual no lead); depois a UF da empresa; por fim `America/Sao_Paulo`. Qualquer valor
 * que não seja um IANA válido é ignorado — nunca propaga `RangeError` para o avaliador.
 */
export function resolveBusinessTimeZone(input?: {
  explicitTimeZone?: string | null;
  state?: string | null;
  fallback?: string;
}): string {
  const fallback =
    input?.fallback && isValidIanaTimeZone(input.fallback)
      ? input.fallback
      : DEFAULT_BUSINESS_TIMEZONE;
  const explicit = input?.explicitTimeZone;
  if (isValidIanaTimeZone(explicit)) return explicit.trim();
  const byState = timeZoneForBrazilianState(input?.state);
  if (byState) return byState;
  return fallback;
}

/**
 * `isWithinCallWindow` parametrizado pelo fuso do destinatário — mesmos horários/dias de
 * `DEFAULT_CALL_WINDOW` (09:00–18:00, seg–sex), trocando apenas `timeZone`. `timeZone` ausente,
 * vazio ou inválido cai no fallback SP (comportamento idêntico ao de antes desta correção).
 * `now` inválido devolve `false` — a cadência espera em vez de despachar às cegas.
 */
export function isWithinCadenceBusinessWindow(
  now: Date,
  timeZone?: string | null,
  window?: Omit<CallWindow, 'timeZone'>,
): boolean {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) return false;
  const resolved = resolveBusinessTimeZone({ explicitTimeZone: timeZone ?? null });
  return isWithinCallWindow(now, {
    ...(window ?? {
      startHour: DEFAULT_CALL_WINDOW.startHour,
      endHour: DEFAULT_CALL_WINDOW.endHour,
      weekdaysOnly: DEFAULT_CALL_WINDOW.weekdaysOnly,
    }),
    timeZone: resolved,
  });
}
