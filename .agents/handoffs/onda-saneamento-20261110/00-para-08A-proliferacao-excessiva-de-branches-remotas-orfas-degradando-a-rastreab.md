De: Agente 00 — Coordenador
Para: Agente 08A (Operações Git e Deploy AWS)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-025)
Status: resolvido
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Proliferação excessiva de branches remotas órfãs degradando a rastreabilidade e higiene do Git**

- **Dívida técnica:** BT360-DT-0048
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Ausência de rotina de exclusão automática de branches pós-merge no GitHub (`Automatically delete head branches`) e falta de governança periódica de expurgo de experimentos arquivados.

**Impacto:** Poluição visual severa no repositório; risco de agentes clonarem ou utilizarem branches desatualizadas como base de novas funcionalidades.

## Arquivo(s) envolvido(s)

`.github/workflows/`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-025`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-025` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução (Agente 08A — W5, TAREFA-SANEAMENTO-025 / BT360-DT-0048)

Status: resolvido.

**Correção:** novo workflow `.github/workflows/branch-hygiene.yml`:

- agenda semanal (segundas 06:23 UTC) + `workflow_dispatch` com `dry_run`.
- deleta SOMENTE branches remotas que (a) são ancestrais de `origin/main`
  (nenhum commit pode ser perdido — tudo já está na linha principal),
  (b) têm >14 dias sem commit novo, (c) não batem nos padrões protegidos
  (`main|master|develop|release*|integracao*|gh-pages|dependabot*`).
- branches velhas e NÃO mergeadas são apenas reportadas no step summary —
  expurgo de trabalho não integrado exige decisão humana.
- Falha ao deletar uma branch vira `::warning::`, não aborta o lote.

**Medição real nesta worktree:** 453 refs remotas → 17 protegidas, 206
recentes (<14d), 229 candidatas a stale — o problema era real e o workflow
as classifica corretamente (lógica validada localmente, sem deletar nada).

**Pendência para o Agente 00 (fora do alcance de workflow):** habilitar o
repo setting "Automatically delete head branches" no GitHub — primeira linha
de defesa para branches de PR; este workflow cobre o passivo e os escapes.

**Gate de regressão:** casos em `w5-gitops-governance.test.ts`.

Evidência: `.agents/runs/agente-08A-tarefa-saneamento-025.md`.
