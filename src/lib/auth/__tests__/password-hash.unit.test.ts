import { describe, expect, it } from 'vitest';
import { hashPasswordArgon2id, isArgon2idHash, verifyPasswordHash } from '../password-hash.js';

// Testes do Agente 96 (Nera) — Onda 3, auditoria B-03/B-04 sobre src/lib/auth/**.
// Cobre os limites de parâmetros Argon2 na verificação (hash persistido adulterado não pode
// pedir memória ilimitada nem derrubar o login com exceção) e o roundtrip Argon2id/scrypt.

describe('password-hash (Argon2id + fallback scrypt legado)', () => {
  // Argon2id m=19456,t=2 é intencionalmente caro (é o ponto do KDF) — em hosts compartilhados
  // cada operação pode levar vários segundos; timeout explícito evita flake no gate.
  it('faz roundtrip: hash gerado verifica a senha correta e rejeita a errada', {
    timeout: 60_000,
  }, async () => {
    const hash = await hashPasswordArgon2id('Senha-Forte-123!');
    expect(isArgon2idHash(hash)).toBe(true);
    expect(hash.startsWith('$argon2id$v=19$m=19456,t=2,p=1$')).toBe(true);

    await expect(verifyPasswordHash({ hash, password: 'Senha-Forte-123!' })).resolves.toBe(true);
    await expect(verifyPasswordHash({ hash, password: 'senha-errada' })).resolves.toBe(false);
  });

  it('hashes distintos para a mesma senha (salt aleatório)', { timeout: 60_000 }, async () => {
    const a = await hashPasswordArgon2id('mesma-senha');
    const b = await hashPasswordArgon2id('mesma-senha');
    expect(a).not.toBe(b);
    await expect(verifyPasswordHash({ hash: a, password: 'mesma-senha' })).resolves.toBe(true);
    await expect(verifyPasswordHash({ hash: b, password: 'mesma-senha' })).resolves.toBe(true);
  });

  it('rejeita entradas inválidas sem lançar exceção', async () => {
    await expect(verifyPasswordHash({ hash: '', password: 'x' })).resolves.toBe(false);
    await expect(verifyPasswordHash({ hash: 'nao-e-um-hash', password: 'x' })).resolves.toBe(false);
    await expect(
      verifyPasswordHash({ hash: '$argon2id$v=19$m=19456,t=2,p=1$@@@', password: 'x' }),
    ).resolves.toBe(false);
  });

  // Regressão Onda 3: parâmetros vindos do hash persistido eram ilimitados — um hash adulterado
  // com m astronômico podia alocar memória sem teto (DoS) e parâmetros inválidos faziam o
  // argon2idAsync lançar exceção que propagava para o login (500) em vez de negar a senha.
  it('rejeita hash Argon2 com parâmetros fora dos limites sem computar nem lançar', async () => {
    const salt = Buffer.from('0123456789abcdef').toString('base64'); // 16 bytes
    const fakeHash = Buffer.alloc(32).toString('base64');

    const absurdMemory = `$argon2id$v=19$m=999999999,t=2,p=1$${salt}$${fakeHash}`;
    const absurdTime = `$argon2id$v=19$m=19456,t=999999,p=1$${salt}$${fakeHash}`;
    const absurdParallel = `$argon2id$v=19$m=19456,t=2,p=999$${salt}$${fakeHash}`;
    const badVersion = `$argon2id$v=99$m=19456,t=2,p=1$${salt}$${fakeHash}`;
    const lowVersion = `$argon2id$v=1$m=19456,t=2,p=1$${salt}$${fakeHash}`;
    const hugeSalt = `$argon2id$v=19$m=19456,t=2,p=1$${Buffer.alloc(4096).toString('base64')}$${fakeHash}`;

    for (const hash of [
      absurdMemory,
      absurdTime,
      absurdParallel,
      badVersion,
      lowVersion,
      hugeSalt,
    ]) {
      await expect(
        verifyPasswordHash({ hash, password: 'qualquer' }),
        `hash deveria ser rejeitado: ${hash.slice(0, 60)}`,
      ).resolves.toBe(false);
    }
  });

  it('hash Argon2 estruturalmente válido mas com hash incorreto retorna false (não lança)', {
    timeout: 60_000,
  }, async () => {
    const real = await hashPasswordArgon2id('senha-real');
    const parts = real.split('$');
    // Mantém parâmetros/salt válidos, troca só o hash final por bytes aleatórios do mesmo tamanho.
    const tamperedHash = Buffer.alloc(32, 0xab).toString('base64').replace(/=+$/, '');
    const tampered = `${parts.slice(0, 5).join('$')}$${tamperedHash}`;
    await expect(verifyPasswordHash({ hash: tampered, password: 'senha-real' })).resolves.toBe(
      false,
    );
  });
});
