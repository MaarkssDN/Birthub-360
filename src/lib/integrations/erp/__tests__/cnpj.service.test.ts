import { describe, expect, it, vi } from 'vitest';
import {
  CachedCnpjEnrichmentService,
  CNPJ_CACHE_TTL_DAYS,
  CNPJ_CACHE_TTL_MS,
  normalizeCnpjDigits,
} from '../cnpj.service.js';

// CNPJs sintéticos gerados localmente com o algoritmo oficial de dígitos verificadores
// (src/lib/cnpj.ts) — nenhum dado real de empresa.
const VALID_CNPJ_DIGITS = '20540912000163';
const VALID_CNPJ_FORMATTED = '20.540.912/0001-63';
const INVALID_CHECK_DIGIT = '20540912000108'; // 14 dígitos, dígito verificador errado

describe('normalizeCnpjDigits', () => {
  it('aceita CNPJ válido em dígitos puros e devolve só os 14 dígitos', () => {
    expect(normalizeCnpjDigits(VALID_CNPJ_DIGITS)).toBe(VALID_CNPJ_DIGITS);
  });

  it('aceita CNPJ válido formatado (pontuação é removida)', () => {
    expect(normalizeCnpjDigits(VALID_CNPJ_FORMATTED)).toBe(VALID_CNPJ_DIGITS);
  });

  it('rejeita CNPJ com menos de 14 dígitos', () => {
    expect(() => normalizeCnpjDigits('2054091200016')).toThrow(/CNPJ inválido/);
  });

  it('rejeita CNPJ com mais de 14 dígitos', () => {
    expect(() => normalizeCnpjDigits('205409120001630')).toThrow(/CNPJ inválido/);
  });

  it('rejeita CNPJ com dígito verificador inválido (não consome provider)', () => {
    expect(() => normalizeCnpjDigits(INVALID_CHECK_DIGIT)).toThrow(/CNPJ inválido/);
  });

  it('rejeita CNPJ com todos os dígitos iguais', () => {
    expect(() => normalizeCnpjDigits('11111111111111')).toThrow(/CNPJ inválido/);
  });

  it('rejeita string vazia', () => {
    expect(() => normalizeCnpjDigits('')).toThrow(/CNPJ inválido/);
  });
});

describe('CachedCnpjEnrichmentService', () => {
  const profile = {
    cnpj: VALID_CNPJ_DIGITS,
    razaoSocial: 'Empresa Sintética LTDA',
    situacaoCadastral: 'ATIVA',
  };

  it('busca no provider na primeira consulta e devolve fromCache=false', async () => {
    const providerFetch = vi.fn().mockResolvedValue(profile);
    const service = new CachedCnpjEnrichmentService(providerFetch);

    const result = await service.lookupCnpj(VALID_CNPJ_FORMATTED);

    expect(result.fromCache).toBe(false);
    expect(result.profile.cnpj).toBe(VALID_CNPJ_DIGITS);
    expect(result.profile.razaoSocial).toBe('Empresa Sintética LTDA');
    expect(providerFetch).toHaveBeenCalledTimes(1);
    expect(providerFetch).toHaveBeenCalledWith(VALID_CNPJ_DIGITS);
  });

  it('devolve do cache dentro do TTL sem chamar o provider de novo', async () => {
    const providerFetch = vi.fn().mockResolvedValue(profile);
    const service = new CachedCnpjEnrichmentService(providerFetch);
    const t0 = 1_000_000;

    await service.lookupCnpj(VALID_CNPJ_DIGITS, t0);
    const second = await service.lookupCnpj(VALID_CNPJ_DIGITS, t0 + CNPJ_CACHE_TTL_MS - 1);

    expect(second.fromCache).toBe(true);
    expect(second.profile).toEqual(firstProfile(profile, t0));
    expect(providerFetch).toHaveBeenCalledTimes(1);
  });

  it('expira o cache após o TTL e busca no provider novamente', async () => {
    const providerFetch = vi.fn().mockResolvedValue(profile);
    const service = new CachedCnpjEnrichmentService(providerFetch);
    const t0 = 1_000_000;

    await service.lookupCnpj(VALID_CNPJ_DIGITS, t0);
    const fresh = await service.lookupCnpj(VALID_CNPJ_DIGITS, t0 + CNPJ_CACHE_TTL_MS);

    expect(fresh.fromCache).toBe(false);
    expect(providerFetch).toHaveBeenCalledTimes(2);
  });

  it('propaga erro do provider sem gravar no cache', async () => {
    const providerFetch = vi.fn().mockRejectedValue(new Error('provider indisponível'));
    const service = new CachedCnpjEnrichmentService(providerFetch);

    await expect(service.lookupCnpj(VALID_CNPJ_DIGITS)).rejects.toThrow('provider indisponível');

    // Falha não é cacheada: uma nova tentativa chama o provider de novo.
    providerFetch.mockResolvedValue(profile);
    const retry = await service.lookupCnpj(VALID_CNPJ_DIGITS);
    expect(retry.fromCache).toBe(false);
    expect(providerFetch).toHaveBeenCalledTimes(2);
  });

  it('rejeita CNPJ inválido antes de chamar o provider', async () => {
    const providerFetch = vi.fn();
    const service = new CachedCnpjEnrichmentService(providerFetch);

    await expect(service.lookupCnpj(INVALID_CHECK_DIGIT)).rejects.toThrow(/CNPJ inválido/);
    expect(providerFetch).not.toHaveBeenCalled();
  });
});

function firstProfile(
  base: { cnpj: string; razaoSocial: string; situacaoCadastral: string },
  fetchedAtMs: number,
) {
  return { ...base, fetchedAtMs };
}

// Referência de TTL: 30 dias — garante que o contrato de cache não muda sem revisão.
it('mantém TTL de cache de 30 dias', () => {
  expect(CNPJ_CACHE_TTL_DAYS).toBe(30);
  expect(CNPJ_CACHE_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000);
});
