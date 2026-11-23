// @vitest-environment node
/**
 * Agente 15 — abortos obrigatórios dos scripts de backfill/rotação (parecer 24 do #102):
 * chave explícita no env em QUALQUER NODE_ENV (sem fallback para a chave de dev), sem fallback
 * OLD_KEY→CREDENTIALS_ENCRYPTION_KEY / NEW_KEY→NEW_CREDENTIALS_ENCRYPTION_KEY, e --apply só com
 * --snapshot-confirmed=<id>. Puro: nada aqui conecta em banco.
 */
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import pg from 'pg';
import { describe, expect, it } from 'vitest';
import {
  assertBackfillPreconditions,
  assertRotationPreconditions,
  assertVerifyPreconditions,
  isVerifyMode,
  parseKeyEnvName,
  parseReencryptScope,
  parseSnapshotConfirmed,
  requireRedisUrl,
  resolveDbSsl,
  ScriptPreconditionError,
} from '../../../scripts/security/credential-script-guards.js';

const k = () => randomBytes(32).toString('base64');
const ARGV0 = ['node', 'script.ts'];

describe('assertBackfillPreconditions', () => {
  it.each(['development', 'test', 'production', undefined])(
    'aborta sem CREDENTIALS_ENCRYPTION_KEY explícita (NODE_ENV=%s)',
    (nodeEnv) => {
      expect(() => assertBackfillPreconditions({ NODE_ENV: nodeEnv }, ARGV0)).toThrow(
        ScriptPreconditionError,
      );
      expect(() =>
        assertBackfillPreconditions({ NODE_ENV: nodeEnv, CREDENTIALS_ENCRYPTION_KEY: '  ' }, ARGV0),
      ).toThrow(/CREDENTIALS_ENCRYPTION_KEY/);
    },
  );

  it('aborta com chave inválida (≠ 32 bytes)', () => {
    expect(() =>
      assertBackfillPreconditions(
        { CREDENTIALS_ENCRYPTION_KEY: Buffer.alloc(16).toString('base64') },
        ARGV0,
      ),
    ).toThrow(/32 bytes/);
  });

  it('dry-run com chave válida passa, sem snapshot', () => {
    expect(assertBackfillPreconditions({ CREDENTIALS_ENCRYPTION_KEY: k() }, ARGV0)).toEqual({
      apply: false,
      snapshotId: null,
    });
  });

  it('--apply sem --snapshot-confirmed aborta; com id vazio aborta; com id passa', () => {
    const env = { CREDENTIALS_ENCRYPTION_KEY: k() };
    expect(() => assertBackfillPreconditions(env, [...ARGV0, '--apply'])).toThrow(
      /snapshot-confirmed/,
    );
    expect(() =>
      assertBackfillPreconditions(env, [...ARGV0, '--apply', '--snapshot-confirmed=']),
    ).toThrow(/snapshot-confirmed/);
    expect(() =>
      assertBackfillPreconditions(env, [...ARGV0, '--apply', '--snapshot-confirmed']),
    ).toThrow(/snapshot-confirmed/);
    expect(
      assertBackfillPreconditions(env, [...ARGV0, '--apply', '--snapshot-confirmed=rds-snap-42']),
    ).toEqual({ apply: true, snapshotId: 'rds-snap-42' });
  });
});

describe('assertRotationPreconditions', () => {
  it('aborta se faltar OLD_KEY — sem fallback para CREDENTIALS_ENCRYPTION_KEY', () => {
    const cur = k();
    expect(() =>
      assertRotationPreconditions({ CREDENTIALS_ENCRYPTION_KEY: cur, NEW_KEY: k() }, ARGV0),
    ).toThrow(/OLD_KEY/);
  });

  it('aborta se faltar NEW_KEY — sem fallback para NEW_CREDENTIALS_ENCRYPTION_KEY', () => {
    const cur = k();
    expect(() =>
      assertRotationPreconditions(
        { CREDENTIALS_ENCRYPTION_KEY: cur, OLD_KEY: cur, NEW_CREDENTIALS_ENCRYPTION_KEY: k() },
        ARGV0,
      ),
    ).toThrow(/NEW_KEY/);
  });

  it.each(['development', 'production', undefined])(
    'aborta sem CREDENTIALS_ENCRYPTION_KEY explícita (NODE_ENV=%s)',
    (nodeEnv) => {
      expect(() =>
        assertRotationPreconditions({ NODE_ENV: nodeEnv, OLD_KEY: k(), NEW_KEY: k() }, ARGV0),
      ).toThrow(/CREDENTIALS_ENCRYPTION_KEY/);
    },
  );

  it('aborta com OLD==NEW, chave atual fora de {OLD,NEW} e --apply com --dry-run', () => {
    const a = k();
    expect(() =>
      assertRotationPreconditions({ CREDENTIALS_ENCRYPTION_KEY: a, OLD_KEY: a, NEW_KEY: a }, ARGV0),
    ).toThrow(/idênticas/);
    expect(() =>
      assertRotationPreconditions(
        { CREDENTIALS_ENCRYPTION_KEY: k(), OLD_KEY: a, NEW_KEY: k() },
        ARGV0,
      ),
    ).toThrow(/não corresponde/);
    expect(() =>
      assertRotationPreconditions({ CREDENTIALS_ENCRYPTION_KEY: a, OLD_KEY: a, NEW_KEY: k() }, [
        ...ARGV0,
        '--apply',
        '--dry-run',
        '--snapshot-confirmed=s1',
      ]),
    ).toThrow(/mutuamente exclusivos/);
  });

  it('dry-run por padrão; --apply exige --snapshot-confirmed=<id>', () => {
    const a = k();
    const env = { CREDENTIALS_ENCRYPTION_KEY: a, OLD_KEY: a, NEW_KEY: k() };
    expect(assertRotationPreconditions(env, ARGV0)).toMatchObject({
      apply: false,
      snapshotId: null,
    });
    expect(() => assertRotationPreconditions(env, [...ARGV0, '--apply'])).toThrow(
      /snapshot-confirmed/,
    );
    const ok = assertRotationPreconditions(env, [...ARGV0, '--apply', '--snapshot-confirmed=s-9']);
    expect(ok.apply).toBe(true);
    expect(ok.snapshotId).toBe('s-9');
    expect(ok.oldKey.equals(Buffer.from(a, 'base64'))).toBe(true);
  });
});

describe('parseSnapshotConfirmed', () => {
  it('ausente → null; último vence; vazio lança', () => {
    expect(parseSnapshotConfirmed(ARGV0)).toBeNull();
    expect(
      parseSnapshotConfirmed(['--snapshot-confirmed=a', '--snapshot-confirmed=b']),
    ).toBe('b');
    expect(() => parseSnapshotConfirmed(['--snapshot-confirmed=  '])).toThrow();
  });
});

describe('--verify (somente leitura)', () => {
  it('isVerifyMode detecta a flag', () => {
    expect(isVerifyMode([...ARGV0, '--verify'])).toBe(true);
    expect(isVerifyMode(ARGV0)).toBe(false);
  });

  it('não exige NEW_KEY nem snapshot; usa CREDENTIALS_ENCRYPTION_KEY por padrão', () => {
    const cek = k();
    const pre = assertVerifyPreconditions({ CREDENTIALS_ENCRYPTION_KEY: cek }, [...ARGV0, '--verify']);
    expect(pre.keyEnv).toBe('CREDENTIALS_ENCRYPTION_KEY');
    expect(pre.key.equals(Buffer.from(cek, 'base64'))).toBe(true);
  });

  it('--key-env=NOME lê a chave de outra variável, explícita', () => {
    const vk = k();
    const pre = assertVerifyPreconditions({ VERIFY_KEY: vk }, [...ARGV0, '--verify', '--key-env=VERIFY_KEY']);
    expect(pre.keyEnv).toBe('VERIFY_KEY');
    expect(pre.key.equals(Buffer.from(vk, 'base64'))).toBe(true);
    // sem fallback para CREDENTIALS_ENCRYPTION_KEY quando a variável pedida não existe
    expect(() =>
      assertVerifyPreconditions({ CREDENTIALS_ENCRYPTION_KEY: k() }, [...ARGV0, '--verify', '--key-env=VERIFY_KEY']),
    ).toThrow(/VERIFY_KEY/);
  });

  it.each(['--key-env=', '--key-env=lower', '--key-env=1BAD', '--key-env=A-B'])('rejeita %s', (flag) => {
    expect(() => parseKeyEnvName([...ARGV0, flag])).toThrow(ScriptPreconditionError);
  });

  it('aborta sem chave, com chave inválida ou sem --verify', () => {
    expect(() => assertVerifyPreconditions({}, [...ARGV0, '--verify'])).toThrow(/CREDENTIALS_ENCRYPTION_KEY/);
    expect(() =>
      assertVerifyPreconditions({ CREDENTIALS_ENCRYPTION_KEY: Buffer.alloc(8).toString('base64') }, [...ARGV0, '--verify']),
    ).toThrow(/32 bytes/);
    expect(() => assertVerifyPreconditions({ CREDENTIALS_ENCRYPTION_KEY: k() }, ARGV0)).toThrow(/--verify/);
  });

  it('--verify não combina com --apply (verify nunca grava)', () => {
    expect(() =>
      assertVerifyPreconditions({ CREDENTIALS_ENCRYPTION_KEY: k() }, [...ARGV0, '--verify', '--apply']),
    ).toThrow(/mutuamente exclusivos/);
  });

  it('guards de backfill/rotação recusam --verify (evita gravar achando que é só leitura)', () => {
    const o = k();
    const n = k();
    expect(() =>
      assertBackfillPreconditions({ CREDENTIALS_ENCRYPTION_KEY: o }, [...ARGV0, '--verify']),
    ).toThrow(/--verify/);
    expect(() =>
      assertRotationPreconditions(
        { CREDENTIALS_ENCRYPTION_KEY: o, OLD_KEY: o, NEW_KEY: n },
        [...ARGV0, '--verify'],
      ),
    ).toThrow(/--verify/);
  });
});

describe('parseReencryptScope', () => {
  const MODELS = ['BitrixConnection', 'Setting'];
  it('padrão: alvo db, todos os models', () => {
    expect(parseReencryptScope(ARGV0, MODELS)).toEqual({ target: 'db', model: null });
  });
  it('aceita --model conhecido e --target=redis-wa-auth', () => {
    expect(parseReencryptScope([...ARGV0, '--model=Setting'], MODELS)).toEqual({ target: 'db', model: 'Setting' });
    expect(parseReencryptScope([...ARGV0, '--target=redis-wa-auth'], MODELS)).toEqual({
      target: 'redis-wa-auth',
      model: null,
    });
  });
  it('--model= vazio aborta (antes processava TODOS os models)', () => {
    expect(() => parseReencryptScope([...ARGV0, '--model='], MODELS)).toThrow(ScriptPreconditionError);
  });
  it('model ou alvo desconhecido aborta; --model só com alvo db', () => {
    expect(() => parseReencryptScope([...ARGV0, '--model=Nope'], MODELS)).toThrow(/desconhecido/);
    expect(() => parseReencryptScope([...ARGV0, '--target=redis'], MODELS)).toThrow(/desconhecido/);
    expect(() =>
      parseReencryptScope([...ARGV0, '--target=redis-wa-auth', '--model=Setting'], MODELS),
    ).toThrow(/só vale/);
  });
});

describe('requireRedisUrl', () => {
  it('exige REDIS_URL explícita (sem fallback para localhost)', () => {
    expect(() => requireRedisUrl({})).toThrow(/REDIS_URL/);
    expect(() => requireRedisUrl({ REDIS_URL: '  ' })).toThrow(/REDIS_URL/);
    expect(requireRedisUrl({ REDIS_URL: 'redis://example.invalid:6379' })).toBe('redis://example.invalid:6379');
  });
});

describe('resolveDbSsl — TLS do banco nos scripts de credenciais', () => {
  const noFile = () => {
    throw new Error('não deveria ler arquivo');
  };

  // Config EFETIVA do pg (o construtor não conecta).
  const effective = (
    url: string,
    env: Record<string, string> = {},
    readFile: (p: string) => string = noFile,
  ) => {
    const client = new pg.Client(resolveDbSsl(url, env, readFile).config);
    return { host: client.host, ssl: (client as unknown as { ssl: unknown }).ssl, client };
  };

  it('host local não usa TLS (localhost, 127.0.0.1, ::1)', () => {
    for (const url of [
      'postgresql://u:p@localhost:5432/db',
      'postgres://u:p@127.0.0.1:5432/db',
      'postgresql://u:p@[::1]:5432/db',
      'postgresql://u:p@db.exemplo.com/db?host=localhost',
    ]) {
      expect(effective(url).ssl, url).toBe(false);
    }
  });

  it('host remoto verifica o certificado por padrão (rejectUnauthorized=true)', () => {
    const { ssl, host } = effective('postgresql://u:p@db.exemplo.com:5432/db');
    expect(ssl).toEqual({ rejectUnauthorized: true });
    expect(host).toBe('db.exemplo.com');
  });

  it('"localhost" em outra parte da URL NÃO desliga o TLS de um host remoto', () => {
    for (const url of [
      'postgresql://u:p@db.exemplo.com/db?application_name=localhost',
      'postgresql://localhost:x@db.exemplo.com/db',
      'postgresql://u:p@localhost.exemplo.com/db',
      'postgresql://u:p@localhost/db?host=db.exemplo.com',
      'postgresql://u:p@localhost/db?host=localhost&host=db.exemplo.com',
      'postgresql:///db',
    ]) {
      expect(effective(url).ssl, url).toEqual({ rejectUnauthorized: true });
    }
  });

  it('escapes que o pg lê diferente de `new URL` não fazem um host remoto passar por local', () => {
    for (const url of [
      'postgresql://u:p@db.remote.com/db?h%6fst=localhost&application_name=a b',
      'postgresql://u:p@db.remote.com/db?%68%6fst=localhost&application_name=a%zz',
      'postgresql://u:p%zz@db.remote.com/db?h%6fst=localhost',
    ]) {
      const { host, ssl } = effective(url);
      expect(host, url).toBe('db.remote.com');
      expect(ssl, url).toEqual({ rejectUnauthorized: true });
    }
  });

  it('esquema não-postgres ou URL ilegível aborta sem vazar a URL', () => {
    for (const url of [
      'socket:db.remote.com?host=localhost&db=x',
      'isto não é uma url com segredo',
      '/var/run/segredo',
      'postgresql://u:segredo@db.exemplo.com:99999/db?sslmode=no-verify',
      'postgresql://u:segredo@db.exemplo.com/db?sslrootcert=/nao/existe/segredo.pem',
    ]) {
      expect(() => resolveDbSsl(url, {}, noFile), url).toThrow(ScriptPreconditionError);
      expect(() => resolveDbSsl(url, {}, noFile), url).not.toThrow(/segredo/);
    }
  });

  it('parâmetros da URL não sobrescrevem a verificação na config efetiva do pg', () => {
    for (const q of [
      'sslmode=require&uselibpqcompat=true',
      'sslmode=no-verify',
      'sslmode=disable',
      'sslmode=require',
      'ss%6cmode=no-verify',
      'ssl=no-verify',
      'ssl=0',
      'sslnegotiation=direct',
      'connectionString=postgresql%3A%2F%2Fu%3Ap%40outro.com%2Fdb%3Fsslmode%3Ddisable',
    ]) {
      const { client, host, ssl } = effective(
        `postgresql://u:p%40ss@db.exemplo.com/db?application_name=x&${q}`,
        { PGSSLROOTCERT: '/certs/ca.pem' },
        () => 'PEM-DO-CA',
      );
      expect(ssl, q).toEqual({ rejectUnauthorized: true, ca: 'PEM-DO-CA' });
      expect(host).toBe('db.exemplo.com');
      expect(client.user).toBe('u');
      expect(client.password).toBe('p@ss');
      expect(client.database).toBe('db');
    }
  });

  it('sslrootcert/sslcert/sslkey da URL não descartam PGSSLROOTCERT nem a verificação', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'resolve-db-ssl-'));
    try {
      const file = (name: string) => {
        const full = path.join(dir, name);
        writeFileSync(full, name);
        return encodeURIComponent(full);
      };
      const url = `postgresql://u:p@db.exemplo.com/db?sslmode=require&uselibpqcompat=true&sslrootcert=${file('ca-url')}&sslcert=${file('cert-url')}&sslkey=${file('key-url')}`;
      const certs = { cert: 'cert-url', key: 'key-url', rejectUnauthorized: true };
      expect(
        resolveDbSsl(url, { PGSSLROOTCERT: '/certs/ca.pem' }, () => 'PEM-DO-CA').config.ssl,
      ).toEqual({ ...certs, ca: 'PEM-DO-CA' });
      expect(resolveDbSsl(url, {}, noFile).config.ssl).toEqual({ ...certs, ca: 'ca-url' });
      expect(effective(url).ssl).toMatchObject({ rejectUnauthorized: true, ca: 'ca-url' });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('PGSSLROOTCERT carrega o CA próprio mantendo a verificação', () => {
    const readFile = (path: string) => {
      expect(path).toBe('/certs/ca.pem');
      return 'PEM-DO-CA';
    };
    expect(
      resolveDbSsl('postgresql://u:p@db.exemplo.com/db', { PGSSLROOTCERT: '/certs/ca.pem' }, readFile),
    ).toMatchObject({ config: { ssl: { rejectUnauthorized: true, ca: 'PEM-DO-CA' } }, insecure: false });
  });

  it('só DB_SSL_INSECURE_SKIP_VERIFY=true explícito desliga a verificação, e sinaliza insecure', () => {
    expect(
      resolveDbSsl('postgresql://u:p@db.exemplo.com/db', { DB_SSL_INSECURE_SKIP_VERIFY: 'true' }, noFile),
    ).toMatchObject({ config: { ssl: { rejectUnauthorized: false } }, insecure: true });
    for (const v of ['false', '1', 'yes', '', undefined]) {
      expect(
        resolveDbSsl('postgresql://u:p@db.exemplo.com/db', { DB_SSL_INSECURE_SKIP_VERIFY: v }, noFile)
          .insecure,
      ).toBe(false);
    }
  });
});
