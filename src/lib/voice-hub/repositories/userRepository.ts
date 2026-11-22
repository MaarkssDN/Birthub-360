import crypto from 'node:crypto';
import type { User } from '@prisma/client';
import { prisma, runInTransaction } from '@/lib/prisma.js';
import { hashPasswordArgon2id } from '@/lib/auth/password-hash.js';

// Adaptado ao schema canônico (handoff
// .agents/handoffs/01-para-12-voicehub-adaptacao-modelos-canonicos.md — Agente 01, Estratégia 1):
// NÃO existem `Membership`/`Role`/`companyName`/`deletedAt` no `User` canônico. O que existe:
//   - `User.role` (enum UserRole) — nível de autoridade, fonte única de papel;
//   - `UserJobRole`/`JobRole` — cargo funcional (ver roleRepository.ts para o mapeamento
//     voice-role → UserRole);
//   - senha em `Account.password` (providerId 'credential'), hasheada por Better Auth — o campo
//     `User.passwordHash` é resquício e NÃO é mais escrito por ninguém;
//   - "empresa" é `Organization.name`, não um campo do usuário.
//
// Criação de usuário com senha segue o MESMO padrão de src/features/team/services/team.service.ts
// (User + Account credential, hash Argon2id PHC, mustChangePassword) — aqui inline porque o
// voice-hub é um módulo lib isolado e não pode importar de src/features (fronteira de arquitetura);
// a duplicação é deliberada e mínima (ver relatório da onda).

export function findUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email: { equals: email.trim().toLowerCase(), mode: 'insensitive' } },
  });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(data: {
  email: string;
  /** Senha em TEXTO PLANO — hasheada aqui com Argon2id (mesmo formato PHC do Better Auth). */
  password: string;
  name: string;
  organizationId: string;
  role?: string;
}) {
  const email = data.email.trim().toLowerCase();
  const passwordHash = await hashPasswordArgon2id(data.password);
  return prisma.user.create({
    data: {
      email,
      name: data.name,
      organizationId: data.organizationId,
      role: data.role ? (data.role as User['role']) : undefined,
      // true de propósito: conta provisionada por admin não tem posse de caixa postal verificada —
      // mesmo raciocínio documentado em team.service.ts#createTeamMember.
      emailVerified: true,
      mustChangePassword: true,
      accounts: {
        create: {
          id: crypto.randomUUID(),
          accountId: email,
          providerId: 'credential',
          password: passwordHash,
        },
      },
    },
  });
}

// Usuários do tenant com o cargo funcional primário (UserJobRole → JobRole) incluído — substitui o
// antigo `include: { memberships: { include: { role } } }`. O papel de AUTORIDADE continua sendo
// `user.role` (UserRole); JobRole é só o cargo.
export function listUsersForTenant(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId },
    include: {
      jobRoles: {
        where: { isActive: true, isPrimary: true },
        take: 1,
        include: { jobRole: { select: { code: true, name: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function updateUser(
  id: string,
  organizationId: string,
  data: { name?: string; password?: string },
) {
  if (data.password !== undefined) {
    // Senha vive em Account.password (credential), nunca em User.passwordHash — atualiza a conta
    // de credencial existente; se não houver, cria (mesmo padrão de provisionamento acima).
    // runInTransaction injeta o tenant na transação (RLS fail-closed) — prisma.$transaction cru
    // no client global é rejeitado pelo plugin no-prisma-tx-escape.
    const passwordHash = await hashPasswordArgon2id(data.password);
    await runInTransaction(
      async (tx) => {
        const account = await tx.account.findFirst({
          where: { userId: id, providerId: 'credential' },
          select: { id: true },
        });
        if (account) {
          await tx.account.update({ where: { id: account.id }, data: { password: passwordHash } });
        } else {
          const user = await tx.user.findUniqueOrThrow({ where: { id }, select: { email: true } });
          await tx.account.create({
            data: {
              id: crypto.randomUUID(),
              accountId: user.email,
              providerId: 'credential',
              userId: id,
              password: passwordHash,
            },
          });
        }
        if (data.name !== undefined) {
          await tx.user.update({ where: { id }, data: { name: data.name } });
        }
      },
      { organizationId },
    );
    return;
  }
  return prisma.user.update({ where: { id }, data: { name: data.name } });
}

// Exclusão de usuário do tenant. O schema canônico não tem soft-delete em User — a exclusão é
// HARD DELETE com cascade em Session/Account/UserJobRole (onDelete: Cascade), o mesmo comportamento
// de src/features/team/services/team.service.ts#deleteTeamMember. A guarda de "não excluir o
// único ADMIN" é responsabilidade do service (userService.deleteUser), que consulta antes.
export function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}

// LGPD (Lei 13.709/2018) technical erasure mechanism for a data subject request. Diferente de
// deleteUser (hard delete usado na gestão de equipe), esta é a via de ANONIMIZAÇÃO: a linha de
// User é preservada (FKs de AuditLog.actorId/AgentSession.userId/Notification.userId não penduram)
// mas todos os dados pessoais são removidos — e-mail, nome, imagem, credenciais (Account) e
// sessões ativas. O e-mail anonimizado é determinístico-porém-inecolhível e único por usuário
// para não colidir com outra conta anonimizada sob @@unique(email).
export async function anonymizeUser(id: string) {
  const anonymizedEmail = `anon-${id}-${crypto.randomBytes(8).toString('hex')}@anonymized.invalid`;
  // biome-ignore lint/plugin/no-prisma-tx-escape: anonimização LGPD precisa ser atômica (usuário + contas + sessões)
  return prisma.$transaction(async (tx) => {
    await tx.session.deleteMany({ where: { userId: id } });
    await tx.account.deleteMany({ where: { userId: id } });
    await tx.userJobRole.deleteMany({ where: { userId: id } });
    return tx.user.update({
      where: { id },
      data: {
        email: anonymizedEmail,
        name: '[Dados removidos a pedido do titular - LGPD]',
        image: null,
        passwordHash: null,
        bitrixUserId: null,
      },
    });
  });
}

// Troca o UserRole canônico do usuário (equivalente ao antigo updateMembershipRole). Usado por
// userService.updateUserProfile quando um admin altera o papel de um membro do tenant.
export function updateUserRole(id: string, organizationId: string, role: string) {
  return prisma.user.updateMany({
    where: { id, organizationId },
    data: { role: role as User['role'] },
  });
}

// Vínculo usuário↔cargo funcional (UserJobRole). Substitui as antigas funções de membership para
// o caso de consulta de cargo — o papel de autoridade NÃO passa mais por aqui (é user.role).
export function findPrimaryJobRoleForUser(userId: string, organizationId: string) {
  return prisma.userJobRole.findFirst({
    where: { userId, organizationId, isActive: true, isPrimary: true },
    include: { jobRole: true },
  });
}
