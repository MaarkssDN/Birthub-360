# Run — Agente 02 · TAREFA-SANEAMENTO-015 / BT360-DT-0014

- **Data:** 2026-11-12
- **Onda:** W4 (Domínio de produto)
- **Branch:** `agente/02-w4-notification-unread` (base `origin/integracao/onda-saneamento-20261110` @ `4b561f15b`)
- **Worktree:** `C:/Github/Birthub-360-worktrees/agente-02-w4-produto`
- **Handoff:** `00-para-02-leitura-de-notificacao-broadcast-...` → `em-andamento`

## Diagnóstico

`notification.service.ts` **já implementava** a correção da dívida (status `IMPLEMENTADO / NÃO VALIDADO`): broadcasts (`userId: null`) mantêm `readAt` global `null`; leitura é registrada por usuário em `Setting` chave `notifications.broadcastReads` (`@@unique([organizationId, userId, key])`), com cache em memória e fallback quando o delegate não está disponível.

Cenários conferidos no código: `list` hidrata `readAt` individual só para quem leu; `unreadCount` exclui ids lidos via `notIn`; `markRead`/`markAllRead` gravam leitura por destinatário sem tocar o registro compartilhado; `remove` já respeita `canManageBroadcast`.

## O que foi feito

Apenas **validação** — nenhuma mudança em produção. Dois testes novos em `tests/unit/features/notification-service.test.ts` fechando a lacuna de evidência:

1. `unreadCount`: broadcast lido por USER sai da contagem (`id.notIn`), para USER_B segue contando (`where.id` ausente, `OR` por destinatário).
2. `list`: `readAt` hidratado (instância de `Date`) para quem leu; `readAt: null` para colega — prova de não contágio.

## Verificação

- `npx vitest run tests/unit/features/notification-service.test.ts`: **15/15 PASS**.
- `npx tsc --noEmit`: **PASS**.
- `npx biome check`: arquivo de teste é ignorado pela config (tests/ fora do escopo do Biome).
- Sem alteração de código → `npm run build` não aplicável a diff funcional; suíte completa de notifications (`notifications.test.tsx`) não reexecutada por não haver mudança em componente/rota.

## Pendências

- Parecer Agente 24; integração pelo Agente 00.
- Observação para revisão: persistência de leituras broadcast depende do model `Setting` (Propriedade Agente 01) — já existe no schema, sem migração necessária.
