export interface CadenceDispatchWindowConfig {
  startHour?: number;
  endHour?: number;
  allowedWeekdays?: readonly number[];
}

export interface CadenceWindowDecision {
  allowed: boolean;
  timezone: string;
  localHour: number;
  localWeekday: number;
  delayMsUntilNextWindow: number;
  reason?: 'OUTSIDE_BUSINESS_HOURS' | 'WEEKEND_OR_NON_BUSINESS_DAY';
}

const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 19;
const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5] as const; // Seg a Sex

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function resolveLocalTimeParts(
  referenceDate: Date,
  timezone: string,
): { hour: number; minute: number; weekday: number; normalizedTimezone: string } {
  let normalizedTimezone = timezone?.trim() || 'America/Sao_Paulo';
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: normalizedTimezone,
      hour12: false,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    normalizedTimezone = 'America/Sao_Paulo';
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: normalizedTimezone,
      hour12: false,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const parts = formatter.formatToParts(referenceDate);
  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0';
  const minStr = parts.find((p) => p.type === 'minute')?.value ?? '0';
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';

  const rawHour = Number.parseInt(hourStr, 10);
  const hour = rawHour === 24 ? 0 : rawHour;
  const minute = Number.parseInt(minStr, 10);
  const weekday = WEEKDAY_MAP[weekdayStr] ?? 1;

  return { hour, minute, weekday, normalizedTimezone };
}

export function evaluateCadenceBusinessWindow(
  referenceDate: Date,
  leadTimezone: string,
  config: CadenceDispatchWindowConfig = {},
): CadenceWindowDecision {
  const startHour = config.startHour ?? DEFAULT_START_HOUR;
  const endHour = config.endHour ?? DEFAULT_END_HOUR;
  const allowedWeekdays = config.allowedWeekdays ?? DEFAULT_WEEKDAYS;

  const { hour, minute, weekday, normalizedTimezone } = resolveLocalTimeParts(
    referenceDate,
    leadTimezone,
  );

  const isAllowedDay = allowedWeekdays.includes(weekday);
  const isWithinHours = hour >= startHour && hour < endHour;

  if (isAllowedDay && isWithinHours) {
    return {
      allowed: true,
      timezone: normalizedTimezone,
      localHour: hour,
      localWeekday: weekday,
      delayMsUntilNextWindow: 0,
    };
  }

  // Calcula quantos minutos faltam até o próximo dia útil às startHour:00
  let daysToAdd = 0;
  let candidateWeekday = weekday;

  if (!isAllowedDay || hour >= endHour) {
    do {
      daysToAdd += 1;
      candidateWeekday = (weekday + daysToAdd) % 7;
    } while (!allowedWeekdays.includes(candidateWeekday) && daysToAdd <= 7);
  }

  const minutesUntilTargetHour =
    daysToAdd === 0
      ? (startHour - hour) * 60 - minute
      : (24 - hour + (daysToAdd - 1) * 24 + startHour) * 60 - minute;

  return {
    allowed: false,
    timezone: normalizedTimezone,
    localHour: hour,
    localWeekday: weekday,
    delayMsUntilNextWindow: Math.max(60_000, minutesUntilTargetHour * 60_000),
    reason: isAllowedDay ? 'OUTSIDE_BUSINESS_HOURS' : 'WEEKEND_OR_NON_BUSINESS_DAY',
  };
}
