import { describe, expect, it } from 'vitest';
import {
  assertTestDatabaseSafety,
  parseDotEnvContent,
  stopEphemeralContainers,
} from '../../../scripts/test/prepare-integration-env.js';

describe('Test Harness Database Safety Guard (DIV-AGENTE-14-001)', () => {
  it('accepts valid isolated test database configuration with _test suffix and NODE_ENV=test', () => {
    expect(
      assertTestDatabaseSafety({
        NODE_ENV: 'test',
        DATABASE_URL:
          'postgresql://prospector_app:prospector_app_pass@localhost:5434/prospectordb_test',
        DIRECT_URL:
          'postgresql://prospector_migrator:prospector_migrator_pass@localhost:5434/prospectordb_test',
      }),
    ).toBe(true);
  });

  it('rejects execution when DATABASE_URL points to a database without _test suffix', () => {
    expect(() =>
      assertTestDatabaseSafety({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://prospector_app:pass@localhost:5434/prospectordb',
      }),
    ).toThrow(/não possui o sufixo obrigatório "_test"/i);
  });

  it('rejects execution when DIRECT_URL or TEST_DATABASE_URL points to a database without _test suffix', () => {
    expect(() =>
      assertTestDatabaseSafety({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://prospector_app:pass@localhost:5434/prospectordb_test',
        DIRECT_URL: 'postgresql://prospector_migrator:pass@localhost:5434/prospectordb',
      }),
    ).toThrow(/DIRECT_URL.*_test/i);
  });

  it('rejects execution when NODE_ENV is not "test" (e.g. production or development)', () => {
    expect(() =>
      assertTestDatabaseSafety({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://prospector_app:pass@localhost:5434/prospectordb_test',
      }),
    ).toThrow(/NODE_ENV deve ser estritamente "test"/i);
  });

  it('rejects execution when host points to AWS RDS, Supabase, or Neon managed production endpoints', () => {
    expect(() =>
      assertTestDatabaseSafety({
        NODE_ENV: 'test',
        DATABASE_URL:
          'postgresql://user:pass@birthhub-prod.c123456.sa-east-1.rds.amazonaws.com:5432/prospectordb_test',
      }),
    ).toThrow(/host gerenciado\/produção proibido/i);

    expect(() =>
      assertTestDatabaseSafety({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://user:pass@db.xyz.supabase.co:5432/prospectordb_test',
      }),
    ).toThrow(/host gerenciado\/produção proibido/i);
  });

  it('parses .env.test content accurately ignoring comments and blank lines', () => {
    const parsed = parseDotEnvContent(`
      # Comentario
      NODE_ENV=test
      DATABASE_URL="postgresql://u:p@localhost:5434/prospectordb_test"
    `);
    expect(parsed).toEqual({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://u:p@localhost:5434/prospectordb_test',
    });
  });
});

describe('Ephemeral container teardown on SIGINT/SIGTERM (TAREFA-SANEAMENTO-032)', () => {
  it('stops exactly the containers the harness started, via docker stop', () => {
    const calls: Array<{ cmd: string; args: string[] }> = [];
    const spawn = (cmd: string, args: string[]) => {
      calls.push({ cmd, args });
      return { status: 0 };
    };

    const stopped = stopEphemeralContainers(['birthhub_postgres', 'birthhub_redis'], spawn);

    expect(stopped).toBe(2);
    expect(calls).toEqual([
      { cmd: 'docker', args: ['stop', 'birthhub_postgres'] },
      { cmd: 'docker', args: ['stop', 'birthhub_redis'] },
    ]);
  });

  it('tolerates individual docker stop failures and still stops the remaining containers', () => {
    const calls: string[] = [];
    const spawn = (_cmd: string, args: string[]) => {
      calls.push(args[1]);
      return { status: args[1] === 'birthhub_postgres' ? 1 : 0 };
    };

    const stopped = stopEphemeralContainers(['birthhub_postgres', 'birthhub_meilisearch'], spawn);

    expect(calls).toEqual(['birthhub_postgres', 'birthhub_meilisearch']);
    expect(stopped).toBe(1);
  });

  it('does nothing when the list is empty (containers were already running/shared)', () => {
    const spawn = () => {
      throw new Error('docker não deveria ser invocado');
    };
    expect(stopEphemeralContainers([], spawn)).toBe(0);
  });
});
