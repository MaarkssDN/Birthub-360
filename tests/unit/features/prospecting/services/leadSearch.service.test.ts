import { describe, it, expect } from 'vitest';
import {
  buildCnpjCacheKey,
  cleanDomain,
  cleanDomainForCache,
  slugify,
  normalizeLinkedInUrl,
  isCnpjLookupIncomplete,
} from '../../../../../src/features/prospecting/outbound/server/services/leadSearch.service.js';

describe('leadSearch.service utils & cache keys', () => {
  describe('buildCnpjCacheKey', () => {
    it('returns cnpj key when valid 14+ digit CNPJ is provided', () => {
      expect(buildCnpjCacheKey({ name: 'Empresa X', cnpj: '11.222.333/0001-81' })).toBe(
        'cnpj:11222333000181',
      );
    });

    it('returns domain key when CNPJ is missing but domain is provided', () => {
      expect(buildCnpjCacheKey({ name: 'Empresa X', domain: 'EmpresaX.com.br' })).toBe(
        'cnpj:domain:empresax.com.br',
      );
    });

    it('returns name key when neither CNPJ nor domain is provided', () => {
      expect(buildCnpjCacheKey({ name: 'Empresa X' })).toBe('cnpj:name:empresa x');
    });
  });

  describe('cleanDomain & cleanDomainForCache', () => {
    it('cleans domain removing protocol, www and paths', () => {
      expect(cleanDomain('https://www.example.com/page')).toBe('example.com');
      expect(cleanDomain('')).toBe('');
    });

    it('cleans domain for cache in lowercase', () => {
      expect(cleanDomainForCache('HTTPS://WWW.EXAMPLE.COM/PAGE')).toBe('example.com');
      expect(cleanDomainForCache(undefined)).toBe('');
    });
  });

  describe('slugify & normalizeLinkedInUrl', () => {
    it('converts text to slug format', () => {
      expect(slugify('Empresa de Tecnologia & Inovação')).toBe('empresa-de-tecnologia-inovacao');
    });

    it('normalizes linkedin URLs correctly', () => {
      expect(normalizeLinkedInUrl('linkedin.com/in/john')).toBe('https://www.linkedin.com/in/john');
      expect(normalizeLinkedInUrl('http://linkedin.com/in/john')).toBe('https://www.linkedin.com/in/john');
      expect(normalizeLinkedInUrl('')).toBe('');
    });
  });

  describe('isCnpjLookupIncomplete', () => {
    it('detects incomplete CNPJ lookup when cnpj_raw is present but razao_social is missing', () => {
      expect(isCnpjLookupIncomplete({ cnpj_raw: '11222333000181' })).toBe(true);
      expect(isCnpjLookupIncomplete({ cnpj_raw: '11222333000181', razao_social: 'Empresa LTDA' })).toBe(false);
    });
  });
});
