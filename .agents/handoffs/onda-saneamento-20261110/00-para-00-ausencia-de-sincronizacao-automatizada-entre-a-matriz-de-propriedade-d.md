De: Agente 00 — Coordenador
Para: Agente 00 (Coordenador e Orquestrador Geral)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-011)
Status: em-andamento
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Ausência de sincronização automatizada entre a matriz de propriedade de arquivos e o Dependency Cruiser**

- **Dívida técnica:** BT360-DT-0004
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** O dependency-cruiser foi configurado para checar fronteiras de pastas, mas não os slots dos 26 agentes documentados no `AGENTS.md`.

**Impacto:** Risco contínuo de acoplamento indevido e commits concorrentes sobre arquivos de donos exclusivos (ex.: `prisma/schema.prisma` modificado por integrações).

## Arquivo(s) envolvido(s)

`AGENTS.md`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-011`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-011` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

**Data:** 2026-11-14 · **Executor:** Agente 00 (worktree `C:\Github\Birthub-360-wt-00`, branch `agente/00-trilha-coordenacao`) · **Commit:** `6466c88d9`

### Desenho implementado

Novo gate `npm run verify:ownership-coverage` (`tsx scripts/governance/check-ownership-coverage.ts`) que sincroniza a matriz de propriedade do `AGENTS.md` §15 com a proteção real de cada escopo:

1. Faz parse do bloco de código de `## 15. Propriedade exclusiva de arquivos` e extrai os 20 pares escopo→dono (incluindo os descritores em prosa "navegação principal" e "Sidebar").
2. Exige entrada correspondente em `scripts/governance/ownership-coverage.manifest.json` com o MESMO dono — divergência nos dois sentidos (path novo no §15, entrada fantasma no manifesto, dono trocado) falha o gate. É a sincronização automatizada pedida pela dívida.
3. Valida a proteção declarada por entrada:
   - `coverage: "depcruise"` — só aceita paths dentro do grafo de `lint:architecture` (`src/`, `server.ts`, `worker.ts`) e exige que uma regra `forbidden` nomeada exista em `.dependency-cruiser.cjs` E que seu `to.path` case com um path sintético do escopo (sem ser excluído por `to.pathNot`). Hoje nenhum escopo do §15 usa esse modo — todos estão fora do grafo ou são prosa.
   - `coverage: "review"` — exige `justification` (mín. 20 chars) e valida `alternateCheck` contra `scripts` do `package.json` quando declarado (usado em `.agents/reviews/**` → `verify:governance-reviews`).
4. Verifica que escopos path-like existem no repositório (path exato ou base de glob), impedindo entradas fantasmas.

Erros de leitura/parse (AGENTS.md sem §15, JSON inválido, config depcruise ilegível) abortam com erro explícito — sem fallback silencioso (AGENTS.md §30/§32). Todas as violações são reportadas em lista única antes do exit 1.

### Arquivos alterados

- `scripts/governance/check-ownership-coverage.ts` — novo (gate + funções puras exportadas).
- `scripts/governance/ownership-coverage.manifest.json` — novo (20 entradas classificadas).
- `tests/unit/architecture/ownership-coverage.test.ts` — novo (25 testes).
- `package.json` — somente adição do script `verify:ownership-coverage`.

`package-lock.json` foi revertido (churn incidental de `npm install` local, sem relação com a mudança).

### Comandos executados e resultados

- `npm install` no worktree (node_modules ausente) — OK.
- `npx tsx scripts/governance/check-ownership-coverage.ts` — ✅ exit 0: "20 escopo(s) de propriedade do AGENTS.md §15 cobertos pelo manifesto, matriz e proteção declarada sincronizadas".
- `npx vitest run -c vitest.unit.config.ts tests/unit/architecture/ownership-coverage.test.ts` — ✅ 25/25 testes (sucesso e todos os caminhos de falha: escopo sem manifesto, entrada fantasma, dono divergente, depcruise fora do grafo, regra inexistente, regex que não casa, justificativa curta, alternateCheck inexistente, path fantasma; + teste de não-regressão com os arquivos reais do repo).
- `npx tsc --noEmit` — ✅ exit 0.
- `npm run lint` — ✅ exit 0 (1520 warnings pré-existentes em `src/`, nenhum arquivo meu entra no escopo do biome lint).
- `npm run lint:architecture` — não executado: `.dependency-cruiser.cjs` não foi alterado; o script novo apenas LÊ a config (coberto pelo teste de não-regressão).

### Pendência para encerramento

Falta o **parecer formal `APROVADO` do Agente 24** em `.agents/reviews/` com validação de hashes — por isso Status permanece `em-andamento`. Critérios técnicos de aceite da TAREFA-SANEAMENTO-011 estão comprovados acima.
