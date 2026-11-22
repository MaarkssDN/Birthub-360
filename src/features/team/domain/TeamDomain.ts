/**
 * Team & RBAC Domain Layer — BirthHub 360
 * Clean Architecture Modular Domain Entity and Repository Contracts
 */

export enum TeamRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SDR = 'SDR',
  AGENT = 'AGENT',
  VIEWER = 'VIEWER',
}

export enum Permission {
  MANAGE_ORGANIZATION = 'organization:manage',
  MANAGE_TEAM = 'team:manage',
  INVITE_MEMBERS = 'team:invite',
  REMOVE_MEMBERS = 'team:remove',
  VIEW_REPORTS = 'reports:view',
  EXPORT_REPORTS = 'reports:export',
  MANAGE_LEADS = 'leads:manage',
  ASSIGN_LEADS = 'leads:assign',
  TRIGGER_VOICE_CAMPAIGN = 'voice:trigger',
  MANAGE_INTEGRATIONS = 'integrations:manage',
  ACCESS_SETTINGS = 'settings:access',
}

export interface TeamMember {
  id: string;
  organizationId: string;
  userId: string;
  name: string;
  email: string;
  role: TeamRole;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  avatarUrl?: string;
  customPermissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberInvite {
  id: string;
  organizationId: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface ITeamRepository {
  findByOrganizationId(organizationId: string): Promise<TeamMember[]>;
  findById(id: string, organizationId: string): Promise<TeamMember | null>;
  findByEmail(email: string, organizationId: string): Promise<TeamMember | null>;
  createMember(member: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<TeamMember>;
  updateRole(id: string, organizationId: string, role: TeamRole): Promise<TeamMember>;
  updateStatus(
    id: string,
    organizationId: string,
    status: TeamMember['status'],
  ): Promise<TeamMember>;
  removeMember(id: string, organizationId: string): Promise<void>;
  countOwners(organizationId: string): Promise<number>;
  createInvite(invite: Omit<MemberInvite, 'id' | 'createdAt'>): Promise<MemberInvite>;
  findInviteByToken(token: string): Promise<MemberInvite | null>;
  deleteInvite(token: string): Promise<void>;
}
