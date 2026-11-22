import { describe, expect, it } from 'vitest';
import type { PlaybookKey } from '../../../../config/playbooks.js';
import type {
  AssistantHistoryMessage,
  AssistantHistoryRepository,
} from '../../domain/AssistantHistory.js';
import { AssistantHistoryService } from '../assistant-history.service.js';

class FakeAssistantHistoryRepository implements AssistantHistoryRepository {
  public messages: AssistantHistoryMessage[] = [];
  public appendCalls: any[] = [];

  async listRecent(
    _organizationId: string,
    _userId: string,
    _brand: PlaybookKey,
    limit: number = 50,
  ): Promise<AssistantHistoryMessage[]> {
    return this.messages.slice(0, limit);
  }

  async appendTurn(
    organizationId: string,
    userId: string,
    brand: PlaybookKey,
    userText: string,
    assistantText: string,
  ): Promise<void> {
    this.appendCalls.push({ organizationId, userId, brand, userText, assistantText });
    this.messages.push(
      { id: '1', role: 'user', content: userText, brand, createdAt: new Date() },
      { id: '2', role: 'assistant', content: assistantText, brand, createdAt: new Date() },
    );
  }
}

describe('AssistantHistoryService with Repository', () => {
  const org = 'org-1';
  const user = 'user-1';
  const brand = 'atlas-hub' as PlaybookKey;

  it('lista mensagens do repositório em memória sem tocar banco', async () => {
    const repo = new FakeAssistantHistoryRepository();
    repo.messages = [
      { id: '1', role: 'user', content: 'Olá', brand, createdAt: new Date() },
      { id: '2', role: 'assistant', content: 'Como posso ajudar?', brand, createdAt: new Date() },
    ];
    const service = new AssistantHistoryService(repo);

    const history = await service.listAssistantHistory(org, user, brand);
    expect(history).toHaveLength(2);
    expect(history[0].content).toBe('Olá');
    expect(history[1].content).toBe('Como posso ajudar?');
  });

  it('adiciona turno de conversa com mensagem de usuário e resposta', async () => {
    const repo = new FakeAssistantHistoryRepository();
    const service = new AssistantHistoryService(repo);

    await service.appendAssistantTurn(
      org,
      user,
      brand,
      'Qual a meta do trimestre?',
      'A meta é 200k.',
    );

    expect(repo.appendCalls).toHaveLength(1);
    expect(repo.messages).toHaveLength(2);
    expect(repo.messages[0].role).toBe('user');
    expect(repo.messages[0].content).toBe('Qual a meta do trimestre?');
    expect(repo.messages[1].role).toBe('assistant');
    expect(repo.messages[1].content).toBe('A meta é 200k.');
  });
});
