import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BUSINESS_TIMEZONE,
  isValidIanaTimeZone,
  isWithinCadenceBusinessWindow,
  resolveBusinessTimeZone,
  timeZoneForBrazilianState,
} from '../domain/businessWindow.js';

/**
 * POS4-17-CADENCE-TZ — janela comercial de cadências por fuso do destinatário.
 *
 * Todos os `now` abaixo são instantes UTC fixos; o que muda é o fuso em que a janela 09–18
 * seg–sex é avaliada. Nada aqui depende do fuso do processo de teste.
 */

// 2026-08-03 é uma SEGUNDA-feira. Em America/Sao_Paulo (UTC-3) 12:00Z = 09:00 local — início
// exato da janela. Em America/Manaus (UTC-4) o mesmo instante = 08:00 local — fora da janela.
const SEG_0900_SP = new Date('2026-08-03T12:00:00Z'); // 09:00 em SP / 08:00 em Manaus
const SEG_1400_UTC = new Date('2026-08-03T14:00:00Z'); // 11:00 SP / 10:00 Manaus / 13:00 Lisboa? não — ver abaixo
const SEG_2100_UTC = new Date('2026-08-03T21:00:00Z'); // 18:00 SP (fim exclusivo) / 20:00 em UTC+2
const SAB_1400_UTC = new Date('2026-08-01T14:00:00Z'); // sábado
const DOM_1400_UTC = new Date('2026-08-02T14:00:00Z'); // domingo

describe('timeZoneForBrazilianState', () => {
  it('mapeia UFs para os fusos IANA corretos', () => {
    expect(timeZoneForBrazilianState('AM')).toBe('America/Manaus');
    expect(timeZoneForBrazilianState('AC')).toBe('America/Rio_Branco');
    expect(timeZoneForBrazilianState('RO')).toBe('America/Porto_Velho');
    expect(timeZoneForBrazilianState('RR')).toBe('America/Boa_Vista');
    expect(timeZoneForBrazilianState('MT')).toBe('America/Cuiaba');
    expect(timeZoneForBrazilianState('MS')).toBe('America/Campo_Grande');
    expect(timeZoneForBrazilianState('SP')).toBe('America/Sao_Paulo');
    expect(timeZoneForBrazilianState('BA')).toBe('America/Bahia');
    expect(timeZoneForBrazilianState('PE')).toBe('America/Recife');
    expect(timeZoneForBrazilianState('TO')).toBe('America/Araguaina');
  });

  it('aceita minúsculas e espaços; rejeita lixo, nome por extenso e sigla de outro país', () => {
    expect(timeZoneForBrazilianState(' am ')).toBe('America/Manaus');
    expect(timeZoneForBrazilianState('Sao Paulo')).toBeNull();
    expect(timeZoneForBrazilianState('USA')).toBeNull();
    expect(timeZoneForBrazilianState('')).toBeNull();
    expect(timeZoneForBrazilianState(null)).toBeNull();
    expect(timeZoneForBrazilianState(undefined)).toBeNull();
  });
});

describe('isValidIanaTimeZone', () => {
  it('valida identificadores IANA reais e rejeita inválidos', () => {
    expect(isValidIanaTimeZone('America/Sao_Paulo')).toBe(true);
    expect(isValidIanaTimeZone('America/Manaus')).toBe(true);
    expect(isValidIanaTimeZone('UTC')).toBe(true);
    expect(isValidIanaTimeZone('Mars/Olympus')).toBe(false);
    expect(isValidIanaTimeZone('')).toBe(false);
    expect(isValidIanaTimeZone(null)).toBe(false);
    expect(isValidIanaTimeZone('   ')).toBe(false);
  });
});

describe('resolveBusinessTimeZone', () => {
  it('explícito válido vence; UF vem depois; fallback SP por último', () => {
    expect(
      resolveBusinessTimeZone({ explicitTimeZone: 'Europe/Lisbon', state: 'AM' }),
    ).toBe('Europe/Lisbon');
    expect(resolveBusinessTimeZone({ state: 'AM' })).toBe('America/Manaus');
    expect(resolveBusinessTimeZone({ state: 'lixo' })).toBe(DEFAULT_BUSINESS_TIMEZONE);
    expect(resolveBusinessTimeZone({})).toBe(DEFAULT_BUSINESS_TIMEZONE);
    expect(resolveBusinessTimeZone()).toBe(DEFAULT_BUSINESS_TIMEZONE);
  });

  it('explícito inválido não propaga RangeError — cai para UF/fallback', () => {
    expect(resolveBusinessTimeZone({ explicitTimeZone: 'Nao/Existe', state: 'AC' })).toBe(
      'America/Rio_Branco',
    );
    expect(resolveBusinessTimeZone({ explicitTimeZone: 'Nao/Existe' })).toBe(
      DEFAULT_BUSINESS_TIMEZONE,
    );
  });
});

describe('isWithinCadenceBusinessWindow', () => {
  it('mesmo instante UTC: dentro em SP, fora em Manaus (o bug original)', () => {
    // 12:00Z = 09:00 em SP (dentro, limite inclusivo) e 08:00 em Manaus (fora).
    expect(isWithinCadenceBusinessWindow(SEG_0900_SP, 'America/Sao_Paulo')).toBe(true);
    expect(isWithinCadenceBusinessWindow(SEG_0900_SP, 'America/Manaus')).toBe(false);
    // 14:00Z = 11:00 SP e 10:00 Manaus — dentro nos dois.
    expect(isWithinCadenceBusinessWindow(SEG_1400_UTC, 'America/Sao_Paulo')).toBe(true);
    expect(isWithinCadenceBusinessWindow(SEG_1400_UTC, 'America/Manaus')).toBe(true);
  });

  it('borda da janela: 09:00 dentro, 18:00 fora (fim exclusivo), 08:59 fora', () => {
    // 11:59Z = 08:59 SP
    expect(isWithinCadenceBusinessWindow(new Date('2026-08-03T11:59:00Z'), 'America/Sao_Paulo')).toBe(
      false,
    );
    // 21:00Z = 18:00 SP — fora (endHour exclusivo)
    expect(isWithinCadenceBusinessWindow(SEG_2100_UTC, 'America/Sao_Paulo')).toBe(false);
    // 20:59Z = 17:59 SP — dentro
    expect(isWithinCadenceBusinessWindow(new Date('2026-08-03T20:59:00Z'), 'America/Sao_Paulo')).toBe(
      true,
    );
  });

  it('fim de semana bloqueado em qualquer fuso', () => {
    expect(isWithinCadenceBusinessWindow(SAB_1400_UTC, 'America/Sao_Paulo')).toBe(false);
    expect(isWithinCadenceBusinessWindow(SAB_1400_UTC, 'America/Manaus')).toBe(false);
    expect(isWithinCadenceBusinessWindow(DOM_1400_UTC, 'America/Sao_Paulo')).toBe(false);
  });

  it('virada de dia: 23:30 local de Manaus ainda é o mesmo dia útil, mas fora do horário', () => {
    // 2026-08-04T02:30Z = 22:30 de 03/08 em Manaus (UTC-4) — fora por horário, não por dia.
    expect(isWithinCadenceBusinessWindow(new Date('2026-08-04T02:30:00Z'), 'America/Manaus')).toBe(
      false,
    );
    // 2026-08-03T02:30Z = 23:30 de 02/08 (domingo) em Manaus — fora por fim de semana também.
    expect(isWithinCadenceBusinessWindow(new Date('2026-08-03T02:30:00Z'), 'America/Manaus')).toBe(
      false,
    );
  });

  it('fuso com DST: a virada de horário de verão desloca a janela corretamente (America/New_York)', () => {
    // Verão (EDT, UTC-4): 13:30Z = 09:30 local → dentro.
    // Inverno (EST, UTC-5): mesmo horário UTC = 08:30 local → fora. Intl resolve o offset por data.
    const summer = new Date('2026-07-06T13:30:00Z'); // segunda-feira, EDT
    const winter = new Date('2026-01-05T13:30:00Z'); // segunda-feira, EST
    expect(isWithinCadenceBusinessWindow(summer, 'America/New_York')).toBe(true);
    expect(isWithinCadenceBusinessWindow(winter, 'America/New_York')).toBe(false);
  });

  it('timezone ausente/inválido cai no fallback America/Sao_Paulo (comportamento anterior)', () => {
    // Sem fuso: mesmo resultado de antes da correção — janela SP.
    expect(isWithinCadenceBusinessWindow(SEG_0900_SP)).toBe(true);
    expect(isWithinCadenceBusinessWindow(SEG_0900_SP, null)).toBe(true);
    expect(isWithinCadenceBusinessWindow(SEG_0900_SP, 'Nao/Existe')).toBe(true);
    expect(isWithinCadenceBusinessWindow(SEG_0900_SP, '   ')).toBe(true);
    // E fora da janela SP continua fora mesmo sem fuso.
    expect(isWithinCadenceBusinessWindow(SAB_1400_UTC)).toBe(false);
  });

  it('data inválida devolve false — a cadência espera em vez de despachar às cegas', () => {
    expect(isWithinCadenceBusinessWindow(new Date('invalid'), 'America/Sao_Paulo')).toBe(false);
    expect(isWithinCadenceBusinessWindow(new Date(NaN), 'America/Manaus')).toBe(false);
  });
});
