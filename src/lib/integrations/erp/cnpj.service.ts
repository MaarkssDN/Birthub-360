export const CNPJ_CACHE_TTL_DAYS = 30;
export const CNPJ_CACHE_TTL_MS = CNPJ_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

export interface CnpjCompanyProfile {
  cnpj: string;
  razaoSocial: string;
  situacaoCadastral: string;
  fetchedAtMs: number;
}

export function normalizeCnpjDigits(rawCnpj: string): string {
  const digits = rawCnpj.replace(/\D+/g, '');
  if (digits.length !== 14) {
    throw new Error(`CNPJ inválido ("${rawCnpj}"): deve conter 14 dígitos numéricos.`);
  }
  return digits;
}

export class CachedCnpjEnrichmentService {
  private readonly cache = new Map<string, CnpjCompanyProfile>();

  constructor(
    private readonly providerFetch: (
      cleanCnpj: string,
    ) => Promise<Omit<CnpjCompanyProfile, 'fetchedAtMs'>>,
  ) {}

  async lookupCnpj(
    rawCnpj: string,
    nowMs: number = Date.now(),
  ): Promise<{ profile: CnpjCompanyProfile; fromCache: boolean }> {
    const cleanCnpj = normalizeCnpjDigits(rawCnpj);
    const existing = this.cache.get(cleanCnpj);

    if (existing && nowMs - existing.fetchedAtMs < CNPJ_CACHE_TTL_MS) {
      return { profile: existing, fromCache: true };
    }

    const fresh = await this.providerFetch(cleanCnpj);
    const profile: CnpjCompanyProfile = {
      ...fresh,
      cnpj: cleanCnpj,
      fetchedAtMs: nowMs,
    };
    this.cache.set(cleanCnpj, profile);
    return { profile, fromCache: false };
  }
}
