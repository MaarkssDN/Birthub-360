De: Agente 00 — Coordenador
Para: Agente 06A (Extrações Bitrix)
Onda: Onda 3 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-021)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 3

## Problema

**Falta de rotina de purga periódica de arquivos temporários gerados em extrações antigas**

- **Dívida técnica:** BT360-DT-0035
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** O desenvolvimento focou no fluxo de download imediato sem implementação de governança de ciclo de vida do arquivo temporário.

**Impacto:** Risco de parada do serviço por falta de espaço em disco no filesystem do servidor.

## Arquivo(s) envolvido(s)

`src/features/integrations/bitrix/service/extraction.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-021`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-021` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

1. Alteração cirúrgica — somente os arquivos do escopo; nenhuma refatoração adjacente.
2. Tratamento explícito de erro, sem fallbacks enganosos (AGENTS.md §30 e §32).
3. Adicionar ou atualizar testes automatizados cobrindo caminho de sucesso e de falha.
4. Respeitar slots exclusivos e dependências de schema/contrato (abrir handoff ao proprietário quando o arquivo pertencer a outro agente).

## Teste esperado

- `npx tsc --noEmit`
- `npm run lint`
- Testes específicos da área afetada (sucesso e falha).

## Contexto adicional

- **Agente revisor obrigatório:** Agente 24 — parecer formal em `.agents/reviews/`.
- **Condição para encerramento:** parecer `APROVADO` do Agente 24 com validação de hashes dos arquivos alterados e verificação de não-regressão.
- O destinatário pode atualizar o `Status` deste handoff e adicionar seção de resolução sem apagar o pedido original.

## Resolução

Verificação em 2026-11-12 pelo Agente 06A (worktree `agente-06a-bitrix`, branch `agente/06A-bitrix-saneamento`, base `origin/main` @ 0b52894e0):

A rotina de purga periódica **já estava implementada** na Onda 42 — `src/features/integrations/bitrix/jobs/bitrixExtractionPurge.worker.ts` (`runBitrixExtractionPurgeSweep` + `createBitrixExtractionPurgeWorker` + `scheduleBitrixExtractionPurgeJob`, cron diário `0 5 * * *`), registrada em `src/bootstrap/workers.ts` (condicionada a `embeddedWorkersEnabled`). Cobre exatamente o impacto descrito: remove os arquivos temporários em `BITRIX_EXTRACTION_STORAGE_DIR` via `deleteExtractionRunFiles` e anonimiza a linha `BitrixExtractionRun` (expurgo LGPD opção B, `purgedAt`, retenção `BITRIX_EXTRACTION_RETENTION_DAYS`, flag fail-safe `BITRIX_EXTRACTION_PURGE_ENABLED`). A dívida permanecia "NÃO INICIADO" no backlog porque o worker **não tinha nenhum teste automatizado** — lacuna do critério de aceite "adição ou atualização de testes automatizados cobrindo caminho de sucesso e de falha".

Fechamento desta rodada (cirúrgico, sem alterar o worker): criado `src/features/integrations/bitrix/jobs/__tests__/bitrixExtractionPurge.worker.test.ts` com 6 casos — flag desligada (fail-safe, zero acesso ao banco), expurgo feliz (arquivo apagado antes da linha, `filters.search` removido, `files=null`, `purgedAt` gravado, auditoria), filtro de seleção (somente status terminais + `purgedAt: null` + cutoff de retenção), idempotência (`progress.purgedAt`), falha isolada por execução e por organização (varredura continua).

Limitação conhecida (documentada no próprio worker, fora do escopo cirúrgico desta tarefa): execuções presas em `running`/`queued` não são candidatas ao expurgo — reconciliação é responsabilidade de `reconcileStuckRuns`; e o expurgo itera linhas do banco, não diretórios órfãos de disco sem linha correspondente.

Gates executados: `npx tsc --noEmit` (0 erros), `npm run lint` (biome — 0 erros no escopo), `npx vitest run -c vitest.unit.config.ts src/features/integrations/bitrix` → 16 arquivos / 187 testes passando. Relatório: `.agents/runs/06a-saneamento-abortsignal-purga.md`.

**Pendente de encerramento formal:** parecer `APROVADO` do Agente 24 (validação de hashes + não-regressão), conforme condição do handoff.
