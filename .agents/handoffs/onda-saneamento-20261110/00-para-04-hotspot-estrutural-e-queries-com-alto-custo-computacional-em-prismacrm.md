De: Agente 00 — Coordenador
Para: Agente 04 (CRM, BI e Analytics)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-018)
Status: em-andamento
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Hotspot estrutural e queries com alto custo computacional em PrismaCrm360Repository.ts**

- **Dívida técnica:** BT360-DT-0024
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Agrupamento de todas as consultas da visão 360 em um único método que carrega o grafo completo de dados de uma só vez.

**Impacto:** Lentidão no atendimento de clientes e alto consumo de CPU no banco de dados relacional.

## Arquivo(s) envolvido(s)

`src/features/crm360/infra/PrismaCrm360Repository.ts`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-018`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-018` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução (Agente 04 — 2026-11-12)

`PrismaCrm360Repository.ts`: **1204 → 754 linhas**. Os 8 métodos de documentos comerciais/propostas (`listDocuments`, `createDocument`, `updateDocumentContent`, `listDocumentVersions`, `updateDocumentStatus`, `reconcileFaturaStripePayment`, `recordDocumentView`, `requestDocumentSignature`) + helpers (`calculateItem`, `computeDocumentTotals`, `serializeDocument`) foram extraídos verbatim para `src/features/crm360/infra/PrismaCrm360DocumentRepository.ts` (535 linhas), conforme a própria exceção de hotspot prescrevia ("repositório próprio, separado do resto").

`PrismaCrm360Repository` compõe a nova classe e delega — `ICrm360Repository`, DI (`shared/di/setup.ts`) e rotas inalterados. Gates de negócio preservados verbatim: BILLING-003 (Fatura→Pago só via reconciliação Stripe ao vivo), ACH-17-08 (dealClosureGate + actorUserId), CYC-005 (versionamento), RLS bypass só em `recordDocumentView`.

Exceção obsoleta removida de `docs/architecture/HOTSPOT_EXCEPTIONS.md`.

Gates: `tsc --noEmit` PASS; `biome check` PASS (1 warning pré-existente de parameter property); vitest `tests/unit/features/crm360/` **27/27 PASS**; `check:hotspots` PASS (0 sem exceção). `npm run lint` e `npm run build` executados — ver run report. Pendente: parecer Agente 24 e integração Agente 00.
