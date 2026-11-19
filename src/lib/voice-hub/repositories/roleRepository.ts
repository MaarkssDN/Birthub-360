import { prisma } from '@/lib/prisma.js';

// Adaptação ao schema canônico (handoff
// .agents/handoffs/01-para-12-voicehub-adaptacao-modelos-canonicos.md — Agente 01, Estratégia 1):
// NÃO existem mais os models `Role`/`Permission`/`Membership` — a identidade e o nível de
// autoridade vivem em `User.role` (enum UserRole: ADMIN/GESTOR/CLOSER/SDR/VISUALIZADOR) e a
// função/cargo em `UserJobRole`→`JobRole`, com concessões em `RoleCapabilityGrant`→
// `CapabilityDefinition`.
//
// Os "voice roles" ('admin' | 'user' | 'supervisor') são o vocabulário legado do voice-hub,
// preservado como CAMADA DE MAPEAMENTO sobre o UserRole canônico — nunca persistidos em lugar
// nenhum (não existe tabela para eles). O mapeamento é determinístico e fail-closed:
//
//   ADMIN      → 'admin'      (acesso administrativo do tenant — mesmo nível de /api/team ADMIN)
//   GESTOR     → 'supervisor' (gestor pode supervisionar/intervir em chamadas ao vivo)
//   demais     → 'user'       (CLOSER/SDR/VISUALIZADOR — membro sem privilégio de voz)
//
// `PERMISSIONS`/`SYSTEM_ROLE_DEFAULT_PERMISSIONS` continuam sendo o catálogo estático de
// permissões de VOZ (ex.: 'supervision:intervene'). O engine canônico de capabilities
// (CapabilityDefinition/RoleCapabilityGrant) usa códigos `resource.action` e hoje NÃO possui uma
// capability de supervisão de chamada ao vivo — ver handoff 12-para-01 registrado na entrega
// desta onda. Até lá, `getPermissionsForRoleName` une o default estático do voice-role com os
// códigos de capability concedidos ao(s) JobRole(s) ativo(s) do usuário (quando `userId` é
// informado), sem nunca remover o que o voice-role já garante.

export type SystemRoleName = 'admin' | 'user' | 'supervisor';

// Permission catalog. Uma Permission é uma capability nomeada concedível a um voice-role — este
// é o mecanismo para conceder algo como "intervir em uma chamada ao vivo" sem inventar outra
// string mágica de role-name no client/server (ver handoff
// .agents/handoffs/onda-4/11-para-01-supervisor-role-rbac.md, Agente 11 -> Agente 01). Adicione
// novas capabilities aqui em vez de introduzir outro magic string checado ad-hoc num controller
// ou socket handler.
export const PERMISSIONS: Record<string, string> = {
  'supervision:intervene':
    'Permite intervir em uma chamada ao vivo monitorada pelo LiveSupervisor.',
};

// Default permissions granted to a voice-role — ver mapeamento UserRole→voice-role acima.
// `admin` mantém toda capability que tinha antes de Permission existir como conceito — sem
// regressão versus os antigos checks hardcoded `ROLES_ALLOWED_TO_INTERVENE = ['admin']`.
// `supervisor` é o papel mais estreito que um tenant pode dar a quem deve poder assistir/intervir
// em chamadas ao vivo sem conceder direitos totais de admin. `user` permanece vazio.
export const SYSTEM_ROLE_DEFAULT_PERMISSIONS: Record<SystemRoleName, string[]> = {
  admin: ['supervision:intervene'],
  supervisor: ['supervision:intervene'],
  user: [],
};

const VOICE_ROLE_BY_CANONICAL: Record<string, SystemRoleName> = {
  ADMIN: 'admin',
  GESTOR: 'supervisor',
};

const CANONICAL_ROLE_BY_VOICE: Record<SystemRoleName, string> = {
  admin: 'ADMIN',
  supervisor: 'GESTOR',
  user: 'VISUALIZADOR',
};

// UserRole canônico (Better Auth / prisma.user.role) → voice-role do voice-hub. Qualquer valor
// desconhecido cai em 'user' (fail closed — nunca promove por acidente).
export function voiceRoleForCanonicalRole(role: string | null | undefined): SystemRoleName {
  if (!role) return 'user';
  return VOICE_ROLE_BY_CANONICAL[role] ?? 'user';
}

// Voice-role → UserRole canônico, para quando o voice-hub precisa ATRIBUIR papel a um usuário
// (ex.: userService.createUserInTenant). 'user' → VISUALIZADOR (menor privilégio canônico; um
// admin pode promover depois via /api/team, que é a superfície canônica de gestão de equipe).
export function canonicalRoleForVoiceRole(name: SystemRoleName): string {
  return CANONICAL_ROLE_BY_VOICE[name] ?? 'VISUALIZADOR';
}

// Defensive extraction: nunca confia em `.permissions` ser um array limpo só porque um caller
// diz ter incluído a relação (mock parcial num teste, Role buscada sem `include`, etc.). Falha
// fechada — um shape inesperado produz zero permissões em vez de lançar.
export function permissionNamesOf(role: { permissions?: unknown } | null | undefined): string[] {
  if (!role || !Array.isArray(role.permissions)) return [];
  return role.permissions
    .filter((p): p is { name: unknown } => !!p && typeof p === 'object' && 'name' in p)
    .map((p) => String(p.name));
}

// Códigos de capability concedidos ao usuário via JobRole(s) ativo(s) — UserJobRole (por
// organização, RLS) → JobRole (catálogo) → RoleCapabilityGrant (ativo) → CapabilityDefinition.
// Falha fechada: qualquer erro/shape inesperado contribui conjunto vazio, nunca lança.
async function capabilityCodesForUser(userId: string, organizationId: string): Promise<string[]> {
  try {
    const jobRoles = await prisma.jobRole.findMany({
      where: {
        isActive: true,
        userJobRoles: { some: { userId, isActive: true, organizationId } },
      },
      select: {
        capabilityGrants: {
          where: { isActive: true },
          select: { capabilityDefinition: { select: { code: true } } },
        },
      },
    });
    const codes = new Set<string>();
    for (const jobRole of jobRoles) {
      for (const grant of jobRole.capabilityGrants) {
        const code = grant.capabilityDefinition?.code;
        if (typeof code === 'string' && code) codes.add(code);
      }
    }
    return [...codes];
  } catch {
    return [];
  }
}

// Resolve o conjunto efetivo de permissões para um voice-role dentro de um tenant. Não há mais
// Role/Permission por tenant no schema canônico — a resolução é:
//   1. defaults estáticos do voice-role (SYSTEM_ROLE_DEFAULT_PERMISSIONS);
//   2. + códigos de capability dos JobRoles ativos do usuário, quando `userId` é informado
//      (RBAC canônico — ver seção "Capability & Permission Engine" em prisma/schema.prisma).
// O resultado é consultado live (não embutido no JWT/sessão) para que mudanças de concessão
// tenham efeito imediato, sem esperar refresh de token.
export async function getPermissionsForRoleName(
  name: string,
  organizationId: string,
  userId?: string,
): Promise<string[]> {
  const permissions = new Set<string>(
    SYSTEM_ROLE_DEFAULT_PERMISSIONS[name as SystemRoleName] ?? [],
  );
  if (userId) {
    for (const code of await capabilityCodesForUser(userId, organizationId)) permissions.add(code);
  }
  return [...permissions];
}
