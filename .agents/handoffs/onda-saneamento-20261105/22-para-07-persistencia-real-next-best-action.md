De: 22 — Verificação de Realidade
Para: 07 — IA e Automações
Onda: onda-saneamento-20261105
Status: aberto
Prioridade: bloqueador
Bloqueador-ref: DIV-AGENTE-22-001 (B-08)
Sprint destino: Onda 4 — IA, Enxames e Otimização de Custos

## Problema
Card de sugestão de próxima ação (NextBestActionCard.tsx) possui botões "Aceitar Sugestão" e "Descartar" que apenas alteram estado local React sem persistir decisão no banco.

## Arquivo(s) envolvido(s)
- src/components/commercial/NextBestActionCard.tsx:45-90
- src/services/ai/recommendations.service.ts:30-65

## Evidência
Base de auditoria: DIVIDAS-AGENTE-22.md e DIVIDAS-AGENTE-07.md.
- NextBestActionCard.tsx (L45-90): Clique em "Aceitar" chama setAccepted(true) e exibe toast de sucesso, mas não dispara requisição HTTP. Ao recarregar a página (F5), a ação descartada ressurge.
- Violação de AGENTS.md §22 (B-08) e princípio de persistência real.

## Alteração necessária
1. Conectar botões de ação à API POST /api/commercial/recommendations/:id/action.
2. Persistir status ACCEPTED/REJECTED e feedback do usuário no banco PostgreSQL.
3. Atualizar cache e invalidar queries React Query.

## Teste esperado
- Critério de Aceite: Ação aceita ou descartada persiste após refresh da página no navegador.
- Teste E2E/Componente: next-best-action-persistence.spec.tsx.

## Contexto adicional
Eliminação de UI cenográfica no CRM.
