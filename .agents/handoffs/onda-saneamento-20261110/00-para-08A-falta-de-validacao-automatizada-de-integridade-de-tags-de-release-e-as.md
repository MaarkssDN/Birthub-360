De: Agente 00 — Coordenador
Para: Agente 08A (Operações Git e Deploy AWS)
Onda: Onda 5 (Plano Mestre de Saneamento — TAREFA-SANEAMENTO-027)
Status: aberto
Prioridade: normal
Bloqueador-ref: RELEASE_BLOCKED — plano mestre de saneamento reconciliado (2026-11-10)
Sprint destino: Onda 5

## Problema

**Falta de validação automatizada de integridade de tags de release e assinatura de commits**

- **Dívida técnica:** BT360-DT-0050
- **Esforço estimado:** Médio
- **Status atual da dívida:** NÃO INICIADO

**Causa raiz:** Esteiras de CI desenhadas focando apenas em sucesso de testes automatizados, sem integração de gates criptográficos de governança.

**Impacto:** Risco de deployment não autorizado em ambientes de produção ou homologação.

## Arquivo(s) envolvido(s)

`.github/workflows/docker-publish.yml`

## Evidência

- Backlog canônico: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_BACKLOG_EXECUCAO.md` — seção `TAREFA-SANEAMENTO-027`.
- Relatório de reconciliação: `docs/auditorias/plano-mestre-consolidado/BIRTHUB360_RELATORIO_RECONCILIACAO_FINAL.md`.
- Revisão vigente: `.agents/reviews/24-revisao-plano-mestre-saneamento-reconciliado-20261110.md` (RELEASE_BLOCKED até saneamento das Ondas 0–5).

## Alteração necessária

Executar a tarefa `TAREFA-SANEAMENTO-027` estritamente dentro da propriedade de arquivos do `AGENTS.md` §15:

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

## Resolução (Agente 08A — W5, TAREFA-SANEAMENTO-027 / BT360-DT-0050)

Status: resolvido (com risco residual registrado).

**Correção em `.github/workflows/docker-publish.yml`:**

- Novo input opcional `tag` no `workflow_dispatch`.
- Novo job `validate-release` (publish agora depende de `resolve-sha` +
  `validate-release`):
  1. exige que o SHA seja ancestral de `origin/main` — fim de publicação de
     commits fora da linha principal;
  2. quando `tag` informada: formato semver obrigatório, tag deve existir,
     deve ser **anotada** (`git cat-file -t` == `tag`) e `git rev-list -n1`
     deve apontar exatamente para o SHA publicado.

**Risco residual honesto:** assinatura GPG de commits NÃO é verificada — o
repositório não adota assinatura criptográfica (nenhum commit assinado na
linha principal); exigir `git verify-commit` reprovaria todo deploy. Se o
Agente 00/humano quiser essa camada, é decisão de governança separada
(exige política de chaves + proteção de branch), registrada no run report.

**Gate de regressão:** casos em `w5-gitops-governance.test.ts` cobrem input,
ancestralidade, semver/tag anotada/vínculo SHA e o `needs` do publish.

Evidência: `.agents/runs/agente-08A-tarefa-saneamento-027.md`.
