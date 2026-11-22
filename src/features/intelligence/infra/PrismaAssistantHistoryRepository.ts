import type { PlaybookKey } from '../../../config/playbooks.js';
import { logger } from '../../../lib/logger.js';
import { prisma } from '../../../lib/prisma.js';
import type {
  AssistantHistoryMessage,
  AssistantHistoryRepository,
} from '../domain/AssistantHistory.js';

const HISTORY_LIMIT = 20;

export class PrismaAssistantHistoryRepository implements AssistantHistoryRepository {
  async listRecent(
    organizationId: string,
    userId: string,
    brand: PlaybookKey,
    limit: number = HISTORY_LIMIT,
  ): Promise<AssistantHistoryMessage[]> {
    const rows = await prisma.assistantMessage.findMany({
      where: { organizationId, userId, brand },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return rows.reverse().map((row: any) => ({
      id: row.id,
      role: row.role as 'user' | 'assistant',
      content: row.content,
      brand: row.brand as PlaybookKey,
      createdAt: row.createdAt,
    }));
  }

  async appendTurn(
    organizationId: string,
    userId: string,
    brand: PlaybookKey,
    userText: string,
    assistantText: string,
  ): Promise<void> {
    try {
      await prisma.assistantMessage.createMany({
        data: [
          { organizationId, userId, brand, role: 'user', content: userText },
          { organizationId, userId, brand, role: 'assistant', content: assistantText },
        ],
      });
    } catch (err: any) {
      logger.warn(
        { err, organizationId, userId, brand },
        'Falha ao persistir turno do Chatbook (a resposta já foi entregue ao usuário).',
      );
    }
  }
}

export const prismaAssistantHistoryRepository = new PrismaAssistantHistoryRepository();
