export function normalizeTaskDateToUtcIso(inputDate: Date | string): string {
  const parsed = typeof inputDate === 'string' ? new Date(inputDate) : inputDate;
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Data de tarefa inválida para normalização UTC.');
  }
  return parsed.toISOString();
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
