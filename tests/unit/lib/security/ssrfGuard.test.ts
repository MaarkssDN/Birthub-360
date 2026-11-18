import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isPrivateOrInternalHost,
  assertSafeOutboundUrl,
} from '@/lib/security/ssrfGuard.js';

const lookupMock = vi.fn();

vi.mock('node:dns/promises', () => ({
  default: { lookup: (...args: unknown[]) => lookupMock(...args) },
}));

describe('ssrfGuard — isPrivateOrInternalHost (checagem literal, sem DNS)', () => {
  it.each([
    'localhost',
    'app.localhost',
    '127.0.0.1',
    '127.53.0.1',
    '0.0.0.0',
    '10.0.0.1',
    '10.255.255.255',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254', // metadata de cloud
    '169.254.0.1',
    '100.64.0.1', // CGNAT
    '100.127.255.255',
    '192.0.0.1', // IETF protocol assignments
    '198.18.0.1', // benchmarking
    '224.0.0.1', // multicast
    '255.255.255.255',
    '::1',
    '[::1]',
    '::',
    'fe80::1',
    'febf::1', // ainda dentro de fe80::/10
    'fc00::1',
    'fd12:3456::1',
    '::ffff:127.0.0.1', // IPv4-mapeado
    '::ffff:10.0.0.1',
    '::ffff:7f00:1', // IPv4-mapeado em hex — forma que new URL() produz (127.0.0.1)
    '::ffff:a00:1', // idem, 10.0.0.1
    '::ffff:c0a8:1', // idem, 192.168.0.1
    // Mecanismos de transição IPv4-em-IPv6 com IPv4 embutido privado
    // (handoff `.agents/handoffs/onda-2/15-para-01-ssrf-ipv6-transition-ranges.md`):
    '2002:7f00:1::', // 6to4 -> 127.0.0.1
    '2002:a00:1::', // 6to4 -> 10.0.0.1
    '2002:c0a8:101::', // 6to4 -> 192.168.1.1
    '2001:0:4136:e378:8000:63bf:3fff:fdd2', // Teredo (IPv4 ofuscado -> bloqueio conservador)
    '64:ff9b::7f00:1', // NAT64 -> 127.0.0.1
    '64:ff9b::a00:1', // NAT64 -> 10.0.0.1
    '::7f00:1', // IPv4-compatible deprecado -> 127.0.0.1
    '::a00:1', // IPv4-compatible -> 10.0.0.1
    'printer.local',
    'service.internal',
    'host.lan',
  ])('rejeita host interno/reservado: %s', (host) => {
    expect(isPrivateOrInternalHost(host)).toBe(true);
  });

  it.each([
    'example.com',
    'webhook.example.org',
    '8.8.8.8',
    '1.1.1.1',
    '172.15.0.1', // fora de 172.16/12
    '172.32.0.1',
    '11.0.0.1',
    '192.167.0.1',
    '100.63.0.1', // fora de CGNAT
    '100.128.0.1',
    '169.253.0.1',
    '2001:4860:4860::8888', // IPv6 público
    '2606:4700:4700::1111',
    '::ffff:808:808', // IPv4-mapeado público (8.8.8.8)
    '2002:808:808::', // 6to4 com IPv4 embutido público (8.8.8.8)
    '64:ff9b::808:808', // NAT64 com IPv4 embutido público (8.8.8.8)
    '::808:808', // IPv4-compatible com IPv4 embutido público (8.8.8.8)
  ])('aceita host público: %s', (host) => {
    expect(isPrivateOrInternalHost(host)).toBe(false);
  });
});

describe('ssrfGuard — assertSafeOutboundUrl', () => {
  beforeEach(() => {
    lookupMock.mockReset();
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    'http://169.254.169.254/latest/meta-data',
    'http://localhost/',
    'http://127.0.0.1:8080/admin',
    'http://192.168.1.1/',
    'http://10.0.0.1/',
    'http://172.16.0.1/',
    'http://100.64.0.1/',
    'http://0.0.0.0/',
    'http://[::1]/',
    'https://[fd00::1]/',
    'https://[::ffff:7f00:1]/', // IPv4-mapeado hex -> 127.0.0.1 (bypass A-1 do review 24)
    'https://[::ffff:a00:1]/', // -> 10.0.0.1
    'https://[::ffff:c0a8:1]/', // -> 192.168.0.1
    'https://[2002:7f00:1::]/', // 6to4 -> 127.0.0.1
    'https://[2002:a00:1::]/', // 6to4 -> 10.0.0.1
    'https://[2001:0:4136:e378:8000:63bf:3fff:fdd2]/', // Teredo
    'https://[64:ff9b::a00:1]/', // NAT64 -> 10.0.0.1
    'https://[::a00:1]/', // IPv4-compatible -> 10.0.0.1
    'http://2130706433/', // IPv4 decimal -> 127.0.0.1 (WHATWG URL normaliza)
    'http://0x7f.1/', // IPv4 hex -> 127.0.0.1
    'http://0177.0.0.1/', // IPv4 octal -> 127.0.0.1
    'file:///etc/passwd',
    'ftp://example.com/resource',
    'gopher://example.com/',
    'javascript:alert(1)',
    'not-a-url',
  ])('rejeita URL insegura: %s', async (url) => {
    await expect(assertSafeOutboundUrl(url)).rejects.toThrow();
  });

  it('aceita IP literal público sem consultar DNS', async () => {
    const url = await assertSafeOutboundUrl('https://8.8.8.8/resolve');
    expect(url.hostname).toBe('8.8.8.8');
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it('aceita hostname público que resolve para IP público', async () => {
    const url = await assertSafeOutboundUrl('https://hooks.example.com/tenant-1');
    expect(url.hostname).toBe('hooks.example.com');
    expect(lookupMock).toHaveBeenCalledWith('hooks.example.com', { all: true });
  });

  it('rejeita hostname que resolve para IP privado', async () => {
    lookupMock.mockResolvedValue([{ address: '10.1.2.3', family: 4 }]);
    await expect(assertSafeOutboundUrl('https://evil.example.com/')).rejects.toThrow(
      /privado\/reservado/,
    );
  });

  it('rejeita hostname com resolução mista (público + privado)', async () => {
    lookupMock.mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '192.168.0.10', family: 4 },
    ]);
    await expect(assertSafeOutboundUrl('https://mixed.example.com/')).rejects.toThrow();
  });

  it('rejeita hostname que resolve para IPv6 link-local', async () => {
    lookupMock.mockResolvedValue([{ address: 'fe80::1', family: 6 }]);
    await expect(assertSafeOutboundUrl('https://v6.example.com/')).rejects.toThrow();
  });

  it('rejeita hostname que não resolve', async () => {
    lookupMock.mockResolvedValue([]);
    await expect(assertSafeOutboundUrl('https://nonexistent.invalid/')).rejects.toThrow(
      /resolver/,
    );
  });

  it('tolera http fora de produção (NODE_ENV=test)', async () => {
    const url = await assertSafeOutboundUrl('http://hooks.localtest.me/ping');
    expect(url.protocol).toBe('http:');
  });

  it('rejeita http em produção mesmo para host público', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    await expect(assertSafeOutboundUrl('http://hooks.example.com/ping')).rejects.toThrow(
      /HTTPS/,
    );
  });

  it('aceita https em produção', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    await expect(
      assertSafeOutboundUrl('https://hooks.example.com/ping'),
    ).resolves.toBeInstanceOf(URL);
  });
});

describe('validateWebhookUrl (url-validator.ts) — delega ao ssrfGuard', () => {
  it('rejeita destino interno mesmo fora de produção', async () => {
    const { validateWebhookUrl } = await import('@/lib/security/url-validator.js');
    await expect(validateWebhookUrl('http://169.254.169.254/')).rejects.toThrow();
    await expect(validateWebhookUrl('https://10.0.0.1/')).rejects.toThrow();
  });

  it('aceita webhook público', async () => {
    const { validateWebhookUrl } = await import('@/lib/security/url-validator.js');
    await expect(validateWebhookUrl('https://hooks.example.com/x')).resolves.toBe(true);
  });
});
