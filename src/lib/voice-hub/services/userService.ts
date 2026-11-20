import { prisma } from '@/lib/prisma.js';
import * as userRepository from '../repositories/userRepository.js';
import {
  canonicalRoleForVoiceRole,
  voiceRoleForCanonicalRole,
  type SystemRoleName,
} from '../repositories/roleRepository.js';

export class UserServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// Adaptação ao schema canônico (handoff 01-para-12-voicehub-adaptacao-modelos-canonicos):
// `User` canônico não tem `companyName` (a "empresa" é Organization.name — renomear a org por
// causa de um perfil de usuário seria errado) nem `deletedAt`/`memberships`. O papel de
// autoridade é `user.role` (UserRole) e o cargo funcional é UserJobRole→JobRole.
//
// O vocabulário de voice-role ('admin'|'user'|'supervisor') é preservado na BORDA (API/DTO),
// traduzido para UserRole via roleRepository — nunca persistido.

interface SafeUserInput {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  jobRoles?: { jobRole: { code: string; name: string } | null }[];
}

function toSafeUser(user: SafeUserInput) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    // voice-role derivado do UserRole canônico — o frontend do voice-hub continua vendo
    // 'admin'/'user'/'supervisor' sem que esses valores existam no banco.
    role: voiceRoleForCanonicalRole(user.role),
    jobRole: user.jobRoles?.[0]?.jobRole?.name ?? null,
    createdAt: user.createdAt,
  };
}

export async function listUsers(organizationId: string) {
  const users = await userRepository.listUsersForTenant(organizationId);
  return users.map(toSafeUser);
}

export async function createUserInTenant(
  organizationId: string,
  data: { email: string; password: string; companyName?: string; role?: SystemRoleName },
) {
  const existing = await userRepository.findUserByEmail(data.email);
  if (existing) {
    throw new UserServiceError('Este email já está cadastrado.', 409);
  }

  // `companyName` não existe no User canônico (a organização já tem nome próprio) — aceito no
  // contrato por compatibilidade, mas não persistido. O `name` exibido é derivado do e-mail até
  // o usuário/painel de equipe atualizar.
  void data.companyName;
  const voiceRole = data.role ?? 'user';
  const user = await userRepository.createUser({
    email: data.email,
    password: data.password,
    name: data.email.split('@')[0],
    organizationId,
    role: canonicalRoleForVoiceRole(voiceRole),
  });

  return { id: user.id, email: user.email, role: voiceRole };
}

export async function updateUserProfile(
  targetId: string,
  organizationId: string,
  requester: { id: string; role: string },
  data: { companyName?: string; role?: SystemRoleName; password?: string },
) {
  if (requester.role !== 'admin' && requester.id !== targetId) {
    throw new UserServiceError('Você não tem permissão para alterar este perfil.', 403);
  }

  const target = await userRepository.findUserById(targetId);
  if (!target || target.organizationId !== organizationId) {
    throw new UserServiceError('Usuário não encontrado.', 404);
  }

  // companyName não tem destino canônico (ver createUserInTenant) — não persistido.
  void data.companyName;

  await userRepository.updateUser(targetId, organizationId, {
    password: data.password,
  });

  // Mudança de papel de autoridade é ação de admin e vai para User.role (UserRole canônico) —
  // atualizada via updateMany com organizationId no WHERE (dupla checagem de tenant).
  if (data.role && requester.role === 'admin') {
    await userRepository.updateUserRole(
      targetId,
      organizationId,
      canonicalRoleForVoiceRole(data.role),
    );
  }
}

export async function deleteUser(
  targetId: string,
  organizationId: string,
  requesterId: string | undefined,
) {
  if (requesterId === targetId) {
    throw new UserServiceError('Você não pode excluir o seu próprio usuário admin.', 400);
  }

  const target = await userRepository.findUserById(targetId);
  if (!target || target.organizationId !== organizationId) {
    throw new UserServiceError('Usuário não encontrado.', 404);
  }

  // Mesma trava de team.service.ts#deleteTeamMember: nunca deixar a organização sem ADMIN.
  if (target.role === 'ADMIN') {
    const remainingAdmins = await prisma.user.count({
      where: { organizationId, role: 'ADMIN' },
    });
    if (remainingAdmins <= 1) {
      throw new UserServiceError(
        'Não é possível excluir o único ADMIN da organização. Promova outro usuário a ADMIN antes.',
        400,
      );
    }
  }

  await userRepository.deleteUser(targetId);
}

// LGPD data-subject erasure/anonymization request. Self-service (a titular exercising their own
// right to erasure) or admin-initiated on their behalf — same authorization shape as
// updateUserProfile, since both are actions a user is allowed to take on their own account.
export async function anonymizeUserData(
  targetId: string,
  organizationId: string,
  requester: { id: string; role: string },
) {
  if (requester.role !== 'admin' && requester.id !== targetId) {
    throw new UserServiceError(
      'Você não tem permissão para solicitar a exclusão dos dados deste titular.',
      403,
    );
  }

  const target = await userRepository.findUserById(targetId);
  if (!target || target.organizationId !== organizationId) {
    throw new UserServiceError('Usuário não encontrado.', 404);
  }

  await userRepository.anonymizeUser(targetId);
}
