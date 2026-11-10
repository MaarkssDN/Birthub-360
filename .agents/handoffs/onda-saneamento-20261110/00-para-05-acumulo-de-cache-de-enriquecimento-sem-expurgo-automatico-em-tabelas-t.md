De: Agente 00 — Coordenador
Para: Agente 05 (Prospecção Comercial)
Onda: Onda 4 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-019)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 4

## Problema

**Acúmulo de cache de enriquecimento sem expurgo automático em tabelas temporárias**

- **Dívida técnica:** BT360-DT-0027
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** O cache foi projetado para persistência perpétua sem política de ciclo de vida de dados (TTL).

**Impacto:** Vendedores realizam prospecção com telefones e contatos obsoletos salvos há meses no banco; crescimento contínuo de linhas na base.

## Arquivo(s) envolvido(s)

`src/features/prospecting/services/enrichment.service.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-019`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-019` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

**Agente 05 — 2026-11-10** (branch `agente/05-cache-enriquecimento-ttl`, pendente de revisão do Agente 24)

O acúmulo real era a tabela `EnrichmentLog` (payload bruto do provider em `rawData`, ~7 linhas por execução, sem remoção). Implementado ciclo de vida em `src/features/prospecting/services/enrichment.service.ts`:

- `ENRICHMENT_LOG_RETENTION_DAYS` (default 60 dias, faixa recomendada pela auditoria) + `getEnrichmentLogRetentionMs`/`computeEnrichmentLogCutoff`.
- `purgeExpiredEnrichmentLogs` → `repo.deleteEnrichmentLogsCreatedBefore(cutoff)` (novo método em `IEnrichmentRepository`/`PrismaEnrichmentRepository`, `deleteMany` por `createdAt`).
- `maybePurgeExpiredEnrichmentLogs` — expurgo oportunista com throttle de 24h por processo, disparado por `enrichCompany`; falha de banco é logada via `logger.warn` e não derruba o enriquecimento.
- Sem migração/schema novo e sem dependência de `src/lib/queue/**` (slot do Agente 16).

Gates executados no worktree: `npx tsc --noEmit` ✓, `npm run lint` ✓ (0 diagnósticos nos arquivos alterados), `vitest run -c vitest.unit.config.ts src/features/prospecting/services/__tests__/enrichmentRetention.test.ts` — 10/10 testes (retenção default/config/inválida, cutoff, expurgo, throttle 24h, falha de banco observável, gatilho via `enrichCompany` no caminho de cache).
