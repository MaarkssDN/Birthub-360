export interface OmnichannelOperatorLoad {
  operatorId: string;
  online: boolean;
  activeChatsCount: number;
  maxConcurrentChats: number;
}

export function routeConversationByActiveCapacity(
  operators: readonly OmnichannelOperatorLoad[],
): OmnichannelOperatorLoad {
  const eligible = operators.filter(
    (op) => op.online && op.activeChatsCount < op.maxConcurrentChats,
  );
  if (eligible.length === 0) {
    throw new Error('Nenhum operador online com capacidade disponível na fila do Inbox Unificado.');
  }

  // Ordena pelo menor índice de ocupação relativa (activeChatsCount / maxConcurrentChats)
  const sorted = [...eligible].sort((a, b) => {
    const ratioA = a.activeChatsCount / Math.max(1, a.maxConcurrentChats);
    const ratioB = b.activeChatsCount / Math.max(1, b.maxConcurrentChats);
    return ratioA - ratioB || a.activeChatsCount - b.activeChatsCount;
  });

  return sorted[0];
}
