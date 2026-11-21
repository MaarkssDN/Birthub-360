export interface CopilotChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function buildSlidingWindowCopilotContext(params: {
  messages: readonly CopilotChatMessage[];
  windowSize?: number;
}): {
  contextMessages: CopilotChatMessage[];
  summarizedOlderCount: number;
} {
  const windowSize = Math.max(2, params.windowSize ?? 6);
  if (params.messages.length <= windowSize) {
    return {
      contextMessages: [...params.messages],
      summarizedOlderCount: 0,
    };
  }

  const older = params.messages.slice(0, params.messages.length - windowSize);
  const recent = params.messages.slice(params.messages.length - windowSize);

  const bulletPoints = older
    .map((m) => `${m.role}: ${m.content.trim().slice(0, 80)}`)
    .join(' | ');

  const summaryMessage: CopilotChatMessage = {
    role: 'system',
    content: `[Resumo condensado de ${older.length} mensagens anteriores]: ${bulletPoints}`,
  };

  return {
    contextMessages: [summaryMessage, ...recent],
    summarizedOlderCount: older.length,
  };
}
