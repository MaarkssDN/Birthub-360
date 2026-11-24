export function normalizeTaskDateToUtcIso(inputDate: Date | string): string {
  const parsed = typeof inputDate === 'string' ? new Date(inputDate) : inputDate;
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Data de tarefa inválida para normalização UTC.');
  }
  return parsed.toISOString();
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

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
 * Existe porque `new Date('2026-11-23')` SEMPRE produz `2026-11-23T00:00:00.000Z` (meia-noite
 * UTC), que em `America/Sao_Paulo` (UTC-3) renderiza como 22/11 21h — um dia antes. Formulários
 * com `<input type="date">` produzem exatamente esse formato, então toda atividade criada pela
 * Agenda caía no dia anterior para usuários em fusos negativos. Esta função é a peça que falta
 * para o frontend/backend tratarem "dia civil no fuso do usuário" em vez de "meia-noite UTC".
 *
 * Limitação conhecida: em horários inexistentes por transição de DST (ex.: 02:30 no "spring
 * forward"), o resultado é o instante mais próximo válido — não há horário de parede real para
 * representar, e falhar a criação da tarefa seria pior.
 */
export function wallTimeInZoneToUtcIso(
  date: string,
  time?: string | null,
  timeZone: string = 'America/Sao_Paulo',
): string {
  const dateMatch = DATE_ONLY_PATTERN.exec(date.trim());
  if (!dateMatch) {
    throw new Error(`Data de tarefa inválida para conversão de fuso: "${date}".`);
  }
  const [, year, month, day] = dateMatch;
  const y = Number(year);
  const mo = Number(month);
  const d = Number(day);
  // Rejeita datas inexistentes (ex.: 2026-02-30) que o regex aceitaria.
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) {
    throw new Error(`Data de tarefa inexistente no calendário: "${date}".`);
  }

  let hour = 0;
  let minute = 0;
  let second = 0;
  if (time != null && String(time).trim() !== '') {
    const timeMatch = TIME_PATTERN.exec(String(time).trim());
    if (!timeMatch) {
      throw new Error(`Horário de tarefa inválido para conversão de fuso: "${time}".`);
    }
    hour = Number(timeMatch[1]);
    minute = Number(timeMatch[2]);
    second = Number(timeMatch[3] ?? '0');
    if (hour > 23 || minute > 59 || second > 59) {
      throw new Error(`Horário de tarefa fora do intervalo: "${time}".`);
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
      throw new Error(`Fuso horário inválido para conversão de tarefa: "${timeZone}".`);
    }
    throw err;
  }
}

export function formatUtcTaskToClientTimezone(
  utcIsoString: string,
  clientTimezone: string = 'America/Sao_Paulo',
): string {
  const date = new Date(utcIsoString);
  if (Number.isNaN(date.getTime())) {
    throw new Error('String ISO UTC inválida.');
  }
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: clientTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(date);
}
