import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveSecureCookiesEnabled } from '../cookie-security.js';

// POS3-96-SESSIONS-COOKIES (Onda 4, Agente 96): o atributo `Secure` do cookie de sessão
// do Better Auth é fail-closed em produção. Estes testes cobrem a decisão pura
// (resolveSecureCookiesEnabled) e a fiação real em `auth.options.advanced`.

describe('resolveSecureCookiesEnabled — decisão do atributo Secure', () => {
  it('produção SEM qualquer flag → Secure obrigatório (fail-closed)', () => {
    expect(
      resolveSecureCookiesEnabled({
        NODE_ENV: 'production',
        SECURE_COOKIES: 'false',
        BETTER_AUTH_URL: undefined,
      }),
    ).toBe(true);
  });

  it('produção com BETTER_AUTH_URL http:// (domínio público sem TLS declarado) → Secure mesmo assim', () => {
    // Regressão do handoff onda-3 96-para-00-cookie-secure-producao: antes, esta config
    // passava no boot e emitia cookie de sessão sem Secure.
    expect(
      resolveSecureCookiesEnabled({
        NODE_ENV: 'production',
        SECURE_COOKIES: 'false',
        BETTER_AUTH_URL: 'http://app.birthhub360.com.br',
      }),
    ).toBe(true);
  });

  it('desenvolvimento sem flags → Secure desligado (localhost http precisa funcionar)', () => {
    expect(
      resolveSecureCookiesEnabled({
        NODE_ENV: 'development',
        SECURE_COOKIES: 'false',
        BETTER_AUTH_URL: 'http://localhost:3024',
      }),
    ).toBe(false);
  });

  it('desenvolvimento com SECURE_COOKIES=true → Secure ligado', () => {
    expect(
      resolveSecureCookiesEnabled({
        NODE_ENV: 'development',
        SECURE_COOKIES: 'true',
        BETTER_AUTH_URL: undefined,
      }),
    ).toBe(true);
  });

  it('desenvolvimento com BETTER_AUTH_URL https → Secure ligado', () => {
    expect(
      resolveSecureCookiesEnabled({
        NODE_ENV: 'development',
        SECURE_COOKIES: 'false',
        BETTER_AUTH_URL: 'https://preview.example.com',
      }),
    ).toBe(true);
  });
});

describe('auth.options.advanced — fiação real do Better Auth', () => {
  const ENV_KEYS = [
    'NODE_ENV',
    'SECURE_COOKIES',
    'BETTER_AUTH_URL',
    'BETTER_AUTH_SECRET',
    'ALLOW_DEV_AUTH_BYPASS',
    'TRUST_PROXY',
    'PUBLIC_BASE_URL',
    'PRODUCTION_DOMAIN',
    'DOMAIN',
  ] as const;
  const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = saved[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    vi.resetModules();
  });

  function snapshotEnv() {
    for (const key of ENV_KEYS) saved[key] = process.env[key];
  }

  it('em NODE_ENV=production, useSecureCookies e defaultCookieAttributes.secure são true', async () => {
    snapshotEnv();
    // Monta um ambiente de produção mínimo e VÁLIDO para src/config/env.ts (que aborta o
    // processo em falha de validação quando NODE_ENV !== 'test'):
    //  - BETTER_AUTH_SECRET forte (SEC-001 exige >= 32 chars fora de placeholder);
    //  - BETTER_AUTH_URL removida para provar que Secure não depende dela;
    //  - ALLOW_DEV_AUTH_BYPASS=false (trava de produção em env.ts);
    //  - variáveis de domínio público ausentes para não disparar a checagem de localhost.
    process.env.NODE_ENV = 'production';
    process.env.BETTER_AUTH_SECRET = 'x'.repeat(48);
    process.env.ALLOW_DEV_AUTH_BYPASS = 'false';
    delete process.env.BETTER_AUTH_URL;
    delete process.env.PUBLIC_BASE_URL;
    delete process.env.PRODUCTION_DOMAIN;
    delete process.env.DOMAIN;
    process.env.SECURE_COOKIES = 'false';

    vi.resetModules();
    const { auth } = await import('../../auth.js');
    const advanced = (auth.options as any).advanced;

    expect(advanced.useSecureCookies).toBe(true);
    expect(advanced.defaultCookieAttributes.secure).toBe(true);
    expect(advanced.defaultCookieAttributes.httpOnly).toBe(true);
    expect(advanced.defaultCookieAttributes.sameSite).toBe('lax');
    // O import dinâmico de src/lib/auth.ts instancia PrismaClient + betterAuth() —
    // bem mais pesado que um teste unitário típico; timeout estendido só para este caso.
  }, 90000);
});
