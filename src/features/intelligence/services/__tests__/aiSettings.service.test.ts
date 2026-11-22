import { describe, expect, it } from 'vitest';
import type { AiSettingInput, AiSettingItem, AiSettingsRepository } from '../../domain/AiSettings';
import { AiSettingsService } from '../ai-settings.service';

class FakeAiSettingsRepository implements AiSettingsRepository {
  private items: AiSettingItem[] = [];

  constructor(initial: AiSettingItem[] = []) {
    this.items = [...initial];
  }

  async listAll(): Promise<AiSettingItem[]> {
    return [...this.items].sort((a, b) => a.toolKey.localeCompare(b.toolKey));
  }

  async saveMany(settings: AiSettingInput[]): Promise<AiSettingItem[]> {
    for (const s of settings) {
      const idx = this.items.findIndex((item) => item.toolKey === s.toolKey);
      const entry: AiSettingItem = {
        id: `id-${s.toolKey}`,
        ...s,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (idx >= 0) {
        this.items[idx] = entry;
      } else {
        this.items.push(entry);
      }
    }
    return [...this.items];
  }
}

describe('AiSettingsService', () => {
  it('lista configurações ordenadas por toolKey sem tocar banco', async () => {
    const repo = new FakeAiSettingsRepository([
      { toolKey: 'copilot', provider: 'openai', model: 'gpt-4o', temperature: 0.7 },
      { toolKey: 'agent', provider: 'anthropic', model: 'claude-3-5-sonnet', temperature: 0.2 },
    ]);
    const service = new AiSettingsService(repo);

    const result = await service.listSettings();

    expect(result).toHaveLength(2);
    expect(result[0].toolKey).toBe('agent');
    expect(result[1].toolKey).toBe('copilot');
  });

  it('salva e atualiza configurações via repositório', async () => {
    const repo = new FakeAiSettingsRepository();
    const service = new AiSettingsService(repo);

    await service.saveSettings([
      { toolKey: 'writer', provider: 'google', model: 'gemini-1.5-pro', temperature: 0.5 },
    ]);

    const result = await service.listSettings();
    expect(result).toHaveLength(1);
    expect(result[0].toolKey).toBe('writer');
    expect(result[0].provider).toBe('google');
  });
});
