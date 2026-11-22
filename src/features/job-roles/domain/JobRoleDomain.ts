export type AgentCapability =
  | 'READ_CRM'
  | 'EXECUTE_COMMUNICATION'
  | 'MOVE_PIPELINE'
  | 'GENERATE_STRATEGY'
  | 'ENRICH_DATA'
  | 'EXPORT_DATA';

export interface AgentDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'SDR' | 'CLOSER' | 'OPS' | 'COACH' | 'INTELLIGENCE';
  requiredCapabilities: AgentCapability[];
  allowedUserRoles: string[];
  status: 'ACTIVE' | 'BETA' | 'MAINTENANCE';
}

export interface JobRoleRepository {
  listAgents(): Promise<AgentDefinition[]>;
  getAgentByCode(code: string): Promise<AgentDefinition | null>;
  canUserExecuteAgent(
    userRole: string,
    agentCode: string,
    requestedCapability?: AgentCapability,
  ): Promise<{ allowed: boolean; reason?: string }>;
}
