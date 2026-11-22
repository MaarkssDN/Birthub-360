export function formatCurrency(value: number | null | undefined, currency = 'BRL'): string {
  if (value == null) return 'Não disponível';
  return value.toLocaleString('pt-BR', { style: 'currency', currency });
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return 'Não disponível';
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

export function formatMultiple(value: number | null | undefined): string {
  if (value == null) return 'Não disponível';
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}x`;
}
