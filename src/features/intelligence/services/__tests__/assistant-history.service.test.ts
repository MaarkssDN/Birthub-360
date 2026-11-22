import { describe, expect, it } from 'vitest';
import type { PlaybookKey } from '../../../config/playbooks';
import type {
  AssistantHistoryMessage,
  AssistantHistoryRepository,
} from '../../domain/AssistantHistory';
import { AssistantHistoryService } from '../assistant-history.service';

interface StoredMessage {
  id: string;
  organizationId: string;
  userId: string;
  brand: PlaybookKey;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

class FakeAssistantHistoryRepository implements AssistantHistoryRepository {
  private messages: StoredMessage[] = [];

  constructor(initial: StoredMessage[] = []) {
    this.messages = [...initial];
  }

  async listRecent(
    organizationId: string,
    userId: string,
    brand: PlaybookKey,
    limit: number = 20,
  ): Promise<AssistantHistoryMessage[]> {
    const filtered = this.messages.filter(
      (m) => m.organizationId === organizationId && m.userId === userId && m.brand === brand,
    );

    // Ordena desc e pega até limit, depois inverte para ordem cronológica
    const desc = [...filtered].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const taken = desc.slice(0, limit);
    return taken.reverse().map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      brand: m.brand,
      createdAt: m.createdAt,
    }));
  }

  async appendTurn(
    organizationId: string,
    userId: string,
    brand: PlaybookKey,
    userText: string,
    assistantText: string,
  ): Promise<void> {
    const now = Date.now();
    this.messages.push({
      id: `msg-${this.messages.length + 1}`,
      organizationId,
      userId,
      brand,
      role: 'user',
      content: userText,
      createdAt: new Date(now),
    });
    this.messages.push({
      id: `msg-${this.messages.length + 1}`,
      organizationId,
      userId,
      brand,
      role: 'assistant',
      content: assistantText,
      createdAt: new Date(now + 1),
    });
  }
}

describe('AssistantHistoryService', () => {
  const ORG = 'org-1';
  const USER = 'user-1';
  const BRAND: PlaybookKey = 'geral';

  it('lista mensagens recentes em ordem cronológica com isolamento por tenant/user/brand', async () => {
    const repo = new FakeAssistantHistoryRepository([
      {
        id: '1',
        organizationId: ORG,
        userId: USER,
        brand: BRAND,
        role: 'user',
        content: 'Pergunta 1',
        createdAt: new Date('2026-01-01T10:00:00Z'),
      },
      {
        id: '2',
        organizationId: ORG,
        userId: USER,
        brand: BRAND,
        role: 'assistant',
        content: 'Resposta 1',
        createdAt: new Date('2026-01-01T10:00:05Z'),
      },
      {
        id: '3',
        organizationId: 'other-org',
        userId: USER,
        brand: BRAND,
        role: 'user',
        content: 'Cross tenant',
        createdAt: new Date('2026-01-01T10:00:10Z'),
      },
    ]);

    const service = new AssistantHistoryService(repo);
    const history = await service.listAssistantHistory(ORG, USER, BRAND);

    expect(history).toHaveLength(2);
    expect(history[0].content).toBe('Pergunta 1');
    expect(history[1].content).toBe('Resposta 1');
  });

  it('persiste um novo turno completo (usuário + assistente)', async () => {
    const repo = new FakeAssistantHistoryRepository();
    const service = new AssistantHistoryService(repo);

    await service.appendAssistantTurn(
      ORG,
      USER,
      BRAND,
      'Como funciona o split de comissões?',
      'O split é configurado nas regras de remuneração...',
    );

    const history = await service.listAssistantHistory(ORG, USER, BRAND);
    expect(history).toHaveLength(2);
    expect(history[0].role).toBe('user');
    expect(history[0].content).toBe('Como funciona o split de comissões?');
    expect(history[1].role).toBe('assistant');
    expect(history[1].content).toContain('O split é configurado');
  });
});
