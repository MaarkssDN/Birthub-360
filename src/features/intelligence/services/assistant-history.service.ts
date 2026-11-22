import type { PlaybookKey } from '../../../config/playbooks.js';
import type {
  AssistantHistoryMessage,
  AssistantHistoryRepository,
} from '../domain/AssistantHistory.js';
import { prismaAssistantHistoryRepository } from '../infra/PrismaAssistantHistoryRepository.js';

export type { AssistantHistoryMessage, AssistantHistoryRepository };

export class AssistantHistoryService {
  constructor(
    private readonly repository: AssistantHistoryRepository = prismaAssistantHistoryRepository,
  ) {}

  async listAssistantHistory(
    organizationId: string,
    userId: string,
    brand: PlaybookKey,
  ): Promise<AssistantHistoryMessage[]> {
    return this.repository.listRecent(organizationId, userId, brand);
  }

  async appendAssistantTurn(
    organizationId: string,
    userId: string,
    brand: PlaybookKey,
    userText: string,
    assistantText: string,
  ): Promise<void> {
    return this.repository.appendTurn(organizationId, userId, brand, userText, assistantText);
  }
}

export const assistantHistoryService = new AssistantHistoryService();

export function listAssistantHistory(
  organizationId: string,
  userId: string,
  brand: PlaybookKey,
): Promise<AssistantHistoryMessage[]> {
  return assistantHistoryService.listAssistantHistory(organizationId, userId, brand);
}

export function appendAssistantTurn(
  organizationId: string,
  userId: string,
  brand: PlaybookKey,
  userText: string,
  assistantText: string,
): Promise<void> {
  return assistantHistoryService.appendAssistantTurn(
    organizationId,
    userId,
    brand,
    userText,
    assistantText,
  );
}
