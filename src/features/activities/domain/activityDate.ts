import { AppError } from '../../../shared/middlewares/errorHandler.js';

/**
 * Utilitário de datas civis vs. instantes para Atividades comerciais.
 *
 * Contexto do bug (handoff 45-para-04-atividades-agenda-bugs.md, item 1): `<input type="date">`
 * produz `YYYY-MM-DD` e `new Date('2026-11-23')` SEMPRE resulta em
 * `2026-11-23T00:00:00.000Z` (meia-noite UTC — date-only ISO é UTC por especificação). Em
 * America/Sao_Paulo (UTC-3) esse instante é 22/11 21h, então a atividade criada para o dia 23
 * renderizava no dia 22 no calendário. As funções abaixo separam os dois conceitos:
 *
 * - "dia civil" (`YYYY-MM-DD` + horário de parede opcional) → instante UTC correto para o fuso
 *   do produto (`ACTIVITY_DEFAULT_TIME_ZONE`);
 * - "instante" (ISO completo ou `Date`) → usado como está.
 *
 * NOTA de integração: o Agente 45 (branch `agente/45-crm-agenda-onda3`) implementou
 * `wallTimeInZoneToUtcIso` em `src/features/crm/tasks/calendar.utils.ts` com a mesma lógica.
 * Esta cópia é deliberada e mínima (o Agente 41 não pode depender de arquivo de outro domínio
 * ainda não mergeado); a reconciliação das duplicatas fica para a integração da onda.
 */
export const ACTIVITY_DEFAULT_TIME_ZONE = 'America/Sao_Paulo';

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

function isDateOnlyString(value: string): boolean {
  return DATE_ONLY_PATTERN.test(value.trim());
}

/**
 * Diferença (em ms) entre o relógio de parede do `timeZone` e o UTC para um dado instante.
 * Calculada via `Intl` para respeitar DST do fuso — não usar offsets fixos como '-03:00'.
 */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const get = (type: string): number => Number(parts.find((p) => p.type === type)?.value ?? '0');
  const wallClockAsUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  // Descarta milissegundos do instante para a diferença ser estável.
  return wallClockAsUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * Converte uma data civil (`YYYY-MM-DD`, opcionalmente com `HH:mm`) interpretada no fuso
 * `timeZone` para o instante UTC equivalente (ISO 8601).
 *
 * Limitação conhecida: em horários inexistentes por transição de DST, o resultado é o instante
 * mais próximo válido — não há horário de parede real para representar.
 */
export function wallTimeInZoneToUtcIso(
  date: string,
  time?: string | null,
  timeZone: string = ACTIVITY_DEFAULT_TIME_ZONE,
): string {
  const dateMatch = DATE_ONLY_PATTERN.exec(date.trim());
  if (!dateMatch) {
    throw new AppError(`Data civil inválida para atividade: "${date}".`, 400);
  }
  const [, year, month, day] = dateMatch;
  const y = Number(year);
  const mo = Number(month);
  const d = Number(day);
  // Rejeita datas inexistentes (ex.: 2026-02-30) que o regex aceitaria.
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) {
    throw new AppError(`Data civil inexistente no calendário: "${date}".`, 400);
  }

  let hour = 0;
  let minute = 0;
  let second = 0;
  if (time != null && String(time).trim() !== '') {
    const timeMatch = TIME_PATTERN.exec(String(time).trim());
    if (!timeMatch) {
      throw new AppError(`Horário de atividade inválido: "${time}".`, 400);
    }
    hour = Number(timeMatch[1]);
    minute = Number(timeMatch[2]);
    second = Number(timeMatch[3] ?? '0');
    if (hour > 23 || minute > 59 || second > 59) {
      throw new AppError(`Horário de atividade fora do intervalo: "${time}".`, 400);
    }
  }

  try {
    // Primeiro palpite tratando o relógio de parede como UTC; depois corrige pelo offset real
    // do fuso naquele instante. A segunda passagem cobre a borda de DST em que o offset muda
    // entre o palpite e o resultado.
    const wallAsUtc = Date.UTC(y, mo - 1, d, hour, minute, second);
    const firstGuess = wallAsUtc - zoneOffsetMs(new Date(wallAsUtc), timeZone);
    const utcMs = wallAsUtc - zoneOffsetMs(new Date(firstGuess), timeZone);
    return new Date(utcMs).toISOString();
  } catch (err) {
    if (err instanceof RangeError) {
      throw new AppError(`Fuso horário inválido para atividade: "${timeZone}".`, 400);
    }
    throw err;
  }
}

/**
 * Normaliza a entrada de `date` de Activity para um `Date` (instante) seguro:
 * - `Date` → devolvido como está (já é um instante);
 * - string date-only `YYYY-MM-DD` → meia-noite civil em `ACTIVITY_DEFAULT_TIME_ZONE`
 *   (corrige a armadilha de `new Date('YYYY-MM-DD')` = meia-noite UTC);
 * - string com data+hora (ISO 8601) → `new Date(value)`, comportamento inalterado.
 */
export function parseActivityDate(
  value: string | Date,
  timeZone: string = ACTIVITY_DEFAULT_TIME_ZONE,
): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new AppError('Data de atividade inválida.', 400);
    }
    return value;
  }
  const trimmed = value.trim();
  if (isDateOnlyString(trimmed)) {
    return new Date(wallTimeInZoneToUtcIso(trimmed, null, timeZone));
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(`Data de atividade inválida: "${value}".`, 400);
  }
  return parsed;
}

/**
 * Intervalo `[gte, lt)` cobrindo o dia civil `YYYY-MM-DD` no fuso do produto — usado pelo filtro
 * `?date=` da listagem, que antes aplicava `setHours(0,0,0,0)` no fuso DO SERVIDOR (UTC em
 * produção), janela desalinhada do dia civil que o usuário enxerga.
 *
 * Retorna `null` quando `dateStr` não é date-only — o chamador decide o fallback.
 */
export function civilDayRangeUtc(
  dateStr: string,
  timeZone: string = ACTIVITY_DEFAULT_TIME_ZONE,
): { gte: Date; lt: Date } | null {
  const trimmed = dateStr.trim();
  if (!isDateOnlyString(trimmed)) return null;
  const match = DATE_ONLY_PATTERN.exec(trimmed);
  if (!match) return null;
  const y = Number(match[1]);
  const mo = Number(match[2]);
  const d = Number(match[3]);
  // Dia civil seguinte via Date.UTC (lida com fim de mês/ano sem aritmética manual).
  const next = new Date(Date.UTC(y, mo - 1, d + 1));
  const nextDay = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
  return {
    gte: new Date(wallTimeInZoneToUtcIso(trimmed, '00:00', timeZone)),
    lt: new Date(wallTimeInZoneToUtcIso(nextDay, '00:00', timeZone)),
  };
}

/**
 * `YYYY-MM-DD` → instante ISO da meia-noite NO FUSO LOCAL do navegador (frontend).
 * É o que o `<input type="date">` significa para o usuário: o dia que ele vê no próprio
 * calendário, não "meia-noite UTC" nem "meia-noite em America/Sao_Paulo" fixo.
 */
export function localDateOnlyToIso(dateStr: string): string {
  const match = DATE_ONLY_PATTERN.exec(dateStr.trim());
  if (!match) {
    throw new AppError(`Data de atividade inválida: "${dateStr}".`, 400);
  }
  const y = Number(match[1]);
  const mo = Number(match[2]);
  const d = Number(match[3]);
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) {
    throw new AppError(`Data civil inexistente no calendário: "${dateStr}".`, 400);
  }
  // new Date(y, m-1, d) constrói meia-noite no fuso local — sem a armadilha UTC do date-only ISO.
  return new Date(y, mo - 1, d).toISOString();
}

/**
 * `Date` → `YYYY-MM-DD` no fuso LOCAL (para alimentar `<input type="date">` e `?date=`).
 * NÃO usar `date.toISOString().split('T')[0]` aqui: em fusos negativos, à noite, o ISO em UTC já
 * virou o dia seguinte e o formulário abria preenchido com amanhã.
 */
export function toLocalDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
