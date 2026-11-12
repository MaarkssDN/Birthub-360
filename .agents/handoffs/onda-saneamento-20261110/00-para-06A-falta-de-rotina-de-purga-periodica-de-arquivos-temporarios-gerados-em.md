De: Agente 00 — Coordenador
Para: Agente 06A (Extrações Bitrix)
Onda: Onda 3 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-021)
Status: em-andamento
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

## Resolução (Agente 06A — 2026-11-12)

A rotina de purga **já existe e está operacional** — implementada na Onda 42 (dossiê CPI DEC-04):

- `src/features/integrations/bitrix/jobs/bitrixExtractionPurge.worker.ts`: `runBitrixExtractionPurgeSweep()` expurga execuções terminais mais antigas que `BITRIX_EXTRACTION_RETENTION_DAYS` (default 45d) — remove os arquivos em `BITRIX_EXTRACTION_STORAGE_DIR` via `deleteExtractionRunFiles` (antes de anonimizar a linha, ordem arquivo→linha) e anonimiza `filters.search`/`files`/`errorMessage`, preservando o registro estatístico (opção B LGPD).
- Agendado diariamente 05:00 via `scheduleBitrixExtractionPurgeJob()` (BullMQ `upsertJobScheduler`, idempotente) em `src/bootstrap/workers.ts`; fail-safe `BITRIX_EXTRACTION_PURGE_ENABLED`.
- Lacuna residual coberta pela TAREFA-SANEAMENTO-046 (mesma sessão): cancelamento cooperativo impede que extrações abandonadas continuem gerando arquivos.

Validação executada: `vitest tests/unit/features/integrations/bitrix/jobs/bitrixExtractionPurge.worker.test.ts` **13/13 PASS** + `extractionFiles.test.ts` e demais suítes do domínio (44/44 no conjunto). Nenhuma mudança de código necessária — dívida estava implementada, faltava evidência.

Pendente: parecer Agente 24 e integração Agente 00.
