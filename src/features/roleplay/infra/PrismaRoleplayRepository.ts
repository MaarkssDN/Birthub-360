import type { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma.js';
import type {
  RoleplayFeedback,
  RoleplayMessage,
  RoleplayPersona,
  RoleplayRepository,
  RoleplaySession,
} from '../domain/Roleplay.js';

export const B2B_PERSONAS: RoleplayPersona[] = [
  {
    id: 'cfo-cético',
    name: 'Roberto Valente',
    title: 'Diretor Financeiro (CFO)',
    companyType: 'Indústria Metalúrgica (Faturamento R$ 120M/ano)',
    difficulty: 'AVANCADO',
    scenario:
      'A empresa está cortando despesas gerais e revisando todos os contratos de software. Roberto só aprova projetos com payback comprovado em menos de 6 meses.',
    coreObjections: [
      'Já temos um CRM legado que está pago e funciona para o básico.',
      'O custo de migração e treinamento da equipe de vendas é muito alto.',
      'Qual é o ROI líquido garantido e qual a garantia caso não atinja as metas?',
    ],
    personalityTraits: ['Analítico', 'Direto', 'Cético com promessas de IA', 'Focado em números'],
  },
  {
    id: 'diretor-operacoes',
    name: 'Mariana Duarte',
    title: 'Diretora de Operações',
    companyType: 'Distribuidora Logística Nacional',
    difficulty: 'INTERMEDIARIO',
    scenario:
      'A equipe comercial é descentralizada e tem baixa adesão a processos formais. Mariana precisa de visibilidade em tempo real sem sobrecarregar a rotina operacional.',
    coreObjections: [
      'Meus vendedores de campo não vão preencher formulários complexos no celular.',
      'Não temos equipe de TI dedicada para fazer integrações complexas.',
      'Quanto tempo leva para colocar o sistema no ar de verdade?',
    ],
    personalityTraits: ['Pragmática', 'Focada em tempo', 'Preocupada com aderência da equipe'],
  },
  {
    id: 'comprador-pressao',
    name: 'Carlos Mendes',
    title: 'Gerente de Compras / Procurement',
    companyType: 'Rede Varejista Regional',
    difficulty: 'INICIANTE',
    scenario:
      'Carlos recebeu a ordem de pesquisar 3 opções de mercado e fechar com a menor taxa de mensalidade possível para o próximo trimestre.',
    coreObjections: [
      'O concorrente X me fez uma proposta 30% mais barata com as mesmas funções.',
      'Preciso de desconto para pagamento à vista ou cancelamento sem multa.',
    ],
    personalityTraits: ['Negociador', 'Focado em preço', 'Busca concessões rápidas'],
  },
];

/**
 * Repositório de produção em PostgreSQL via Prisma (DT-006).
 * Persistência real, multi-tenant e auditável.
 */
export class PrismaRoleplayRepository implements RoleplayRepository {
  async listPersonas(): Promise<RoleplayPersona[]> {
    return B2B_PERSONAS;
  }

  async getPersonaById(id: string): Promise<RoleplayPersona | null> {
    return B2B_PERSONAS.find((p) => p.id === id) ?? null;
  }

  async createSession(data: {
    organizationId: string;
    userId: string;
    personaId: string;
  }): Promise<RoleplaySession> {
    const persona = await this.getPersonaById(data.personaId);
    const personaLabel = persona?.name || data.personaId;
    const difficulty =
      persona?.difficulty === 'AVANCADO'
        ? 'dificil'
        : persona?.difficulty === 'INTERMEDIARIO'
          ? 'medio'
          : 'facil';

    const created = await prisma.roleplaySession.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        brand: 'geral',
        personaId: data.personaId,
        personaLabel,
        difficulty,
        durationSeconds: 0,
        transcript: [],
        turnEvaluations: [],
        overallScore: 0,
        clarityScore: 0,
        objectionHandlingScore: 0,
        closingScore: 0,
        strengths: [],
        improvements: [],
        summary: '',
      },
    });

    return {
      id: created.id,
      organizationId: created.organizationId,
      userId: created.userId,
      personaId: created.personaId,
      status: 'ACTIVE',
      messages: [],
      createdAt: created.createdAt,
      updatedAt: created.createdAt,
    };
  }

  async getSession(organizationId: string, sessionId: string): Promise<RoleplaySession | null> {
    const row = await prisma.roleplaySession.findFirst({
      where: { id: sessionId, organizationId },
    });
    if (!row) return null;

    const messages = (Array.isArray(row.transcript)
      ? row.transcript
      : []) as unknown as RoleplayMessage[];
    const isCompleted = row.overallScore > 0 || Boolean(row.summary);

    return {
      id: row.id,
      organizationId: row.organizationId,
      userId: row.userId,
      personaId: row.personaId,
      status: isCompleted ? 'COMPLETED' : 'ACTIVE',
      messages,
      feedback: isCompleted
        ? {
            overallScore: row.overallScore,
            spinSellingScores: {
              situation: row.clarityScore,
              problem: row.objectionHandlingScore,
              implication: Math.round((row.clarityScore + row.objectionHandlingScore) / 2),
              needPayoff: row.closingScore,
            },
            objectionHandlingScore: row.objectionHandlingScore,
            strengths: (Array.isArray(row.strengths) ? row.strengths : []) as string[],
            improvementAreas: (Array.isArray(row.improvements) ? row.improvements : []) as string[],
            summary: row.summary,
          }
        : undefined,
      createdAt: row.createdAt,
      updatedAt: row.createdAt,
    };
  }

  async addMessage(
    organizationId: string,
    sessionId: string,
    message: RoleplayMessage,
  ): Promise<void> {
    const session = await this.getSession(organizationId, sessionId);
    if (!session) return;
    const updatedMessages = [...session.messages, message];
    await prisma.roleplaySession.update({
      where: { id: sessionId },
      data: {
        transcript: updatedMessages as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async completeSession(
    organizationId: string,
    sessionId: string,
    feedback: RoleplayFeedback,
  ): Promise<void> {
    await prisma.roleplaySession.update({
      where: { id: sessionId },
      data: {
        overallScore: feedback.overallScore,
        clarityScore: feedback.spinSellingScores.situation,
        objectionHandlingScore: feedback.objectionHandlingScore,
        closingScore: feedback.spinSellingScores.needPayoff,
        strengths: feedback.strengths as unknown as Prisma.InputJsonValue,
        improvements: feedback.improvementAreas as unknown as Prisma.InputJsonValue,
        summary: feedback.summary,
      },
    });
  }

  async listSessionsByUser(organizationId: string, userId: string): Promise<RoleplaySession[]> {
    const rows = await prisma.roleplaySession.findMany({
      where: { organizationId, userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      userId: row.userId,
      personaId: row.personaId,
      status: row.overallScore > 0 || row.summary ? 'COMPLETED' : 'ACTIVE',
      messages: (Array.isArray(row.transcript)
        ? row.transcript
        : []) as unknown as RoleplayMessage[],
      createdAt: row.createdAt,
      updatedAt: row.createdAt,
    }));
  }
}

/**
 * Repositório em memória mantido para testes isolados sem I/O de banco.
 */
const sessionsStore = new Map<string, RoleplaySession>();

export class InMemoryRoleplayRepository implements RoleplayRepository {
  async listPersonas(): Promise<RoleplayPersona[]> {
    return B2B_PERSONAS;
  }

  async getPersonaById(id: string): Promise<RoleplayPersona | null> {
    return B2B_PERSONAS.find((p) => p.id === id) ?? null;
  }

  async createSession(data: {
    organizationId: string;
    userId: string;
    personaId: string;
  }): Promise<RoleplaySession> {
    const id = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const session: RoleplaySession = {
      id,
      organizationId: data.organizationId,
      userId: data.userId,
      personaId: data.personaId,
      status: 'ACTIVE',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    sessionsStore.set(`${data.organizationId}:${id}`, session);
    return session;
  }

  async getSession(organizationId: string, sessionId: string): Promise<RoleplaySession | null> {
    return sessionsStore.get(`${organizationId}:${sessionId}`) ?? null;
  }

  async addMessage(
    organizationId: string,
    sessionId: string,
    message: RoleplayMessage,
  ): Promise<void> {
    const key = `${organizationId}:${sessionId}`;
    const session = sessionsStore.get(key);
    if (session) {
      session.messages.push(message);
      session.updatedAt = new Date();
    }
  }

  async completeSession(
    organizationId: string,
    sessionId: string,
    feedback: RoleplayFeedback,
  ): Promise<void> {
    const key = `${organizationId}:${sessionId}`;
    const session = sessionsStore.get(key);
    if (session) {
      session.status = 'COMPLETED';
      session.feedback = feedback;
      session.updatedAt = new Date();
    }
  }

  async listSessionsByUser(organizationId: string, userId: string): Promise<RoleplaySession[]> {
    const list: RoleplaySession[] = [];
    for (const [key, session] of sessionsStore.entries()) {
      if (key.startsWith(`${organizationId}:`) && session.userId === userId) {
        list.push(session);
      }
    }
    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const prismaRoleplayRepository = new PrismaRoleplayRepository();
export const inMemoryRoleplayRepository = new InMemoryRoleplayRepository();
