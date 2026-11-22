import type {
  AgentCapability,
  AgentDefinition,
  JobRoleRepository,
} from '../domain/JobRoleDomain.js';

export const PLATFORM_AGENTS: AgentDefinition[] = [
  {
    id: 'agent-sdr-inbound',
    code: 'SDR_INBOUND',
    name: 'SDR Inbound Autônomo',
    description:
      'Atende, qualifica e engaja leads vindos de formulários, landing pages e WhatsApp.',
    category: 'SDR',
    requiredCapabilities: ['READ_CRM', 'EXECUTE_COMMUNICATION', 'MOVE_PIPELINE'],
    allowedUserRoles: ['ADMIN', 'GESTOR', 'VENDEDOR'],
    status: 'ACTIVE',
  },
  {
    id: 'agent-sdr-outbound',
    code: 'SDR_OUTBOUND',
    name: 'SDR Outbound Cadence Bot',
    description: 'Executa réguas de cadência multicanal, follow-ups e tentativas de contato.',
    category: 'SDR',
    requiredCapabilities: ['READ_CRM', 'EXECUTE_COMMUNICATION', 'MOVE_PIPELINE'],
    allowedUserRoles: ['ADMIN', 'GESTOR', 'VENDEDOR'],
    status: 'ACTIVE',
  },
  {
    id: 'agent-closer-nba',
    code: 'CLOSER_NBA',
    name: 'Closer NBA (Next Best Action)',
    description:
      'Analisa o pipeline aberto e recomenda a melhor ação comercial para acelerar fechamento.',
    category: 'CLOSER',
    requiredCapabilities: ['READ_CRM', 'GENERATE_STRATEGY'],
    allowedUserRoles: ['ADMIN', 'GESTOR', 'VENDEDOR'],
    status: 'ACTIVE',
  },
  {
    id: 'agent-joao-reis',
    code: 'JOAO_REIS_DIAGNOSTIC',
    name: 'Diagnosticador João Reis',
    description: 'Diagnóstico comercial profundo de ICP, gargalos de funil e saúde de processos.',
    category: 'INTELLIGENCE',
    requiredCapabilities: ['READ_CRM', 'GENERATE_STRATEGY'],
    allowedUserRoles: ['ADMIN', 'GESTOR'],
    status: 'ACTIVE',
  },
  {
    id: 'agent-coaching-bot',
    code: 'SELLER_COACH',
    name: 'Coach Virtual de Vendas',
    description: 'Feedback individual de pitch, contorno de objeções e orientações semanais.',
    category: 'COACH',
    requiredCapabilities: ['READ_CRM'],
    allowedUserRoles: ['ADMIN', 'GESTOR', 'VENDEDOR'],
    status: 'ACTIVE',
  },
  {
    id: 'agent-data-hygiene',
    code: 'DATA_HYGIENE',
    name: 'Supervisor de Higiene de Dados',
    description: 'Detecta duplicidades, enriquece registros incompletos e audita o CRM.',
    category: 'OPS',
    requiredCapabilities: ['READ_CRM', 'MOVE_PIPELINE', 'ENRICH_DATA'],
    allowedUserRoles: ['ADMIN', 'GESTOR'],
    status: 'ACTIVE',
  },
];

export class PrismaJobRoleRepository implements JobRoleRepository {
  async listAgents(): Promise<AgentDefinition[]> {
    return PLATFORM_AGENTS;
  }

  async getAgentByCode(code: string): Promise<AgentDefinition | null> {
    return PLATFORM_AGENTS.find((a) => a.code === code) ?? null;
  }

  async canUserExecuteAgent(
    userRole: string,
    agentCode: string,
    requestedCapability?: AgentCapability,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const agent = await this.getAgentByCode(agentCode);
    if (!agent) {
      return { allowed: false, reason: `Agente ${agentCode} não encontrado no catálogo` };
    }

    if (!agent.allowedUserRoles.includes(userRole.toUpperCase())) {
      return {
        allowed: false,
        reason: `Papel ${userRole} não tem permissão para acionar o agente ${agent.name}`,
      };
    }

    if (requestedCapability && !agent.requiredCapabilities.includes(requestedCapability)) {
      return {
        allowed: false,
        reason: `Agente ${agent.name} não possui a capacidade solicitada: ${requestedCapability}`,
      };
    }

    return { allowed: true };
  }
}

export const prismaJobRoleRepository = new PrismaJobRoleRepository();
