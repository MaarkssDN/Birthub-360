import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    jobRole: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma.js';
import {
  canonicalRoleForVoiceRole,
  getPermissionsForRoleName,
  permissionNamesOf,
  voiceRoleForCanonicalRole,
  PERMISSIONS,
  SYSTEM_ROLE_DEFAULT_PERMISSIONS,
} from './roleRepository.js';

beforeEach(() => vi.clearAllMocks());

// Cobre a adaptação ao schema canônico (handoff
// 01-para-12-voicehub-adaptacao-modelos-canonicos): não existem mais Role/Permission/Membership —
// o voice-role ('admin'|'user'|'supervisor') é um mapeamento determinístico sobre User.role
// (UserRole) e as concessões de capability vêm de UserJobRole→JobRole→RoleCapabilityGrant→
// CapabilityDefinition.
describe('roleRepository: mapeamento UserRole ↔ voice-role', () => {
  it('mapeia ADMIN→admin, GESTOR→supervisor e todo o resto→user (fail closed)', () => {
    expect(voiceRoleForCanonicalRole('ADMIN')).toBe('admin');
    expect(voiceRoleForCanonicalRole('GESTOR')).toBe('supervisor');
    expect(voiceRoleForCanonicalRole('CLOSER')).toBe('user');
    expect(voiceRoleForCanonicalRole('SDR')).toBe('user');
    expect(voiceRoleForCanonicalRole('VISUALIZADOR')).toBe('user');
    expect(voiceRoleForCanonicalRole(null)).toBe('user');
    expect(voiceRoleForCanonicalRole('QUALQUER_COISA')).toBe('user');
  });

  it('mapeia voice-role→UserRole canônico para atribuição de papel', () => {
    expect(canonicalRoleForVoiceRole('admin')).toBe('ADMIN');
    expect(canonicalRoleForVoiceRole('supervisor')).toBe('GESTOR');
    expect(canonicalRoleForVoiceRole('user')).toBe('VISUALIZADOR');
  });
});

describe('roleRepository: Permission catalog', () => {
  it('declares supervision:intervene', () => {
    expect(PERMISSIONS['supervision:intervene']).toBeTruthy();
  });

  it('grants supervision:intervene to admin and supervisor by default, but not to user', () => {
    expect(SYSTEM_ROLE_DEFAULT_PERMISSIONS.admin).toContain('supervision:intervene');
    expect(SYSTEM_ROLE_DEFAULT_PERMISSIONS.supervisor).toContain('supervision:intervene');
    expect(SYSTEM_ROLE_DEFAULT_PERMISSIONS.user).toEqual([]);
  });
});

describe('roleRepository.permissionNamesOf', () => {
  it('extracts permission names from a role with a clean permissions array', () => {
    expect(
      permissionNamesOf({ permissions: [{ name: 'supervision:intervene' }, { name: 'x' }] }),
    ).toEqual(['supervision:intervene', 'x']);
  });

  it('fails closed (empty array) for null/undefined role', () => {
    expect(permissionNamesOf(null)).toEqual([]);
    expect(permissionNamesOf(undefined)).toEqual([]);
  });

  it('fails closed when permissions is not an array (e.g. an un-included relation, or a foreign mock shape)', () => {
    expect(permissionNamesOf({ permissions: { connectOrCreate: [] } })).toEqual([]);
    expect(permissionNamesOf({})).toEqual([]);
  });
});

describe('roleRepository.getPermissionsForRoleName', () => {
  it('returns the static defaults of the voice-role without touching the database', async () => {
    const result = await getPermissionsForRoleName('supervisor', 'tenant-1');

    expect(result).toEqual(['supervision:intervene']);
    expect(prisma.jobRole.findMany).not.toHaveBeenCalled();
  });

  it('fails closed (empty list) for an unknown voice-role', async () => {
    const result = await getPermissionsForRoleName('nonexistent-role', 'tenant-1');
    expect(result).toEqual([]);
  });

  it('unions capability codes granted via active UserJobRole→RoleCapabilityGrant when userId is provided', async () => {
    vi.mocked(prisma.jobRole.findMany).mockResolvedValue([
      {
        capabilityGrants: [
          { capabilityDefinition: { code: 'call.supervise' } },
          { capabilityDefinition: { code: 'lead.read' } },
        ],
      },
    ] as any);

    const result = await getPermissionsForRoleName('user', 'tenant-1', 'user-1');

    expect(prisma.jobRole.findMany).toHaveBeenCalledWith({
      where: {
        isActive: true,
        userJobRoles: { some: { userId: 'user-1', isActive: true, organizationId: 'tenant-1' } },
      },
      select: {
        capabilityGrants: {
          where: { isActive: true },
          select: { capabilityDefinition: { select: { code: true } } },
        },
      },
    });
    expect(result).toEqual(expect.arrayContaining(['call.supervise', 'lead.read']));
    expect(result).not.toContain('supervision:intervene');
  });

  it('keeps voice-role defaults AND capability grants together', async () => {
    vi.mocked(prisma.jobRole.findMany).mockResolvedValue([
      { capabilityGrants: [{ capabilityDefinition: { code: 'x.y' } }] },
    ] as any);

    const result = await getPermissionsForRoleName('admin', 'tenant-1', 'user-1');

    expect(result).toEqual(expect.arrayContaining(['supervision:intervene', 'x.y']));
  });

  it('fails closed (defaults only) when the capability lookup throws', async () => {
    vi.mocked(prisma.jobRole.findMany).mockRejectedValue(new Error('db down'));

    const result = await getPermissionsForRoleName('admin', 'tenant-1', 'user-1');

    expect(result).toEqual(['supervision:intervene']);
  });
});
