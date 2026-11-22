De: 00 — Coordenador
Para: 06 — Integrações e Bitrix
Onda: paralela-8
Status: resolvido
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

## Resolução

Executado pelo Agente 06 em `C:/Github/Birthub-360-worktrees/agente-06-integracoes`, branch `agente/06-integracoes-saneamento` (commit `e951ec5cf`).

- `npx knip --reporter compact` reexecutado na worktree: **zero** exports/tipos mortos restantes em `src/services/bitrix/**` e `src/features/integrations/**` (único residual do escopo: dependência não listada `@hapi/boom` em `whatsapp.service.ts`, pré-existente e fora do escopo de exports — reportar ao 08/00 se quiserem tratar).
- `src/services/bitrix/exportFormatter.service.ts`: removidos os re-exports mortos (`buildXlsxWorkbook`, `toCsv`, `toJson`, `sanitizeSpreadsheetFormulaString`, tipo `ExtractionEntityDataset`); mantido apenas `formatSafeCsvCell`, único consumidor real (`tests/unit/services/bitrix/exportFormatter-csv-injection.test.ts`).
- `src/services/bitrix/extraction.ts`: classe `BitrixStreamingExtractionService` e tipo `ChunkProcessResult` desexportados (a instância `bitrixStreamingExtractionService` permanece exportada — usada pelo teste de streaming).
- Barrel `bitrix.service.ts`: removidos todos os re-exports sinalizados pelo knip (13 valores + 21 tipos), preservando os que têm consumidor real via barrel (`bitrix.routes.ts`, `dailyPlanRoutes.ts`, `mesaTratamento.routes.ts`, `bitrixSync.worker.ts`, `LeadUseCases.ts` dynamic import).
- Símbolos usados apenas internamente tiveram `export` removido (não deletados): `MAX_PAGE_RETRIES`, `DEFAULT_STUCK_TIMEOUT_MS`, `MAX_RUN_ATTEMPTS`, `BITRIX_EXTRACTION_PURGE_QUEUE_NAME`, `USER_ENTITY_FIXED_FIELDS` e `EXTRACTION_FILE_FORMATS` (constantes deletadas por não terem nenhum uso, interno ou externo), `whatsappEvents`, `CALL_RESULT_WEBHOOK_PATH`, `WhatsAppDriver`, tipos internos de threecx/birth-voice/fieldMap/IntegrationStatusBadge, re-exports de tipos de contrato em `dailyPlan(.Closing).service.ts` e `service/extraction.ts`.
- Singletons sem consumidor removidos: `bitrixPaginatedExtractor`, `bitrixActivitySyncService`, `whatsAppConnectorManager` (classes mantidas — usadas por testes).
- `MondayProvider`/`PipedriveProvider`: removido `export { X }` — o registro continua via `registerCrmProvider` no import de side-effect.
- Arquivos 100% sem referência (knip "unused files", sem import estático nem dinâmico): deletados `bitrix/syncLeadFromBitrix.ts`, `monday/monday.service.ts`, `pipedrive/pipedrive.service.ts`, `rdstation/rdstation.service.ts`.
- Verificação por símbolo: cada remoção foi confirmada com `grep` por imports via barrel, import dinâmico e uso interno antes de agir.

**Gates:** `npx tsc --noEmit` limpo; `npx biome lint src/services/bitrix src/features/integrations` — 0 erros, 3 warnings pré-existentes (idênticos ao baseline em `main`); `npx knip` filtrado — escopo limpo; testes focados `tests/unit/services/bitrix`, `tests/unit/integrations/{bitrix,whatsapp,bitrixEventMeshBridge}`, `src/features/integrations/bitrix/**/__tests__` — 204 testes verdes.
