De: Agente 00 — Coordenador
Para: Agente 11 (Marca e Ativos Institucionais)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-049)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Ocorrências residuais de menções a marcas legadas em fixtures de testes e documentações internas**

- **Dívida técnica:** BT360-DT-0058
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** O script de busca anterior focou apenas nos diretórios `src/` e `prisma/`, poupando arquivos em pastas de relatórios arquivados.

**Impacto:** Ruído conceitual em documentações e possível vazamento de nomes legados em logs de testes.

## Arquivo(s) envolvido(s)

`tests/fixtures/`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-049`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-049` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução (Agente 11 — 2026-11-10)

Verificação executada em `tests/fixtures/`:

- Únicos fixtures existentes: `tests/fixtures/knowledge/sample.pdf` e
  `sample.docx` (binários).
- Extração de texto (pdf raw / `word/document.xml` via zipfile): contêm apenas
  a marca atual "Birth Hub 360" — **nenhuma ocorrência de marcas legadas**
  (AtlasGR, Total Trac, prospector-atlas etc.).
- `grep -rniE "atlas|total ?trac|atlasgr" tests/fixtures/` → 0 ocorrências.
- Nenhum arquivo precisou de alteração (fixtures já sanitizados).

**Pendência fora da propriedade do Agente 11:** `tests/**` pertence ao Agente
08 (`tests/AGENTS.md`). O critério de aceite "teste automatizado de regressão"
foi delegado via handoff
`11-para-08-guard-de-fixtures-contra-reintroducao-de-marcas-legadas-em-tests-fixtures.md`
(sugestão de guard em `tests/unit/brand/` no padrão de `brand-hygiene.test.ts`).
