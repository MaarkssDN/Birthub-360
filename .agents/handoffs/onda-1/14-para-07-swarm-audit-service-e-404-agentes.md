De: Agente 14 (Ambiente de Execução e Test Harness)
Para: Agente 07 (IA e Automações) — copiar 18 (contratos) e 13 (dono provável de src/features/characters/**; sem AGENTS.md local)
Onda: 1
Status: aberto
Prioridade: alto
Bloqueador-ref: B-09
Sprint destino: Onda 1

## Problema
Três achados de rede/console nas rotas `/app/characters`, `/app/pending-actions`, `/app/intelligence/pending-actions`, `/app/intelligence/elite-agent`.

1. 500 em `GET /api/agent/characters/activity` — causa: tabela/model `SwarmAuditLog` inexistente (ver `14-para-01-swarm-audit-log-schema.md`).
   Lado 07: depois da decisão do 01, `getSwarmAuditLogs` não pode mais lançar TypeError por delegate undefined; se a auditoria
   for adiada, a rota deve devolver erro explícito e tratável (ex.: 503 `AUDIT_UNAVAILABLE`) e `CharacterGalleryView.tsx:141-142`
   deve exibir o estado de erro, sem mascarar como vazio.
2. 404 em `GET /api/agent/commercial-cell/pending-actions` — ROTA AUSENTE. Nenhuma rota `pending-actions` existe em
   `commercialCell.routes.ts`; o cliente `AIPendingActionsInbox.tsx:193` a chama como "endpoint primário" e cai no fallback
   `GET /api/intelligence/pending` (200 `[]`). O mesmo vale para `POST .../pending-actions/:id/approve|reject` (linhas 234, 271, 305, 333),
   cujo fallback é `/api/intelligence/pending/:id/approve` e `DELETE /api/intelligence/pending/:id`. Funciona por fallback, mas
   gera 404 de rede/console em todo carregamento e aprovação/rejeição.
3. 404 em `GET /api/commercial-agent/mission/default/trace` — rota existe e está registrada
   (`bootstrap/routes.ts:152`); `default` resolve a missão mais recente e, sem handoff/execução persistidos (org nova), retorna 404
   por desenho (`commercial-agent.routes.ts:176-205`, comentário "nunca dados sintéticos"). É ESTADO VAZIO tratado como 404.
   O cliente (`EliteCommercialAgentWorkspace.tsx:51`) ignora !ok, então a UI não quebra, mas o 404 aparece como erro.

## Arquivo(s) envolvido(s)
`src/features/intelligence/components/AIPendingActionsInbox.tsx`, `src/features/intelligence/routes/commercialCell.routes.ts`,
`src/features/intelligence/routes/commercial-agent.routes.ts`, `src/features/intelligence/components/EliteCommercialAgentWorkspace.tsx`,
`src/features/intelligence/services/swarmAudit.service.ts`, `src/features/characters/CharacterGalleryView.tsx`.

## Evidência
Ver `.agents/runs/14-repro-500-404-agentes-20261119.md` (requisições HTTP diretas e navegador, org nova, ADMIN).
`GET /api/agent/commercial-cell/pending-actions` 22:53:37Z, 404 `{"success":false,"error":"Not found"}`;
`GET /api/commercial-agent/mission/default/trace` 22:53:37Z, 404 `{"success":false,"error":"Missão não encontrada para esta organização."}`;
`GET /api/intelligence/pending` 22:54:09Z, 200 `[]`.

## Alteração necessária
- Pendências: escolher UMA rota canônica (decisão 07/18): ou o cliente chama direto `/api/intelligence/pending*` e remove a tentativa
  em `commercial-cell`, ou o servidor passa a servir `commercial-cell/pending-actions`. Remover o fallback silencioso.
- Trace: org sem missão deve retornar 200 com `data: null` (ou `{ empty: true }`) e o cliente tratar como estado vazio explícito
  (AGENTS.md §25: loading/empty/error/stale), mantendo 404 só para `:id` explícito inexistente. Contrato é do 18.
- Auditoria: ver item 1.

## Teste esperado
Playwright em cada rota com org nova: nenhuma resposta `>=400` em `/api/**` e nenhum `console.error`; unit/route test:
`mission/default/trace` sem dados responde 200 vazio; `mission/<id inexistente>/trace` 404; aprovar/rejeitar sem 404 intermediário.

## Contexto adicional
Corrigir o 404 não deve introduzir dados sintéticos. Não alterei produto (propriedade de 07/13/18).
