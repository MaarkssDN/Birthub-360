De: 00 — Coordenador
Para: 06 — Integrações e Bitrix
Onda: paralela-8
Status: aberto
Prioridade: normal

## Problema
Knip reporta exports e tipos não utilizados em integrações/Bitrix:
- `src/services/bitrix/exportFormatter.service.ts`: tipo `ExtractionEntityDataset` não usado
- `src/services/bitrix/extraction.ts`: tipo `ChunkProcessResult` não usado
- Outros exports mortos em `src/services/bitrix/**` e `src/features/integrations/**` (verificar com `npx knip` filtrado por esses paths)

## Evidência
`npx knip --reporter compact` lista esses tipos; contagem global: 760 exports não usados.

## Alteração necessária
Para cada export morto: confirmar que não é usado via import dinâmico, barrel ou reflection antes de remover. Remover somente o comprovadamente morto. Não alterar comportamento de sincronização Bitrix.

## Teste esperado
`npx tsc --noEmit` limpo; `npx biome lint` nos arquivos; `grep` confirmando zero referências aos símbolos removidos.

## Contexto
Worktree: `.claude/worktrees/ag-06`, branch `agente/06-bitrix-dead-exports`. Bitrix já possui auditoria em BITRIX24-LEAD-FLOW-AUDIT.md — não reauditar do zero.
