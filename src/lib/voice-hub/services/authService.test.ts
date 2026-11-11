import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../repositories/userRepository.js', () => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
  createMembership: vi.fn(),
  findMembershipWithRole: vi.fn(),
}));

vi.mock('../repositories/tenantRepository.js', () => ({
  createTenant: vi.fn(),
}));

vi.mock('../repositories/roleRepository.js', () => ({
  getOrCreateSystemRole: vi.fn(),
}));

vi.mock('../lib/auth-tokens.js', () => ({
  hashPassword: vi.fn((password: string) => `hashed:${password}`),
  verifyPassword: vi.fn(),
  generateToken: vi.fn((payload: { id: string }) => `access:${payload.id}`),
  generateRefreshToken: vi.fn((payload: { id: string }) => `refresh:${payload.id}`),
  verifyRefreshToken: vi.fn(),
}));

import * as authTokens from '../lib/auth-tokens.js';
import * as roleRepository from '../repositories/roleRepository.js';
import * as tenantRepository from '../repositories/tenantRepository.js';
import * as userRepository from '../repositories/userRepository.js';
import { AuthError, login, refreshSession, register } from './authService.js';

const EMAIL = 'founder@acme.test';
const PASSWORD = 'senha-segura';
const COMPANY = 'Acme Corp';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authService.register', () => {
  it('cria o tenant via tenantRepository e devolve tokens do fluxo de signup', async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue(null);
    vi.mocked(tenantRepository.createTenant).mockResolvedValue({ id: 'tenant-1' } as never);
    vi.mocked(roleRepository.getOrCreateSystemRole).mockResolvedValue({
      id: 'role-admin',
    } as never);
    vi.mocked(userRepository.createUser).mockResolvedValue({
      id: 'user-1',
      email: EMAIL,
      companyName: COMPANY,
    } as never);
    vi.mocked(userRepository.createMembership).mockResolvedValue({} as never);

    const result = await register(EMAIL, PASSWORD, COMPANY);

    expect(tenantRepository.createTenant).toHaveBeenCalledTimes(1);
    expect(tenantRepository.createTenant).toHaveBeenCalledWith(COMPANY);
    expect(roleRepository.getOrCreateSystemRole).toHaveBeenCalledWith('admin');
    expect(authTokens.hashPassword).toHaveBeenCalledWith(PASSWORD);
    expect(userRepository.createUser).toHaveBeenCalledWith({
      email: EMAIL,
      passwordHash: `hashed:${PASSWORD}`,
      companyName: COMPANY,
      organizationId: 'tenant-1',
    });
    expect(userRepository.createMembership).toHaveBeenCalledWith(
      'user-1',
      'tenant-1',
      'role-admin',
    );
    expect(result).toEqual({
      token: 'access:user-1',
      refreshToken: 'refresh:user-1',
      organizationId: 'tenant-1',
      user: {
        id: 'user-1',
        name: 'founder',
        company: COMPANY,
        email: EMAIL,
        role: 'admin',
      },
    });
  });

  it('rejeita email já cadastrado sem criar tenant', async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue({ id: 'user-existente' } as never);

    await expect(register(EMAIL, PASSWORD, COMPANY)).rejects.toMatchObject({
      message: 'Este email já está cadastrado.',
      status: 400,
    });
    await expect(register(EMAIL, PASSWORD, COMPANY)).rejects.toBeInstanceOf(AuthError);
    expect(tenantRepository.createTenant).not.toHaveBeenCalled();
    expect(userRepository.createUser).not.toHaveBeenCalled();
  });
});

describe('authService.login', () => {
  it('autentica o usuário e devolve o papel da membership', async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue({
      id: 'user-1',
      email: EMAIL,
      passwordHash: 'hash',
      companyName: COMPANY,
      organizationId: 'tenant-1',
    } as never);
    vi.mocked(authTokens.verifyPassword).mockReturnValue(true);
    vi.mocked(userRepository.findMembershipWithRole).mockResolvedValue({
      role: { name: 'supervisor' },
    } as never);

    const result = await login(EMAIL, PASSWORD);

    expect(authTokens.verifyPassword).toHaveBeenCalledWith(PASSWORD, 'hash');
    expect(userRepository.findMembershipWithRole).toHaveBeenCalledWith('user-1', 'tenant-1');
    expect(result).toEqual({
      token: 'access:user-1',
      refreshToken: 'refresh:user-1',
      organizationId: 'tenant-1',
      user: {
        id: 'user-1',
        name: 'founder',
        company: COMPANY,
        email: EMAIL,
        role: 'supervisor',
      },
    });
  });

  it('rejeita credenciais inválidas com 401', async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue(null);

    await expect(login(EMAIL, PASSWORD)).rejects.toMatchObject({
      message: 'Credenciais inválidas.',
      status: 401,
    });
    expect(authTokens.generateToken).not.toHaveBeenCalled();
  });

  it('rejeita senha incorreta com 401', async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue({
      id: 'user-1',
      email: EMAIL,
      passwordHash: 'hash',
      companyName: COMPANY,
      organizationId: 'tenant-1',
    } as never);
    vi.mocked(authTokens.verifyPassword).mockReturnValue(false);

    await expect(login(EMAIL, PASSWORD)).rejects.toMatchObject({
      message: 'Credenciais inválidas.',
      status: 401,
    });
    expect(authTokens.generateToken).not.toHaveBeenCalled();
  });

  it('rejeita usuário sem organizationId com 401', async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue({
      id: 'user-1',
      email: EMAIL,
      passwordHash: 'hash',
      companyName: COMPANY,
      organizationId: null,
    } as never);
    vi.mocked(authTokens.verifyPassword).mockReturnValue(true);

    await expect(login(EMAIL, PASSWORD)).rejects.toMatchObject({
      message: 'Credenciais inválidas.',
      status: 401,
    });
    expect(authTokens.generateToken).not.toHaveBeenCalled();
  });

  it('assume o papel user quando a membership não existe', async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue({
      id: 'user-1',
      email: EMAIL,
      passwordHash: 'hash',
      companyName: COMPANY,
      organizationId: 'tenant-1',
    } as never);
    vi.mocked(authTokens.verifyPassword).mockReturnValue(true);
    vi.mocked(userRepository.findMembershipWithRole).mockResolvedValue(null);

    const result = await login(EMAIL, PASSWORD);

    expect(result.user.role).toBe('user');
  });
});

describe('authService.refreshSession', () => {
  it('renova o access token a partir de um refresh token válido', async () => {
    vi.mocked(authTokens.verifyRefreshToken).mockReturnValue({ id: 'user-1' });
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: 'user-1',
      email: EMAIL,
      companyName: COMPANY,
      organizationId: 'tenant-1',
    } as never);
    vi.mocked(userRepository.findMembershipWithRole).mockResolvedValue(null);

    const result = await refreshSession('refresh-token');

    expect(result).toEqual({
      token: 'access:user-1',
      session: {
        id: 'user-1',
        email: EMAIL,
        role: 'user',
        organizationId: 'tenant-1',
      },
    });
  });

  it('retorna null quando o refresh token é inválido', async () => {
    vi.mocked(authTokens.verifyRefreshToken).mockReturnValue(null);

    await expect(refreshSession('invalido')).resolves.toBeNull();
    expect(userRepository.findUserById).not.toHaveBeenCalled();
  });

  it('retorna null quando o usuário do refresh não tem organizationId', async () => {
    vi.mocked(authTokens.verifyRefreshToken).mockReturnValue({ id: 'user-1' });
    vi.mocked(userRepository.findUserById).mockResolvedValue({
      id: 'user-1',
      email: EMAIL,
      organizationId: null,
    } as never);

    await expect(refreshSession('refresh-token')).resolves.toBeNull();
    expect(authTokens.generateToken).not.toHaveBeenCalled();
  });
});

describe('authService.newId', () => {
  it('gera um identificador não vazio', async () => {
    const { newId } = await import('./authService.js');
    const id = newId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});
