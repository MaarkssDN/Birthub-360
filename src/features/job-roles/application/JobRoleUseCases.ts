import type {
  AgentCapability,
  AgentDefinition,
  JobRoleRepository,
} from '../domain/JobRoleDomain.js';
import { prismaJobRoleRepository } from '../infra/PrismaJobRoleRepository.js';

export class JobRoleUseCases {
  constructor(private repository: JobRoleRepository = prismaJobRoleRepository) {}

  async getCatalog(userRole: string): Promise<AgentDefinition[]> {
    const all = await this.repository.listAgents();
    return all.filter((a) => a.allowedUserRoles.includes(userRole.toUpperCase()));
  }

  async authorizeExecution(
    userRole: string,
    agentCode: string,
    capability?: AgentCapability,
  ): Promise<{ allowed: boolean; reason?: string }> {
    return this.repository.canUserExecuteAgent(userRole, agentCode, capability);
  }
}
