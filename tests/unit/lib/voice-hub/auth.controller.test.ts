import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

const getPermissionsForRoleName = vi.fn();
const signOut = vi.fn();

vi.mock('@/lib/voice-hub/repositories/roleRepository', () => ({
  getPermissionsForRoleName: (...args: unknown[]) => getPermissionsForRoleName(...args),
  voiceRoleForCanonicalRole: (role?: string) =>
    role === 'ADMIN' ? 'admin' : role === 'GESTOR' ? 'supervisor' : 'user',
}));

vi.mock('@/lib/auth', () => ({
  auth: { api: { signOut: (...args: unknown[]) => signOut(...args) } },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { meHandler, logoutHandler } from '@/lib/voice-hub/controllers/auth.controller';

function mockRes() {
  const res = {
    json: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
    clearCookie: vi.fn(),
  };
  return res as unknown as Response & typeof res;
}

describe('auth.controller (Better Auth)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPermissionsForRoleName.mockResolvedValue(['calls:read', 'calls:write']);
    signOut.mockResolvedValue({ success: true });
  });

  describe('meHandler', () => {
    it('retorna user:null quando não há sessão voice-hub nem canônica', async () => {
      const req = {} as Request;
      const res = mockRes();
      await meHandler(req, res);
      expect(res.json).toHaveBeenCalledWith({ user: null });
      expect(getPermissionsForRoleName).not.toHaveBeenCalled();
    });

    it('resolve a sessão voiceHubUser e devolve permissões live do role', async () => {
      const req = {
        voiceHubUser: { id: 'u1', email: 'a@b.c', role: 'admin', organizationId: 'org-1' },
        organizationId: 'org-1',
      } as unknown as Request;
      const res = mockRes();
      await meHandler(req, res);
      expect(getPermissionsForRoleName).toHaveBeenCalledWith('admin', 'org-1', 'u1');
      expect(res.json).toHaveBeenCalledWith({
        user: expect.objectContaining({ id: 'u1', permissions: ['calls:read', 'calls:write'] }),
      });
    });

    it('resolve req.user canônico traduzindo o role para voice-role', async () => {
      const req = {
        user: { id: 'u2', email: 'x@y.z', role: 'ADMIN', organizationId: 'org-2' },
      } as unknown as Request;
      const res = mockRes();
      await meHandler(req, res);
      expect(getPermissionsForRoleName).toHaveBeenCalledWith('admin', 'org-2', 'u2');
      expect(res.json).toHaveBeenCalledWith({
        user: expect.objectContaining({ id: 'u2', role: 'admin' }),
      });
    });
  });

  describe('logoutHandler', () => {
    it('delega ao signOut do Better Auth e limpa os cookies de sessão', async () => {
      const req = { headers: {} } as unknown as Request;
      const res = mockRes();
      await logoutHandler(req, res);
      expect(signOut).toHaveBeenCalledTimes(1);
      for (const cookie of ['access_token', 'refresh_token', 'logged_in']) {
        expect(res.clearCookie).toHaveBeenCalledWith(cookie);
      }
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout realizado com sucesso',
      });
    });

    it('ainda responde sucesso quando o signOut falha (logout best-effort)', async () => {
      signOut.mockRejectedValue(new Error('session expired'));
      const req = { headers: {} } as unknown as Request;
      const res = mockRes();
      await logoutHandler(req, res);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout realizado com sucesso',
      });
    });
  });
});
